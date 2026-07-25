import {
  DEFAULT_SCENE_TRANSFORM,
  SCENE_TRANSFORM_LIMITS,
  type SceneVector3,
  type SiteContentConfig,
} from "./content-config.ts";
import { isAssetId } from "./portfolio-data.ts";

export interface ScenePlacementEdit {
  assetId: string;
  position: SceneVector3;
}

const POSITION_PRECISION = 100;

function clonePosition(position: SceneVector3): SceneVector3 {
  return [position[0], position[1], position[2]];
}

function positionsEqual(
  left: SceneVector3 | undefined,
  right: SceneVector3,
): boolean {
  return Boolean(
    left &&
      left[0] === right[0] &&
      left[1] === right[1] &&
      left[2] === right[2],
  );
}

function normalizeCoordinate(value: number, fallback: number): number {
  const safeFallback = Number.isFinite(fallback) ? fallback : 0;
  const finiteValue = Number.isFinite(value) ? value : safeFallback;
  const clamped = Math.min(
    SCENE_TRANSFORM_LIMITS.position.max,
    Math.max(SCENE_TRANSFORM_LIMITS.position.min, finiteValue),
  );
  const rounded = Math.round(clamped * POSITION_PRECISION) / POSITION_PRECISION;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function constrainScenePlacementPosition(
  candidate: SceneVector3,
  fallback: SceneVector3,
): SceneVector3 {
  return [
    normalizeCoordinate(candidate[0], fallback[0]),
    normalizeCoordinate(candidate[1], fallback[1]),
    normalizeCoordinate(candidate[2], fallback[2]),
  ];
}

export function beginScenePlacementEdit(
  config: SiteContentConfig,
  assetId: string,
): ScenePlacementEdit | null {
  if (isAssetId(assetId)) {
    return {
      assetId,
      position: clonePosition(
        config.scene?.placements?.[assetId]?.position ??
          DEFAULT_SCENE_TRANSFORM.position,
      ),
    };
  }

  const customAsset = config.scene?.customAssets?.find(
    (asset) => asset.id === assetId,
  );
  if (!customAsset) return null;

  return {
    assetId,
    position: clonePosition(customAsset.transform.position),
  };
}

export function commitScenePlacementEdit(
  config: SiteContentConfig,
  edit: ScenePlacementEdit,
): SiteContentConfig {
  if (isAssetId(edit.assetId)) {
    const currentPlacement = config.scene?.placements?.[edit.assetId];
    if (
      positionsEqual(currentPlacement?.position, edit.position) ||
      (!currentPlacement?.position &&
        positionsEqual(DEFAULT_SCENE_TRANSFORM.position, edit.position))
    ) {
      return config;
    }
    const position = constrainScenePlacementPosition(
      edit.position,
      currentPlacement?.position ?? DEFAULT_SCENE_TRANSFORM.position,
    );
    if (
      positionsEqual(currentPlacement?.position, position) ||
      (!currentPlacement?.position &&
        positionsEqual(DEFAULT_SCENE_TRANSFORM.position, position))
    ) {
      return config;
    }

    return {
      ...config,
      scene: {
        ...config.scene,
        placements: {
          ...config.scene?.placements,
          [edit.assetId]: {
            ...currentPlacement,
            position: clonePosition(position),
          },
        },
      },
    };
  }

  const customAssets = config.scene?.customAssets;
  const assetIndex = customAssets?.findIndex(
    (asset) => asset.id === edit.assetId,
  );
  if (!customAssets || assetIndex === undefined || assetIndex < 0) {
    return config;
  }

  const currentAsset = customAssets[assetIndex];
  if (positionsEqual(currentAsset.transform.position, edit.position)) {
    return config;
  }
  const position = constrainScenePlacementPosition(
    edit.position,
    currentAsset.transform.position,
  );
  if (positionsEqual(currentAsset.transform.position, position)) {
    return config;
  }

  return {
    ...config,
    scene: {
      ...config.scene,
      customAssets: customAssets.map((asset, index) =>
        index === assetIndex
          ? {
              ...asset,
              transform: {
                ...asset.transform,
                position: clonePosition(position),
              },
            }
          : asset,
      ),
    },
  };
}
