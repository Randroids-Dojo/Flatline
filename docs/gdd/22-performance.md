# Performance budget

**Status:** partial

Targets: 60fps on a mid desktop GPU at 1080p, no per-frame allocations in the hot loop beyond effect churn, chunk generation under 5ms.

Current levers: instanced wall meshes per chunk, lazy mesh build within 2 chunks and drop past 3, enemy AI frozen past 30m, sprite materials cached per texture, film overlay at 12Hz, HUD snapshot at 8Hz, corpse decals capped at 50.

Not yet measured: long-session memory (textures are not disposed on run restart), enemy population growth on marathon runs. See F-026 and F-027.

### Build log

- 2026-07-07: initial budget and levers. Files: `src/components/FlatlineGame.tsx`. PR #pending.
