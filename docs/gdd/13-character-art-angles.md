# Character Art and Angles

**Status:** partial

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

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: 8-angle engine support in `src/game/billboard.ts` plus enemy atlases at `public/assets/enemies/grunt`, `public/assets/enemies/skitter`, `public/assets/enemies/brute`. Final hand-drawn animation pass is incomplete; status `partial` until full per-state turnarounds ship.
