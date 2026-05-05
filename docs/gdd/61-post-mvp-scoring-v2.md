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

- 2026-05-03: Split out of `GDD.md`. Base scoring (survival, kills, combo) exists in `src/game/scoring.ts`. Close-range bonus, weapon variety bonus, and no-damage streak bonus need verification. Leaderboard row display columns need verification. Status `partial`.
