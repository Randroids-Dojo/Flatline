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

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/spawnDirector.ts`. Tests: `src/game/spawnDirector.test.ts`.
