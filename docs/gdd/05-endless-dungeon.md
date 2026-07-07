# Endless dungeon generation

**Status:** done

The world is an infinite grid of 24x24-cell chunks, 2m cells, 3m walls. A chunk is generated deterministically from `(runSeed, cx, cz)` the moment it is needed, so the dungeon streams forever with no global state.

Per chunk: 2 to 6 non-overlapping rooms, chained with L-corridors plus a closing loop. Cross-chunk connectivity is guaranteed by shared edge gateways: the opening position on the edge between two chunks is derived from the seed of that edge, so both neighbors carve to the same cell. Every non-solid cell in a chunk is reachable (unit-tested by flood fill).

The origin chunk carves a fixed 8x8 office room at its center: the safe starting room, no enemies.

Difficulty scales by ring (Chebyshev distance from origin, shown as "blocks out"): enemy count and mix harden with the ring. Wall texture theme also rotates by ring.

35% of non-origin chunks with 3+ rooms convert their smallest room into a locked vault (treasure hoard) whose key spawns elsewhere in the same chunk.

Meshes are built lazily per chunk (instanced wall boxes plus floor and ceiling planes) within 2 chunks of the player and dropped past 3; chunk data is kept.

### Build log

- 2026-07-07: chunked generator with gateways, vaults, spawns, and reachability tests. Files: `src/game/dungeon.ts`, `src/game/dungeon.test.ts`. PR #pending.
