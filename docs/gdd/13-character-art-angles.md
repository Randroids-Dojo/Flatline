# Character Art and Angles

**Status:** done

Each enemy needs:

- Idle
- Walk
- Attack windup
- Attack release
- Hurt
- Death
- Optional special animation

Each animation needs multiple angles.

MVP angle set (8 directions):

- Front
- Front-left
- Left
- Back-left
- Back
- Back-right
- Right
- Front-right

MVP shortcut (5 angles via mirroring):

- Front
- Front-left
- Left/right mirrored
- Back-left/back-right mirrored
- Back

Decision recorded as Q-002: ship 8-angle engine support; placeholder art may mirror down from 5 authored angles.

### Build log

- 2026-05-09: Per-enemy walk / windup / release frames shipped (art slice 5). Atlases bumped from 10 to 18 rows per angle: idle (4), walk (4), attackWindup (2), attack (2), hurt (2), death (4). All four enemy types covered (grunt, skitter, brute, spitter); 8 distinct angles authored per type. New clips: `walk` (looping), `attackWindup` (non-loop), `attack` (non-loop). Files: `scripts/generate-grunt-atlas.mjs`, `scripts/generate-enemy-variant-atlases.mjs`, `public/assets/enemies/{grunt,skitter,brute,spitter}/{type}.png` + `.atlas.json`, `src/game/spriteAtlas.ts` (extended `AnimationName`), `src/components/FlatlineGame.tsx` (state-to-clip mapping in `animationForEnemyState` + safe missing-clip fallback in `applyEnemyFrame`). Status flips `partial` to `done`. PR #135.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: 8-angle engine support in `src/game/billboard.ts` plus enemy atlases at `public/assets/enemies/grunt`, `public/assets/enemies/skitter`, `public/assets/enemies/brute`. Final hand-drawn animation pass is incomplete; status `partial` until full per-state turnarounds ship.
