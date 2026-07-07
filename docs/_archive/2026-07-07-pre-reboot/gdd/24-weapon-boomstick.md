# Weapon: Boomstick

**Status:** done

Shotgun equivalent.

- High close damage
- Wide spread
- Limited ammo
- Strong knockback
- Great against groups

### Build log

- 2026-05-06: Kill-confirm hitstop weight. Confirmed hits already scaled the simulation `delta` through `hitstopScaleAtElapsedMs`; the kill itself used the same per-weapon style as a chip-damage tick. New helper `hitstopOnKill(base)` in `src/game/hitstop.ts` extends the duration by 1.6x and halves the scale on kill so the freeze reads as a beat rather than a frame. `src/components/FlatlineGame.tsx` `damageEnemyById` selects the kill variant when the post-damage state is `dead`. Per-weapon ordering preserved (peashooter kill stays the snappiest, boomstick kill stays the heaviest). Files: `src/game/hitstop.ts`, `src/game/hitstop.test.ts`, `src/components/FlatlineGame.tsx`. PR #93.
- 2026-05-06: Point-blank damage ramp. The "High close damage" line now reads at point-blank specifically, matching the Doom super-shotgun feel. New pure helper `src/game/boomstickPointBlank.ts` exposes `boomstickPointBlankMultiplier(closestPelletDistanceM)` (1.5x strictly inside `BOOMSTICK_POINT_BLANK_M = 2.0`, 1x at and beyond). The fire path in `src/components/FlatlineGame.tsx` multiplies the boomstick damage entry by the helper before rounding, gated on `weapon === 'boomstick'`. With 6 pellets and 1.5x at face range, point-blank one-shots grunts (3 HP) and skitters (2 HP) but still requires multiple shots on brutes (12 HP). Hard step rather than a curve so the verb reads as "I am close enough, this is the kill shot" not "every meter matters." Files: `src/game/boomstickPointBlank.ts`, `src/game/boomstickPointBlank.test.ts`, `src/components/FlatlineGame.tsx`. PR #85.
- 2026-05-05: Per-weapon enemy knockback (PR #65) now applies on every confirmed hit, not just boomstick. New pure helper `src/game/knockback.ts` exposes `knockbackDistance(weapon, hitDistanceM, enemy)` returning a scalar push distance in meters. Per-weapon close-range / far-range tuning: peashooter `0.15 / 0.08`, inkblaster `0.4 / 0.18`, boomstick `0.9 / 0.2`. Linear falloff across `[0, 18]` meters then clamped at the far value beyond max range. Per-enemy resistance: brute `0.5x`, grunt `1.0x`, skitter `1.3x`. `src/components/FlatlineGame.tsx` replaces the prior boomstick-only `knockEnemyBack(enemy, direction, 0.65)` with a generic call that uses `knockbackDistance(weapon, distance, enemy.type)` for every weapon and orders the knockback application BEFORE `damageCurrentEnemy` so the death animation reads at the shoved location. The inkblaster projectile-hit path in the animate loop now also applies knockback using the player-to-enemy direction at impact. Files: `src/game/knockback.ts`, `src/game/knockback.test.ts`, `src/components/FlatlineGame.tsx`. PR #65.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/weapons.ts`, `src/game/shooting.ts`. Tests: `src/game/weapons.test.ts`, `src/game/shooting.test.ts`.
