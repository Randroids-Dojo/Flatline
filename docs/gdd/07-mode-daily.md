# Mode: Daily Room

**Status:** done

A deterministic daily seed.

All players get the same:

- Room layout
- Spawn rules
- Wave order
- Pickup timing
- Hazard schedule

Leaderboard resets daily.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `app/arena/daily/page.tsx`, `src/game/dailyArena.ts`, `src/lib/dailySeed.ts`. Daily leaderboard scope wired through `app/api/leaderboard/route.ts`.
