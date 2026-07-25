import assert from "node:assert/strict";
import test from "node:test";

const { parseUploadKind, validateContent, validateGlb } = (await import(
  new URL("../build/content-studio-vite-plugin.ts", import.meta.url).href
)) as typeof import("../build/content-studio-vite-plugin");
const {
  prepareModelUpload,
  rememberPreparedModelUpload,
  takePreparedModelUpload,
} = (await import(
  new URL("../app/model-loading.ts", import.meta.url).href
)) as typeof import("../app/model-loading");

type GlbDocument = Record<string, unknown>;

const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;

test("reuses the selected model buffer after upload", async () => {
  const modelSrc =
    "/uploads/models/11111111-1111-4111-8111-111111111111.glb";
  const upload = prepareModelUpload(
    new Blob([Uint8Array.from([0x67, 0x6c, 0x54, 0x46])]),
  );

  rememberPreparedModelUpload(modelSrc, upload);
  const cached = takePreparedModelUpload(modelSrc);

  assert.equal(cached, upload);
  assert.deepEqual(
    Array.from(new Uint8Array(await cached!.buffer)),
    [0x67, 0x6c, 0x54, 0x46],
  );
  assert.equal(takePreparedModelUpload(modelSrc), undefined);
});

test("accepts card uploads and rejects unsafe card content on save", () => {
  assert.equal(parseUploadKind("cards"), "cards");
  for (const entry of [
    {
      eyebrow: "IMAGE",
      title: "Remote tracker",
      body: "",
      meta: "",
      imageSrc: "https://example.com/tracker.jpg",
    },
    {
      eyebrow: "LINK",
      title: "Unsafe link",
      body: "",
      meta: "",
      links: [{ label: "Run", url: "javascript:alert(1)" }],
    },
  ]) {
    assert.throws(
      () =>
        validateContent({
          version: 1,
          profile: {},
          assets: {
            en: {
              contact: {
                entries: [entry],
              },
            },
          },
        }),
      (error: unknown) => {
        assert.equal(
          typeof error === "object" && error !== null && "code" in error
            ? error.code
            : undefined,
          "INVALID_CONTENT_CARD",
        );
        return true;
      },
    );
  }

  assert.doesNotThrow(() =>
    validateContent({
      version: 1,
      profile: {},
      assets: {
        en: {
          contact: {
            entries: [
              {
                eyebrow: "LINK",
                title: "Safe card",
                body: "",
                meta: "",
                imageSrc:
                  "/uploads/cards/44444444-4444-4444-8444-444444444444.webp",
                links: [
                  {
                    label: "😀".repeat(100),
                    url: "https://example.com",
                  },
                ],
              },
            ],
          },
        },
      },
    }),
  );
});

function paddedBuffer(value: Buffer, paddingByte: number): Buffer {
  const paddedLength = Math.ceil(value.byteLength / 4) * 4;
  const result = Buffer.alloc(paddedLength, paddingByte);
  value.copy(result);
  return result;
}

function makeGlb(document: GlbDocument, binary?: Buffer): Buffer {
  const json = paddedBuffer(Buffer.from(JSON.stringify(document)), 0x20);
  const paddedBinary =
    binary === undefined ? undefined : paddedBuffer(binary, 0x00);
  const byteLength =
    12 + 8 + json.byteLength + (paddedBinary ? 8 + paddedBinary.byteLength : 0);
  const body = Buffer.alloc(byteLength);

  body.write("glTF", 0, "ascii");
  body.writeUInt32LE(2, 4);
  body.writeUInt32LE(byteLength, 8);
  body.writeUInt32LE(json.byteLength, 12);
  body.writeUInt32LE(JSON_CHUNK_TYPE, 16);
  json.copy(body, 20);

  if (paddedBinary) {
    const chunkOffset = 20 + json.byteLength;
    body.writeUInt32LE(paddedBinary.byteLength, chunkOffset);
    body.writeUInt32LE(BIN_CHUNK_TYPE, chunkOffset + 4);
    paddedBinary.copy(body, chunkOffset + 8);
  }

  return body;
}

function expectValidationCode(body: Buffer, expectedCode: string): void {
  assert.throws(
    () => validateGlb(body),
    (error: unknown) => {
      assert.equal(
        typeof error === "object" && error !== null && "code" in error
          ? error.code
          : undefined,
        expectedCode,
      );
      return true;
    },
  );
}

function triangleDocument(): GlbDocument {
  return {
    asset: { version: "2.0" },
    buffers: [{ byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: "VEC3",
      },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };
}

test("accepts a small, self-contained glTF 2.0 GLB", () => {
  assert.doesNotThrow(() =>
    validateGlb(makeGlb(triangleDocument(), Buffer.alloc(36))),
  );
});

test("accepts a bounded embedded PNG texture", () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const document: GlbDocument = {
    asset: { version: "2.0" },
    buffers: [{ byteLength: png.byteLength }],
    bufferViews: [{ buffer: 0, byteLength: png.byteLength }],
    images: [{ bufferView: 0, mimeType: "image/png" }],
  };

  assert.doesNotThrow(() => validateGlb(makeGlb(document, png)));
});

test("rejects external and data URI sidecar resources", () => {
  for (const uri of [
    "https://example.com/model.bin",
    "data:application/octet-stream;base64,AA==",
  ]) {
    expectValidationCode(
      makeGlb({
        asset: { version: "2.0" },
        buffers: [{ byteLength: 0, uri }],
      }),
      "EXTERNAL_GLB_RESOURCE",
    );
  }

  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      images: [{ uri: "texture.png" }],
    }),
    "EXTERNAL_GLB_RESOURCE",
  );
});

test("rejects decoder-dependent compression and texture extensions", () => {
  for (const extension of [
    "KHR_draco_mesh_compression",
    "EXT_meshopt_compression",
    "KHR_texture_basisu",
    "EXT_texture_avif",
  ]) {
    expectValidationCode(
      makeGlb({
        asset: { version: "2.0" },
        extensionsUsed: [extension],
      }),
      "UNSUPPORTED_GLB_EXTENSION",
    );
  }

  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      meshes: [
        {
          primitives: [
            {
              attributes: {},
              extensions: {
                KHR_draco_mesh_compression: {},
              },
            },
          ],
        },
      ],
    }),
    "UNSUPPORTED_GLB_EXTENSION",
  );
});

test("rejects oversized GLB JSON chunks", () => {
  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      extras: "x".repeat(1024 * 1024),
    }),
    "GLB_JSON_TOO_LARGE",
  );
});

test("rejects bufferViews and accessors that escape their binary ranges", () => {
  expectValidationCode(
    makeGlb(
      {
        asset: { version: "2.0" },
        buffers: [{ byteLength: 4 }],
        bufferViews: [{ buffer: 0, byteOffset: 2, byteLength: 4 }],
      },
      Buffer.alloc(4),
    ),
    "INVALID_GLB_BUFFER_RANGE",
  );

  expectValidationCode(
    makeGlb(
      {
        asset: { version: "2.0" },
        buffers: [{ byteLength: 12 }],
        bufferViews: [{ buffer: 0, byteLength: 12 }],
        accessors: [
          {
            bufferView: 0,
            componentType: 5126,
            count: 2,
            type: "VEC3",
          },
        ],
      },
      Buffer.alloc(12),
    ),
    "INVALID_GLB_BUFFER_RANGE",
  );
});

test("rejects cyclic node graphs", () => {
  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      nodes: [{ children: [1] }, { children: [0] }],
    }),
    "GLB_NODE_CYCLE",
  );
});

test("enforces node, primitive, and mesh-instance budgets", () => {
  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      nodes: Array.from({ length: 513 }, () => ({})),
    }),
    "GLB_RESOURCE_LIMIT",
  );

  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      meshes: [
        {
          primitives: Array.from({ length: 513 }, () => ({ attributes: {} })),
        },
      ],
    }),
    "GLB_RESOURCE_LIMIT",
  );

  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      meshes: [{ primitives: [{ attributes: {} }] }],
      nodes: Array.from({ length: 257 }, () => ({ mesh: 0 })),
    }),
    "GLB_RESOURCE_LIMIT",
  );
});

test("enforces virtual accessor memory and rendered-triangle budgets", () => {
  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      accessors: [
        {
          componentType: 5126,
          count: Math.floor((128 * 1024 * 1024) / 12) + 1,
          type: "VEC3",
        },
      ],
    }),
    "GLB_RESOURCE_LIMIT",
  );

  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      accessors: [
        {
          componentType: 5125,
          count: 3_000_003,
          type: "SCALAR",
        },
      ],
      meshes: [
        {
          primitives: [{ attributes: {}, indices: 0 }],
        },
      ],
      nodes: [{ mesh: 0 }],
    }),
    "GLB_RESOURCE_LIMIT",
  );
});

test("enforces embedded texture count and decoded-pixel budgets", () => {
  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      images: Array.from({ length: 17 }, () => ({})),
    }),
    "GLB_TEXTURE_LIMIT",
  );

  const pixelBombHeader = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(
    pixelBombHeader,
  );
  pixelBombHeader.writeUInt32BE(13, 8);
  pixelBombHeader.write("IHDR", 12, "ascii");
  pixelBombHeader.writeUInt32BE(8192, 16);
  pixelBombHeader.writeUInt32BE(8192, 20);
  expectValidationCode(
    makeGlb(
      {
        asset: { version: "2.0" },
        buffers: [{ byteLength: pixelBombHeader.byteLength }],
        bufferViews: [
          { buffer: 0, byteLength: pixelBombHeader.byteLength },
        ],
        images: [{ bufferView: 0, mimeType: "image/png" }],
      },
      pixelBombHeader,
    ),
    "GLB_TEXTURE_LIMIT",
  );
});

test("distinguishes unsupported and malformed embedded images", () => {
  expectValidationCode(
    makeGlb({
      asset: { version: "2.0" },
      images: [{ mimeType: "image/avif" }],
    }),
    "UNSUPPORTED_GLB_IMAGE_FORMAT",
  );

  const invalidPng = Buffer.alloc(24);
  expectValidationCode(
    makeGlb(
      {
        asset: { version: "2.0" },
        buffers: [{ byteLength: invalidPng.byteLength }],
        bufferViews: [{ buffer: 0, byteLength: invalidPng.byteLength }],
        images: [{ bufferView: 0, mimeType: "image/png" }],
      },
      invalidPng,
    ),
    "INVALID_GLB_IMAGE",
  );
});
