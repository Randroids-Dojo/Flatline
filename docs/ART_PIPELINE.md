# Flatline Visual Asset Pipeline

This document turns GDD sections 7, 8, 25, 26, and 29 into implementation specs for replacing placeholder art without disrupting the working game loop.

## Current State

- The runtime already supports 8 billboard angle buckets through `src/game/billboard.ts`.
- Atlas metadata is parsed by `src/game/spriteAtlas.ts`.
- The first Grunt atlas is a transparent generated PNG at `public/assets/enemies/grunt/grunt.png`.
- Skitter and Brute reuse the Grunt atlas through tint and scale in `src/game/enemies.ts`.
- Weapon foreground art uses transparent generated PNG sprites in `public/assets/weapons/`.
- Practice Mode now provides the correct validation surface for enemy type, weapon, ammo, damage, and debug overlay tuning.

## Art Direction Decision

Use the GDD recommended style for the first polished pass:

- Mostly grayscale character bodies.
- Thick off-white outline.
- Teal only for readable eyes, active interactable accents, or special attack tells.
- Red-orange only for damage, hurt frames, hazards, and danger tells.
- Clean silhouettes over interior detail.
- Bouncy, simple pose changes rather than high-frame animation.

The first polished asset should be the Grunt because it is centered at run start, used in every mode, and already has the renderer and atlas path.

## Enemy Atlas Contract

File structure:

```text
public/assets/enemies/grunt/grunt.png
public/assets/enemies/grunt/grunt.atlas.json
```

Keep the existing JSON shape:

```ts
type SpriteAtlas = {
  image: string
  imageWidth: number
  imageHeight: number
  clips: AnimationClip[]
}
```

Required angles:

- `front`
- `frontRight`
- `right`
- `backRight`
- `back`
- `backLeft`
- `left`
- `frontLeft`

Required animations for Grunt V1:

- `idle`: 4 frames per angle, loop true, 110 to 140 ms per frame.
- `hurt`: 2 frames per angle, loop false, 70 to 100 ms per frame.
- `death`: 4 frames per angle, loop false, 90 to 140 ms per frame.

Deferred animations:

- Walk.
- Attack windup.
- Attack release.

These need a small code expansion because `AnimationName` currently supports only `idle`, `hurt`, and `death`.

Recommended atlas dimensions:

- Cell size: 192 by 192.
- Columns: 8 angles.
- Rows: one row per animation frame strip.
- Target PNG: 1536 wide by 1920 high for 10 total rows.

The first implement slice may use fewer rows if it keeps the contract explicit in `grunt.atlas.json`.

## Authoring Steps

1. Draw the Grunt turnaround in 5 primary views: front, frontRight, right, backRight, back.
2. Mirror right-side views to produce backLeft, left, and frontLeft unless the silhouette reads incorrectly.
3. Author idle frames first and load them in Practice Mode.
4. Add hurt and death frames only after idle reads correctly in the room.
5. Export transparent PNG with no cell grid or text labels.
6. Update `grunt.atlas.json` with exact pixel rectangles and durations.
7. Run `npm run test -- spriteAtlas billboard`.
8. Run `npm run test:e2e` and capture the practice route with billboard debug enabled.

## Validation Checklist

- The enemy reads at spawn distance without relying on text.
- The front angle is readable in the first second of a run.
- The side angle does not look like a flat card when circling.
- Hurt frames are visually distinct from idle.
- Death frame stays legible on the floor.
- Teal and red accents remain reserved for interactions and danger.
- The atlas has no labels, grid lines, or transparent padding that makes the plane feel too large.
- The browser smoke still confirms a nonblank canvas and a visible first enemy.

## Implementation Slices

### Slice A: Atlas Validation

Add a pure validation helper for `SpriteAtlas` that verifies:

- Every required angle exists for every required animation.
- Each frame rectangle fits inside `imageWidth` and `imageHeight`.
- Every frame has positive width, height, and duration.
- No clip has an empty frame list.

Tests should cover missing clips, out-of-bounds frames, and valid Grunt metadata.

### Slice B: Polished Grunt Atlas V1

Replace the placeholder Grunt SVG with the first polished transparent PNG and update metadata.

Status: complete.

Keep scope tight:

- Do not add a second enemy atlas in this slice.
- Do not change enemy combat behavior.
- Do not refactor the renderer beyond what the atlas requires.

### Slice C: Enemy Atlas Per Type

After Grunt works, add distinct atlas paths per enemy type:

- `public/assets/enemies/skitter/skitter.png`
- `public/assets/enemies/skitter/skitter.atlas.json`
- `public/assets/enemies/brute/brute.png`
- `public/assets/enemies/brute/brute.atlas.json`

This slice should remove the current tint-and-scale-only art reuse from the coverage gap.

### Slice D: Weapon Foreground Sprites

Replace `.weapon` CSS geometry with authored sprites for:

- Peashooter.
- Boomstick.
- Inkblaster.

Minimum weapon states:

- Idle.
- Fire flash.

Future states:

- Cooldown.
- Reload, only if a later weapon requires it.

Status: complete for idle and fire states.

## Open Implementation Notes

- Generated bitmap art is acceptable for internal iteration, but the committed asset should be a normal PNG plus atlas JSON.
- Keep the source prompt or source art notes in a docs file, not in the runtime bundle.
- Do not add a paid asset service or production environment variables.
- Keep committed assets small enough for Vercel and browser startup. Prefer one enemy PNG under 2 MB for the first pass.
