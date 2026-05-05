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

- 2026-05-03: Damage-direction indicator landed. Enemy melee hits now spawn a red conic-gradient arc at the screen edge pointing toward the attacker, fading over 720 ms. Files: `src/game/damageDirection.ts`, `src/game/damageDirection.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #TBD. Cartoon-title-card visual treatment for HUD pills remains unaudited; status stays `partial`.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: HUD elements rendered inside `src/components/FlatlineGame.tsx`. Required-list elements (health, ammo, weapon, score, combo, timer, crosshair) appear; damage-direction indicator and full cartoon-title-card visual treatment have not been individually verified. Status `partial`.
