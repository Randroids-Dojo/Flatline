# Collision

**Status:** done

MVP collision is simple:

- Player is a circle/capsule on XZ plane.
- Enemies are circles.
- Walls are line segments or boxes.
- Projectiles are spheres/circles.
- No vertical gameplay in MVP.

This keeps it Doom-like and easier to tune.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: collision math is colocated with movement and shooting (`src/game/movement.ts`, `src/game/shooting.ts`). No dedicated `collision.ts` module; status `done` because the behavior ships and is tested.
