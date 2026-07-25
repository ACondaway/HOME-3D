<div align="center">

<p><sub>AN INTERACTIVE PERSONAL SPACE</sub></p>

<h1>
  <img src=".github/assets/living-index-logo.png" alt="" width="72">
  &nbsp;The Living Index
</h1>

<h3>A portfolio you do not scroll through — you step into it.</h3>

<p>An explorable bilingual room for a life, its work, and everything in between.</p>

<p>
  <a href="./README.md"><strong>English</strong></a>
  &nbsp;·&nbsp;
  <a href="./README_cn.md">简体中文</a>
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

<img src=".github/assets/living-index-hero.jpg" alt="The Living Index opening screen, rendered from the current application" width="100%">

## ✦ A portfolio you can enter

The Living Index turns a personal homepage into a small world: part portfolio, part archive, and part living self-portrait. Instead of navigating a stack of conventional pages, visitors move through a room where meaningful objects become entrances into music, research, photography, making, daily rituals, and future plans.

The 3D room is never the only way in. Every spatial interaction is mirrored by a complete semantic content index, so the same story remains accessible without WebGL, precise pointer control, or motion.

| 🌗 Time-aware | 🧭 Object-led | 🛠️ Studio-built |
|---|---|---|
| The author’s timezone moves the sun, changes the atmosphere, and turns on the night lights. | Objects are more than navigation icons: each one carries a chapter, memory, practice, or unfinished question. | Content, custom assets, object placement, photography, links, and modular cards can be shaped visually. |

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

## 🛠️ Content Studio

Content Studio keeps the portfolio editable without flattening it into a generic CMS. It supports bilingual profile content, composable text/media/link cards, personal photography, social links, custom GLB assets, and live scene arrangement.

Objects can be positioned through numeric controls or confirmed drag sessions across floor movement, height, and heading modes. Imported assets may remain purely decorative or become interactive entrances with their own page content.

<img src=".github/assets/living-index-layout.jpg" alt="Content Studio scene layout editor with editable room objects" width="100%">

## 🧩 Highlights

- 🌐 **Bilingual by design** — Chinese and English share one spatial system while keeping independent editorial content.
- ☀️ **Author-local lighting** — fixed GMT offsets and IANA timezones drive the clock, sun arc, twilight, and artificial lights.
- 🪞 **Object-shaped storytelling** — twelve built-in room objects open distinct chapters and visual modules.
- 📷 **Photography with focus** — every image remains visible, while spotlight images receive a dedicated editorial treatment.
- 🧱 **Composable content** — text, media, and link cards can be combined into standard, wide, or full-width layouts.
- 🧭 **Direct scene editing** — move, raise, rotate, scale, and confirm object placement without leaving the visual editor.
- 📦 **Bring your own assets** — validated self-contained GLB models can be added as decoration or interactive content.
- ♿ **An equal non-3D route** — semantic navigation, keyboard support, reduced motion, and graceful WebGL fallback are part of the core experience.

## ⚙️ Built with

`Three.js` · `React 19` · `TypeScript` · `vinext` · `Vite` · `Cloudflare Workers`

The room uses a deliberately direct Three.js runtime for scene lifecycle, raycasting, camera motion, lighting, object manipulation, and GPU cleanup, while React owns the editorial UI and accessible content layers.

## 📚 Documentation

This README is the visual overview. Setup, local development, Content Studio workflows, content modeling, custom assets, scene placement, validation, deployment, and troubleshooting all live in the Mintlify guide:

### **[docs.acondawayuno.com →](https://docs.acondawayuno.com)**

<div align="center">

<sub>© ACondawayUNo · Congsheng Xu</sub>

</div>
