"use client";

import {
  type ChangeEvent,
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
  MAX_CONTENT_SAVE_BYTES,
  isValidSocialUrl,
  mergeAssets,
  mergeSocialLinks,
  parseSiteContent,
  resolvePhotographyEntryIds,
  type ContentLocale,
  type ProfileContent,
  type SiteContentConfig,
  type SocialLink,
  type SocialPlatform,
} from "./content-config";
import { ImageUploadField } from "./ImageUploadField";
import { SceneStudio } from "./SceneStudio";
import { SocialIcon } from "./SocialIcon";
import {
  PORTFOLIO_ASSETS,
  isAssetId,
  type CoreAssetId,
  type PortfolioAsset,
} from "./portfolio-data";
import { PORTFOLIO_ASSETS_EN } from "./portfolio-data-en";

export interface ContentStudioProps {
  open: boolean;
  locale: ContentLocale;
  config: SiteContentConfig;
  profile: ProfileContent;
  assets: PortfolioAsset[];
  onChange: Dispatch<SetStateAction<SiteContentConfig>>;
  onLocaleChange: (locale: ContentLocale) => void;
  onClose: () => void;
  onReset?: () => void;
  onProjectSaved?: (config: SiteContentConfig) => void;
}

type StudioSection = "profile" | "assets" | "scene";
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
type PortfolioEntry = PortfolioAsset["entries"][number];
type StablePhotographyEntry = PortfolioEntry & { id: string };

const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  "github",
  "linkedin",
  "instagram",
  "x",
  "youtube",
  "bilibili",
  "weibo",
  "website",
  "email",
];

function createStudioId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

const STUDIO_LOCALES = ["zh", "en"] as const satisfies readonly ContentLocale[];
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function withStablePhotographyIds(
  entries: readonly PortfolioEntry[],
): StablePhotographyEntry[] {
  const ids = resolvePhotographyEntryIds(entries);
  return entries.map((entry, index) => ({
    ...entry,
    id: ids[index]!,
  }));
}

function getPhotographyEntriesForLocale(
  config: SiteContentConfig,
  locale: ContentLocale,
): StablePhotographyEntry[] {
  const rawEntries = config.assets[locale]?.photography?.entries;
  const baseAssets =
    locale === "zh" ? PORTFOLIO_ASSETS : PORTFOLIO_ASSETS_EN;
  const mergedEntries = mergeAssets(baseAssets, locale, config).find(
    (asset) => asset.id === "photography",
  )?.entries;

  return withStablePhotographyIds(rawEntries ?? mergedEntries ?? []);
}

const TEXT = {
  zh: {
    eyebrow: "本地内容管理",
    title: "内容工作台",
    description: "修改后会立即显示在房间中；草稿自动保存在这台设备。",
    profile: "个人主页",
    assets: "数字资产",
    scene: "场景布局",
    previewScene: "场景预览",
    exitPreview: "退出预览",
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
    invalidSocial: "请先为每个社交链接填写有效地址",
    saveFailed: "无法写入项目，请改用导出",
    saveTooLarge: "内容超过本地保存上限，请删减长文本或内容卡片",
    identity: "身份与首屏",
    identityHelp: "这些字段驱动首屏、房间标志和左下角位置。",
    assetHelp: "选择房间物件，编辑访客进入后看到的章节内容。",
    aboutMedia: "个人照片与社交链接",
    aboutMediaHelp:
      "个人介绍继续使用上方“章节介绍”；照片与链接会排版在镜子页面的个人名片中。",
    portrait: "个人照片",
    portraitHelp: "拖动照片到上传区，或从设备中选择文件。",
    socialLinks: "社交媒体链接",
    addSocialLink: "添加社交链接",
    photographyEntries: "摄影相纸",
    photographyHelp:
      "所有照片都会展示；常规说明在打开相纸后显示，Spotlight 说明还会出现在专属介绍栏。",
    spotlight: "设为 Spotlight",
    spotlightHelp: "Spotlight 会在摄影页获得大图和专门的文字介绍栏。",
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
      timezone: "作者时区（例如 GMT+8 或 Asia/Shanghai）",
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
      portraitAlt: "个人照片替代文本",
      platform: "平台",
      url: "链接地址",
      socialLabel: "按钮文字",
      photoAlt: "照片替代文本",
    },
  },
  en: {
    eyebrow: "LOCAL CONTENT MANAGEMENT",
    title: "Content Studio",
    description:
      "Changes appear in the room immediately; drafts are saved on this device.",
    profile: "Profile",
    assets: "Digital assets",
    scene: "Scene layout",
    previewScene: "Preview scene",
    exitPreview: "Exit preview",
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
    invalidSocial: "Add a valid URL for every social link before saving",
    saveFailed: "Could not write to the project; export instead",
    saveTooLarge:
      "Content exceeds the local save limit; shorten long text or remove cards",
    identity: "Identity and intro",
    identityHelp:
      "These fields drive the intro, room wordmark, and location label.",
    assetHelp:
      "Choose an object and edit the chapter visitors see when they enter.",
    aboutMedia: "Portrait and social links",
    aboutMediaHelp:
      "The chapter introduction above remains your bio; the portrait and links form the profile card on the mirror page.",
    portrait: "Portrait photo",
    portraitHelp: "Drop a photo here or choose one from your device.",
    socialLinks: "Social links",
    addSocialLink: "Add social link",
    photographyEntries: "Instant photos",
    photographyHelp:
      "Every photo is displayed. Regular notes appear inside the instant photo, while the Spotlight note also appears in its own introduction column.",
    spotlight: "Set as Spotlight",
    spotlightHelp:
      "The Spotlight receives a large image and its own introduction column on the photography page.",
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
      timezone: "Author timezone (e.g. GMT+8 or Asia/Shanghai)",
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
      portraitAlt: "Portrait alternative text",
      platform: "Platform",
      url: "Link URL",
      socialLabel: "Button label",
      photoAlt: "Photo alternative text",
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
  const [selectedId, setSelectedId] = useState<CoreAssetId>("music");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [projectWritable, setProjectWritable] = useState(false);
  const [projectMaxBytes, setProjectMaxBytes] = useState(
    MAX_CONTENT_SAVE_BYTES,
  );
  const [resetArmed, setResetArmed] = useState(false);
  const [scenePreview, setScenePreview] = useState(false);
  const backdropRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const coreAssets = useMemo(
    () =>
      assets.filter(
        (asset): asset is PortfolioAsset & { id: CoreAssetId } =>
          isAssetId(asset.id),
      ),
    [assets],
  );
  const selectedAsset = useMemo(
    () => {
      const asset =
        coreAssets.find((candidate) => candidate.id === selectedId) ??
        coreAssets[0];
      if (!asset) return undefined;

      return {
        ...asset,
        ...config.assets[locale]?.[asset.id],
      };
    },
    [config.assets, coreAssets, locale, selectedId],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetch("/__content-studio/save", {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { maxBodyBytes?: unknown }
          | null;
        if (cancelled) return;
        setProjectWritable(response.ok);
        if (
          response.ok &&
          typeof payload?.maxBodyBytes === "number" &&
          Number.isSafeInteger(payload.maxBodyBytes) &&
          payload.maxBodyBytes > 0
        ) {
          setProjectMaxBytes(payload.maxBodyBytes);
        }
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

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      const returnTarget = returnFocusRef.current;
      returnFocusRef.current = null;
      window.requestAnimationFrame(() => {
        if (returnTarget?.isConnected) returnTarget.focus();
      });
    };
  }, [open]);

  useEffect(() => {
    if (open || !scenePreview) return;
    const frame = window.requestAnimationFrame(() => {
      setScenePreview(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, scenePreview]);

  useEffect(() => {
    if (!open || scenePreview) return;

    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    const parent = backdrop?.parentElement;
    if (!backdrop || !panel || !parent) return;

    const backgroundStates = Array.from(parent.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && element !== backdrop,
      )
      .map((element) => ({
        element,
        inert: element.hasAttribute("inert"),
        ariaHidden: element.getAttribute("aria-hidden"),
      }));

    for (const { element } of backgroundStates) {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    }

    const focusPanel = window.requestAnimationFrame(() => {
      if (!panel.contains(document.activeElement)) {
        closeButtonRef.current?.focus();
      }
    });
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);

    return () => {
      window.cancelAnimationFrame(focusPanel);
      document.removeEventListener("keydown", trapFocus);
      for (const { element, inert, ariaHidden } of backgroundStates) {
        if (!inert) element.removeAttribute("inert");
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
    };
  }, [open, scenePreview]);

  if (!open) return null;

  // The room-facing profile is normalized on every render. Overlay the raw
  // studio draft so controlled fields keep in-progress whitespace until save.
  const editableProfile: ProfileContent = {
    ...profile,
    ...config.profile[locale],
  };

  const updateProfile = (key: ProfileKey, value: string) => {
    onChange((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [locale]: {
          ...current.profile[locale],
          [key]: value,
        },
      },
    }));
  };

  const updateAsset = (
    id: CoreAssetId,
    patch: NonNullable<
      NonNullable<SiteContentConfig["assets"][ContentLocale]>[CoreAssetId]
    >,
  ) => {
    onChange((current) => ({
      ...current,
      assets: {
        ...current.assets,
        [locale]: {
          ...current.assets[locale],
          [id]: {
            ...current.assets[locale]?.[id],
            ...patch,
          },
        },
      },
    }));
  };

  const editableSocialLinks: SocialLink[] =
    config.socialLinks ?? mergeSocialLinks(config);
  const hasInvalidSocialLinks = editableSocialLinks.some(
    (link) => !isValidSocialUrl(link.platform, link.url),
  );
  const stablePhotographyEntries =
    selectedAsset?.id === "photography"
      ? withStablePhotographyIds(selectedAsset.entries)
      : [];
  const configuredSpotlightId =
    config.media?.photography?.spotlightId;
  const selectedSpotlightId = stablePhotographyEntries.some(
    (entry) => entry.id === configuredSpotlightId,
  )
    ? configuredSpotlightId
    : stablePhotographyEntries[0]?.id;
  const photographyEntryLimitReached =
    selectedAsset?.id === "photography" &&
    STUDIO_LOCALES.some(
      (targetLocale) =>
        getPhotographyEntriesForLocale(config, targetLocale).length >=
        CONTENT_LIMITS.asset.entries,
    );

  const updateMedia = (
    patch: NonNullable<SiteContentConfig["media"]>,
  ) => {
    onChange((current) => ({
      ...current,
      media: {
        ...current.media,
        ...patch,
      },
    }));
  };

  const updatePhotoSource = (entryId: string, source?: string) => {
    onChange((current) => {
      if (
        source &&
        !STUDIO_LOCALES.some((targetLocale) =>
          getPhotographyEntriesForLocale(current, targetLocale).some(
            (entry) => entry.id === entryId,
          ),
        )
      ) {
        return current;
      }

      const sources = {
        ...current.media?.photography?.sources,
      };
      if (source) sources[entryId] = source;
      else delete sources[entryId];

      return {
        ...current,
        media: {
          ...current.media,
          photography: {
            ...current.media?.photography,
            sources,
          },
        },
      };
    });
  };

  const updatePhotographyMedia = (
    patch: NonNullable<
      NonNullable<SiteContentConfig["media"]>["photography"]
    >,
  ) => {
    onChange((current) => ({
      ...current,
      media: {
        ...current.media,
        photography: {
          ...current.media?.photography,
          ...patch,
        },
      },
    }));
  };

  const addPhotographyEntry = () => {
    const id = createStudioId("photo");
    onChange((current) => {
      if (
        STUDIO_LOCALES.some(
          (targetLocale) =>
            getPhotographyEntriesForLocale(current, targetLocale).length >=
            CONTENT_LIMITS.asset.entries,
        )
      ) {
        return current;
      }

      const assets: SiteContentConfig["assets"] = {
        ...current.assets,
      };

      for (const targetLocale of STUDIO_LOCALES) {
        const entries = getPhotographyEntriesForLocale(
          current,
          targetLocale,
        );
        const nextEntry: PortfolioAsset["entries"][number] = {
          id,
          imageAlt: "",
          eyebrow: "NEW SERIES",
          title:
            targetLocale === "zh"
              ? "新的摄影系列"
              : "New photo series",
          body: "",
          meta: "",
        };
        assets[targetLocale] = {
          ...current.assets[targetLocale],
          photography: {
            ...current.assets[targetLocale]?.photography,
            entries: [...entries, nextEntry],
          },
        };
      }

      return {
        ...current,
        assets,
      };
    });
  };

  const removePhotographyEntry = (entryId: string) => {
    onChange((current) => {
      const assets: SiteContentConfig["assets"] = {
        ...current.assets,
      };

      for (const targetLocale of STUDIO_LOCALES) {
        assets[targetLocale] = {
          ...current.assets[targetLocale],
          photography: {
            ...current.assets[targetLocale]?.photography,
            entries: getPhotographyEntriesForLocale(
              current,
              targetLocale,
            ).filter((entry) => entry.id !== entryId),
          },
        };
      }

      const sources = {
        ...current.media?.photography?.sources,
      };
      delete sources[entryId];
      const remainingEntries = getPhotographyEntriesForLocale(
        { ...current, assets },
        locale,
      );
      const spotlightId =
        current.media?.photography?.spotlightId === entryId
          ? remainingEntries[0]?.id
          : current.media?.photography?.spotlightId;

      return {
        ...current,
        assets,
        media: {
          ...current.media,
          photography: {
            ...current.media?.photography,
            sources,
            spotlightId,
          },
        },
      };
    });
  };

  const updateSocialLinks = (links: SocialLink[]) => {
    onChange((current) => ({
      ...current,
      socialLinks: links,
    }));
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
    if (hasInvalidSocialLinks) {
      setStatus(text.invalidSocial);
      return;
    }

    setSaving(true);
    setStatus("");
    try {
      const normalized = parseSiteContent(config);
      const body = JSON.stringify(normalized);
      if (new TextEncoder().encode(body).byteLength > projectMaxBytes) {
        setStatus(text.saveTooLarge);
        return;
      }
      const response = await fetch("/__content-studio/save", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { code?: unknown } }
          | null;
        if (payload?.error?.code === "PAYLOAD_TOO_LARGE") {
          setStatus(text.saveTooLarge);
          return;
        }
        throw new Error("save failed");
      }
      onChange((current) => (current === config ? normalized : current));
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
      ref={backdropRef}
      className={`studio-backdrop ${
        scenePreview ? "is-scene-preview" : ""
      }`}
      role="dialog"
      aria-modal={scenePreview ? undefined : true}
      aria-labelledby="content-studio-title"
    >
      <article className="studio-panel" ref={panelRef} tabIndex={-1}>
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
              ref={closeButtonRef}
              type="button"
              className="studio-close-button"
              onClick={onClose}
              aria-label={text.close}
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
              tabIndex={-1}
              onChange={(event) => void importJson(event)}
            />
          </div>
          <div className="studio-toolbar-group">
            {section === "scene" && (
              <button
                type="button"
                className={`studio-scene-preview-toggle ${
                  scenePreview ? "is-active" : ""
                }`}
                onClick={() => setScenePreview((current) => !current)}
                aria-pressed={scenePreview}
              >
                {scenePreview ? text.exitPreview : text.previewScene}
              </button>
            )}
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
                onClick={() => {
                  setSection("profile");
                  setScenePreview(false);
                }}
              >
                <span>01</span>
                <strong>{text.profile}</strong>
              </button>
              <button
                type="button"
                className={section === "assets" ? "is-active" : ""}
                onClick={() => {
                  setSection("assets");
                  setScenePreview(false);
                }}
              >
                <span>02</span>
                <strong>{text.assets}</strong>
              </button>
              <button
                type="button"
                className={section === "scene" ? "is-active" : ""}
                onClick={() => setSection("scene")}
              >
                <span>03</span>
                <strong>{text.scene}</strong>
              </button>
            </nav>
            {section === "assets" && (
              <div className="studio-asset-list">
                {coreAssets.map((asset) => (
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
                      value={editableProfile[key]}
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

                {selectedAsset.id === "about" && (
                  <Section
                    title={text.aboutMedia}
                    description={text.aboutMediaHelp}
                  >
                    <div className="studio-about-media">
                      <ImageUploadField
                        locale={locale}
                        kind="profile"
                        label={text.portrait}
                        description={text.portraitHelp}
                        value={config.media?.profilePhotoSrc}
                        alt={
                          config.media?.profilePhotoAlt?.[locale] ??
                          `${profile.displayName}`
                        }
                        fallback={profile.logoInitial}
                        disabled={!projectWritable}
                        onUploaded={(profilePhotoSrc) =>
                          updateMedia({ profilePhotoSrc })
                        }
                        onClear={() =>
                          updateMedia({ profilePhotoSrc: undefined })
                        }
                      />
                      <Field
                        label={text.fields.portraitAlt}
                        value={
                          config.media?.profilePhotoAlt?.[locale] ?? ""
                        }
                        onChange={(value) => {
                          onChange((current) => ({
                            ...current,
                            media: {
                              ...current.media,
                              profilePhotoAlt: {
                                ...current.media?.profilePhotoAlt,
                                [locale]: value,
                              },
                            },
                          }));
                        }}
                      />
                    </div>

                    <div className="studio-subsection-heading">
                      <h4>{text.socialLinks}</h4>
                    </div>
                    {hasInvalidSocialLinks && (
                      <p className="studio-validation-message" role="alert">
                        {text.invalidSocial}
                      </p>
                    )}
                    <div className="studio-repeater studio-social-repeater">
                      {editableSocialLinks.map((link, index) => (
                        <div
                          className="studio-repeater-item is-social"
                          key={link.id}
                        >
                          <span className="studio-social-icon" aria-hidden="true">
                            <SocialIcon platform={link.platform} />
                          </span>
                          <div className="studio-social-fields">
                            <label className="studio-field">
                              <span>{text.fields.platform}</span>
                              <select
                                value={link.platform}
                                onChange={(event) => {
                                  const links = editableSocialLinks.map(
                                    (item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            platform: event.target
                                              .value as SocialPlatform,
                                          }
                                        : item,
                                  );
                                  updateSocialLinks(links);
                                }}
                              >
                                {SOCIAL_PLATFORMS.map((platform) => (
                                  <option value={platform} key={platform}>
                                    {platform}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <Field
                              label={text.fields.socialLabel}
                              value={link.label?.[locale] ?? ""}
                              onChange={(value) => {
                                const links = editableSocialLinks.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          label: {
                                            ...item.label,
                                            [locale]: value,
                                          },
                                        }
                                      : item,
                                );
                                updateSocialLinks(links);
                              }}
                            />
                            <Field
                              label={text.fields.url}
                              value={link.url}
                              onChange={(url) => {
                                const links = editableSocialLinks.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, url }
                                      : item,
                                );
                                updateSocialLinks(links);
                              }}
                              wide
                            />
                          </div>
                          <button
                            type="button"
                            className="studio-remove-button"
                            onClick={() =>
                              updateSocialLinks(
                                editableSocialLinks.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              )
                            }
                          >
                            {text.remove}
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="studio-add-button"
                        disabled={
                          editableSocialLinks.length >=
                          CONTENT_LIMITS.social.links
                        }
                        onClick={() =>
                          updateSocialLinks([
                            ...editableSocialLinks,
                            {
                              id: createStudioId("social"),
                              platform: "website",
                              url: "https://",
                              label: {
                                [locale]:
                                  locale === "zh" ? "新的链接" : "New link",
                              },
                            },
                          ])
                        }
                      >
                        + {text.addSocialLink}
                      </button>
                    </div>
                  </Section>
                )}

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
                      disabled={
                        selectedAsset.metrics.length >=
                        CONTENT_LIMITS.asset.metrics
                      }
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

                {selectedAsset.id === "photography" ? (
                  <Section
                    title={text.photographyEntries}
                    description={text.photographyHelp}
                  >
                    <div className="studio-repeater studio-photo-repeater">
                      {stablePhotographyEntries.map((entry, index) => (
                        <div
                          className="studio-repeater-item is-photo"
                          key={entry.id}
                        >
                          <span className="studio-repeater-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="studio-photo-editor">
                            <ImageUploadField
                              locale={locale}
                              kind="photography"
                              label={`${text.photographyEntries} ${String(
                                index + 1,
                              ).padStart(2, "0")}`}
                              description={text.portraitHelp}
                              value={
                                config.media?.photography?.sources?.[
                                  entry.id
                                ]
                              }
                              alt={entry.imageAlt ?? entry.title}
                              fallback={String(index + 1).padStart(2, "0")}
                              disabled={!projectWritable}
                              onUploaded={(url) =>
                                updatePhotoSource(entry.id, url)
                              }
                              onClear={() =>
                                updatePhotoSource(entry.id, undefined)
                              }
                            />
                            <label className="studio-spotlight-control">
                              <input
                                type="radio"
                                name="photography-spotlight"
                                checked={selectedSpotlightId === entry.id}
                                onChange={() =>
                                  updatePhotographyMedia({
                                    spotlightId: entry.id,
                                  })
                                }
                              />
                              <span>
                                <strong>{text.spotlight}</strong>
                                <small>{text.spotlightHelp}</small>
                              </span>
                            </label>
                            <div className="studio-field-grid">
                              {(
                                [
                                  "imageAlt",
                                  "eyebrow",
                                  "title",
                                  "body",
                                  "meta",
                                ] as const
                              ).map((key) => (
                                <Field
                                  key={key}
                                  label={
                                    key === "imageAlt"
                                      ? text.fields.photoAlt
                                      : text.fields[key]
                                  }
                                  value={entry[key] ?? ""}
                                  multiline={key === "body"}
                                  wide={
                                    key === "imageAlt" || key === "body"
                                  }
                                  onChange={(value) => {
                                    const entries =
                                      stablePhotographyEntries.map(
                                        (item, itemIndex) =>
                                          itemIndex === index
                                            ? { ...item, [key]: value }
                                            : item,
                                      );
                                    updateAsset(selectedAsset.id, {
                                      entries,
                                    });
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="studio-remove-button"
                            onClick={() =>
                              removePhotographyEntry(entry.id)
                            }
                          >
                            {text.remove}
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="studio-add-button"
                        disabled={photographyEntryLimitReached}
                        onClick={addPhotographyEntry}
                      >
                        + {text.addEntry}
                      </button>
                    </div>
                  </Section>
                ) : (
                  <Section title={text.entries}>
                    <div className="studio-repeater">
                      {selectedAsset.entries.map((entry, index) => (
                        <div
                          className="studio-repeater-item is-entry"
                          key={entry.id ?? `entry-${index}`}
                        >
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
                        disabled={
                          selectedAsset.entries.length >=
                          CONTENT_LIMITS.asset.entries
                        }
                        onClick={() =>
                          updateAsset(selectedAsset.id, {
                            entries: [
                              ...selectedAsset.entries,
                              {
                                eyebrow: "NEW",
                                title:
                                  locale === "zh"
                                    ? "新的内容卡片"
                                    : "New card",
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
                )}
              </div>
            )}

            {section === "scene" && (
              <SceneStudio
                locale={locale}
                config={config}
                assets={coreAssets}
                projectWritable={projectWritable}
                onChange={onChange}
              />
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
