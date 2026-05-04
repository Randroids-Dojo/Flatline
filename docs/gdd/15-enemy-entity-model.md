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

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/enemies.ts`. Tests: `src/game/enemies.test.ts`.
