# Enemy Entity Model

**Status:** done

Each enemy has:

```ts
type Enemy = {
  id: string
  type: EnemyType
  position: Vector3Like
  velocity: Vector3Like
  radius: number
  health: number
  state: EnemyState
  facingAngle: number
  animation: AnimationName
  animationTimeMs: number
  attackCooldownMs: number
  crossfireStaggerMs: number
  targetId: 'player'
}
```

### Build log

- 2026-05-08: F-016 v2, crossfire pursuit. `EnemyModel` adds `crossfirePursuitMs` and `crossfirePursuitTargetId`. `tickEnemy` accepts an optional `pursuitTarget: PursuitTarget` and, while pursuit is active and a matching live target is supplied, swaps the chase target so movement, attack range, attack windup / release, and skitter dash trigger all run against the source enemy instead of the player. Attack release emits a new `enemyAttackEnemy { sourceId, sourceType, targetEnemyId, damage }` event so the consumer can apply infighting-scaled damage without crediting the player. `SpitterProjectile` gains `sourceEnemyId` so spitter projectile crossfire arms the same retarget through `applyCrossfireRetarget` (renamed from `applyCrossfireStagger`, with the v1 name kept as an alias). Cascade prevention: `applyCrossfireRetarget` is a no-op when the victim already has an active pursuit. The `enemyAttackEnemy` consumer in `src/components/FlatlineGame.tsx` ends the attacker's pursuit on hit so the retarget cycle is one attack, then back to the player. Closes F-016. Files: `src/game/enemies.ts`, `src/game/enemies.test.ts`, `src/game/spitterProjectile.ts`, `src/game/spitterProjectile.test.ts`, `src/components/FlatlineGame.tsx`. PR #100.
- 2026-05-07: F-016 v1, crossfire stagger. `EnemyModel` gains a `crossfireStaggerMs` countdown. New pure helper `applyCrossfireStagger(enemy, source, roll)` returns the enemy with `crossfireStaggerMs = 700` and `facingAngle` pointing at the source when `roll < CROSSFIRE_STAGGER_PROBABILITY` (0.35); otherwise the enemy is unchanged. `tickEnemy` decrements the timer each tick and, while staggered in the chase state, freezes velocity and skips chase / attack progression so the victim visibly hesitates and faces the source. The brute melee arc and skitter dash crossfire handlers in `src/components/FlatlineGame.tsx` call the helper with `Math.random()` after applying infighting damage, so the v1 redirect is "stop chasing, face the source" rather than full pursuit. No player kill credit because the existing crossfire path already excludes infighting damage from the player score path. Files: `src/game/enemies.ts`, `src/game/enemies.test.ts`, `src/components/FlatlineGame.tsx`. PR #99.
- 2026-05-06: `tickEnemy` gains an optional `nearbyEnemies: readonly NearbyEnemy[]` parameter and a new `enemyMeleeArcCrossfire { sourceId, sourceType, targetEnemyId, damage }` event variant. On the windup-to-release transition for any non-ranged enemy, the function scans the nearby list and emits a crossfire event for each candidate within `attackRange + candidate.radius`. The consumer in `src/components/FlatlineGame.tsx` builds the alive non-self list once per frame, threads it through every tickEnemy call, and applies 50% scaled damage (via the existing `INFIGHTING_DAMAGE_SCALE` constant) without crediting the player. Closes the brute-swing portion of F-013. Files: `src/game/enemies.ts`, `src/game/enemies.test.ts`, `src/components/FlatlineGame.tsx`. PR #88.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/enemies.ts`. Tests: `src/game/enemies.test.ts`.
