# Post-MVP: Feel Pass

**Status:** partial

Fix the verbs before adding breadth:

- WASD must always match the camera direction.
- Every shot needs readable feedback: muzzle flash, visible bolt or tracer, hit flash, miss feedback, and audio.
- The first enemy should be centered in the starting view so the player can shoot within the first second.
- Movement should feel fast but controllable around pillars.
- The player should understand enemy damage range without reading text.

Done when a fresh player can start a run, move, shoot, kill the first enemy, and understand what happened without instruction.

### Build log

- 2026-05-03: Per-shot impact bursts spawn at the bolt's terminal point: red ring on hit, teal ring on miss. Each burst expands and fades over 160 to 220 ms. Capped at 12 concurrent rings, cleared on run reset and unmount. Files: `src/components/FlatlineGame.tsx`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Movement, shooting, and the kill-first-enemy flow ship pre-spiral. Per-shot readable feedback (tracer / hit flash / miss feedback / audio) has not been individually audited; status `partial` until that audit runs against `docs/PLAYTEST.md` "First 90 seconds" and "Core loop fun" sections.
