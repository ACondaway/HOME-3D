<div align="center">

<p><sub>一个可交互的个人数字空间</sub></p>

<h1>
  <img src=".github/assets/living-index-logo.png" alt="" width="72">
  &nbsp;The Living Index
</h1>

<h3>这不是一个需要向下滚动的作品集，而是一间可以走进去的房间。</h3>

<p>一个用于容纳生活、作品与未完成想法的中英双语三维个人空间。</p>

<p>
  <a href="./README.md">English</a>
  &nbsp;·&nbsp;
  <a href="./README_cn.md"><strong>简体中文</strong></a>
</p>

<p>
  <a href="https://github.com/ACondaway/HOME-3D/actions/workflows/deploy.yml">
    <img alt="验证与部署状态" src="https://github.com/ACondaway/HOME-3D/actions/workflows/deploy.yml/badge.svg?branch=main">
  </a>
  <a href="https://github.com/ACondaway/HOME-3D/commits/main">
    <img alt="最近提交" src="https://img.shields.io/github/last-commit/ACondaway/HOME-3D?style=flat-square&color=c7a364">
  </a>
  <a href="https://github.com/ACondaway/HOME-3D">
    <img alt="仓库大小" src="https://img.shields.io/github/repo-size/ACondaway/HOME-3D?style=flat-square&color=17312b">
  </a>
  <a href="https://docs.acondawayuno.com">
    <img alt="Mintlify 文档" src="https://img.shields.io/badge/docs-Mintlify-c7a364?style=flat-square">
  </a>
</p>

<p>
  <a href="https://docs.acondawayuno.com"><strong>阅读完整文档 ↗</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://github.com/ACondaway/HOME-3D"><strong>查看源代码 ↗</strong></a>
</p>

</div>

![The Living Index 当前应用的首屏](./.github/assets/living-index-hero.jpg)

## ✦ 一个可以进入的作品集

The Living Index 把个人主页变成一个小型世界：它既是作品集，也是生活档案与持续变化的自我肖像。访客不需要在传统页面之间跳转，而是可以在房间中自由探索，通过具有个人意义的物件进入音乐、研究、摄影、创作、日常仪式和未来计划。

三维房间并不是唯一入口。每一个空间交互都有完整的语义化内容索引与之对应，因此即使没有 WebGL、精确指针操作或动态效果，访客依然可以完整阅读同样的内容。

| 🌗 随时间变化 | 🧭 以物件组织 | 🛠️ 可视化编辑 |
|---|---|---|
| 作者本人的时区会推动太阳位置、环境氛围与夜间灯光。 | 物件不只是导航图标，每一件都承载一个章节、记忆、习惯或尚未解决的问题。 | 内容、自定义资产、物体摆放、摄影、链接与组合式卡片都可以直接编辑。 |

## 🖼️ 实际体验

<table>
  <tr>
    <td width="50%">
      <img
        src=".github/assets/living-index-room.jpg"
        alt="The Living Index 夜间三维房间"
        width="100%"
      >
      <br>
      <sub>🌙 根据作者时区变化的三维房间、物件入口与夜间灯光。</sub>
    </td>
    <td width="50%">
      <img
        src=".github/assets/living-index-index.jpg"
        alt="The Living Index 英文内容索引"
        width="100%"
      >
      <br>
      <sub>📖 与三维体验等价的完整内容索引，可在同一界面切换中英文。</sub>
    </td>
  </tr>
</table>

## 🛠️ Content Studio

Content Studio 让个人主页保持可编辑，同时避免退化成一个通用 CMS。它支持中英文个人资料、纯文字/图文/链接卡片、个人摄影、社交账号、自定义 GLB 资产与实时场景排布。

物件既可以通过数值精确设置，也可以进入可确认的拖动会话，分别调整平面位置、高度和方向旋转。导入的资产可以只作为装饰，也可以成为拥有独立内容页面的交互入口。

![Content Studio 场景布局编辑器](./.github/assets/living-index-layout.jpg)

## 🧩 功能亮点

- 🌐 **原生双语结构** — 中英文共享同一套空间与交互系统，同时保持独立的编辑内容。
- ☀️ **作者时区光照** — GMT 固定偏移或 IANA 时区共同驱动时钟、太阳弧、晨昏与室内灯。
- 🪞 **以物件组织叙事** — 十二件内置房间物件打开不同的内容章节与视觉模块。
- 📷 **完整摄影展示** — 所有照片都会展示，Spotlight 图片拥有单独的文字介绍区域。
- 🧱 **组合式内容卡片** — 纯文字、图文和链接按钮可以使用标准、宽版或整行布局。
- 🧭 **直接编辑场景** — 移动、升降、旋转、缩放并确认物体摆放，不需要离开可视化编辑器。
- 📦 **导入自有资产** — 经过校验的自包含 GLB 可以作为纯装饰或新的交互内容。
- ♿ **与 3D 等价的阅读路径** — 语义化导航、键盘、减少动态效果和 WebGL 降级属于核心体验。

## ⚙️ 技术栈

`Three.js` · `React 19` · `TypeScript` · `vinext` · `Vite` · `Cloudflare Workers`

项目直接使用 Three.js 管理场景生命周期、Raycaster、相机运动、光照、物体操作与 GPU 资源清理；React 负责编辑界面、状态与可访问内容层。

## 📚 完整文档

README 只负责项目介绍与视觉预览。本地开发、Content Studio 工作流、内容模型、自定义资产、场景摆放、校验、部署和问题排查统一维护在 Mintlify：

### **[docs.acondawayuno.com →](https://docs.acondawayuno.com)**

<div align="center">

<sub>© ACondawayUNo · Congsheng Xu</sub>

</div>
