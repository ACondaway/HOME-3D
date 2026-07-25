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
  CONTENT_LIMITS,
  DEFAULT_SCENE_TRANSFORM,
  SCENE_TRANSFORM_LIMITS,
  type AssetContentOverride,
  type ContentLocale,
  type CustomSceneAsset,
  type ScenePlacement,
  type SceneTransform,
  type SceneVector3,
  type SiteContentConfig,
} from "./content-config";
import { ModelUploadField } from "./ModelUploadField";
import {
  isAssetId,
  type CoreAssetId,
  type PortfolioAsset,
} from "./portfolio-data";

interface SceneStudioProps {
  locale: ContentLocale;
  config: SiteContentConfig;
  assets: PortfolioAsset[];
  projectWritable: boolean;
  onChange: Dispatch<SetStateAction<SiteContentConfig>>;
}

type TransformKey = keyof SceneTransform;
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
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
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
  onChange,
}: {
  transform: SceneTransform;
  relative: boolean;
  locale: ContentLocale;
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
  onChange,
}: SceneStudioProps) {
  const copy =
    locale === "zh"
      ? {
          title: "场景布局",
          description:
            "移动现有物件，或上传 GLB 新资产。修改会实时应用；关闭工作台即可检查完整房间。",
          selectAsset: "选择要编辑的场景物件",
          existing: "现有物件",
          custom: "自定义资产",
          add: "添加新资产",
          limit: "已达到自定义资产上限",
          placement: "物件变换",
          placementHelp:
            "现有物件使用相对原始位置的偏移；旋转单位为度，缩放 1 表示保持原尺寸。",
          reset: "恢复原始位置",
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
            "Move existing objects or upload new GLB assets. Changes apply live; close the Studio to inspect the full room.",
          selectAsset: "Choose a scene object to edit",
          existing: "Existing object",
          custom: "Custom asset",
          add: "Add new asset",
          limit: "Custom asset limit reached",
          placement: "Object transform",
          placementHelp:
            "Existing objects use offsets from their authored position. Rotation is in degrees; scale 1 keeps the original size.",
          reset: "Restore original placement",
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
    () => assets.filter((asset) => isAssetId(asset.id)),
    [assets],
  );
  const customAssets = useMemo(
    () => config.scene?.customAssets ?? [],
    [config.scene?.customAssets],
  );
  const allIds = useMemo(
    () => [
      ...coreAssets.map((asset) => asset.id),
      ...customAssets.map((asset) => asset.id),
    ],
    [coreAssets, customAssets],
  );
  const [selectedId, setSelectedId] = useState<string>(
    () => allIds[0] ?? "music",
  );
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(
    null,
  );
  const effectiveSelectedId = allIds.includes(selectedId)
    ? selectedId
    : (allIds[0] ?? "music");

  const selectedCoreAsset = coreAssets.find(
    (asset) => asset.id === effectiveSelectedId,
  );
  const selectedCoreId =
    selectedCoreAsset && isAssetId(selectedCoreAsset.id)
      ? selectedCoreAsset.id
      : undefined;
  const selectedCustomAsset = customAssets.find(
    (asset) => asset.id === effectiveSelectedId,
  );

  useEffect(() => {
    if (!pendingRemovalId) return;
    const timeout = window.setTimeout(() => setPendingRemovalId(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [pendingRemovalId]);

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
  const coreTransform: SceneTransform = {
    position: cloneVector(
      corePlacement?.position ?? DEFAULT_SCENE_TRANSFORM.position,
    ),
    rotation: cloneVector(
      corePlacement?.rotation ?? DEFAULT_SCENE_TRANSFORM.rotation,
    ),
    scale: cloneVector(
      corePlacement?.scale ?? DEFAULT_SCENE_TRANSFORM.scale,
    ),
  };

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
          {coreAssets.map((asset) => (
            <button
              type="button"
              aria-pressed={effectiveSelectedId === asset.id}
              className={
                effectiveSelectedId === asset.id ? "is-active" : ""
              }
              key={asset.id}
              onClick={() => {
                setPendingRemovalId(null);
                setSelectedId(asset.id);
              }}
            >
              <span>{asset.number}</span>
              <strong>{asset.objectLabel}</strong>
              <small>{copy.existing}</small>
              <i style={{ background: asset.accent }} aria-hidden="true" />
            </button>
          ))}
          {customAssets.map((asset, index) => (
            <button
              type="button"
              aria-pressed={effectiveSelectedId === asset.id}
              className={
                effectiveSelectedId === asset.id ? "is-active" : ""
              }
              key={asset.id}
              onClick={() => {
                setPendingRemovalId(null);
                setSelectedId(asset.id);
              }}
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
        <StudioSection
          title={`${selectedCoreAsset.objectLabel} · ${copy.placement}`}
          description={copy.placementHelp}
          actions={
            <button
              type="button"
              className="studio-remove-button"
              onClick={() => resetCorePlacement(selectedCoreId)}
            >
              {copy.reset}
            </button>
          }
        >
          <TransformEditor
            transform={coreTransform}
            relative
            locale={locale}
            onChange={(key, value) =>
              updateCorePlacement(selectedCoreId, key, value)
            }
          />
        </StudioSection>
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
            <TransformEditor
              transform={selectedCustomAsset.transform}
              relative={false}
              locale={locale}
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
                <div className="studio-repeater">
                  {customEntries.map((entry, index) => (
                    <div
                      className="studio-repeater-item is-entry"
                      key={entry.id ?? `custom-entry-${index}`}
                    >
                      <span className="studio-repeater-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="studio-field-grid">
                        {(
                          ["eyebrow", "title", "body", "meta"] as const
                        ).map((key) => (
                          <TextField
                            key={key}
                            label={copy.fields[key]}
                            value={entry[key]}
                            multiline={key === "body"}
                            wide={key === "body"}
                            onChange={(value) =>
                              updateCustomContent(selectedCustomAsset.id, {
                                entries: customEntries.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, [key]: value }
                                      : item,
                                ),
                              })
                            }
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        className="studio-remove-button"
                        onClick={() =>
                          updateCustomContent(selectedCustomAsset.id, {
                            entries: customEntries.filter(
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
                      customEntries.length >= CONTENT_LIMITS.asset.entries
                    }
                    onClick={() =>
                      updateCustomContent(selectedCustomAsset.id, {
                        entries: [
                          ...customEntries,
                          {
                            eyebrow: "NEW",
                            title:
                              locale === "zh" ? "新的内容卡片" : "New card",
                            body: "",
                            meta: "",
                          },
                        ],
                      })
                    }
                  >
                    + {copy.addEntry}
                  </button>
                </div>
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
