import assert from "node:assert/strict";
import test from "node:test";

const {
  beginScenePlacementEdit,
  commitScenePlacementEdit,
  constrainScenePlacementPosition,
  constrainScenePlacementRotation,
} = (await import(
  new URL("../app/scene-placement.ts", import.meta.url).href
)) as typeof import("../app/scene-placement");
import type { SiteContentConfig } from "../app/content-config";
import type { ScenePlacementEdit } from "../app/scene-placement";

const baseConfig: SiteContentConfig = {
  version: 1,
  profile: {},
  assets: {},
  scene: {
    placements: {
      music: {
        position: [1, 2, 3],
        rotation: [0, 45, 0],
        scale: [1.2, 1.2, 1.2],
      },
    },
    customAssets: [
      {
        id: "custom-decoration",
        behavior: "decorative",
        accent: "#ffcc88",
        transform: {
          position: [4, 0.5, -2],
          rotation: [0, 90, 0],
          scale: [2, 2, 2],
        },
        content: {},
      },
      {
        id: "custom-interactive",
        behavior: "interactive",
        accent: "#88ccff",
        transform: {
          position: [-1, 0, 2],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        content: {},
      },
    ],
  },
};

function editAsset(
  assetId: string,
  patch: Partial<ScenePlacementEdit> = {},
  config = baseConfig,
): ScenePlacementEdit {
  const edit = beginScenePlacementEdit(config, assetId);
  if (!edit) assert.fail(`expected a placement draft for ${assetId}`);
  return {
    ...edit,
    ...patch,
    position: patch.position ? [...patch.position] : [...edit.position],
    rotation: patch.rotation ? [...patch.rotation] : [...edit.rotation],
  };
}

test("starts placement drafts from relative core and absolute custom positions", () => {
  const coreDraft = beginScenePlacementEdit(baseConfig, "music");
  assert.deepEqual(coreDraft, {
    assetId: "music",
    mode: "plane",
    initialPosition: [1, 2, 3],
    initialRotation: [0, 45, 0],
    position: [1, 2, 3],
    rotation: [0, 45, 0],
  });
  assert.deepEqual(beginScenePlacementEdit(baseConfig, "reading"), {
    assetId: "reading",
    mode: "plane",
    initialPosition: [0, 0, 0],
    initialRotation: [0, 0, 0],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  });
  assert.deepEqual(beginScenePlacementEdit(baseConfig, "custom-decoration"), {
    assetId: "custom-decoration",
    mode: "plane",
    initialPosition: [4, 0.5, -2],
    initialRotation: [0, 90, 0],
    position: [4, 0.5, -2],
    rotation: [0, 90, 0],
  });
  assert.equal(beginScenePlacementEdit(baseConfig, "missing"), null);

  if (!coreDraft) assert.fail("expected a core placement draft");
  coreDraft.position[0] = 99;
  coreDraft.rotation[1] = 99;
  assert.deepEqual(baseConfig.scene?.placements?.music?.position, [1, 2, 3]);
  assert.deepEqual(baseConfig.scene?.placements?.music?.rotation, [0, 45, 0]);
});

test("commits a core position without replacing rotation, scale, or siblings", () => {
  const next = commitScenePlacementEdit(
    baseConfig,
    editAsset("music", {
      position: [5.126, 2, -3.333],
    }),
  );

  assert.notEqual(next, baseConfig);
  assert.deepEqual(next.scene?.placements?.music, {
    position: [5.13, 2, -3.33],
    rotation: [0, 45, 0],
    scale: [1.2, 1.2, 1.2],
  });
  assert.equal(
    next.scene?.customAssets?.[0],
    baseConfig.scene?.customAssets?.[0],
  );
});

test("commits decorative and interactive custom assets in place", () => {
  const decorative = commitScenePlacementEdit(
    baseConfig,
    editAsset("custom-decoration", {
      position: [8, 0.5, 9],
    }),
  );
  const interactive = commitScenePlacementEdit(
    decorative,
    editAsset(
      "custom-interactive",
      {
        position: [7, 0, -6],
      },
      decorative,
    ),
  );

  assert.deepEqual(
    interactive.scene?.customAssets?.map((asset) => ({
      id: asset.id,
      position: asset.transform.position,
      rotation: asset.transform.rotation,
    })),
    [
      {
        id: "custom-decoration",
        position: [8, 0.5, 9],
        rotation: [0, 90, 0],
      },
      {
        id: "custom-interactive",
        position: [7, 0, -6],
        rotation: [0, 0, 0],
      },
    ],
  );
});

test("keeps unknown and unchanged commits as reference-stable no-ops", () => {
  assert.equal(
    commitScenePlacementEdit(baseConfig, {
      assetId: "unknown",
      mode: "rotation",
      initialPosition: [1, 2, 3],
      initialRotation: [0, 0, 0],
      position: [1, 2, 3],
      rotation: [0, 90, 0],
    }),
    baseConfig,
  );

  const preciseConfig: SiteContentConfig = {
    ...baseConfig,
    scene: {
      ...baseConfig.scene,
      placements: {
        ...baseConfig.scene?.placements,
        reading: { position: [1.234, 2, 3] },
      },
      customAssets: baseConfig.scene?.customAssets?.map((asset) =>
        asset.id === "custom-decoration"
          ? {
              ...asset,
              transform: {
                ...asset.transform,
                position: [4.567, 0.5, -2],
              },
            }
          : asset,
      ),
    },
  };
  assert.equal(
    commitScenePlacementEdit(
      preciseConfig,
      editAsset("reading", {}, preciseConfig),
    ),
    preciseConfig,
  );
  assert.equal(
    commitScenePlacementEdit(
      preciseConfig,
      editAsset("custom-decoration", {}, preciseConfig),
    ),
    preciseConfig,
  );
  assert.equal(
    commitScenePlacementEdit(baseConfig, editAsset("music")),
    baseConfig,
  );
  assert.equal(
    commitScenePlacementEdit(baseConfig, editAsset("custom-decoration")),
    baseConfig,
  );
  assert.equal(
    commitScenePlacementEdit(
      baseConfig,
      editAsset("music", { mode: "height" }),
    ),
    baseConfig,
  );
});

test("constrains drag coordinates and never shares the input tuple", () => {
  const candidate: [number, number, number] = [
    Number.POSITIVE_INFINITY,
    -75.129,
    51.777,
  ];
  const result = constrainScenePlacementPosition(candidate, [1.239, 2, 3]);

  assert.deepEqual(result, [1.24, -50, 50]);
  assert.notEqual(result, candidate);
  assert.deepEqual(
    constrainScenePlacementPosition(
      [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
      [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
    ),
    [0, 0, 0],
  );
  assert.deepEqual(
    constrainScenePlacementRotation(
      [Number.NaN, 420.26, Number.NEGATIVE_INFINITY],
      [12.34, 0, -7.89],
    ),
    [12.3, 360, -7.9],
  );
});

test("uses the saved position as the fallback for invalid commit values", () => {
  const next = commitScenePlacementEdit(
    baseConfig,
    editAsset("custom-decoration", {
      position: [Number.NaN, 1.25, Number.NEGATIVE_INFINITY],
    }),
  );

  assert.deepEqual(
    next.scene?.customAssets?.[0]?.transform.position,
    [4, 1.25, -2],
  );
});

test("commits heading rotation while preserving pitch, roll, scale, and position", () => {
  const core = commitScenePlacementEdit(
    baseConfig,
    editAsset("music", {
      mode: "rotation",
      rotation: [0, 72.26, 0],
    }),
  );
  assert.deepEqual(core.scene?.placements?.music, {
    position: [1, 2, 3],
    rotation: [0, 72.3, 0],
    scale: [1.2, 1.2, 1.2],
  });

  const custom = commitScenePlacementEdit(
    baseConfig,
    editAsset("custom-decoration", {
      mode: "rotation",
      rotation: [0, 135.55, 0],
    }),
  );
  assert.deepEqual(custom.scene?.customAssets?.[0]?.transform, {
    position: [4, 0.5, -2],
    rotation: [0, 135.6, 0],
    scale: [2, 2, 2],
  });

  const newCoreRotation = commitScenePlacementEdit(
    baseConfig,
    editAsset("reading", {
      mode: "rotation",
      rotation: [0, 30, 0],
    }),
  );
  assert.deepEqual(newCoreRotation.scene?.placements?.reading, {
    rotation: [0, 30, 0],
  });
});

test("merges only edited axes into a concurrently updated transform", () => {
  const draft = editAsset("custom-decoration", {
    mode: "rotation",
    rotation: [0, 120, 0],
  });
  const concurrentConfig: SiteContentConfig = {
    ...baseConfig,
    scene: {
      ...baseConfig.scene,
      customAssets: baseConfig.scene?.customAssets?.map((asset) =>
        asset.id === "custom-decoration"
          ? {
              ...asset,
              transform: {
                ...asset.transform,
                position: [8, 3, -6],
                rotation: [18, asset.transform.rotation[1], -12],
              },
            }
          : asset,
      ),
    },
  };

  const next = commitScenePlacementEdit(concurrentConfig, draft);
  assert.deepEqual(next.scene?.customAssets?.[0]?.transform, {
    position: [8, 3, -6],
    rotation: [18, 120, -12],
    scale: [2, 2, 2],
  });
});

test("accumulates drag modes and merges only edited core axes on confirm", () => {
  const draft = editAsset("music", {
    mode: "rotation",
    position: [1, 6.257, 3],
    rotation: [0, 120.26, 0],
  });
  const siblingPlacement = {
    position: [-2, 0, 4] as [number, number, number],
  };
  const concurrentConfig: SiteContentConfig = {
    ...baseConfig,
    scene: {
      ...baseConfig.scene,
      placements: {
        ...baseConfig.scene?.placements,
        music: {
          position: [11, 2, -9],
          rotation: [18, 45, -12],
          scale: [1.8, 1.8, 1.8],
        },
        reading: siblingPlacement,
      },
    },
  };

  const next = commitScenePlacementEdit(concurrentConfig, draft);
  assert.deepEqual(next.scene?.placements?.music, {
    position: [11, 6.26, -9],
    rotation: [18, 120.3, -12],
    scale: [1.8, 1.8, 1.8],
  });
  assert.equal(next.scene?.placements?.reading, siblingPlacement);
});

test("height edits merge only Y into a concurrently moved position", () => {
  const draft = editAsset("custom-decoration", {
    mode: "height",
    position: [4, 6.25, -2],
  });
  const concurrentConfig: SiteContentConfig = {
    ...baseConfig,
    scene: {
      ...baseConfig.scene,
      customAssets: baseConfig.scene?.customAssets?.map((asset) =>
        asset.id === "custom-decoration"
          ? {
              ...asset,
              transform: {
                ...asset.transform,
                position: [11, asset.transform.position[1], -9],
              },
            }
          : asset,
      ),
    },
  };

  const next = commitScenePlacementEdit(concurrentConfig, draft);
  assert.deepEqual(
    next.scene?.customAssets?.[0]?.transform.position,
    [11, 6.25, -9],
  );
});
