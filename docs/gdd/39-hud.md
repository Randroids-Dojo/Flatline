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

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: HUD elements rendered inside `src/components/FlatlineGame.tsx`. Required-list elements (health, ammo, weapon, score, combo, timer, crosshair) appear; damage-direction indicator and full cartoon-title-card visual treatment have not been individually verified. Status `partial`.
