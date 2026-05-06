# Followups

Backlog spillover discovered during implementation. Keep items PR-sized when possible.

> **Critical convention.** Every followup must carry a `Priority:` tag. Three buckets:
> - `blocks-release`: cannot ship v1 without this.
> - `nice-to-have`: improves the product but does not block.
> - `polish`: post-release cleanup.

## How to add a followup

```
### F-NNN: Short title

- Priority: blocks-release | nice-to-have | polish
- Context: one or two sentences on why this came up.
- Blocker (if any): the condition that prevents working on this now.
- Unblock condition: what has to be true to start.
- PR / Dot reference (when picked up): #N or dots-N
```

Use `###` (h3) for entries so they nest under the priority section headers (`## Blocks Release`, `## Nice To Have`, `## Polish`, `## Resolved`).

`F-NNN` IDs are monotonically increasing across the lifetime of the project. The first three IDs (F-001, F-002, F-003) are carried forward from the pre-spiral ledger so cross-referencing pre-spiral work and history stays unambiguous. When a followup ships, leave the entry in place, set `Status: done`, and append a `- Resolved: PR #N` line. Never delete.

## Blocks Release

(none yet)

## Nice To Have

### F-007: Boomstick weight (camera FOV punch + screen impulse on fire)

- Priority: nice-to-have
- Context: `docs/FUN_FACTOR_AUDIT.md` 2026-05-05. Boomstick is the iconic Doom verb but currently fires without a felt weight on the player. Add a brief camera-FOV punch (e.g., -3 deg snap then ease back) and a vertical screen impulse on fire, scaled per weapon (peashooter tiny, boomstick large, inkblaster medium). Reuses the existing weapon recoil sprite kick scaffolding pattern.
- Blocker: none.
- Unblock condition: design pass picks the FOV punch magnitudes; implementation lands as a pure helper plus a hookup in `src/components/FlatlineGame.tsx`.
- Status: open

### F-008: Spitter ranged enemy v1 (REQ-031)

- Priority: nice-to-have
- Context: `docs/FUN_FACTOR_AUDIT.md` 2026-05-05. Three melee enemies make encounters too uniform. REQ-031 is `not_started`. Ship a slow projectile-firing enemy with a clearly telegraphed windup, a finite projectile speed (so the player can see it coming and dodge), and a unique audio sting. Adds the missing third leg of the threat triangle (chaff / fast / tank now plus ranged).
- Blocker: none. Q-008 (infighting damage rule) is adjacent but not blocking; spitter v1 can ship without enemy-on-enemy damage and add it in F-013.
- Unblock condition: pure helpers for projectile motion, telegraph, and audio cue; integration in `FlatlineGame.tsx`.
- Status: open

### F-010: Enemy knockback on damage

- Priority: nice-to-have
- Context: `docs/FUN_FACTOR_AUDIT.md` 2026-05-05. `docs/gdd/24-weapon-boomstick.md` calls for "Strong knockback" but enemies do not currently move when shot. Add a per-weapon knockback impulse on enemy damage events. Scales: peashooter 0.15 m, inkblaster 0.4 m, boomstick 0.9 m point-blank with falloff to 0.2 m at max range. Brutes resist 50% of knockback; skitters take 130%.
- Blocker: none.
- Unblock condition: pure helper that takes weapon, distance, enemy type and returns an impulse vector; consumer applies the impulse over a short decay window in `tickEnemy` or in `FlatlineGame.tsx`.
- Status: open

### F-011: Berserk / rage power pickup

- Priority: nice-to-have
- Context: `docs/FUN_FACTOR_AUDIT.md` 2026-05-05. No power moment exists. Q-007 picks the buff stack; recommended default is +1.5x damage, +1.3x movement, +1.5x fire rate for 10s, with a screen-edge red tint and a pulse music layer. Spawns rarely from the central altar in place of a health pickup, gated by run time and pressure.
- Blocker: Q-007 (buff stack) recommended default suffices for ship.
- Unblock condition: pure helper for buff envelope + spawn rule; renderer for the screen tint + audio loop layer.
- Status: open

### F-012: Score token / quad damage pickup (REQ-035)

- Priority: nice-to-have
- Context: `docs/FUN_FACTOR_AUDIT.md` 2026-05-05. REQ-035 is `not_started`. Aggressive-play reward: a brief score multiplier (e.g., 2x for 6s) that drops in a *risky* arena cell (center risk zone) and rewards the player for committing to grab it. Reads as Quake quad damage but for score, not damage.
- Blocker: none.
- Unblock condition: spawn rule keyed to active pressure; pickup type added to the central altar rotation.
- Status: open

### F-013: Enemy infighting (cross-faction crossfire damage)

- Priority: nice-to-have
- Context: `docs/FUN_FACTOR_AUDIT.md` 2026-05-05. Q-008 picks the damage rule; recommended default is 50%. Lands cleanly *after* F-008 (spitter) is in, since the spitter is the first enemy with a projectile that can naturally hit other enemies. Brute melee swings and skitter dashes can also damage adjacent enemies under the same rule.
- Blocker: F-008 (spitter ships first).
- Unblock condition: F-008 merged; collision rule extended; aggro update so an enemy hit by another enemy rolls a small aggro-shift toward whoever damaged it.
- Status: open

### F-014: Encounter wave choreography (surge / lull / peak)

- Priority: nice-to-have
- Context: `docs/FUN_FACTOR_AUDIT.md` 2026-05-05. The spawn director currently produces a steady cadence with a pressure target. Layer a wave shape on top: 25s lull (low pressure target, low cadence), 18s surge (target +1, cadence -25%), 7s peak (target +2, cadence -45%, audio horn), then back to lull. Reads as Doom-style encounter rhythm and makes the room feel composed instead of timed.
- Blocker: none.
- Unblock condition: pure helper that maps `runMs` to a wave-phase struct; consumer layers it on top of `targetPressureForRunMs` and `spawnCadenceForRunMs`.
- Status: open

### F-015: Adaptive music intensity layer

- Priority: nice-to-have
- Context: `docs/FUN_FACTOR_AUDIT.md` 2026-05-05. REQ-040 partial. Add a single procedural Web Audio thrash layer (a low-pass-filtered square arpeggio or a sub bass throb) that fades in proportional to `activePressure / pressureTarget` once the ratio crosses 0.7 and fades out under 0.5. Single layer is enough to deliver "the music gets crazier when it gets hot." Multiple stems can land later.
- Blocker: none.
- Unblock condition: pure helper that maps pressure ratio to gain envelope; consumer wires a single sustained oscillator pair into the existing audio context lifecycle.
- Status: open

## Polish

(none yet)

## Resolved

### F-006: Movement weapon (sprint or dash on Shift)

- Priority: nice-to-have
- Context: `docs/FUN_FACTOR_AUDIT.md` 2026-05-05. Player is locked at 6.8 m/s with no movement modifier. Doom's signature is "movement is a weapon." Adding one expressive movement verb on Shift turns the run from "stand back, shoot" into "commit and reposition." `docs/gdd/10-movement.md` already reserves `Shift: dash, later`. Q-006 picks sprint vs dash; recommended default is dash.
- Blocker: none.
- Unblock condition: Q-006 resolved, or ship under the recommended default.
- Status: done
- Resolved: PR #TBD. Shipped under Q-006 recommended default (instant dash). New helper `src/game/dash.ts` plus 23 unit tests; `src/components/FlatlineGame.tsx` wires Shift keydown to `startDash`, applies dash velocity in the animate loop, drops state on completion, exposes a `dash-ready` HUD pill, and resets on `startRun`. Audio swoop 1100 Hz to 700 Hz over 180 ms.

### F-009: Hitstop on confirmed hit

- Priority: nice-to-have
- Context: `docs/FUN_FACTOR_AUDIT.md` 2026-05-05. The contact moment is the highest-leverage feel beat in any shooter. Add a 30 to 60 ms hitstop (per-weapon tuned) when a player shot lands on an enemy. This is a global time-scale dip that affects the simulation tick scaling for one frame budget.
- Blocker: none.
- Unblock condition: pure helper that returns `{ scale, durationMs }` per weapon; consumer wires it into the animate loop's delta calculation.
- Status: done
- Resolved: PR #64. New helper `src/game/hitstop.ts` exposes `hitstopStyle(weapon)` and `hitstopScaleAtElapsedMs(style, elapsedMs)`; `src/components/FlatlineGame.tsx` adds `hitstopStateRef`, sets it inside `damageCurrentEnemy` on every confirmed hit, multiplies the per-frame `delta` by the helper's return value, clears the ref once the window has elapsed, and resets the ref on `startRun`. View rotation reads `viewDelta` (raw) so the camera stays responsive during the freeze.

### F-005: Confirm root cause of mobile (0, 0) phantom pointerdown

- Priority: nice-to-have
- Context: real-device report on PC Chrome with phone-size emulation showed a brief move-stick flash anchored at the screen origin during the first interaction with a fresh round. PR #63 added a `(0, 0)` origin guard in `src/components/FlatlineGame.tsx` (`beginTouch` and `JoystickVisual`) that prevents the visual from rendering, but the underlying source of the phantom event remains unconfirmed. The guard is a symptom-level fix, not a root-cause fix.
- Blocker: not reproducible from Playwright tap injection on Pixel 5, iPhone 12, iPhone 13 Mini, or narrow Desktop Chrome.
- Unblock condition: capture a real-device console log of the pointer event stream that produces the phantom (event type, `pointerType`, `clientX`, `clientY`, `target.tagName`) so the source can be identified and the guard can be retired or replaced with something more targeted.
- Status: done
- Resolved: PR #64. The (0, 0) guard was dropped because it caused a real-device regression (thumbsticks failing to appear on first run on Android Chrome, recovering only after backgrounding and foregrounding the browser). After also adding a snap-on-move helper, real-device retest still showed the move stick anchored at the top-left, which led to switching the joystick handlers from `PointerEvent` to `TouchEvent` to bypass the stale-`clientX/Y` bug at its source. If the original phantom flash returns on a real device with diagnostic logging, file a fresh follow-up with the captured pointer-event payload.

### F-004: Resolve orphan pickup-cue work

- Priority: nice-to-have
- Context: an earlier loop iteration started a pickup audio sting slice but exited mid-slice, leaving `src/game/pickupCue.ts` and `src/game/pickupCue.test.ts` untracked on disk. The helper module is self-consistent (exports `pickupCue` and `pickupCueTotalDurationMs`) and the tests pass on their own, but `FlatlineGame.tsx` was edited to call a `playPickupCue` function that was never written. The 2026-05-04 mobile-touch slice reverted the broken call site at `FlatlineGame.tsx` line 850 back to `playCue(520, settingsRef.current.audio)` so typecheck would pass.
- Blocker: none.
- Unblock condition: dev decides whether to revive the slice (write `playPickupCue` against the existing `PickupCueStyle` shape and re-wire the call site) or discard the orphan files via `git clean -fd src/game/pickupCue.*`.
- Status: done
- Resolved: 2026-05-04 pickup collection sparkle slice (PR #61). Slice revived: `playPickupCue` written in `src/components/FlatlineGame.tsx`, call site re-wired, `pickupCue.ts` and `pickupCue.test.ts` committed.

### F-001: Add package scaffold and standard verification scripts

- Priority: blocks-release
- Created: 2026-04-30
- Source: implementation loop setup.
- Description: add the Next.js, React, Three.js, TypeScript, Vitest, and Playwright project scaffold with `lint`, `typecheck`, `test`, `test:e2e`, `build`, and `verify` scripts.
- Status: done
- Resolved: pre-spiral, completed in `feat/slice-1-walk-shoot` with standard npm scripts and local verification.

### F-002: Add deployed build smoke once hosting exists

- Priority: nice-to-have
- Created: 2026-04-30
- Source: working agreement.
- Description: once the repo has a deploy target, add deploy verification steps and production smoke checks to the loop.
- Status: done
- Resolved: pre-spiral, completed in `docs/continuous-loop-coverage` by adding deploy smoke to the loop contract and progress log evidence.

### F-003: Split GDD into requirement-granular section files

- Priority: blocks-release
- Created: 2026-04-30
- Source: documentation setup; flagged by `/spiral audit` as the chapter-granular coverage anti-pattern.
- Description: monolithic `GDD.md` carried only chapter-granular coverage rows (the namesake Flatline failure mode). Each requirement needs its own file under `docs/gdd/` so the coverage ledger can carry one row per requirement and the loop can find atomic gaps.
- Status: done
- Resolved: 2026-05-03 spiral re-init slice (PR #47). `GDD.md` archived to `docs/_archive/2026-05-03-pre-spiral/GDD.md`. Sections now live as files under `docs/gdd/`.
