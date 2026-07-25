import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";

const SAVE_ENDPOINT = "/__content-studio/save";
const UPLOAD_ENDPOINT = "/__content-studio/upload";
const MAX_SAVE_BODY_BYTES = 256 * 1024;
const MAX_UPLOAD_BODY_BYTES = 10 * 1024 * 1024;

type JsonRecord = Record<string, unknown>;
type UploadKind = "profile" | "photography";

type ImageFormat = {
  extension: "jpg" | "png" | "webp" | "avif";
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/avif";
};

class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
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

function parseUploadKind(value: string | null): UploadKind {
  if (value === "profile" || value === "photography") {
    return value;
  }

  throw new RequestError(
    400,
    "INVALID_UPLOAD_KIND",
    'The "kind" query parameter must be either "profile" or "photography".',
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

function validateContent(value: unknown): asserts value is JsonRecord {
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
}

async function atomicWriteJson(path: string, content: JsonRecord): Promise<void> {
  const directory = dirname(path);
  const temporaryPath = resolve(
    directory,
    `.site-content.${process.pid}.${randomUUID()}.tmp`,
  );

  await mkdir(directory, { recursive: true });

  try {
    await writeFile(temporaryPath, `${JSON.stringify(content, null, 2)}\n`, {
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

async function atomicWriteImage(
  directory: string,
  content: Buffer,
  extension: ImageFormat["extension"],
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

  const body = await readBody(request, MAX_UPLOAD_BODY_BYTES);
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

  const filename = await atomicWriteImage(
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
          `[content-studio] Failed to upload image: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
        sendJson(response, 500, {
          ok: false,
          error: {
            code: "UPLOAD_FAILED",
            message: "The image could not be uploaded.",
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
 * Adds loopback-only content persistence and image upload endpoints to the
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
