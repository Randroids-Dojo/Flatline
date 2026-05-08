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

- 2026-05-07: F-016 v1, crossfire stagger. `EnemyModel` gains a `crossfireStaggerMs` countdown. New pure helper `applyCrossfireStagger(enemy, source, roll)` returns the enemy with `crossfireStaggerMs = 700` and `facingAngle` pointing at the source when `roll < CROSSFIRE_STAGGER_PROBABILITY` (0.35); otherwise the enemy is unchanged. `tickEnemy` decrements the timer each tick and, while staggered in the chase state, freezes velocity and skips chase / attack progression so the victim visibly hesitates and faces the source. The brute melee arc and skitter dash crossfire handlers in `src/components/FlatlineGame.tsx` call the helper with `Math.random()` after applying infighting damage, so the v1 redirect is "stop chasing, face the source" rather than full pursuit. No player kill credit because the existing crossfire path already excludes infighting damage from the player score path. Files: `src/game/enemies.ts`, `src/game/enemies.test.ts`, `src/components/FlatlineGame.tsx`. PR #99.
- 2026-05-06: `tickEnemy` gains an optional `nearbyEnemies: readonly NearbyEnemy[]` parameter and a new `enemyMeleeArcCrossfire { sourceId, sourceType, targetEnemyId, damage }` event variant. On the windup-to-release transition for any non-ranged enemy, the function scans the nearby list and emits a crossfire event for each candidate within `attackRange + candidate.radius`. The consumer in `src/components/FlatlineGame.tsx` builds the alive non-self list once per frame, threads it through every tickEnemy call, and applies 50% scaled damage (via the existing `INFIGHTING_DAMAGE_SCALE` constant) without crediting the player. Closes the brute-swing portion of F-013. Files: `src/game/enemies.ts`, `src/game/enemies.test.ts`, `src/components/FlatlineGame.tsx`. PR #88.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/enemies.ts`. Tests: `src/game/enemies.test.ts`.
