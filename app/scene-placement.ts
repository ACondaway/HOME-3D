import {
  DEFAULT_SCENE_TRANSFORM,
  SCENE_TRANSFORM_LIMITS,
  type SceneVector3,
  type SiteContentConfig,
} from "./content-config.ts";
import { isAssetId } from "./portfolio-data.ts";

export interface ScenePlacementEdit {
  assetId: string;
  mode: ScenePlacementMode;
  initialPosition: SceneVector3;
  initialRotation: SceneVector3;
  position: SceneVector3;
  rotation: SceneVector3;
}

export type ScenePlacementMode = "plane" | "height" | "rotation";

const POSITION_PRECISION = 100;
const ROTATION_PRECISION = 10;

function cloneVector(vector: SceneVector3): SceneVector3 {
  return [vector[0], vector[1], vector[2]];
}

function vectorsEqual(
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

function changedAxes(
  initial: SceneVector3,
  draft: SceneVector3,
): [boolean, boolean, boolean] {
  return [
    initial[0] !== draft[0],
    initial[1] !== draft[1],
    initial[2] !== draft[2],
  ];
}

function mergeChangedAxes(
  current: SceneVector3,
  candidate: SceneVector3,
  changes: readonly [boolean, boolean, boolean],
): SceneVector3 {
  return [
    changes[0] ? candidate[0] : current[0],
    changes[1] ? candidate[1] : current[1],
    changes[2] ? candidate[2] : current[2],
  ];
}

function normalizeCoordinate(
  value: number,
  fallback: number,
  min: number,
  max: number,
  precision: number,
): number {
  const safeFallback = Number.isFinite(fallback) ? fallback : 0;
  const finiteValue = Number.isFinite(value) ? value : safeFallback;
  const clamped = Math.min(max, Math.max(min, finiteValue));
  const rounded = Math.round(clamped * precision) / precision;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function constrainScenePlacementPosition(
  candidate: SceneVector3,
  fallback: SceneVector3,
): SceneVector3 {
  const limits = SCENE_TRANSFORM_LIMITS.position;
  return [
    normalizeCoordinate(
      candidate[0],
      fallback[0],
      limits.min,
      limits.max,
      POSITION_PRECISION,
    ),
    normalizeCoordinate(
      candidate[1],
      fallback[1],
      limits.min,
      limits.max,
      POSITION_PRECISION,
    ),
    normalizeCoordinate(
      candidate[2],
      fallback[2],
      limits.min,
      limits.max,
      POSITION_PRECISION,
    ),
  ];
}

export function constrainScenePlacementRotation(
  candidate: SceneVector3,
  fallback: SceneVector3,
): SceneVector3 {
  const limits = SCENE_TRANSFORM_LIMITS.rotation;
  return [
    normalizeCoordinate(
      candidate[0],
      fallback[0],
      limits.min,
      limits.max,
      ROTATION_PRECISION,
    ),
    normalizeCoordinate(
      candidate[1],
      fallback[1],
      limits.min,
      limits.max,
      ROTATION_PRECISION,
    ),
    normalizeCoordinate(
      candidate[2],
      fallback[2],
      limits.min,
      limits.max,
      ROTATION_PRECISION,
    ),
  ];
}

export function beginScenePlacementEdit(
  config: SiteContentConfig,
  assetId: string,
): ScenePlacementEdit | null {
  if (isAssetId(assetId)) {
    const position =
      config.scene?.placements?.[assetId]?.position ??
      DEFAULT_SCENE_TRANSFORM.position;
    const rotation =
      config.scene?.placements?.[assetId]?.rotation ??
      DEFAULT_SCENE_TRANSFORM.rotation;
    return {
      assetId,
      mode: "plane",
      initialPosition: cloneVector(position),
      initialRotation: cloneVector(rotation),
      position: cloneVector(position),
      rotation: cloneVector(rotation),
    };
  }

  const customAsset = config.scene?.customAssets?.find(
    (asset) => asset.id === assetId,
  );
  if (!customAsset) return null;

  return {
    assetId,
    mode: "plane",
    initialPosition: cloneVector(customAsset.transform.position),
    initialRotation: cloneVector(customAsset.transform.rotation),
    position: cloneVector(customAsset.transform.position),
    rotation: cloneVector(customAsset.transform.rotation),
  };
}

export function commitScenePlacementEdit(
  config: SiteContentConfig,
  edit: ScenePlacementEdit,
): SiteContentConfig {
  const positionAxes = changedAxes(edit.initialPosition, edit.position);
  const rotationAxes = changedAxes(edit.initialRotation, edit.rotation);
  if (
    !positionAxes.some(Boolean) &&
    !rotationAxes.some(Boolean)
  ) {
    return config;
  }

  if (isAssetId(edit.assetId)) {
    const currentPlacement = config.scene?.placements?.[edit.assetId];
    const currentPosition =
      currentPlacement?.position ?? DEFAULT_SCENE_TRANSFORM.position;
    const currentRotation =
      currentPlacement?.rotation ?? DEFAULT_SCENE_TRANSFORM.rotation;
    const position = mergeChangedAxes(
      currentPosition,
      constrainScenePlacementPosition(edit.position, currentPosition),
      positionAxes,
    );
    const rotation = mergeChangedAxes(
      currentRotation,
      constrainScenePlacementRotation(edit.rotation, currentRotation),
      rotationAxes,
    );
    const positionChanged = !vectorsEqual(currentPosition, position);
    const rotationChanged = !vectorsEqual(currentRotation, rotation);
    if (!positionChanged && !rotationChanged) return config;

    return {
      ...config,
      scene: {
        ...config.scene,
        placements: {
          ...config.scene?.placements,
          [edit.assetId]: {
            ...currentPlacement,
            ...(positionChanged
              ? { position: cloneVector(position) }
              : {}),
            ...(rotationChanged
              ? { rotation: cloneVector(rotation) }
              : {}),
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
  const position = mergeChangedAxes(
    currentAsset.transform.position,
    constrainScenePlacementPosition(
      edit.position,
      currentAsset.transform.position,
    ),
    positionAxes,
  );
  const rotation = mergeChangedAxes(
    currentAsset.transform.rotation,
    constrainScenePlacementRotation(
      edit.rotation,
      currentAsset.transform.rotation,
    ),
    rotationAxes,
  );
  const positionChanged = !vectorsEqual(
    currentAsset.transform.position,
    position,
  );
  const rotationChanged = !vectorsEqual(
    currentAsset.transform.rotation,
    rotation,
  );
  if (!positionChanged && !rotationChanged) return config;

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
                ...(positionChanged
                  ? { position: cloneVector(position) }
                  : {}),
                ...(rotationChanged
                  ? { rotation: cloneVector(rotation) }
                  : {}),
              },
            }
          : asset,
      ),
    },
  };
}
