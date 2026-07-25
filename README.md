# The Living Index｜一间会回应你的房间

一个使用 Three.js、React、TypeScript 与 vinext 构建的三维可交互个人主页。

它不是把传统作品集塞进一个 3D 场景，而是把“物品”作为个人特质的证据：留声机连接音乐，哑铃连接身体计划，书架连接阅读边注，研究桌连接学术与问题，原型台连接创造，门连接未来。访客可以自由拖动视角探索房间，也可以完全跳过 3D，通过语义化内容索引浏览同样完整的信息。

当前版本不依赖任何外部模型、远程纹理、CDN 字体或第三方接口；即使网络资源全部失效，房间和 12 个内容入口仍然可以运行。所有可见物体由 Three.js 标准几何体程序化搭建，后续可以逐件替换成高质量 GLB。

---

## 1. 已实现的体验

- 可拖动、缩放、平移的剖面微缩房间。
- 根据个人资料中的 IANA 时区读取当地时间，驱动太阳弧、环境光、天空色与窗边日照。
- 晨昏平滑过渡，夜间自动点亮吊灯和研究桌灯；当地时钟与当前光照阶段显示在房间 HUD。
- 页面右下角展示个人版权说明，并链接到项目的 GitHub 仓库。
- 12 个可拾取、可聚焦、可深链接的 3D 数字资产。
- 鼠标、触摸、滚轮、键盘操作。
- 点击与拖动阈值区分，拖拽相机不会误开内容页。
- 每件资产独立的侧栏/全屏子界面。
- 音乐波形、训练节律、阅读边注、研究路径、作品接触印样、时间线等差异化内容模块。
- URL 深链接，例如 `/?section=music`、`/?section=reading`。
- 浏览器返回键、`Esc` 关闭、`R` 重置视角。
- 与 3D 内容等价的 DOM 内容索引。
- WebGL 初始化失败时的轻量入口。
- `prefers-reduced-motion` 降低动画。
- 移动端全屏内容页、DPR 限制、安全区适配。
- 无远程运行时资源，首版部署稳定且没有资产许可风险。
- 中英文双语界面、12 个章节双语内容与可访问文案。
- 语言状态写入 URL 与浏览器本地存储，分享链接和刷新都可恢复。
- GitHub Actions 自动执行类型检查、代码检查、构建、测试与生产部署。

### 中英文版本

中文是默认语言，英文可以通过任意页面右上角的 `中 / EN` 按钮进入。语言按钮在首屏、房间 HUD、内容索引、帮助页和每个资产详情页中都可使用。

常用链接：

```text
/?lang=zh
/?lang=en
/?lang=zh&section=music
/?lang=en&section=music
```

实现细节：

- URL 中的 `lang=en|zh` 优先级最高；
- 未指定 `lang` 时读取 `localStorage` 中最近一次选择；
- 中文使用 `zh-CN`，英文使用 `en` 更新页面语言属性；
- 切换语言不会重建 Three.js renderer，也不会丢失当前 `section`；
- 12 件资产的几何位置、相机焦点与 ID 在两种语言中完全一致；
- 英文使用独立字体顺序、标题比例与长单词换行规则；
- 服务端首屏使用双语 metadata，客户端根据选择更新标题与描述。

这是“单入口、查询参数切换”的双语实现，适合当前交互式主页。若未来需要让每个英文章节获得独立搜索排名，应再把内容升级为 `/zh/...` 和 `/en/...` 静态路由，并为各章节生成独立 canonical、Open Graph 与 sitemap 项。

### 当地时间与昼夜光照

房间把内容配置中的 `profile.timezone` 视为作者本人的时区，而不是访客设备的时区。它既支持个人介绍中常用的固定偏移写法（例如 `GMT+8`、`UTC-5`），也支持 IANA 时区（例如 `Asia/Shanghai`）。当地日期与时钟会驱动太阳主光、环境光、雾、窗户色温与地面日照；晨昏阶段会交叠自然光和室内灯，夜间则由吊灯、研究桌灯和微弱月光维持可探索性。时区在内容工作台修改后会热更新，不会重建 Three.js renderer。

当前实现是“当地时间驱动的风格化太阳弧”，采用稳定的晨昏区间，不暗中假设访客所在的纬度或南北半球。仅凭时区无法得到天文意义上的真实太阳方位；若后续需要精确日出、日落与太阳高度，应在 profile 中增加纬度、经度，再接入天文算法。

### 为什么采用“剖面房间”

`OrbitControls` 适合围绕一个空间观察，但它不是第一人称游戏控制器。完整封闭房间若没有碰撞检测，很容易出现相机穿墙、卡在家具中或转到墙外的问题。

本项目把正面与右侧墙体移除，形成类似舞台或建筑模型的剖面房间：

1. 访客仍可自由拖动视角；
2. 所有重要资产都能被看到；
3. 不需要引入物理引擎、碰撞体和第一人称眩晕控制；
4. 移动端也能保持稳定；
5. 空间更像“可探索的自传”，而不是小游戏。

如果未来必须做真正的第一人称漫游，需要增加 Pointer Lock、移动端双摇杆、碰撞检测、导航边界和晕动减弱选项，不建议把这部分塞进当前首版。

---

## 2. 当前 12 个数字资产

所有内容集中在 [`app/portfolio-data.ts`](./app/portfolio-data.ts)，不是散落在 3D 场景、弹窗和导航中的多份文案。

| 编号 | 房间资产 | 代表特质 | 子界面 | 当前视觉模块 |
|---|---|---|---|---|
| 01 | 留声机与唱片 | 情绪感知、音乐创造 | 声音工作室 | DAW 风格波形、轨道与作品说明 |
| 02 | 哑铃、壶铃与瑜伽垫 | 自律、身体意识、恢复 | 身体计划 | 一周训练节律、阶段指标 |
| 03 | 书架与边注书籍 | 阅读、吸收、观点形成 | 阅读与边注 | 手写纸张、摘录与个人批注 |
| 04 | 研究桌与电脑 | 研究能力、问题解决 | 研究桌 | 问题→假设→证据→反思 |
| 05 | 原型工作台 | 动手能力、迭代意识 | 造物台 | 案例、原型与失败复盘 |
| 06 | 相机 | 观察力、审美取向 | 取景 | 接触印样与摄影系列 |
| 07 | 茶桌与茶具 | 仪式感、生活质地 | 日常口味 | 城市片段与物件故事 |
| 08 | 植物 | 耐心、照料、长期主义 | 生长记录 | 习惯、学习与主动放下 |
| 09 | 镜子 | 自我认识、价值观 | 关于我 | 能力、原则、仍在学习 |
| 10 | 明信片墙 | 记忆、归属、感恩 | 来路 | 城市、关系与时间线 |
| 11 | 老式电话 | 开放性、沟通边界 | 留句话 | 合作主题与联系方式 |
| 12 | 尚未开启的门 | 方向、愿望、未完成 | 下一间房 | 6–12 个月公开路线图 |

### 推荐扩展到 18 个资产

以下六件暂未进入首版 3D，但内容结构已经适合继续扩展：

| 资产 | 代表特质 | 建议子界面 | 推荐放置位置 |
|---|---|---|---|
| 软木问题墙 / 黑板 | 系统思考、好奇心 | 问题地图、知识图谱、未解决假设 | 研究桌上方 |
| 画架与草图本 | 视觉表达、保留可能 | 设计过程、草图→完成稿对照 | 左侧窗边 |
| 老式投影机 | 叙事、演讲、影像表达 | 演讲、短片、课程、逐字稿 | 房间中央后侧 |
| 圆桌与两把椅子 | 倾听、合作、共同完成 | 合作项目、协作者署名、推荐语 | 房间中央 |
| 修补过的陶杯 | 韧性、复盘 | 失败假设、承担、改变与证据 | 茶桌上 |
| 行李箱 | 流动、选择与准备 | 学习队列、旅行方法、愿望清单 | 未来之门旁 |

不要让所有装饰物都可点击。只有真正拥有内容的资产才显示统一信号点、悬停名称和选择光环，否则房间会像布满按钮的展厅。

---

## 3. 技术栈

- React 19
- TypeScript 5
- Three.js 0.185
- OrbitControls
- Next.js App Router API
- vinext + Vite
- Cloudflare Workers / Sites 部署产物
- CSS 原生响应式、动画与可访问样式

项目没有引入 React Three Fiber、Drei、GSAP、物理引擎或后处理包。当前只有一个场景，命令式 Three.js 更容易控制：

- renderer 和 WebGL 生命周期；
- Raycaster 拾取；
- click/drag 判定；
- 相机补间；
- DOM 内容层与 Canvas 的边界；
- GPU 资源清理；
- Cloudflare Worker 客户端包体。

---

## 4. 项目结构

```text
.
├── app/
│   ├── layout.tsx              # 站点语言、SEO、viewport、全局元数据
│   ├── page.tsx                # 页面入口
│   ├── RoomExperience.tsx      # Three 场景、交互、HUD、索引、详情页
│   ├── ContentStudio.tsx       # 可视化内容工作台
│   ├── content-config.ts       # 内容 schema、校验与双语合并
│   ├── portfolio-data.ts       # 中文资产内容与共享类型
│   ├── portfolio-data-en.ts    # 英文资产内容
│   └── globals.css             # 完整视觉系统和响应式样式
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub 检查与 Cloudflare 自动部署
├── tests/
│   └── rendered-html.test.mjs  # 构建产物与产品结构冒烟测试
├── ASSET_CREDITS.md            # 外部模型/材质授权归档
├── .openai/
│   └── hosting.json            # Sites 项目标识与可选逻辑绑定
├── build/
│   ├── content-studio-vite-plugin.ts # 仅本地开发可用的安全保存接口
│   └── sites-vite-plugin.ts    # Sites 构建插件
├── public/
│   ├── content/
│   │   └── site-content.json   # GUI 写入并随网站发布的内容覆盖
│   └── models/
│       └── README.md
├── worker/
│   └── index.ts                # Cloudflare Worker 入口
├── vite.config.ts
├── wrangler.jsonc              # 唯一的 Cloudflare Worker 运行时配置
├── package.json
└── README.md
```

### 重要代码边界

- Three.js 对象永远不放进 React state。
- 每帧只更新 `Object3D`、材质、相机和 controls。
- React state 只保存当前内容页、索引、帮助、加载状态等低频 UI。
- 3D 物体点击只向 React 发送 `assetId`。
- 全部可读内容都存在 HTML 中，不依赖 CanvasTexture。
- `portfolio-data.ts` 同时驱动内容索引、详情页、深链接和相机焦点。

---

## 5. 本地开发

### 环境要求

- Node.js `>= 22.13.0`
- npm（随 Node 安装）
- 支持 WebGL 2 的现代浏览器

推荐使用当前 LTS Node，并提交 `package-lock.json`，不要在没有必要时升级所有依赖。

### 安装

```bash
npm ci
```

若你正在主动增删依赖，使用：

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认地址：

```text
http://localhost:3000/
```

### 生产构建

```bash
npm run build
```

### 启动生产产物

```bash
npm run start
```

### 类型检查

```bash
npm run typecheck
```

### 代码检查

```bash
npm run lint
```

### 完整冒烟测试

```bash
npm test
```

`npm test` 会重新执行生产构建，然后验证：

- 返回 200 HTML；
- 中文语言与最终标题正确；
- 不再存在 starter 预览标记；
- 首屏主要文案被服务端渲染；
- Three.js、OrbitControls、Raycaster 和降级导航仍在产品源中；
- 音乐、健身、阅读、未来等关键资产没有被误删。

### 内容工作台 GUI

先启动本地开发服务器，然后打开：

```text
http://localhost:3000/?studio=1
```

工作台首次打开后，房间 HUD 会保留“编辑 / Edit”入口。关闭面板不会退出编辑模式。

可编辑内容：

- 中文和英文展示名称、标志字母、品牌副标题；
- 两种语言的首屏标题、介绍与引文；
- 城市和时区；
- 12 件数字资产的名称、章节标题、特质、摘要、介绍、状态、更新时间和引文；
- 每件资产的数据指标；
- 每件资产的内容卡片；
- 镜子页面的个人照片、替代文本和社交媒体链接；
- 相机页面的照片上传、替代文本与 Spotlight 主图。

保存方式：

1. 每次输入都会即时更新当前页面；
2. 草稿自动写入当前浏览器的 `localStorage`；
3. 照片通过拖放或文件选择写入 `public/uploads/profile` 或 `public/uploads/photography`，JSON 只保存公开路径，不保存 base64；
4. 本地开发时点击“保存到项目”，会把规范化内容原子写入 `public/content/site-content.json`；
5. Git 提交并推送 JSON 与上传图片后，现有 Cloudflare Git 集成会接管发布；
6. “导出”会下载完整 JSON，“导入”可恢复或迁移内容，“复制 JSON”适合手工备份。

推荐发布流程：

```bash
git add public/content/site-content.json public/uploads
git commit -m "Update portfolio content"
git push
```

安全边界：

- 写入接口只存在于 `npm run dev`；
- 只接受 loopback Host 与 Origin；
- 内容保存请求必须是 JSON，最大 256KB；
- 图片上传只接受 JPEG、PNG、WebP、AVIF，最大 10MB、单边 10,000 像素且不超过 4,000 万像素，并在上传前解码、在服务端通过文件内容识别格式；
- 上传文件使用随机文件名写入仓库的 `public/uploads`，原始文件名不参与路径；
- “清除”只解除内容引用，不自动删除磁盘文件；提交前可人工检查并移除 `public/uploads` 中不再使用的图片；
- 使用临时文件加 rename，避免写到一半损坏正式内容；
- 生产构建没有这个 PUT 接口；
- 线上工作台即使通过 `?studio=1` 打开，也只能本机预览、导入和导出；
- 不在浏览器中保存 GitHub token、Cloudflare token 或密码。

若“保存到项目”不可用，请确认页面来自 `localhost`，开发服务器是从当前代码仓库启动的；也可以先导出 JSON，再手动替换 `public/content/site-content.json`。

---

## 6. 最先需要替换的内容

当前内容是可运行的完整双语示例，不是用户的真实个人数据。上线前至少完成以下替换。

### 6.1 姓名与首屏

推荐打开 `/?studio=1`，在“个人主页 / Profile”中同时编辑中英文姓名、城市、时区和介绍，再点击“保存到项目”。

代码中的初始 fallback 位于 [`app/content-config.ts`](./app/content-config.ts) 的 `DEFAULT_PROFILE`；工作台生成的正式覆盖位于 [`public/content/site-content.json`](./public/content/site-content.json)。

### 6.2 SEO 元数据

编辑 [`app/layout.tsx`](./app/layout.tsx)：

- `title`
- `description`
- `keywords`
- Open Graph 标题与描述
- Twitter 卡片标题与描述

部署到正式域名后，再增加 `metadataBase`、canonical URL 和经过验证的社交分享图。

### 6.3 十二个章节

优先在内容工作台的“数字资产 / Digital assets”中编辑。若需要修改默认示例或调整数据结构，再同步编辑：

- [`app/portfolio-data.ts`](./app/portfolio-data.ts)：中文；
- [`app/portfolio-data-en.ts`](./app/portfolio-data-en.ts)：英文。

两份数据必须保持相同的 `id`、`number`、`focus`、`specialty` 与 `related`，只翻译内容字段。否则切换语言时可能出现相机焦点、关联内容或排序不一致。

每件资产的数据结构：

```ts
interface PortfolioAsset {
  id: AssetId;
  number: string;
  category: AssetCategory;
  objectLabel: string;
  sectionTitle: string;
  trait: string;
  teaser: string;
  intro: string;
  accent: string;
  status: string;
  lastUpdated: string;
  focus: {
    camera: [number, number, number];
    target: [number, number, number];
  };
  metrics: Array<{ value: string; label: string }>;
  entries: Array<{
    eyebrow: string;
    title: string;
    body: string;
    meta: string;
  }>;
  note: string;
  specialty:
    | "music"
    | "fitness"
    | "reading"
    | "research"
    | "gallery"
    | "timeline"
    | "default";
  related: AssetId[];
}
```

内容写作建议：

1. 用第一人称和现在时。
2. 少写“热爱生活、充满激情、跨界探索”等空泛形容词。
3. 每个特质后面跟具体证据：作品、方法、时间、判断或反思。
4. 每个章节开场控制在约 80 个汉字。
5. 数字必须有上下文，不用虚荣指标装饰页面。
6. 清楚区分“进行中”“已完成”“归档”。
7. 允许未完成、犹豫和变化。
8. 摘录只使用合理长度，主体应是自己的理解。

### 6.4 联系方式

搜索并替换：

```text
hello@your-domain.com
```

不要把私人手机号码、住址、个人日程、未授权的合作者信息或敏感健康数据直接写入公开页面。

---

## 7. 交互实现细节

### 7.1 相机

默认相机与目标：

```ts
const DEFAULT_CAMERA = new THREE.Vector3(11.8, 7.1, 14.5);
const DEFAULT_TARGET = new THREE.Vector3(0, 1.25, -1.35);
```

每件资产的 `focus.camera` 与 `focus.target` 决定打开内容时的相机聚焦位置。调试时：

1. 先修改 `focus.target`，确保指向物体中心；
2. 再调整 `focus.camera`；
3. 相机与 target 不要重合；
4. 避免 FOV 过宽和过快拉近；
5. 移动端要重新检查物体是否被内容面板遮住。

`prefers-reduced-motion` 下，相机直接切换位置，不执行长补间。

### 7.2 拾取

场景不会对整个世界执行 Raycaster。每个可交互资产都有一个稍大的透明 hitbox：

```ts
hitbox.userData.assetId = id;
hitboxes.push(hitbox);
```

鼠标坐标基于 Canvas 自身矩形，不基于 `window.innerWidth`。这样即使内容面板出现、Canvas 尺寸变化，拾取位置也不会偏移。

### 7.3 点击与拖动

- 鼠标移动超过约 6px，判定为拖动；
- 触摸移动超过约 11px，判定为拖动；
- 只有未超过阈值的 `pointerup` 才执行拾取；
- 不直接依赖原生 `click`，避免 OrbitControls 拖动结束后误开面板。

### 7.4 深链接

内容页使用查询参数：

```text
/?section=music
/?section=fitness
/?section=reading
/?lang=en&section=reading
```

优点：

- 可以复制链接；
- 刷新后仍能进入同一内容；
- 浏览器返回键可以回到房间；
- 不需要为 12 个章节增加 Worker 嵌套路由。

### 7.5 清理

组件卸载时会：

- `renderer.setAnimationLoop(null)`
- `controls.dispose()`
- 断开 `ResizeObserver`
- 移除 pointer、keyboard、visibility 和 WebGL context 监听
- 遍历 scene 并 dispose geometry/material
- `renderer.dispose()`
- 移除 Canvas

这对开发环境 HMR 和 React 严格模式非常重要；否则刷新几次后会出现多个 WebGL context 和重复监听器。

---

## 8. 新增一件程序化 3D 资产

以新增“投影机”为例。

### 第一步：扩展类型

在 `AssetId` 增加：

```ts
| "cinema"
```

### 第二步：添加内容数据

在 `PORTFOLIO_ASSETS` 增加完整对象，定义标题、特质、内容、相机位置和关联资产。

### 第三步：添加房间位置

在 `MARKER_POSITIONS` 中增加地面光环位置：

```ts
cinema: [x, 0.18, z]
```

### 第四步：创建模型函数

在 `RoomExperience.tsx` 中新增：

```ts
function createCinemaAsset(
  scene: THREE.Scene,
  hitboxes: THREE.Mesh[],
  animated: AnimateCallback[],
) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  scene.add(group);

  // 使用 addBox / addCylinder / addSphere 搭建投影机。
  // 把少量动态更新放进 animated。

  addHitbox(group, "cinema", [width, height, depth], [0, centerY, 0], hitboxes);
  addSignal(group, "cinema", [signalX, signalY, signalZ]);
}
```

### 第五步：注册

在 `createSceneAssets()` 调用新函数。

### 第六步：决定内容模板

如果现有 `specialty` 不够，扩展 `AssetSpecialty` 并在 `SpecialtyModule` 增加新分支。不要为每件资产写一整套重复页面；建议用 5–7 套模板承载所有内容。

### 第七步：验证

- 拖动相机不会打开；
- 轻点/点击可以打开；
- hitbox 不会被相邻资产覆盖；
- 深链接刷新正常；
- `Esc` 关闭；
- 移动端内容不溢出；
- 键盘和索引可以进入同一内容。

---

## 9. 把程序化模型替换成高质量 GLB

当前模型是可靠的视觉占位和 fallback。正式个人品牌项目可以逐件替换英雄资产，例如留声机、相机、植物和茶具。

### 9.1 推荐文件组织

```text
public/
└── models/
    ├── room/
    │   ├── shell-v1.glb
    │   └── furniture-v1.glb
    ├── music/
    │   └── gramophone-v2.glb
    ├── fitness/
    │   └── dumbbells-v1.glb
    ├── reading/
    │   └── bookshelf-v3.glb
    └── shared/
        └── props-v1.glb
```

不要从第三方 CDN 直接热链模型。应在许可允许时下载、归档、优化后自行托管。

### 9.2 运行时格式

- 统一使用 glTF 2.0；
- 浏览器交付优先 `.glb`；
- `.blend`、`.fbx`、`.obj` 只作为源文件保留；
- Three.js 官方也把 glTF/GLB 作为首选实时格式：
  [Loading 3D Models](https://threejs.org/manual/en/loading-3d-models.html)。

### 9.3 Blender 清理

导出前：

1. 单位统一为米；
2. Apply Rotation & Scale；
3. 原点放在合理抓取位置；
4. 删除隐藏、重复、无用节点；
5. 合并不会独立动画的网格；
6. 修复反向法线；
7. 检查 UV；
8. 去掉品牌 Logo、真实唱片封面、书封等潜在商标素材；
9. 材质使用 Principled BSDF；
10. 明确 Base Color、NormalGL、Roughness、Metallic、AO。

### 9.4 加载示例

```ts
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

loader.load(
  "/models/music/gramophone-v2.glb",
  (gltf) => {
    const model = gltf.scene;
    model.position.set(-5, 1.08, -4.72);
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    scene.add(model);
  },
  undefined,
  () => {
    // 保留当前程序化留声机作为 fallback。
  },
);
```

更完整的生产实现应使用 `LoadingManager`、加载超时、错误 UI、取消逻辑和按区域延迟加载。

### 9.5 压缩

推荐使用 [glTF Transform](https://github.com/donmccurdy/glTF-Transform)：

```bash
npx @gltf-transform/cli optimize input.glb output.glb
```

进一步优化可测试：

- `dedup`
- `prune`
- `weld`
- `simplify`
- Meshopt
- Draco
- WebP
- KTX2 / Basis

不要只比较压缩后的磁盘体积，还要检查：

- 解码时间；
- GPU 纹理内存；
- 移动端帧率；
- 法线质量；
- 小文字与薄结构；
- 第一次交互前的总网络体积。

### 9.6 推荐预算

| 项目 | 移动端建议 | 桌面端建议 |
|---|---:|---:|
| 首屏总三角形 | `< 80k` | `< 150k` |
| Draw calls | `< 60` | `< 90` |
| 首屏 3D 文件 | `< 6 MB` | `< 10 MB` |
| 单个普通资产 | `0.5–1.5 MB` | `1–3 MB` |
| 普通纹理 | 512–1K | 1K |
| 英雄资产纹理 | 1K | 2K |
| 阴影贴图 | 512 | 1024 |
| DPR 上限 | 1.2–1.25 | 1.6 |

纹理上传 GPU 后通常按像素展开。普通 4K JPG 即使磁盘只有几 MB，GPU 内存仍可能接近 `宽 × 高 × 4 × 1.33`。参考 Three.js
[纹理内存说明](https://threejs.org/manual/en/textures.html)。

### 9.7 验证

发布前使用：

- [Khronos glTF Validator](https://github.khronos.org/glTF-Validator/)
- Three.js glTF Viewer
- 浏览器 Network / Performance / Memory
- 中端 Android 真机

检查缺失贴图、扩展支持、比例、法线、动画、draw calls、GPU 纹理数量和 WebGL context 恢复。

---

## 10. 高质量 3D 资产来源

以下结论按 2026-07-23 的官方页面与许可核对。平台条款会变化，下载时仍应保存许可证与条目证据。

| 来源 | 最适合本项目 | 格式与获取 | 授权建议 |
|---|---|---|---|
| [Poly Haven Models](https://polyhaven.com/models) / [Textures](https://polyhaven.com/textures) | 写实家具、灯具、木材、墙面、地板、HDRI | 条目页选择 glTF、Blend、FBX、EXR/JPG 等；网页先取 1K/2K | [下载资产统一 CC0](https://polyhaven.com/license)，可商用、修改、再分发，无需署名 |
| [ambientCG](https://ambientcg.com/list) | PBR 墙、地板、布料、金属、贴花、HDRI | 常见 1K–8K JPG/PNG/EXR/OBJ | [下载资产统一 CC0](https://docs.ambientcg.com/license/)，商用安全 |
| [Quaternius](https://quaternius.com/) | 风格统一的低多边形家具与室内道具 | FBX、OBJ、Blend，新包常含 glTF | [全部模型 CC0](https://quaternius.com/faq.html)；可从 [Ultimate House Interior Pack](https://quaternius.com/packs/ultimatehomeinterior.html) 开始 |
| [Kenney](https://kenney.nl/assets) | 轻量家具、模块化房间、UI | 官方包常含 GLB、FBX、OBJ；参考 [3D 导入指南](https://kenney.nl/knowledge-base/game-assets-3d/importing-3d-models-into-game-engines) | [素材页面资产通常 CC0](https://kenney.nl/support)；推荐 [Furniture Kit](https://kenney.nl/assets/furniture-kit) |
| [Sketchfab Free Models](https://sketchfab.com/features/free-3d-models) | 留声机、八音盒、哑铃等稀缺单体 | 登录后下载 glTF/GLB 等 | 许可混合；优先 CC0 / CC BY。CC BY 要署名；避开 NC、Editorial、ND；[许可筛选说明](https://sketchfab.com/blogs/community/refine-downloadable-model-searches-with-new-license-filters/) |
| [Fab](https://www.fab.com/) | 高质量付费场景、家具、乐器、扫描 | 格式随条目，购买前确认 glTF/FBX、PBR、UV、LOD | [Fab Standard License](https://www.fab.com/eula?lang=en) 允许用于较大作品但禁止独立分发；逐件检查 Standard、CC BY、Reference Only 与遗留许可 |
| [CGTrader](https://www.cgtrader.com/3d-models) | 写实家具、唱片机、音乐和健身器材 | 卖家格式、拓扑与质量差异较大 | [Royalty Free](https://help.cgtrader.com/hc/en-us/articles/360015124437-Royalty-Free-License) 可用于组合产品但禁止独立转售；Editorial 不用于商业主页；逐件核对品牌与附加条款 |
| [Adobe Substance 3D Assets](https://www.adobe.com/products/substance3d/assets.html) | 专业模型、材质、贴花、Atlas、灯光 | GLB/FBX、SBS/SBSAR、EXR | 可商用但必须进入 Larger/Modified Work，不得独立分发；还禁止 AI/ML 训练；以 [专项条款 PDF](https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe-Substance-3D-Assets-Product-Specific-Terms-20250422.pdf) 为准 |
| [Adobe Substance 3D Community Assets](https://substance3d.adobe.com/community-assets) | 免费社区材质、生成器、贴花 | 登录后按条目下载 | 遵守 [Community Assets License 1.1](https://www.adobe.com/cis_en/legal/terms/community-assets-license.html)，只能进入较大或修改作品，禁止独立分发 |
| [Blendkit](https://www.blenderkit.com/about-blenderkit) | 在 Blender 内获取家具、场景、材质、HDRI | Blender 插件导入后整理再导出 GLB | 平台同时有 RF 与 CC0；[两者允许商用](https://www.blenderkit.com/docs/licenses/)，但 RF 禁止独立再分发，必须逐件检查 |

### 推荐采购顺序

1. 用 Poly Haven、ambientCG、Quaternius、Kenney 完成约 80% 的房间；
2. 用 Sketchfab 的 CC0 / CC BY 补语义明确的单体；
3. 只有英雄资产确实缺失时，再购买 Fab、CGTrader 或 Adobe 内容。

写实路线：

```text
Poly Haven + ambientCG + 少量 Adobe / Fab
```

风格化路线：

```text
Quaternius + Kenney
```

不要直接混用写实扫描和卡通低多边形模型。若必须混用，应统一比例、材质、色彩、边缘锐度、阴影和纹理密度。

### 公开 WebGL 的许可风险

Three.js 网页必须把 GLB 发送到浏览器，访客可以在 Network 面板取得文件。因此“不得让终端用户提取原资产”的付费模型许可，未必天然适合公开 WebGL。

最稳妥的方法：

- 优先 CC0 / CC BY；
- 受限付费模型先取得平台或作者对公开 WebGL 交付的书面确认；
- 进行实质性修改、合并或烘焙；
- 不把原始 GLB 作为独立、可猜测的下载文件；
- 不误以为技术混淆等于法律许可。

“免费下载”不等于“允许商用”。没有明确许可的模型一律不用。

### 商标、肖像与真实封面

CC0 解决版权及类似权利，但不自动清除商标、专利、肖像、隐私或实物设计权。带品牌 Logo 的唱片机、健身器材、书封、唱片封面与相机外观仍需要谨慎。参考 [CC0 官方说明](https://creativecommons.org/publicdomain/zero/1.0/)。

---

## 11. 授权归档

每次加入外部模型或材质，都更新 [`ASSET_CREDITS.md`](./ASSET_CREDITS.md)：

```md
| 本地文件 | 资产名称 | 作者 | 原始链接 | 许可 | 下载日期 | 所做修改 |
|---|---|---|---|---|---|---|
```

同时保存：

- 资产条目页 PDF 或截图；
- 许可证文本；
- 下载日期；
- 发票或订单号；
- 作者名称；
- 修改记录；
- CC BY 的最终署名文案。

CC BY 署名至少包含：资产名、作者、原始链接、许可证链接、是否修改。

---

## 12. 音乐、视频和图片

### 音乐

- 不自动播放；
- 只有用户明确点按后才创建或恢复 AudioContext；
- 提供暂停、音量和明确的当前播放状态；
- 内容面板打开时环境声渐弱，不要突然切断；
- 音乐不能承担唯一信息，始终提供作品说明；
- 推荐 MP3/AAC 作为兼容版本，Opus/WebM 作为可选优化；
- 试听片段控制在 15–30 秒；
- 确保拥有音乐、采样、人声和封面的网络传播权。

### 视频

- 视频放在 DOM `<video>` 中，不把高分辨率视频持续贴进 Three.js 材质；
- 提供字幕；
- 重要视频提供逐字稿；
- 延迟加载 poster 和视频源；
- 避免首屏自动下载多个视频。

### 图片

- 使用 WebP / AVIF；
- 按实际显示尺寸生成多规格；
- 画廊使用缩略图，进入详情后加载大图；
- 保护他人隐私并取得肖像授权；
- 不直接复制在版权期内的完整书页和大段摘录。

---

## 13. 无障碍

目标不是“让读屏勉强使用 3D”，而是保证没有 3D 也能完整认识这个人。

已实现：

- 首焦点“跳过三维场景，打开内容索引”；
- Canvas 有可访问名称与键盘说明；
- 内容索引包含所有资产；
- `Tab` 进入按钮；
- `Esc` 关闭；
- `R` 重置；
- 方向键旋转；
- `+/-` 缩放；
- 内容页 `role="dialog"` 和 `aria-modal`；
- 打开内容时移动焦点到关闭按钮；
- 关闭后尝试恢复来源焦点；
- 触摸目标尺寸；
- `prefers-reduced-motion`；
- WebGL 失败提示；
- `<noscript>` 内容清单；
- 不只用颜色表达状态。

上线前仍应人工测试：

1. 全程只用键盘；
2. macOS VoiceOver；
3. Windows NVDA；
4. 浏览器 200% 缩放；
5. 高对比度模式；
6. 减少动态效果；
7. iOS 与 Android 读屏；
8. 内容页焦点是否被背景元素截走。

如果要做到更严格的焦点锁定，可以引入一个体积小、经过审计的 dialog/focus-trap 库；不要自己做复杂的 Tab 循环而没有测试。

---

## 14. 移动端与低性能设备

当前策略：

- Canvas 使用 `100dvh`；
- `touch-action: none` 只用于 3D；
- 内容页恢复纵向滚动；
- 手机内容页全屏；
- DPR 限制为约 1.2；
- 桌面 DPR 限制为约 1.6；
- 移动端阴影贴图 512；
- 不使用 SSAO、景深、实时镜面或 Bloom；
- 不加载外部 GLB；
- 页面隐藏时停止渲染；
- 减少动态模式下停止持续摆动。

未来若增加大型模型，建议四级体验：

| 级别 | 体验 |
|---|---|
| A 桌面高性能 | 完整 Orbit、阴影、环境效果、交互 |
| B 移动端 | 保留 3D，但收束为 6–8 个观察点 |
| C 低性能 | 静态房间图 + DOM 热点 |
| D 无 WebGL / 读屏 / 省流量 | 直接进入内容索引 |

不要强迫横屏。可以提示“横屏会有更多空间”，但竖屏必须完整可用。

---

## 15. 性能检查

### 运行时原则

- 复用 Raycaster、Vector、Color；
- 不在动画循环调用 React `setState`；
- 只保留一个投影主光；
- 小物体不投影；
- 重复书籍未来可改为 `InstancedMesh`；
- 静态模型尽量合并；
- 不开启 `preserveDrawingBuffer`；
- 页面隐藏后暂停渲染；
- 所有远程媒体延迟加载；
- 大模型按区域加载，不阻塞房间首屏。

### 建议验收

- 中端 Android 连续旋转 60 秒；
- 打开/关闭详情 50 次；
- 浏览器切后台后 CPU/GPU 明显下降；
- DPR 3 的手机没有按 3 倍渲染；
- 慢速网络下内容索引先可用；
- GLB 加载失败时程序化 fallback 保留；
- WebGL context lost 时能进入内容索引；
- 320、375、768、1024、1440、4K；
- iOS Safari 地址栏伸缩；
- Android 双指缩放；
- 横竖屏切换。

Three.js 本身会形成较大的客户端 chunk。当前版本没有外部模型，压缩后的网络传输仍可控。若首屏 HTML 速度要求更高，可把 Three 初始化改为进入按钮后动态 import，并让内容索引先完成 hydration。

---

## 16. 使用 GitHub 发布与部署

本项目推荐把 GitHub 用作源码、版本记录与自动化入口，由 GitHub Actions 把生产版本部署到 Cloudflare Workers。不要直接使用 GitHub Pages：当前产物包含 vinext RSC/SSR Worker，Pages 只能托管静态文件，会丢失 Worker 路由与服务端渲染能力。

### 16.1 桌面项目目录

迁移后的推荐路径：

```text
~/Desktop/the-living-index
```

进入项目后先验证：

```bash
cd ~/Desktop/the-living-index
npm ci
npm run typecheck
npm run lint
npm test
```

### 16.2 创建 GitHub 仓库

在 GitHub 网页新建空仓库 `the-living-index`。不要勾选自动生成 README、`.gitignore` 或 License，因为这些文件已经存在。

源码是否公开与网站是否公开是两件事：

- 想展示实现过程：选择 Public；
- 暂时不公开代码：选择 Private，Cloudflare 部署后的网页仍可公开访问。

若桌面目录尚未初始化：

```bash
git init -b main
git add .
git commit -m "Initial bilingual 3D portfolio"
```

使用 SSH 远程地址：

```bash
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/the-living-index.git
git push -u origin main
```

或已登录 GitHub CLI 时直接创建私有仓库并推送：

```bash
gh repo create the-living-index --private --source=. --remote=origin --push
```

把 `--private` 改为 `--public` 可公开源码。执行前务必确认仓库中没有 `.env`、token、私人媒体或不允许再分发的付费 GLB。

### 16.3 创建 Cloudflare 凭证

GitHub Actions 是非交互环境，需要两个 Repository Secret：

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

官方参考：[Cloudflare Workers 的 GitHub Actions 指南](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) 与 [GitHub Actions Secrets 文档](https://docs.github.com/en/actions/concepts/security/secrets)。

操作路径：

1. 在 Cloudflare Dashboard 的 API Tokens 页面创建 token；
2. 使用适合部署 Worker 的模板，并坚持最小权限；
3. 在 Cloudflare Dashboard 复制 Account ID；
4. 打开 GitHub 仓库的 `Settings → Secrets and variables → Actions`；
5. 分别建立上述两个 Repository Secret；
6. 不要把值写进 README、workflow、`.env.example` 或 commit。

如果配置 Worker route 或自定义域名，token 还需要对应 zone/route 权限；普通 `workers.dev` 首次发布不应授予无关权限。

### 16.4 自动部署工作流

工作流位于：

```text
.github/workflows/deploy.yml
```

它会：

1. 在 Pull Request 中执行 typecheck、lint、生产构建和冒烟测试；
2. 在 `main` 分支 push 或手动触发时再次执行全部质量检查；
3. 只有质量任务成功后才进入 `production` 环境；
4. 检查两个 Cloudflare secret 是否存在；
5. 执行 `npm run deploy`；
6. 使用 concurrency 取消同一生产环境中已过时的运行。

Cloudflare 的 Worker 名称、入口、兼容日期、兼容标志和静态资源绑定统一保存在
`wrangler.jsonc`。`nodejs_compat` 只能在这个文件中声明一次；不要再把
`compatibility_flags` 添加到 `vite.config.ts` 的 `cloudflare({ config })`
内联配置中，因为 Cloudflare Vite 插件会连接两处数组，重复标志将导致 API
校验错误 `10021`。

首次发布顺序：

1. 创建 GitHub 仓库；
2. 添加两个 Cloudflare Secret；
3. 推送 `main`；
4. 在 GitHub `Actions` 页打开 `Validate and deploy`；
5. 确认 `quality` 与 `deploy` 均为绿色；
6. 从部署日志或 Cloudflare Workers Dashboard 打开最终 URL；
7. 使用无痕窗口分别验证 `?lang=zh`、`?lang=en` 与一个 `section` 深链接。

若 `Verify deployment secrets` 失败，说明 Secret 缺失或名称不完全一致。不要通过在 workflow 里打印变量来排查。

### 16.5 后续更新

日常更新：

```bash
git add .
git commit -m "Describe the change"
git push
```

每次推送到 `main` 都会触发部署。更稳妥的协作方式是使用功能分支和 Pull Request，让 `quality` 先通过，再合并到 `main`。

### 16.6 回滚

推荐用 Git 历史做可审计回滚：

```bash
git log --oneline
git revert COMMIT_SHA
git push
```

不要用 `git reset --hard` 改写已经共享的 `main` 历史。`revert` 推送后会触发一次新的自动部署。

---

## 17. 其他部署方式

### 方案 A：OpenAI Sites

本项目已经保留：

```text
.openai/hosting.json
vite.config.ts 中的 sites() 插件
Cloudflare Worker 兼容产物
```

标准发布流程：

1. `npm ci`
2. `npm run typecheck`
3. `npm run build`
4. 通过 Sites 创建或复用站点；
5. 保存当前构建为一个版本；
6. 先以 owner-only/private 方式部署；
7. 部署成功后再决定共享范围与自定义域名。

不要把 source credential、部署 token 或私有仓库凭证写进 Git、`.env.example` 或文档。

### 方案 B：本地直接部署到 Cloudflare Workers

vinext 当前 CLI 支持：

```bash
npm run deploy
```

首次部署前需要在你自己的环境中完成 Cloudflare 登录：

```bash
npx wrangler login
```

然后：

```bash
npm run typecheck
npm run build
npm run deploy
```

注意：

- 确认 Cloudflare account 和目标 Worker；
- 不要把 token 写进仓库；
- `public/` 文件名大小写必须正确；
- 生产域名使用 HTTPS；
- 上传大模型前检查 Worker/静态资产限制和缓存；
- 部署后用无痕窗口测试一次冷启动。

### 自定义域名

推荐：

1. 先让默认部署 URL 完全可用；
2. 添加自定义域名；
3. 等待 DNS 和证书生效；
4. 更新 `metadataBase`、canonical、Open Graph URL；
5. 更新站内分享链接；
6. 再次检查 HTTPS、重定向和 `www` / apex 规范化；
7. 如果域名变化，检查音频、模型与图片是否仍为同源路径。

### 缓存

- JS/CSS 由 Vite hash 管理，可长缓存；
- 模型和媒体使用带版本文件名；
- 不要用同一 URL 覆盖不同二进制内容；
- HTML 保持可更新；
- 大 GLB 可以设置长缓存，但每次修改都改变文件名；
- 不要依赖第三方模型 CDN 的 CORS 与可用性。

---

## 18. 安全与隐私

- 公开邮箱建议使用专门联系地址；
- 联系表单若接入后端，必须验证、限流、防垃圾；
- 不在前端包含 API key；
- 不把未公开论文、私人健康数据、住址、实时行程写入内容；
- 上传第三方人物照片前取得许可；
- 不用分析脚本收集不必要的指纹信息；
- 若加入 analytics，更新隐私说明；
- 若加入 D1/R2/表单，必须明确数据用途、保存期限和删除方式；
- 外链使用合理的 `rel` 属性；
- 任何用户输入进入 HTML 前都必须转义；
- 模型和媒体版权证据与源文件分开备份。

---

## 19. 常见问题

### 页面只有背景，没有房间

检查：

- 浏览器是否支持 WebGL 2；
- 控制台是否出现 context 创建失败；
- 硬件加速是否关闭；
- 是否处于远程桌面或受限 WebView；
- Canvas 容器是否有非零宽高。

即使 3D 不可用，仍应能点击“进入轻量版”。

### 点击物体没有反应

检查：

- hitbox 是否加入 `hitboxes` 数组；
- `userData.assetId` 是否是合法 `AssetId`；
- hitbox 是否被设置为 `visible = false`；
- 坐标是否按 Canvas `getBoundingClientRect()` 计算；
- 是否有全屏 DOM 元素错误地拦截 pointer 事件；
- 相邻 hitbox 是否重叠。

### 拖动一下就打开内容

不要监听原生 `click`。使用 pointerdown / move / up，并设置鼠标与触摸不同阈值。

### 手机非常热

依次检查：

1. DPR 是否限幅；
2. 阴影贴图；
3. 大纹理；
4. draw calls；
5. 后处理；
6. 页面隐藏时是否继续渲染；
7. 是否每帧触发 React state；
8. 是否存在多个 renderer；
9. 是否意外加载 4K HDRI。

### 模型在 Blender 正常、网页发黑

检查：

- 法线方向；
- Base Color / Emissive 是否标记 sRGB；
- Roughness、Metalness、Normal 是否保持线性；
- NormalGL 与 NormalDX 是否用错；
- 是否缺少环境光；
- 纹理路径是否区分大小写；
- 材质扩展是否被当前 Three.js 支持。

### 模型很小或很大

统一单位为米，导出前 Apply Scale，并让可交互模型原点落在可理解位置。

### 开发几次后出现多个 WebGL context

检查 effect cleanup 是否完整，以及 HMR 时旧 renderer、controls、监听器、RAF/animationLoop 是否被释放。

### 生产环境 404，但本地正常

检查：

- `public/` 文件路径大小写；
- 绝对/相对资源路径；
- Worker 静态资产配置；
- GLB 是否实际包含在部署包；
- 查询参数深链接是否被错误当成独立文件；
- 自定义域名缓存。

---

## 20. 上线清单

内容：

- [ ] 替换姓名、城市、时区
- [ ] 替换 12 个章节示例内容
- [ ] 替换邮箱和外链
- [ ] 删除不准备公开的私人信息
- [ ] 所有协作者署名已确认
- [ ] 摘录长度与版权合理

视觉：

- [ ] 统一模型比例与材质风格
- [ ] 所有交互物体都有命中区域
- [ ] 装饰物没有误导性交互信号
- [ ] 相机聚焦不会穿墙
- [ ] 移动端面板没有溢出
- [ ] 社交分享图已验证文字

资产：

- [ ] 每个外部文件登记到 `ASSET_CREDITS.md`
- [ ] 保存许可证、条目页和发票
- [ ] 没有不明来源模型
- [ ] 没有未授权品牌 Logo、封面和人物
- [ ] GLB 已优化并通过 Validator

工程：

- [ ] `npm ci`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] 生产构建无错误
- [ ] 无第三方运行时热链
- [ ] 真机检查帧率、温度和内存
- [ ] WebGL 失败时索引仍可用
- [ ] 键盘和读屏可以浏览

部署：

- [ ] GitHub 仓库可见性符合预期
- [ ] `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID` 已存入 Actions Secrets
- [ ] GitHub Actions 的 quality 与 deploy 均通过
- [ ] 默认部署 URL 已验证
- [ ] owner-only/private 部署确认
- [ ] 自定义域名与 HTTPS 正常
- [ ] canonical / Open Graph URL 更新
- [ ] 缓存与版本文件名正确
- [ ] 隐私与联系渠道说明正确

---

## 21. 推荐下一步

最有价值的迭代顺序：

1. 先替换真实个人内容；
2. 再替换 3–4 个最能代表你的英雄资产；
3. 加入真实音乐、摄影或项目媒体；
4. 完成资产授权归档；
5. 做移动端真机性能测试；
6. 加入社交分享图与自定义域名；
7. 最后再考虑第二个 3D 房间、天气、实时数据或登录。

不要在内容仍是占位时急着增加第二个房间。一个有真实证据的物品，比十个华丽但空的入口更能让人认识你。

---

## 许可证

项目代码可由项目所有者按自己的仓库许可发布。当前 3D 房间中的几何造型由代码程序化生成，没有打包任何外部第三方模型、纹理、音乐、照片或字体文件。

当你加入第三方内容后，仓库的代码许可证不会覆盖这些资产；每个资产仍受其原始许可约束，并应在 `ASSET_CREDITS.md` 单独说明。
