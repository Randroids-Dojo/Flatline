---
title: Arena cover billboards (crates, partitions, hanging props)
status: open
priority: 3
issue-type: task
created-at: "2026-05-09T16:36:05-05:00"
---

Slice 6 of the art-pipeline strategy. Closes REQ-021 (arena cover: pillars, broken walls, low crates, hanging props, moving partitions). Primary: parametric SVG primitives in a new `scripts/generate-cover-svgs.mjs`, run through `svg2roughjs` (the same wobble pipeline as the HUD icons in slice 3) to produce hand-drawn billboard textures, then rasterized via `rsvg-convert` to fixed-size PNGs under `public/assets/cover/`. Fallback for any cover element that cannot be reduced to primitives: pull a CC0 Kenney Blaster Kit / Mini Arena prop, render once through Three.js as a billboard impostor, commit the rendered PNG. Run through `scripts/finish-asset.mjs` for palette coherence. Wire the new cover billboards into the arena renderer in `FlatlineGame.tsx` so pillars, crates, and partitions become visible cover the player can route around. Flip REQ-021 status `partial` to `done`. Estimated effort: ~1-2 days.
