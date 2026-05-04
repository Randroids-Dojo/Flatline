# Arena Hazards

**Status:** done

Hazards activate as difficulty increases:

- Floor spikes
- Flame vents
- Swinging saw shadows
- Electric puddles
- Falling lights
- Ink pools
- Closing walls, later

Hazards must telegraph before damage.

Example sequence:

1. Floor symbol glows.
2. Audio sting plays.
3. Half-second delay.
4. Hazard activates.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/hazards.ts` ships three hazard types (flame vent lane, ink pool, falling light per `docs/gdd/60-post-mvp-hazards-v1.md`). Tests: `src/game/hazards.test.ts`.
