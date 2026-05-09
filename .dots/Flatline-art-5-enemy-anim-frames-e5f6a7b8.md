---
title: Per-enemy windup / hurt / death frames in atlas generators
status: open
priority: 3
issue-type: task
created-at: "2026-05-09T16:36:04-05:00"
---

Slice 5 of the art-pipeline strategy. Closes the REQ-013 / REQ-014 gap. The existing atlas generators (`scripts/generate-grunt-atlas.mjs`, `scripts/generate-enemy-variant-atlases.mjs`) ship walk frames but the windup / hurt / death anims are placeholders or absent. Add per-frame deformation passes: squash + stretch on attack-windup, jitter + flash on hurt, splat + collapse on death. Apply rough.js outline pass for hand-drawn coherence. 5-angle mirroring shortcut allowed per the GDD. Cover all four enemy types: grunt, skitter, brute, and (after slice 4) spitter. Run through `scripts/finish-asset.mjs` for palette coherence. Update `src/game/spriteAtlas.ts` animation clips if frame counts change. Flip REQ-013 / REQ-014 status `partial` to `done`. Estimated effort: ~2 days.
