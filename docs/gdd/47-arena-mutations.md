# Arena Mutations

**Status:** partial

The room should change over time without becoming a new level.

## Lighting phase

- Normal
- Flicker
- Emergency lights
- Near-death pulse
- Darkness with enemy eyes

## Door phase

- More spawn doors unlock
- Doors jam open
- Doors burst with smoke
- Door lights signal enemy type

## Hazard phase

- Floor traps activate
- Center zone becomes dangerous
- Corners become pickup traps
- Wall vents fire projectiles

## Cover phase

- Pillars rise
- Props break
- Moving partitions shift routes

MVP only needs lighting and spawn doors.

### Build log

- 2026-05-04: Door state machine v1. Spawn doors now run a three-phase post-spawn life cycle (opening burst -> open hold -> cooling fade) instead of a single fixed pulse, plus a tuned audio cue. New pure helper `src/game/doorState.ts` exposes `DoorPhase`, `DOOR_OPENING_MS = 150`, `DOOR_OPEN_MS = 600`, `DOOR_COOLING_MS = 350`, `DOOR_TOTAL_MS = 1100`, `doorPhaseAtElapsedMs(elapsedSinceSpawnMs)`, and `doorPhaseVisualAtElapsedMs(elapsedSinceSpawnMs)` returning `{ opacity, scaleY, color }`. Opening uses a half-sine envelope so the peak (opacity 0.78, scaleY 0.96, warm white `#f8f1d6`) lands mid-burst above the open-phase baseline (opacity 0.46 / scaleY 0.84 / amber `#f0c668`); cooling eases linearly back to the idle baseline (opacity 0.08 / scaleY 0.58 / teal `#50d1c0`). `src/components/FlatlineGame.tsx` switches `doorSignalTimersRef` from countdown-to-zero to elapsed-since-spawn, refactors `applyDoorSignals` to read the visual from the helper, and adds the `playDoorOpenCue` runtime fed by `src/game/doorCue.ts`. Files: `src/game/doorState.ts`, `src/game/doorState.test.ts`, `src/game/doorCue.ts`, `src/game/doorCue.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD. Status stays `partial` (lighting phase variations beyond intensity, hazard phase mutations, and cover phase mutations remain).
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: lighting tied to pressure exists in `src/components/FlatlineGame.tsx`; spawn-door surface treatment is tied to `src/game/spawnDirector.ts`. Door / hazard / cover phase variations are not yet implemented as a unified mutation system; status `partial`.
