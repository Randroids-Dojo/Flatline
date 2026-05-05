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

## 2026-05-04, Distinct enemy windup audio cues

- Branch: `feat/enemy-windup-audio-cues`
- PR: #TBD
- Changed: every enemy melee windup now plays a per-type audio sting so the player can tell from sound alone which enemy is about to swing, even when the sprite is off-screen or partly obscured. New pure helper `src/game/enemyWindupCue.ts` exposes `enemyWindupCue(type)` returning `{ frequency, waveform, durationMs, gain }`. Skitter cue: 880 Hz sine, 110 ms, gain 0.022 (snappy whistle). Grunt cue: 340 Hz square, 150 ms, gain 0.028 (default melee read). Brute cue: 150 Hz sawtooth, 280 ms, gain 0.038 (bassy inhale). `src/game/enemies.ts` extends the `enemyAttackStarted` event with an `enemyType` field so the consumer can pick the right cue without re-deriving it. `src/components/FlatlineGame.tsx` imports the helper and a new local `playWindupCue(cue, enabled)` companion to `playCue` (separate function because the windup needs its own waveform / envelope / variable duration); the existing `enemyAttackStarted` handler now calls `playWindupCue(enemyWindupCue(event.enemyType), settingsRef.current.audio)` immediately after the existing status-line update. The new helper uses an attack-then-exponential-decay envelope so the cue does not click on the speaker at the end of the oscillator stop.
- Verification: dash check (clean), `git diff --check` (clean), `npm run typecheck`, `npm run lint`, `npm run test` (21 files / 108 tests pass, 7 new in `src/game/enemyWindupCue.test.ts`), `npm run build` (success), `npm run test:e2e` (7 passed, 1 skipped).
- Assumptions: Recommended default is one stinger per windup (not a sustained tone) so the cue does not pile up when multiple enemies enter range simultaneously. Recommended default uses different waveforms per type (sine / square / sawtooth) so two cues that overlap stay distinguishable even at similar pitches. Recommended default keeps the cue fully under each enemy's `attackWindupMs` so the player still has time to react after hearing it (skitter 110 ms cue vs 260 ms windup; grunt 150 ms vs 420 ms; brute 280 ms vs 620 ms).
- GDD coverage: REQ-040 (audio readability cues for grayscale art) gains a build-log entry and adds `src/game/enemyWindupCue.ts` to its `implementationRefs` plus `src/game/enemyWindupCue.test.ts` to its `testRefs`. REQ-040 stays `partial` (adaptive music layers, hazard countdown click, pickup loop sound, and the rest of the required-SFX list remain unaudited). REQ-046 is unaffected; the event payload change is contained to the FlatlineGame consumer that already handled the event.
- Followups: none new.

## 2026-05-04, Pickup readability bounce + glow

- Branch: `feat/pickup-readability-bounce`
- PR: #TBD
- Changed: the central altar supply pickup now bounces, breathes its emissive glow, and emits an outward halo pulse so the player can read it against the otherwise mostly grayscale floor. New pure helper module `src/game/pickupReadability.ts` exposes four functions: `pickupBounceY(elapsedMs, ready)` (sin oscillation, 0.08 m amplitude / 1100 ms period when ready, collapses to 0.025 m / 1700 ms on cooldown), `pickupGlowIntensity(elapsedMs, ready)` (breathes between 0.55 and 1.0 emissive intensity when ready, between 0.05 and 0.18 on cooldown), `pickupHaloScale(elapsedMs)` (linear 1 to 1.45 across each 1400 ms cycle), `pickupHaloOpacity(elapsedMs, ready)` (peak 0.55 fading to 0 across the cycle when ready, peak 0.12 on cooldown). `src/components/FlatlineGame.tsx` swaps the altar mesh from the shared `accentMaterial` to a dedicated `pickupMaterial` (`MeshStandardMaterial` with its own emissive intensity), adds an additive-blended `RingGeometry` halo at floor level next to the altar, exposes `pickup: { altar, halo, restY }` from `createRoom`, threads it through `RuntimeRefs`, and ticks it every animate frame via a new `applyPickupReadability(runtime, time, ready)` helper. The bounce and glow run regardless of pause state because they are ambient feel, not gameplay timers, and they react instantly to the existing `healthPickupReadyRef` so a freshly collected pickup visibly dims and slows.
- Verification: dash check (clean), `git diff --check` (clean), `npm run typecheck`, `npm run lint`, `npm run test` (20 files / 101 tests pass, 13 new in `src/game/pickupReadability.test.ts`), `npm run build` (success), `npm run test:e2e` (7 passed, 1 skipped).
- Assumptions: Recommended default keeps the altar geometry, position, and collision unchanged; only its material and an added halo sibling drive the new feel. Recommended default uses a sin wave for both the bounce and the glow because a smooth periodic motion reads as a "this is alive" cue without competing with the muzzle flash and impact rings. Recommended default keeps the cooldown variant visually quieter but not invisible so the player can still locate the pickup while it cools down. Loop sound (the fourth bullet in the GDD spec) is left to a separate slice under REQ-040 (audio readability cues).
- GDD coverage: REQ-036 stays `partial` (loop sound and consistent-zones bullet remain). The row picks up `src/game/pickupReadability.ts` in its `implementationRefs` and `src/game/pickupReadability.test.ts` in its `testRefs`. `docs/gdd/36-pickup-readability.md` gains a new build-log entry.
- Followups: none new.

## 2026-05-03, Enemy hurt flash on damage

- Branch: `feat/enemy-hurt-flash`
- PR: #TBD
- Changed: every successful hit on an enemy now briefly snaps the billboard sprite toward white so the player gets an unmissable confirmation of damage in addition to the existing health bar / status line update. New pure helper module `src/game/enemyHurtFlash.ts` exposes `enemyHurtFlashStyle(type)` (returns `{ peakIntensity, holdMs, decayMs, flashColor }`) and `enemyHurtFlashIntensity(style, elapsedMs)` (instant rise to peak, hold, then linear decay). Grunt: peakIntensity 0.85 / hold 60 ms / decay 140 ms with pure white flash; skitter: peakIntensity 0.95 / hold 40 ms / decay 110 ms (snappier for a one-shot enemy); brute: peakIntensity 0.7 / hold 90 ms / decay 220 ms with a slightly warm flash so the bigger silhouette reads as a meatier, longer hit. `src/components/FlatlineGame.tsx` adds the import, allocates a single scratch `enemyHurtFlashColor` THREE.Color outside the animate loop, and replaces the previous `if (enemy.state !== 'hurt')` tint write with a branch that lerps the base tint toward the flash color by the computed intensity whenever the enemy is in `'hurt'` or `'dead'` state. Both states reset `animationTimeMs` to 0 inside `damageEnemy`, so that field is the elapsed-since-hit clock the helper consumes.
- Verification: dash check (clean), `git diff --check` (clean), `npm run typecheck`, `npm run lint`, `npm run test` (19 files / 88 tests pass, 10 new in `src/game/enemyHurtFlash.test.ts`), `npm run build` (success), `npm run test:e2e` (7 passed, 1 skipped).
- Assumptions: Recommended default flash color is pure white for grunt and skitter (highest contrast against the existing tints) and a faintly warm tone for the brute so its already-warm tint does not blow out. Recommended default curve is instant rise + short hold + linear decay because a perceptual flash needs to peak immediately on the same frame as the hitscan resolution, not ramp up. Recommended default total flash window is shorter than each enemy type's `hurtDurationMs` so the flash resolves before the state transitions back to `chase`.
- GDD coverage: REQ-046 (billboard rendering details, "hurt flash") and REQ-056 (post-MVP feel pass) gain new build-log entries. REQ-046 stays `done` since the existing render pipeline already covered animation lookup, angle bucket, frame index, UV swap, plane rotation, and scale; this slice closed the only remaining sub-bullet (hurt flash) without changing the row status. REQ-056 stays `partial` (movement around pillars and enemy damage range readability still unaudited).
- Followups: none new.

## 2026-05-03, Weapon recoil sprite kick

- Branch: `feat/weapon-recoil-kick`
- PR: #51
- Changed: every weapon fire now physically kicks the foreground gun sprite down and tilts it slightly back, then settles, instead of only swapping to the firing image. New pure helper `weaponRecoilStyle(weapon)` in `src/game/weaponRecoil.ts` returns `{ kickPx, rotateDeg, durationMs }`. Peashooter uses 6 px / -1.2 deg / 140 ms; inkblaster 10 px / -2.2 deg / 180 ms; boomstick 18 px / -3.5 deg / 240 ms (kick magnitude tracks the muzzle flash scale ordering). `src/components/FlatlineGame.tsx` adds a `weaponFireKey` counter incremented inside the existing `fire` callback. The `.weapon` JSX is wrapped in an IIFE that pulls the recoil style and applies CSS custom properties (`--weapon-recoil-kick`, `--weapon-recoil-rotate`, `--weapon-recoil-duration`) plus a unique React `key` so consecutive shots restart the keyframe animation cleanly. New `.weapon.weapon-firing` rule in `app/globals.css` defines the `weapon-recoil` keyframe (translateX(-50%) composed with translateY + rotate at 35% and snap back at 100%).
- Verification: dash check (clean), `git diff --check` (clean), `npm run typecheck`, `npm run lint`, `npm run test` (18 files / 78 tests pass, 6 new in `src/game/weaponRecoil.test.ts`), `npm run build` (success), `npm run test:e2e` (7 passed, 1 skipped).
- Assumptions: Recommended default is a kick that peaks at 35 percent of the duration so the snap-back reads as fast as the kick. Recommended default kick / rotation magnitudes scale with the existing muzzle flash scale ordering so the sprite physical reaction matches the visual punch. Recommended default duration stays under the 220 ms `weapon-firing` class hold so the animation finishes before the class drops; consecutive shots retrigger via the React `key` change rather than via class toggling.
- GDD coverage: REQ-056 and REQ-026 build logs both gain a new entry. Both rows stay `partial` (REQ-026 still has full per-weapon idle / fire / cooldown frame audit pending; REQ-056 still has movement around pillars and enemy damage range readability unaudited).
- Followups: none new.

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
