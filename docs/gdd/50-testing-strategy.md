# Testing Strategy

**Status:** done

## Unit tests

Test pure logic:

- `tick()`
- Player movement
- Weapon fire
- Raycast hit detection
- Enemy state transitions
- Spawn director budget
- Pickup spawn rules
- Score calculation
- Billboard angle bucket selection
- Sprite animation frame selection
- Deterministic daily seed

## Playwright smoke tests

- Page loads
- Player can start run
- HUD appears
- Pause opens
- Restart works
- Score summary appears after forced death
- Daily route loads same seed

## Manual test checklist

- Can circle-strafe without nausea
- Enemies are readable at distance
- Damage direction is clear
- Pickups are noticeable
- Spawn cues are fair
- Player death feels earned
- Restart is instant
- No major frame drops with 25 enemies

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: vitest under `src/**/*.test.ts` and `tests/api.leaderboard.test.ts`; playwright smoke at `tests/smoke.spec.ts`. Manual checklist items belong to `docs/PLAYTEST.md` going forward.
