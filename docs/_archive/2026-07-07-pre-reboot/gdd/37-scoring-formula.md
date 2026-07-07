# Scoring Formula

**Status:** done

```text
score =
  killScore
+ survivalBonus
+ comboBonus
+ accuracyBonus
+ closeCallBonus
+ hazardKillBonus
```

## Combo

Combo increases when killing enemies quickly.

Combo breaks when:

- Too much time passes
- Player takes damage
- Player misses too many shots, optional

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/scoring.ts`. Tests: `src/game/scoring.test.ts`.
