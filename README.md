<div align="center">

<p><sub>AN INTERACTIVE PERSONAL SPACE · 一个会回应你的数字房间</sub></p>

<h1>The Living Index</h1>

<h3>A portfolio you do not scroll through — you step into it.</h3>

<p>An explorable bilingual room for a life, its work, and everything in between.</p>

<p>
  <a href="#english"><strong>English</strong></a>
  &nbsp;·&nbsp;
  <a href="#chinese"><strong>中文索引</strong></a>
</p>

<p>
  <a href="https://github.com/ACondaway/HOME-3D/actions/workflows/deploy.yml">
    <img alt="Validate and deploy" src="https://github.com/ACondaway/HOME-3D/actions/workflows/deploy.yml/badge.svg?branch=main">
  </a>
  <a href="https://github.com/ACondaway/HOME-3D/commits/main">
    <img alt="Last commit" src="https://img.shields.io/github/last-commit/ACondaway/HOME-3D?style=flat-square&color=c7a364">
  </a>
  <a href="https://github.com/ACondaway/HOME-3D">
    <img alt="Repository size" src="https://img.shields.io/github/repo-size/ACondaway/HOME-3D?style=flat-square&color=17312b">
  </a>
  <a href="https://docs.acondawayuno.com">
    <img alt="Mintlify documentation" src="https://img.shields.io/badge/docs-Mintlify-c7a364?style=flat-square">
  </a>
</p>

<p>
  <a href="https://docs.acondawayuno.com"><strong>Read the documentation ↗</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://github.com/ACondaway/HOME-3D"><strong>View the source ↗</strong></a>
</p>

</div>

<img
  src=".github/assets/living-index-hero.jpg"
  alt="The Living Index opening screen, rendered from the current application"
  width="100%"
>

<a id="english"></a>

## ✦ A portfolio you can enter

The Living Index turns a personal homepage into a small world: part portfolio, part archive, and part living self-portrait. Instead of navigating a stack of conventional pages, visitors move through a room where meaningful objects become entrances into music, research, photography, making, daily rituals, and future plans.

The 3D room is never the only way in. Every spatial interaction is mirrored by a complete semantic content index, so the same story remains accessible without WebGL, precise pointer control, or motion.

| 🌗 Time-aware | 🧭 Object-led | 🛠️ Studio-built |
|---|---|---|
| The author’s timezone moves the sun, changes the atmosphere, and turns on the night lights. | Objects are more than navigation icons: each one carries a chapter, memory, practice, or unfinished question. | Content, custom assets, object placement, photography, links, and modular cards can be shaped visually. |

<a id="experience"></a>

## 🖼️ Inside the experience

<table>
  <tr>
    <td width="50%">
      <img
        src=".github/assets/living-index-room.jpg"
        alt="The Living Index 3D room at night"
        width="100%"
      >
      <br>
      <sub>🌙 A time-aware room with navigable objects and ambient night lighting.</sub>
    </td>
    <td width="50%">
      <img
        src=".github/assets/living-index-index.jpg"
        alt="The accessible English content index"
        width="100%"
      >
      <br>
      <sub>📖 The complete English content index, with Chinese available from the same view.</sub>
    </td>
  </tr>
</table>

<a id="studio"></a>

## 🛠️ Content Studio

Content Studio keeps the portfolio editable without flattening it into a generic CMS. It supports bilingual profile content, composable text/media/link cards, personal photography, social links, custom GLB assets, and live scene arrangement.

Objects can be positioned through numeric controls or confirmed drag sessions across floor movement, height, and heading modes. Imported assets may remain purely decorative or become interactive entrances with their own page content.

<img
  src=".github/assets/living-index-layout.jpg"
  alt="Content Studio scene layout editor with editable room objects"
  width="100%"
>

<a id="highlights"></a>

## 🧩 Highlights

- 🌐 **Bilingual by design** — Chinese and English share one spatial system while keeping independent editorial content.
- ☀️ **Author-local lighting** — fixed GMT offsets and IANA timezones drive the clock, sun arc, twilight, and artificial lights.
- 🪞 **Object-shaped storytelling** — twelve built-in room objects open distinct chapters and visual modules.
- 📷 **Photography with focus** — every image remains visible, while spotlight images receive a dedicated editorial treatment.
- 🧱 **Composable content** — text, media, and link cards can be combined into standard, wide, or full-width layouts.
- 🧭 **Direct scene editing** — move, raise, rotate, scale, and confirm object placement without leaving the visual editor.
- 📦 **Bring your own assets** — validated self-contained GLB models can be added as decoration or interactive content.
- ♿ **An equal non-3D route** — semantic navigation, keyboard support, reduced motion, and graceful WebGL fallback are part of the core experience.

<a id="stack"></a>

## ⚙️ Built with

`Three.js` · `React 19` · `TypeScript` · `vinext` · `Vite` · `Cloudflare Workers`

The room uses a deliberately direct Three.js runtime for scene lifecycle, raycasting, camera motion, lighting, object manipulation, and GPU cleanup, while React owns the editorial UI and accessible content layers.

<a id="documentation"></a>

## 📚 Documentation

This README is the visual overview. Setup, local development, Content Studio workflows, content modeling, custom assets, scene placement, validation, deployment, and troubleshooting all live in the Mintlify guide:

### **[docs.acondawayuno.com →](https://docs.acondawayuno.com)**

---

<a id="chinese"></a>

## 中文索引

**The Living Index** 是一个中英双语的可探索三维个人主页。它把作品集、生活档案和自我介绍放进一间会随作者时区改变光照的房间；访客既可以通过物件进入不同内容章节，也可以跳过 3D，使用完整的语义化内容索引。

### 快速导航

- ✦ [项目理念：一个可以进入的作品集](#english)
- 🖼️ [实际界面与效果图](#experience)
- 🛠️ [Content Studio 可视化内容与场景编辑](#studio)
- 🧩 [功能亮点](#highlights)
- ⚙️ [技术栈](#stack)
- 📚 [Mintlify 完整文档](#documentation)

### 中文概览

- 🌗 根据作者本人的 GMT / IANA 时区渲染时钟、太阳位置、晨昏和夜间灯光。
- 🧭 使用房间物件组织音乐、研究、摄影、阅读、创作与生活内容。
- 🛠️ 在 Content Studio 中编辑双语资料、照片、社交链接和组合式内容卡片。
- 📦 上传自有 GLB 数字资产，并选择“纯装饰”或“可交互页面”。
- ↔️ 通过模式切换拖动物体，分别调整平面位置、高度和方向旋转，再统一确认。
- ♿ 提供键盘、减少动态效果、WebGL 降级和与 3D 等价的内容索引。

安装、使用、资产规范、内容结构和部署流程不在 README 中重复维护，请直接阅读 **[Mintlify 文档](https://docs.acondawayuno.com)**。

<div align="center">

<sub>© ACondawayUNo · Congsheng Xu</sub>

</div>
