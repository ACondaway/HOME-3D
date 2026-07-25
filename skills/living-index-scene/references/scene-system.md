# Scene system

## Source map

| Concern | Source |
|---|---|
| Scene schema and merge behavior | `app/content-config.ts` |
| Author-local light calculation | `app/solar-lighting.ts` |
| Placement transactions | `app/scene-placement.ts` |
| Three.js runtime | `app/RoomExperience.tsx` |
| Scene editor | `app/SceneStudio.tsx` |
| Model upload client | `app/ModelUploadField.tsx` |
| GLB and upload validation | `build/content-studio-vite-plugin.ts` |

## Transforms and behavior

- Use relative `scene.placements[coreId]` overrides for built-in objects.
- Use absolute `scene.customAssets[].transform` values for imported objects.
- Keep positions within `[-50, 50]`, rotations within `[-360, 360]` degrees, and scales within `[0.05, 20]`.
- Keep custom IDs unique and prefixed with `custom-`; keep at most 24 custom assets.
- Use a six-digit hexadecimal `accent`.
- Use `decorative` for visible scene dressing without interaction.
- Use `interactive` only when the asset needs hover/click behavior, navigation, an index entry, and a detail page.
- Localize interactive content under the asset’s shared `content.zh` and `content.en`.

## Placement transaction

- Use `plane` for X/Z, `height` for Y, and `rotation` for Y heading.
- Use Shift for 15-degree heading snapping.
- Edit scale numerically.
- Keep live preview separate from persistence.
- Confirm to merge changed axes; cancel to restore the saved transform.
- Preserve concurrent edits, untouched axes, scale, siblings, and custom-asset metadata.
- Finish placement before import, export, save, selection changes, or removal.

## Author-local lighting

- Accept IANA zones or `GMT`/`UTC` fixed offsets up to ±14 hours.
- Keep both localized profile timezone values aligned unless a language-specific difference is intentional.
- Expect invalid zones to fall back to UTC.
- Treat sunrise at 06:00, sunset at 18:00, and 75-minute twilight as a visual model.
- Do not infer latitude, hemisphere, or astronomical sun position from timezone.
- Expect the scene to refresh periodically rather than continuously.

## GLB contract

- Accept self-contained glTF 2.0 `.glb` files up to 24 MiB.
- Embed buffers and textures; reject external and data URI resources.
- Use PNG, JPEG, or WebP embedded textures.
- Reject Draco, Meshopt, BasisU/KTX2, and AVIF.
- Keep geometry below the validator budgets, including 1 million triangles, 512 nodes, 512 primitives, 16 images, 8192 px per texture edge, 32 megapixels per texture, and 64 megapixels total.
- Keep runtime same-origin fetch and size checks.
- Preserve the wireframe placeholder for missing, invalid, empty, or failed models.

## Frequent failures

- Treat a silently omitted transform, ID, accent, or path as a normalization failure first.
- Use local `/uploads/models/<uuid>.glb` paths instead of remote URLs.
- Check Network and the upload validator when the runtime only shows a placeholder.
- Audit orphaned GLBs after unlinking or deleting configuration.
- Verify decorative assets cannot open content and interactive assets remain available without precise 3D pointing.
