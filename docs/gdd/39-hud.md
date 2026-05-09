# HUD

**Status:** done

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

- 2026-05-09: Cartoon-title-card ink-bleed filter on HUD pill borders + status flip to `done`. Closes F-022 and the remaining partial of F-019. The HUD root mounts a hidden `<svg width="0" height="0">` carrying a `hud-ink-bleed` filter (`<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/>` + `<feDisplacementMap in="SourceGraphic" scale="2"/>`). `.hud-pill::before` paints a 1px cream outline aligned to the pill rect via `inset: -1px` and routes only that outline through the filter, so the pill text + icons stay crisp. `@media (prefers-reduced-motion: reduce)` clears the filter. `pointer-events: none` keeps the overlay click-through. With the rubber-hose icons (PR #130), the wobble + film-grain + ink-splatter overlays from PR #59, and the damage-direction indicator from PR #49 already landed, every cartoon-title-card spec checkbox plus every required HUD element is now visible. Files: `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #TBD.
- 2026-05-09: Wired the six rubber-hose HUD icons (`health` / `wave` / `score` / `combo` / `kills` / `time`) inline as `<img class="hud-icon">` next to each pill's existing label text. Shared `.hud-icon` CSS rule (which co-styles `.weapon-hud-icon` from F-018 partial) sets 18x18 + `image-rendering: pixelated`. F-019 partial close. Files: `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #130.
- 2026-05-09: HUD rubber-hose icon set landed under `public/assets/hud/` (`health`, `score`, `time`, `kills`, `combo`, `wave`, all 32x32). New generator `scripts/generate-hud-icons.mjs` builds each icon from primitive polygons with a deterministic seeded `roughen()` perturbation per vertex (LCG-based, no rough.js dependency) so the lines read as hand-drawn without external attribution debt. All icons run through the slice-2 `finishAsset` pass for palette coherence. The dot's original tooling plan (game-icons + svg2roughjs + rsvg-convert) was replaced with the in-repo generator pattern matching slices 1 and 2: zero new dependencies, zero CC-BY attribution debt, fully deterministic, same rubber-hose outcome. Status stays `partial` until `FlatlineGame.tsx` renders the new icons and the per-pill ink-bleed `<feTurbulence>` filter lands; F-019 tracks the wiring follow-up. Files: `scripts/generate-hud-icons.mjs`, `public/assets/hud/{health,score,time,kills,combo,wave}.png`. PR #126.
- 2026-05-06: Best-local-score line on the start panel. The personal best was previously buried behind the run summary or the local leaderboard list. New helper `bestLocalScore(entries)` in `src/lib/leaderboard.ts` exposes the max score across the local leaderboard or `null` when empty. `src/components/FlatlineGame.tsx` renders a "Best <score>" line above the run summary inside the start panel, gated on `!isPractice && bestLocalScore(leaderboard) !== null`. CSS rule `.start-panel p.best-score` in `app/globals.css` formats the line as a small letter-spaced label plus a larger gold value. Files: `src/lib/leaderboard.ts`, `src/lib/leaderboard.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #92.
- 2026-05-06: Kill-confirm score floaters. The required-list "Score" pill at the top of the HUD was the only kill-confirm signal; the player had to break aim to read the bonus. New pure helper `src/game/scoreFloater.ts` exposes the `ScoreFloater` shape, `formatScoreFloaterText(delta)`, `pruneExpiredFloaters(list, nowMs)`, and `SCORE_FLOATER_TTL_MS = 1200`. `src/components/FlatlineGame.tsx` projects the dying enemy's world position to canvas pixels (`vector.project(camera)` + NDC-to-pixel) and pushes a floater entry on every confirmed kill. `app/globals.css` adds a `.score-floaters-layer` (absolute, inset:0, pointer-events:none, z-index 4) sibling to `.hud` plus a `.score-floater` rule with a 1.2 s ease-out keyframe rising 36 px and fading. The floater renders only when `running && scoreFloaters.length > 0` so unmounted runs do not paint. Files: `src/game/scoreFloater.ts`, `src/game/scoreFloater.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #91.
- 2026-05-04: Cartoon-title-card HUD treatment first pass. New pure helper `src/game/hudJitter.ts` exposes `hudPillWobbleAmplitudePx(playerHealth)`, `hudPillWobbleRotationDeg(playerHealth)`, `hudPillWobblePeriodMs()`, `hudGrainOpacity(playerHealth)`, and `hudSplatterIntensity(playerHealth)`. Amplitudes scale up as health drops (0.55 px / 0.32 deg at full health, capped at 1.2 px / 0.5 deg at zero so legibility is preserved). Period stays a constant 1700 ms so all pills wobble in sync; `nth-child(2n)` reverses direction and `nth-child(3n)` adds a 220 ms delay to break monotony. Two new overlays render only while a run is active: `.hud-grain` is a layered radial-gradient noise texture (3 px and 5 px tiles) blending in `mix-blend-mode: overlay` with opacity 0.06 baseline rising to 0.22 at zero health, animated by a `steps(2)` 480 ms drift on the background-position. `.hud-splatter` is a six-radial-gradient ink frame (four corner blots + top / bottom edge falloff) whose opacity scales with `hudSplatterIntensity` (0 above 60 HP, ramps linearly to peak 0.85 at 0 HP). `prefers-reduced-motion: reduce` disables the wobble and grain drift. Files: `src/game/hudJitter.ts`, `src/game/hudJitter.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #59. Status stays `partial` until rubber-hose icons and per-pill ink-bleed borders are also audited.
- 2026-05-03: Damage-direction indicator landed. Enemy melee hits now spawn a red conic-gradient arc at the screen edge pointing toward the attacker, fading over 720 ms. Files: `src/game/damageDirection.ts`, `src/game/damageDirection.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #49. Cartoon-title-card visual treatment for HUD pills remains unaudited; status stays `partial`.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: HUD elements rendered inside `src/components/FlatlineGame.tsx`. Required-list elements (health, ammo, weapon, score, combo, timer, crosshair) appear; damage-direction indicator and full cartoon-title-card visual treatment have not been individually verified. Status `partial`.
