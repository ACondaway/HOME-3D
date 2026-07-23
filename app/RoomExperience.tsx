"use client";

import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  ASSET_BY_ID,
  CATEGORY_ORDER,
  PORTFOLIO_ASSETS,
  isAssetId,
  type AssetId,
  type PortfolioAsset,
} from "./portfolio-data";
import {
  CATEGORY_ORDER_EN,
  PORTFOLIO_ASSETS_EN,
} from "./portfolio-data-en";
import {
  EMPTY_SITE_CONTENT,
  mergeAssets,
  mergeProfile,
  parseSiteContent,
  type ContentLocale,
  type SiteContentConfig,
} from "./content-config";
import { ContentStudio } from "./ContentStudio";

type Locale = ContentLocale;

const COPY = {
  zh: {
    skip: "跳过三维场景，打开内容索引",
    sceneLabel: "可拖动的三维个人房间。使用方向键旋转，R 键重置视角。",
    personalSpace: "个人空间 · 2026",
    livingIndex: "生活索引",
    introEyebrow: "一间会回应你的房间 / 00",
    introTitle: "欢迎来",
    introTitleEm: "坐一会儿。",
    introDescription:
      "我把生活、好奇与正在发生的作品，放进了这间房。每件物品，都是认识我的一种方式。",
    fallbackDescription:
      "房间没能完整点亮，内容没有缺席。你仍然可以从索引进入生活、好奇与正在发生的作品。",
    fallbackStatus: "轻量内容模式",
    readyStatus: "房间已点亮",
    wakingStatus: "正在让房间醒来",
    start: "开始漫游",
    lighting: "正在点亮",
    openIndex: "打开内容索引",
    enterLite: "进入轻量版",
    drag: "拖动",
    dragDescription: "拖动环顾房间",
    scroll: "滚轮",
    scrollDescription: "滚轮靠近细节",
    select: "点按",
    selectDescription: "点按进入章节",
    quote: "“物品不是分类图标，而是生活方式的证据。”",
    index: "索引",
    reset: "重置",
    controls: "操作",
    hoverEnter: "点击进入",
    roomInstruction: "拖动环顾 · 滚轮缩放 · 点按探索",
    close: "关闭并返回房间",
    closeIndex: "关闭内容索引",
    closeHelp: "关闭操作帮助",
    room: "房间",
    updated: "更新于",
    continueExploring: "继续探索",
    nextObject: "房间里的下一件物品",
    indexEyebrow: "生活索引",
    indexTitle: "房间里的十二个入口",
    indexIntro:
      "3D 漫游和内容索引同样完整。你可以自由探索，也可以从这里直接抵达任何章节。",
    entries: "个入口",
    helpEyebrow: "如何移动",
    helpTitle: "在房间里移动",
    helpItems: [
      ["01", "拖动 · 环顾", "按住鼠标左键或单指拖动，改变观察方向。"],
      ["02", "滚轮 · 靠近", "滚轮或双指捏合缩放，右键拖动可以平移。"],
      ["03", "点按 · 打开", "当物品出现名称与光环时，点按进入内容页。"],
      ["KEY", "键盘也可完成", "方向键旋转，＋/－缩放，R 重置，Tab 进入内容索引。"],
    ],
    helpNote:
      "容易晕动或使用读屏？“内容索引”提供与三维空间等价的全部内容。",
    noscriptTitle: "你的名字 · 综合个人主页",
    noscriptBody: "JavaScript 未启用。下面仍然保留全部章节入口。",
    switchLanguage: "Switch to English",
    currentLanguage: "中",
    otherLanguage: "EN",
  },
  en: {
    skip: "Skip the 3D room and open the content index",
    sceneLabel:
      "An interactive 3D personal room. Use arrow keys to orbit and R to reset the view.",
    personalSpace: "PERSONAL SPACE · 2026",
    livingIndex: "THE LIVING INDEX",
    introEyebrow: "A ROOM THAT ANSWERS BACK / 00",
    introTitle: "Come in.",
    introTitleEm: "Stay awhile.",
    introDescription:
      "I placed my life, curiosities, and work in progress inside this room. Every object is another way to know me.",
    fallbackDescription:
      "The room could not fully light up, but none of the content is missing. Use the index to explore the work and life inside.",
    fallbackStatus: "LIGHTWEIGHT MODE",
    readyStatus: "ROOM IS READY",
    wakingStatus: "WAKING THE ROOM",
    start: "Enter the room",
    lighting: "Lighting the room",
    openIndex: "Open content index",
    enterLite: "Enter lightweight view",
    drag: "DRAG",
    dragDescription: "Drag to look around",
    scroll: "SCROLL",
    scrollDescription: "Scroll to move closer",
    select: "SELECT",
    selectDescription: "Select an object to enter",
    quote: "“Objects are not category icons. They are evidence of a life.”",
    index: "Index",
    reset: "Reset",
    controls: "Help",
    hoverEnter: "Select to enter",
    roomInstruction: "Drag to orbit · Scroll to zoom · Select to explore",
    close: "Close and return to the room",
    closeIndex: "Close the content index",
    closeHelp: "Close controls help",
    room: "Room",
    updated: "UPDATED",
    continueExploring: "CONTINUE EXPLORING",
    nextObject: "The next object in the room",
    indexEyebrow: "THE LIVING INDEX",
    indexTitle: "Twelve ways into the room",
    indexIntro:
      "The 3D room and the content index are equally complete. Wander freely, or go straight to any chapter from here.",
    entries: "ENTRIES",
    helpEyebrow: "HOW TO MOVE",
    helpTitle: "Move through the room",
    helpItems: [
      ["01", "Drag · Look", "Hold the left mouse button or drag with one finger to change the view."],
      ["02", "Scroll · Approach", "Use the wheel or pinch to zoom; right-drag to pan."],
      ["03", "Select · Open", "When an object reveals its name and halo, select it to enter."],
      ["KEY", "Keyboard ready", "Arrow keys orbit, +/− zoom, R resets, and Tab opens the index."],
    ],
    helpNote:
      "Motion-sensitive or using a screen reader? The content index contains everything available in the 3D room.",
    noscriptTitle: "Your Name · Personal Home",
    noscriptBody:
      "JavaScript is disabled. Every chapter is still listed below.",
    switchLanguage: "切换到中文",
    currentLanguage: "EN",
    otherLanguage: "中",
  },
} as const;

const DEFAULT_CAMERA = new THREE.Vector3(11.8, 7.1, 14.5);
const DEFAULT_TARGET = new THREE.Vector3(0, 1.25, -1.35);

const MARKER_POSITIONS: Record<AssetId, [number, number, number]> = {
  music: [-5.0, 0.18, -3.6],
  fitness: [5.2, 0.18, 1.6],
  reading: [5.45, 0.18, -4.15],
  research: [0.5, 0.18, -2.55],
  making: [2.75, 0.18, -0.25],
  photography: [0.0, 0.18, 2.45],
  ritual: [-3.55, 0.18, 0.65],
  growth: [-6.25, 0.18, -0.35],
  about: [-6.8, 0.18, 1.35],
  travel: [2.85, 0.18, -4.65],
  contact: [1.7, 0.18, -2.65],
  future: [-2.35, 0.18, -4.55],
};

interface SceneHandle {
  focus: (id: AssetId | null) => void;
  reset: () => void;
}

interface RoomSceneProps {
  activeId: AssetId | null;
  resetSignal: number;
  sceneLabel: string;
  onSelect: (id: AssetId) => void;
  onHover: (id: AssetId | null) => void;
  onReady: () => void;
  onError: () => void;
}

type AnimateCallback = (elapsed: number, delta: number) => void;

function standardMaterial(
  color: THREE.ColorRepresentation,
  roughness = 0.62,
  metalness = 0.08,
) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addBox(
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  color: THREE.ColorRepresentation,
  options: {
    rotation?: [number, number, number];
    roughness?: number;
    metalness?: number;
    castShadow?: boolean;
    receiveShadow?: boolean;
    emissive?: THREE.ColorRepresentation;
    emissiveIntensity?: number;
  } = {},
) {
  const material = standardMaterial(
    color,
    options.roughness,
    options.metalness,
  );
  if (options.emissive) {
    material.emissive.set(options.emissive);
    material.emissiveIntensity = options.emissiveIntensity ?? 0.2;
  }
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material,
  );
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(
  parent: THREE.Object3D,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  position: [number, number, number],
  color: THREE.ColorRepresentation,
  options: {
    rotation?: [number, number, number];
    segments?: number;
    roughness?: number;
    metalness?: number;
    scale?: [number, number, number];
  } = {},
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      options.segments ?? 32,
    ),
    standardMaterial(color, options.roughness, options.metalness),
  );
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  if (options.scale) mesh.scale.set(...options.scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSphere(
  parent: THREE.Object3D,
  radius: number,
  position: [number, number, number],
  color: THREE.ColorRepresentation,
  scale: [number, number, number] = [1, 1, 1],
  roughness = 0.58,
) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 18),
    standardMaterial(color, roughness, 0.04),
  );
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addHitbox(
  parent: THREE.Object3D,
  id: AssetId,
  size: [number, number, number],
  position: [number, number, number],
  hitboxes: THREE.Mesh[],
  rotation?: [number, number, number],
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      colorWrite: false,
      depthWrite: false,
    }),
  );
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.userData.assetId = id;
  parent.add(mesh);
  hitboxes.push(mesh);
  return mesh;
}

function addSignal(parent: THREE.Object3D, id: AssetId, position: [number, number, number]) {
  const material = new THREE.MeshBasicMaterial({
    color: ASSET_BY_ID[id].accent,
    transparent: true,
    opacity: 0.85,
  });
  const signal = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 12, 10),
    material,
  );
  signal.position.set(...position);
  parent.add(signal);
  return signal;
}

function createRoomShell(scene: THREE.Scene) {
  const room = new THREE.Group();
  scene.add(room);

  addBox(room, [16, 0.24, 11], [0, -0.12, -0.5], "#5d4436", {
    roughness: 0.86,
    metalness: 0,
    receiveShadow: true,
  });
  addBox(room, [16, 6.6, 0.22], [0, 3.18, -6], "#d9d0be", {
    roughness: 0.94,
    metalness: 0,
  });
  addBox(room, [0.22, 6.6, 11], [-8, 3.18, -0.5], "#cec4b1", {
    roughness: 0.94,
    metalness: 0,
  });

  addBox(room, [16, 0.18, 0.22], [0, 0.45, -5.84], "#6c4d3b", {
    roughness: 0.75,
  });
  addBox(room, [0.2, 0.18, 11], [-7.84, 0.45, -0.5], "#6c4d3b", {
    roughness: 0.75,
  });
  addBox(room, [16, 0.07, 0.12], [0, 4.95, -5.82], "#b09b78", {
    roughness: 0.75,
  });

  for (let x = -7.4; x <= 7.4; x += 0.8) {
    addBox(room, [0.035, 0.012, 10.6], [x, 0.014, -0.5], "#7a5a45", {
      castShadow: false,
      receiveShadow: false,
    });
  }

  const rug = addBox(room, [7.3, 0.07, 4.6], [0.3, 0.055, 0.25], "#6f514d", {
    roughness: 1,
    metalness: 0,
  });
  rug.castShadow = false;
  for (let z = -1.7; z <= 2.2; z += 0.55) {
    addBox(room, [6.75, 0.016, 0.025], [0.3, 0.1, z], "#9e7a69", {
      castShadow: false,
      receiveShadow: false,
    });
  }

  const windowGroup = new THREE.Group();
  windowGroup.position.set(-7.86, 3.75, -3.35);
  windowGroup.rotation.y = Math.PI / 2;
  room.add(windowGroup);
  addBox(windowGroup, [3.15, 2.35, 0.08], [0, 0, 0], "#607f88", {
    roughness: 0.25,
    metalness: 0.12,
    emissive: "#8db9c2",
    emissiveIntensity: 0.24,
  });
  addBox(windowGroup, [3.45, 0.15, 0.16], [0, 1.25, 0.04], "#7a5b42");
  addBox(windowGroup, [3.45, 0.15, 0.16], [0, -1.25, 0.04], "#7a5b42");
  addBox(windowGroup, [0.15, 2.65, 0.16], [-1.65, 0, 0.04], "#7a5b42");
  addBox(windowGroup, [0.15, 2.65, 0.16], [1.65, 0, 0.04], "#7a5b42");
  addBox(windowGroup, [0.09, 2.4, 0.13], [0, 0, 0.06], "#8f7054");
  addBox(windowGroup, [3.2, 0.09, 0.13], [0, 0, 0.06], "#8f7054");

  const sunlight = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 3.6),
    new THREE.MeshBasicMaterial({
      color: "#e6c790",
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  sunlight.position.set(-4.8, 0.13, -1.8);
  sunlight.rotation.x = -Math.PI / 2;
  sunlight.rotation.z = -0.2;
  scene.add(sunlight);

  const pendantCable = addCylinder(
    room,
    0.018,
    0.018,
    1.5,
    [0.1, 5.75, -0.5],
    "#342b28",
    { segments: 12, metalness: 0.4 },
  );
  pendantCable.castShadow = false;
  addCylinder(room, 0.42, 0.72, 0.5, [0.1, 4.83, -0.5], "#a67848", {
    segments: 40,
    roughness: 0.4,
    metalness: 0.5,
  });
  const bulb = addSphere(room, 0.16, [0.1, 4.58, -0.5], "#f1d6a2", [1, 1.18, 1], 0.15);
  (bulb.material as THREE.MeshStandardMaterial).emissive.set("#f4c77c");
  (bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6;

  return room;
}

function createMusicAsset(
  scene: THREE.Scene,
  hitboxes: THREE.Mesh[],
  animated: AnimateCallback[],
) {
  const group = new THREE.Group();
  group.position.set(-5.0, 0, -4.72);
  scene.add(group);

  addBox(group, [3.25, 0.85, 1.05], [0, 0.62, 0], "#49362c", {
    roughness: 0.62,
    metalness: 0.04,
  });
  addBox(group, [3.05, 0.08, 0.95], [0, 1.08, 0], "#7c5a3d", {
    roughness: 0.48,
  });
  [-1.35, 1.35].forEach((x) => {
    addBox(group, [0.16, 0.5, 0.16], [x, 0.25, 0], "#3e2d25");
  });

  const gramophone = new THREE.Group();
  gramophone.position.set(-0.58, 1.08, 0);
  group.add(gramophone);
  addBox(gramophone, [1.35, 0.24, 0.82], [0, 0.13, 0], "#69472f", {
    roughness: 0.48,
  });
  const record = addCylinder(
    gramophone,
    0.37,
    0.37,
    0.045,
    [0, 0.29, 0],
    "#171717",
    { segments: 48, roughness: 0.26, metalness: 0.24 },
  );
  addCylinder(gramophone, 0.09, 0.09, 0.052, [0, 0.32, 0], "#bb6e4a", {
    segments: 32,
  });
  addCylinder(gramophone, 0.035, 0.035, 0.42, [0.5, 0.56, -0.1], "#b68c55", {
    rotation: [0, 0, -0.5],
    segments: 12,
    roughness: 0.3,
    metalness: 0.72,
  });

  const horn = new THREE.Mesh(
    new THREE.ConeGeometry(0.62, 1.08, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: "#b6793d",
      roughness: 0.38,
      metalness: 0.68,
      side: THREE.DoubleSide,
    }),
  );
  horn.position.set(0.7, 0.94, -0.05);
  horn.rotation.z = -Math.PI / 2;
  horn.castShadow = true;
  gramophone.add(horn);

  for (let i = 0; i < 7; i += 1) {
    addBox(
      group,
      [0.055, 0.64, 0.64],
      [0.55 + i * 0.12, 1.45, 0.06],
      ["#8a4039", "#c39a61", "#526b68", "#7d6c8c"][i % 4],
      {
        rotation: [0, -0.1, 0],
        roughness: 0.7,
      },
    );
  }
  addHitbox(group, "music", [3.45, 2.2, 1.5], [0, 1.15, 0], hitboxes);
  addSignal(group, "music", [1.52, 1.15, 0.46]);
  animated.push((_, delta) => {
    record.rotation.y += delta * 0.42;
  });
}

function createReadingAsset(scene: THREE.Scene, hitboxes: THREE.Mesh[]) {
  const group = new THREE.Group();
  group.position.set(5.45, 0, -5.36);
  scene.add(group);

  addBox(group, [2.65, 4.5, 0.46], [0, 2.25, 0], "#4a352d", {
    roughness: 0.62,
  });
  addBox(group, [2.38, 4.15, 0.52], [0, 2.25, 0.17], "#755340", {
    roughness: 0.74,
  });
  [-1.14, 1.14].forEach((x) =>
    addBox(group, [0.16, 4.25, 0.72], [x, 2.25, 0.2], "#3f2d26"),
  );
  for (let shelf = 0; shelf < 5; shelf += 1) {
    const y = 0.55 + shelf * 0.84;
    addBox(group, [2.4, 0.12, 0.72], [0, y, 0.22], "#3f2d26");
    const count = shelf === 4 ? 7 : 10;
    for (let book = 0; book < count; book += 1) {
      const width = 0.12 + ((book * 7 + shelf * 3) % 5) * 0.018;
      const height = 0.48 + ((book * 5 + shelf) % 4) * 0.055;
      addBox(
        group,
        [width, height, 0.48],
        [-0.98 + book * 0.205, y + 0.08 + height / 2, 0.25],
        ["#b66a52", "#68827a", "#d1b37b", "#6f5e77", "#927d5b"][
          (book + shelf) % 5
        ],
        {
          rotation: [0, 0, ((book + shelf) % 5 === 0 ? -1 : 0) * 0.04],
          roughness: 0.83,
        },
      );
    }
  }
  addHitbox(group, "reading", [3.0, 4.9, 1.25], [0, 2.35, 0.2], hitboxes);
  addSignal(group, "reading", [1.25, 4.48, 0.55]);
}

function createFitnessAsset(scene: THREE.Scene, hitboxes: THREE.Mesh[]) {
  const group = new THREE.Group();
  group.position.set(5.2, 0, 1.6);
  scene.add(group);

  addBox(group, [3.0, 0.075, 1.75], [0, 0.07, 0], "#61756e", {
    roughness: 0.98,
    metalness: 0,
  });
  for (let d = 0; d < 2; d += 1) {
    const z = d === 0 ? -0.43 : 0.44;
    const x = d === 0 ? -0.42 : 0.4;
    addCylinder(group, 0.075, 0.075, 0.92, [x, 0.36, z], "#777b7a", {
      rotation: [0, 0, Math.PI / 2],
      segments: 20,
      roughness: 0.28,
      metalness: 0.72,
    });
    [-0.5, 0.5].forEach((side) => {
      addCylinder(
        group,
        0.29,
        0.29,
        0.16,
        [x + side * 0.72, 0.36, z],
        "#2f3735",
        {
          rotation: [0, 0, Math.PI / 2],
          segments: 24,
          roughness: 0.74,
          metalness: 0.15,
        },
      );
      addCylinder(
        group,
        0.22,
        0.22,
        0.19,
        [x + side * 0.58, 0.36, z],
        "#596561",
        {
          rotation: [0, 0, Math.PI / 2],
          segments: 24,
          roughness: 0.65,
        },
      );
    });
  }
  addCylinder(group, 0.34, 0.28, 0.56, [1.0, 0.35, -0.45], "#8f5e47", {
    segments: 32,
    roughness: 0.58,
  });
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.07, 12, 28, Math.PI),
    standardMaterial("#8f5e47", 0.55, 0.08),
  );
  handle.position.set(1.0, 0.64, -0.45);
  handle.rotation.x = Math.PI;
  group.add(handle);

  addHitbox(group, "fitness", [3.5, 1.25, 2.3], [0, 0.55, 0], hitboxes);
  addSignal(group, "fitness", [1.42, 0.18, 0.78]);
}

function createResearchAndContactAssets(
  scene: THREE.Scene,
  hitboxes: THREE.Mesh[],
  animated: AnimateCallback[],
) {
  const desk = new THREE.Group();
  desk.position.set(0.45, 0, -3.65);
  scene.add(desk);

  addBox(desk, [3.55, 0.16, 1.35], [0, 1.05, 0], "#785a43", {
    roughness: 0.68,
  });
  [-1.5, 1.5].forEach((x) => {
    [-0.48, 0.48].forEach((z) =>
      addBox(desk, [0.14, 1.02, 0.14], [x, 0.52, z], "#4a382f"),
    );
  });

  const laptop = new THREE.Group();
  laptop.position.set(-0.55, 1.16, 0);
  desk.add(laptop);
  addBox(laptop, [1.4, 0.065, 0.92], [0, 0, 0.08], "#7d8581", {
    roughness: 0.3,
    metalness: 0.65,
  });
  const screen = addBox(
    laptop,
    [1.4, 0.86, 0.055],
    [0, 0.44, -0.38],
    "#243b3a",
    {
      rotation: [-0.1, 0, 0],
      roughness: 0.18,
      metalness: 0.3,
      emissive: "#3b7b77",
      emissiveIntensity: 0.55,
    },
  );
  addBox(laptop, [0.84, 0.018, 0.045], [0, 0.5, -0.41], "#7fc2b8", {
    rotation: [-0.1, 0, 0],
    castShadow: false,
  });
  addBox(laptop, [0.55, 0.018, 0.045], [-0.14, 0.34, -0.41], "#d3b06b", {
    rotation: [-0.1, 0, 0],
    castShadow: false,
  });

  const lampArm = addCylinder(
    desk,
    0.035,
    0.035,
    0.95,
    [-1.42, 1.55, -0.28],
    "#a17c4d",
    {
      rotation: [0, 0, -0.35],
      segments: 12,
      roughness: 0.35,
      metalness: 0.6,
    },
  );
  lampArm.castShadow = false;
  addCylinder(desk, 0.24, 0.38, 0.38, [-1.22, 1.96, -0.28], "#b78c55", {
    rotation: [0, 0, 0.42],
    segments: 32,
    roughness: 0.4,
    metalness: 0.55,
  });

  addHitbox(desk, "research", [2.15, 2.05, 1.5], [-0.55, 1.25, 0], hitboxes);
  addSignal(desk, "research", [-1.68, 1.18, 0.58]);

  const phone = new THREE.Group();
  phone.position.set(1.28, 1.15, -0.08);
  desk.add(phone);
  addBox(phone, [0.88, 0.28, 0.65], [0, 0.13, 0], "#c69a52", {
    roughness: 0.45,
    metalness: 0.2,
  });
  const dial = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.045, 12, 32),
    standardMaterial("#3f4744", 0.38, 0.58),
  );
  dial.position.set(0, 0.29, 0);
  dial.rotation.x = -Math.PI / 2;
  phone.add(dial);
  addCylinder(phone, 0.045, 0.045, 0.58, [0, 0.48, 0], "#333b39", {
    rotation: [0, 0, Math.PI / 2],
    segments: 18,
    roughness: 0.55,
  });
  addSphere(phone, 0.12, [-0.33, 0.48, 0], "#333b39", [0.75, 1, 0.85]);
  addSphere(phone, 0.12, [0.33, 0.48, 0], "#333b39", [0.75, 1, 0.85]);
  addHitbox(phone, "contact", [1.18, 0.92, 1.0], [0, 0.3, 0], hitboxes);
  addSignal(phone, "contact", [0.42, 0.57, 0.28]);

  animated.push((elapsed) => {
    (screen.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.45 + Math.sin(elapsed * 1.2) * 0.08;
  });
}

function createMakingAsset(
  scene: THREE.Scene,
  hitboxes: THREE.Mesh[],
  animated: AnimateCallback[],
) {
  const group = new THREE.Group();
  group.position.set(2.75, 0, -1.35);
  scene.add(group);
  addBox(group, [2.8, 0.17, 1.35], [0, 0.92, 0], "#6c4b37", {
    roughness: 0.72,
  });
  [-1.12, 1.12].forEach((x) =>
    [-0.45, 0.45].forEach((z) =>
      addBox(group, [0.13, 0.9, 0.13], [x, 0.46, z], "#3b302b"),
    ),
  );
  addBox(group, [2.55, 1.15, 0.08], [0, 1.75, -0.6], "#7a5a46", {
    roughness: 0.8,
  });
  for (let x = -1; x <= 1; x += 0.25) {
    for (let y = 1.35; y <= 2.15; y += 0.25) {
      addCylinder(group, 0.016, 0.016, 0.035, [x, y, -0.66], "#c3a275", {
        rotation: [Math.PI / 2, 0, 0],
        segments: 8,
        roughness: 0.7,
      }).castShadow = false;
    }
  }
  const prototype = new THREE.Group();
  prototype.position.set(0.15, 1.05, 0);
  group.add(prototype);
  addBox(prototype, [0.82, 0.33, 0.68], [0, 0.16, 0], "#d5a15e", {
    roughness: 0.42,
    metalness: 0.22,
  });
  addCylinder(prototype, 0.14, 0.14, 0.1, [-0.42, 0.05, 0.2], "#394846", {
    rotation: [0, 0, Math.PI / 2],
    segments: 18,
  });
  addCylinder(prototype, 0.14, 0.14, 0.1, [0.42, 0.05, 0.2], "#394846", {
    rotation: [0, 0, Math.PI / 2],
    segments: 18,
  });
  addBox(prototype, [0.34, 0.25, 0.34], [0, 0.48, 0], "#6fa6a0", {
    emissive: "#4d918a",
    emissiveIntensity: 0.25,
  });
  addCylinder(group, 0.035, 0.035, 0.68, [-0.82, 1.35, -0.25], "#a86d50", {
    rotation: [0, 0, -0.42],
    segments: 12,
  });
  addBox(group, [0.35, 0.58, 0.09], [-0.62, 1.72, -0.61], "#536b68", {
    rotation: [0, 0, 0.1],
  });
  addHitbox(group, "making", [3.15, 2.75, 1.85], [0, 1.3, 0], hitboxes);
  addSignal(group, "making", [1.37, 1.05, 0.58]);
  animated.push((elapsed) => {
    prototype.position.y = 1.05 + Math.sin(elapsed * 1.35) * 0.035;
  });
}

function createPhotographyAsset(scene: THREE.Scene, hitboxes: THREE.Mesh[]) {
  const group = new THREE.Group();
  group.position.set(0, 0, 2.45);
  scene.add(group);
  addCylinder(group, 0.56, 0.68, 0.76, [0, 0.39, 0], "#4e3e35", {
    segments: 40,
    roughness: 0.82,
  });
  addCylinder(group, 0.6, 0.6, 0.08, [0, 0.81, 0], "#aa8557", {
    segments: 40,
    roughness: 0.52,
    metalness: 0.25,
  });
  const camera = new THREE.Group();
  camera.position.set(0, 1.08, 0);
  camera.rotation.y = -0.18;
  group.add(camera);
  addBox(camera, [1.05, 0.65, 0.45], [0, 0, 0], "#313735", {
    roughness: 0.48,
    metalness: 0.4,
  });
  addBox(camera, [0.42, 0.16, 0.44], [-0.25, 0.39, 0], "#404a47", {
    roughness: 0.4,
    metalness: 0.45,
  });
  addCylinder(camera, 0.29, 0.34, 0.42, [0.12, 0, 0.38], "#1e2423", {
    rotation: [Math.PI / 2, 0, 0],
    segments: 40,
    roughness: 0.3,
    metalness: 0.5,
  });
  addCylinder(camera, 0.2, 0.2, 0.435, [0.12, 0, 0.45], "#6c8e91", {
    rotation: [Math.PI / 2, 0, 0],
    segments: 40,
    roughness: 0.12,
    metalness: 0.35,
  });
  addHitbox(group, "photography", [1.75, 1.9, 1.55], [0, 0.85, 0], hitboxes);
  addSignal(group, "photography", [0.58, 1.45, 0.22]);
}

function createRitualAsset(
  scene: THREE.Scene,
  hitboxes: THREE.Mesh[],
  animated: AnimateCallback[],
) {
  const group = new THREE.Group();
  group.position.set(-3.55, 0, -0.55);
  scene.add(group);
  addCylinder(group, 1.15, 1.15, 0.13, [0, 0.91, 0], "#6e4a36", {
    segments: 48,
    roughness: 0.72,
  });
  addCylinder(group, 0.17, 0.23, 0.87, [0, 0.44, 0], "#46362e", {
    segments: 24,
    roughness: 0.7,
  });
  addCylinder(group, 0.68, 0.82, 0.08, [0, 0.05, 0], "#3d302b", {
    segments: 40,
    roughness: 0.75,
  });

  const teapot = new THREE.Group();
  teapot.position.set(-0.22, 1.03, -0.02);
  group.add(teapot);
  addSphere(teapot, 0.34, [0, 0.2, 0], "#9f6c4e", [1.15, 0.85, 1], 0.52);
  addCylinder(teapot, 0.11, 0.18, 0.18, [0, 0.5, 0], "#9f6c4e", {
    segments: 24,
    roughness: 0.52,
  });
  addSphere(teapot, 0.11, [0, 0.62, 0], "#b7845f");
  const spout = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.68, 24),
    standardMaterial("#9f6c4e", 0.52, 0.08),
  );
  spout.position.set(0.43, 0.28, 0);
  spout.rotation.z = -Math.PI / 2.45;
  teapot.add(spout);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.055, 12, 32, Math.PI * 1.35),
    standardMaterial("#8b5c44", 0.55, 0.06),
  );
  handle.position.set(-0.3, 0.29, 0);
  handle.rotation.y = Math.PI / 2;
  handle.rotation.z = 0.68;
  teapot.add(handle);

  addCylinder(group, 0.18, 0.14, 0.28, [0.58, 1.12, 0.18], "#d2c3a8", {
    segments: 32,
    roughness: 0.62,
  });
  const steamMaterial = new THREE.MeshBasicMaterial({
    color: "#e8e3d9",
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const steam = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.012, 8, 24, Math.PI * 1.35),
    steamMaterial,
  );
  steam.position.set(0.58, 1.54, 0.18);
  steam.rotation.x = Math.PI / 2;
  group.add(steam);
  addHitbox(group, "ritual", [2.75, 1.95, 2.75], [0, 0.9, 0], hitboxes);
  addSignal(group, "ritual", [0.92, 1.03, 0.25]);
  animated.push((elapsed) => {
    steam.position.y = 1.5 + (elapsed * 0.1) % 0.18;
    steamMaterial.opacity = 0.12 + Math.sin(elapsed * 1.7) * 0.04;
  });
}

function createGrowthAsset(
  scene: THREE.Scene,
  hitboxes: THREE.Mesh[],
  animated: AnimateCallback[],
) {
  const group = new THREE.Group();
  group.position.set(-6.25, 0, -1.6);
  scene.add(group);
  addCylinder(group, 0.54, 0.42, 0.78, [0, 0.42, 0], "#8e5c42", {
    segments: 32,
    roughness: 0.82,
  });
  addCylinder(group, 0.57, 0.57, 0.12, [0, 0.82, 0], "#b87953", {
    segments: 32,
    roughness: 0.78,
  });
  const leafGroups: THREE.Group[] = [];
  const leaves = [
    [-0.16, 1.22, 0.05, -0.6],
    [0.18, 1.45, 0.02, 0.65],
    [-0.22, 1.68, -0.05, -0.85],
    [0.16, 1.94, 0.03, 0.72],
    [-0.05, 2.18, 0, -0.2],
    [0.34, 1.2, -0.12, 0.95],
    [-0.38, 1.4, 0.1, -1.0],
  ] as Array<[number, number, number, number]>;
  leaves.forEach(([x, y, z, rotation], index) => {
    addCylinder(group, 0.018, 0.025, y - 0.72, [x * 0.3, (y + 0.72) / 2, z * 0.3], "#45694f", {
      rotation: [0.08, 0, rotation * 0.15],
      segments: 8,
      roughness: 0.85,
    }).castShadow = false;
    const leafGroup = new THREE.Group();
    leafGroup.position.set(x, y, z);
    leafGroup.rotation.z = rotation;
    group.add(leafGroup);
    addSphere(
      leafGroup,
      0.36,
      [0, 0, 0],
      index % 2 ? "#648f68" : "#537b5b",
      [1.65, 0.38, 0.8],
      0.82,
    );
    leafGroups.push(leafGroup);
  });
  addHitbox(group, "growth", [2.25, 3.0, 2.0], [0, 1.35, 0], hitboxes);
  addSignal(group, "growth", [0.48, 2.38, 0.18]);
  animated.push((elapsed) => {
    leafGroups.forEach((leaf, index) => {
      leaf.rotation.y = Math.sin(elapsed * 0.55 + index) * 0.055;
    });
  });
}

function createAboutAsset(scene: THREE.Scene, hitboxes: THREE.Mesh[]) {
  const group = new THREE.Group();
  group.position.set(-7.82, 2.3, 1.35);
  group.rotation.y = Math.PI / 2;
  scene.add(group);
  addBox(group, [2.25, 3.05, 0.16], [0, 0, 0], "#9a744b", {
    roughness: 0.44,
    metalness: 0.44,
  });
  addBox(group, [1.92, 2.72, 0.19], [0, 0, 0.03], "#8fa5a6", {
    roughness: 0.13,
    metalness: 0.82,
    emissive: "#587476",
    emissiveIntensity: 0.16,
  });
  addBox(group, [0.78, 0.025, 0.205], [-0.25, 0.35, 0.14], "#dce7e3", {
    rotation: [0, 0, -0.08],
    castShadow: false,
  });
  addBox(group, [0.52, 0.02, 0.205], [0.22, 0.08, 0.14], "#cadbd7", {
    rotation: [0, 0, 0.05],
    castShadow: false,
  });
  addHitbox(group, "about", [2.65, 3.5, 0.75], [0, 0, 0], hitboxes);
  addSignal(group, "about", [1.08, 1.55, 0.2]);
}

function createTravelAsset(scene: THREE.Scene, hitboxes: THREE.Mesh[]) {
  const group = new THREE.Group();
  group.position.set(2.85, 3.25, -5.82);
  scene.add(group);
  addBox(group, [3.2, 1.85, 0.12], [0, 0, 0], "#6a4b37", {
    roughness: 0.78,
  });
  addBox(group, [2.9, 1.55, 0.15], [0, 0, 0.05], "#b99b72", {
    roughness: 0.95,
    metalness: 0,
  });
  const cards = [
    [-0.9, 0.38, -0.08, "#ddd0b6"],
    [0.02, 0.26, 0.04, "#c98671"],
    [0.9, 0.35, -0.05, "#8ca4a1"],
    [-0.48, -0.42, 0.06, "#7d8e77"],
    [0.54, -0.42, -0.04, "#d8b67c"],
  ] as Array<[number, number, number, string]>;
  cards.forEach(([x, y, rotation, color], index) => {
    addBox(group, [0.72, 0.52, 0.035], [x, y, 0.16], color, {
      rotation: [0, 0, rotation],
      roughness: 0.9,
    });
    addSphere(group, 0.035, [x, y + 0.2, 0.2], index % 2 ? "#8d4f42" : "#4e6f6a");
  });
  addHitbox(group, "travel", [3.65, 2.2, 0.72], [0, 0, 0], hitboxes);
  addSignal(group, "travel", [1.52, 0.87, 0.22]);
}

function createFutureAsset(
  scene: THREE.Scene,
  hitboxes: THREE.Mesh[],
  animated: AnimateCallback[],
) {
  const group = new THREE.Group();
  group.position.set(-2.35, 0, -5.79);
  scene.add(group);
  const door = addBox(group, [1.85, 4.2, 0.18], [0, 2.1, 0], "#3d4d4a", {
    roughness: 0.67,
    metalness: 0.12,
    emissive: "#576e69",
    emissiveIntensity: 0.12,
  });
  addBox(group, [1.42, 1.5, 0.08], [0, 3.08, 0.12], "#435a56", {
    roughness: 0.7,
  });
  addBox(group, [1.42, 1.5, 0.08], [0, 1.2, 0.12], "#435a56", {
    roughness: 0.7,
  });
  addCylinder(group, 0.09, 0.09, 0.09, [0.58, 2.0, 0.19], "#d0a45f", {
    rotation: [Math.PI / 2, 0, 0],
    segments: 24,
    roughness: 0.25,
    metalness: 0.72,
  });
  addBox(group, [2.18, 0.18, 0.32], [0, 4.28, 0], "#8d6c4c");
  addBox(group, [0.18, 4.45, 0.32], [-1.02, 2.12, 0], "#8d6c4c");
  addBox(group, [0.18, 4.45, 0.32], [1.02, 2.12, 0], "#8d6c4c");
  addHitbox(group, "future", [2.45, 4.7, 0.9], [0, 2.2, 0], hitboxes);
  addSignal(group, "future", [0.84, 4.36, 0.18]);
  animated.push((elapsed) => {
    (door.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.1 + (Math.sin(elapsed * 0.75) + 1) * 0.035;
  });
}

function createSceneAssets(
  scene: THREE.Scene,
  hitboxes: THREE.Mesh[],
  animated: AnimateCallback[],
) {
  createMusicAsset(scene, hitboxes, animated);
  createReadingAsset(scene, hitboxes);
  createFitnessAsset(scene, hitboxes);
  createResearchAndContactAssets(scene, hitboxes, animated);
  createMakingAsset(scene, hitboxes, animated);
  createPhotographyAsset(scene, hitboxes);
  createRitualAsset(scene, hitboxes, animated);
  createGrowthAsset(scene, hitboxes, animated);
  createAboutAsset(scene, hitboxes);
  createTravelAsset(scene, hitboxes);
  createFutureAsset(scene, hitboxes, animated);
}

function RoomScene({
  activeId,
  resetSignal,
  sceneLabel,
  onSelect,
  onHover,
  onReady,
  onError,
}: RoomSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onHoverRef.current = onHover;
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !window.matchMedia("(max-width: 740px)").matches,
        powerPreference: "high-performance",
      });
    } catch {
      onErrorRef.current();
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#111c19");
    scene.fog = new THREE.Fog("#111c19", 18, 36);

    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 70);
    camera.position.copy(DEFAULT_CAMERA);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = true;
    controls.minDistance = 5.5;
    controls.maxDistance = 23;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.screenSpacePanning = false;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.className = "room-canvas";
    renderer.domElement.setAttribute("role", "region");
    renderer.domElement.tabIndex = 0;
    host.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight("#a9c7c1", "#2b241f", 1.55);
    scene.add(hemi);
    const key = new THREE.DirectionalLight("#f1d5a4", 3.2);
    key.position.set(-7, 9, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(
      window.matchMedia("(max-width: 740px)").matches ? 512 : 1024,
      window.matchMedia("(max-width: 740px)").matches ? 512 : 1024,
    );
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    key.shadow.bias = -0.00035;
    scene.add(key);
    const warm = new THREE.PointLight("#e9a861", 13, 10, 2.1);
    warm.position.set(0.1, 4.4, -0.5);
    scene.add(warm);
    const fill = new THREE.PointLight("#6ba7a2", 5, 12, 2.2);
    fill.position.set(5.5, 3.2, 2.8);
    scene.add(fill);

    createRoomShell(scene);
    const hitboxes: THREE.Mesh[] = [];
    const animated: AnimateCallback[] = [];
    createSceneAssets(scene, hitboxes, animated);

    const markerMaterial = new THREE.MeshBasicMaterial({
      color: "#e2a85f",
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.43, 48),
      markerMaterial,
    );
    marker.rotation.x = -Math.PI / 2;
    marker.visible = false;
    scene.add(marker);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerStart = new THREE.Vector2();
    let pointerId: number | null = null;
    let pointerType = "mouse";
    let moved = false;
    let hoveredId: AssetId | null = null;
    let activeMarkerId: AssetId | null = null;
    let isVisible = !document.hidden;
    let lastFrame = performance.now();
    let elapsed = 0;
    let goalCamera = DEFAULT_CAMERA.clone();
    let goalTarget = DEFAULT_TARGET.clone();
    let tweening = false;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const setPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pick = (event: PointerEvent) => {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const intersection = raycaster.intersectObjects(hitboxes, false)[0];
      const id = intersection?.object.userData.assetId;
      return isAssetId(id) ? id : null;
    };

    const showMarker = (id: AssetId | null) => {
      activeMarkerId = id;
      if (!id) {
        marker.visible = false;
        return;
      }
      marker.position.set(...MARKER_POSITIONS[id]);
      markerMaterial.color.set(ASSET_BY_ID[id].accent);
      marker.visible = true;
    };

    const setHovered = (id: AssetId | null) => {
      if (hoveredId === id) return;
      hoveredId = id;
      renderer.domElement.style.cursor = id ? "pointer" : "grab";
      if (!activeMarkerId || !id) showMarker(id ?? activeMarkerId);
      onHoverRef.current(id);
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerId = event.pointerId;
      pointerType = event.pointerType;
      pointerStart.set(event.clientX, event.clientY);
      moved = false;
      renderer.domElement.style.cursor = "grabbing";
      renderer.domElement.focus({ preventScroll: true });
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (pointerId === event.pointerId) {
        const threshold = pointerType === "touch" ? 11 : 6;
        if (
          Math.hypot(
            event.clientX - pointerStart.x,
            event.clientY - pointerStart.y,
          ) > threshold
        ) {
          moved = true;
          setHovered(null);
        }
      }
      if (event.pointerType === "mouse" && pointerId === null) {
        setHovered(pick(event));
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const shouldPick = !moved;
      pointerId = null;
      renderer.domElement.style.cursor = hoveredId ? "pointer" : "grab";
      if (!shouldPick) return;
      const id = pick(event);
      if (id) {
        showMarker(id);
        onSelectRef.current(id);
      }
    };

    const handlePointerLeave = () => {
      pointerId = null;
      moved = false;
      setHovered(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        handleRef.current?.reset();
        return;
      }
      const direction =
        event.key === "ArrowLeft"
          ? 1
          : event.key === "ArrowRight"
            ? -1
            : 0;
      if (direction) {
        event.preventDefault();
        const offset = camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          direction * 0.085,
        );
        camera.position.copy(controls.target).add(offset);
        controls.update();
      }
      if (event.key === "+" || event.key === "=" || event.key === "-") {
        event.preventDefault();
        const offset = camera.position.clone().sub(controls.target);
        const scale = event.key === "-" ? 1.1 : 0.9;
        offset.multiplyScalar(scale);
        camera.position.copy(controls.target).add(offset);
        controls.update();
      }
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onErrorRef.current();
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
      lastFrame = performance.now();
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener(
      "pointercancel",
      handlePointerLeave,
    );
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    renderer.domElement.addEventListener("keydown", handleKeyDown);
    renderer.domElement.addEventListener(
      "webglcontextlost",
      handleContextLost,
    );
    document.addEventListener("visibilitychange", handleVisibility);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      const mobile = width <= 740;
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, mobile ? 1.2 : 1.6),
      );
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    handleRef.current = {
      focus(id) {
        if (!id) {
          controls.enabled = true;
          activeMarkerId = null;
          if (!hoveredId) marker.visible = false;
          return;
        }
        const asset = ASSET_BY_ID[id];
        goalCamera = new THREE.Vector3(...asset.focus.camera);
        goalTarget = new THREE.Vector3(...asset.focus.target);
        showMarker(id);
        controls.enabled = false;
        if (reducedMotion.matches) {
          camera.position.copy(goalCamera);
          controls.target.copy(goalTarget);
          controls.update();
          tweening = false;
        } else {
          tweening = true;
        }
      },
      reset() {
        goalCamera = DEFAULT_CAMERA.clone();
        goalTarget = DEFAULT_TARGET.clone();
        activeMarkerId = null;
        marker.visible = false;
        controls.enabled = true;
        if (reducedMotion.matches) {
          camera.position.copy(goalCamera);
          controls.target.copy(goalTarget);
          controls.update();
          tweening = false;
        } else {
          tweening = true;
        }
      },
    };

    renderer.setAnimationLoop((now) => {
      if (!isVisible) return;
      const delta = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      elapsed += delta;

      if (tweening) {
        const alpha = 1 - Math.exp(-delta * 5.8);
        camera.position.lerp(goalCamera, alpha);
        controls.target.lerp(goalTarget, alpha);
        if (
          camera.position.distanceTo(goalCamera) < 0.018 &&
          controls.target.distanceTo(goalTarget) < 0.018
        ) {
          camera.position.copy(goalCamera);
          controls.target.copy(goalTarget);
          tweening = false;
        }
      }

      if (controls.enabled) {
        controls.target.x = THREE.MathUtils.clamp(controls.target.x, -6.2, 6.2);
        controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0.45, 3.4);
        controls.target.z = THREE.MathUtils.clamp(controls.target.z, -4.9, 3.0);
      }
      controls.update();
      if (!reducedMotion.matches) {
        animated.forEach((callback) => callback(elapsed, delta));
        if (marker.visible) {
          const pulse = 1 + Math.sin(elapsed * 2.4) * 0.09;
          marker.scale.setScalar(pulse);
          markerMaterial.opacity = 0.66 + Math.sin(elapsed * 2.4) * 0.15;
        }
      }
      renderer.render(scene, camera);
    });

    onReadyRef.current();

    return () => {
      handleRef.current = null;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      renderer.domElement.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
      renderer.domElement.removeEventListener(
        "pointermove",
        handlePointerMove,
      );
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener(
        "pointercancel",
        handlePointerLeave,
      );
      renderer.domElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      renderer.domElement.removeEventListener("keydown", handleKeyDown);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        handleContextLost,
      );
      controls.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          mesh.material?.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    handleRef.current?.focus(activeId);
  }, [activeId]);

  useEffect(() => {
    if (resetSignal > 0) handleRef.current?.reset();
  }, [resetSignal]);

  useEffect(() => {
    hostRef.current
      ?.querySelector("canvas")
      ?.setAttribute("aria-label", sceneLabel);
  }, [sceneLabel]);

  return <div className="room-scene" ref={hostRef} aria-hidden="false" />;
}

function SpecialtyModule({
  asset,
  locale,
}: {
  asset: PortfolioAsset;
  locale: Locale;
}) {
  if (asset.specialty === "music") {
    const bars = [
      32, 58, 76, 44, 92, 61, 38, 74, 52, 96, 67, 43, 82, 56, 36, 68, 88,
      49, 72, 41, 91, 63, 34, 79, 53, 86, 47, 69, 39, 73,
    ];
    return (
      <div
        className="special-module music-module"
        aria-label={locale === "zh" ? "声音工作台示例" : "Audio workstation example"}
      >
        <div className="module-topline">
          <span>SESSION / AFTER THE RAIN</span>
          <span>72 BPM · A MINOR</span>
        </div>
        <div className="waveform" aria-hidden="true">
          {bars.map((height, index) => (
            <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className="track-row">
          <span>01</span>
          <strong>Felt piano</strong>
          <span>REC</span>
        </div>
        <div className="track-row">
          <span>02</span>
          <strong>Field texture</strong>
          <span>–12 dB</span>
        </div>
        <div className="track-row">
          <span>03</span>
          <strong>Tape percussion</strong>
          <span>–08 dB</span>
        </div>
      </div>
    );
  }

  if (asset.specialty === "fitness") {
    const week =
      locale === "zh"
        ? [
            ["一", "力量", "78"],
            ["二", "恢复", "28"],
            ["三", "心肺", "62"],
            ["四", "休息", "12"],
            ["五", "力量", "86"],
            ["六", "户外", "54"],
            ["日", "留白", "8"],
          ]
        : [
            ["M", "Strength", "78"],
            ["T", "Recover", "28"],
            ["W", "Cardio", "62"],
            ["T", "Rest", "12"],
            ["F", "Strength", "86"],
            ["S", "Outside", "54"],
            ["S", "Open", "8"],
          ];
    return (
      <div
        className="special-module rhythm-module"
        aria-label={locale === "zh" ? "一周训练节律" : "Weekly training rhythm"}
      >
        <div className="module-topline">
          <span>TRAINING RHYTHM</span>
          <span>WEEK 06 / BUILD</span>
        </div>
        <div className="rhythm-grid">
          {week.map(([day, label, height]) => (
            <div className="rhythm-day" key={`${day}-${label}`}>
              <div className="rhythm-bar">
                <span style={{ height: `${height}%` }} />
              </div>
              <strong>{day}</strong>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (asset.specialty === "reading") {
    return (
      <div className="special-module reading-module">
        <div className="module-topline">
          <span>OPEN MARGIN / 038</span>
          <span>JUL 18</span>
        </div>
        <p>
          {locale === "zh"
            ? "“真正改变阅读的，不是记住更多句子，而是开始用不同的问题回到生活。”"
            : "“Reading changes when I stop collecting sentences and return to life with a different question.”"}
        </p>
        <div className="margin-note">
          <span>MY NOTE</span>
          <strong>
            {locale === "zh"
              ? "这句话之后，我删掉了按数量统计阅读的年度目标。"
              : "After writing this, I removed the annual reading goal that only counted books."}
          </strong>
        </div>
      </div>
    );
  }

  if (asset.specialty === "research") {
    return (
      <div
        className="special-module research-module"
        aria-label={locale === "zh" ? "研究方法路径" : "Research method path"}
      >
        <div className="module-topline">
          <span>QUESTION → EVIDENCE</span>
          <span>METHOD MAP</span>
        </div>
        <div className="research-flow">
          <span>{locale === "zh" ? "模糊观察" : "Fuzzy signal"}</span>
          <i aria-hidden="true">→</i>
          <span>{locale === "zh" ? "可证伪假设" : "Testable claim"}</span>
          <i aria-hidden="true">→</i>
          <span>{locale === "zh" ? "最小验证" : "Smallest test"}</span>
          <i aria-hidden="true">→</i>
          <span>{locale === "zh" ? "公开反思" : "Open reflection"}</span>
        </div>
      </div>
    );
  }

  if (asset.specialty === "gallery") {
    return (
      <div
        className="special-module gallery-module"
        aria-label={locale === "zh" ? "作品接触印样" : "Project contact sheet"}
      >
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div className={`gallery-frame gallery-frame-${item + 1}`} key={item}>
            <span>0{item + 1}</span>
          </div>
        ))}
      </div>
    );
  }

  if (asset.specialty === "timeline") {
    return (
      <div className="special-module timeline-module">
        <div className="timeline-point">
          <span>THEN</span>
          <strong>
            {locale === "zh" ? "记录发生了什么" : "Record what happened"}
          </strong>
        </div>
        <div className="timeline-point">
          <span>NOW</span>
          <strong>
            {locale === "zh"
              ? "说清楚它改变了什么"
              : "Name what it changed"}
          </strong>
        </div>
        <div className="timeline-point">
          <span>NEXT</span>
          <strong>
            {locale === "zh"
              ? "留下一个可以继续的问题"
              : "Leave a question open"}
          </strong>
        </div>
      </div>
    );
  }

  return (
    <div className="special-module principle-module">
      <span>01 / {locale === "zh" ? "清楚" : "CLARITY"}</span>
      <span>02 / {locale === "zh" ? "诚实" : "HONESTY"}</span>
      <span>03 / {locale === "zh" ? "留下余地" : "ROOM TO CHANGE"}</span>
    </div>
  );
}

function DetailPanel({
  asset,
  assetById,
  locale,
  onLocaleChange,
  onClose,
  onOpenRelated,
  closeButtonRef,
}: {
  asset: PortfolioAsset;
  assetById: Record<AssetId, PortfolioAsset>;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onClose: () => void;
  onOpenRelated: (id: AssetId) => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const copy = COPY[locale];
  const panelStyle = { "--accent": asset.accent } as CSSProperties;
  return (
    <section
      className="detail-layer"
      aria-label={`${asset.objectLabel}：${asset.sectionTitle}`}
    >
      <button
        className="detail-backdrop"
        type="button"
        aria-label={copy.close}
        onClick={onClose}
      />
      <article
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`detail-title-${asset.id}`}
        style={panelStyle}
      >
        <header className="detail-header">
          <div className="detail-breadcrumb">
            <span>{copy.room}</span>
            <i aria-hidden="true">/</i>
            <span>{asset.category}</span>
            <i aria-hidden="true">/</i>
            <strong>{asset.objectLabel}</strong>
          </div>
          <div className="dialog-header-actions">
            <button
              type="button"
              className="dialog-language-button"
              onClick={() => onLocaleChange(locale === "zh" ? "en" : "zh")}
              aria-label={copy.switchLanguage}
            >
              <span>{copy.currentLanguage}</span>
              <small>{copy.otherLanguage}</small>
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              className="icon-button close-button"
              onClick={onClose}
              aria-label={copy.close}
            >
              <span aria-hidden="true">×</span>
              <small>ESC</small>
            </button>
          </div>
        </header>

        <div className="detail-scroll">
          <div className="detail-hero">
            <div className="detail-index">
              <span>{asset.number}</span>
              <span>{asset.category.toUpperCase()}</span>
            </div>
            <div>
              <p className="eyebrow">{asset.objectLabel}</p>
              <h2 id={`detail-title-${asset.id}`}>{asset.sectionTitle}</h2>
              <p className="detail-trait">{asset.trait}</p>
            </div>
          </div>

          <div className="detail-status-row">
            <span>
              <i className="status-dot" aria-hidden="true" />
              {asset.status}
            </span>
            <span>{copy.updated} / {asset.lastUpdated}</span>
          </div>

          <p className="detail-intro">{asset.intro}</p>

          <div className="metric-grid">
            {asset.metrics.map((metric) => (
              <div className="metric" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>

          <SpecialtyModule asset={asset} locale={locale} />

          <div className="entry-grid">
            {asset.entries.map((entry, index) => (
              <article className="entry-card" key={entry.title}>
                <div className="entry-number">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p>{entry.eyebrow}</p>
                <h3>{entry.title}</h3>
                <div>{entry.body}</div>
                <span>{entry.meta}</span>
              </article>
            ))}
          </div>

          <blockquote>{asset.note}</blockquote>

          <footer className="detail-footer">
            <div>
              <p className="eyebrow">{copy.continueExploring}</p>
              <h3>{copy.nextObject}</h3>
            </div>
            <div className="related-links">
              {asset.related.slice(0, 2).map((id) => (
                <button type="button" key={id} onClick={() => onOpenRelated(id)}>
                  <span>{assetById[id].objectLabel}</span>
                  <small>{assetById[id].teaser}</small>
                  <i aria-hidden="true">↗</i>
                </button>
              ))}
            </div>
          </footer>
        </div>
      </article>
    </section>
  );
}

function AssetIndex({
  open,
  assets,
  categoryOrder,
  locale,
  onLocaleChange,
  onClose,
  onSelect,
}: {
  open: boolean;
  assets: PortfolioAsset[];
  categoryOrder: readonly PortfolioAsset["category"][];
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onClose: () => void;
  onSelect: (id: AssetId, source?: HTMLElement | null) => void;
}) {
  const copy = COPY[locale];
  const grouped = useMemo(
    () =>
      categoryOrder.map((category) => ({
        category,
        assets: assets.filter(
          (asset) => asset.category === category,
        ),
      })),
    [assets, categoryOrder],
  );

  if (!open) return null;

  return (
    <section
      className="index-layer"
      aria-label={locale === "zh" ? "全部内容索引" : "Complete content index"}
    >
      <button
        className="index-backdrop"
        type="button"
        aria-label={copy.closeIndex}
        onClick={onClose}
      />
      <nav
        className="asset-index"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-index-title"
      >
        <header>
          <div>
            <p className="eyebrow">{copy.indexEyebrow}</p>
            <h2 id="asset-index-title">{copy.indexTitle}</h2>
          </div>
          <div className="dialog-header-actions">
            <button
              type="button"
              className="dialog-language-button"
              onClick={() => onLocaleChange(locale === "zh" ? "en" : "zh")}
              aria-label={copy.switchLanguage}
            >
              <span>{copy.currentLanguage}</span>
              <small>{copy.otherLanguage}</small>
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onClose}
              aria-label={copy.closeIndex}
              autoFocus
            >
              <span aria-hidden="true">×</span>
              <small>ESC</small>
            </button>
          </div>
        </header>
        <p className="index-intro">{copy.indexIntro}</p>
        <div className="index-groups">
          {grouped.map(({ category, assets }) => (
            <section className="index-group" key={category}>
              <div className="index-group-title">
                <span>{category}</span>
                <small>
                  {String(assets.length).padStart(2, "0")} {copy.entries}
                </small>
              </div>
              {assets.map((asset) => (
                <button
                  type="button"
                  className="index-entry"
                  key={asset.id}
                  onClick={(event) =>
                    onSelect(asset.id, event.currentTarget)
                  }
                  aria-label={
                    locale === "zh"
                      ? `${asset.objectLabel}：打开${asset.sectionTitle}`
                      : `${asset.objectLabel}: open ${asset.sectionTitle}`
                  }
                >
                  <span className="index-entry-number">{asset.number}</span>
                  <span className="index-entry-title">
                    <strong>{asset.objectLabel}</strong>
                    <small>{asset.sectionTitle}</small>
                  </span>
                  <span className="index-entry-teaser">{asset.teaser}</span>
                  <i
                    className="index-entry-dot"
                    style={{ background: asset.accent }}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </section>
          ))}
        </div>
      </nav>
    </section>
  );
}

function HelpPanel({
  locale,
  onLocaleChange,
  onClose,
}: {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onClose: () => void;
}) {
  const copy = COPY[locale];
  return (
    <section className="help-layer" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <button
        className="index-backdrop"
        type="button"
        aria-label={copy.closeHelp}
        onClick={onClose}
      />
      <article className="help-card">
        <header>
          <div>
            <p className="eyebrow">{copy.helpEyebrow}</p>
            <h2 id="help-title">{copy.helpTitle}</h2>
          </div>
          <div className="dialog-header-actions">
            <button
              type="button"
              className="dialog-language-button"
              onClick={() => onLocaleChange(locale === "zh" ? "en" : "zh")}
              aria-label={copy.switchLanguage}
            >
              <span>{copy.currentLanguage}</span>
              <small>{copy.otherLanguage}</small>
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onClose}
              aria-label={copy.closeHelp}
              autoFocus
            >
              <span aria-hidden="true">×</span>
              <small>ESC</small>
            </button>
          </div>
        </header>
        <div className="help-grid">
          {copy.helpItems.map(([number, title, body]) => (
            <div key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          ))}
        </div>
        <p className="help-note">{copy.helpNote}</p>
      </article>
    </section>
  );
}

export default function RoomExperience() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [contentConfig, setContentConfig] =
    useState<SiteContentConfig>(EMPTY_SITE_CONTENT);
  const [publishedContent, setPublishedContent] =
    useState<SiteContentConfig>(EMPTY_SITE_CONTENT);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [studioEnabled, setStudioEnabled] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [activeId, setActiveId] = useState<AssetId | null>(null);
  const [hoveredId, setHoveredId] = useState<AssetId | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const openedFromRoomRef = useRef(false);
  const previousActiveRef = useRef<AssetId | null>(null);
  const copy = COPY[locale];
  const baseAssets =
    locale === "zh" ? PORTFOLIO_ASSETS : PORTFOLIO_ASSETS_EN;
  const profile = useMemo(
    () => mergeProfile(locale, contentConfig),
    [contentConfig, locale],
  );
  const assets = useMemo(
    () => mergeAssets(baseAssets, locale, contentConfig),
    [baseAssets, contentConfig, locale],
  );
  const assetById = useMemo(
    () =>
      Object.fromEntries(
        assets.map((asset) => [asset.id, asset]),
      ) as Record<AssetId, PortfolioAsset>,
    [assets],
  );
  const categoryOrder =
    locale === "zh" ? CATEGORY_ORDER : CATEGORY_ORDER_EN;

  const readRoute = useCallback(() => {
    const section = new URL(window.location.href).searchParams.get("section");
    return isAssetId(section) ? section : null;
  }, []);

  const readLocale = useCallback((): Locale => {
    const urlLocale = new URL(window.location.href).searchParams.get("lang");
    if (urlLocale === "en" || urlLocale === "zh") return urlLocale;
    return window.localStorage.getItem("living-index-locale") === "en"
      ? "en"
      : "zh";
  }, []);

  const changeLocale = useCallback((nextLocale: Locale) => {
    setLocale(nextLocale);
    window.localStorage.setItem("living-index-locale", nextLocale);
    const url = new URL(window.location.href);
    if (nextLocale === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    window.history.replaceState(
      { ...window.history.state, lang: nextLocale },
      "",
      url,
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      let published = EMPTY_SITE_CONTENT;

      try {
        const response = await fetch("/content/site-content.json", {
          cache: "no-store",
        });
        if (response.ok) {
          published = parseSiteContent(await response.json());
        }
      } catch {
        published = EMPTY_SITE_CONTENT;
      }

      let next = published;
      try {
        const localDraft = window.localStorage.getItem(
          "living-index.content-draft.v1",
        );
        if (localDraft) next = parseSiteContent(localDraft);
      } catch {
        window.localStorage.removeItem("living-index.content-draft.v1");
      }

      if (!cancelled) {
        setPublishedContent(published);
        setContentConfig(next);
        setContentLoaded(true);
      }
    };

    void loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!contentLoaded) return;
    window.localStorage.setItem(
      "living-index.content-draft.v1",
      JSON.stringify(contentConfig),
    );
  }, [contentConfig, contentLoaded]);

  const updateRoute = useCallback((id: AssetId | null, mode: "push" | "replace") => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("section", id);
    else url.searchParams.delete("section");
    window.history[mode === "push" ? "pushState" : "replaceState"](
      { section: id },
      "",
      url,
    );
  }, []);

  const openStudio = useCallback(() => {
    setEntered(true);
    setIndexOpen(false);
    setHelpOpen(false);
    setActiveId(null);
    updateRoute(null, "replace");
    setStudioOpen(true);
  }, [updateRoute]);

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    if (params.get("studio") !== "1") return;
    const frame = window.requestAnimationFrame(() => {
      setStudioEnabled(true);
      openStudio();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [openStudio]);

  const openAsset = useCallback(
    (id: AssetId, source?: HTMLElement | null) => {
      previousFocusRef.current =
        source ?? (document.activeElement as HTMLElement | null);
      openedFromRoomRef.current = readRoute() !== id;
      if (readRoute() !== id) updateRoute(id, "push");
      setEntered(true);
      setIndexOpen(false);
      setHelpOpen(false);
      setActiveId(id);
    },
    [readRoute, updateRoute],
  );

  const closeAsset = useCallback(() => {
    if (!activeId) return;
    if (openedFromRoomRef.current && window.history.length > 1) {
      window.history.back();
    } else {
      updateRoute(null, "replace");
      setActiveId(null);
    }
  }, [activeId, updateRoute]);

  useEffect(() => {
    const handlePopState = () => {
      const next = readRoute();
      setLocale(readLocale());
      openedFromRoomRef.current = false;
      setActiveId(next);
      if (next) setEntered(true);
    };
    const initialFrame = window.requestAnimationFrame(handlePopState);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [readLocale, readRoute]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title =
      locale === "zh"
        ? `${profile.displayName} · 一间会回应你的房间`
        : `${profile.displayName} · The Living Index`;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      "content",
      locale === "zh"
        ? "一个可以自由探索的三维个人主页：从房间里的物品进入音乐、健身、阅读、研究、创作与生活。"
        : "An explorable 3D personal homepage where objects open into music, fitness, reading, research, making, and everyday life.",
    );
  }, [locale, profile.displayName]);

  useEffect(() => {
    if (activeId && previousActiveRef.current !== activeId) {
      window.setTimeout(() => closeButtonRef.current?.focus(), 40);
    }
    if (!activeId && previousActiveRef.current) {
      window.setTimeout(() => previousFocusRef.current?.focus(), 40);
    }
    previousActiveRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (studioOpen) setStudioOpen(false);
      else if (activeId) closeAsset();
      else if (indexOpen) setIndexOpen(false);
      else if (helpOpen) setHelpOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeId, closeAsset, helpOpen, indexOpen, studioOpen]);

  const handleSceneKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && hoveredId) openAsset(hoveredId);
  };

  const hoveredAsset = hoveredId ? assetById[hoveredId] : null;
  const activeAsset = activeId ? assetById[activeId] : null;

  return (
    <main
      className={`portfolio-shell ${entered ? "is-entered" : "is-intro"}`}
      onKeyDown={handleSceneKey}
    >
      <a
        className="skip-link"
        href="#content-index-trigger"
        onClick={(event) => {
          event.preventDefault();
          setEntered(true);
          setIndexOpen(true);
        }}
      >
        {copy.skip}
      </a>

      <RoomScene
        activeId={activeId}
        resetSignal={resetSignal}
        sceneLabel={copy.sceneLabel}
        onSelect={(id) => openAsset(id)}
        onHover={setHoveredId}
        onReady={() => setReady(true)}
        onError={() => setWebglFailed(true)}
      />

      <div className="room-atmosphere" aria-hidden="true" />

      {!entered && (
        <section className="intro-screen" aria-labelledby="intro-title">
          <div className="intro-gridline" aria-hidden="true" />
          <header className="intro-topbar">
            <div className="wordmark">
              <span>{profile.logoInitial}</span>
              <div>
                <strong>{profile.displayName}</strong>
                <small>{profile.personalSpace}</small>
              </div>
            </div>
            <div className="intro-tools">
              {studioEnabled && (
                <button
                  type="button"
                  className="language-toggle studio-launch-button"
                  onClick={openStudio}
                  aria-label={
                    locale === "zh"
                      ? "打开内容工作台"
                      : "Open Content Studio"
                  }
                >
                  <span>{locale === "zh" ? "编辑" : "EDIT"}</span>
                  <strong>✦</strong>
                </button>
              )}
              <button
                type="button"
                className="language-toggle"
                onClick={() => changeLocale(locale === "zh" ? "en" : "zh")}
                aria-label={copy.switchLanguage}
              >
                <span>{copy.currentLanguage}</span>
                <i aria-hidden="true">/</i>
                <strong>{copy.otherLanguage}</strong>
              </button>
              <div className="intro-status">
                <i className={ready ? "is-ready" : ""} aria-hidden="true" />
                <span>
                  {webglFailed
                    ? copy.fallbackStatus
                    : ready
                      ? copy.readyStatus
                      : copy.wakingStatus}
                </span>
              </div>
            </div>
          </header>

          <div className="intro-copy">
            <p className="eyebrow">{profile.introEyebrow}</p>
            <h1 id="intro-title">
              {profile.introTitle}
              <br />
              <em>{profile.introTitleEm}</em>
            </h1>
            <p className="intro-description">
              {webglFailed
                ? copy.fallbackDescription
                : profile.introDescription}
            </p>
            <div className="intro-actions">
              {!webglFailed && (
                <button
                  type="button"
                  className="primary-button"
                  disabled={!ready}
                  onClick={() => {
                    setEntered(true);
                    window.setTimeout(() => setHelpOpen(true), 500);
                  }}
                >
                  <span>{ready ? copy.start : copy.lighting}</span>
                  <i aria-hidden="true">↗</i>
                </button>
              )}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setEntered(true);
                  setIndexOpen(true);
                }}
              >
                <span>{webglFailed ? copy.enterLite : copy.openIndex}</span>
                <i aria-hidden="true">12 ENTRIES</i>
              </button>
            </div>
          </div>

          <footer className="intro-footer">
            <div>
              <span>{copy.drag}</span>
              <p>{copy.dragDescription}</p>
            </div>
            <div>
              <span>{copy.scroll}</span>
              <p>{copy.scrollDescription}</p>
            </div>
            <div>
              <span>{copy.select}</span>
              <p>{copy.selectDescription}</p>
            </div>
            <blockquote>{profile.quote}</blockquote>
          </footer>
        </section>
      )}

      {entered && (
        <>
          <header className="room-hud">
            <button
              type="button"
              className="room-logo"
              onClick={() => {
                setResetSignal((value) => value + 1);
                updateRoute(null, "replace");
                setActiveId(null);
              }}
              aria-label={
                locale === "zh"
                  ? "回到房间初始视角"
                  : "Return to the room’s opening view"
              }
            >
              <span>{profile.logoInitial}</span>
              <div>
                <strong>{profile.displayName}</strong>
                <small>{copy.livingIndex}</small>
              </div>
            </button>
            <div className="hud-actions">
              <button
                id="content-index-trigger"
                type="button"
                onClick={() => {
                  setHelpOpen(false);
                  setIndexOpen(true);
                }}
              >
                <span>{copy.index}</span>
                <small>12</small>
              </button>
              <button
                type="button"
                onClick={() => setResetSignal((value) => value + 1)}
                disabled={Boolean(activeId)}
              >
                <span>{copy.reset}</span>
                <small>R</small>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIndexOpen(false);
                  setHelpOpen(true);
                }}
              >
                <span>{copy.controls}</span>
                <small>?</small>
              </button>
              <button
                type="button"
                className="hud-language-button"
                onClick={() => changeLocale(locale === "zh" ? "en" : "zh")}
                aria-label={copy.switchLanguage}
              >
                <span>{copy.currentLanguage}</span>
                <small>{copy.otherLanguage}</small>
              </button>
              {studioEnabled && (
                <button
                  type="button"
                  className="hud-language-button studio-launch-button"
                  onClick={openStudio}
                  aria-label={
                    locale === "zh"
                      ? "打开内容工作台"
                      : "Open Content Studio"
                  }
                >
                  <span>{locale === "zh" ? "编辑" : "Edit"}</span>
                  <small>✦</small>
                </button>
              )}
            </div>
          </header>

          <div className="room-meta" aria-hidden="true">
            <span>ROOM 00</span>
            <i />
            <span>
              {profile.city.toUpperCase()} · {profile.timezone}
            </span>
          </div>

          <div
            className={`hover-label ${hoveredAsset ? "is-visible" : ""}`}
            aria-live="polite"
          >
            {hoveredAsset && (
              <>
                <span>{hoveredAsset.number}</span>
                <div>
                  <strong>
                    {hoveredAsset.objectLabel} · {hoveredAsset.sectionTitle}
                  </strong>
                  <small>{copy.hoverEnter}</small>
                </div>
              </>
            )}
          </div>

          <div className="room-instruction">
            <span className="mouse-symbol" aria-hidden="true">
              <i />
            </span>
            <p>{copy.roomInstruction}</p>
          </div>
        </>
      )}

      <AssetIndex
        open={indexOpen}
        assets={assets}
        categoryOrder={categoryOrder}
        locale={locale}
        onLocaleChange={changeLocale}
        onClose={() => setIndexOpen(false)}
        onSelect={openAsset}
      />
      {helpOpen && (
        <HelpPanel
          locale={locale}
          onLocaleChange={changeLocale}
          onClose={() => setHelpOpen(false)}
        />
      )}
      {activeAsset && (
        <DetailPanel
          asset={activeAsset}
          assetById={assetById}
          locale={locale}
          onLocaleChange={changeLocale}
          onClose={closeAsset}
          onOpenRelated={(id) => openAsset(id)}
          closeButtonRef={closeButtonRef}
        />
      )}
      <ContentStudio
        open={studioOpen}
        locale={locale}
        config={contentConfig}
        profile={profile}
        assets={assets}
        onChange={setContentConfig}
        onLocaleChange={changeLocale}
        onClose={() => setStudioOpen(false)}
        onReset={() => {
          window.localStorage.removeItem("living-index.content-draft.v1");
          setContentConfig(publishedContent);
        }}
        onProjectSaved={(savedConfig) => {
          setPublishedContent(savedConfig);
        }}
      />

      <noscript>
        <section className="noscript-index">
          <h1>你的名字 · 综合个人主页 / Your Name · Personal Home</h1>
          <p>
            JavaScript 未启用。下面仍然保留全部章节入口。
            JavaScript is disabled; every chapter is still listed below.
          </p>
          <ul>
            {PORTFOLIO_ASSETS.map((asset) => (
              <li key={asset.id}>
                <strong>{asset.objectLabel}</strong> — {asset.trait}
              </li>
            ))}
          </ul>
        </section>
      </noscript>
    </main>
  );
}
