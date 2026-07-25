"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useRef,
  useState,
} from "react";
import type { ContentLocale } from "./content-config";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 10_000;
const MAX_IMAGE_PIXELS = 40_000_000;
const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif";

async function decodeImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () =>
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      image.onerror = () => reject(new Error("image decode failed"));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface ImageUploadFieldProps {
  locale: ContentLocale;
  kind: "profile" | "photography";
  label: string;
  description: string;
  value?: string;
  alt: string;
  fallback: string;
  disabled?: boolean;
  onUploaded: (url: string) => void;
  onClear: () => void;
}

export function ImageUploadField({
  locale,
  kind,
  label,
  description,
  value,
  alt,
  fallback,
  disabled = false,
  onUploaded,
  onClear,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [failedImageSrc, setFailedImageSrc] = useState<string>();

  const copy =
    locale === "zh"
      ? {
          choose: value ? "替换照片" : "选择照片",
          clear: "清除",
          drop: "拖动照片到这里",
          formats: "JPEG、PNG、WebP 或 AVIF，最大 10 MB",
          uploading: "正在上传…",
          uploaded: "已上传，请保存到项目",
          tooLarge: "图片不能超过 10 MB",
          tooManyPixels: "图片尺寸过大，请限制在 10,000 像素和 4,000 万像素以内",
          invalid: "无法上传，请使用 JPEG、PNG、WebP 或 AVIF",
          localOnly: "请在本地 Content Studio 中上传",
        }
      : {
          choose: value ? "Replace photo" : "Choose photo",
          clear: "Clear",
          drop: "Drop a photo here",
          formats: "JPEG, PNG, WebP, or AVIF · 10 MB max",
          uploading: "Uploading…",
          uploaded: "Uploaded — save to project",
          tooLarge: "Images must be 10 MB or smaller",
          tooManyPixels:
            "Images must stay within 10,000 px per side and 40 megapixels",
          invalid: "Upload failed. Use JPEG, PNG, WebP, or AVIF",
          localOnly: "Upload from the local Content Studio",
        };

  const uploadFile = async (file: File) => {
    if (disabled || uploading) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage(copy.tooLarge);
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      const dimensions = await decodeImageDimensions(file);
      if (
        dimensions.width <= 0 ||
        dimensions.height <= 0 ||
        dimensions.width > MAX_IMAGE_DIMENSION ||
        dimensions.height > MAX_IMAGE_DIMENSION ||
        dimensions.width * dimensions.height > MAX_IMAGE_PIXELS
      ) {
        setMessage(copy.tooManyPixels);
        return;
      }

      const response = await fetch(
        `/__content-studio/upload?kind=${encodeURIComponent(kind)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { url?: unknown }
        | null;
      if (!response.ok || typeof payload?.url !== "string") {
        throw new Error("upload failed");
      }
      onUploaded(payload.url);
      setMessage(copy.uploaded);
    } catch {
      setMessage(copy.invalid);
    } finally {
      setUploading(false);
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  return (
    <div className="studio-media-field">
      <div className="studio-media-heading">
        <div>
          <strong>{label}</strong>
          <p>{description}</p>
        </div>
        {message && (
          <span className="studio-media-status" role="status">
            {message}
          </span>
        )}
      </div>

      <div
        className={`studio-dropzone ${dragActive ? "is-drag-active" : ""} ${
          value && value !== failedImageSrc ? "has-image" : ""
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          const relatedTarget = event.relatedTarget;
          if (
            !(relatedTarget instanceof Node) ||
            !event.currentTarget.contains(relatedTarget)
          ) {
            setDragActive(false);
          }
        }}
        onDrop={handleDrop}
      >
        <div className="studio-media-preview" aria-hidden="true">
          {value && value !== failedImageSrc ? (
            // Uploaded images use runtime paths and cannot be statically imported.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setFailedImageSrc(value)}
            />
          ) : (
            <span>{fallback}</span>
          )}
        </div>
        <div className="studio-dropzone-copy">
          <strong>{disabled ? copy.localOnly : copy.drop}</strong>
          <span>{copy.formats}</span>
          <div className="studio-media-actions">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
            >
              {uploading ? copy.uploading : copy.choose}
            </button>
            {value && (
              <button
                type="button"
                className="studio-media-clear"
                onClick={() => {
                  onClear();
                  setMessage("");
                }}
                disabled={uploading}
              >
                {copy.clear}
              </button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          className="studio-visually-hidden"
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          tabIndex={-1}
          onChange={handleInput}
          disabled={disabled || uploading}
          aria-label={label}
        />
      </div>
      {value && (
        <span className="studio-media-path" title={value}>
          {value}
        </span>
      )}
      <span className="studio-visually-hidden">{alt}</span>
    </div>
  );
}
