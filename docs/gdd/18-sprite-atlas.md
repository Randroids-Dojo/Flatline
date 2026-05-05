# Sprite Atlas Format

**Status:** done

Use sprite sheets.

Recommended structure:

```text
public/assets/enemies/grunt/grunt.atlas.json
public/assets/enemies/grunt/grunt.png
```

Atlas metadata:

```ts
type SpriteFrame = {
  x: number
  y: number
  w: number
  h: number
  durationMs: number
}

type AnimationClip = {
  name: string
  angle: 'front' | 'frontRight' | 'right' | 'backRight' | 'back' | 'backLeft' | 'left' | 'frontLeft'
  frames: SpriteFrame[]
  loop: boolean
}
```

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: atlas loader in `src/game/spriteAtlas.ts`, atlases under `public/assets/enemies/{grunt,skitter,brute}/`. Tests: `src/game/spriteAtlas.test.ts`.
