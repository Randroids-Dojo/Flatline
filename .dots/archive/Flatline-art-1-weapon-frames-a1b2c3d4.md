---
title: Extend weapon sprite generator with cooldown / pickup / HUD frames
status: open
priority: 2
issue-type: task
created-at: "2026-05-09T16:36:00-05:00"
---

Slice 1 of the art-pipeline strategy. Extends `scripts/generate-weapon-sprites.mjs` to emit four new PNGs per weapon (peashooter, boomstick, inkblaster) on top of the existing idle / fire pair: `{weapon}-cooldown.png` (recoil position with fading flash, lerped between idle and fire polygons), `{weapon}-pickup.png` (64x64 lower-detail render with a spin offset), `{weapon}-hud.png` (32x32 monochrome teal silhouette), and a 4-frame `{weapon}-reload-{0..3}.png` interpolated tilt sequence. Closes most of REQ-026 (weapon presentation: idle / fire / cooldown / reload / pickup / HUD icon per weapon). Zero new dependencies. Deterministic. Slice ships PNG output committed to `public/assets/weapons/` plus the script changes; FlatlineGame.tsx wiring to actually render the new frames belongs to a follow-up slice. Estimated effort: half-day.
