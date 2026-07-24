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
  assert.match(
    html,
    /<title>你的名字 \/ Your Name · The Living Index<\/title>/i,
  );
  assert.match(html, /Switch to English/);
  assert.match(html, /欢迎来/);
  assert.match(html, /打开内容索引/);
  assert.match(html, /个人空间 · 2026/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps bilingual content, 3D interaction, and fallback navigation in the product source", async () => {
  const [page, layout, room, data, dataEn, packageJson, studio, contentConfig] =
    await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/RoomExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/portfolio-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/portfolio-data-en.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/ContentStudio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/content-config.ts", import.meta.url), "utf8"),
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
  assert.match(contentConfig, /normalizeSiteContent/);
  assert.match(contentConfig, /mergeAssets/);
  assert.match(packageJson, /"three":/);
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
  assert.match(plugin, /MAX_BODY_BYTES = 256 \* 1024/);
  assert.match(plugin, /rename\(temporaryPath, path\)/);
  assert.match(viteConfig, /contentStudio\(\)/);
  const content = JSON.parse(persistedContent);

  assert.equal(content.version, 1);
  assert.equal(typeof content.profile, "object");
  assert.equal(Array.isArray(content.profile), false);
  assert.equal(typeof content.assets, "object");
  assert.equal(Array.isArray(content.assets), false);
});
