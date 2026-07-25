import assert from "node:assert/strict";
import test from "node:test";

const contentConfig = (await import(
  new URL("../app/content-config.ts", import.meta.url).href
)) as typeof import("../app/content-config");
const { isAssetId } = (await import(
  new URL("../app/portfolio-data.ts", import.meta.url).href
)) as typeof import("../app/portfolio-data");

const {
  DEFAULT_SCENE_TRANSFORM,
  isValidSocialUrl,
  mergeCustomSceneAssets,
  mergeMedia,
  mergeSceneConfig,
  mergeSocialLinks,
  normalizeSiteContent,
  parseSiteContent,
  resolvePhotographyEntryId,
  resolvePhotographyEntryIds,
} = contentConfig;

const profilePhotoPath =
  "/uploads/profile/11111111-1111-4111-8111-111111111111.webp";
const photographyPath =
  "/uploads/photography/22222222-2222-4222-8222-222222222222.jpg";
const modelPath =
  "/uploads/models/33333333-3333-4333-8333-333333333333.glb";

const emptyDocument = {
  version: 1 as const,
  profile: {},
  assets: {},
};

test("keeps old version-one content compatible with optional media fields", () => {
  const normalized = normalizeSiteContent(emptyDocument);

  assert.deepEqual(normalized, emptyDocument);
  assert.deepEqual(
    mergeSocialLinks(normalized).map((link) => link.platform),
    ["github", "email"],
  );
  assert.deepEqual(mergeMedia(normalized), {});
});

test("accepts only own core asset ids", () => {
  assert.equal(isAssetId("music"), true);
  assert.equal(isAssetId("toString"), false);
  assert.equal(isAssetId("constructor"), false);
  assert.equal(isAssetId("__proto__"), false);
});

test("normalizes repository media and rejects unsafe image sources", () => {
  const normalized = normalizeSiteContent({
    ...emptyDocument,
    media: {
      profilePhotoSrc: profilePhotoPath,
      profilePhotoAlt: {
        zh: "  徐聪晟的个人照片  ",
        en: "Portrait of Congsheng Xu",
      },
      photography: {
        spotlightId: "lights-on",
        sources: {
          "lights-on": photographyPath,
          remote: "https://example.com/tracker.jpg",
          traversal: "/uploads/../secret.png",
          encoded: "/uploads/%5c..%5csecret.png",
        },
      },
    },
  });

  assert.equal(
    normalized.media?.profilePhotoSrc,
    profilePhotoPath,
  );
  assert.equal(
    normalized.media?.profilePhotoAlt?.zh,
    "徐聪晟的个人照片",
  );
  assert.deepEqual(normalized.media?.photography?.sources, {
    "lights-on": photographyPath,
  });
  assert.equal(
    normalized.media?.photography?.spotlightId,
    "lights-on",
  );
  assert.deepEqual(
    resolvePhotographyEntryIds([
      {
        id: "lights-on",
        eyebrow: "",
        title: "",
        body: "",
        meta: "",
      },
      {
        id: "lights-on",
        eyebrow: "",
        title: "",
        body: "",
        meta: "",
      },
    ]),
    ["lights-on", "lights-on-2"],
  );
});

test("keeps only social URLs that match their platform protocol", () => {
  const normalized = normalizeSiteContent({
    ...emptyDocument,
    socialLinks: [
      {
        id: "github",
        platform: "github",
        url: "https://github.com/ACondaway",
        label: { zh: "代码", en: "GitHub" },
      },
      {
        id: "email",
        platform: "email",
        url: "mailto:acondaway@sjtu.edu.cn",
      },
      {
        id: "script",
        platform: "website",
        url: "javascript:alert(1)",
      },
      {
        id: "wrong-email",
        platform: "email",
        url: "https://example.com",
      },
    ],
  });

  assert.deepEqual(
    normalized.socialLinks?.map(({ id, platform }) => ({ id, platform })),
    [
      { id: "github", platform: "github" },
      { id: "email", platform: "email" },
    ],
  );
  assert.equal(normalized.socialLinks?.[0]?.label?.zh, "代码");
  assert.deepEqual(
    mergeSocialLinks({ ...emptyDocument, socialLinks: [] }),
    [],
  );
  assert.equal(isValidSocialUrl("website", "https://"), false);
  assert.equal(
    isValidSocialUrl("email", "mailto:acondaway@sjtu.edu.cn"),
    true,
  );
});

test("preserves stable photography ids and localized image descriptions", () => {
  const normalized = normalizeSiteContent({
    ...emptyDocument,
    assets: {
      zh: {
        photography: {
          entries: [
            {
              id: "lights-on",
              imageAlt: " 夜晚亮着灯的窗户 ",
              eyebrow: "SERIES 01",
              title: "灯还亮着",
              body: "系列说明",
              meta: "Shanghai",
            },
          ],
        },
      },
    },
  });

  assert.deepEqual(normalized.assets.zh?.photography?.entries, [
    {
      id: "lights-on",
      imageAlt: "夜晚亮着灯的窗户",
      eyebrow: "SERIES 01",
      title: "灯还亮着",
      body: "系列说明",
      meta: "Shanghai",
    },
  ]);
  assert.equal(
    resolvePhotographyEntryId(
      {
        eyebrow: "SERIES 01",
        title: "旧版条目",
        body: "",
        meta: "",
      },
      0,
    ),
    "lights-on",
  );
});

test("normalizes photography ids into unique ARIA-safe identifiers", () => {
  const normalized = normalizeSiteContent({
    ...emptyDocument,
    assets: {
      en: {
        photography: {
          entries: [
            {
              id: "Same ID",
              eyebrow: "ONE",
              title: "First",
              body: "",
              meta: "",
            },
            {
              id: "same-id",
              eyebrow: "TWO",
              title: "Second",
              body: "",
              meta: "",
            },
          ],
        },
      },
    },
  });
  const entries = normalized.assets.en?.photography?.entries ?? [];

  assert.equal(entries[0]?.id, "same-id");
  assert.equal(entries[1]?.id, undefined);
  assert.deepEqual(resolvePhotographyEntryIds(entries), [
    "same-id",
    "temporary-tables",
  ]);
});

test("keeps version-one scene data compatible through parse and merge", () => {
  const parsed = parseSiteContent(
    JSON.stringify({
      ...emptyDocument,
      scene: {
        placements: {
          music: {
            position: [1, 2, 3],
            rotation: [0, 45, 0],
            scale: [1, 1.25, 1],
          },
        },
        customAssets: [
          {
            id: "custom-reading-lamp",
            behavior: "decorative",
            modelSrc: modelPath,
            accent: "#a1b2c3",
            transform: {
              position: [2, 0, -1],
              rotation: [0, 90, 0],
              scale: [1, 1, 1],
            },
            content: {
              zh: { objectLabel: " 阅读灯 " },
            },
          },
        ],
      },
    }),
  );

  assert.deepEqual(parsed.scene?.placements?.music, {
    position: [1, 2, 3],
    rotation: [0, 45, 0],
    scale: [1, 1.25, 1],
  });
  assert.equal(parsed.scene?.customAssets?.[0]?.modelSrc, modelPath);
  assert.equal(parsed.scene?.customAssets?.[0]?.accent, "#A1B2C3");
  assert.equal(
    parsed.scene?.customAssets?.[0]?.content.zh?.objectLabel,
    "阅读灯",
  );

  const detached = mergeSceneConfig(parsed);
  detached.placements?.music?.position?.splice(0, 1, 40);
  detached.customAssets?.[0]?.transform.position.splice(0, 1, 40);
  if (detached.customAssets?.[0]?.content.zh) {
    detached.customAssets[0].content.zh.objectLabel = "已修改";
  }

  assert.deepEqual(parsed.scene?.placements?.music?.position, [1, 2, 3]);
  assert.deepEqual(
    parsed.scene?.customAssets?.[0]?.transform.position,
    [2, 0, -1],
  );
  assert.equal(
    parsed.scene?.customAssets?.[0]?.content.zh?.objectLabel,
    "阅读灯",
  );
});

test("clamps scene transforms, deduplicates ids, and rejects unsafe models", () => {
  const normalized = normalizeSiteContent({
    ...emptyDocument,
    scene: {
      placements: {
        music: {
          position: [999, -999, 3],
          rotation: [720, -720, Number.NaN],
          scale: [0, 999, Number.POSITIVE_INFINITY],
        },
        unknown: {
          position: [1, 1, 1],
        },
      },
      customAssets: [
        {
          id: "Custom Sculpture",
          behavior: "interactive",
          modelSrc: modelPath,
          accent: "#12abEF",
          transform: {
            position: [51, -51, Number.NaN],
            rotation: [361, -361, 90],
            scale: [-2, 21, 2],
          },
          content: {
            en: {
              sectionTitle: " Digital sculpture ",
              metrics: [{ value: " 01 ", label: " Edition " }],
            },
          },
        },
        {
          id: "custom-sculpture",
          behavior: "decorative",
          accent: "#FFFFFF",
          transform: DEFAULT_SCENE_TRANSFORM,
          content: {},
        },
        {
          id: "custom-bad-model",
          behavior: "decorative",
          modelSrc: "/uploads/models/../../secret.glb",
          accent: "url(javascript:alert(1))",
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          content: {},
        },
        {
          id: "not-custom",
          behavior: "interactive",
          modelSrc: "https://example.com/tracker.glb",
          accent: "#FFFFFF",
          transform: DEFAULT_SCENE_TRANSFORM,
          content: {},
        },
      ],
    },
  });

  assert.deepEqual(normalized.scene?.placements?.music, {
    position: [50, -50, 3],
    rotation: [360, -360, 0],
    scale: [0.05, 20, 1],
  });
  assert.equal(
    Object.hasOwn(normalized.scene?.placements ?? {}, "unknown"),
    false,
  );
  assert.equal(normalized.scene?.customAssets?.length, 2);
  assert.deepEqual(normalized.scene?.customAssets?.[0], {
    id: "custom-sculpture",
    behavior: "interactive",
    modelSrc: modelPath,
    accent: "#12ABEF",
    transform: {
      position: [50, -50, 0],
      rotation: [360, -360, 90],
      scale: [0.05, 20, 2],
    },
    content: {
      en: {
        sectionTitle: "Digital sculpture",
        metrics: [{ value: "01", label: "Edition" }],
      },
    },
  });
  assert.equal(normalized.scene?.customAssets?.[1]?.modelSrc, undefined);
  assert.equal(normalized.scene?.customAssets?.[1]?.accent, "#C99A62");
});

test("limits custom scene assets and creates pages only for interactive ones", () => {
  const generatedAssets = Array.from({ length: 30 }, (_, index) => ({
    id: `custom-object-${index + 1}`,
    behavior: index === 0 ? "decorative" : "interactive",
    accent: "#456789",
    transform: {
      position: [2 + index, 1, -3],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    content:
      index === 1
        ? {
            zh: {
              objectLabel: "数字雕塑",
              sectionTitle: "可进入的雕塑",
              trait: "一件测试中的作品",
              teaser: "查看作品",
              intro: "作品介绍",
              status: "持续迭代",
              lastUpdated: "JUL 2026",
              metrics: [{ value: "01", label: "版本" }],
              entries: [
                {
                  eyebrow: "NOTE",
                  title: "第一版",
                  body: "描述",
                  meta: "2026",
                },
              ],
              note: "自定义备注",
            },
          }
        : {},
  }));
  const config = normalizeSiteContent({
    ...emptyDocument,
    scene: { customAssets: generatedAssets },
  });

  assert.equal(config.scene?.customAssets?.length, 24);
  const pages = mergeCustomSceneAssets("zh", config);
  assert.equal(pages.length, 23);
  assert.equal(
    pages.some((asset) => asset.id === "custom-object-1"),
    false,
  );
  assert.deepEqual(pages[0], {
    id: "custom-object-2",
    number: "13",
    category: "创造",
    objectLabel: "数字雕塑",
    sectionTitle: "可进入的雕塑",
    trait: "一件测试中的作品",
    teaser: "查看作品",
    intro: "作品介绍",
    accent: "#456789",
    status: "持续迭代",
    lastUpdated: "JUL 2026",
    focus: {
      camera: [3, 3.3, 1],
      target: [3, 1.5, -3],
    },
    metrics: [{ value: "01", label: "版本" }],
    entries: [
      {
        eyebrow: "NOTE",
        title: "第一版",
        body: "描述",
        meta: "2026",
      },
    ],
    note: "自定义备注",
    specialty: "default",
    related: [],
  });
  assert.equal(
    mergeCustomSceneAssets("en", config, 20)[0]?.number,
    "20",
  );
  assert.equal(
    mergeCustomSceneAssets("en", config, 20)[0]?.category,
    "Making",
  );
});

test("keeps interactive custom asset labels non-empty", () => {
  const config = normalizeSiteContent({
    ...emptyDocument,
    scene: {
      customAssets: [
        {
          id: "custom-empty-labels",
          behavior: "interactive",
          accent: "#456789",
          transform: DEFAULT_SCENE_TRANSFORM,
          content: {
            zh: {
              objectLabel: "   ",
              sectionTitle: "",
              teaser: "",
              status: "",
            },
          },
        },
      ],
    },
  });

  const [asset] = mergeCustomSceneAssets("zh", config);
  assert.equal(asset?.objectLabel, "自定义资产 13");
  assert.equal(asset?.sectionTitle, "自定义资产 13");
  assert.equal(asset?.teaser, "自定义资产 13");
  assert.equal(asset?.status, "场景资产");
});
