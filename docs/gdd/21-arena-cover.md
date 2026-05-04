# Arena Cover

**Status:** partial

Cover should not stop the game.

Use partial cover:

- Pillars
- Broken walls
- Low crates
- Hanging props
- Moving partitions

Enemies should path around cover, not get stuck on it.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: pillars exist in `src/components/FlatlineGame.tsx`. Other cover types (broken walls, crates, hanging props, moving partitions) are not implemented; status `partial`.
