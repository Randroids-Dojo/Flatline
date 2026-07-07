# Art direction

**Status:** done

The Mouse: P.I. for Hire recipe: strict grayscale (no accent colors in play), thick ink outlines with per-frame wobble (line boil, two variants alternating at 10Hz), flat tone fills, halftone dot shading, pie-cut eyes, four-finger gloves, noodle limbs, pear bodies, ink splats instead of blood, spiky ink-star muzzle flashes, and exaggerated squash deaths that end in a puddle.

Everything is drawn procedurally at runtime with canvas 2D in `src/art/`:

- `ink.ts`: shared primitives (boil lines and ellipses, noodles, gloves, pie eyes, halftone, ink stars and splats) on a five-value grayscale palette.
- `textures.ts`: brick, panel, and stone wall themes (rotating by ring), checker floor, plank ceiling, doors, the office door.
- `sprites.ts`: a parameterized rubber-hose character rig rendering all five goons across seven animation frames, plus pickups, crates, projectiles, impacts, explosions.
- `viewmodel.ts`: gloved first-person weapon cels with fire frames.
- `mugshot.ts`: the status-bar face.

Environment rendering: instanced wall cubes with Lambert shading under a hemisphere-plus-directional rig (cheap Doom-style face differentiation), unlit ceiling, black fog closing at 34m for the noir tunnel-vision feel. Enemies and items are fog-affected billboards.

### Build log

- 2026-07-07: complete procedural art layer. Files: `src/art/ink.ts`, `src/art/textures.ts`, `src/art/sprites.ts`, `src/art/viewmodel.ts`, `src/art/mugshot.ts`. PR #pending.
