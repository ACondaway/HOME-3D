import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";

const SAVE_ENDPOINT = "/__content-studio/save";
const UPLOAD_ENDPOINT = "/__content-studio/upload";
const MAX_SAVE_BODY_BYTES = 24 * 1024 * 1024;
const MAX_IMAGE_UPLOAD_BODY_BYTES = 10 * 1024 * 1024;
const MAX_MODEL_UPLOAD_BODY_BYTES = 24 * 1024 * 1024;
const MAX_GLB_JSON_BYTES = 1024 * 1024;
const MAX_GLTF_NODES = 512;
const MAX_GLTF_NODE_EDGES = 2048;
const MAX_GLTF_MESHES = 256;
const MAX_GLTF_MESH_INSTANCES = 256;
const MAX_GLTF_PRIMITIVES = 512;
const MAX_GLTF_ACCESSORS = 1024;
const MAX_GLTF_BUFFER_VIEWS = 2048;
const MAX_GLTF_VIRTUAL_ACCESSOR_BYTES = 128 * 1024 * 1024;
const MAX_GLTF_TRIANGLES = 1_000_000;
const MAX_GLTF_EMBEDDED_IMAGES = 16;
const MAX_GLTF_TEXTURE_DIMENSION = 8192;
const MAX_GLTF_TEXTURE_PIXELS = 32 * 1024 * 1024;
const MAX_GLTF_TOTAL_TEXTURE_PIXELS = 64 * 1024 * 1024;
const CONTENT_CARD_IMAGE_PATH_PATTERN =
  /^\/uploads\/cards\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i;
const GLB_JSON_CHUNK_TYPE = 0x4e4f534a;
const GLB_BIN_CHUNK_TYPE = 0x004e4942;

const unsupportedGlbExtensions = new Set([
  "KHR_draco_mesh_compression",
  "EXT_meshopt_compression",
  "KHR_meshopt_compression",
  "KHR_texture_basisu",
  "EXT_texture_avif",
]);

type JsonRecord = Record<string, unknown>;
type UploadKind = "profile" | "photography" | "cards" | "models";

type ImageFormat = {
  extension: "jpg" | "png" | "webp" | "avif";
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/avif";
};

class RequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "RequestError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIpv4Loopback(hostname: string): boolean {
  const octets = hostname.split(".");
  if (octets.length !== 4 || octets.some((part) => !/^\d{1,3}$/.test(part))) {
    return false;
  }

  const numbers = octets.map(Number);
  return numbers.every((part) => part >= 0 && part <= 255) && numbers[0] === 127;
}

function isLoopbackHostname(rawHostname: string): boolean {
  const hostname = rawHostname
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.$/, "");

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "::1"
  ) {
    return true;
  }

  if (isIpv4Loopback(hostname)) {
    return true;
  }

  const ipv4MappedPrefix = "::ffff:";
  return (
    hostname.startsWith(ipv4MappedPrefix) &&
    isIpv4Loopback(hostname.slice(ipv4MappedPrefix.length))
  );
}

function hasLoopbackHost(hostHeader: string | undefined): boolean {
  if (!hostHeader || hostHeader.includes(",")) {
    return false;
  }

  try {
    const url = new URL(`http://${hostHeader.trim()}`);
    return (
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      isLoopbackHostname(url.hostname)
    );
  } catch {
    return false;
  }
}

function hasLoopbackOrigin(originHeader: string | undefined): boolean {
  if (!originHeader || originHeader.includes(",")) {
    return false;
  }

  try {
    const url = new URL(originHeader.trim());
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      isLoopbackHostname(url.hostname)
    );
  } catch {
    return false;
  }
}

function sendJson(
  response: ServerResponse,
  status: number,
  payload: JsonRecord,
  extraHeaders: Record<string, string> = {},
): void {
  const body = `${JSON.stringify(payload)}\n`;

  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body).toString(),
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  response.end(body);
}

function parseContentLength(request: IncomingMessage): number | undefined {
  const value = request.headers["content-length"];
  if (value === undefined) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new RequestError(
      400,
      "INVALID_CONTENT_LENGTH",
      "Content-Length must be a non-negative integer.",
    );
  }

  const length = Number(value);
  if (!Number.isSafeInteger(length)) {
    throw new RequestError(
      400,
      "INVALID_CONTENT_LENGTH",
      "Content-Length is invalid.",
    );
  }

  return length;
}

async function readBody(
  request: IncomingMessage,
  maxBodyBytes: number,
): Promise<Buffer> {
  const contentLength = parseContentLength(request);
  if (contentLength !== undefined && contentLength > maxBodyBytes) {
    throw new RequestError(
      413,
      "PAYLOAD_TOO_LARGE",
      `The request body must not exceed ${maxBodyBytes} bytes.`,
    );
  }

  const chunks: Buffer[] = [];
  let size = 0;
  let exceededLimit = false;

  for await (const rawChunk of request) {
    const chunk = Buffer.isBuffer(rawChunk)
      ? rawChunk
      : Buffer.from(rawChunk as Uint8Array);

    size += chunk.byteLength;
    if (size > maxBodyBytes) {
      exceededLimit = true;
      chunks.length = 0;
      continue;
    }

    if (!exceededLimit) {
      chunks.push(chunk);
    }
  }

  if (exceededLimit) {
    throw new RequestError(
      413,
      "PAYLOAD_TOO_LARGE",
      `The request body must not exceed ${maxBodyBytes} bytes.`,
    );
  }

  return Buffer.concat(chunks, size);
}

export function parseUploadKind(value: string | null): UploadKind {
  if (
    value === "profile" ||
    value === "photography" ||
    value === "cards" ||
    value === "models"
  ) {
    return value;
  }

  throw new RequestError(
    400,
    "INVALID_UPLOAD_KIND",
    'The "kind" query parameter must be "profile", "photography", "cards", or "models".',
  );
}

function hasAsciiAt(body: Buffer, offset: number, expected: string): boolean {
  return (
    body.byteLength >= offset + expected.length &&
    body.toString("ascii", offset, offset + expected.length) === expected
  );
}

function isAvif(body: Buffer): boolean {
  if (body.byteLength < 16 || !hasAsciiAt(body, 4, "ftyp")) {
    return false;
  }

  const declaredBoxSize = body.readUInt32BE(0);
  const boxEnd =
    declaredBoxSize === 0
      ? body.byteLength
      : Math.min(declaredBoxSize, body.byteLength);

  if (
    declaredBoxSize === 1 ||
    boxEnd < 16 ||
    declaredBoxSize > body.byteLength
  ) {
    return false;
  }

  if (hasAsciiAt(body, 8, "avif") || hasAsciiAt(body, 8, "avis")) {
    return true;
  }

  for (let offset = 16; offset + 4 <= boxEnd; offset += 4) {
    if (hasAsciiAt(body, offset, "avif") || hasAsciiAt(body, offset, "avis")) {
      return true;
    }
  }

  return false;
}

function detectImageFormat(body: Buffer): ImageFormat | undefined {
  if (
    body.byteLength >= 3 &&
    body[0] === 0xff &&
    body[1] === 0xd8 &&
    body[2] === 0xff
  ) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }

  if (
    body.byteLength >= 8 &&
    body[0] === 0x89 &&
    hasAsciiAt(body, 1, "PNG") &&
    body[4] === 0x0d &&
    body[5] === 0x0a &&
    body[6] === 0x1a &&
    body[7] === 0x0a
  ) {
    return { extension: "png", mimeType: "image/png" };
  }

  if (hasAsciiAt(body, 0, "RIFF") && hasAsciiAt(body, 8, "WEBP")) {
    return { extension: "webp", mimeType: "image/webp" };
  }

  if (isAvif(body)) {
    return { extension: "avif", mimeType: "image/avif" };
  }

  return undefined;
}

type GlbContainer = {
  document: JsonRecord;
  binaryChunk: Buffer;
};

type GlbBufferView = {
  offset: number;
  length: number;
  byteStride?: number;
};

type GlbAccessor = {
  count: number;
  componentType: number;
  type: string;
  packedElementBytes: number;
};

function invalidGlbStructure(message: string): never {
  throw new RequestError(422, "INVALID_GLB_STRUCTURE", message);
}

function invalidGlbBufferRange(message: string): never {
  throw new RequestError(422, "INVALID_GLB_BUFFER_RANGE", message);
}

function glbResourceLimit(message: string): never {
  throw new RequestError(413, "GLB_RESOURCE_LIMIT", message);
}

function optionalArray(
  document: JsonRecord,
  key: string,
  label = key,
): unknown[] {
  const value = document[key];
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    invalidGlbStructure(`glTF ${label} must be an array.`);
  }
  return value;
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    invalidGlbStructure(`${label} must be a non-negative integer.`);
  }
  return value as number;
}

function positiveInteger(value: unknown, label: string): number {
  const result = nonNegativeInteger(value, label);
  if (result === 0) {
    invalidGlbStructure(`${label} must be greater than zero.`);
  }
  return result;
}

function arrayIndex(value: unknown, length: number, label: string): number {
  const result = nonNegativeInteger(value, label);
  if (result >= length) {
    invalidGlbStructure(`${label} is outside the referenced array.`);
  }
  return result;
}

function parseGlbContainer(body: Buffer): GlbContainer {
  if (
    body.byteLength < 20 ||
    !hasAsciiAt(body, 0, "glTF") ||
    body.readUInt32LE(4) !== 2 ||
    body.readUInt32LE(8) !== body.byteLength
  ) {
    throw new RequestError(
      415,
      "INVALID_GLB",
      "The request body must contain one complete glTF 2.0 binary file.",
    );
  }

  let offset = 12;
  let chunkIndex = 0;
  let jsonChunk: Buffer | undefined;
  let binaryChunk: Buffer | undefined;

  while (offset < body.byteLength) {
    if (offset + 8 > body.byteLength) {
      throw new RequestError(
        415,
        "INVALID_GLB",
        "The GLB contains an incomplete chunk header.",
      );
    }

    const chunkLength = body.readUInt32LE(offset);
    const chunkType = body.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    if (chunkLength % 4 !== 0 || chunkEnd > body.byteLength) {
      throw new RequestError(
        415,
        "INVALID_GLB",
        "Every GLB chunk must be four-byte aligned and fully contained.",
      );
    }

    if (chunkIndex === 0) {
      if (chunkType !== GLB_JSON_CHUNK_TYPE || chunkLength === 0) {
        throw new RequestError(
          415,
          "INVALID_GLB",
          "The GLB must begin with a non-empty JSON chunk.",
        );
      }
      if (chunkLength > MAX_GLB_JSON_BYTES) {
        throw new RequestError(
          413,
          "GLB_JSON_TOO_LARGE",
          `The GLB JSON chunk cannot exceed ${MAX_GLB_JSON_BYTES} bytes.`,
        );
      }
      jsonChunk = body.subarray(chunkStart, chunkEnd);
    } else if (chunkType === GLB_BIN_CHUNK_TYPE && binaryChunk === undefined) {
      binaryChunk = body.subarray(chunkStart, chunkEnd);
    } else {
      throw new RequestError(
        422,
        "INVALID_GLB_STRUCTURE",
        "The GLB may contain only one JSON chunk followed by at most one BIN chunk.",
      );
    }

    offset = chunkEnd;
    chunkIndex += 1;
  }

  if (!jsonChunk || offset !== body.byteLength) {
    throw new RequestError(
      415,
      "INVALID_GLB",
      "The GLB chunk table is incomplete.",
    );
  }

  let document: unknown;
  try {
    const json = new TextDecoder("utf-8", { fatal: true }).decode(jsonChunk);
    document = JSON.parse(json);
  } catch {
    throw new RequestError(
      415,
      "INVALID_GLB",
      "The first GLB chunk must contain valid UTF-8 JSON.",
    );
  }

  if (
    !isRecord(document) ||
    !isRecord(document.asset) ||
    document.asset.version !== "2.0"
  ) {
    throw new RequestError(
      415,
      "INVALID_GLB_VERSION",
      'The glTF JSON asset.version must be exactly "2.0".',
    );
  }

  return {
    document,
    binaryChunk: binaryChunk ?? Buffer.alloc(0),
  };
}

function validateUnsupportedGlbExtensions(document: JsonRecord): void {
  for (const key of ["extensionsUsed", "extensionsRequired"]) {
    const extensions = optionalArray(document, key);
    for (const extension of extensions) {
      if (typeof extension !== "string") {
        invalidGlbStructure(`glTF ${key} entries must be strings.`);
      }
      if (unsupportedGlbExtensions.has(extension)) {
        throw new RequestError(
          415,
          "UNSUPPORTED_GLB_EXTENSION",
          `The current viewer cannot decode the ${extension} extension.`,
        );
      }
    }
  }

  const pending: unknown[] = [document];
  while (pending.length > 0) {
    const value = pending.pop();
    if (Array.isArray(value)) {
      for (const item of value) {
        pending.push(item);
      }
      continue;
    }
    if (!isRecord(value)) {
      continue;
    }

    const extensions = value.extensions;
    if (isRecord(extensions)) {
      const unsupported = Object.keys(extensions).find((extension) =>
        unsupportedGlbExtensions.has(extension),
      );
      if (unsupported) {
        throw new RequestError(
          415,
          "UNSUPPORTED_GLB_EXTENSION",
          `The current viewer cannot decode the ${unsupported} extension.`,
        );
      }
    }
    for (const item of Object.values(value)) {
      pending.push(item);
    }
  }
}

function validateGlbBuffers(
  document: JsonRecord,
  binaryChunk: Buffer,
): { bufferByteLength: number; views: GlbBufferView[] } {
  const buffers = optionalArray(document, "buffers");
  if (buffers.length > 1) {
    invalidGlbStructure("A self-contained GLB may define at most one buffer.");
  }

  let bufferByteLength = 0;
  if (buffers.length === 1) {
    const buffer = buffers[0];
    if (!isRecord(buffer)) {
      invalidGlbStructure("glTF buffers[0] must be an object.");
    }
    if (Object.prototype.hasOwnProperty.call(buffer, "uri")) {
      throw new RequestError(
        415,
        "EXTERNAL_GLB_RESOURCE",
        "A GLB must store its buffer in the BIN chunk; buffer URIs, including data URIs, are not accepted.",
      );
    }

    bufferByteLength = nonNegativeInteger(
      buffer.byteLength,
      "glTF buffers[0].byteLength",
    );
    if (
      binaryChunk.byteLength < bufferByteLength ||
      binaryChunk.byteLength > bufferByteLength + 3
    ) {
      invalidGlbBufferRange(
        "The BIN chunk length does not match buffers[0].byteLength (apart from GLB padding).",
      );
    }
  } else if (binaryChunk.byteLength > 0) {
    invalidGlbStructure("A BIN chunk requires one glTF buffer definition.");
  }

  const rawViews = optionalArray(document, "bufferViews");
  if (rawViews.length > MAX_GLTF_BUFFER_VIEWS) {
    glbResourceLimit(
      `The GLB exceeds the ${MAX_GLTF_BUFFER_VIEWS} buffer-view limit.`,
    );
  }

  const views = rawViews.map((rawView, index): GlbBufferView => {
    if (!isRecord(rawView)) {
      invalidGlbStructure(`glTF bufferViews[${index}] must be an object.`);
    }

    if (
      arrayIndex(
        rawView.buffer,
        buffers.length,
        `glTF bufferViews[${index}].buffer`,
      ) !== 0
    ) {
      invalidGlbStructure(
        `glTF bufferViews[${index}] must reference the GLB BIN buffer.`,
      );
    }

    const viewOffset =
      rawView.byteOffset === undefined
        ? 0
        : nonNegativeInteger(
            rawView.byteOffset,
            `glTF bufferViews[${index}].byteOffset`,
          );
    const viewLength = positiveInteger(
      rawView.byteLength,
      `glTF bufferViews[${index}].byteLength`,
    );
    if (viewOffset > bufferByteLength - viewLength) {
      invalidGlbBufferRange(
        `glTF bufferViews[${index}] extends beyond buffers[0].byteLength.`,
      );
    }

    let byteStride: number | undefined;
    if (rawView.byteStride !== undefined) {
      byteStride = positiveInteger(
        rawView.byteStride,
        `glTF bufferViews[${index}].byteStride`,
      );
      if (byteStride < 4 || byteStride > 252 || byteStride % 4 !== 0) {
        invalidGlbStructure(
          `glTF bufferViews[${index}].byteStride must be a multiple of four between 4 and 252.`,
        );
      }
    }

    return {
      offset: viewOffset,
      length: viewLength,
      ...(byteStride === undefined ? {} : { byteStride }),
    };
  });

  return { bufferByteLength, views };
}

function accessorLayout(type: unknown, componentBytes: number): {
  type: string;
  componentCount: number;
  packedElementBytes: number;
} {
  const vectorComponents: Record<string, number> = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
  };

  if (typeof type !== "string") {
    invalidGlbStructure("Every glTF accessor must define a valid type.");
  }

  if (vectorComponents[type] !== undefined) {
    const componentCount = vectorComponents[type];
    return {
      type,
      componentCount,
      packedElementBytes: componentCount * componentBytes,
    };
  }

  const matrixDimensions: Record<string, number> = {
    MAT2: 2,
    MAT3: 3,
    MAT4: 4,
  };
  const dimension = matrixDimensions[type];
  if (dimension === undefined) {
    invalidGlbStructure(`Unsupported glTF accessor type "${type}".`);
  }

  const paddedColumnBytes = Math.ceil((dimension * componentBytes) / 4) * 4;
  return {
    type,
    componentCount: dimension * dimension,
    packedElementBytes: dimension * paddedColumnBytes,
  };
}

function validateTightlyPackedRange(
  view: GlbBufferView,
  byteOffset: number,
  elementBytes: number,
  count: number,
  label: string,
  useViewStride: boolean,
): void {
  const stride = useViewStride ? (view.byteStride ?? elementBytes) : elementBytes;
  if (stride < elementBytes) {
    invalidGlbStructure(`${label} uses a byteStride smaller than one element.`);
  }
  if (count > Math.floor((Number.MAX_SAFE_INTEGER - byteOffset) / stride)) {
    invalidGlbBufferRange(`${label} byte range overflows.`);
  }

  const requiredEnd =
    count === 0 ? byteOffset : byteOffset + stride * (count - 1) + elementBytes;
  if (requiredEnd > view.length) {
    invalidGlbBufferRange(`${label} extends beyond its bufferView.`);
  }
}

function validateGlbAccessors(
  document: JsonRecord,
  views: GlbBufferView[],
): GlbAccessor[] {
  const rawAccessors = optionalArray(document, "accessors");
  if (rawAccessors.length > MAX_GLTF_ACCESSORS) {
    glbResourceLimit(
      `The GLB exceeds the ${MAX_GLTF_ACCESSORS} accessor limit.`,
    );
  }

  const componentBytesByType: Record<number, number> = {
    5120: 1,
    5121: 1,
    5122: 2,
    5123: 2,
    5125: 4,
    5126: 4,
  };
  let totalVirtualBytes = 0;

  return rawAccessors.map((rawAccessor, index): GlbAccessor => {
    if (!isRecord(rawAccessor)) {
      invalidGlbStructure(`glTF accessors[${index}] must be an object.`);
    }

    const componentType = nonNegativeInteger(
      rawAccessor.componentType,
      `glTF accessors[${index}].componentType`,
    );
    const componentBytes = componentBytesByType[componentType];
    if (componentBytes === undefined) {
      invalidGlbStructure(
        `glTF accessors[${index}] uses an unsupported componentType.`,
      );
    }

    const layout = accessorLayout(rawAccessor.type, componentBytes);
    const count = positiveInteger(
      rawAccessor.count,
      `glTF accessors[${index}].count`,
    );
    const rawElementBytes = layout.componentCount * componentBytes;
    if (
      count > Math.floor(MAX_GLTF_VIRTUAL_ACCESSOR_BYTES / rawElementBytes)
    ) {
      glbResourceLimit(
        `glTF accessors[${index}] exceeds the virtual accessor memory limit.`,
      );
    }
    totalVirtualBytes += count * rawElementBytes;
    if (totalVirtualBytes > MAX_GLTF_VIRTUAL_ACCESSOR_BYTES) {
      glbResourceLimit(
        `The GLB exceeds the ${MAX_GLTF_VIRTUAL_ACCESSOR_BYTES}-byte virtual accessor budget.`,
      );
    }

    const accessorByteOffset =
      rawAccessor.byteOffset === undefined
        ? 0
        : nonNegativeInteger(
            rawAccessor.byteOffset,
            `glTF accessors[${index}].byteOffset`,
          );
    if (accessorByteOffset % componentBytes !== 0) {
      invalidGlbStructure(
        `glTF accessors[${index}].byteOffset is not component-aligned.`,
      );
    }

    if (rawAccessor.bufferView !== undefined) {
      const viewIndex = arrayIndex(
        rawAccessor.bufferView,
        views.length,
        `glTF accessors[${index}].bufferView`,
      );
      const view = views[viewIndex];
      if ((view.offset + accessorByteOffset) % componentBytes !== 0) {
        invalidGlbStructure(
          `glTF accessors[${index}] is not aligned in the BIN chunk.`,
        );
      }
      validateTightlyPackedRange(
        view,
        accessorByteOffset,
        layout.packedElementBytes,
        count,
        `glTF accessors[${index}]`,
        true,
      );
    }

    if (rawAccessor.sparse !== undefined) {
      if (!isRecord(rawAccessor.sparse)) {
        invalidGlbStructure(
          `glTF accessors[${index}].sparse must be an object.`,
        );
      }
      const sparseCount = positiveInteger(
        rawAccessor.sparse.count,
        `glTF accessors[${index}].sparse.count`,
      );
      if (sparseCount > count) {
        invalidGlbStructure(
          `glTF accessors[${index}].sparse.count cannot exceed accessor.count.`,
        );
      }

      const sparseIndices = rawAccessor.sparse.indices;
      const sparseValues = rawAccessor.sparse.values;
      if (!isRecord(sparseIndices) || !isRecord(sparseValues)) {
        invalidGlbStructure(
          `glTF accessors[${index}].sparse must define indices and values.`,
        );
      }

      const sparseIndexComponentType = nonNegativeInteger(
        sparseIndices.componentType,
        `glTF accessors[${index}].sparse.indices.componentType`,
      );
      if (
        sparseIndexComponentType !== 5121 &&
        sparseIndexComponentType !== 5123 &&
        sparseIndexComponentType !== 5125
      ) {
        invalidGlbStructure(
          `glTF accessors[${index}] uses an invalid sparse index componentType.`,
        );
      }
      const sparseIndexBytes =
        componentBytesByType[sparseIndexComponentType];
      const sparseIndexView = views[
        arrayIndex(
          sparseIndices.bufferView,
          views.length,
          `glTF accessors[${index}].sparse.indices.bufferView`,
        )
      ];
      if (sparseIndexView.byteStride !== undefined) {
        invalidGlbStructure(
          `glTF accessors[${index}] sparse index bufferView cannot define byteStride.`,
        );
      }
      const sparseIndexOffset =
        sparseIndices.byteOffset === undefined
          ? 0
          : nonNegativeInteger(
              sparseIndices.byteOffset,
              `glTF accessors[${index}].sparse.indices.byteOffset`,
            );
      validateTightlyPackedRange(
        sparseIndexView,
        sparseIndexOffset,
        sparseIndexBytes,
        sparseCount,
        `glTF accessors[${index}].sparse.indices`,
        false,
      );

      const sparseValueView = views[
        arrayIndex(
          sparseValues.bufferView,
          views.length,
          `glTF accessors[${index}].sparse.values.bufferView`,
        )
      ];
      if (sparseValueView.byteStride !== undefined) {
        invalidGlbStructure(
          `glTF accessors[${index}] sparse value bufferView cannot define byteStride.`,
        );
      }
      const sparseValueOffset =
        sparseValues.byteOffset === undefined
          ? 0
          : nonNegativeInteger(
              sparseValues.byteOffset,
              `glTF accessors[${index}].sparse.values.byteOffset`,
            );
      validateTightlyPackedRange(
        sparseValueView,
        sparseValueOffset,
        layout.packedElementBytes,
        sparseCount,
        `glTF accessors[${index}].sparse.values`,
        false,
      );
    }

    return {
      count,
      componentType,
      type: layout.type,
      packedElementBytes: layout.packedElementBytes,
    };
  });
}

function accessorReference(
  value: unknown,
  accessors: GlbAccessor[],
  label: string,
): number {
  return arrayIndex(value, accessors.length, label);
}

function validateGlbMeshes(
  document: JsonRecord,
  accessors: GlbAccessor[],
): number[] {
  const rawMeshes = optionalArray(document, "meshes");
  if (rawMeshes.length > MAX_GLTF_MESHES) {
    glbResourceLimit(`The GLB exceeds the ${MAX_GLTF_MESHES} mesh limit.`);
  }

  let totalPrimitives = 0;
  return rawMeshes.map((rawMesh, meshIndex) => {
    if (!isRecord(rawMesh)) {
      invalidGlbStructure(`glTF meshes[${meshIndex}] must be an object.`);
    }
    if (!Array.isArray(rawMesh.primitives) || rawMesh.primitives.length === 0) {
      invalidGlbStructure(
        `glTF meshes[${meshIndex}].primitives must be a non-empty array.`,
      );
    }

    totalPrimitives += rawMesh.primitives.length;
    if (totalPrimitives > MAX_GLTF_PRIMITIVES) {
      glbResourceLimit(
        `The GLB exceeds the ${MAX_GLTF_PRIMITIVES} primitive limit.`,
      );
    }

    let meshTriangles = 0;
    rawMesh.primitives.forEach((rawPrimitive, primitiveIndex) => {
      if (!isRecord(rawPrimitive) || !isRecord(rawPrimitive.attributes)) {
        invalidGlbStructure(
          `glTF meshes[${meshIndex}].primitives[${primitiveIndex}] must define attributes.`,
        );
      }

      for (const [semantic, accessorValue] of Object.entries(
        rawPrimitive.attributes,
      )) {
        accessorReference(
          accessorValue,
          accessors,
          `glTF meshes[${meshIndex}].primitives[${primitiveIndex}].attributes.${semantic}`,
        );
      }

      let elementCount = 0;
      if (rawPrimitive.indices !== undefined) {
        const accessor = accessors[
          accessorReference(
            rawPrimitive.indices,
            accessors,
            `glTF meshes[${meshIndex}].primitives[${primitiveIndex}].indices`,
          )
        ];
        if (
          accessor.type !== "SCALAR" ||
          (accessor.componentType !== 5121 &&
            accessor.componentType !== 5123 &&
            accessor.componentType !== 5125)
        ) {
          invalidGlbStructure(
            `glTF meshes[${meshIndex}].primitives[${primitiveIndex}] indices must use an unsigned scalar accessor.`,
          );
        }
        elementCount = accessor.count;
      } else if (rawPrimitive.attributes.POSITION !== undefined) {
        elementCount =
          accessors[
            accessorReference(
              rawPrimitive.attributes.POSITION,
              accessors,
              `glTF meshes[${meshIndex}].primitives[${primitiveIndex}].attributes.POSITION`,
            )
          ].count;
      }

      const mode =
        rawPrimitive.mode === undefined
          ? 4
          : nonNegativeInteger(
              rawPrimitive.mode,
              `glTF meshes[${meshIndex}].primitives[${primitiveIndex}].mode`,
            );
      if (mode > 6) {
        invalidGlbStructure(
          `glTF meshes[${meshIndex}].primitives[${primitiveIndex}] uses an invalid mode.`,
        );
      }
      if (mode === 4) {
        meshTriangles += Math.floor(elementCount / 3);
      } else if (mode === 5 || mode === 6) {
        meshTriangles += Math.max(0, elementCount - 2);
      }

      if (rawPrimitive.targets !== undefined) {
        if (!Array.isArray(rawPrimitive.targets)) {
          invalidGlbStructure(
            `glTF meshes[${meshIndex}].primitives[${primitiveIndex}].targets must be an array.`,
          );
        }
        rawPrimitive.targets.forEach((target, targetIndex) => {
          if (!isRecord(target)) {
            invalidGlbStructure(
              `glTF morph target ${targetIndex} must be an object.`,
            );
          }
          for (const [semantic, accessorValue] of Object.entries(target)) {
            accessorReference(
              accessorValue,
              accessors,
              `glTF morph target ${targetIndex}.${semantic}`,
            );
          }
        });
      }
    });

    return meshTriangles;
  });
}

function validateGlbNodes(
  document: JsonRecord,
  meshTriangles: number[],
  accessors: GlbAccessor[],
): void {
  const rawNodes = optionalArray(document, "nodes");
  if (rawNodes.length > MAX_GLTF_NODES) {
    glbResourceLimit(`The GLB exceeds the ${MAX_GLTF_NODES} node limit.`);
  }

  const children: number[][] = [];
  const meshInstanceCounts = new Array(meshTriangles.length).fill(0) as number[];
  let edgeCount = 0;
  let totalMeshInstances = 0;

  rawNodes.forEach((rawNode, nodeIndex) => {
    if (!isRecord(rawNode)) {
      invalidGlbStructure(`glTF nodes[${nodeIndex}] must be an object.`);
    }

    const childValues =
      rawNode.children === undefined
        ? []
        : Array.isArray(rawNode.children)
          ? rawNode.children
          : invalidGlbStructure(
              `glTF nodes[${nodeIndex}].children must be an array.`,
            );
    const nodeChildren = childValues.map((child, childIndex) =>
      arrayIndex(
        child,
        rawNodes.length,
        `glTF nodes[${nodeIndex}].children[${childIndex}]`,
      ),
    );
    edgeCount += nodeChildren.length;
    if (edgeCount > MAX_GLTF_NODE_EDGES) {
      glbResourceLimit(
        `The GLB exceeds the ${MAX_GLTF_NODE_EDGES} node-edge limit.`,
      );
    }
    children.push(nodeChildren);

    if (rawNode.mesh === undefined) {
      return;
    }
    const meshIndex = arrayIndex(
      rawNode.mesh,
      meshTriangles.length,
      `glTF nodes[${nodeIndex}].mesh`,
    );

    let nodeInstances = 1;
    const extensions = rawNode.extensions;
    const gpuInstancing =
      isRecord(extensions) && isRecord(extensions.EXT_mesh_gpu_instancing)
        ? extensions.EXT_mesh_gpu_instancing
        : undefined;
    if (gpuInstancing !== undefined) {
      if (!isRecord(gpuInstancing.attributes)) {
        invalidGlbStructure(
          `glTF nodes[${nodeIndex}] GPU instancing must define attributes.`,
        );
      }
      const instanceAccessors = Object.entries(gpuInstancing.attributes).map(
        ([semantic, accessorValue]) =>
          accessors[
            accessorReference(
              accessorValue,
              accessors,
              `glTF nodes[${nodeIndex}] GPU instance attribute ${semantic}`,
            )
          ],
      );
      if (instanceAccessors.length === 0) {
        invalidGlbStructure(
          `glTF nodes[${nodeIndex}] GPU instancing attributes cannot be empty.`,
        );
      }
      nodeInstances = instanceAccessors[0].count;
      if (
        instanceAccessors.some((accessor) => accessor.count !== nodeInstances)
      ) {
        invalidGlbStructure(
          `glTF nodes[${nodeIndex}] GPU instance attributes must have matching counts.`,
        );
      }
    }

    totalMeshInstances += nodeInstances;
    meshInstanceCounts[meshIndex] += nodeInstances;
    if (totalMeshInstances > MAX_GLTF_MESH_INSTANCES) {
      glbResourceLimit(
        `The GLB exceeds the ${MAX_GLTF_MESH_INSTANCES} mesh-instance limit.`,
      );
    }
  });

  const visitState = new Uint8Array(rawNodes.length);
  const visit = (nodeIndex: number): void => {
    if (visitState[nodeIndex] === 1) {
      throw new RequestError(
        422,
        "GLB_NODE_CYCLE",
        "The glTF node hierarchy must not contain a cycle.",
      );
    }
    if (visitState[nodeIndex] === 2) {
      return;
    }
    visitState[nodeIndex] = 1;
    for (const child of children[nodeIndex]) {
      visit(child);
    }
    visitState[nodeIndex] = 2;
  };
  rawNodes.forEach((_, index) => visit(index));

  const scenes = optionalArray(document, "scenes");
  scenes.forEach((rawScene, sceneIndex) => {
    if (!isRecord(rawScene)) {
      invalidGlbStructure(`glTF scenes[${sceneIndex}] must be an object.`);
    }
    if (rawScene.nodes === undefined) {
      return;
    }
    if (!Array.isArray(rawScene.nodes)) {
      invalidGlbStructure(`glTF scenes[${sceneIndex}].nodes must be an array.`);
    }
    rawScene.nodes.forEach((node, rootIndex) =>
      arrayIndex(
        node,
        rawNodes.length,
        `glTF scenes[${sceneIndex}].nodes[${rootIndex}]`,
      ),
    );
  });
  if (document.scene !== undefined) {
    arrayIndex(document.scene, scenes.length, "glTF scene");
  }

  let totalTriangles = 0;
  meshTriangles.forEach((triangleCount, meshIndex) => {
    totalTriangles += triangleCount * Math.max(meshInstanceCounts[meshIndex], 1);
    if (totalTriangles > MAX_GLTF_TRIANGLES) {
      glbResourceLimit(
        `The GLB exceeds the ${MAX_GLTF_TRIANGLES.toLocaleString("en-US")} rendered-triangle budget.`,
      );
    }
  });
}

function pngDimensions(data: Buffer): { width: number; height: number } | undefined {
  if (
    data.byteLength < 24 ||
    data[0] !== 0x89 ||
    !hasAsciiAt(data, 1, "PNG") ||
    data[4] !== 0x0d ||
    data[5] !== 0x0a ||
    data[6] !== 0x1a ||
    data[7] !== 0x0a ||
    data.readUInt32BE(8) !== 13 ||
    !hasAsciiAt(data, 12, "IHDR")
  ) {
    return undefined;
  }
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

function jpegDimensions(data: Buffer): { width: number; height: number } | undefined {
  if (
    data.byteLength < 4 ||
    data[0] !== 0xff ||
    data[1] !== 0xd8 ||
    data[2] !== 0xff
  ) {
    return undefined;
  }

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  let offset = 2;
  while (offset < data.byteLength) {
    while (offset < data.byteLength && data[offset] === 0xff) {
      offset += 1;
    }
    if (offset >= data.byteLength) {
      return undefined;
    }

    const marker = data[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) {
      return undefined;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      continue;
    }
    if (offset + 2 > data.byteLength) {
      return undefined;
    }

    const segmentLength = data.readUInt16BE(offset);
    const segmentEnd = offset + segmentLength;
    if (segmentLength < 2 || segmentEnd > data.byteLength) {
      return undefined;
    }
    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) {
        return undefined;
      }
      return {
        height: data.readUInt16BE(offset + 3),
        width: data.readUInt16BE(offset + 5),
      };
    }
    offset = segmentEnd;
  }
  return undefined;
}

function readUInt24LE(data: Buffer, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16);
}

function webpDimensions(data: Buffer): { width: number; height: number } | undefined {
  if (
    data.byteLength < 30 ||
    !hasAsciiAt(data, 0, "RIFF") ||
    !hasAsciiAt(data, 8, "WEBP") ||
    data.readUInt32LE(4) + 8 > data.byteLength
  ) {
    return undefined;
  }

  if (hasAsciiAt(data, 12, "VP8X")) {
    return {
      width: readUInt24LE(data, 24) + 1,
      height: readUInt24LE(data, 27) + 1,
    };
  }
  if (hasAsciiAt(data, 12, "VP8L") && data[20] === 0x2f) {
    return {
      width: 1 + data[21] + ((data[22] & 0x3f) << 8),
      height:
        1 +
        ((data[22] & 0xc0) >> 6) +
        (data[23] << 2) +
        ((data[24] & 0x0f) << 10),
    };
  }
  if (
    hasAsciiAt(data, 12, "VP8 ") &&
    data[23] === 0x9d &&
    data[24] === 0x01 &&
    data[25] === 0x2a
  ) {
    return {
      width: data.readUInt16LE(26) & 0x3fff,
      height: data.readUInt16LE(28) & 0x3fff,
    };
  }
  return undefined;
}

function validateGlbImages(
  document: JsonRecord,
  binaryChunk: Buffer,
  views: GlbBufferView[],
): void {
  const images = optionalArray(document, "images");
  if (images.length > MAX_GLTF_EMBEDDED_IMAGES) {
    throw new RequestError(
      413,
      "GLB_TEXTURE_LIMIT",
      `The GLB exceeds the ${MAX_GLTF_EMBEDDED_IMAGES} embedded-image limit.`,
    );
  }

  let totalPixels = 0;
  images.forEach((rawImage, index) => {
    if (!isRecord(rawImage)) {
      invalidGlbStructure(`glTF images[${index}] must be an object.`);
    }
    if (Object.prototype.hasOwnProperty.call(rawImage, "uri")) {
      throw new RequestError(
        415,
        "EXTERNAL_GLB_RESOURCE",
        "GLB images must use BIN bufferViews; image URIs, including data URIs, are not accepted.",
      );
    }
    if (rawImage.mimeType === "image/avif") {
      throw new RequestError(
        415,
        "UNSUPPORTED_GLB_IMAGE_FORMAT",
        "AVIF textures are not supported by the current viewer.",
      );
    }
    if (
      rawImage.mimeType !== "image/png" &&
      rawImage.mimeType !== "image/jpeg" &&
      rawImage.mimeType !== "image/webp"
    ) {
      throw new RequestError(
        415,
        "UNSUPPORTED_GLB_IMAGE_FORMAT",
        "Embedded GLB images must be PNG, JPEG, or WebP.",
      );
    }

    const view = views[
      arrayIndex(
        rawImage.bufferView,
        views.length,
        `glTF images[${index}].bufferView`,
      )
    ];
    const encodedImage = binaryChunk.subarray(
      view.offset,
      view.offset + view.length,
    );
    const dimensions =
      rawImage.mimeType === "image/png"
        ? pngDimensions(encodedImage)
        : rawImage.mimeType === "image/jpeg"
          ? jpegDimensions(encodedImage)
          : webpDimensions(encodedImage);
    if (!dimensions || dimensions.width === 0 || dimensions.height === 0) {
      throw new RequestError(
        422,
        "INVALID_GLB_IMAGE",
        `glTF images[${index}] does not match its declared image type or has no valid dimensions.`,
      );
    }

    const pixels = dimensions.width * dimensions.height;
    if (
      dimensions.width > MAX_GLTF_TEXTURE_DIMENSION ||
      dimensions.height > MAX_GLTF_TEXTURE_DIMENSION ||
      pixels > MAX_GLTF_TEXTURE_PIXELS
    ) {
      throw new RequestError(
        413,
        "GLB_TEXTURE_LIMIT",
        `glTF images[${index}] exceeds the decoded texture dimension or pixel limit.`,
      );
    }
    totalPixels += pixels;
    if (totalPixels > MAX_GLTF_TOTAL_TEXTURE_PIXELS) {
      throw new RequestError(
        413,
        "GLB_TEXTURE_LIMIT",
        "The GLB exceeds the total decoded-texture pixel budget.",
      );
    }
  });
}

/**
 * Validates a GLB against the exact subset that the portfolio viewer can load
 * safely without external decoders or network-fetched sidecar resources.
 */
export function validateGlb(body: Buffer): void {
  const { document, binaryChunk } = parseGlbContainer(body);
  validateUnsupportedGlbExtensions(document);
  const { views } = validateGlbBuffers(document, binaryChunk);
  const accessors = validateGlbAccessors(document, views);
  const meshTriangles = validateGlbMeshes(document, accessors);
  validateGlbNodes(document, meshTriangles, accessors);
  validateGlbImages(document, binaryChunk, views);
}

function isSafeContentCardLinkUrl(value: string): boolean {
  const normalized = value.trim();
  if (
    !normalized ||
    Array.from(normalized).length > 2_048 ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    return false;
  }

  try {
    const parsed = new URL(normalized);
    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      (parsed.protocol === "mailto:" &&
        parsed.pathname.length > 0 &&
        !/\s/.test(parsed.pathname))
    );
  } catch {
    return false;
  }
}

function validateContentCardEntries(value: unknown): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    throw new RequestError(
      422,
      "INVALID_CONTENT_CARD",
      'Content-card "entries" must be an array.',
    );
  }
  if (value.length > 24) {
    throw new RequestError(
      422,
      "INVALID_CONTENT_CARD",
      "An asset may contain at most 24 content cards.",
    );
  }

  for (const entry of value) {
    if (!isRecord(entry)) {
      throw new RequestError(
        422,
        "INVALID_CONTENT_CARD",
        "Every content card must be an object.",
      );
    }

    if (
      entry.kind !== undefined &&
      entry.kind !== "text" &&
      entry.kind !== "media" &&
      entry.kind !== "links"
    ) {
      throw new RequestError(
        422,
        "INVALID_CONTENT_CARD",
        "Content-card kind must be text, media, or links.",
      );
    }
    if (
      entry.width !== undefined &&
      entry.width !== "standard" &&
      entry.width !== "wide" &&
      entry.width !== "full"
    ) {
      throw new RequestError(
        422,
        "INVALID_CONTENT_CARD",
        "Content-card width must be standard, wide, or full.",
      );
    }
    if (
      entry.imageSrc !== undefined &&
      (typeof entry.imageSrc !== "string" ||
        !CONTENT_CARD_IMAGE_PATH_PATTERN.test(entry.imageSrc))
    ) {
      throw new RequestError(
        422,
        "INVALID_CONTENT_CARD",
        "Content-card images must use a local /uploads/cards path.",
      );
    }
    if (entry.links === undefined) continue;
    if (!Array.isArray(entry.links) || entry.links.length > 4) {
      throw new RequestError(
        422,
        "INVALID_CONTENT_CARD",
        "A content card may contain at most four links.",
      );
    }

    for (const link of entry.links) {
      if (
        !isRecord(link) ||
        typeof link.label !== "string" ||
        !link.label.trim() ||
        Array.from(link.label.trim()).length > 160 ||
        typeof link.url !== "string" ||
        !isSafeContentCardLinkUrl(link.url)
      ) {
        throw new RequestError(
          422,
          "INVALID_CONTENT_CARD",
          "Every content-card link needs a label and a safe URL.",
        );
      }
    }
  }
}

function validateAssetContentCards(value: unknown): void {
  if (!isRecord(value)) return;
  for (const asset of Object.values(value)) {
    if (isRecord(asset)) validateContentCardEntries(asset.entries);
  }
}

export function validateContent(
  value: unknown,
): asserts value is JsonRecord {
  if (!isRecord(value)) {
    throw new RequestError(
      422,
      "INVALID_CONTENT",
      "The JSON body must be an object.",
    );
  }

  if (value.version !== 1) {
    throw new RequestError(
      422,
      "UNSUPPORTED_VERSION",
      "Only content schema version 1 is supported.",
    );
  }

  if (!isRecord(value.profile) || !isRecord(value.assets)) {
    throw new RequestError(
      422,
      "INVALID_CONTENT",
      'The "profile" and "assets" properties must be objects.',
    );
  }

  for (const localeAssets of Object.values(value.assets)) {
    validateAssetContentCards(localeAssets);
  }

  if (isRecord(value.scene) && Array.isArray(value.scene.customAssets)) {
    for (const asset of value.scene.customAssets) {
      if (!isRecord(asset) || !isRecord(asset.content)) continue;
      for (const localizedContent of Object.values(asset.content)) {
        if (isRecord(localizedContent)) {
          validateContentCardEntries(localizedContent.entries);
        }
      }
    }
  }
}

async function atomicWriteJson(path: string, content: JsonRecord): Promise<void> {
  const directory = dirname(path);
  const temporaryPath = resolve(
    directory,
    `.site-content.${process.pid}.${randomUUID()}.tmp`,
  );
  const serialized = JSON.stringify(content);
  if (Buffer.byteLength(serialized) > MAX_SAVE_BODY_BYTES) {
    throw new RequestError(
      413,
      "PAYLOAD_TOO_LARGE",
      `The saved content must not exceed ${MAX_SAVE_BODY_BYTES} UTF-8 bytes.`,
    );
  }

  await mkdir(directory, { recursive: true });

  try {
    await writeFile(temporaryPath, serialized, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
  }
}

async function handlePut(
  request: IncomingMessage,
  response: ServerResponse,
  destination: string,
): Promise<void> {
  const contentType = request.headers["content-type"];
  if (
    typeof contentType !== "string" ||
    contentType.split(";", 1)[0]?.trim().toLowerCase() !== "application/json"
  ) {
    throw new RequestError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type must be application/json.",
    );
  }

  if (!hasLoopbackOrigin(request.headers.origin)) {
    throw new RequestError(
      403,
      "FORBIDDEN_ORIGIN",
      "The save endpoint only accepts requests from a loopback origin.",
    );
  }

  const body = await readBody(request, MAX_SAVE_BODY_BYTES);
  let parsed: unknown;

  try {
    parsed = JSON.parse(body.toString("utf8"));
  } catch {
    throw new RequestError(400, "INVALID_JSON", "The request body is not valid JSON.");
  }

  validateContent(parsed);
  await atomicWriteJson(destination, parsed);

  sendJson(response, 200, {
    ok: true,
    saved: true,
    version: 1,
  });
}

async function atomicWriteUpload(
  directory: string,
  content: Buffer,
  extension: ImageFormat["extension"] | "glb",
): Promise<string> {
  const filename = `${randomUUID()}.${extension}`;
  const destination = resolve(directory, filename);
  const temporaryPath = resolve(
    directory,
    `.${filename}.${process.pid}.${randomUUID()}.tmp`,
  );

  await mkdir(directory, { recursive: true });

  try {
    await writeFile(temporaryPath, content, { flag: "wx" });
    await rename(temporaryPath, destination);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
  }

  return filename;
}

async function handleUpload(
  request: IncomingMessage,
  response: ServerResponse,
  uploadsRoot: string,
  kindValue: string | null,
): Promise<void> {
  if (!hasLoopbackOrigin(request.headers.origin)) {
    throw new RequestError(
      403,
      "FORBIDDEN_ORIGIN",
      "The upload endpoint only accepts requests from a loopback origin.",
    );
  }

  const kind = parseUploadKind(kindValue);
  const rawContentType = request.headers["content-type"];
  const contentType =
    typeof rawContentType === "string"
      ? rawContentType.split(";", 1)[0]?.trim().toLowerCase()
      : undefined;

  if (kind === "models") {
    if (
      contentType !== "model/gltf-binary" &&
      contentType !== "application/octet-stream"
    ) {
      throw new RequestError(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Content-Type must be model/gltf-binary or application/octet-stream.",
      );
    }

    const body = await readBody(request, MAX_MODEL_UPLOAD_BODY_BYTES);
    validateGlb(body);
    const filename = await atomicWriteUpload(
      resolve(uploadsRoot, kind),
      body,
      "glb",
    );

    sendJson(response, 201, {
      ok: true,
      url: `/uploads/${kind}/${filename}`,
    });
    return;
  }

  if (
    contentType !== "image/jpeg" &&
    contentType !== "image/png" &&
    contentType !== "image/webp" &&
    contentType !== "image/avif" &&
    contentType !== "application/octet-stream"
  ) {
    throw new RequestError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type must identify a JPEG, PNG, WebP, or AVIF image.",
    );
  }

  const body = await readBody(request, MAX_IMAGE_UPLOAD_BODY_BYTES);
  const imageFormat = detectImageFormat(body);

  if (
    !imageFormat ||
    (contentType !== "application/octet-stream" &&
      imageFormat.mimeType !== contentType)
  ) {
    throw new RequestError(
      415,
      "INVALID_IMAGE",
      "The request body must contain an image matching its declared JPEG, PNG, WebP, or AVIF type.",
    );
  }

  const filename = await atomicWriteUpload(
    resolve(uploadsRoot, kind),
    body,
    imageFormat.extension,
  );

  sendJson(response, 201, {
    ok: true,
    url: `/uploads/${kind}/${filename}`,
  });
}

function installMiddleware(server: ViteDevServer): void {
  const saveDestination = resolve(
    server.config.root,
    "public",
    "content",
    "site-content.json",
  );
  const uploadsRoot = resolve(server.config.root, "public", "uploads");

  server.middlewares.use((request, response, next) => {
    let requestUrl: URL;

    try {
      requestUrl = new URL(request.url ?? "/", "http://localhost");
    } catch {
      next();
      return;
    }

    if (
      requestUrl.pathname !== SAVE_ENDPOINT &&
      requestUrl.pathname !== UPLOAD_ENDPOINT
    ) {
      next();
      return;
    }

    if (!hasLoopbackHost(request.headers.host)) {
      sendJson(response, 403, {
        ok: false,
        error: {
          code: "FORBIDDEN_HOST",
          message: "The content studio endpoint is only available on loopback hosts.",
        },
      });
      return;
    }

    if (
      request.headers.origin !== undefined &&
      !hasLoopbackOrigin(request.headers.origin)
    ) {
      sendJson(response, 403, {
        ok: false,
        error: {
          code: "FORBIDDEN_ORIGIN",
          message: "The content studio endpoint only accepts loopback origins.",
        },
      });
      return;
    }

    if (requestUrl.pathname === UPLOAD_ENDPOINT) {
      if (request.method !== "POST") {
        sendJson(
          response,
          405,
          {
            ok: false,
            error: {
              code: "METHOD_NOT_ALLOWED",
              message: "Only POST is supported.",
            },
          },
          { Allow: "POST" },
        );
        return;
      }

      void handleUpload(
        request,
        response,
        uploadsRoot,
        requestUrl.searchParams.get("kind"),
      ).catch((error: unknown) => {
        if (response.headersSent) {
          response.end();
          return;
        }

        if (error instanceof RequestError) {
          sendJson(response, error.status, {
            ok: false,
            error: {
              code: error.code,
              message: error.message,
            },
          });
          return;
        }

        server.config.logger.error(
          `[content-studio] Failed to upload media: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
        sendJson(response, 500, {
          ok: false,
          error: {
            code: "UPLOAD_FAILED",
            message: "The media file could not be uploaded.",
          },
        });
      });
      return;
    }

    if (request.method === "GET") {
      sendJson(response, 200, {
        ok: true,
        writable: true,
        endpoint: SAVE_ENDPOINT,
        methods: ["GET", "PUT"],
        contentType: "application/json",
        maxBodyBytes: MAX_SAVE_BODY_BYTES,
        schemaVersion: 1,
      });
      return;
    }

    if (request.method !== "PUT") {
      sendJson(
        response,
        405,
        {
          ok: false,
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: "Only GET and PUT are supported.",
          },
        },
        { Allow: "GET, PUT" },
      );
      return;
    }

    void handlePut(request, response, saveDestination).catch((error: unknown) => {
      if (response.headersSent) {
        response.end();
        return;
      }

      if (error instanceof RequestError) {
        sendJson(response, error.status, {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      server.config.logger.error(
        `[content-studio] Failed to save content: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      sendJson(response, 500, {
        ok: false,
        error: {
          code: "SAVE_FAILED",
          message: "The content file could not be saved.",
        },
      });
    });
  });
}

/**
 * Adds loopback-only content persistence and media upload endpoints to the
 * Vite development server. Because the implementation lives exclusively in
 * configureServer and applies only while serving, production builds contain
 * no write endpoint.
 */
export function contentStudio(): Plugin {
  return {
    name: "content-studio",
    apply: "serve",
    configureServer(server) {
      installMiddleware(server);
    },
  };
}
