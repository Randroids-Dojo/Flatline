# Enemy: Spitter (post-MVP)

**Status:** partial

Ranged enemy.

Behavior:

- Keeps distance
- Fires slow projectile
- Has clear windup animation
- Low health

Role:

- Forces dodging
- Breaks circle-strafing comfort

The MVP shipped with Grunt, Skitter, and Brute. Spitter remains a candidate fourth enemy whose ranged role is currently unfilled.

### Build log

- 2026-05-06: Spitter ranged enemy v1 (F-008). New enemy type `spitter` shipped in `src/game/enemies.ts` with `attackKind: 'ranged'`, `attackRange: 7.5`, `attackWindupMs: 720`, `attackDamage: 8`, `projectileSpeed: 8`, `maxHealth: 2`, `scale: 0.85`, tint `#a8e07a`. `EnemyEvent` extends with `enemyProjectileFired`; `tickEnemy` branches at the windup-to-release transition so ranged enemies emit a projectile event instead of resolving melee damage. New pure helper `src/game/spitterProjectile.ts` owns travel, expiry (3 s TTL), and player-collision math. `FlatlineGame.tsx` spawns a teal-green sphere mesh trio per projectile, ticks them each frame, applies damage on hit, plays a 140 ms 620 to 280 Hz square fire cue, and clears on run start / finish / unmount. `enemyWindupCue` adds a spitter triangle-wave windup. `knockback` adds a 1.15 spitter resistance. `enemyTypeForSpawn` rotates spitter at spawn count `% 5 === 0` between brute (% 7) and skitter (% 3). The spitter still uses the grunt sprite atlas as a placeholder until dedicated sprites ship; status stays `partial`. Files: `src/game/enemies.ts`, `src/game/spitterProjectile.ts`, `src/game/spitterProjectile.test.ts`, `src/game/enemyWindupCue.ts`, `src/game/enemyHurtFlash.ts`, `src/game/knockback.ts`, `src/components/FlatlineGame.tsx`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Not implemented in MVP. Adding the spitter would force the player out of pure circle-strafing patterns and re-stress aim tracking; queue as a post-MVP enemy slot.
