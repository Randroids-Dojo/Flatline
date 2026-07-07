# Enemy: Skitter

**Status:** done

Fast low-health pressure enemy that forces tracking and movement.

Note: the GDD originally listed a Spitter (ranged) and a Swarm (fast). In implementation these were consolidated into Skitter, the fast pressure enemy. A pure ranged spitter remains a possible post-MVP enemy.

Behavior:

- Moves erratically
- Low health
- Forces aim tracking
- Closes range quickly

Role:

- Movement test
- Panic
- Ammo tax

### Build log

- 2026-05-06: Skitter dash crossfire (closes F-013). The dash burst from PR #89 now also deals infighting damage when it overlaps another enemy. `tickEnemy` adds a post-move check inside the chase fall-through: when `enemy.type === 'skitter'` and `dashBurstMsRemaining > 0`, scan `nearbyEnemies` and emit `enemyMeleeArcCrossfire` for the first overlap, then zero `dashBurstMsRemaining` so the dash reads as a single-target lunge. The consumer in `src/components/FlatlineGame.tsx` reuses the existing event handler from PR #88, scaling by `INFIGHTING_DAMAGE_SCALE`. Files: `src/game/enemies.ts`, `src/game/enemies.test.ts`. PR #90.
- 2026-05-06: Skitter dash burst. The "Closes range quickly" line was previously only honored through the flat 3.45 m/s chase speed; the skitter never accelerated. New pure helper `src/game/skitterDash.ts` exposes a `shouldStartSkitterDash` predicate, a 380 ms burst duration, a 1.85x speed multiplier, a 1.5 to 4.0 m dashable range, and a 1600 ms rearm cooldown that reuses the existing `attackCooldownMs` field. `EnemyModel` gains a `dashBurstMsRemaining` field; `tickEnemy` decrements it each frame and triggers the burst at the chase fall-through. `moveEnemyTowardPlayer` scales speed by the helper's `skitterDashSpeedScale`. `src/components/FlatlineGame.tsx` lerps the skitter sprite toward white at the start of the burst so the lunge reads as a visual telegraph during the burst itself. Files: `src/game/skitterDash.ts`, `src/game/skitterDash.test.ts`, `src/game/enemies.ts`, `src/game/enemies.test.ts`, `src/components/FlatlineGame.tsx`. PR #89.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/enemies.ts`, atlas at `public/assets/enemies/skitter/skitter.png`, metadata at `public/assets/enemies/skitter/skitter.atlas.json`. Tests: `src/game/enemies.test.ts`.
