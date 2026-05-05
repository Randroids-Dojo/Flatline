# HUD

**Status:** partial

## In-run HUD

Required:

- Health
- Ammo
- Current weapon
- Score
- Combo
- Survival timer
- Damage direction indicator
- Crosshair

Optional:

- Enemy pressure meter
- Wave intensity label
- Pickup indicators
- Personal best ghost marker

## Visual style

HUD should feel like an old cartoon title card mixed with a shooter HUD.

Examples:

- Wobbly text
- Ink splatter damage frame
- Rubber-hose icons
- Film grain
- Slight jitter, but not enough to hurt readability

### Build log

- 2026-05-04: Cartoon-title-card HUD treatment first pass. New pure helper `src/game/hudJitter.ts` exposes `hudPillWobbleAmplitudePx(playerHealth)`, `hudPillWobbleRotationDeg(playerHealth)`, `hudPillWobblePeriodMs()`, `hudGrainOpacity(playerHealth)`, and `hudSplatterIntensity(playerHealth)`. Amplitudes scale up as health drops (0.55 px / 0.32 deg at full health, capped at 1.2 px / 0.5 deg at zero so legibility is preserved). Period stays a constant 1700 ms so all pills wobble in sync; `nth-child(2n)` reverses direction and `nth-child(3n)` adds a 220 ms delay to break monotony. Two new overlays render only while a run is active: `.hud-grain` is a layered radial-gradient noise texture (3 px and 5 px tiles) blending in `mix-blend-mode: overlay` with opacity 0.06 baseline rising to 0.22 at zero health, animated by a `steps(2)` 480 ms drift on the background-position. `.hud-splatter` is a six-radial-gradient ink frame (four corner blots + top / bottom edge falloff) whose opacity scales with `hudSplatterIntensity` (0 above 60 HP, ramps linearly to peak 0.85 at 0 HP). `prefers-reduced-motion: reduce` disables the wobble and grain drift. Files: `src/game/hudJitter.ts`, `src/game/hudJitter.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #TBD. Status stays `partial` until rubber-hose icons and per-pill ink-bleed borders are also audited.
- 2026-05-03: Damage-direction indicator landed. Enemy melee hits now spawn a red conic-gradient arc at the screen edge pointing toward the attacker, fading over 720 ms. Files: `src/game/damageDirection.ts`, `src/game/damageDirection.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #TBD. Cartoon-title-card visual treatment for HUD pills remains unaudited; status stays `partial`.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: HUD elements rendered inside `src/components/FlatlineGame.tsx`. Required-list elements (health, ammo, weapon, score, combo, timer, crosshair) appear; damage-direction indicator and full cartoon-title-card visual treatment have not been individually verified. Status `partial`.
