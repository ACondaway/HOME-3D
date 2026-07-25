---
name: living-index-content
description: Customize bilingual portfolio content and media in The Living Index. Use when Codex needs to edit profile copy, the About portrait, social links, photography and Spotlight stories, text/media/link cards, Content Studio behavior, or public/content/site-content.json in a Living Index repository.
---

# Living Index Content

Treat the repository-owned content model as the contract. Prefer data changes over component rewrites when the requested result already fits the model.

## Start

1. Inspect `git status --short` and preserve unrelated work.
2. Read `references/content-model.md` before changing JSON, uploads, photography, cards, or editor behavior.
3. Inspect `public/content/site-content.json` and the matching defaults in `app/portfolio-data.ts` and `app/portfolio-data-en.ts`.
4. Classify the request before editing:
   - Personal content or media: edit `public/content/site-content.json` or use local Content Studio.
   - Reusable template defaults: edit both portfolio data files.
   - A new content capability: use `$living-index-developer` and update schema, editor, runtime, styles, and tests together.

## Author content

1. Keep `version: 1`, `profile`, and `assets` at the document root.
2. Maintain deliberate `zh` and `en` variants. Keep shared identities stable across locales.
3. Use the three existing card kinds: `text`, `media`, and `links`.
4. Choose card width independently: `standard`, `wide`, or `full`.
5. Preserve raw controlled text while typing. Normalize only at import/save boundaries so trailing spaces remain editable.
6. Use explicit, matching photography entry IDs in both locales. Point the shared image source map and `spotlightId` at those IDs.
7. Keep every photograph in the gallery. Use Spotlight only to select the image that receives the featured editorial panel.
8. Provide useful alternative text for profile, photography, and card images.
9. Use only `http:`, `https:`, or `mailto:` link targets.

## Use Content Studio

1. Run `npm run dev`.
2. Open `/?studio=1`.
3. Clear or reset the `living-index.content-draft.v1` browser draft when repository edits appear stale.
4. Upload media only from the loopback development server.
5. Save after uploading so the generated `/uploads/...` path enters `site-content.json`.
6. Commit both the JSON reference and every referenced uploaded file.
7. Finish or cancel any active scene-placement session before save, import, or export.

Production intentionally exposes no write or upload endpoint. For a deployed fork, edit tracked files locally and ship them through Git.

## Validate

Run focused checks while iterating:

```bash
node --experimental-strip-types --test tests/content-config.test.mts tests/content-studio-upload.test.mts
npm run typecheck
```

Before release, run:

```bash
npm run lint
npm test
git diff --check
```

Inspect normalized output, referenced upload paths, both locales, Spotlight behavior, link buttons, and the accessible content index. Stage only intended files.
