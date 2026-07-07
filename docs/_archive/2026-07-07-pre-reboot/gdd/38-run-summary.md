# End-of-Run Summary

**Status:** done

Show:

- Final score
- Survival time
- Kills
- Accuracy
- Best combo
- Favorite weapon
- Damage taken
- Personal best comparison
- Leaderboard rank

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: run summary UI in `src/components/FlatlineGame.tsx`. Leaderboard rank pulled via `src/lib/sharedLeaderboard.ts` with `src/lib/leaderboard.ts` local fallback.
