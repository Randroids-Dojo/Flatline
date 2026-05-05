# Game Loop Architecture

**Status:** done

Follow the VibeRacer-style split:

- React owns lifecycle and UI.
- Three.js owns scene rendering.
- `tick()` owns pure game simulation.
- RAF loop coordinates input, tick, render, and HUD updates.

Proposed tick signature:

```ts
type TickResult = {
  state: GameState
  events: GameEvent[]
}

function tick(
  state: GameState,
  input: InputState,
  dtMs: number,
  nowMs: number,
  config: GameConfig
): TickResult
```

State model:

```ts
type GameState = {
  phase: 'countdown' | 'running' | 'dead' | 'paused'
  nowMs: number
  runStartMs: number
  rngSeed: string

  player: PlayerState
  enemies: Enemy[]
  projectiles: Projectile[]
  pickups: Pickup[]
  hazards: Hazard[]
  score: ScoreState
  director: DirectorState
  arena: ArenaState
}
```

Three.js scene:

- Room geometry
- Floor
- Walls
- Doors
- Props
- Lights
- Fog
- Billboard enemy planes
- Projectile meshes or sprites
- Pickup sprites
- Weapon overlay rendered in React or Three.js overlay scene

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: tick + render orchestration in `src/components/FlatlineGame.tsx`. Pure modules under `src/game/` keep simulation testable; `src/components/` owns React lifecycle and Three.js scene.
