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
  targetId: 'player'
}
```

### Build log

- 2026-05-06: `tickEnemy` gains an optional `nearbyEnemies: readonly NearbyEnemy[]` parameter and a new `enemyMeleeArcCrossfire { sourceId, sourceType, targetEnemyId, damage }` event variant. On the windup-to-release transition for any non-ranged enemy, the function scans the nearby list and emits a crossfire event for each candidate within `attackRange + candidate.radius`. The consumer in `src/components/FlatlineGame.tsx` builds the alive non-self list once per frame, threads it through every tickEnemy call, and applies 50% scaled damage (via the existing `INFIGHTING_DAMAGE_SCALE` constant) without crediting the player. Closes the brute-swing portion of F-013. Files: `src/game/enemies.ts`, `src/game/enemies.test.ts`, `src/components/FlatlineGame.tsx`. PR #88.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/enemies.ts`. Tests: `src/game/enemies.test.ts`.
