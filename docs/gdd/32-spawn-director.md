# Spawn Director and Difficulty Ramp

**Status:** done

Difficulty increases by pressure budget.

Each second, the game has a target pressure score. Enemy types cost pressure.

Example:

| Enemy | Pressure cost |
| - | -: |
| Grunt | 1 |
| Spitter | 2 |
| Swarm | 1 |
| Brute | 4 |

The spawn director tries to keep current pressure near the target.

Target pressure rises over time:

```text
0:00 to 1:00    mostly grunts
1:00 to 2:00    grunts + spitters
2:00 to 4:00    add brutes
4:00+           mixed waves, hazards, faster spawn cadence
```

## Spawn director goals

The director should feel mean, not random.

It should avoid:

- Spawning enemies directly behind the player with no cue
- Spawning too many ranged enemies at once
- Starving the player of ammo
- Creating unwinnable body-blocks too early

It should encourage:

- Movement
- Weapon switching
- Risky pickup routes
- Last-second escapes

### Build log

- 2026-05-10: Spawn density ramp re-tune. Original curve held the player against one enemy for the entire first minute (`targetPressureForRunMs(0..60s) = 1`), and `MAX_ENEMIES = 3` capped the late-game ramp below the spec's "asymptote at 4". Both made the game feel turn-based instead of endless. New curve: `2 / 3 / 4 / 5 / 6 / 7 / 8` at `0 / 15 / 45 / 90 / 150 / 210 / 300+` seconds, asymptoting at 8. `MAX_ENEMIES` raised from 3 to 8 so the cap matches the new top-of-ramp; render-slot pre-allocation in `FlatlineGame.tsx` (line ~1143) follows. Encounter wave's `+1 / +2` surge / peak still layers on top, so brief spikes of 9-10 enemies are possible during peaks, gated by the `MAX_ENEMIES` cap so spawning never overshoots the render-slot pool. Other consumers of `targetPressureForRunMs` (rage / score-token gates, music intensity ratio) still gate on additional time floors so this change does not move their unlock moments. Files: `src/game/spawnDirector.ts`, `src/game/spawnDirector.test.ts`, `src/components/FlatlineGame.tsx`. PR #154.
- 2026-05-06: Encounter wave choreography (F-014). Layered a deterministic 50 s wave shape (25 s lull / 18 s surge / 7 s peak) on top of the existing pressure-budget ramp. New pure helper `src/game/encounterWave.ts` exposes `encounterWaveSignal(runMs)` returning `{ phase, targetDelta, cadenceScale }` (lull `+0 / x1.0`, surge `+1 / x0.75`, peak `+2 / x0.55`) and `peakStartedBetween(prev, current)` for one-shot peak detection. `tickDirector` adds the signal's `targetDelta` to `pressureTarget` and multiplies `cadenceMs` by the signal's `cadenceScale` so spawns thicken during the surge / peak phases. `FlatlineGame.tsx` plays a 220 ms 90 Hz sawtooth horn at peak start and renders a `wave-pill` HUD entry showing the current phase. Files: `src/game/encounterWave.ts`, `src/game/encounterWave.test.ts`, `src/game/spawnDirector.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #70.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/spawnDirector.ts`. Tests: `src/game/spawnDirector.test.ts`.
