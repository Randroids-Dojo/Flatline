# Pickup: Score Tokens (optional)

**Status:** done

Optional small floating tokens dropped by enemies.

They vanish quickly and reward aggressive play.

### Build log

- 2026-05-09: Score token v2 ships the spec's "small floating tokens dropped by enemies" form alongside the v1 altar-buff multiplier window. New pure helper `src/game/scoreTokenDrop.ts` exposes per-type drop chance (skitter 0.20, grunt 0.25, spitter 0.30, brute 0.45 so heavier enemies drop more often), `SCORE_TOKEN_TTL_MS = 1500` (vanish quickly per the "reward aggressive play" line), `SCORE_TOKEN_PICKUP_RADIUS_M = 0.9`, `SCORE_TOKEN_BONUS = 25`, plus pure `shouldDropScoreToken(type, rng)`, `tickScoreTokens(tokens, deltaMs)`, `scoreTokenPickupIds(tokens, playerPosition)`, and `scoreTokenBobY(ageMs)` helpers. `src/components/FlatlineGame.tsx` adds `scoreTokenDropsRef` + `scoreTokenDropSeqRef`, spawns a teal `THREE.TorusGeometry` token mesh on death-detection roll, ticks the bob + spin per frame, fades opacity over the TTL, runs a 2D pickup-radius check against player position, awards `SCORE_TOKEN_BONUS` per collected token, and plays the existing `pickupCue('supply')` on collect. Reset on `startRun`, cleanup on unmount. Both v1 (altar buff window) and v2 (dropped tokens) coexist as separate mechanics: the v1 multiplier window enhances kills, the v2 tokens give direct bonus score on collection. Status flips `partial` to `done`. Files: `src/game/scoreTokenDrop.ts`, `src/game/scoreTokenDrop.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD.
- 2026-05-06: Score token quad pickup v1 (F-012). New pure helper `src/game/scoreToken.ts` exposes a 6 s 2x score multiplier window, 70 s rearm. Granted via the central altar pickup branch (gated by `runMs >= 70 s` and `targetPressureForRunMs >= 2`, mutually exclusive with the rage burst on a single pickup). `recordKill` extends with a `scoreMultiplier` option. FlatlineGame plays a 660 / 990 / 1320 Hz triple-sine sparkle on grant and renders a `score-token-pill` HUD entry. The "small floating tokens dropped by enemies" form from the original GDD spec is deferred; the v1 ships a buff window granted by the altar instead. Files: `src/game/scoreToken.ts`, `src/game/scoreToken.test.ts`, `src/game/scoring.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #72.
- 2026-05-03: Split out of `GDD.md`. Not implemented. Score tokens are optional in the GDD and were not part of the pre-spiral build.
