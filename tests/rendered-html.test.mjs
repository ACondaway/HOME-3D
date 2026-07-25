import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished personal-room experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /<title>[^<]+ · The Living Index<\/title>/i);
  assert.match(html, /Switch to English/);
  assert.match(html, /欢迎来/);
  assert.match(html, /打开内容索引/);
  assert.match(html, /个人空间 · 2026/);
  assert.match(html, /Copyright by ACondawayUNo, Congsheng Xu/);
  assert.match(
    html,
    /href="https:\/\/github\.com\/ACondaway\/HOME-3D"/,
  );
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps bilingual content, 3D interaction, and fallback navigation in the product source", async () => {
  const [
    page,
    layout,
    room,
    data,
    dataEn,
    packageJson,
    studio,
    contentConfig,
    aboutProfile,
    photographyGallery,
    imageUpload,
    modelUpload,
    sceneStudio,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/RoomExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/portfolio-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/portfolio-data-en.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/ContentStudio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/content-config.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/AboutProfileModule.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/PhotographyGallery.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ImageUploadField.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ModelUploadField.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/SceneStudio.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<RoomExperience \/>/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /中英双语三维个人主页/);
  assert.match(room, /OrbitControls/);
  assert.match(room, /Raycaster/);
  assert.match(room, /prefers-reduced-motion/);
  assert.match(room, /<noscript>/);
  assert.match(room, /跳过三维场景，打开内容索引/);
  assert.match(room, /Switch to English/);
  assert.match(room, /new URL\(window\.location\.href\)\.searchParams\.get\("lang"\)/);
  assert.match(room, /<ContentStudio/);
  assert.match(room, /params\.get\("studio"\)/);
  assert.match(room, /GLTFLoader/);
  assert.match(room, /applyCorePlacement/);
  assert.match(room, /asset\.behavior !== "interactive"/);
  assert.match(room, /handleRef\.current\?\.sync\(sceneConfig, assets\)/);
  assert.match(room, /runtimeAssetById/);
  assert.match(room, /mergeCustomSceneAssets/);
  assert.match(room, /mergeSceneConfig/);
  assert.match(room, /Object\.hasOwn\(assetById, section\)/);
  assert.match(room, /new AbortController\(\)/);
  assert.match(room, /sourceData instanceof ImageBitmap/);
  assert.match(data, /id: "music"/);
  assert.match(data, /id: "fitness"/);
  assert.match(data, /id: "reading"/);
  assert.match(data, /id: "future"/);
  assert.match(dataEn, /id: "music"/);
  assert.match(dataEn, /id: "future"/);
  assert.match(dataEn, /PORTFOLIO_ASSETS_EN/);
  assert.match(studio, /Save to project/);
  assert.match(studio, /\/__content-studio\/save/);
  assert.match(studio, /site-content\.json/);
  assert.match(studio, /\.\.\.config\.profile\[locale\]/);
  assert.match(
    studio,
    /\.\.\.config\.assets\[locale\]\?\.\[asset\.id\]/,
  );
  assert.match(studio, /const normalized = parseSiteContent\(config\)/);
  assert.match(studio, /stablePhotographyEntries/);
  assert.match(studio, /STUDIO_LOCALES/);
  assert.match(studio, /onChange\(\(current\)/);
  assert.match(studio, /photography-spotlight/);
  assert.match(studio, /<SceneStudio/);
  assert.match(studio, /is-scene-preview/);
  assert.match(studio, /setAttribute\("inert", ""\)/);
  assert.match(studio, /new TextEncoder\(\)/);
  assert.match(imageUpload, /\/__content-studio\/upload/);
  assert.match(imageUpload, /onDrop=/);
  assert.match(modelUpload, /\/__content-studio\/upload\?kind=models/);
  assert.match(modelUpload, /MAX_MODEL_BYTES = 24 \* 1024 \* 1024/);
  assert.match(modelUpload, /onDrop=/);
  assert.match(modelUpload, /accept=\{ACCEPTED_MODEL_TYPES\}/);
  assert.match(sceneStudio, /updateCorePlacement/);
  assert.match(sceneStudio, /<TransformEditor/);
  assert.match(sceneStudio, /value="decorative"/);
  assert.match(sceneStudio, /value="interactive"/);
  assert.match(sceneStudio, /<ModelUploadField/);
  assert.match(aboutProfile, /about-social-links/);
  assert.match(aboutProfile, /noopener noreferrer/);
  assert.match(photographyGallery, /instant-photo-dialog/);
  assert.match(photographyGallery, /aria-modal="true"/);
  assert.match(photographyGallery, /photography-spotlight-feature/);
  assert.match(photographyGallery, /photography-spotlight-copy/);
  assert.match(photographyGallery, /orderedPhotos\.map/);
  assert.match(room, /asset\.id !== "photography"/);
  assert.match(contentConfig, /normalizeSiteContent/);
  assert.match(contentConfig, /mergeAssets/);
  assert.match(contentConfig, /mergeMedia/);
  assert.match(contentConfig, /mergeSocialLinks/);
  assert.match(contentConfig, /timezone: "GMT\+8"/);
  assert.match(packageJson, /"three":/);
  assert.match(packageJson, /"react-icons":/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(
    access(new URL("app/_sites-preview", projectRoot)),
  );
});

test("keeps the Content Studio write endpoint local to the Vite development server", async () => {
  const [plugin, viteConfig, persistedContent] = await Promise.all([
    readFile(
      new URL("../build/content-studio-vite-plugin.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../public/content/site-content.json", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(plugin, /apply: "serve"/);
  assert.match(plugin, /configureServer/);
  assert.match(plugin, /hasLoopbackHost/);
  assert.match(plugin, /hasLoopbackOrigin/);
  assert.match(plugin, /MAX_SAVE_BODY_BYTES = 24 \* 1024 \* 1024/);
  assert.match(
    plugin,
    /MAX_IMAGE_UPLOAD_BODY_BYTES = 10 \* 1024 \* 1024/,
  );
  assert.match(
    plugin,
    /MAX_MODEL_UPLOAD_BODY_BYTES = 24 \* 1024 \* 1024/,
  );
  assert.match(plugin, /\/__content-studio\/upload/);
  assert.match(plugin, /detectImageFormat/);
  assert.match(plugin, /validateGlb/);
  assert.match(plugin, /document\.asset\.version !== "2\.0"/);
  assert.match(plugin, /EXTERNAL_GLB_RESOURCE/);
  assert.match(plugin, /contentType !== "model\/gltf-binary"/);
  assert.match(plugin, /randomUUID/);
  assert.match(plugin, /public", "uploads"/);
  assert.match(plugin, /rename\(temporaryPath, path\)/);
  assert.match(viteConfig, /contentStudio\(\)/);
  const content = JSON.parse(persistedContent);

  assert.equal(content.version, 1);
  assert.equal(typeof content.profile, "object");
  assert.equal(Array.isArray(content.profile), false);
  assert.equal(typeof content.assets, "object");
  assert.equal(Array.isArray(content.assets), false);
});

test("declares each Cloudflare compatibility flag exactly once", async () => {
  const [viteConfig, sourceConfig, generatedConfig] = await Promise.all([
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
    readFile(new URL("../dist/server/wrangler.json", import.meta.url), "utf8"),
  ]);
  const parsedSourceConfig = JSON.parse(sourceConfig);
  const parsedGeneratedConfig = JSON.parse(generatedConfig);

  assert.deepEqual(parsedSourceConfig.compatibility_flags, [
    "nodejs_compat",
  ]);
  assert.deepEqual(parsedGeneratedConfig.compatibility_flags, [
    "nodejs_compat",
  ]);
  assert.doesNotMatch(viteConfig, /compatibility_flags\s*:/);
});
