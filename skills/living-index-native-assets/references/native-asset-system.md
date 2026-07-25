# Native asset system

## Source map

| Concern | Source |
|---|---|
| Primitive and material helpers | `app/RoomExperience.tsx` near `standardMaterial`, `addBox`, `addCylinder`, and `addSphere` |
| Interaction helpers | `app/RoomExperience.tsx` near `addHitbox` and `addSignal` |
| Existing asset factories | `app/RoomExperience.tsx` functions named `create*Asset` |
| Factory registration | `app/RoomExperience.tsx` in `createSceneAssets` |
| Placement overrides | `app/content-config.ts` and `app/scene-placement.ts` |
| Content and semantic routes | `app/portfolio-data*.ts` and `app/RoomExperience.tsx` |

## Composition contract

- Put every object under one root `THREE.Group`.
- Treat the root transform as authored placement. Keep child transforms local.
- Use meters at the room’s existing scale: tabletop props are commonly
  `0.1–1.2` units; furniture is commonly `0.5–4` units.
- Ground standing objects at local `Y = 0`; position primitive centers at half
  their height when appropriate.
- Prefer the room palette: dark wood, muted green, paper, brass, charcoal, and
  restrained accent colors.
- Use radians in native factory code. Persisted placement rotations use degrees.

## Material and lighting contract

- Default to `MeshStandardMaterial`.
- Use roughness around `0.45–0.8` for wood, paper, ceramic, and fabric.
- Use metalness around `0.55–0.85` only for actual metal.
- Keep `emissiveIntensity` low for reflected glow. Strong emission does not
  visibly respond to scene lights.
- Avoid `doubleSided` unless both sides are genuinely visible.
- Set `castShadow` on visually important solids and `receiveShadow` on broad
  surfaces. Disable unnecessary shadows on tiny repeated details.

## Geometry budget

- Aim for fewer than 30 meshes and fewer than 25,000 triangles for one simple
  native asset.
- Use 12–24 radial segments for small cylinders, 24–32 only for prominent
  silhouettes, and 8–16 for tiny knobs or cables.
- Share geometry/material for repeated parts. Prefer `InstancedMesh` when a
  repeated element appears more than eight times.
- Avoid textures for color-only props. If authored artwork is required, prefer
  a small plane or GLB rather than embedding large data URLs in source.

## Factory pattern

```ts
function createNativeDecoration(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.set(1.4, 0, 2.2);
  scene.add(group);

  addCylinder(group, 0.28, 0.34, 0.42, [0, 0.21, 0], "#6f5947", {
    segments: 20,
    roughness: 0.72,
  });
  addSphere(group, 0.32, [0, 0.62, 0], "#516b61", [1, 0.72, 1], 0.78);

  return group;
}
```

Register the factory once in `createSceneAssets`. Do not create another renderer
or animation loop.

## Companion decoration pattern

When a prop belongs to an existing built-in object, parent it to that object's
root instead of adding an independent scene root:

```ts
function createStorageBoxStack(parent: THREE.Group) {
  const stack = new THREE.Group();
  parent.add(stack);
  // Add primitives relative to the built-in object's local coordinates.
  return stack;
}
```

Call the companion factory inside the owning asset factory, or expose the
owning root from that factory when necessary. This keeps the prop synchronized
with the owner's placement, rotation, and scale overrides. Do not introduce a
new `CoreAssetId` merely to make a companion decoration movable.

## Interaction pattern

For an existing content object, keep the current semantic ID:

```ts
addHitbox(group, "growth", [1.2, 1.8, 1.2], [0, 0.9, 0], hitboxes);
addSignal(group, "growth", [0.46, 1.46, 0.38]);
```

Do not add these helpers to decoration-only assets. A genuinely new interactive
ID requires schema, bilingual content, focus data, routing, index parity, and
non-WebGL access; route that work through `$living-index-developer`.

## Animation pattern

```ts
animated.push((elapsed, delta) => {
  rotor.rotation.y += delta * 0.35;
  glow.emissiveIntensity = 0.08 + (Math.sin(elapsed * 1.2) + 1) * 0.03;
});
```

Use `delta` for accumulated motion and `elapsed` for bounded oscillation. The
room skips registered animation when reduced motion is requested.

## Review checklist

- The silhouette is clear from the default camera.
- The object responds to both daylight and night lights.
- Companion props inherit the owning built-in object's transform.
- It does not block existing hitboxes or camera paths.
- Decorative objects cannot accidentally open a page.
- Interactive objects remain reachable without precise 3D pointing.
- No new permanent animation loop, event leak, or undisposed GPU resource was
  introduced.
