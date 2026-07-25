---
name: living-index-scene
description: Compose and troubleshoot The Living Index 3D scene. Use when Codex needs to change author-timezone lighting, move or rotate existing objects, import and place GLB assets, choose decorative versus interactive behavior, edit drag-placement modes, or preserve scene-to-content accessibility parity.
---

# Living Index Scene

Use the persisted scene schema for composition and the Three.js runtime only for capabilities the schema cannot express.

## Start

1. Inspect `git status --short` and preserve unrelated work.
2. Read `references/scene-system.md` before editing transforms, lighting, GLB files, or scene interactions.
3. Inspect `app/content-config.ts`, `public/content/site-content.json`, and the relevant runtime/editor code.
4. Classify the change:
   - Existing built-in object: write a relative `scene.placements` override,
     toggle it through `scene.disabledCoreAssets`, or replace only its visual
     through `scene.coreAssetModels`.
   - New simple geometric object without authored textures: use
     `$living-index-native-assets`.
   - New decoration: create a custom asset with `behavior: "decorative"`.
   - New content entrance: create a custom asset with `behavior: "interactive"` and bilingual content.
   - New scene behavior or interaction: use `$living-index-developer`.

## Compose the scene

1. Prefer local Content Studio at `/?studio=1` for asset upload and placement.
2. Use self-contained glTF 2.0 GLB files only.
3. Preview placement before persisting it.
4. Switch drag modes explicitly:
   - `plane`: change X and Z.
   - `height`: change Y.
   - `rotation`: change heading around Y.
5. Use the numeric editor for scale; no drag-scale mode exists.
6. Confirm to commit the draft or cancel/press Escape to restore the saved transform.
7. Treat core-object transforms as relative and custom-object transforms as absolute.
8. Keep disabled built-in objects in code and Studio, but remove them from the
   rendered room, hit targets, navigation, index, and detail routes.
9. Treat a core GLB as a reversible visual override. Preserve the built-in ID,
   content, hitbox, signal, and placement; clearing it restores the native
   visual.
10. Keep decorative assets visible but absent from hit targets, navigation, index, and detail routes.
11. Give interactive assets localized labels and content cards; verify click, keyboard, index, and non-WebGL access.

## Drive author-local light

1. Set the same intended timezone in `profile.zh.timezone` and `profile.en.timezone`.
2. Use an IANA identifier such as `Asia/Shanghai` for civil-time rules, or a fixed value such as `GMT+8`.
3. Treat the result as an author-local visual clock, not an astronomical location model.
4. Verify dawn, day, dusk, night, artificial lights, and the displayed clock together.

## Handle assets safely

1. Keep model paths local and same-origin.
2. Record third-party provenance and licenses in `ASSET_CREDITS.md`.
3. Expect upload unlink/removal to leave the binary file behind; audit orphaned files deliberately.
4. Keep the procedural wireframe fallback working for missing or invalid models.

## Validate

Run focused checks:

```bash
node --experimental-strip-types --test tests/content-config.test.mts tests/content-studio-upload.test.mts tests/scene-placement.test.mts tests/solar-lighting.test.mts
npm run typecheck
```

Before release, run `npm run lint`, `npm test`, and `git diff --check`. Visually test both lighting phases, all three drag modes, confirm/cancel, decorative non-interactivity, interactive detail access, and the semantic index.
