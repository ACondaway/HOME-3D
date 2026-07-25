import type {
  ContentCardKind,
  ContentCardWidth,
  CoreAssetId,
  PortfolioAsset,
  PortfolioEntry,
} from "./portfolio-data";

export type ContentLocale = "zh" | "en";

export type SocialPlatform =
  | "github"
  | "linkedin"
  | "instagram"
  | "x"
  | "youtube"
  | "bilibili"
  | "weibo"
  | "website"
  | "email";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  label?: Partial<Record<ContentLocale, string>>;
}

export interface SiteMediaConfig {
  profilePhotoSrc?: string;
  profilePhotoAlt?: Partial<Record<ContentLocale, string>>;
  photography?: {
    sources?: Record<string, string>;
    spotlightId?: string;
  };
}

export const DEFAULT_PHOTOGRAPHY_ENTRY_IDS = [
  "lights-on",
  "temporary-tables",
  "unchosen-frames",
] as const;

export function resolvePhotographyEntryId(
  entry: PortfolioAsset["entries"][number],
  index: number,
): string {
  return (
    entry.id?.trim() ||
    DEFAULT_PHOTOGRAPHY_ENTRY_IDS[index] ||
    `photo-${String(index + 1).padStart(2, "0")}`
  );
}

export function resolvePhotographyEntryIds(
  entries: readonly PortfolioAsset["entries"][number][],
): string[] {
  const usedIds = new Set<string>();

  return entries.map((entry, index) => {
    const baseId = resolvePhotographyEntryId(entry, index);
    let resolvedId = baseId;
    let suffix = 2;
    while (usedIds.has(resolvedId)) {
      resolvedId = `${baseId}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(resolvedId);
    return resolvedId;
  });
}

export interface ProfileContent {
  displayName: string;
  logoInitial: string;
  personalSpace: string;
  introEyebrow: string;
  introTitle: string;
  introTitleEm: string;
  introDescription: string;
  quote: string;
  city: string;
  timezone: string;
}

export type ProfileContentOverride = Partial<ProfileContent>;

export type AssetContentOverride = Partial<
  Pick<
    PortfolioAsset,
    | "objectLabel"
    | "sectionTitle"
    | "trait"
    | "teaser"
    | "intro"
    | "status"
    | "lastUpdated"
    | "metrics"
    | "entries"
    | "note"
  >
>;

export type SceneVector3 = [number, number, number];

/**
 * Scene transforms use world-space units for position, degrees for rotation,
 * and per-axis multipliers for scale.
 */
export interface SceneTransform {
  position: SceneVector3;
  rotation: SceneVector3;
  scale: SceneVector3;
}

/**
 * A placement adjusts an existing scene object relative to its authored
 * transform. Every vector is optional so an editor can change one property
 * without taking ownership of the others.
 */
export interface ScenePlacement {
  position?: SceneVector3;
  rotation?: SceneVector3;
  scale?: SceneVector3;
}

export type CustomSceneAssetBehavior = "decorative" | "interactive";

export interface CustomSceneAsset {
  id: `custom-${string}`;
  behavior: CustomSceneAssetBehavior;
  modelSrc?: string;
  accent: string;
  transform: SceneTransform;
  content: Partial<Record<ContentLocale, AssetContentOverride>>;
}

export interface SceneConfig {
  placements?: Partial<Record<CoreAssetId, ScenePlacement>>;
  disabledCoreAssets?: CoreAssetId[];
  coreAssetModels?: Partial<Record<CoreAssetId, string>>;
  customAssets?: CustomSceneAsset[];
}

export const DEFAULT_SCENE_TRANSFORM: SceneTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

export interface SiteContentConfig {
  version: 1;
  profile: Partial<Record<ContentLocale, ProfileContentOverride>>;
  assets: Partial<
    Record<
      ContentLocale,
      Partial<Record<CoreAssetId, AssetContentOverride>>
    >
  >;
  media?: SiteMediaConfig;
  socialLinks?: SocialLink[];
  scene?: SceneConfig;
}

export const DEFAULT_SOCIAL_LINKS: readonly SocialLink[] = [
  {
    id: "github",
    platform: "github",
    url: "https://github.com/ACondaway",
  },
  {
    id: "email",
    platform: "email",
    url: "mailto:acondaway@sjtu.edu.cn",
  },
];

export const DEFAULT_PROFILE: Readonly<
  Record<ContentLocale, Readonly<ProfileContent>>
> = {
  zh: {
    displayName: "你的名字",
    logoInitial: "Y",
    personalSpace: "个人空间 · 2026",
    introEyebrow: "一间会回应你的房间 / 00",
    introTitle: "欢迎来",
    introTitleEm: "坐一会儿。",
    introDescription:
      "我把生活、好奇与正在发生的作品，放进了这间房。每件物品，都是认识我的一种方式。",
    quote: "“物品不是分类图标，而是生活方式的证据。”",
    city: "上海",
    timezone: "GMT+8",
  },
  en: {
    displayName: "Your Name",
    logoInitial: "Y",
    personalSpace: "PERSONAL SPACE · 2026",
    introEyebrow: "A ROOM THAT ANSWERS BACK / 00",
    introTitle: "Come in.",
    introTitleEm: "Stay awhile.",
    introDescription:
      "I placed my life, curiosities, and work in progress inside this room. Every object is another way to know me.",
    quote:
      "“Objects are not category icons. They are evidence of a life.”",
    city: "Shanghai",
    timezone: "GMT+8",
  },
};

export const EMPTY_SITE_CONTENT: SiteContentConfig = {
  version: 1,
  profile: {},
  assets: {},
};

export const CONTENT_ASSET_IDS = [
  "music",
  "fitness",
  "reading",
  "research",
  "making",
  "photography",
  "ritual",
  "growth",
  "about",
  "travel",
  "contact",
  "future",
] as const satisfies readonly CoreAssetId[];

export const CONTENT_LIMITS = {
  profile: {
    displayName: 80,
    logoInitial: 8,
    personalSpace: 120,
    introEyebrow: 160,
    introTitle: 160,
    introTitleEm: 160,
    introDescription: 1_500,
    quote: 600,
    city: 120,
    timezone: 120,
  },
  asset: {
    objectLabel: 120,
    sectionTitle: 180,
    trait: 500,
    teaser: 500,
    intro: 2_500,
    status: 160,
    lastUpdated: 160,
    note: 1_500,
    metrics: 12,
    entries: 24,
    metricValue: 120,
    metricLabel: 180,
    entryEyebrow: 180,
    entryTitle: 240,
    entryBody: 2_000,
    entryMeta: 240,
    entryId: 120,
    entryImageAlt: 500,
    links: 4,
    linkLabel: 160,
    linkUrl: 2_048,
  },
  media: {
    path: 2_048,
    alt: 500,
    sourceId: 120,
    sources: 48,
    spotlightId: 120,
  },
  social: {
    links: 12,
    id: 120,
    url: 2_048,
    label: 160,
  },
  scene: {
    customAssets: 24,
    id: 120,
    positionMin: -50,
    positionMax: 50,
    rotationMin: -360,
    rotationMax: 360,
    scaleMin: 0.05,
    scaleMax: 20,
  },
} as const;

// The local save endpoint must accommodate every schema-valid document even
// when multilingual text uses multi-byte UTF-8 characters.
export const MAX_CONTENT_SAVE_BYTES = 24 * 1024 * 1024;

export const SCENE_TRANSFORM_LIMITS = {
  position: {
    min: CONTENT_LIMITS.scene.positionMin,
    max: CONTENT_LIMITS.scene.positionMax,
  },
  rotation: {
    min: CONTENT_LIMITS.scene.rotationMin,
    max: CONTENT_LIMITS.scene.rotationMax,
  },
  scale: {
    min: CONTENT_LIMITS.scene.scaleMin,
    max: CONTENT_LIMITS.scene.scaleMax,
  },
} as const;

type UnknownRecord = Record<string, unknown>;

const CONTENT_LOCALES = ["zh", "en"] as const satisfies readonly ContentLocale[];
const ASSET_ID_SET: ReadonlySet<string> = new Set(CONTENT_ASSET_IDS);
const SOCIAL_PLATFORM_SET: ReadonlySet<string> = new Set<SocialPlatform>([
  "github",
  "linkedin",
  "instagram",
  "x",
  "youtube",
  "bilibili",
  "weibo",
  "website",
  "email",
]);
const CUSTOM_SCENE_ASSET_BEHAVIOR_SET: ReadonlySet<string> =
  new Set<CustomSceneAssetBehavior>(["decorative", "interactive"]);
const CONTENT_CARD_KIND_SET: ReadonlySet<string> = new Set<ContentCardKind>([
  "text",
  "media",
  "links",
]);
const CONTENT_CARD_WIDTH_SET: ReadonlySet<string> =
  new Set<ContentCardWidth>(["standard", "wide", "full"]);
const DEFAULT_CUSTOM_ASSET_ACCENT = "#C99A62";

export function resolveContentCardKind(
  entry: Pick<PortfolioEntry, "kind" | "imageSrc" | "links">,
): ContentCardKind {
  if (entry.kind && CONTENT_CARD_KIND_SET.has(entry.kind)) {
    return entry.kind;
  }
  if (entry.imageSrc) return "media";
  if (entry.links?.length) return "links";
  return "text";
}

export function resolveContentCardWidth(
  entry: Pick<PortfolioEntry, "width">,
): ContentCardWidth {
  return entry.width && CONTENT_CARD_WIDTH_SET.has(entry.width)
    ? entry.width
    : "standard";
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOwn = (record: UnknownRecord, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key);

const normalizeString = (
  value: unknown,
  maximumLength: number,
): string | undefined => {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim();
  return Array.from(normalized).slice(0, maximumLength).join("");
};

const normalizeIdentifier = (
  value: unknown,
  maximumLength: number,
): string | undefined => {
  const normalized = normalizeString(value, maximumLength);
  if (!normalized) return undefined;

  const identifier = normalized
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return identifier || undefined;
};

const normalizeLocalizedStrings = (
  value: unknown,
  maximumLength: number,
): Partial<Record<ContentLocale, string>> | undefined => {
  if (!isRecord(value)) return undefined;

  const result: Partial<Record<ContentLocale, string>> = {};
  for (const locale of CONTENT_LOCALES) {
    if (!hasOwn(value, locale)) continue;
    const localized = normalizeString(value[locale], maximumLength);
    if (localized !== undefined) result[locale] = localized;
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

const IMAGE_UPLOAD_PATH_PATTERN =
  /^\/uploads\/(?:profile|photography|cards)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i;
const CONTENT_CARD_IMAGE_PATH_PATTERN =
  /^\/uploads\/cards\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i;

const normalizeUploadPath = (value: unknown): string | undefined => {
  const normalized = normalizeString(value, CONTENT_LIMITS.media.path);
  return normalized && IMAGE_UPLOAD_PATH_PATTERN.test(normalized)
    ? normalized
    : undefined;
};

const normalizeContentCardImagePath = (
  value: unknown,
): string | undefined => {
  const normalized = normalizeString(value, CONTENT_LIMITS.media.path);
  return normalized && CONTENT_CARD_IMAGE_PATH_PATTERN.test(normalized)
    ? normalized
    : undefined;
};

export function isValidContentCardImageSource(value: string): boolean {
  return normalizeContentCardImagePath(value) !== undefined;
}

const normalizeModelUploadPath = (value: unknown): string | undefined => {
  const normalized = normalizeString(value, CONTENT_LIMITS.media.path);
  return normalized &&
    /^\/uploads\/models\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.glb$/.test(
      normalized,
    )
    ? normalized
    : undefined;
};

const clampFiniteNumber = (
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
};

const normalizeSceneVector = (
  value: unknown,
  range: { readonly min: number; readonly max: number },
  fallback: SceneVector3,
): SceneVector3 => {
  if (!Array.isArray(value)) return [...fallback];

  return [
    clampFiniteNumber(value[0], range.min, range.max, fallback[0]),
    clampFiniteNumber(value[1], range.min, range.max, fallback[1]),
    clampFiniteNumber(value[2], range.min, range.max, fallback[2]),
  ];
};

const normalizeOptionalSceneVector = (
  value: unknown,
  range: { readonly min: number; readonly max: number },
  fallback: SceneVector3,
): SceneVector3 | undefined =>
  Array.isArray(value)
    ? normalizeSceneVector(value, range, fallback)
    : undefined;

const normalizeSceneAccent = (value: unknown): string => {
  const normalized = normalizeString(value, 7);
  return normalized && /^#[0-9a-f]{6}$/i.test(normalized)
    ? normalized.toUpperCase()
    : DEFAULT_CUSTOM_ASSET_ACCENT;
};

const assignString = <Key extends string>(
  source: UnknownRecord,
  target: Partial<Record<Key, string>>,
  key: Key,
  maximumLength: number,
): void => {
  if (!hasOwn(source, key)) return;
  const value = normalizeString(source[key], maximumLength);
  if (value !== undefined) target[key] = value;
};

const normalizeProfileOverride = (
  value: unknown,
): ProfileContentOverride | undefined => {
  if (!isRecord(value)) return undefined;

  const result: ProfileContentOverride = {};
  assignString(
    value,
    result,
    "displayName",
    CONTENT_LIMITS.profile.displayName,
  );
  assignString(
    value,
    result,
    "logoInitial",
    CONTENT_LIMITS.profile.logoInitial,
  );
  assignString(
    value,
    result,
    "personalSpace",
    CONTENT_LIMITS.profile.personalSpace,
  );
  assignString(
    value,
    result,
    "introEyebrow",
    CONTENT_LIMITS.profile.introEyebrow,
  );
  assignString(
    value,
    result,
    "introTitle",
    CONTENT_LIMITS.profile.introTitle,
  );
  assignString(
    value,
    result,
    "introTitleEm",
    CONTENT_LIMITS.profile.introTitleEm,
  );
  assignString(
    value,
    result,
    "introDescription",
    CONTENT_LIMITS.profile.introDescription,
  );
  assignString(value, result, "quote", CONTENT_LIMITS.profile.quote);
  assignString(value, result, "city", CONTENT_LIMITS.profile.city);
  assignString(value, result, "timezone", CONTENT_LIMITS.profile.timezone);

  return Object.keys(result).length > 0 ? result : undefined;
};

const normalizeMetrics = (
  value: unknown,
): PortfolioAsset["metrics"] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const result: PortfolioAsset["metrics"] = [];
  for (const item of value.slice(0, CONTENT_LIMITS.asset.metrics)) {
    if (!isRecord(item)) continue;

    const metricValue = normalizeString(
      item.value,
      CONTENT_LIMITS.asset.metricValue,
    );
    const label = normalizeString(
      item.label,
      CONTENT_LIMITS.asset.metricLabel,
    );
    if (metricValue === undefined || label === undefined) continue;
    result.push({ value: metricValue, label });
  }
  return result;
};

const normalizeContentCardLinkUrl = (
  value: unknown,
): string | undefined => {
  const normalized = normalizeString(value, CONTENT_LIMITS.asset.linkUrl);
  if (!normalized || /[\u0000-\u001f\u007f]/.test(normalized)) {
    return undefined;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return normalized;
    }
    if (
      parsed.protocol === "mailto:" &&
      parsed.pathname.length > 0 &&
      !/\s/.test(parsed.pathname)
    ) {
      return normalized;
    }
  } catch {
    // Invalid and relative URLs are intentionally omitted.
  }
  return undefined;
};

export function isValidContentCardLinkUrl(value: string): boolean {
  return normalizeContentCardLinkUrl(value) !== undefined;
}

const normalizeContentCardLinks = (
  value: unknown,
): PortfolioEntry["links"] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const result: NonNullable<PortfolioEntry["links"]> = [];
  for (const item of value) {
    if (result.length >= CONTENT_LIMITS.asset.links) break;
    if (!isRecord(item)) continue;

    const label = normalizeString(
      item.label,
      CONTENT_LIMITS.asset.linkLabel,
    );
    const url = normalizeContentCardLinkUrl(item.url);
    if (!label || !url) continue;
    result.push({ label, url });
  }
  return result;
};

const normalizeEntries = (
  value: unknown,
): PortfolioAsset["entries"] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const result: PortfolioAsset["entries"] = [];
  const usedIds = new Set<string>();
  for (const item of value.slice(0, CONTENT_LIMITS.asset.entries)) {
    if (!isRecord(item)) continue;

    const eyebrow = normalizeString(
      item.eyebrow,
      CONTENT_LIMITS.asset.entryEyebrow,
    );
    const title = normalizeString(
      item.title,
      CONTENT_LIMITS.asset.entryTitle,
    );
    const body = normalizeString(item.body, CONTENT_LIMITS.asset.entryBody);
    const meta = normalizeString(item.meta, CONTENT_LIMITS.asset.entryMeta);
    if (
      eyebrow === undefined ||
      title === undefined ||
      body === undefined ||
      meta === undefined
    ) {
      continue;
    }
    const entry: PortfolioAsset["entries"][number] = {
      eyebrow,
      title,
      body,
      meta,
    };
    if (
      typeof item.kind === "string" &&
      CONTENT_CARD_KIND_SET.has(item.kind)
    ) {
      entry.kind = item.kind as ContentCardKind;
    }
    if (
      typeof item.width === "string" &&
      CONTENT_CARD_WIDTH_SET.has(item.width)
    ) {
      entry.width = item.width as ContentCardWidth;
    }
    if (hasOwn(item, "id")) {
      const id = normalizeIdentifier(item.id, CONTENT_LIMITS.asset.entryId);
      if (id && !usedIds.has(id)) {
        entry.id = id;
        usedIds.add(id);
      }
    }
    if (hasOwn(item, "imageAlt")) {
      const imageAlt = normalizeString(
        item.imageAlt,
        CONTENT_LIMITS.asset.entryImageAlt,
      );
      if (imageAlt !== undefined) entry.imageAlt = imageAlt;
    }
    if (hasOwn(item, "imageSrc")) {
      const imageSrc = normalizeContentCardImagePath(item.imageSrc);
      if (imageSrc !== undefined) entry.imageSrc = imageSrc;
    }
    if (hasOwn(item, "links")) {
      const links = normalizeContentCardLinks(item.links);
      if (links !== undefined) entry.links = links;
    }
    result.push(entry);
  }
  return result;
};

const normalizeMedia = (value: unknown): SiteMediaConfig | undefined => {
  if (!isRecord(value)) return undefined;

  const result: SiteMediaConfig = {};
  if (hasOwn(value, "profilePhotoSrc")) {
    const profilePhotoSrc = normalizeUploadPath(value.profilePhotoSrc);
    if (profilePhotoSrc !== undefined) {
      result.profilePhotoSrc = profilePhotoSrc;
    }
  }

  if (hasOwn(value, "profilePhotoAlt")) {
    const profilePhotoAlt = normalizeLocalizedStrings(
      value.profilePhotoAlt,
      CONTENT_LIMITS.media.alt,
    );
    if (profilePhotoAlt) result.profilePhotoAlt = profilePhotoAlt;
  }

  if (isRecord(value.photography)) {
    const photography: NonNullable<SiteMediaConfig["photography"]> = {};

    if (isRecord(value.photography.sources)) {
      const sources: Record<string, string> = {};
      for (const [sourceIdInput, sourceInput] of Object.entries(
        value.photography.sources,
      )) {
        if (Object.keys(sources).length >= CONTENT_LIMITS.media.sources) break;
        const sourceId = normalizeIdentifier(
          sourceIdInput,
          CONTENT_LIMITS.media.sourceId,
        );
        const source = normalizeUploadPath(sourceInput);
        if (!sourceId || !source) continue;
        sources[sourceId] = source;
      }
      if (Object.keys(sources).length > 0) photography.sources = sources;
    }

    if (hasOwn(value.photography, "spotlightId")) {
      const spotlightId = normalizeIdentifier(
        value.photography.spotlightId,
        CONTENT_LIMITS.media.spotlightId,
      );
      if (spotlightId) photography.spotlightId = spotlightId;
    }

    if (Object.keys(photography).length > 0) {
      result.photography = photography;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

const normalizeSocialUrl = (
  value: unknown,
  platform: SocialPlatform,
): string | undefined => {
  const normalized = normalizeString(value, CONTENT_LIMITS.social.url);
  if (!normalized) return undefined;

  try {
    const parsed = new URL(normalized);
    if (platform === "email") {
      const emailAddress = parsed.pathname;
      if (
        parsed.protocol !== "mailto:" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)
      ) {
        return undefined;
      }
      return normalized;
    }

    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? normalized
      : undefined;
  } catch {
    return undefined;
  }
};

export function isValidSocialUrl(
  platform: SocialPlatform,
  value: string,
): boolean {
  return normalizeSocialUrl(value, platform) !== undefined;
}

const normalizeSocialLinks = (value: unknown): SocialLink[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const result: SocialLink[] = [];
  const usedIds = new Set<string>();
  for (const item of value) {
    if (result.length >= CONTENT_LIMITS.social.links) break;
    if (!isRecord(item)) continue;

    const id = normalizeIdentifier(item.id, CONTENT_LIMITS.social.id);
    const platform =
      typeof item.platform === "string" &&
      SOCIAL_PLATFORM_SET.has(item.platform)
        ? (item.platform as SocialPlatform)
        : undefined;
    if (!id || usedIds.has(id) || !platform) continue;

    const url = normalizeSocialUrl(item.url, platform);
    if (!url) continue;

    const link: SocialLink = { id, platform, url };
    const label = normalizeLocalizedStrings(
      item.label,
      CONTENT_LIMITS.social.label,
    );
    if (label) link.label = label;
    result.push(link);
    usedIds.add(id);
  }

  return result;
};

const normalizeAssetOverride = (
  value: unknown,
): AssetContentOverride | undefined => {
  if (!isRecord(value)) return undefined;

  const result: AssetContentOverride = {};
  assignString(
    value,
    result,
    "objectLabel",
    CONTENT_LIMITS.asset.objectLabel,
  );
  assignString(
    value,
    result,
    "sectionTitle",
    CONTENT_LIMITS.asset.sectionTitle,
  );
  assignString(value, result, "trait", CONTENT_LIMITS.asset.trait);
  assignString(value, result, "teaser", CONTENT_LIMITS.asset.teaser);
  assignString(value, result, "intro", CONTENT_LIMITS.asset.intro);
  assignString(value, result, "status", CONTENT_LIMITS.asset.status);
  assignString(
    value,
    result,
    "lastUpdated",
    CONTENT_LIMITS.asset.lastUpdated,
  );
  assignString(value, result, "note", CONTENT_LIMITS.asset.note);

  if (hasOwn(value, "metrics")) {
    const metrics = normalizeMetrics(value.metrics);
    if (metrics !== undefined) result.metrics = metrics;
  }
  if (hasOwn(value, "entries")) {
    const entries = normalizeEntries(value.entries);
    if (entries !== undefined) result.entries = entries;
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

const normalizeScenePlacement = (
  value: unknown,
): ScenePlacement | undefined => {
  if (!isRecord(value)) return undefined;

  const result: ScenePlacement = {};
  if (hasOwn(value, "position")) {
    const position = normalizeOptionalSceneVector(
      value.position,
      SCENE_TRANSFORM_LIMITS.position,
      DEFAULT_SCENE_TRANSFORM.position,
    );
    if (position) result.position = position;
  }
  if (hasOwn(value, "rotation")) {
    const rotation = normalizeOptionalSceneVector(
      value.rotation,
      SCENE_TRANSFORM_LIMITS.rotation,
      DEFAULT_SCENE_TRANSFORM.rotation,
    );
    if (rotation) result.rotation = rotation;
  }
  if (hasOwn(value, "scale")) {
    const scale = normalizeOptionalSceneVector(
      value.scale,
      SCENE_TRANSFORM_LIMITS.scale,
      DEFAULT_SCENE_TRANSFORM.scale,
    );
    if (scale) result.scale = scale;
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

const normalizeSceneTransform = (value: unknown): SceneTransform => {
  const source = isRecord(value) ? value : {};
  return {
    position: normalizeSceneVector(
      source.position,
      SCENE_TRANSFORM_LIMITS.position,
      DEFAULT_SCENE_TRANSFORM.position,
    ),
    rotation: normalizeSceneVector(
      source.rotation,
      SCENE_TRANSFORM_LIMITS.rotation,
      DEFAULT_SCENE_TRANSFORM.rotation,
    ),
    scale: normalizeSceneVector(
      source.scale,
      SCENE_TRANSFORM_LIMITS.scale,
      DEFAULT_SCENE_TRANSFORM.scale,
    ),
  };
};

const normalizeCustomSceneAssetId = (
  value: unknown,
): CustomSceneAsset["id"] | undefined => {
  const identifier = normalizeIdentifier(value, CONTENT_LIMITS.scene.id);
  return identifier && /^custom-[a-z0-9][a-z0-9_-]*$/.test(identifier)
    ? (identifier as CustomSceneAsset["id"])
    : undefined;
};

const normalizeCustomSceneAsset = (
  value: unknown,
): CustomSceneAsset | undefined => {
  if (!isRecord(value)) return undefined;

  const id = normalizeCustomSceneAssetId(value.id);
  const behavior =
    typeof value.behavior === "string" &&
    CUSTOM_SCENE_ASSET_BEHAVIOR_SET.has(value.behavior)
      ? (value.behavior as CustomSceneAssetBehavior)
      : undefined;
  if (!id || !behavior) return undefined;

  const content: CustomSceneAsset["content"] = {};
  if (isRecord(value.content)) {
    for (const locale of CONTENT_LOCALES) {
      const override = normalizeAssetOverride(value.content[locale]);
      if (override) content[locale] = override;
    }
  }

  const result: CustomSceneAsset = {
    id,
    behavior,
    accent: normalizeSceneAccent(value.accent),
    transform: normalizeSceneTransform(value.transform),
    content,
  };
  if (hasOwn(value, "modelSrc")) {
    const modelSrc = normalizeModelUploadPath(value.modelSrc);
    if (modelSrc) result.modelSrc = modelSrc;
  }
  return result;
};

const normalizeScene = (value: unknown): SceneConfig | undefined => {
  if (!isRecord(value)) return undefined;

  const result: SceneConfig = {};
  if (Array.isArray(value.disabledCoreAssets)) {
    const disabledIds = new Set(value.disabledCoreAssets);
    result.disabledCoreAssets = CONTENT_ASSET_IDS.filter((assetId) =>
      disabledIds.has(assetId),
    );
  }

  if (isRecord(value.coreAssetModels)) {
    const coreAssetModels: NonNullable<SceneConfig["coreAssetModels"]> = {};
    for (const assetId of CONTENT_ASSET_IDS) {
      const modelSrc = normalizeModelUploadPath(
        value.coreAssetModels[assetId],
      );
      if (modelSrc) coreAssetModels[assetId] = modelSrc;
    }
    if (Object.keys(coreAssetModels).length > 0) {
      result.coreAssetModels = coreAssetModels;
    }
  }

  if (isRecord(value.placements)) {
    const placements: NonNullable<SceneConfig["placements"]> = {};
    for (const assetId of CONTENT_ASSET_IDS) {
      const placement = normalizeScenePlacement(value.placements[assetId]);
      if (placement) placements[assetId as CoreAssetId] = placement;
    }
    if (Object.keys(placements).length > 0) result.placements = placements;
  }

  if (Array.isArray(value.customAssets)) {
    const customAssets: CustomSceneAsset[] = [];
    const usedIds = new Set<string>();
    for (const item of value.customAssets) {
      if (customAssets.length >= CONTENT_LIMITS.scene.customAssets) break;
      const asset = normalizeCustomSceneAsset(item);
      if (!asset || usedIds.has(asset.id)) continue;
      customAssets.push(asset);
      usedIds.add(asset.id);
    }
    result.customAssets = customAssets;
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

/**
 * Coerces unknown persisted data into the current v1 shape.
 *
 * Unknown locales, asset ids and fields are discarded. Oversized strings and
 * arrays are capped so browser storage or imported JSON cannot grow without
 * bounds. Unsupported versions normalize to an empty v1 document.
 */
export function normalizeSiteContent(input: unknown): SiteContentConfig {
  if (!isRecord(input)) {
    return { version: 1, profile: {}, assets: {} };
  }
  if (hasOwn(input, "version") && input.version !== 1) {
    return { version: 1, profile: {}, assets: {} };
  }

  const profile: SiteContentConfig["profile"] = {};
  if (isRecord(input.profile)) {
    for (const locale of CONTENT_LOCALES) {
      const override = normalizeProfileOverride(input.profile[locale]);
      if (override) profile[locale] = override;
    }
  }

  const assets: SiteContentConfig["assets"] = {};
  if (isRecord(input.assets)) {
    for (const locale of CONTENT_LOCALES) {
      const localeInput = input.assets[locale];
      if (!isRecord(localeInput)) continue;

      const localeAssets: Partial<
        Record<CoreAssetId, AssetContentOverride>
      > = {};
      for (const [assetId, assetInput] of Object.entries(localeInput)) {
        if (!ASSET_ID_SET.has(assetId)) continue;
        const override = normalizeAssetOverride(assetInput);
        if (override) localeAssets[assetId as CoreAssetId] = override;
      }
      if (Object.keys(localeAssets).length > 0) assets[locale] = localeAssets;
    }
  }

  const result: SiteContentConfig = { version: 1, profile, assets };
  const media = normalizeMedia(input.media);
  if (media) result.media = media;

  if (hasOwn(input, "socialLinks") && Array.isArray(input.socialLinks)) {
    result.socialLinks = normalizeSocialLinks(input.socialLinks) ?? [];
  }

  const scene = normalizeScene(input.scene);
  if (scene) result.scene = scene;

  return result;
}

export class ContentConfigValidationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ContentConfigValidationError";
  }
}

/**
 * Parses JSON text or normalizes an already-decoded value.
 *
 * Invalid JSON, non-object roots and unsupported explicit versions throw.
 * Invalid individual fields are safely omitted by `normalizeSiteContent`.
 */
export function parseSiteContent(input: string | unknown): SiteContentConfig {
  let value = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input) as unknown;
    } catch (error) {
      throw new ContentConfigValidationError("内容配置不是有效的 JSON。", {
        cause: error,
      });
    }
  }

  if (!isRecord(value)) {
    throw new ContentConfigValidationError("内容配置的根节点必须是对象。");
  }
  if (hasOwn(value, "version") && value.version !== 1) {
    throw new ContentConfigValidationError(
      "不支持该内容配置版本；当前只支持 version: 1。",
    );
  }

  return normalizeSiteContent(value);
}

export function mergeProfile(
  locale: ContentLocale,
  config: SiteContentConfig = EMPTY_SITE_CONTENT,
): ProfileContent {
  const normalized = normalizeSiteContent(config);
  return {
    ...DEFAULT_PROFILE[locale],
    ...normalized.profile[locale],
  };
}

const clonePortfolioEntry = (entry: PortfolioEntry): PortfolioEntry => ({
  ...entry,
  ...(entry.links
    ? { links: entry.links.map((link) => ({ ...link })) }
    : {}),
});

export function mergeAssets(
  baseAssets: readonly PortfolioAsset[],
  locale: ContentLocale,
  config: SiteContentConfig = EMPTY_SITE_CONTENT,
): PortfolioAsset[] {
  const normalized = normalizeSiteContent(config);
  const overrides = normalized.assets[locale];

  return baseAssets.map((asset) => {
    const override = ASSET_ID_SET.has(asset.id)
      ? overrides?.[asset.id as CoreAssetId]
      : undefined;

    return {
      ...asset,
      ...override,
      metrics: override?.metrics
        ? override.metrics.map((metric) => ({ ...metric }))
        : asset.metrics.map((metric) => ({ ...metric })),
      entries: override?.entries
        ? override.entries.map(clonePortfolioEntry)
        : asset.entries.map(clonePortfolioEntry),
    };
  });
}

export function mergeMedia(
  config: SiteContentConfig = EMPTY_SITE_CONTENT,
): SiteMediaConfig {
  const media = normalizeSiteContent(config).media;
  if (!media) return {};

  const result: SiteMediaConfig = { ...media };
  if (media.profilePhotoAlt) {
    result.profilePhotoAlt = { ...media.profilePhotoAlt };
  }
  if (media.photography) {
    result.photography = { ...media.photography };
    if (media.photography.sources) {
      result.photography.sources = { ...media.photography.sources };
    }
  }
  return result;
}

export function mergeSocialLinks(
  config: SiteContentConfig = EMPTY_SITE_CONTENT,
): SocialLink[] {
  const normalized = normalizeSiteContent(config);
  const links = normalized.socialLinks ?? DEFAULT_SOCIAL_LINKS;

  return links.map((link) =>
    link.label ? { ...link, label: { ...link.label } } : { ...link },
  );
}

const cloneSceneVector = (vector: SceneVector3): SceneVector3 => [...vector];

const cloneAssetContentOverride = (
  override: AssetContentOverride,
): AssetContentOverride => ({
  ...override,
  metrics: override.metrics?.map((metric) => ({ ...metric })),
  entries: override.entries?.map(clonePortfolioEntry),
});

/**
 * Returns a normalized, detached scene document that UI and runtime code can
 * safely mutate without changing the persisted content object.
 */
export function mergeSceneConfig(
  config: SiteContentConfig = EMPTY_SITE_CONTENT,
): SceneConfig {
  const scene = normalizeSiteContent(config).scene;
  if (!scene) return {};

  const result: SceneConfig = {};
  if (scene.disabledCoreAssets) {
    result.disabledCoreAssets = [...scene.disabledCoreAssets];
  }
  if (scene.coreAssetModels) {
    result.coreAssetModels = { ...scene.coreAssetModels };
  }

  if (scene.placements) {
    const placements: NonNullable<SceneConfig["placements"]> = {};
    for (const [assetId, placement] of Object.entries(scene.placements)) {
      placements[assetId as CoreAssetId] = {
        ...(placement.position
          ? { position: cloneSceneVector(placement.position) }
          : {}),
        ...(placement.rotation
          ? { rotation: cloneSceneVector(placement.rotation) }
          : {}),
        ...(placement.scale
          ? { scale: cloneSceneVector(placement.scale) }
          : {}),
      };
    }
    result.placements = placements;
  }

  if (scene.customAssets) {
    result.customAssets = scene.customAssets.map((asset) => {
      const content: CustomSceneAsset["content"] = {};
      for (const locale of CONTENT_LOCALES) {
        const override = asset.content[locale];
        if (override) content[locale] = cloneAssetContentOverride(override);
      }

      return {
        ...asset,
        transform: {
          position: cloneSceneVector(asset.transform.position),
          rotation: cloneSceneVector(asset.transform.rotation),
          scale: cloneSceneVector(asset.transform.scale),
        },
        content,
      };
    });
  }
  return result;
}

export function isCoreSceneAssetEnabled(
  scene: SceneConfig | undefined,
  assetId: CoreAssetId,
): boolean {
  return !scene?.disabledCoreAssets?.includes(assetId);
}

export function deriveCustomSceneAssetFocus(
  transform: SceneTransform,
): PortfolioAsset["focus"] {
  const [x, y, z] = transform.position;
  const verticalExtent = Math.max(0.5, Math.min(5, transform.scale[1]));
  const distance = Math.max(
    3.5,
    Math.min(14, Math.max(...transform.scale) * 4),
  );
  const yaw = (transform.rotation[1] * Math.PI) / 180;
  const target: SceneVector3 = [x, y + verticalExtent * 0.5, z];

  return {
    camera: [
      target[0] + Math.sin(yaw) * distance,
      target[1] + Math.max(1.8, verticalExtent * 1.3),
      target[2] + Math.cos(yaw) * distance,
    ],
    target,
  };
}

/**
 * Converts interactive custom scene objects into detail-page records.
 * Decorative objects intentionally never appear in navigation or open a
 * detail page.
 */
export function mergeCustomSceneAssets(
  locale: ContentLocale,
  config: SiteContentConfig = EMPTY_SITE_CONTENT,
  startingNumber = 13,
): PortfolioAsset[] {
  const firstNumber =
    typeof startingNumber === "number" && Number.isFinite(startingNumber)
      ? Math.max(1, Math.trunc(startingNumber))
      : 13;
  const customAssets =
    mergeSceneConfig(config).customAssets?.filter(
      (asset) => asset.behavior === "interactive",
    ) ?? [];

  return customAssets.map((asset, index) => {
    const override = asset.content[locale] ?? {};
    const number = String(firstNumber + index).padStart(2, "0");
    const objectLabel =
      override.objectLabel ||
      (locale === "zh" ? `自定义资产 ${number}` : `Custom asset ${number}`);
    const sectionTitle = override.sectionTitle || objectLabel;

    return {
      id: asset.id as PortfolioAsset["id"],
      number,
      category: locale === "zh" ? "创造" : "Making",
      objectLabel,
      sectionTitle,
      trait: override.trait ?? "",
      teaser: override.teaser || sectionTitle,
      intro: override.intro ?? "",
      accent: asset.accent,
      status:
        override.status || (locale === "zh" ? "场景资产" : "Scene asset"),
      lastUpdated: override.lastUpdated ?? "",
      focus: deriveCustomSceneAssetFocus(asset.transform),
      metrics: override.metrics?.map((metric) => ({ ...metric })) ?? [],
      entries: override.entries?.map(clonePortfolioEntry) ?? [],
      note: override.note ?? "",
      specialty: "default",
      related: [],
    };
  });
}

// Descriptive aliases retained for integrations written against early scene
// editor prototypes.
export type SiteSceneConfig = SceneConfig;
export type SceneCorePlacement = ScenePlacement;
export type SceneCustomAsset = CustomSceneAsset;
export function createCustomPortfolioAssets(
  config: SiteContentConfig,
  locale: ContentLocale,
  startingNumber = 13,
): PortfolioAsset[] {
  return mergeCustomSceneAssets(locale, config, startingNumber);
}
