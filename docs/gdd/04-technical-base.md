# Technical Base

**Status:** done

Use a similar infrastructure shape to `Randroids-Dojo/VibeRacer`:

- Next.js app
- React UI shell
- Three.js renderer
- TypeScript
- Pure game loop logic where possible
- `requestAnimationFrame` render loop
- Vitest unit tests
- Playwright smoke tests
- Optional Upstash Redis for leaderboards and daily seeds

The core idea is to reuse the VibeRacer style of separating React lifecycle/UI, Three.js rendering, and pure game simulation.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `package.json` (Next.js 16, React 19, Three.js 0.181, TypeScript 5.9, Vitest 4, Playwright 1.56, `@upstash/redis`), `playwright.config.ts`, `vitest.config.ts`, `app/page.tsx`, `src/components/FlatlineGame.tsx`. Verify pipeline: `npm run verify` runs lint, typecheck, vitest, build, playwright.
