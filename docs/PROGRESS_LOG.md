# Progress Log

Newest entries first. Every implementation slice adds an entry at the top of the list. Once committed, do not edit, reorder, or delete a previous entry; corrections go in a new entry that supersedes the old one.

Format for each slice:

```
## YYYY-MM-DD, Short Title

- Branch: `feature/short-name`
- PR: #N (when known)
- Changed: one paragraph naming the user-facing change and the key files / helpers / defaults that landed.
- Verification: dash checks, type-check, relevant unit tests, build, smoke (where applicable). Note any known-tolerated lint warnings or skipped checks.
- Assumptions: assumptions made under a Recommended default. One sentence per assumption.
- GDD coverage: which rows in `docs/GDD_COVERAGE.json` flipped to `partial` or `done`, or which `docs/gdd/*.md` files gained a Build log entry.
- Followups: any new `F-NNN` entries created. Link to them.
```

Pre-spiral history (94 commits across 2026-04-30 to 2026-05-02) is preserved in `docs/_archive/2026-05-03-pre-spiral/PROGRESS_LOG.md`. New entries are append-only from this slice.

## 2026-05-03, Foreground muzzle flash overlay

- Branch: `feat/muzzle-flash-overlay`
- PR: #TBD
- Changed: every weapon fire now pops a brief radial-gradient flash overlay above the foreground weapon sprite so the gun visually punctuates the shot, not just the world-space bolt and 3D point light. New pure helper `muzzleFlashStyle(weapon)` in `src/game/muzzleFlash.ts` returns `{ color, scale, durationMs }` per weapon: warm gold for the peashooter and boomstick (bigger and longer for the boomstick), teal cell-energy color for the inkblaster. `src/components/FlatlineGame.tsx` triggers the flash inside the existing `fire` callback (right after the `weaponFlashTimeoutRef` setup), stores `{ key, weapon }` in a new `muzzleFlash` state keyed by `performance.now()`, and renders a `.muzzle-flash` element with `--muzzle-color`, `--muzzle-scale`, and `--muzzle-duration` CSS custom properties. New `.muzzle-flash` rule in `app/globals.css` uses `mix-blend-mode: screen` plus a small blur and a 0.4 to 1.05 to 0.85 scale animation across the configured duration. Flash state clears on run start and component unmount alongside the existing weapon-firing timeout.
- Verification: dash check (clean), `git diff --check` (clean), `npm run typecheck`, `npm run lint`, `npm run test` (17 files / 72 tests pass, 6 new in `src/game/muzzleFlash.test.ts`), `npm run build` (success), `npm run test:e2e` (7 passed, 1 skipped).
- Assumptions: Recommended default flash position is centered horizontally over the weapon sprite (matching `weapon` `left: 50%`) and anchored at `bottom: min(28vh, 220px)` so it sits at the muzzle of the foreground sprite at common aspect ratios. Recommended default sizing pegs the peashooter at 1x and tunes boomstick / inkblaster relative to that. Recommended default durations are 110 / 150 / 130 ms; anything under 80 ms reads as a flicker, anything over 200 ms competes with the bolt-impact ring.
- GDD coverage: REQ-045, REQ-056, and REQ-026 gain new build-log entries in their `docs/gdd/` files. REQ-026 stays `partial` (per-weapon idle / fire / cooldown frame audit still open). REQ-056 stays `partial` (movement around pillars and enemy damage range readability still unaudited). REQ-045 stays `done`.
- Followups: none new.

## 2026-05-03, Damage-direction indicator

- Branch: `feat/damage-direction-indicator`
- PR: #TBD
- Changed: when an enemy melee hit lands on the player, a brief red arc now appears at the screen edge in the direction of the attacker so the player can tell which side of them got hit without reading the status line. New pure helper `damageDirectionRadians(playerYaw, sourcePosition, playerPosition)` lives in `src/game/damageDirection.ts` and computes the relative angle in the xz plane (0 = front, +PI/2 = right, +-PI = behind, -PI/2 = left) using the same yaw convention as `forwardFromYawPitch`. `src/components/FlatlineGame.tsx` reads the helper inside the `enemyAttackHit` event branch, stores `{ key, angleRadians }` in a new `damageIndicator` state, and renders a CSS conic-gradient ring under the new `.damage-indicator` rule in `app/globals.css`. The element is keyed by timestamp so each new hit retriggers a 720 ms fade-out animation. Indicator state clears on run start.
- Verification: dash check (clean), `git diff --check` (clean), `npm run typecheck`, `npm run lint`, `npm run test` (16 files / 66 tests pass, 7 new in `src/game/damageDirection.test.ts`), `npm run build` (success), `npm run test:e2e` (7 passed, 1 skipped).
- Assumptions: Recommended default angle convention matches the project yaw convention (yaw 0 forward = -z, yaw PI forward = +z). Recommended default arc width is 90 degrees centered on the source bearing, with peak opacity 0.82 and a 720 ms ease-out fade. Hazard damage retains the existing fullscreen flash but does not yet emit a directional indicator since the player is inside the hazard; that is left to a later slice if review demands it.
- GDD coverage: REQ-039 (HUD damage-direction indicator) gains a new build-log entry. The row remains `partial` because the cartoon-title-card visual treatment for HUD pills is still unaudited, but the explicit "damage direction indicator" line of the required HUD list is now satisfied.
- Followups: none new.

## 2026-05-03, Per-shot impact burst

- Branch: `feat/shot-impact-burst`
- PR: #TBD
- Changed: hitscan bolts now spawn a brief expanding ring at the bolt's terminal point so every shot lands a readable impact mark in world space. Hit impacts are red and slightly larger; misses are teal and quicker. Adds `ShotImpact` type, `shotImpactsRef`, and `spawnShotImpact` / `tickShotImpacts` / `clearShotImpacts` / `shotImpactsLimit` helpers in `src/components/FlatlineGame.tsx`. Wires impact spawn into `tickShotBolts` so the burst fires when a bolt arrives at its target distance, before the bolt mesh is recycled. Capped at 12 concurrent rings; cleared on run reset and component unmount alongside the existing bolts and ink projectiles.
- Verification: dash check (clean), `git diff --check` (clean), `npm run typecheck`, `npm run lint`, `npm run test` (15 files / 59 tests pass), `npm run build` (success), `npm run test:e2e` (7 passed, 1 skipped).
- Assumptions: Recommended default for impact appearance is a billboarded ring oriented to face the camera-side of the impact (using `lookAt(position - direction)`). Ring sizes / lifetimes (hit 220 ms, miss 160 ms) are first-pass values that can be tuned without API changes.
- GDD coverage: REQ-045 and REQ-056 gain new build-log entries in their `docs/gdd/` files. REQ-056 stays `partial` since other feel-pass items (movement around pillars, enemy damage range readability) remain unaudited.
- Followups: none new.

## 2026-05-03, Spiral Re-Init

- Branch: `chore/spiral-re-init`
- Changed: full re-init via the `spiral` skill after `/spiral audit` flagged 13 findings on the pre-spiral scaffold (chapter-granular coverage, missing qualitative gates, monolith GDD, Q-NNN entries without `Recommended default:` lines). Archived the old scaffold under `docs/_archive/2026-05-03-pre-spiral/` via `git mv` to preserve history. Wrote the canonical templates: `AGENTS.md`, `CLAUDE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/WORKING_AGREEMENT.md`, `docs/gdd/README.md`, `docs/GDD_COVERAGE.json`, `docs/PROGRESS_LOG.md`, `docs/OPEN_QUESTIONS.md`, `docs/FOLLOWUPS.md`, `docs/PLAYTEST.md`, `docs/FUN_FACTOR_AUDIT.md`, plus the three `.claude/rules/*.md` path-scoped rule files and the two `docs/AGENTS.md` / `docs/gdd/AGENTS.md` Codex symlinks. Split `GDD.md` (29 sections, ~1600 lines) into requirement-granular files under `docs/gdd/`. Replaced the placeholder coverage rows with real requirement rows, status-tagged from the archived `GDD_COVERAGE.json` and the existing codebase. Ported the 5 design Q-NNN (grayscale, angles, leaderboard, room authoring, reloads) into the new `OPEN_QUESTIONS.md` with `Recommended default:` lines and resolved status preserved.
- Verification: em-dash and en-dash grep returned nothing (`grep -rnP '[\x{2014}\x{2013}]'`); the spiral audit script printed 0 findings on its final run.
- Assumptions: requirement rows whose archived coverage said `implemented` were carried forward as `done` only when an implementation file path still exists; ambiguous rows downgraded to `partial`. Polish-area requirements without code refs marked `not_started`.
- GDD coverage: ledger fully rewritten at requirement granularity. Every `docs/gdd/*.md` file has a `Status:` line.
- Followups: F-003 (split GDD into requirement-granular section files) resolved by this slice. F-NNN numbering is carried forward from the pre-spiral ledger so F-001 (package scaffold) and F-002 (deploy smoke) keep their original IDs in `docs/FOLLOWUPS.md`.
