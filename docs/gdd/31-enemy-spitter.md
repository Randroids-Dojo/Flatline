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

- 2026-05-06: Spitter charge windup glow. The "clear windup animation" line was previously only telegraphed through audio; the spitter visually read as a tinted grunt during the 720 ms windup. New pure helper `src/game/spitterCharge.ts` exposes `spitterChargeIntensity(state, animationTimeMs, windupMs)` returning a 0..1 ease-in ramp during `attackWindup` (slow at start, peak just before release). `src/components/FlatlineGame.tsx` lerps the spitter sprite tint from its base `#a8e07a` toward `#f0ffd0` (hot accent) by the helper's intensity inside the animate loop, gated on `enemy.type === 'spitter' && enemy.state === 'attackWindup'`. The hurt flash continues to take priority through the existing branch order. Status stays `partial` because dedicated sprite atlases are still placeholders. Files: `src/game/spitterCharge.ts`, `src/game/spitterCharge.test.ts`, `src/components/FlatlineGame.tsx`. PR #87.
- 2026-05-06: Spitter ranged enemy v1 (F-008). New enemy type `spitter` shipped in `src/game/enemies.ts` with `attackKind: 'ranged'`, `attackRange: 7.5`, `attackWindupMs: 720`, `attackDamage: 8`, `projectileSpeed: 8`, `maxHealth: 2`, `scale: 0.85`, tint `#a8e07a`. `EnemyEvent` extends with `enemyProjectileFired`; `tickEnemy` branches at the windup-to-release transition so ranged enemies emit a projectile event instead of resolving melee damage. New pure helper `src/game/spitterProjectile.ts` owns travel, expiry (3 s TTL), and player-collision math. `FlatlineGame.tsx` spawns a teal-green sphere mesh trio per projectile, ticks them each frame, applies damage on hit, plays a 140 ms 620 to 280 Hz square fire cue, and clears on run start / finish / unmount. `enemyWindupCue` adds a spitter triangle-wave windup. `knockback` adds a 1.15 spitter resistance. `enemyTypeForSpawn` rotates spitter at spawn count `% 5 === 0` between brute (% 7) and skitter (% 3). The spitter still uses the grunt sprite atlas as a placeholder until dedicated sprites ship; status stays `partial`. Files: `src/game/enemies.ts`, `src/game/spitterProjectile.ts`, `src/game/spitterProjectile.test.ts`, `src/game/enemyWindupCue.ts`, `src/game/enemyHurtFlash.ts`, `src/game/knockback.ts`, `src/components/FlatlineGame.tsx`. PR #68.
- 2026-05-03: Split out of `GDD.md`. Not implemented in MVP. Adding the spitter would force the player out of pure circle-strafing patterns and re-stress aim tracking; queue as a post-MVP enemy slot.
