---
title: HUD rubber-hose icons via game-icons + svg2roughjs + rsvg-convert
status: open
priority: 2
issue-type: task
created-at: "2026-05-09T16:36:02-05:00"
---

Slice 3 of the art-pipeline strategy. Closes REQ-039's "rubber-hose icons" gap. Pipeline: clone `game-icons/icons` (CC-BY 3.0) at a pinned commit, run their `colorize-svgs.sh` to recolor the chosen glyphs (heart, ammo, weapons, etc.) to the Flatline palette, pass through a new `scripts/rubber-hose-svg.mjs` that uses `svg2roughjs` (MIT) with a fixed seed + `roughness: 1.4, bowing: 1.8` for deterministic wobble, then `rsvg-convert` (LGPL, `brew install librsvg`) to rasterize each to a fixed-size PNG under `public/assets/hud/`. Add `CREDITS.md` extracting `<dc:creator>` per icon since CC-BY requires attribution. Wire the new icons into the HUD pills in `FlatlineGame.tsx`. Closes REQ-039 visual treatment except the per-pill ink-bleed border (which is a pure inline SVG `<feTurbulence>` filter, no asset files needed; bundle into the same slice). Estimated effort: ~1 day.
