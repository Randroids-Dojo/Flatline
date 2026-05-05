# Post-MVP: Scoring V2

**Status:** partial

Keep the scoreboard arcade-readable:

- Survival time remains baseline score.
- Kills remain primary score.
- Combo grows from quick consecutive kills.
- Close-range kills add risk bonus.
- Weapon variety adds small bonus.
- No-damage streak adds survival mastery bonus.
- Accuracy remains summary data and a small bonus, not the main score.

Leaderboard rows should eventually display score, time, kills, and accuracy.

### Build log

- 2026-05-04: Added four scoring bonuses to fill the GDD spec. `src/game/scoring.ts` exposes `CLOSE_RANGE_THRESHOLD`, `CLOSE_RANGE_BONUS`, `WEAPON_VARIETY_BONUS`, `NO_DAMAGE_STREAK_BONUS`, and `ACCURACY_BONUS_MULTIPLIER`. `recordKill` now takes a `RecordKillOptions` object (`distance`, `weapon`, `tookDamageSinceLastKill`) and applies +50 close-range, +75 first-kill-per-weapon, +30 no-damage-streak per kill. `accuracyBonus(score)` is folded into `finalScore` (500x accuracy). `src/components/FlatlineGame.tsx` adds a `tookDamageSinceLastKillRef` flag set on hazard ticks and enemy melee landings, threads enemy distance + selected weapon + the flag into `recordKill`, exposes `closeRangeKills` / `weaponsUsed` / `bestNoDamageStreak` on `RunSummary`, and renders three new run-summary rows. Tests in `src/game/scoring.test.ts`. PR #TBD. Status stays `partial` because leaderboard columns for the new tallies are still local-only.
- 2026-05-03: Split out of `GDD.md`. Base scoring (survival, kills, combo) exists in `src/game/scoring.ts`. Close-range bonus, weapon variety bonus, and no-damage streak bonus need verification. Leaderboard row display columns need verification. Status `partial`.
