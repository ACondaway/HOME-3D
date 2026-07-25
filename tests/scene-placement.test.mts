import assert from "node:assert/strict";
import test from "node:test";

const {
  beginScenePlacementEdit,
  commitScenePlacementEdit,
  constrainScenePlacementPosition,
} = (await import(
  new URL("../app/scene-placement.ts", import.meta.url).href
)) as typeof import("../app/scene-placement");
import type { SiteContentConfig } from "../app/content-config";

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

test("starts placement drafts from relative core and absolute custom positions", () => {
  const coreDraft = beginScenePlacementEdit(baseConfig, "music");
  assert.deepEqual(coreDraft, {
    assetId: "music",
    position: [1, 2, 3],
  });
  assert.deepEqual(beginScenePlacementEdit(baseConfig, "reading"), {
    assetId: "reading",
    position: [0, 0, 0],
  });
  assert.deepEqual(beginScenePlacementEdit(baseConfig, "custom-decoration"), {
    assetId: "custom-decoration",
    position: [4, 0.5, -2],
  });
  assert.equal(beginScenePlacementEdit(baseConfig, "missing"), null);

  if (!coreDraft) assert.fail("expected a core placement draft");
  coreDraft.position[0] = 99;
  assert.deepEqual(baseConfig.scene?.placements?.music?.position, [1, 2, 3]);
});

test("commits a core position without replacing rotation, scale, or siblings", () => {
  const next = commitScenePlacementEdit(baseConfig, {
    assetId: "music",
    position: [5.126, 2, -3.333],
  });

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
  const decorative = commitScenePlacementEdit(baseConfig, {
    assetId: "custom-decoration",
    position: [8, 0.5, 9],
  });
  const interactive = commitScenePlacementEdit(decorative, {
    assetId: "custom-interactive",
    position: [7, 0, -6],
  });

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
      position: [1, 2, 3],
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
    commitScenePlacementEdit(preciseConfig, {
      assetId: "reading",
      position: [1.234, 2, 3],
    }),
    preciseConfig,
  );
  assert.equal(
    commitScenePlacementEdit(preciseConfig, {
      assetId: "custom-decoration",
      position: [4.567, 0.5, -2],
    }),
    preciseConfig,
  );
  assert.equal(
    commitScenePlacementEdit(baseConfig, {
      assetId: "music",
      position: [1, 2, 3],
    }),
    baseConfig,
  );
  assert.equal(
    commitScenePlacementEdit(baseConfig, {
      assetId: "custom-decoration",
      position: [4, 0.5, -2],
    }),
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
});

test("uses the saved position as the fallback for invalid commit values", () => {
  const next = commitScenePlacementEdit(baseConfig, {
    assetId: "custom-decoration",
    position: [Number.NaN, 1.25, Number.NEGATIVE_INFINITY],
  });

  assert.deepEqual(
    next.scene?.customAssets?.[0]?.transform.position,
    [4, 1.25, -2],
  );
});
