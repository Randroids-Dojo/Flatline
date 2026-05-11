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

- 2026-05-10: Lighting emergency phase. Fourth of REQ-047's five lighting phases. Triggers when effective pressure (raw `targetPressureForRunMs` plus `encounterWaveSignal.targetDelta` for the same `runMs`) reaches `EMERGENCY_PRESSURE_THRESHOLD = 6`, so the strobe fires whenever the spawn director's wave layer pushes a surge or peak past that mark. The overhead light alternates `EMERGENCY_BRIGHT_SCALE = 1.4` and `EMERGENCY_DIM_SCALE = 0.3` every `EMERGENCY_STEP_MS = 250` (2 Hz strobe) and tints to `EMERGENCY_LIGHT_COLOR = '#f23a3a'`. Precedence: `near-death > emergency > flicker > normal`; the player's heartbeat keeps winning so a dying player at peak pressure still feels the teal heartbeat rather than the red strobe. New helpers: `emergencyIntensityScale(elapsedMs)` and `lightingColorForPhase(phase)` (returns the emergency red only on emergency, else the normal teal `#50d1c0`). `combinedLightingIntensityScale` composes all four phases. `src/components/FlatlineGame.tsx` now passes effective pressure (with wave delta) instead of raw pressure and mutates `runtime.overhead.color` each frame so the red signal reaches the GPU. Status stays `partial` because the fifth phase (darkness with enemy eyes) and hazard / cover phase mutations remain. Files: `src/game/lightingPhase.ts`, `src/game/lightingPhase.test.ts`, `src/components/FlatlineGame.tsx`. PR #pending.
- 2026-05-09: Lighting near-death pulse phase. Adds the third of REQ-047's five lighting phases, `'near-death'`, which kicks in when player health is at or below `NEAR_DEATH_HEALTH_THRESHOLD = 25` (and alive). The overhead light pulses at `NEAR_DEATH_PULSE_HZ = 1.33` (heart-rate cadence, much slower than the flicker's 80 ms steps and faster than the calm baseline) between scales 0.55 and 1.25, so the room visibly throbs when the player is one hit from down. New helpers in `src/game/lightingPhase.ts`: `lightingPhase(pressure, playerHealth)` returning `'normal' | 'flicker' | 'near-death'` (near-death wins over flicker on overlap because the player's situation is more urgent than the room's), `nearDeathIntensityScale(elapsedMs)` returning a sin-driven scale inside the trough / peak bounds, and `combinedLightingIntensityScale(pressure, playerHealth, elapsedMs)` composing the three phases. `src/components/FlatlineGame.tsx` swaps the existing `lightingIntensityScale(pressure, t)` call for `combinedLightingIntensityScale(pressure, playerHealthRef.current, t)`. Status stays `partial` because two more lighting phases (emergency lights, darkness with enemy eyes) and the hazard / cover phase mutations are still ahead. Files: `src/game/lightingPhase.ts`, `src/game/lightingPhase.test.ts`, `src/components/FlatlineGame.tsx`. PR #150.
- 2026-05-09: Lighting flicker phase. New pure helper `src/game/lightingPhase.ts` exposes `lightingPhaseForPressure(pressure)` returning `'normal' | 'flicker'`, `flickerIntensityScale(elapsedMs)` returning a deterministic stair-stepped scale (`FLICKER_TROUGH_SCALE = 0.5`, `FLICKER_PEAK_SCALE = 1.05`, baseline 1) so the flicker reads as a stutter rather than a smooth wave, and `lightingIntensityScale(pressure, elapsedMs)` combining the two. The flicker activates once wave-director pressure reaches `FLICKER_PRESSURE_THRESHOLD = 0.7`, so the room starts to overload right when the spawn director is dumping waves on the player. `src/components/FlatlineGame.tsx` multiplies the overhead light's pressure-tied intensity by `lightingIntensityScale(...)` per frame. Status stays `partial` because the spec lists five lighting phases and three more (emergency lights, near-death pulse, darkness with enemy eyes) are still ahead. Files: `src/game/lightingPhase.ts`, `src/game/lightingPhase.test.ts`, `src/components/FlatlineGame.tsx`. PR #142.
- 2026-05-04: Door state machine v1. Spawn doors now run a three-phase post-spawn life cycle (opening burst -> open hold -> cooling fade) instead of a single fixed pulse, plus a tuned audio cue. New pure helper `src/game/doorState.ts` exposes `DoorPhase`, `DOOR_OPENING_MS = 150`, `DOOR_OPEN_MS = 600`, `DOOR_COOLING_MS = 350`, `DOOR_TOTAL_MS = 1100`, `doorPhaseAtElapsedMs(elapsedSinceSpawnMs)`, and `doorPhaseVisualAtElapsedMs(elapsedSinceSpawnMs)` returning `{ opacity, scaleY, color }`. Opening uses a half-sine envelope so the peak (opacity 0.78, scaleY 0.96, warm white `#f8f1d6`) lands mid-burst above the open-phase baseline (opacity 0.46 / scaleY 0.84 / amber `#f0c668`); cooling eases linearly back to the idle baseline (opacity 0.08 / scaleY 0.58 / teal `#50d1c0`). `src/components/FlatlineGame.tsx` switches `doorSignalTimersRef` from countdown-to-zero to elapsed-since-spawn, refactors `applyDoorSignals` to read the visual from the helper, and adds the `playDoorOpenCue` runtime fed by `src/game/doorCue.ts`. Files: `src/game/doorState.ts`, `src/game/doorState.test.ts`, `src/game/doorCue.ts`, `src/game/doorCue.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD. Status stays `partial` (lighting phase variations beyond intensity, hazard phase mutations, and cover phase mutations remain).
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: lighting tied to pressure exists in `src/components/FlatlineGame.tsx`; spawn-door surface treatment is tied to `src/game/spawnDirector.ts`. Door / hazard / cover phase variations are not yet implemented as a unified mutation system; status `partial`.
