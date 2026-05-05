# Arena Landmarks

**Status:** partial

The player should always know where they are. In a one-room game, orientation matters. If every wall looks the same, the player feels lost even though the room is small.

Distinct landmarks per wall:

- North wall: giant cracked clock
- East wall: furnace doors
- South wall: theater curtain
- West wall: pipe organ or control booth

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/components/FlatlineGame.tsx` carries the room geometry. The four named landmarks are aspirational; final art is part of post-MVP feel pass (`docs/gdd/56-post-mvp-feel-pass.md`). Status `partial` until each wall has a distinguishing feature visible in-game.
