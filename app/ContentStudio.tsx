"use client";

import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  parseSiteContent,
  type ContentLocale,
  type ProfileContent,
  type SiteContentConfig,
} from "./content-config";
import type { AssetId, PortfolioAsset } from "./portfolio-data";

export interface ContentStudioProps {
  open: boolean;
  locale: ContentLocale;
  config: SiteContentConfig;
  profile: ProfileContent;
  assets: PortfolioAsset[];
  onChange: (config: SiteContentConfig) => void;
  onLocaleChange: (locale: ContentLocale) => void;
  onClose: () => void;
  onReset?: () => void;
  onProjectSaved?: (config: SiteContentConfig) => void;
}

type StudioSection = "profile" | "assets";
type ProfileKey = keyof ProfileContent;
type AssetTextKey =
  | "objectLabel"
  | "sectionTitle"
  | "trait"
  | "teaser"
  | "intro"
  | "status"
  | "lastUpdated"
  | "note";

const TEXT = {
  zh: {
    eyebrow: "本地内容管理",
    title: "内容工作台",
    description: "修改后会立即显示在房间中；草稿自动保存在这台设备。",
    profile: "个人主页",
    assets: "数字资产",
    currentLanguage: "当前编辑语言",
    import: "导入",
    export: "导出",
    copy: "复制 JSON",
    save: "保存到项目",
    saving: "正在保存",
    saved: "已写入项目",
    localOnly: "线上模式仅支持导入与导出",
    reset: "重置草稿",
    confirmReset: "再次点击确认",
    close: "关闭内容工作台",
    imported: "JSON 已导入",
    exported: "JSON 已导出",
    copied: "JSON 已复制",
    invalid: "文件不是有效的内容配置",
    saveFailed: "无法写入项目，请改用导出",
    identity: "身份与首屏",
    identityHelp: "这些字段驱动首屏、房间标志和左下角位置。",
    assetHelp: "选择房间物件，编辑访客进入后看到的章节内容。",
    metrics: "数据指标",
    entries: "内容卡片",
    addMetric: "添加指标",
    addEntry: "添加卡片",
    remove: "移除",
    fields: {
      displayName: "展示名称",
      logoInitial: "标志字母",
      personalSpace: "品牌副标题",
      introEyebrow: "首屏眉题",
      introTitle: "首屏主标题",
      introTitleEm: "首屏强调标题",
      introDescription: "首屏介绍",
      quote: "首屏引文",
      city: "城市",
      timezone: "时区（IANA，例如 Asia/Shanghai）",
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
  },
  en: {
    eyebrow: "LOCAL CONTENT MANAGEMENT",
    title: "Content Studio",
    description:
      "Changes appear in the room immediately; drafts are saved on this device.",
    profile: "Profile",
    assets: "Digital assets",
    currentLanguage: "Editing language",
    import: "Import",
    export: "Export",
    copy: "Copy JSON",
    save: "Save to project",
    saving: "Saving",
    saved: "Written to project",
    localOnly: "Production mode supports import and export only",
    reset: "Reset draft",
    confirmReset: "Click again to confirm",
    close: "Close Content Studio",
    imported: "JSON imported",
    exported: "JSON exported",
    copied: "JSON copied",
    invalid: "That file is not a valid content configuration",
    saveFailed: "Could not write to the project; export instead",
    identity: "Identity and intro",
    identityHelp:
      "These fields drive the intro, room wordmark, and location label.",
    assetHelp:
      "Choose an object and edit the chapter visitors see when they enter.",
    metrics: "Metrics",
    entries: "Content cards",
    addMetric: "Add metric",
    addEntry: "Add card",
    remove: "Remove",
    fields: {
      displayName: "Display name",
      logoInitial: "Logo initial",
      personalSpace: "Brand subtitle",
      introEyebrow: "Intro eyebrow",
      introTitle: "Intro title",
      introTitleEm: "Emphasis title",
      introDescription: "Intro description",
      quote: "Intro quote",
      city: "City",
      timezone: "Timezone (IANA, e.g. Asia/Shanghai)",
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
  },
} as const;

function Field({
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="studio-section">
      <header className="studio-section-header">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export function ContentStudio({
  open,
  locale,
  config,
  profile,
  assets,
  onChange,
  onLocaleChange,
  onClose,
  onReset,
  onProjectSaved,
}: ContentStudioProps) {
  const text = TEXT[locale];
  const [section, setSection] = useState<StudioSection>("profile");
  const [selectedId, setSelectedId] = useState<AssetId>("music");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [projectWritable, setProjectWritable] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedId) ?? assets[0],
    [assets, selectedId],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetch("/__content-studio/save", {
      method: "GET",
      cache: "no-store",
    })
      .then((response) => {
        if (!cancelled) setProjectWritable(response.ok);
      })
      .catch(() => {
        if (!cancelled) setProjectWritable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!resetArmed) return;
    const timeout = window.setTimeout(() => setResetArmed(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [resetArmed]);

  if (!open) return null;

  const updateProfile = (key: ProfileKey, value: string) => {
    onChange({
      ...config,
      profile: {
        ...config.profile,
        [locale]: {
          ...config.profile[locale],
          [key]: value,
        },
      },
    });
  };

  const updateAsset = (
    id: AssetId,
    patch: NonNullable<
      NonNullable<SiteContentConfig["assets"][ContentLocale]>[AssetId]
    >,
  ) => {
    onChange({
      ...config,
      assets: {
        ...config.assets,
        [locale]: {
          ...config.assets[locale],
          [id]: {
            ...config.assets[locale]?.[id],
            ...patch,
          },
        },
      },
    });
  };

  const exportJson = () => {
    const blob = new Blob([`${JSON.stringify(config, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "site-content.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(text.exported);
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setStatus(text.copied);
    } catch {
      setStatus(text.saveFailed);
    }
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      onChange(parseSiteContent(await file.text()));
      setStatus(text.imported);
    } catch {
      setStatus(text.invalid);
    }
  };

  const saveProject = async () => {
    setSaving(true);
    setStatus("");
    try {
      const normalized = parseSiteContent(config);
      const response = await fetch("/__content-studio/save", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });
      if (!response.ok) throw new Error("save failed");
      onChange(normalized);
      onProjectSaved?.(normalized);
      setStatus(text.saved);
    } catch {
      setStatus(text.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const resetDraft = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    onReset?.();
    setResetArmed(false);
    setStatus("");
  };

  return (
    <section
      className="studio-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-studio-title"
    >
      <article className="studio-panel">
        <header className="studio-header">
          <div className="studio-brand">
            <p>{text.eyebrow}</p>
            <h2 id="content-studio-title">{text.title}</h2>
            <span>{text.description}</span>
          </div>
          <div className="studio-header-controls">
            <div
              className="studio-language-switch"
              aria-label={text.currentLanguage}
            >
              <button
                type="button"
                className={locale === "zh" ? "is-active" : ""}
                onClick={() => onLocaleChange("zh")}
                aria-pressed={locale === "zh"}
              >
                中文
              </button>
              <button
                type="button"
                className={locale === "en" ? "is-active" : ""}
                onClick={() => onLocaleChange("en")}
                aria-pressed={locale === "en"}
              >
                English
              </button>
            </div>
            <button
              type="button"
              className="studio-close-button"
              onClick={onClose}
              aria-label={text.close}
              autoFocus
            >
              <span aria-hidden="true">×</span>
              <small>ESC</small>
            </button>
          </div>
        </header>

        <div className="studio-toolbar">
          <div className="studio-toolbar-group">
            <button type="button" onClick={() => importRef.current?.click()}>
              {text.import}
            </button>
            <button type="button" onClick={exportJson}>
              {text.export}
            </button>
            <button type="button" onClick={() => void copyJson()}>
              {text.copy}
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="studio-visually-hidden"
              onChange={(event) => void importJson(event)}
            />
          </div>
          <div className="studio-toolbar-group">
            {status && (
              <span className="studio-status" role="status">
                {status}
              </span>
            )}
            <button
              type="button"
              className="studio-danger-button"
              onClick={resetDraft}
              disabled={!onReset}
            >
              {resetArmed ? text.confirmReset : text.reset}
            </button>
            <button
              type="button"
              className="studio-save-button"
              onClick={() => void saveProject()}
              disabled={!projectWritable || saving}
              title={projectWritable ? undefined : text.localOnly}
            >
              {saving ? text.saving : text.save}
            </button>
          </div>
        </div>

        {!projectWritable && (
          <p className="studio-local-note">{text.localOnly}</p>
        )}

        <div className="studio-layout">
          <aside className="studio-sidebar">
            <nav className="studio-nav" aria-label={text.title}>
              <button
                type="button"
                className={section === "profile" ? "is-active" : ""}
                onClick={() => setSection("profile")}
              >
                <span>01</span>
                <strong>{text.profile}</strong>
              </button>
              <button
                type="button"
                className={section === "assets" ? "is-active" : ""}
                onClick={() => setSection("assets")}
              >
                <span>02</span>
                <strong>{text.assets}</strong>
              </button>
            </nav>
            {section === "assets" && (
              <div className="studio-asset-list">
                {assets.map((asset) => (
                  <button
                    type="button"
                    key={asset.id}
                    className={asset.id === selectedId ? "is-active" : ""}
                    onClick={() => setSelectedId(asset.id)}
                  >
                    <span>{asset.number}</span>
                    <strong>{asset.objectLabel}</strong>
                    <small>{asset.sectionTitle}</small>
                    <i style={{ background: asset.accent }} aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </aside>

          <div className="studio-main">
            {section === "profile" && (
              <Section
                title={text.identity}
                description={text.identityHelp}
              >
                <div className="studio-field-grid">
                  {(
                    [
                      "displayName",
                      "logoInitial",
                      "personalSpace",
                      "introEyebrow",
                      "introTitle",
                      "introTitleEm",
                      "introDescription",
                      "quote",
                      "city",
                      "timezone",
                    ] as const
                  ).map((key) => (
                    <Field
                      key={key}
                      label={text.fields[key]}
                      value={profile[key]}
                      onChange={(value) => updateProfile(key, value)}
                      multiline={
                        key === "introDescription" || key === "quote"
                      }
                      wide={
                        key === "introDescription" ||
                        key === "quote" ||
                        key === "personalSpace" ||
                        key === "introEyebrow"
                      }
                    />
                  ))}
                </div>
              </Section>
            )}

            {section === "assets" && selectedAsset && (
              <div className="studio-asset-editor">
                <Section
                  title={`${selectedAsset.number} · ${selectedAsset.objectLabel}`}
                  description={text.assetHelp}
                >
                  <div className="studio-field-grid">
                    {(
                      [
                        "objectLabel",
                        "sectionTitle",
                        "trait",
                        "teaser",
                        "intro",
                        "status",
                        "lastUpdated",
                        "note",
                      ] as const satisfies readonly AssetTextKey[]
                    ).map((key) => (
                      <Field
                        key={key}
                        label={text.fields[key]}
                        value={selectedAsset[key]}
                        onChange={(value) =>
                          updateAsset(selectedAsset.id, { [key]: value })
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
                </Section>

                <Section title={text.metrics}>
                  <div className="studio-repeater">
                    {selectedAsset.metrics.map((metric, index) => (
                      <div className="studio-repeater-item" key={`metric-${index}`}>
                        <span className="studio-repeater-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="studio-repeater-row">
                          <Field
                            label={text.fields.value}
                            value={metric.value}
                            onChange={(value) => {
                              const metrics = selectedAsset.metrics.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, value }
                                    : item,
                              );
                              updateAsset(selectedAsset.id, { metrics });
                            }}
                          />
                          <Field
                            label={text.fields.label}
                            value={metric.label}
                            onChange={(label) => {
                              const metrics = selectedAsset.metrics.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, label }
                                    : item,
                              );
                              updateAsset(selectedAsset.id, { metrics });
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="studio-remove-button"
                          onClick={() =>
                            updateAsset(selectedAsset.id, {
                              metrics: selectedAsset.metrics.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            })
                          }
                        >
                          {text.remove}
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="studio-add-button"
                      onClick={() =>
                        updateAsset(selectedAsset.id, {
                          metrics: [
                            ...selectedAsset.metrics,
                            { value: "—", label: text.fields.label },
                          ],
                        })
                      }
                    >
                      + {text.addMetric}
                    </button>
                  </div>
                </Section>

                <Section title={text.entries}>
                  <div className="studio-repeater">
                    {selectedAsset.entries.map((entry, index) => (
                      <div className="studio-repeater-item is-entry" key={`entry-${index}`}>
                        <span className="studio-repeater-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="studio-field-grid">
                          {(
                            ["eyebrow", "title", "body", "meta"] as const
                          ).map((key) => (
                            <Field
                              key={key}
                              label={text.fields[key]}
                              value={entry[key]}
                              multiline={key === "body"}
                              wide={key === "body"}
                              onChange={(value) => {
                                const entries = selectedAsset.entries.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, [key]: value }
                                      : item,
                                );
                                updateAsset(selectedAsset.id, { entries });
                              }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          className="studio-remove-button"
                          onClick={() =>
                            updateAsset(selectedAsset.id, {
                              entries: selectedAsset.entries.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            })
                          }
                        >
                          {text.remove}
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="studio-add-button"
                      onClick={() =>
                        updateAsset(selectedAsset.id, {
                          entries: [
                            ...selectedAsset.entries,
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
                      + {text.addEntry}
                    </button>
                  </div>
                </Section>
              </div>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
