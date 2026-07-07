# Billboard Rendering Details

**Status:** done

## Enemy visual component

```ts
type EnemyRenderHandle = {
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  currentFrameKey: string
}
```

## Per-frame render update

Each RAF frame:

1. For each enemy, find current animation.
2. Calculate angle bucket.
3. Calculate frame index.
4. Update UVs or material map frame.
5. Rotate plane to face camera.
6. Scale plane based on enemy type.
7. Apply hurt flash or shadow.

## Sprite atlas strategy

Preferred:

- One texture atlas per enemy type.
- Update UV coordinates instead of swapping texture objects.
- Keep material count low.
- Preload atlases before countdown.

Avoid:

- One image file per frame
- Creating materials during gameplay
- Allocating vectors in inner loops

## Lighting style

Use mostly unlit materials for characters. Reason: sprites already contain drawn lighting; real 3D lighting can make them look muddy; unlit keeps them readable.

But add fake depth:

- Blob shadow under enemies
- Distance fog
- Contact shadow circle
- Slight brightness falloff by distance
- Damage flash overlay

### Build log

- 2026-05-03: Hurt flash now lerps the enemy material toward white (or a warm tint for the brute) on damage. Files: `src/game/enemyHurtFlash.ts`, `src/game/enemyHurtFlash.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/billboard.ts`, `src/game/spriteAtlas.ts`, scene wiring in `src/components/FlatlineGame.tsx`.
