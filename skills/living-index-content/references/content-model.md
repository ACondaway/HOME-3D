# Content model

## Source map

| Concern | Source of truth |
|---|---|
| Personal overrides | `public/content/site-content.json` |
| Schema, limits, normalization, merges | `app/content-config.ts` |
| Chinese defaults | `app/portfolio-data.ts` |
| English defaults | `app/portfolio-data-en.ts` |
| Main editor | `app/ContentStudio.tsx` |
| Reusable card editor | `app/ContentCardEditor.tsx` |
| Image upload client | `app/ImageUploadField.tsx` |
| Local save/upload validation | `build/content-studio-vite-plugin.ts` |
| Rendering | `app/RoomExperience.tsx`, `app/AboutProfileModule.tsx`, `app/PhotographyGallery.tsx` |

## Document rules

- Keep `version: 1`.
- Keep profile and core-asset overrides localized under `zh` and `en`.
- Use only these core IDs: `music`, `fitness`, `reading`, `research`, `making`, `photography`, `ritual`, `growth`, `about`, `travel`, `contact`, `future`.
- Treat `media`, `socialLinks`, and `scene` as shared containers.
- Share the profile photo source; localize its alt text.
- Share social platform, URL, and ID; localize its optional label.
- Expect invalid individual fields to be omitted or truncated during normalization. Assert that intended fields survive.

## Cards

- Use `kind: "text" | "media" | "links"`.
- Use `width: "standard" | "wide" | "full"`.
- Supply string values for `eyebrow`, `title`, `body`, and `meta`; a missing/non-string required field drops the entry.
- Keep at most 24 cards per asset and 4 links per card.
- Use `http:`, `https:`, or `mailto:` URLs.
- Use `/uploads/cards/<uuid>.(jpg|png|webp|avif)` for card images.
- Keep array order equal to display order.

## Photography

- Assign an explicit stable ID to every localized photography entry.
- Keep corresponding IDs aligned between `zh` and `en`.
- Store shared sources in `media.photography.sources[id]`.
- Store the featured choice in `media.photography.spotlightId`.
- Keep all photos visible; Spotlight changes editorial prominence only.
- Expect an invalid or missing Spotlight ID to fall back to the first photo.

## Uploads and persistence

- Open `/?studio=1` on the local Vite server.
- Accept JPEG, PNG, WebP, or AVIF images up to 10 MiB, 10,000 px per side, and 40 megapixels.
- Expect random UUID filenames under `public/uploads/profile`, `photography`, or `cards`.
- Save after upload; upload alone only creates the file.
- Expect unlink and delete operations not to remove the stored file.
- Keep `/__content-studio/save` and `/__content-studio/upload` loopback-only and development-only.
- Keep saved JSON at or below 24 MiB.

## Frequent failures

- Clear `localStorage["living-index.content-draft.v1"]` when a browser draft masks repository JSON.
- Fix mismatched or generated photo IDs before diagnosing missing images.
- Commit referenced upload files with `site-content.json`.
- Do not use remote URLs or arbitrary relative paths for uploaded media.
- Do not add a card kind or width to one layer only; update schema, UI, runtime, validation, and tests together.
- Preserve raw editor values during typing; trim only at import/save.
