# Post-MVP: Practice Mode

**Status:** done

Practice mode does not submit scores.

Required controls:

- Enemy type selection.
- Spawn rate selection.
- Damage on or off.
- Infinite ammo toggle.
- Billboard debug overlays.
- Room state freeze.

This mode is for tuning and art validation, not the default player experience.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `app/arena/practice/page.tsx`, tuning hooks via `src/game/spawnDirector.ts`. Score submission disabled in the practice route.
