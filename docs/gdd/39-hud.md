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

- 2026-05-06: Best-local-score line on the start panel. The personal best was previously buried behind the run summary or the local leaderboard list. New helper `bestLocalScore(entries)` in `src/lib/leaderboard.ts` exposes the max score across the local leaderboard or `null` when empty. `src/components/FlatlineGame.tsx` renders a "Best <score>" line above the run summary inside the start panel, gated on `!isPractice && bestLocalScore(leaderboard) !== null`. CSS rule `.start-panel p.best-score` in `app/globals.css` formats the line as a small letter-spaced label plus a larger gold value. Files: `src/lib/leaderboard.ts`, `src/lib/leaderboard.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #92.
- 2026-05-06: Kill-confirm score floaters. The required-list "Score" pill at the top of the HUD was the only kill-confirm signal; the player had to break aim to read the bonus. New pure helper `src/game/scoreFloater.ts` exposes the `ScoreFloater` shape, `formatScoreFloaterText(delta)`, `pruneExpiredFloaters(list, nowMs)`, and `SCORE_FLOATER_TTL_MS = 1200`. `src/components/FlatlineGame.tsx` projects the dying enemy's world position to canvas pixels (`vector.project(camera)` + NDC-to-pixel) and pushes a floater entry on every confirmed kill. `app/globals.css` adds a `.score-floaters-layer` (absolute, inset:0, pointer-events:none, z-index 4) sibling to `.hud` plus a `.score-floater` rule with a 1.2 s ease-out keyframe rising 36 px and fading. The floater renders only when `running && scoreFloaters.length > 0` so unmounted runs do not paint. Files: `src/game/scoreFloater.ts`, `src/game/scoreFloater.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #91.
- 2026-05-04: Cartoon-title-card HUD treatment first pass. New pure helper `src/game/hudJitter.ts` exposes `hudPillWobbleAmplitudePx(playerHealth)`, `hudPillWobbleRotationDeg(playerHealth)`, `hudPillWobblePeriodMs()`, `hudGrainOpacity(playerHealth)`, and `hudSplatterIntensity(playerHealth)`. Amplitudes scale up as health drops (0.55 px / 0.32 deg at full health, capped at 1.2 px / 0.5 deg at zero so legibility is preserved). Period stays a constant 1700 ms so all pills wobble in sync; `nth-child(2n)` reverses direction and `nth-child(3n)` adds a 220 ms delay to break monotony. Two new overlays render only while a run is active: `.hud-grain` is a layered radial-gradient noise texture (3 px and 5 px tiles) blending in `mix-blend-mode: overlay` with opacity 0.06 baseline rising to 0.22 at zero health, animated by a `steps(2)` 480 ms drift on the background-position. `.hud-splatter` is a six-radial-gradient ink frame (four corner blots + top / bottom edge falloff) whose opacity scales with `hudSplatterIntensity` (0 above 60 HP, ramps linearly to peak 0.85 at 0 HP). `prefers-reduced-motion: reduce` disables the wobble and grain drift. Files: `src/game/hudJitter.ts`, `src/game/hudJitter.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #TBD. Status stays `partial` until rubber-hose icons and per-pill ink-bleed borders are also audited.
- 2026-05-03: Damage-direction indicator landed. Enemy melee hits now spawn a red conic-gradient arc at the screen edge pointing toward the attacker, fading over 720 ms. Files: `src/game/damageDirection.ts`, `src/game/damageDirection.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #TBD. Cartoon-title-card visual treatment for HUD pills remains unaudited; status stays `partial`.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: HUD elements rendered inside `src/components/FlatlineGame.tsx`. Required-list elements (health, ammo, weapon, score, combo, timer, crosshair) appear; damage-direction indicator and full cartoon-title-card visual treatment have not been individually verified. Status `partial`.
