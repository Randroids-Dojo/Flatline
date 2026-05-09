# Arena Cover

**Status:** partial

Cover should not stop the game.

Use partial cover:

- Pillars
- Broken walls
- Low crates
- Hanging props
- Moving partitions

Enemies should path around cover, not get stuck on it.

### Build log

- 2026-05-09: Wired the five cover billboards (two crates near the south doors, a partition by the west pillar pair, a broken-wall fragment by the east pillar pair, a hanging banner near the north wall) as `THREE.Mesh` + `PlaneGeometry` instances inside `createRoom()`. Each loads its PNG via `THREE.TextureLoader().load`, with `colorSpace: SRGBColorSpace`, `NearestFilter` to keep the rubber-hose silhouette crisp, `transparent: true`, `side: DoubleSide`, `depthWrite: false`. Visual cover only; the "enemies should path around" piece of the spec is tracked as `F-023` (cover + pillar collision rectangles) because pillars themselves are visual-only today and adding collision wants its own slice. Closes F-020. Status stays `partial` until F-023 lands. Files: `src/components/FlatlineGame.tsx`. PR #TBD.
- 2026-05-09: Cover billboard art set landed under `public/assets/cover/` (`crate.png` 96x96 wooden box with planks + nails, `partition.png` 64x144 brick partition with a jagged top, `broken-wall.png` 112x96 low stone fragment with cracks, `hanging-banner.png` 96x128 teal banner with danger-red trim and a gold + teal star insignia hanging from a brown pole). New generator `scripts/generate-cover-billboards.mjs` builds each from primitive polygons with the same deterministic seeded `roughen()` perturbation as the HUD icon set, and runs through `finishAsset` for palette coherence. Status stays `partial` until the arena renderer in `FlatlineGame.tsx` actually places these billboards in the room; F-020 tracks the wiring follow-up. Files: `scripts/generate-cover-billboards.mjs`, `public/assets/cover/{crate,partition,broken-wall,hanging-banner}.png`. PR #128.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: pillars exist in `src/components/FlatlineGame.tsx`. Other cover types (broken walls, crates, hanging props, moving partitions) are not implemented; status `partial`.
