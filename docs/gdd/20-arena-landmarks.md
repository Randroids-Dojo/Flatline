# Arena Landmarks

**Status:** partial

The player should always know where they are. In a one-room game, orientation matters. If every wall looks the same, the player feels lost even though the room is small.

Distinct landmarks per wall:

- North wall: giant cracked clock
- East wall: furnace doors
- South wall: theater curtain
- West wall: pipe organ or control booth

### Build log

- 2026-05-04: South curtain and west pipe organ landed alongside the existing north clock and east furnace, so all four cardinal walls now carry a distinct silhouette. New pure helper `src/game/arenaLandmarks.ts` exposes the four-entry `arenaLandmarks` roster (with anchor positions and palette per wall), `landmarkForWall(wall)` lookup, and tuning constants for both the curtain (`CURTAIN_PANEL_COUNT = 3` per side, `CURTAIN_HEIGHT_M = 2.2`, `CURTAIN_DOOR_HALF_GAP_M = 1.5`) and the organ (`ORGAN_PIPE_HEIGHTS_M = [1.2, 1.8, 2.4]` per side stepping short to tall, `ORGAN_DOOR_OFFSET_M = 1.55`). `src/components/FlatlineGame.tsx` `createRoom` now reads the roster for clock and furnace placement (single source of truth), adds a clock hand on the north torus, renders the south curtain as two velvet panel stacks plus a brass rail, and renders the west organ as two flanking groups of vertical pipe cylinders on dark wood plinths. Landmarks anchor at `+-9.78` so they sit on the wall plane and avoid z-fighting. Curtain panels and organ pipes both clear the door cutouts so the door state visuals still read. Files: `src/game/arenaLandmarks.ts`, `src/game/arenaLandmarks.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD. Status remains `partial` until landmark final art (textured fabric folds, real organ pipe stops, ember-lit furnace, animated clock hand) lands as part of `docs/gdd/56-post-mvp-feel-pass.md`.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/components/FlatlineGame.tsx` carries the room geometry. The four named landmarks are aspirational; final art is part of post-MVP feel pass (`docs/gdd/56-post-mvp-feel-pass.md`). Status `partial` until each wall has a distinguishing feature visible in-game.
