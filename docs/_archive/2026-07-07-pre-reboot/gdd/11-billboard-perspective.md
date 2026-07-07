# Billboard Perspective

**Status:** done

Enemies are flat drawings standing in a 3D room.

The trick:

- The enemy is a flat rectangle.
- The rectangle always turns to face the player.
- The game picks the drawing that matches where the player is standing.

Example:

```text
Player in front of enemy  -> show front drawing
Player beside enemy       -> show side drawing
Player behind enemy       -> show back drawing
```

So the enemy is not really 3D. It is a stack of cartoon drawings pretending to be 3D.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/billboard.ts`, `src/game/spriteAtlas.ts`. Tests: `src/game/billboard.test.ts`, `src/game/spriteAtlas.test.ts`.
