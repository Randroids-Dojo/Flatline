# Arena Hazards

**Status:** done

Hazards activate as difficulty increases:

- Floor spikes
- Flame vents
- Swinging saw shadows
- Electric puddles
- Falling lights
- Ink pools
- Closing walls, later

Hazards must telegraph before damage.

Example sequence:

1. Floor symbol glows.
2. Audio sting plays.
3. Half-second delay.
4. Hazard activates.

### Build log

- 2026-05-06: Hazards now damage the active enemy at 50% scale when the enemy overlaps a hazard cell (F-013 partial). `src/components/FlatlineGame.tsx` adds `enemyHazardCooldownRef` and `lastHazardDamagedEnemyIdRef`, mirrors the player-hazard cadence (900 ms between ticks) and applies `Math.round(hazardDamageAtPosition * 0.5)` via the existing `damageEnemy` helper. The kill is intentionally not credited to the player score per Q-008. Players can now lure enemies (especially slow brutes) into flame lanes and ink pools for free chip damage. Cross-enemy crossfire (spitter projectile damaging another enemy, brute swing damaging adjacent enemies) still pending multi-enemy AI runtime support. Files: `src/components/FlatlineGame.tsx`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/hazards.ts` ships three hazard types (flame vent lane, ink pool, falling light per `docs/gdd/60-post-mvp-hazards-v1.md`). Tests: `src/game/hazards.test.ts`.
