# Arena Shape

**Status:** done

MVP room:

- Rectangular room
- Pillars near center
- 4 enemy doors
- 4 corner pickup zones
- 1 center risk/reward pickup zone
- Raised stage or altar in center
- Wall decorations for orientation

### Build log

- 2026-05-09: Closes REQ-019. Walk-through audit against the seven-item MVP room spec resolves to current code, plus four new corner pickup-zone markers fill the last gap. Item map: (1) Rectangular room: `createRoom()` builds the 20x20 floor + 4 walls. (2) Pillars near center: 4 cylinder pillars at `[+/-3.5, +/-1.8]` and `[+/-3.5, 2.1]` (also tracked under REQ-021 cover collision). (3) 4 enemy doors: door state machine v1 places north / south / east / west doors with opening / open / cooling phases. (4) 1 center risk / reward pickup zone: the central altar at `(0, 0.22, 0)` with the supply pickup (REQ-033 small / large heal tiers, REQ-034 ammo, plus rage and score-token rotations); the player must cross open ground past the spawn doors to reach it. (5) Raised altar in center: the same altar cylinder (radius 1.6 to 1.3, height 0.45). (6) Wall decorations: north clock, east furnace, south curtain, west pipe organ landmarks per `src/game/arenaLandmarks.ts` (REQ-020). (7) 4 corner pickup zones (NEW): four static `RingGeometry` markers at `(+/-6, +/-6)` with a darker teal accent (`#3aa39b`, opacity 0.45) so the central altar halo stays the visual focus; the corners are reservation markers (the room reads symmetrical on entry) without a pickup spawner attached, since spawn rules belong to REQ-033 / REQ-034 / REQ-035 (which today route everything through the altar). Status flips `partial` to `done`. Files: `src/components/FlatlineGame.tsx`, `docs/gdd/19-arena-shape.md`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: room geometry in `src/components/FlatlineGame.tsx`. Pillars, doors, pickup zones, and altar-class center landmark may not all be present yet; status `partial` pending walk-through verification against the spec list.
