---
name: living-index-developer
description: Extend and ship The Living Index as an agent-native React and Three.js framework. Use when Codex needs to add a content capability, interaction, page module, route, editor control, runtime behavior, accessibility fallback, test coverage, or release-ready code change beyond existing Content Studio fields.
---

# Living Index Developer

Extend the smallest stable contract and keep the 3D experience, semantic experience, editor, persisted schema, and tests in sync.

## Start

1. Read the repository `AGENTS.md`.
2. Inspect `git status --short` and preserve unrelated work.
3. Read `references/architecture.md` before changing framework behavior.
4. Use `$living-index-content` for data-only editorial work.
5. Use `$living-index-scene` for existing scene composition, lighting, or asset placement.
6. Continue here only when the request changes project capability.

## Implement across contracts

1. Trace the current path from persisted/default data through normalization, merge helpers, editor state, runtime rendering, and tests.
2. Modify every affected layer together:
   - schema, types, limits, and normalization;
   - Content Studio controls and raw draft state;
   - runtime and semantic rendering;
   - responsive styling;
   - server-side upload/save validation when external data enters the project;
   - focused and regression tests.
3. Keep invalid external fields fail-closed. Avoid trusting UI-only validation.
4. Preserve stable IDs and merge semantics so an override does not replace unrelated configuration.
5. Keep resource cleanup explicit for Three.js geometry, material, texture, listeners, animation frames, fetches, and object registries.
6. Avoid direct DOM or browser access during server rendering.

## Preserve equal access

For every spatial feature:

1. Provide an equivalent semantic index or detail route.
2. Support keyboard entry and exit.
3. Preserve visible focus and useful accessible names.
4. Respect reduced-motion preferences.
5. Keep WebGL failure and `noscript` content useful.
6. Maintain bilingual UI and editorial parity.

## Verify proportionally

Run focused tests during implementation. Before release, run the repository gate:

```bash
npm run typecheck
npm run lint
npm test
git diff --check
```

Use local `npm run dev` for visual interaction checks. Reset the Content Studio browser draft if committed JSON appears stale.

## Deliver safely

1. Inspect the final diff and list every intended file.
2. Stage exact paths only; never absorb unrelated dirty work.
3. Commit a focused change.
4. Push the current branch only when the user requested delivery.
5. Let GitHub Actions validate and deploy Cloudflare after a push to `main`; do not bypass the configured pipeline or alter secrets.
