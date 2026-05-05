# Enemy: Skitter

**Status:** done

Fast low-health pressure enemy that forces tracking and movement.

Note: the GDD originally listed a Spitter (ranged) and a Swarm (fast). In implementation these were consolidated into Skitter, the fast pressure enemy. A pure ranged spitter remains a possible post-MVP enemy.

Behavior:

- Moves erratically
- Low health
- Forces aim tracking
- Closes range quickly

Role:

- Movement test
- Panic
- Ammo tax

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/enemies.ts`, atlas at `public/assets/enemies/skitter/skitter.png`, metadata at `public/assets/enemies/skitter/skitter.atlas.json`. Tests: `src/game/enemies.test.ts`.
