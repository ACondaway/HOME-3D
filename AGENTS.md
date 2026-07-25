# Coding agent guide

This repository is designed to be customized with a coding agent. Read the smallest relevant skill before editing:

- Content, profile, social links, photography, Spotlight, or cards: [`$living-index-content`](./skills/living-index-content/SKILL.md)
- Timezone lighting, object placement, GLB imports, or decorative/interactive scene assets: [`$living-index-scene`](./skills/living-index-scene/SKILL.md)
- New framework capabilities, interactions, modules, routes, tests, or release-ready changes: [`$living-index-developer`](./skills/living-index-developer/SKILL.md)

## Repository map

- `public/content/site-content.json`: persisted personal content and scene overrides
- `app/content-config.ts`: schema, limits, normalization, and merge behavior
- `app/portfolio-data*.ts`: bilingual template defaults
- `app/RoomExperience.tsx`: Three.js runtime, routing, details, and semantic index
- `app/ContentStudio.tsx`, `app/SceneStudio.tsx`: visual authoring
- `build/content-studio-vite-plugin.ts`: local-only persistence and upload validation
- `tests/`: executable project contracts

## Non-negotiable invariants

1. Preserve unrelated dirty work and stage exact paths only.
2. Keep schema version 1 unless a migration is implemented.
3. Keep Chinese and English content intentionally aligned.
4. Give every spatial interaction an equivalent semantic and keyboard path.
5. Preserve reduced-motion, WebGL failure, and `noscript` behavior.
6. Keep save/upload endpoints loopback-only and development-only.
7. Treat uploaded files and JSON as one atomic change.
8. Record third-party asset provenance in `ASSET_CREDITS.md`.

## Validation and delivery

Run focused tests while iterating. Before shipping framework changes, run:

```bash
npm run typecheck
npm run lint
npm test
git diff --check
```

Push through GitHub only when requested. The `main` branch workflow validates and deploys the Cloudflare Worker; do not direct-deploy or modify secrets as part of ordinary feature work.
