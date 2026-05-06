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

- 2026-05-06: Encounter wave choreography (F-014). Layered a deterministic 50 s wave shape (25 s lull / 18 s surge / 7 s peak) on top of the existing pressure-budget ramp. New pure helper `src/game/encounterWave.ts` exposes `encounterWaveSignal(runMs)` returning `{ phase, targetDelta, cadenceScale }` (lull `+0 / x1.0`, surge `+1 / x0.75`, peak `+2 / x0.55`) and `peakStartedBetween(prev, current)` for one-shot peak detection. `tickDirector` adds the signal's `targetDelta` to `pressureTarget` and multiplies `cadenceMs` by the signal's `cadenceScale` so spawns thicken during the surge / peak phases. `FlatlineGame.tsx` plays a 220 ms 90 Hz sawtooth horn at peak start and renders a `wave-pill` HUD entry showing the current phase. Files: `src/game/encounterWave.ts`, `src/game/encounterWave.test.ts`, `src/game/spawnDirector.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/spawnDirector.ts`. Tests: `src/game/spawnDirector.test.ts`.
