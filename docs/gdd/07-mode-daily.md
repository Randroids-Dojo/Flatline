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

- 2026-05-07: Daily streak return hook. `src/lib/dailyStreak.ts` stores local daily participation by UTC date, `src/components/FlatlineGame.tsx` updates it when a daily run ends and shows it in the daily schedule panel, and `src/lib/dailyStreak.test.ts` covers first run, same-day retry, next-day continuation, and missed-day reset.
- 2026-05-07: Daily twist modifiers. Daily seeds now choose one deterministic modifier from `src/game/dailyArena.ts`: score rush, pressure wave, thin supplies, or clean kills. The modifier is shown in the daily schedule panel before the run, adjusts spawn cadence, supply cooldown, or kill-score multiplier inside `src/components/FlatlineGame.tsx`, and is covered by `src/game/dailyArena.test.ts`.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `app/arena/daily/page.tsx`, `src/game/dailyArena.ts`, `src/lib/dailySeed.ts`. Daily leaderboard scope wired through `app/api/leaderboard/route.ts`.
