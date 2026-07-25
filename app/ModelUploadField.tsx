"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useRef,
  useState,
} from "react";
import type { ContentLocale } from "./content-config";

const MAX_MODEL_BYTES = 24 * 1024 * 1024;
const ACCEPTED_MODEL_TYPES = ".glb,model/gltf-binary";

type UploadResponse = {
  url?: unknown;
  error?: {
    code?: unknown;
  };
};

interface ModelUploadFieldProps {
  locale: ContentLocale;
  label: string;
  description: string;
  value?: string;
  disabled?: boolean;
  onUploaded: (url: string) => void;
  onClear: () => void;
}

export function ModelUploadField({
  locale,
  label,
  description,
  value,
  disabled = false,
  onUploaded,
  onClear,
}: ModelUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const copy =
    locale === "zh"
      ? {
          choose: value ? "替换模型" : "选择模型",
          clear: "解除引用",
          drop: "拖动 GLB 模型到这里",
          formats: "自包含 GLB（glTF 2.0），最大 24 MiB",
          uploading: "正在上传…",
          uploaded: "已上传，请保存到项目",
          unlinked: "已解除引用；模型文件仍保留在项目中",
          tooLarge: "模型不能超过 24 MiB",
          invalid: "无法上传，请使用有效的 glTF 2.0 GLB 文件",
          selfContained:
            "模型必须是自包含 GLB：请将缓冲区和纹理嵌入文件，不要使用外部或 data URI",
          unsupported:
            "当前查看器不支持 Draco、Meshopt、BasisU/KTX2 或 AVIF；请关闭这些导出选项",
          tooComplex:
            "模型过于复杂：请减少节点、实例、网格、三角面、访问器或纹理尺寸",
          invalidTexture: "嵌入纹理无效；请使用有效的 PNG、JPEG 或 WebP",
          nodeCycle: "模型节点层级存在循环，请修复场景层级后重新导出",
          invalidStructure:
            "GLB 结构或二进制范围无效，请从建模软件重新导出为 glTF 2.0 GLB",
          localOnly: "请在本地 Content Studio 中上传",
        }
      : {
          choose: value ? "Replace model" : "Choose model",
          clear: "Unlink",
          drop: "Drop a GLB model here",
          formats: "Self-contained GLB (glTF 2.0) · 24 MiB max",
          uploading: "Uploading…",
          uploaded: "Uploaded — save to project",
          unlinked: "Reference removed — the model file remains in the project",
          tooLarge: "Models must be 24 MiB or smaller",
          invalid: "Upload failed. Use a valid glTF 2.0 GLB file",
          selfContained:
            "The GLB must be self-contained. Embed buffers and textures; external and data URIs are not accepted",
          unsupported:
            "This viewer cannot load Draco, Meshopt, BasisU/KTX2, or AVIF. Disable those export options",
          tooComplex:
            "The model is too complex. Reduce nodes, instances, meshes, triangles, accessors, or texture sizes",
          invalidTexture:
            "An embedded texture is invalid. Use a valid PNG, JPEG, or WebP image",
          nodeCycle:
            "The model node hierarchy contains a cycle. Fix the scene hierarchy and export again",
          invalidStructure:
            "The GLB structure or binary ranges are invalid. Export a fresh glTF 2.0 GLB",
          localOnly: "Upload from the local Content Studio",
        };

  const messageForErrorCode = (code: unknown): string => {
    switch (code) {
      case "PAYLOAD_TOO_LARGE":
        return copy.tooLarge;
      case "EXTERNAL_GLB_RESOURCE":
        return copy.selfContained;
      case "UNSUPPORTED_GLB_EXTENSION":
      case "UNSUPPORTED_GLB_IMAGE_FORMAT":
        return copy.unsupported;
      case "GLB_JSON_TOO_LARGE":
      case "GLB_RESOURCE_LIMIT":
      case "GLB_TEXTURE_LIMIT":
        return copy.tooComplex;
      case "INVALID_GLB_IMAGE":
        return copy.invalidTexture;
      case "GLB_NODE_CYCLE":
        return copy.nodeCycle;
      case "INVALID_GLB_STRUCTURE":
      case "INVALID_GLB_BUFFER_RANGE":
        return copy.invalidStructure;
      default:
        return copy.invalid;
    }
  };

  const uploadFile = async (file: File) => {
    if (disabled || uploading) return;

    if (!file.name.toLowerCase().endsWith(".glb")) {
      setMessage(copy.invalid);
      return;
    }

    if (file.size > MAX_MODEL_BYTES) {
      setMessage(copy.tooLarge);
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      const response = await fetch("/__content-studio/upload?kind=models", {
        method: "POST",
        headers: {
          "Content-Type":
            file.type === "model/gltf-binary"
              ? "model/gltf-binary"
              : "application/octet-stream",
        },
        body: file,
      });
      const payload = (await response.json().catch(() => null)) as
        | UploadResponse
        | null;
      if (!response.ok) {
        setMessage(messageForErrorCode(payload?.error?.code));
        return;
      }
      if (typeof payload?.url !== "string") {
        setMessage(copy.invalid);
        return;
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
        className={`studio-dropzone ${dragActive ? "is-drag-active" : ""}`}
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
          <span>{value ? "3D" : "GLB"}</span>
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
                  setMessage(copy.unlinked);
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
          accept={ACCEPTED_MODEL_TYPES}
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
    </div>
  );
}
