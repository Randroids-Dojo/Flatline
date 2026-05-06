# Weapon: Boomstick

**Status:** done

Shotgun equivalent.

- High close damage
- Wide spread
- Limited ammo
- Strong knockback
- Great against groups

### Build log

- 2026-05-05: Per-weapon enemy knockback now applies on every confirmed hit, not just boomstick. New pure helper `src/game/knockback.ts` exposes `knockbackDistance(weapon, hitDistanceM, enemy)` returning a scalar push distance in meters. Per-weapon close-range / far-range tuning: peashooter `0.15 / 0.08`, inkblaster `0.4 / 0.18`, boomstick `0.9 / 0.2`. Linear falloff across `[0, 18]` meters then clamped at the far value beyond max range. Per-enemy resistance: brute `0.5x`, grunt `1.0x`, skitter `1.3x`. `src/components/FlatlineGame.tsx` replaces the prior boomstick-only `knockEnemyBack(enemy, direction, 0.65)` with a generic call that uses `knockbackDistance(weapon, distance, enemy.type)` for every weapon and orders the knockback application BEFORE `damageCurrentEnemy` so the death animation reads at the shoved location. The inkblaster projectile-hit path in the animate loop now also applies knockback using the player-to-enemy direction at impact. Files: `src/game/knockback.ts`, `src/game/knockback.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/weapons.ts`, `src/game/shooting.ts`. Tests: `src/game/weapons.test.ts`, `src/game/shooting.test.ts`.
