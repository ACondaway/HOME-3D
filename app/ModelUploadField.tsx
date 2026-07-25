"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useRef,
  useState,
} from "react";
import type { ContentLocale } from "./content-config";
import {
  forgetPreparedModelUpload,
  prepareModelUpload,
  rememberPreparedModelUpload,
  type CustomModelLoadState,
} from "./model-loading";

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
  purpose?: "custom-asset" | "core-replacement";
  sceneActive?: boolean;
  loadState?: CustomModelLoadState;
  onUploaded: (url: string) => void;
  onClear: () => void;
  onDiscardRequested: (url: string) => void;
  onUploadActivityChange?: (delta: 1 | -1) => void;
}

export function ModelUploadField({
  locale,
  label,
  description,
  value,
  disabled = false,
  purpose = "custom-asset",
  sceneActive = true,
  loadState,
  onUploaded,
  onClear,
  onDiscardRequested,
  onUploadActivityChange,
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
          coreChoose: value ? "更换替换模型" : "上传替换模型",
          coreClear: "恢复原生外观",
          drop: "拖动 GLB 模型到这里",
          formats: "自包含 GLB（glTF 2.0），最大 24 MiB",
          uploading: "正在上传…",
          uploaded: "已上传，请保存到项目",
          fetching: "正在从暂存缓存读取模型…",
          processing: "正在解析网格与纹理…",
          ready: "模型已在场景中显示",
          coreReadyInactive: "替换模型已就绪；重新激活后显示",
          loadErrors: {
            request: "模型文件无法读取，请检查引用后重试",
            "too-large": "模型超过运行时 24 MiB 限制",
            parse: "模型已上传，但浏览器无法解析",
            "empty-scene": "模型没有可显示的场景内容",
          },
          unlinked:
            "已解除引用；未保存缓存会立即或在保存时清理，已发布文件会在保存时移除",
          coreUnlinked:
            "已恢复原生外观；未保存缓存会立即或在保存时清理，已发布文件会在保存时移除",
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
          coreChoose: value ? "Replace visual" : "Upload replacement",
          coreClear: "Restore native visual",
          drop: "Drop a GLB model here",
          formats: "Self-contained GLB (glTF 2.0) · 24 MiB max",
          uploading: "Uploading…",
          uploaded: "Uploaded — save to project",
          fetching: "Reading the model from the preview cache…",
          processing: "Processing geometry and textures…",
          ready: "Model is visible in the scene",
          coreReadyInactive:
            "Replacement is ready and will appear when reactivated",
          loadErrors: {
            request: "The model file could not be read. Check its reference and retry",
            "too-large": "The model exceeds the 24 MiB runtime limit",
            parse: "The model uploaded, but the browser could not parse it",
            "empty-scene": "The model does not contain a visible scene",
          },
          unlinked:
            "Reference removed — preview cache is cleared now or on save; the published file is removed on save",
          coreUnlinked:
            "Native visual restored — preview cache is cleared now or on save; the published file is removed on save",
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
  const isCoreReplacement = purpose === "core-replacement";
  const chooseLabel = isCoreReplacement ? copy.coreChoose : copy.choose;
  const clearLabel = isCoreReplacement ? copy.coreClear : copy.clear;
  const unlinkedMessage = isCoreReplacement
    ? copy.coreUnlinked
    : copy.unlinked;

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
    onUploadActivityChange?.(1);
    setMessage("");
    const preparedUpload = prepareModelUpload(file);
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

      rememberPreparedModelUpload(payload.url, preparedUpload);
      onUploaded(payload.url);
      if (value && value !== payload.url) {
        onDiscardRequested(value);
      }
      setMessage(copy.uploaded);
    } catch {
      setMessage(copy.invalid);
    } finally {
      setUploading(false);
      onUploadActivityChange?.(-1);
    }
  };

  const loadMessage =
    value && loadState?.phase === "fetching"
      ? copy.fetching
      : value && loadState?.phase === "processing"
        ? copy.processing
        : value && loadState?.phase === "ready"
          ? isCoreReplacement && !sceneActive
            ? copy.coreReadyInactive
            : copy.ready
          : value && loadState?.phase === "error"
            ? copy.loadErrors[loadState.error]
            : "";
  const displayedMessage = uploading
    ? copy.uploading
    : loadMessage || message;
  const loadPhase = loadState?.phase ?? "empty";
  const previewLabel =
    uploading || loadPhase === "fetching" || loadPhase === "processing"
      ? "···"
      : loadPhase === "error"
        ? "!"
        : value
          ? "3D"
          : "GLB";

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
        {displayedMessage && (
          <span
            className={`studio-media-status ${
              loadPhase === "error" ? "is-error" : ""
            }`}
            role={loadPhase === "error" ? "alert" : "status"}
          >
            {displayedMessage}
          </span>
        )}
      </div>

      <div
        className={`studio-dropzone ${dragActive ? "is-drag-active" : ""} ${
          loadPhase === "fetching" || loadPhase === "processing"
            ? "is-model-loading"
            : ""
        } ${loadPhase === "error" ? "is-model-error" : ""}`}
        aria-busy={
          uploading ||
          loadPhase === "fetching" ||
          loadPhase === "processing"
        }
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
          <span>{previewLabel}</span>
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
              {uploading ? copy.uploading : chooseLabel}
            </button>
            {value && (
              <button
                type="button"
                className="studio-media-clear"
                onClick={() => {
                  forgetPreparedModelUpload(value);
                  onClear();
                  onDiscardRequested(value);
                  setMessage(unlinkedMessage);
                }}
                disabled={uploading}
                aria-label={`${clearLabel}: ${label}`}
              >
                {clearLabel}
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
