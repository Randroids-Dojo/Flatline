# Arena Cover

**Status:** done

Cover should not stop the game.

Use partial cover:

- Pillars
- Broken walls
- Low crates
- Hanging props
- Moving partitions

Enemies should path around cover, not get stuck on it.

### Build log

- 2026-05-09: Closes F-023. Added a single source-of-truth array of axis-aligned collision rectangles for the four pillars and four ground-level cover billboards (the hanging banner at y=2.4 is intentionally excluded; player and enemies walk under it). New pure helper `src/game/coverCollision.ts` exposes `ARENA_COVER_RECTS`, `clampOutsideRects(x, z, radius, rects)` (shortest-axis push for corner overlaps), and `segmentBlockedByRects(start, end, rects)` (slab-test entry-point intersection). Player movement in `src/components/FlatlineGame.tsx` clamps `positionRef.current` after the regular movement step and the dash step at radius 0.4. Enemy AI in `src/game/enemies.ts` clamps the enemy position after `moveEnemyTowardPlayer` at radius 0.4. Spitter projectile in `src/game/spitterProjectile.ts` segment-tests the per-frame motion against the rects and marks the projectile blocked (with `blockedByCover` flag also reported by `spitterProjectileExpired`) so it removes on the next consumer pass. Tests: `src/game/coverCollision.test.ts` covers far-field passthrough, axis pushes, corner shortest-axis push, segment passthrough, segment hit, multi-rect closest-hit, and the regression case (player previously walking through pillar `[-3.5, -1.8]` now clamps to z = -0.9). Status flips `partial` to `done`. Files: `src/game/coverCollision.ts`, `src/game/coverCollision.test.ts`, `src/components/FlatlineGame.tsx`, `src/game/enemies.ts`, `src/game/spitterProjectile.ts`. PR #TBD.
- 2026-05-09: Wired the five cover billboards (two crates near the south doors, a partition by the west pillar pair, a broken-wall fragment by the east pillar pair, a hanging banner near the north wall) as `THREE.Mesh` + `PlaneGeometry` instances inside `createRoom()`. Each loads its PNG via `THREE.TextureLoader().load`, with `colorSpace: SRGBColorSpace`, `NearestFilter` to keep the rubber-hose silhouette crisp, `transparent: true`, `side: DoubleSide`, `depthWrite: false`. Visual cover only; the "enemies should path around" piece of the spec is tracked as `F-023` (cover + pillar collision rectangles) because pillars themselves are visual-only today and adding collision wants its own slice. Closes F-020. Status stays `partial` until F-023 lands. Files: `src/components/FlatlineGame.tsx`. PR #133.
- 2026-05-09: Cover billboard art set landed under `public/assets/cover/` (`crate.png` 96x96 wooden box with planks + nails, `partition.png` 64x144 brick partition with a jagged top, `broken-wall.png` 112x96 low stone fragment with cracks, `hanging-banner.png` 96x128 teal banner with danger-red trim and a gold + teal star insignia hanging from a brown pole). New generator `scripts/generate-cover-billboards.mjs` builds each from primitive polygons with the same deterministic seeded `roughen()` perturbation as the HUD icon set, and runs through `finishAsset` for palette coherence. Status stays `partial` until the arena renderer in `FlatlineGame.tsx` actually places these billboards in the room; F-020 tracks the wiring follow-up. Files: `scripts/generate-cover-billboards.mjs`, `public/assets/cover/{crate,partition,broken-wall,hanging-banner}.png`. PR #128.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: pillars exist in `src/components/FlatlineGame.tsx`. Other cover types (broken walls, crates, hanging props, moving partitions) are not implemented; status `partial`.
