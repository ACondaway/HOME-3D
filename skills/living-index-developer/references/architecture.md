# Framework architecture

## Runtime map

| Layer | Files |
|---|---|
| Application entry | `app/page.tsx`, `app/layout.tsx` |
| 3D runtime, routes, semantic index | `app/RoomExperience.tsx` |
| Persisted schema and normalization | `app/content-config.ts` |
| Default editorial data | `app/portfolio-data.ts`, `app/portfolio-data-en.ts` |
| Content and scene editors | `app/ContentStudio.tsx`, `app/SceneStudio.tsx`, `app/ContentCardEditor.tsx` |
| Specialized modules | `app/AboutProfileModule.tsx`, `app/PhotographyGallery.tsx`, `app/SocialIcon.tsx` |
| Lighting and placement logic | `app/solar-lighting.ts`, `app/scene-placement.ts` |
| Local persistence and upload boundary | `build/content-studio-vite-plugin.ts` |
| Styling | `app/globals.css` |
| Worker and deployment | `worker/index.ts`, `wrangler.jsonc`, `.github/workflows/deploy.yml` |

## State and routes

- Mount the experience from `app/page.tsx`.
- Load persisted overrides from `/content/site-content.json`.
- Open Content Studio with `?studio=1`.
- Select locale with `?lang=zh|en`.
- Open content with `?section=<asset-id>`.
- Expect the local browser draft to override repository JSON until reset.
- Keep production content endpoints read-only; local Vite middleware owns write/upload operations.

## Cross-layer contract

For a new content field, card kind, media type, asset property, or interaction:

1. Define type and limit.
2. Normalize untrusted persisted input.
3. Clone and merge without aliasing or replacing siblings.
4. Expose an editor control with raw draft behavior.
5. Render both spatial and semantic forms.
6. Validate again at server/file boundaries.
7. Style desktop, narrow, reduced-motion, and fallback states.
8. Add focused unit tests and rendered-contract tests.

## Interaction invariants

- Keep the semantic index equal in content to the spatial experience.
- Keep keyboard navigation, focus management, escape behavior, and accessible names.
- Keep reduced-motion and WebGL failure paths.
- Keep Chinese and English routes and labels in sync.
- Dispose Three.js resources and remove event listeners on every lifecycle exit.
- Keep server rendering free of unguarded `window`, `document`, WebGL, and storage access.

## Validation matrix

| Change | Minimum focused checks |
|---|---|
| Content/schema | `content-config`, `content-studio-upload`, typecheck |
| Scene/lighting | `scene-placement`, `solar-lighting`, typecheck |
| UI/runtime | rendered HTML test, lint, typecheck |
| Release | `npm run typecheck`, `npm run lint`, `npm test`, `git diff --check` |

`npm test` performs a production build before running the complete test set.

## Delivery

- Keep Node compatibility at `>=22.13.0`.
- Preserve unrelated dirty files.
- Stage exact intended paths.
- Let pull requests run validation only.
- Let pushes to `main` deploy through the configured GitHub Actions workflow.
- Do not commit Cloudflare credentials or bypass the CI deployment path.
