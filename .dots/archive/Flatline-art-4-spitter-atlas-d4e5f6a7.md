---
title: Generate dedicated spitter sprite atlas
status: open
priority: 2
issue-type: task
created-at: "2026-05-09T16:36:03-05:00"
---

Slice 4 of the art-pipeline strategy. Closes REQ-031. Currently the spitter shares the grunt sprite atlas as a placeholder (per `docs/gdd/31-enemy-spitter.md` build log). Clone `scripts/generate-grunt-atlas.mjs` to `scripts/generate-spitter-atlas.mjs`, parameterized for the spitter's distinct silhouette (taller, lankier frame, projectile sac on belly per the GDD ranged-enemy reading). Output the 8-direction walk + attack-windup + attack + hurt + death frames the existing atlas pipeline expects, packed via `free-tex-packer-cli` (MIT, npm) into `public/assets/enemies/spitter/`. Optional: use `mflux` + FLUX.1-schnell (Apache-2.0, MLX-native) to generate a few side-view reference PNGs as concept art, then trace silhouettes in code. Diffusion outputs are reference-only, never shipped pixels. Run through `scripts/finish-asset.mjs` (slice 2) for palette + outline coherence. Update `enemyConfigs.spitter.spriteAtlas` in `src/game/enemies.ts` to point at the new atlas. Flip REQ-031 status `partial` to `done` in coverage + the GDD section build log. Estimated effort: ~2 days.
