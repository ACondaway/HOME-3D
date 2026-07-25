import assert from "node:assert/strict";
import test from "node:test";

const contentConfig = (await import(
  new URL("../app/content-config.ts", import.meta.url).href
)) as typeof import("../app/content-config");

const {
  isValidSocialUrl,
  mergeMedia,
  mergeSocialLinks,
  normalizeSiteContent,
  resolvePhotographyEntryId,
  resolvePhotographyEntryIds,
} = contentConfig;

const profilePhotoPath =
  "/uploads/profile/11111111-1111-4111-8111-111111111111.webp";
const photographyPath =
  "/uploads/photography/22222222-2222-4222-8222-222222222222.jpg";

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
