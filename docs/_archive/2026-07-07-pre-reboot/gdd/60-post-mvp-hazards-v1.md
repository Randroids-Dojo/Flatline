# Post-MVP: Hazard Set V1

**Status:** done

Hazards should be simple, telegraphed, and score-relevant:

- Flame vent lane: line hazard from wall to center.
- Ink pool: circular floor hazard that slows and damages.
- Falling light: delayed impact marker with burst damage.

Hazard rules:

- Telegraph before damage.
- Never spawn directly under the player without warning.
- Scale frequency with director pressure.
- Reward kills or movement that happen near active hazards.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/hazards.ts`. Tests: `src/game/hazards.test.ts`.
