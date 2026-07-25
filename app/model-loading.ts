export type CustomModelLoadError =
  | "request"
  | "too-large"
  | "parse"
  | "empty-scene";

export type CustomModelLoadState =
  | { phase: "empty" }
  | { phase: "fetching"; modelSrc: string }
  | { phase: "processing"; modelSrc: string }
  | { phase: "ready"; modelSrc: string }
  | {
      phase: "error";
      modelSrc: string;
      error: CustomModelLoadError;
    };

export interface PreparedModelUpload {
  byteLength: number;
  buffer: Promise<ArrayBuffer>;
}

const MAX_PREPARED_UPLOADS = 4;
const PREPARED_UPLOAD_TTL_MS = 90_000;
type PreparedModelUploadEntry = {
  upload: PreparedModelUpload;
  timeout: ReturnType<typeof setTimeout>;
};
const preparedUploads = new Map<string, PreparedModelUploadEntry>();

function deletePreparedModelUpload(modelSrc: string): void {
  const entry = preparedUploads.get(modelSrc);
  if (!entry) return;
  clearTimeout(entry.timeout);
  preparedUploads.delete(modelSrc);
}

export function prepareModelUpload(file: Blob): PreparedModelUpload {
  const buffer = file.arrayBuffer();
  void buffer.catch(() => undefined);
  return {
    byteLength: file.size,
    buffer,
  };
}

export function rememberPreparedModelUpload(
  modelSrc: string,
  upload: PreparedModelUpload,
): void {
  deletePreparedModelUpload(modelSrc);
  const timeout = setTimeout(
    () => preparedUploads.delete(modelSrc),
    PREPARED_UPLOAD_TTL_MS,
  );
  if (typeof timeout === "object" && "unref" in timeout) {
    timeout.unref();
  }
  preparedUploads.set(modelSrc, { upload, timeout });

  while (preparedUploads.size > MAX_PREPARED_UPLOADS) {
    const oldestModelSrc = preparedUploads.keys().next().value;
    if (typeof oldestModelSrc !== "string") break;
    deletePreparedModelUpload(oldestModelSrc);
  }
}

export function takePreparedModelUpload(
  modelSrc: string,
): PreparedModelUpload | undefined {
  const entry = preparedUploads.get(modelSrc);
  deletePreparedModelUpload(modelSrc);
  return entry?.upload;
}

export function forgetPreparedModelUpload(modelSrc: string): void {
  deletePreparedModelUpload(modelSrc);
}

export async function discardStagedModelUpload(
  modelSrc: string,
): Promise<boolean> {
  forgetPreparedModelUpload(modelSrc);
  try {
    const response = await fetch(
      `/__content-studio/model-cache?url=${encodeURIComponent(modelSrc)}`,
      {
        method: "DELETE",
      },
    );
    return response.ok;
  } catch {
    // Saving performs a full mark-and-sweep, so an eager cleanup failure does
    // not leave the project in a partially committed state.
    return false;
  }
}
