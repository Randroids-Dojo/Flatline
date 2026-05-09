---
title: Add scripts/finish-asset.mjs palette + ink-outline post-processor
status: open
priority: 2
issue-type: task
created-at: "2026-05-09T16:36:01-05:00"
---

Slice 2 of the art-pipeline strategy. Adds `src/art/palette.ts` (canonical hex values: outline `#f4f1e8`, ink `#090909`, teal `#50d1c0`, danger `#f05a4f`, plus 4 grayscale stops) and `scripts/finish-asset.mjs` (palette quantization with snap-to-nearest, plus a 1-px ink outline pass). Every existing weapon and enemy generator script gets a final `finishAsset(buffer)` step before write. Re-runs all generators so the committed PNGs in `public/assets/weapons/` and `public/assets/enemies/` are quantized to the canonical palette. No content changes; coherence pass that becomes the foundation for slices 3-6. Estimated effort: ~1 day.
