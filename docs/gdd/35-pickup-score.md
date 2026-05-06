# Pickup: Score Tokens (optional)

**Status:** partial

Optional small floating tokens dropped by enemies.

They vanish quickly and reward aggressive play.

### Build log

- 2026-05-06: Score token quad pickup v1 (F-012). New pure helper `src/game/scoreToken.ts` exposes a 6 s 2x score multiplier window, 70 s rearm. Granted via the central altar pickup branch (gated by `runMs >= 70 s` and `targetPressureForRunMs >= 2`, mutually exclusive with the rage burst on a single pickup). `recordKill` extends with a `scoreMultiplier` option. FlatlineGame plays a 660 / 990 / 1320 Hz triple-sine sparkle on grant and renders a `score-token-pill` HUD entry. The "small floating tokens dropped by enemies" form from the original GDD spec is deferred; the v1 ships a buff window granted by the altar instead. Files: `src/game/scoreToken.ts`, `src/game/scoreToken.test.ts`, `src/game/scoring.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #72.
- 2026-05-03: Split out of `GDD.md`. Not implemented. Score tokens are optional in the GDD and were not part of the pre-spiral build.
