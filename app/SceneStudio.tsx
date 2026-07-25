"use client";

import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CONTENT_ASSET_IDS,
  CONTENT_LIMITS,
  DEFAULT_SCENE_TRANSFORM,
  SCENE_TRANSFORM_LIMITS,
  isCoreSceneAssetEnabled,
  type AssetContentOverride,
  type ContentLocale,
  type CustomSceneAsset,
  type ScenePlacement,
  type SceneTransform,
  type SceneVector3,
  type SiteContentConfig,
} from "./content-config";
import { ModelUploadField } from "./ModelUploadField";
import type { CustomModelLoadState } from "./model-loading";
import {
  isAssetId,
  type CoreAssetId,
  type PortfolioAsset,
} from "./portfolio-data";
import { ContentCardListEditor } from "./ContentCardEditor";
import type {
  ScenePlacementEdit,
  ScenePlacementMode,
} from "./scene-placement";

interface SceneStudioProps {
  locale: ContentLocale;
  config: SiteContentConfig;
  assets: PortfolioAsset[];
  projectWritable: boolean;
  modelLoadStates: Readonly<Record<string, CustomModelLoadState>>;
  placementEdit: ScenePlacementEdit | null;
  onChange: Dispatch<SetStateAction<SiteContentConfig>>;
  onPlacementEditStart: (assetId: string) => void;
  onPlacementModeChange: (mode: ScenePlacementMode) => void;
  onPlacementEditConfirm: () => void;
  onPlacementEditCancel: () => void;
}

type TransformKey = keyof SceneTransform;
type CorePortfolioAsset = PortfolioAsset & { id: CoreAssetId };
type AssetTextKey =
  | "objectLabel"
  | "sectionTitle"
  | "trait"
  | "teaser"
  | "intro"
  | "status"
  | "lastUpdated"
  | "note";

const TRANSFORM_KEYS = [
  "position",
  "rotation",
  "scale",
] as const satisfies readonly TransformKey[];

const ASSET_TEXT_KEYS = [
  "objectLabel",
  "sectionTitle",
  "trait",
  "teaser",
  "intro",
  "status",
  "lastUpdated",
  "note",
] as const satisfies readonly AssetTextKey[];

const DEFAULT_ACCENT = "#c99a62";

function isCorePortfolioAsset(
  asset: PortfolioAsset,
): asset is CorePortfolioAsset {
  return isAssetId(asset.id);
}

function createCustomAssetId(): CustomSceneAsset["id"] {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function cloneVector(vector: SceneVector3): SceneVector3 {
  return [vector[0], vector[1], vector[2]];
}

function createDefaultCustomAsset(): CustomSceneAsset {
  return {
    id: createCustomAssetId(),
    behavior: "decorative",
    accent: DEFAULT_ACCENT,
    transform: {
      position: [0, 0, 3.5],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    content: {
      zh: {
        objectLabel: "新资产",
        sectionTitle: "未命名物件",
        trait: "",
        teaser: "",
        intro: "",
        status: "场景陈列",
        lastUpdated: "",
        metrics: [],
        entries: [],
        note: "",
      },
      en: {
        objectLabel: "New asset",
        sectionTitle: "Untitled object",
        trait: "",
        teaser: "",
        intro: "",
        status: "In the room",
        lastUpdated: "",
        metrics: [],
        entries: [],
        note: "",
      },
    },
  };
}

function StudioSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="studio-section">
      <header className="studio-section-header">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={`studio-field ${wide ? "is-wide" : ""}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  disabled = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraft(String(value));
    }
  }, [value]);

  const commit = (rawValue: string) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const nextValue = Math.min(max, Math.max(min, parsed));
    setDraft(String(nextValue));
    onChange(nextValue);
  };

  return (
    <label className="studio-field studio-number-field">
      <span>{label}</span>
      <input
        ref={inputRef}
        type="number"
        value={draft}
        min={min}
        max={max}
        step={step}
        inputMode="decimal"
        disabled={disabled}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          if (nextDraft.trim() === "") return;
          const parsed = Number(nextDraft);
          if (Number.isFinite(parsed)) {
            onChange(Math.min(max, Math.max(min, parsed)));
          }
        }}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </label>
  );
}

function TransformEditor({
  transform,
  relative,
  locale,
  disabled = false,
  onChange,
}: {
  transform: SceneTransform;
  relative: boolean;
  locale: ContentLocale;
  disabled?: boolean;
  onChange: (key: TransformKey, value: SceneVector3) => void;
}) {
  const copy =
    locale === "zh"
      ? {
          position: relative ? "位置偏移" : "场景位置",
          rotation: "旋转角度",
          scale: "缩放倍率",
          x: "X",
          y: "Y",
          z: "Z",
        }
      : {
          position: relative ? "Position offset" : "Scene position",
          rotation: "Rotation degrees",
          scale: "Scale multiplier",
          x: "X",
          y: "Y",
          z: "Z",
        };

  return (
    <div className="studio-transform-editor">
      {TRANSFORM_KEYS.map((key) => {
        const limits = SCENE_TRANSFORM_LIMITS[key];
        const step = key === "rotation" ? 5 : key === "scale" ? 0.05 : 0.1;
        return (
          <fieldset key={key}>
            <legend>{copy[key]}</legend>
            <div className="studio-vector-grid">
              {(["x", "y", "z"] as const).map((axis, index) => (
                <NumberField
                  key={axis}
                  label={copy[axis]}
                  value={transform[key][index]}
                  min={limits.min}
                  max={limits.max}
                  step={step}
                  disabled={disabled}
                  onChange={(value) => {
                    const next = cloneVector(transform[key]);
                    next[index] = value;
                    onChange(key, next);
                  }}
                />
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

export function SceneStudio({
  locale,
  config,
  assets,
  projectWritable,
  modelLoadStates,
  placementEdit,
  onChange,
  onPlacementEditStart,
  onPlacementModeChange,
  onPlacementEditConfirm,
  onPlacementEditCancel,
}: SceneStudioProps) {
  const copy =
    locale === "zh"
      ? {
          title: "场景布局",
          description:
            "启用、停用或移动内置物件，也可以上传 GLB 新资产。停用不会删除物件定义或已经保存的内容。",
          selectAsset: "选择要编辑的场景物件",
          existing: "内置物件 · 已启用",
          inactive: "内置物件 · 已停用",
          custom: "自定义资产",
          add: "添加新资产",
          limit: "已达到自定义资产上限",
          placement: "物件变换",
          placementHelp:
            "现有物件使用相对原始位置的偏移；旋转单位为度，缩放 1 表示保持原尺寸。",
          dragPlacement: "拖动摆放",
          dragPlacementActive: "正在摆放",
          dragPlacementHelp:
            "进入后，可切换平面、高度和方向三种拖动方式；确认或取消后，可继续使用完整数值设置。",
          dragMode: "拖动方式",
          dragModes: {
            plane: {
              label: "平面 X / Z",
              help: "沿地面拖动，只改变 X / Z。",
            },
            height: {
              label: "高度 Y",
              help: "上下拖动调整高度 Y。",
            },
            rotation: {
              label: "方向旋转",
              help: "绕 Y 轴拖动改变物体朝向；按住 Shift 可吸附到 15°。",
            },
          },
          confirmPlacement: "确认全部摆放",
          cancelPlacement: "取消全部预览",
          placementCoordinates: "预览坐标",
          reset: "恢复原始位置",
          disableCore: "停用物件",
          enableCore: "重新激活",
          disabledCoreHelp:
            "这个内置物件不会出现在场景、内容索引或详情入口中；代码定义、页面内容和摆放数据仍然保留。",
          disabledPlacementHelp:
            "重新激活物件后即可继续拖动或编辑坐标。",
          replacement: "替换内置模型",
          replacementHelp:
            "上传 GLB 只会替换场景中的外观；原来的物件 ID、双语内容、交互和摆放数据都会保留。解除模型引用即可恢复代码内置外观。",
          model: "3D 模型",
          modelHelp:
            "上传自有 GLB 模型。没有模型或加载失败时，场景会显示一个占位物。",
          settings: "资产设置",
          behavior: "资产用途",
          decorative: "仅装饰，不创建页面",
          interactive: "可交互，点击后打开详情页",
          accent: "强调色",
          transform: "放置与尺寸",
          transformHelp:
            "自定义资产使用房间中的绝对坐标；建议先小幅调整并实时检查。",
          content: "交互页面内容",
          contentHelp:
            "只有“可交互”资产会进入索引、响应悬停并打开详情页。",
          remove: "移除自定义资产",
          confirmRemove: "再次点击确认移除",
          removeHelp: "移除只删除配置引用，已经上传的 GLB 文件仍保留在项目中。",
          metrics: "数据指标",
          entries: "内容卡片",
          addMetric: "添加指标",
          addEntry: "添加卡片",
          removeItem: "移除",
          fields: {
            objectLabel: "物件名称",
            sectionTitle: "章节标题",
            trait: "代表特质",
            teaser: "索引摘要",
            intro: "章节介绍",
            status: "当前状态",
            lastUpdated: "更新时间",
            note: "章节引文",
            value: "数值",
            label: "说明",
            eyebrow: "眉题",
            title: "标题",
            body: "正文",
            meta: "补充信息",
          },
        }
      : {
          title: "Scene layout",
          description:
            "Enable, disable, or move built-in objects, and upload new GLB assets. Disabling keeps the object definition and saved content intact.",
          selectAsset: "Choose a scene object to edit",
          existing: "Built-in · active",
          inactive: "Built-in · inactive",
          custom: "Custom asset",
          add: "Add new asset",
          limit: "Custom asset limit reached",
          placement: "Object transform",
          placementHelp:
            "Existing objects use offsets from their authored position. Rotation is in degrees; scale 1 keeps the original size.",
          dragPlacement: "Drag to place",
          dragPlacementActive: "Placing object",
          dragPlacementHelp:
            "Switch between floor, height, and heading drag modes in the room view; confirm or cancel before returning to the full numeric controls.",
          dragMode: "Drag mode",
          dragModes: {
            plane: {
              label: "Floor X / Z",
              help: "Drag along the floor to change X / Z only.",
            },
            height: {
              label: "Height Y",
              help: "Drag up or down to adjust height Y.",
            },
            rotation: {
              label: "Heading",
              help:
                "Drag around Y to change the heading; hold Shift to snap to 15°.",
            },
          },
          confirmPlacement: "Confirm all placement",
          cancelPlacement: "Cancel all previews",
          placementCoordinates: "Preview coordinates",
          reset: "Restore original placement",
          disableCore: "Disable object",
          enableCore: "Reactivate",
          disabledCoreHelp:
            "This built-in object is absent from the room, content index, and detail routes. Its code definition, page content, and placement remain saved.",
          disabledPlacementHelp:
            "Reactivate the object to continue dragging it or editing its coordinates.",
          replacement: "Replace built-in model",
          replacementHelp:
            "Uploading a GLB changes only the room appearance. The original ID, bilingual content, interaction, and placement remain intact; unlink it to restore the code-native object.",
          model: "3D model",
          modelHelp:
            "Upload your own GLB model. A placeholder remains visible when no model is attached or loading fails.",
          settings: "Asset settings",
          behavior: "Asset purpose",
          decorative: "Decoration only — no page",
          interactive: "Interactive — opens a detail page",
          accent: "Accent color",
          transform: "Placement and size",
          transformHelp:
            "Custom assets use absolute room coordinates. Make small adjustments and check the live scene.",
          content: "Interactive page content",
          contentHelp:
            "Only interactive assets appear in the index, respond to hover, and open a detail page.",
          remove: "Remove custom asset",
          confirmRemove: "Click again to confirm removal",
          removeHelp:
            "Removing an asset only clears its configuration; an uploaded GLB remains in the project.",
          metrics: "Metrics",
          entries: "Content cards",
          addMetric: "Add metric",
          addEntry: "Add card",
          removeItem: "Remove",
          fields: {
            objectLabel: "Object name",
            sectionTitle: "Chapter title",
            trait: "Represented trait",
            teaser: "Index summary",
            intro: "Chapter introduction",
            status: "Current status",
            lastUpdated: "Last updated",
            note: "Chapter quote",
            value: "Value",
            label: "Label",
            eyebrow: "Eyebrow",
            title: "Title",
            body: "Body",
            meta: "Metadata",
          },
        };

  const coreAssets = useMemo(
    () => assets.filter(isCorePortfolioAsset),
    [assets],
  );
  const customAssets = useMemo(
    () => config.scene?.customAssets ?? [],
    [config.scene?.customAssets],
  );
  const disabledCoreAssetIds = useMemo(
    () => new Set(config.scene?.disabledCoreAssets ?? []),
    [config.scene?.disabledCoreAssets],
  );
  const allIds = useMemo<string[]>(
    () => [
      ...coreAssets.map((asset) => asset.id),
      ...customAssets.map((asset) => asset.id),
    ],
    [coreAssets, customAssets],
  );
  const placeableIds = useMemo<string[]>(
    () => [
      ...coreAssets
        .filter((asset) => !disabledCoreAssetIds.has(asset.id))
        .map((asset) => asset.id),
      ...customAssets.map((asset) => asset.id),
    ],
    [coreAssets, customAssets, disabledCoreAssetIds],
  );
  const [selectedId, setSelectedId] = useState<string>(
    () => allIds[0] ?? "music",
  );
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(
    null,
  );
  const placementStartRef = useRef<HTMLButtonElement>(null);
  const previousPlacementIdRef = useRef<string | null>(null);
  const effectiveSelectedId = allIds.includes(selectedId)
    ? selectedId
    : (allIds[0] ?? "music");
  const placementIsActive =
    placementEdit?.assetId === effectiveSelectedId;

  const selectedCoreAsset = coreAssets.find(
    (asset) => asset.id === effectiveSelectedId,
  );
  const selectedCoreId =
    selectedCoreAsset && isAssetId(selectedCoreAsset.id)
      ? selectedCoreAsset.id
      : undefined;
  const selectedCoreEnabled = selectedCoreId
    ? isCoreSceneAssetEnabled(config.scene, selectedCoreId)
    : false;
  const selectedCustomAsset = customAssets.find(
    (asset) => asset.id === effectiveSelectedId,
  );

  useEffect(() => {
    if (!pendingRemovalId) return;
    const timeout = window.setTimeout(() => setPendingRemovalId(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [pendingRemovalId]);

  useEffect(() => {
    if (placementEdit && !placeableIds.includes(placementEdit.assetId)) {
      onPlacementEditCancel();
    }
  }, [onPlacementEditCancel, placeableIds, placementEdit]);

  useEffect(() => {
    const previousPlacementId = previousPlacementIdRef.current;
    previousPlacementIdRef.current = placementEdit?.assetId ?? null;
    if (
      !previousPlacementId ||
      placementEdit ||
      previousPlacementId !== effectiveSelectedId
    ) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        activeElement !== document.body &&
        activeElement.isConnected
      ) {
        return;
      }
      placementStartRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [effectiveSelectedId, placementEdit]);

  const selectAsset = (assetId: string) => {
    setPendingRemovalId(null);
    if (placementEdit && placementEdit.assetId !== assetId) {
      onPlacementEditCancel();
    }
    setSelectedId(assetId);
  };

  const updateCorePlacement = (
    id: CoreAssetId,
    key: TransformKey,
    value: SceneVector3,
  ) => {
    onChange((current) => ({
      ...current,
      scene: {
        ...current.scene,
        placements: {
          ...current.scene?.placements,
          [id]: {
            ...current.scene?.placements?.[id],
            [key]: value,
          },
        },
      },
    }));
  };

  const resetCorePlacement = (id: CoreAssetId) => {
    if (placementEdit?.assetId === id) onPlacementEditCancel();
    onChange((current) => {
      const placements = { ...current.scene?.placements };
      delete placements[id];
      return {
        ...current,
        scene: {
          ...current.scene,
          placements,
        },
      };
    });
  };

  const setCoreAssetEnabled = (id: CoreAssetId, enabled: boolean) => {
    if (!enabled && placementEdit?.assetId === id) {
      onPlacementEditCancel();
    }
    onChange((current) => {
      const disabledIds = new Set(
        current.scene?.disabledCoreAssets ?? [],
      );
      if (enabled) disabledIds.delete(id);
      else disabledIds.add(id);

      return {
        ...current,
        scene: {
          ...current.scene,
          disabledCoreAssets: CONTENT_ASSET_IDS.filter((assetId) =>
            disabledIds.has(assetId),
          ),
        },
      };
    });
  };

  const updateCoreAssetModel = (
    id: CoreAssetId,
    modelSrc: string | undefined,
  ) => {
    onChange((current) => {
      const coreAssetModels = {
        ...current.scene?.coreAssetModels,
      };
      if (modelSrc) coreAssetModels[id] = modelSrc;
      else delete coreAssetModels[id];

      return {
        ...current,
        scene: {
          ...current.scene,
          coreAssetModels,
        },
      };
    });
  };

  const updateCustomAsset = (
    id: CustomSceneAsset["id"],
    updater: (asset: CustomSceneAsset) => CustomSceneAsset,
  ) => {
    onChange((current) => ({
      ...current,
      scene: {
        ...current.scene,
        customAssets: (current.scene?.customAssets ?? []).map((asset) =>
          asset.id === id ? updater(asset) : asset,
        ),
      },
    }));
  };

  const addCustomAsset = () => {
    if (customAssets.length >= CONTENT_LIMITS.scene.customAssets) return;
    if (placementEdit) onPlacementEditCancel();
    const asset = createDefaultCustomAsset();
    onChange((current) => ({
      ...current,
      scene: {
        ...current.scene,
        customAssets: [...(current.scene?.customAssets ?? []), asset],
      },
    }));
    setPendingRemovalId(null);
    setSelectedId(asset.id);
  };

  const removeCustomAsset = (id: CustomSceneAsset["id"]) => {
    if (placementEdit?.assetId === id) onPlacementEditCancel();
    setPendingRemovalId(null);
    onChange((current) => ({
      ...current,
      scene: {
        ...current.scene,
        customAssets: (current.scene?.customAssets ?? []).filter(
          (asset) => asset.id !== id,
        ),
      },
    }));
  };

  const corePlacement: ScenePlacement | undefined = selectedCoreId
    ? config.scene?.placements?.[selectedCoreId]
    : undefined;
  const coreModelSrc = selectedCoreId
    ? config.scene?.coreAssetModels?.[selectedCoreId]
    : undefined;
  const coreTransform: SceneTransform = {
    position: cloneVector(
      placementIsActive && placementEdit
        ? placementEdit.position
        : (corePlacement?.position ?? DEFAULT_SCENE_TRANSFORM.position),
    ),
    rotation: cloneVector(
      placementIsActive && placementEdit
        ? placementEdit.rotation
        : (corePlacement?.rotation ?? DEFAULT_SCENE_TRANSFORM.rotation),
    ),
    scale: cloneVector(
      corePlacement?.scale ?? DEFAULT_SCENE_TRANSFORM.scale,
    ),
  };
  const customTransform: SceneTransform | undefined = selectedCustomAsset
    ? {
        ...selectedCustomAsset.transform,
        position: cloneVector(
          placementIsActive && placementEdit
            ? placementEdit.position
            : selectedCustomAsset.transform.position,
        ),
        rotation: cloneVector(
          placementIsActive && placementEdit
            ? placementEdit.rotation
            : selectedCustomAsset.transform.rotation,
        ),
      }
    : undefined;

  const customContent = selectedCustomAsset?.content[locale] ?? {};
  const customMetrics = customContent.metrics ?? [];
  const customEntries = customContent.entries ?? [];

  const updateCustomContent = (
    id: CustomSceneAsset["id"],
    patch: AssetContentOverride,
  ) => {
    updateCustomAsset(id, (asset) => ({
      ...asset,
      content: {
        ...asset.content,
        [locale]: {
          ...asset.content[locale],
          ...patch,
        },
      },
    }));
  };

  const renderPlacementToolbar = (
    assetId: string,
    disabled = false,
  ) => {
    const active = !disabled && placementEdit?.assetId === assetId;
    return (
      <div
        className={`studio-placement-toolbar ${
          active ? "is-active" : ""
        } ${disabled ? "is-disabled" : ""}`}
      >
        <div
          className="studio-placement-status"
          role="status"
          aria-live="polite"
        >
          <strong>
            {disabled
              ? copy.inactive
              : active
                ? copy.dragPlacementActive
                : copy.dragPlacement}
          </strong>
          <p>
            {disabled
              ? copy.disabledPlacementHelp
              : active
              ? copy.dragModes[placementEdit.mode].help
              : copy.dragPlacementHelp}
          </p>
          {active && (
            <code
              className="studio-placement-coordinates"
              aria-label={copy.placementCoordinates}
            >
              <span
                className={
                  placementEdit.mode === "plane" ? "is-affected" : ""
                }
              >
                X {placementEdit.position[0].toFixed(2)}
              </span>
              <span
                className={
                  placementEdit.mode === "height" ? "is-affected" : ""
                }
              >
                Y {placementEdit.position[1].toFixed(2)}
              </span>
              <span
                className={
                  placementEdit.mode === "plane" ? "is-affected" : ""
                }
              >
                Z {placementEdit.position[2].toFixed(2)}
              </span>
              <span
                className={
                  placementEdit.mode === "rotation" ? "is-affected" : ""
                }
              >
                Ry {placementEdit.rotation[1].toFixed(1)}°
              </span>
            </code>
          )}
        </div>
        {active && (
          <div
            className="studio-placement-modes"
            role="group"
            aria-label={copy.dragMode}
          >
            {(
              ["plane", "height", "rotation"] as const satisfies readonly ScenePlacementMode[]
            ).map((mode) => (
              <button
                key={mode}
                type="button"
                className={placementEdit.mode === mode ? "is-active" : ""}
                aria-pressed={placementEdit.mode === mode}
                onClick={() => onPlacementModeChange(mode)}
              >
                {copy.dragModes[mode].label}
              </button>
            ))}
          </div>
        )}
        <div className="studio-placement-actions">
          {active ? (
            <>
              <button
                type="button"
                className="studio-placement-confirm"
                onClick={onPlacementEditConfirm}
              >
                {copy.confirmPlacement}
              </button>
              <button
                type="button"
                className="studio-placement-cancel"
                onClick={onPlacementEditCancel}
              >
                {copy.cancelPlacement}
              </button>
            </>
          ) : (
            <button
              ref={placementStartRef}
              type="button"
              className="studio-placement-start"
              disabled={disabled}
              onClick={() => onPlacementEditStart(assetId)}
            >
              {copy.dragPlacement}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="studio-scene-editor">
      <StudioSection
        title={copy.title}
        description={copy.description}
        actions={
          <button
            type="button"
            className="studio-add-button"
            disabled={
              customAssets.length >= CONTENT_LIMITS.scene.customAssets
            }
            title={
              customAssets.length >= CONTENT_LIMITS.scene.customAssets
                ? copy.limit
                : undefined
            }
            onClick={addCustomAsset}
          >
            + {copy.add}
          </button>
        }
      >
        <div
          className="studio-scene-selector"
          role="group"
          aria-label={copy.selectAsset}
        >
          {coreAssets.map((asset) => {
            const enabled = !disabledCoreAssetIds.has(asset.id);
            return (
              <button
                type="button"
                aria-pressed={effectiveSelectedId === asset.id}
                className={[
                  effectiveSelectedId === asset.id ? "is-active" : "",
                  placementEdit?.assetId === asset.id
                    ? "is-placement-target"
                    : "",
                  enabled ? "" : "is-inactive",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={asset.id}
                onClick={() => selectAsset(asset.id)}
              >
                <span>{asset.number}</span>
                <strong>{asset.objectLabel}</strong>
                <small>{enabled ? copy.existing : copy.inactive}</small>
                <i style={{ background: asset.accent }} aria-hidden="true" />
              </button>
            );
          })}
          {customAssets.map((asset, index) => (
            <button
              type="button"
              aria-pressed={effectiveSelectedId === asset.id}
              className={[
                effectiveSelectedId === asset.id ? "is-active" : "",
                placementEdit?.assetId === asset.id
                  ? "is-placement-target"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={asset.id}
              onClick={() => selectAsset(asset.id)}
            >
              <span>
                {asset.behavior === "interactive"
                  ? String(
                      coreAssets.length +
                        customAssets
                          .slice(0, index + 1)
                          .filter(
                            (item) => item.behavior === "interactive",
                          ).length,
                    ).padStart(2, "0")
                  : `D${String(index + 1).padStart(2, "0")}`}
              </span>
              <strong>
                {asset.content[locale]?.objectLabel ||
                  asset.content.zh?.objectLabel ||
                  asset.content.en?.objectLabel ||
                  copy.custom}
              </strong>
              <small>
                {asset.behavior === "interactive"
                  ? copy.interactive
                  : copy.decorative}
              </small>
              <i style={{ background: asset.accent }} aria-hidden="true" />
            </button>
          ))}
        </div>
      </StudioSection>

      {selectedCoreAsset && selectedCoreId && (
        <>
          <StudioSection
            title={`${selectedCoreAsset.objectLabel} · ${copy.placement}`}
            description={
              selectedCoreEnabled
                ? copy.placementHelp
                : copy.disabledCoreHelp
            }
            actions={
              <div className="studio-section-actions">
                <button
                  type="button"
                  className="studio-reset-button"
                  onClick={() => resetCorePlacement(selectedCoreId)}
                >
                  {copy.reset}
                </button>
                <button
                  type="button"
                  className={`studio-core-visibility-button ${
                    selectedCoreEnabled ? "is-disable" : "is-enable"
                  }`}
                  aria-label={`${
                    selectedCoreEnabled
                      ? copy.disableCore
                      : copy.enableCore
                  }：${selectedCoreAsset.objectLabel}`}
                  onClick={() =>
                    setCoreAssetEnabled(
                      selectedCoreId,
                      !selectedCoreEnabled,
                    )
                  }
                >
                  {selectedCoreEnabled
                    ? copy.disableCore
                    : copy.enableCore}
                </button>
              </div>
            }
          >
            {renderPlacementToolbar(
              selectedCoreId,
              !selectedCoreEnabled,
            )}
            <TransformEditor
              transform={coreTransform}
              relative
              locale={locale}
              disabled={placementIsActive || !selectedCoreEnabled}
              onChange={(key, value) =>
                updateCorePlacement(selectedCoreId, key, value)
              }
            />
          </StudioSection>

          <StudioSection
            title={copy.replacement}
            description={copy.replacementHelp}
          >
            <ModelUploadField
              locale={locale}
              label={copy.replacement}
              description={copy.replacementHelp}
              value={coreModelSrc}
              disabled={!projectWritable}
              purpose="core-replacement"
              sceneActive={selectedCoreEnabled}
              loadState={modelLoadStates[selectedCoreId]}
              onUploaded={(modelSrc) =>
                updateCoreAssetModel(selectedCoreId, modelSrc)
              }
              onClear={() =>
                updateCoreAssetModel(selectedCoreId, undefined)
              }
            />
          </StudioSection>
        </>
      )}

      {selectedCustomAsset && (
        <>
          <StudioSection
            title={copy.settings}
            description={
              selectedCustomAsset.behavior === "interactive"
                ? copy.contentHelp
                : copy.decorative
            }
          >
            <div className="studio-field-grid">
              <TextField
                label={copy.fields.objectLabel}
                value={customContent.objectLabel ?? ""}
                onChange={(objectLabel) =>
                  updateCustomContent(selectedCustomAsset.id, {
                    objectLabel,
                  })
                }
              />
              <label className="studio-field">
                <span>{copy.behavior}</span>
                <select
                  value={selectedCustomAsset.behavior}
                  onChange={(event) =>
                    updateCustomAsset(selectedCustomAsset.id, (asset) => ({
                      ...asset,
                      behavior: event.target.value as CustomSceneAsset["behavior"],
                    }))
                  }
                >
                  <option value="decorative">{copy.decorative}</option>
                  <option value="interactive">{copy.interactive}</option>
                </select>
              </label>
              <label className="studio-field studio-color-field">
                <span>{copy.accent}</span>
                <div>
                  <input
                    type="color"
                    value={selectedCustomAsset.accent}
                    onChange={(event) =>
                      updateCustomAsset(selectedCustomAsset.id, (asset) => ({
                        ...asset,
                        accent: event.target.value,
                      }))
                    }
                  />
                  <code>{selectedCustomAsset.accent.toUpperCase()}</code>
                </div>
              </label>
            </div>
          </StudioSection>

          <StudioSection title={copy.model} description={copy.modelHelp}>
            <ModelUploadField
              locale={locale}
              label={copy.model}
              description={copy.modelHelp}
              value={selectedCustomAsset.modelSrc}
              disabled={!projectWritable}
              loadState={modelLoadStates[selectedCustomAsset.id]}
              onUploaded={(modelSrc) =>
                updateCustomAsset(selectedCustomAsset.id, (asset) => ({
                  ...asset,
                  modelSrc,
                }))
              }
              onClear={() =>
                updateCustomAsset(selectedCustomAsset.id, (asset) => {
                  const next = { ...asset };
                  delete next.modelSrc;
                  return next;
                })
              }
            />
          </StudioSection>

          <StudioSection title={copy.transform} description={copy.transformHelp}>
            {renderPlacementToolbar(selectedCustomAsset.id)}
            {customTransform && (
              <TransformEditor
                transform={customTransform}
                relative={false}
                locale={locale}
                disabled={placementIsActive}
                onChange={(key, value) =>
                  updateCustomAsset(selectedCustomAsset.id, (asset) => ({
                    ...asset,
                    transform: {
                      ...asset.transform,
                      [key]: value,
                    },
                  }))
                }
              />
            )}
          </StudioSection>

          {selectedCustomAsset.behavior === "interactive" && (
            <>
              <StudioSection title={copy.content} description={copy.contentHelp}>
                <div className="studio-field-grid">
                  {ASSET_TEXT_KEYS.map((key) => (
                    <TextField
                      key={key}
                      label={copy.fields[key]}
                      value={customContent[key] ?? ""}
                      onChange={(value) =>
                        updateCustomContent(selectedCustomAsset.id, {
                          [key]: value,
                        })
                      }
                      multiline={
                        key === "trait" ||
                        key === "teaser" ||
                        key === "intro" ||
                        key === "note"
                      }
                      wide={
                        key === "trait" ||
                        key === "teaser" ||
                        key === "intro" ||
                        key === "note"
                      }
                    />
                  ))}
                </div>
              </StudioSection>

              <StudioSection title={copy.metrics}>
                <div className="studio-repeater">
                  {customMetrics.map((metric, index) => (
                    <div
                      className="studio-repeater-item"
                      key={`custom-metric-${index}`}
                    >
                      <span className="studio-repeater-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="studio-repeater-row">
                        <TextField
                          label={copy.fields.value}
                          value={metric.value}
                          onChange={(value) =>
                            updateCustomContent(selectedCustomAsset.id, {
                              metrics: customMetrics.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <TextField
                          label={copy.fields.label}
                          value={metric.label}
                          onChange={(label) =>
                            updateCustomContent(selectedCustomAsset.id, {
                              metrics: customMetrics.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, label }
                                  : item,
                              ),
                            })
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="studio-remove-button"
                        onClick={() =>
                          updateCustomContent(selectedCustomAsset.id, {
                            metrics: customMetrics.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          })
                        }
                      >
                        {copy.removeItem}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="studio-add-button"
                    disabled={
                      customMetrics.length >= CONTENT_LIMITS.asset.metrics
                    }
                    onClick={() =>
                      updateCustomContent(selectedCustomAsset.id, {
                        metrics: [
                          ...customMetrics,
                          { value: "—", label: copy.fields.label },
                        ],
                      })
                    }
                  >
                    + {copy.addMetric}
                  </button>
                </div>
              </StudioSection>

              <StudioSection title={copy.entries}>
                <ContentCardListEditor
                  key={`${locale}-${selectedCustomAsset.id}`}
                  locale={locale}
                  entries={customEntries}
                  projectWritable={projectWritable}
                  onChange={(entries) =>
                    updateCustomContent(selectedCustomAsset.id, {
                      entries,
                    })
                  }
                />
              </StudioSection>
            </>
          )}

          <StudioSection
            title={copy.remove}
            description={copy.removeHelp}
            actions={
              <button
                type="button"
                className="studio-remove-button studio-scene-delete"
                onClick={() => {
                  if (pendingRemovalId === selectedCustomAsset.id) {
                    removeCustomAsset(selectedCustomAsset.id);
                  } else {
                    setPendingRemovalId(selectedCustomAsset.id);
                  }
                }}
              >
                {pendingRemovalId === selectedCustomAsset.id
                  ? copy.confirmRemove
                  : copy.remove}
              </button>
            }
          >
            <span className="studio-media-path">
              {selectedCustomAsset.id}
            </span>
          </StudioSection>
        </>
      )}
    </div>
  );
}
