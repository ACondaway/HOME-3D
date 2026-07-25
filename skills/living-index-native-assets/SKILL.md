---
name: living-index-native-assets
description: Generate lightweight procedural Three.js assets directly in The Living Index instead of importing GLB files. Use when Codex needs to create simple furniture, props, signs, containers, plants, lights, repeated geometric decorations, or subtle native animations that should match the room, respond to scene lighting, and avoid an external 3D asset pipeline.
---

# Living Index Native Assets

Create simple room objects from the project’s existing Three.js primitives and
materials. Keep complex, organic, UV-dependent, or branded models in GLB.

## Start

1. Inspect `git status --short` and preserve unrelated work.
2. Read `references/native-asset-system.md`.
3. Read `../living-index-scene/references/scene-system.md` when the asset also
   changes placement, interaction, lighting, or persisted scene configuration.
4. Inspect the neighboring factory in `app/RoomExperience.tsx` before choosing
   dimensions, palette, hitboxes, signals, or animation.

## Choose native code or GLB

Use native code when the object:

- can be recognized from a small composition of boxes, cylinders, spheres,
  cones, planes, or curves;
- uses simple PBR colors without custom UV artwork;
- benefits from instant loading, small source changes, and scene lighting;
- needs only subtle transform or material animation.

Use GLB when the object needs sculpted or organic topology, authored UVs,
multiple detailed texture sets, skeletal animation, or faithful product
geometry. Do not reproduce a complex model with hundreds of code primitives.

## Build the asset

1. Create one root `THREE.Group`; place and rotate children relative to it.
2. Prefer `addBox`, `addCylinder`, `addSphere`, and `standardMaterial`.
3. Use `MeshStandardMaterial` for surfaces that should respond to day/night
   lighting. Reserve `MeshBasicMaterial` or strong emissive values for screens,
   bulbs, markers, and intentional self-illumination.
4. Enable shadows only where they affect the composition.
5. Reuse geometry or material for repeated parts; use `InstancedMesh` for
   larger repeated sets.
6. Keep animation delta-based and register it in `animated`; never add a second
   render loop.
7. Add the factory to `createSceneAssets` and keep ownership beneath the scene
   root so the existing disposal path releases GPU resources.

## Preserve behavior

- Pure decoration: do not add a hitbox, signal, route, index entry, or content
  page.
- Companion decoration attached to an existing built-in object: add it beneath
  that object's root group so placement, rotation, and scale overrides move the
  whole composition together. Do not create a new `CoreAssetId` only to place
  the companion.
- Existing interactive object: reuse its existing `CoreAssetId`, hitbox, signal,
  focus, and semantic content.
- New interactive entrance or a new UI-editable native asset type: use
  `$living-index-developer` as well. Extend the schema and semantic fallback;
  do not disguise a native object as an empty GLB custom asset.
- Keep all transforms compatible with the existing placement system. Built-in
  object overrides remain relative.

## Validate

1. Run `npm run typecheck`.
2. Run the focused scene and lighting tests.
3. Inspect the asset in daylight and night lighting.
4. Verify shadows, camera framing, reduced motion, mobile pixel density, and
   disposal after a development reload.
5. For interactive work, verify pointer, keyboard, index, detail route, and
   non-WebGL access.
