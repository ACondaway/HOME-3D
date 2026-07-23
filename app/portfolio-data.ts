export type AssetId =
  | "music"
  | "fitness"
  | "reading"
  | "research"
  | "making"
  | "photography"
  | "ritual"
  | "growth"
  | "about"
  | "travel"
  | "contact"
  | "future";

export type AssetCategory =
  | "兴趣"
  | "生活"
  | "学术"
  | "创造"
  | "关系"
  | "成长"
  | "Interests"
  | "Life"
  | "Academic"
  | "Making"
  | "Relations"
  | "Growth";

export type AssetSpecialty =
  | "music"
  | "fitness"
  | "reading"
  | "research"
  | "gallery"
  | "timeline"
  | "default";

export interface PortfolioAsset {
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
  metrics: Array<{
    value: string;
    label: string;
  }>;
  entries: Array<{
    eyebrow: string;
    title: string;
    body: string;
    meta: string;
  }>;
  note: string;
  specialty: AssetSpecialty;
  related: AssetId[];
}

export const PORTFOLIO_ASSETS: PortfolioAsset[] = [
  {
    id: "music",
    number: "01",
    category: "兴趣",
    objectLabel: "留声机",
    sectionTitle: "声音工作室",
    trait: "我用声音，保存那些说不清的情绪。",
    teaser: "原创音乐、Demo 与声音实验",
    intro:
      "这里收录正在形成的旋律、制作中的片段，以及每一次把感觉翻译成声音的尝试。页面中的内容是可替换示例。",
    accent: "#e2a85f",
    status: "正在创作",
    lastUpdated: "JUL 2026",
    focus: {
      camera: [-0.8, 3.4, 2.4],
      target: [-5.0, 1.35, -4.7],
    },
    metrics: [
      { value: "12", label: "声音草图" },
      { value: "04", label: "公开作品" },
      { value: "72 BPM", label: "此刻节拍" },
    ],
    entries: [
      {
        eyebrow: "CURRENT SESSION",
        title: "After the Rain",
        body: "一段围绕木质打击乐、磁带噪点和不稳定和弦展开的夜间草图。",
        meta: "03:42 · Ambient / Neo-classical",
      },
      {
        eyebrow: "FIELD NOTE",
        title: "城市的呼吸",
        body: "把地铁关门、路口提示音与清晨鸟鸣，整理成一套可演奏的声音档案。",
        meta: "声音采集 · 进行中",
      },
      {
        eyebrow: "COLLABORATION",
        title: "开放一段副歌",
        body: "希望遇见一位擅长人声叙事的创作者，共同完成这首尚未命名的作品。",
        meta: "Remote · Open",
      },
    ],
    note: "音乐不是背景，它是我理解时间的另一种方法。",
    specialty: "music",
    related: ["making", "photography", "ritual"],
  },
  {
    id: "fitness",
    number: "02",
    category: "生活",
    objectLabel: "哑铃与瑜伽垫",
    sectionTitle: "身体计划",
    trait: "身体也是一项长期作品。",
    teaser: "训练节律、恢复原则与阶段记录",
    intro:
      "我关注的不是一次用尽力气，而是能否在忙碌、旅行和低谷里，仍然保留与身体相处的方式。",
    accent: "#8ec3aa",
    status: "本周期 · BUILD",
    lastUpdated: "WEEK 06",
    focus: {
      camera: [8.6, 3.8, 7.4],
      target: [5.2, 0.45, 1.6],
    },
    metrics: [
      { value: "4×", label: "每周训练" },
      { value: "7.5 h", label: "平均睡眠" },
      { value: "RPE 7", label: "当前强度" },
    ],
    entries: [
      {
        eyebrow: "MON / LOWER",
        title: "力量与稳定",
        body: "深蹲模式、单侧稳定和核心抗旋，最后保留十分钟慢速拉伸。",
        meta: "55 min · Moderate",
      },
      {
        eyebrow: "WED / ENGINE",
        title: "心肺与移动",
        body: "二区有氧搭配髋、踝和胸椎活动，不用疲惫证明训练有效。",
        meta: "45 min · Easy",
      },
      {
        eyebrow: "SAT / PLAY",
        title: "没有数字的一天",
        body: "徒步、球类或任何愿意继续做下去的活动，让身体重新回到生活里。",
        meta: "Outdoor · Untracked",
      },
    ],
    note: "真正能积累的训练，应该给明天留下一点余地。",
    specialty: "fitness",
    related: ["growth", "ritual", "future"],
  },
  {
    id: "reading",
    number: "03",
    category: "学术",
    objectLabel: "书架",
    sectionTitle: "阅读与边注",
    trait: "阅读不是收藏答案，是练习另一种视角。",
    teaser: "主题书目、摘录与个人批注",
    intro:
      "书架按问题而不是学科排列：如何观察，如何创造，如何与人共同生活。摘录只是入口，真正重要的是它改变了什么。",
    accent: "#d7c9a6",
    status: "持续更新",
    lastUpdated: "38 NOTES",
    focus: {
      camera: [8.4, 3.7, -0.1],
      target: [5.45, 2.0, -5.35],
    },
    metrics: [
      { value: "26", label: "年度阅读" },
      { value: "08", label: "主题路径" },
      { value: "143", label: "个人边注" },
    ],
    entries: [
      {
        eyebrow: "PATH 01 · ATTENTION",
        title: "如何重新学习观看",
        body: "从视觉文化、摄影理论到日常观察，追踪“注意力”如何被环境塑造。",
        meta: "6 本书 · 21 条边注",
      },
      {
        eyebrow: "PATH 02 · SYSTEMS",
        title: "复杂系统中的微小行动",
        body: "把系统思考放回真实生活：反馈、延迟、边界，以及那些看似无效的长期动作。",
        meta: "4 本书 · 进行中",
      },
      {
        eyebrow: "RECENT MARGIN",
        title: "关于未完成",
        body: "未完成不是完成的反面，它有时是让一个问题继续保持活力的方式。",
        meta: "个人批注 · 2 天前",
      },
    ],
    note: "我不想把书读完，我更想让一本书继续发生。",
    specialty: "reading",
    related: ["research", "growth", "about"],
  },
  {
    id: "research",
    number: "04",
    category: "学术",
    objectLabel: "研究桌",
    sectionTitle: "研究桌",
    trait: "我习惯把模糊的问题，做成可验证的事。",
    teaser: "研究问题、方法与证据链",
    intro:
      "每个项目都从一个尚不够清楚的问题开始，再经历拆解、验证、失败和重新定义。这里重点展示过程，而不只展示结论。",
    accent: "#74b5b0",
    status: "2 个问题进行中",
    lastUpdated: "Q3 2026",
    focus: {
      camera: [4.6, 3.35, 2.0],
      target: [0.5, 1.15, -3.65],
    },
    metrics: [
      { value: "02", label: "当前课题" },
      { value: "05", label: "公开论文" },
      { value: "11", label: "方法实验" },
    ],
    entries: [
      {
        eyebrow: "QUESTION 01",
        title: "空间界面如何影响叙事记忆？",
        body: "比较目录式与空间式信息架构，观察访客能否更准确地记住人与内容之间的关系。",
        meta: "混合方法 · 招募中",
      },
      {
        eyebrow: "METHOD",
        title: "把直觉写成假设",
        body: "先记录我们以为会发生什么，再定义证据、反例和停止条件，减少结果出来后的自我说服。",
        meta: "Research protocol v1.4",
      },
      {
        eyebrow: "OPEN MATERIAL",
        title: "可复现记录",
        body: "研究日志、数据字典和关键决策都保留版本，让方法能够被理解、质疑和复用。",
        meta: "Docs · Repository",
      },
    ],
    note: "好的研究不是显得确定，而是让不确定变得可以共同讨论。",
    specialty: "research",
    related: ["reading", "making", "travel"],
  },
  {
    id: "making",
    number: "05",
    category: "创造",
    objectLabel: "原型工作台",
    sectionTitle: "造物台",
    trait: "想法只有被做出来，才开始变得诚实。",
    teaser: "产品、代码与交互实验",
    intro:
      "这里陈列的是可以运行、可以失败、也可以继续修改的东西。每个案例都说明目标、约束、个人贡献与下一步。",
    accent: "#e07a5f",
    status: "LAB OPEN",
    lastUpdated: "07 BUILDS",
    focus: {
      camera: [6.7, 3.55, 4.2],
      target: [2.75, 0.95, -1.35],
    },
    metrics: [
      { value: "07", label: "已发布原型" },
      { value: "19", label: "实验分支" },
      { value: "3 d", label: "平均首版" },
    ],
    entries: [
      {
        eyebrow: "FEATURED BUILD",
        title: "Living Index",
        body: "把个人主页从“栏目列表”改造成可探索空间，同时保留可访问、可搜索的内容索引。",
        meta: "Three.js · React · TypeScript",
      },
      {
        eyebrow: "MICRO TOOL",
        title: "思考卡片机",
        body: "用少量约束帮助人从散乱笔记中找到重复出现的问题，而不是再造一个笔记仓库。",
        meta: "Prototype · Local-first",
      },
      {
        eyebrow: "FAILED WELL",
        title: "一次过度设计",
        body: "删掉 60% 的交互后，用户第一次能够直接说出页面在帮助他们完成什么。",
        meta: "Retrospective · 6 min read",
      },
    ],
    note: "我喜欢原型，因为它会很快指出语言没有说清楚的地方。",
    specialty: "gallery",
    related: ["research", "music", "future"],
  },
  {
    id: "photography",
    number: "06",
    category: "兴趣",
    objectLabel: "相机",
    sectionTitle: "取景",
    trait: "我拍下的，是看待世界的方式。",
    teaser: "摄影系列与视觉日记",
    intro:
      "不是目的地清单，而是关于光、距离与人如何留在场景里的长期练习。每个系列都附有拍摄时的短记。",
    accent: "#c9b5d4",
    status: "3 个系列",
    lastUpdated: "ROLL 27",
    focus: {
      camera: [4.8, 3.3, 8.1],
      target: [0.0, 0.95, 2.45],
    },
    metrics: [
      { value: "03", label: "长期系列" },
      { value: "27", label: "已整理胶卷" },
      { value: "50 mm", label: "常用视角" },
    ],
    entries: [
      {
        eyebrow: "SERIES 01",
        title: "灯还亮着",
        body: "夜间城市里仍然有人工作、等待、整理和回家的窗口。",
        meta: "24 frames · Shanghai",
      },
      {
        eyebrow: "SERIES 02",
        title: "临时的桌子",
        body: "搬家、旅行与短暂停留中，人怎样用几件物品重新建立一个属于自己的角落。",
        meta: "18 frames · Ongoing",
      },
      {
        eyebrow: "CONTACT SHEET",
        title: "没有选中的照片",
        body: "保留失败的构图与错过的时刻，它们常常比最终选择更能说明当时如何观看。",
        meta: "Process archive",
      },
    ],
    note: "相机帮我慢一点，也让我承认自己总在选择。",
    specialty: "gallery",
    related: ["travel", "music", "ritual"],
  },
  {
    id: "ritual",
    number: "07",
    category: "生活",
    objectLabel: "茶桌",
    sectionTitle: "日常口味",
    trait: "把普通的一天，过出自己的尺度。",
    teaser: "饮食、城市片段与物件故事",
    intro:
      "这部分没有效率指标。它记录一杯茶的温度、一顿经常重复的早餐，以及值得慢下来招待一个人的方式。",
    accent: "#b7c58b",
    status: "SLOW ARCHIVE",
    lastUpdated: "12 MOMENTS",
    focus: {
      camera: [1.1, 3.15, 4.8],
      target: [-3.55, 0.9, -0.55],
    },
    metrics: [
      { value: "06:40", label: "第一杯水" },
      { value: "82°C", label: "常用水温" },
      { value: "Sun.", label: "不排日程" },
    ],
    entries: [
      {
        eyebrow: "MORNING",
        title: "留十分钟给没有输入的时间",
        body: "不读消息，不播放内容，只把窗打开，让一天在被安排之前先出现。",
        meta: "Daily ritual",
      },
      {
        eyebrow: "OBJECT STORY",
        title: "一只修补过的杯子",
        body: "它不再成套，也不再完美，但每次使用都提醒我：留下来，本身就是一种价值。",
        meta: "6 years together",
      },
      {
        eyebrow: "CITY NOTE",
        title: "雨天路线",
        body: "一条不够快、但能经过旧书店和梧桐树的回家路径。",
        meta: "31°14′N · 121°28′E",
      },
    ],
    note: "生活的质地，大多来自那些没有被展示的重复。",
    specialty: "timeline",
    related: ["growth", "photography", "fitness"],
  },
  {
    id: "growth",
    number: "08",
    category: "成长",
    objectLabel: "植物",
    sectionTitle: "生长记录",
    trait: "我更相信缓慢、可重复的生长。",
    teaser: "习惯系统、月度复盘与学习队列",
    intro:
      "目标不是把每一天填满，而是找到能穿过状态波动的最小动作。这里公开方法与反思，不公开过度私密的数据。",
    accent: "#70a37f",
    status: "DAY 184",
    lastUpdated: "JUL REVIEW",
    focus: {
      camera: [-1.25, 3.9, 4.7],
      target: [-6.25, 1.35, -1.6],
    },
    metrics: [
      { value: "03", label: "当前习惯" },
      { value: "01", label: "主动放下" },
      { value: "86%", label: "复盘完成" },
    ],
    entries: [
      {
        eyebrow: "KEEP",
        title: "每天留下一个可检索的判断",
        body: "不追求长篇记录，只写当时如何决定，以及未来什么证据会让我改变看法。",
        meta: "Knowledge habit",
      },
      {
        eyebrow: "LEARN",
        title: "重学概率与不确定性",
        body: "把公式放回真实选择里：预测、基准率、校准，以及如何承认自己不知道。",
        meta: "8-week path",
      },
      {
        eyebrow: "LET GO",
        title: "不再追踪所有事情",
        body: "当记录本身开始替代生活，就删除一个指标，重新观察真正关心的变化。",
        meta: "July decision",
      },
    ],
    note: "稳定不是每天一样，而是知道怎样回来。",
    specialty: "timeline",
    related: ["fitness", "reading", "future"],
  },
  {
    id: "about",
    number: "09",
    category: "成长",
    objectLabel: "镜子",
    sectionTitle: "关于我",
    trait: "比头衔更长，也比简历更具体。",
    teaser: "身份、价值原则与仍在学习的事",
    intro:
      "你好，我是「你的名字」。我在研究、设计与技术之间工作，也持续学习如何把复杂的东西做得清楚、温暖、可被使用。",
    accent: "#b5d5d8",
    status: "AVAILABLE",
    lastUpdated: "GMT+8",
    focus: {
      camera: [-1.5, 4.15, 6.8],
      target: [-7.75, 2.3, 1.35],
    },
    metrics: [
      { value: "CN / EN", label: "工作语言" },
      { value: "GMT+8", label: "所在时区" },
      { value: "∞", label: "仍在学习" },
    ],
    entries: [
      {
        eyebrow: "I DO",
        title: "把模糊变成可以讨论的东西",
        body: "梳理问题、建立原型、验证判断，再把过程讲给不同背景的人听。",
        meta: "Research · Design · Code",
      },
      {
        eyebrow: "I VALUE",
        title: "清楚、诚实与留下余地",
        body: "不把复杂假装简单，也不让复杂成为无法行动的借口。",
        meta: "Working principles",
      },
      {
        eyebrow: "I AM LEARNING",
        title: "如何更好地共同完成",
        body: "在给出判断的同时保留倾听，让协作不仅更快，也让最终结果真正属于参与其中的人。",
        meta: "Ongoing practice",
      },
    ],
    note: "我希望作品能够说明能力，日常能够说明选择。",
    specialty: "default",
    related: ["contact", "research", "growth"],
  },
  {
    id: "travel",
    number: "10",
    category: "关系",
    objectLabel: "明信片墙",
    sectionTitle: "来路",
    trait: "我从很多地方来，也被很多人照亮。",
    teaser: "城市、旅途与重要的人生片段",
    intro:
      "地图只记录坐标，明信片记录关系。这里收下那些改变过观看方式的地方、同行者与一句仍然记得的话。",
    accent: "#efb6a0",
    status: "MEMORY MAP",
    lastUpdated: "09 PLACES",
    focus: {
      camera: [6.8, 4.35, -0.55],
      target: [2.85, 3.25, -5.72],
    },
    metrics: [
      { value: "09", label: "重要坐标" },
      { value: "04", label: "长期关系" },
      { value: "2018—", label: "记录跨度" },
    ],
    entries: [
      {
        eyebrow: "31°14′N",
        title: "学会在巨大城市里保留小尺度",
        body: "从一条熟悉的路、一个会记得口味的人，以及反复经过的树开始。",
        meta: "Shanghai · Home",
      },
      {
        eyebrow: "35°41′N",
        title: "重新理解秩序与留白",
        body: "不是把所有东西减到最少，而是让每个留下的东西有足够空间发生。",
        meta: "Tokyo · Field note",
      },
      {
        eyebrow: "THANK YOU",
        title: "那些没有出现在署名里的人",
        body: "他们提供过房间、晚饭、坦率的反对和在事情不确定时仍然愿意等一等。",
        meta: "Private acknowledgements",
      },
    ],
    note: "归属感不是找到一个不变的地方，而是知道哪些关系值得带在身上。",
    specialty: "timeline",
    related: ["photography", "contact", "about"],
  },
  {
    id: "contact",
    number: "11",
    category: "关系",
    objectLabel: "电话",
    sectionTitle: "留句话",
    trait: "如果你也在认真做一件事，我们可以聊聊。",
    teaser: "合作方向、联系方式与交流边界",
    intro:
      "不用写得正式。告诉我你正在做什么、遇到什么问题，以及为什么想到一起聊聊。请把示例联系方式替换成你自己的。",
    accent: "#e8c57a",
    status: "OPEN TO TALK",
    lastUpdated: "REPLY 2–3 DAYS",
    focus: {
      camera: [4.35, 2.8, 1.55],
      target: [1.7, 1.15, -3.55],
    },
    metrics: [
      { value: "2–3 d", label: "通常回复" },
      { value: "GMT+8", label: "所在时区" },
      { value: "Remote", label: "协作方式" },
    ],
    entries: [
      {
        eyebrow: "WELCOME",
        title: "研究与交互叙事",
        body: "尤其欢迎有关知识工具、空间界面、文化内容和公共价值的长期问题。",
        meta: "Project collaboration",
      },
      {
        eyebrow: "ALSO",
        title: "分享一段正在形成的想法",
        body: "它可以不完整。一次有准备的交流，常常比一次漂亮的提案更有价值。",
        meta: "Conversation · 30 min",
      },
      {
        eyebrow: "CONTACT",
        title: "hello@your-domain.com",
        body: "在上线前替换邮箱、社交链接和个人域名；不要把真实私人号码直接写入公开页面。",
        meta: "Email · Preferred",
      },
    ],
    note: "清楚的边界，会让真正重要的交流更容易发生。",
    specialty: "default",
    related: ["about", "making", "travel"],
  },
  {
    id: "future",
    number: "12",
    category: "成长",
    objectLabel: "尚未开启的门",
    sectionTitle: "下一间房",
    trait: "有些房间，还在建造中。",
    teaser: "未来 6–12 个月的公开路线图",
    intro:
      "这不是“敬请期待”，而是一份可被修订的方向说明：准备深入的问题、希望完成的作品，以及愿意共同开始的事情。",
    accent: "#9c90c8",
    status: "ROADMAP",
    lastUpdated: "2026 → 2027",
    focus: {
      camera: [1.8, 3.75, 0.35],
      target: [-2.35, 1.75, -5.72],
    },
    metrics: [
      { value: "03", label: "下一步" },
      { value: "12 mo", label: "观察窗口" },
      { value: "OPEN", label: "共同建造" },
    ],
    entries: [
      {
        eyebrow: "NEXT 01",
        title: "把这间房变成一套开放方法",
        body: "整理空间叙事、可访问导航和内容建模的方法，让更多人能建立自己的数字房间。",
        meta: "Open-source · Q4",
      },
      {
        eyebrow: "NEXT 02",
        title: "完成一张声音作品",
        body: "从不断增加草图，转向完成、发布并与真实听众建立一次完整反馈。",
        meta: "Music · Winter",
      },
      {
        eyebrow: "INVITATION",
        title: "寻找一个值得共同研究的问题",
        body: "它需要跨越学科、与真实生活有关，并且允许我们在答案出现前保持耐心。",
        meta: "Collaboration · Open",
      },
    ],
    note: "方向不是承诺不会改变，而是说明此刻为什么向那里走。",
    specialty: "research",
    related: ["making", "growth", "contact"],
  },
];

export const ASSET_BY_ID = Object.fromEntries(
  PORTFOLIO_ASSETS.map((asset) => [asset.id, asset]),
) as Record<AssetId, PortfolioAsset>;

export const CATEGORY_ORDER: AssetCategory[] = [
  "生活",
  "兴趣",
  "学术",
  "创造",
  "关系",
  "成长",
];

export function isAssetId(value: string | null): value is AssetId {
  return Boolean(value && value in ASSET_BY_ID);
}
