# Billboard Rendering

**Status:** done

Each enemy renders as:

- One Three.js plane
- Transparent texture material
- Sprite atlas frame selected per tick
- Billboard rotation facing the camera
- Angle bucket selected from player/enemy relative direction

## Billboard facing rule

The visible plane should face the camera. But the selected drawing should depend on the enemy's facing direction relative to the player.

That means:

- Plane rotation is camera-facing.
- Sprite angle is enemy-facing-aware.

This prevents the enemy from visually turning into a thin card.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/billboard.ts`. Test coverage: `src/game/billboard.test.ts`.
