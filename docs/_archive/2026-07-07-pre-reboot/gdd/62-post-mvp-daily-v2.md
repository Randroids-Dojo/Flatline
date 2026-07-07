# Post-MVP: Daily Room V2

**Status:** done

Daily mode should be deterministic beyond the date string:

- Seeded spawn sequence.
- Seeded pickup schedule.
- Seeded hazard schedule.
- Fixed room state pattern.
- Daily leaderboard uses the same seed for everyone.

The daily route should show the seed and submit only to the daily board by default.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/dailyArena.ts`, `src/lib/dailySeed.ts`, daily route `app/arena/daily/page.tsx`. Daily leaderboard scope wired through `app/api/leaderboard/route.ts`. Tests: `src/game/dailyArena.test.ts`, `src/lib/dailySeed.test.ts`.
