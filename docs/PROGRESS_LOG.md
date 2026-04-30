# Flatline Progress Log

Newest entries go first.

## 2026-04-30: Slice: Input, projectile feedback, and post-MVP plan

- Status: In progress
- Branch: `fix/input-projectiles-roadmap`
- Dot: `Flatline-new-625746d6`
- GDD sections: 6, 10, 20, 29
- Done:
  - Fixed camera-relative forward movement so W and S match the rendered view.
  - Aligned pistol hitscan direction with the Three.js camera forward vector.
  - Added visible shot bolts for pistol fire while keeping hitscan damage timing.
  - Added a post-MVP product plan to the GDD.
  - Added backlog dots for weapon set V1, enemy roster V1, room states and hazards V1, and deterministic daily room V2.
- Verification:
  - `npm run test -- movement shooting` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run verify` passed with 11 test files, 37 unit tests, and 4 browser smoke checks.
  - `npm audit --audit-level=moderate` found 0 vulnerabilities.
- Review:
  - No PR yet.
- GDD edits:
  - Added section 29, Post-MVP Product Plan.
- Followups:
  - Added Dots tasks for the next product slices.
- Open questions:
  - None.

## 2026-04-30: Slice: Shared KV leaderboards

- Status: Complete
- Branch: `feat/shared-kv-leaderboards`
- Dot: `Flatline-implement-shared-kv-9985c5d4`
- GDD sections: 3, 5, 14, 20, 21, 24, 27
- Done:
  - Added Upstash Redis KV support using `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
  - Added shared all-time and daily leaderboard API routes.
  - Added initials submission from the run summary.
  - Added shared board tabs to the title, pause, and summary surfaces.
  - Kept local browser leaderboard as a fallback.
  - Added API and helper tests with fake KV coverage.
- Verification:
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test` passed with 11 files and 35 tests.
  - `npm run verify` passed.
  - `npm audit --audit-level=moderate` found 0 vulnerabilities.
- Review:
  - PR #8 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `daee67d` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/`.
  - Production `GET /api/leaderboard?scope=all` returned `unavailable: true`, confirming KV env vars still need to be configured in Vercel before shared scores persist.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - Updated `Q-003`.

## 2026-04-30: Slice: MVP loop closure

- Status: In progress
- Branch: `docs/finalize-mvp-loop`
- Dot: `Flatline-research-asset-pipeline-9b9a2cba`, `Flatline-research-leaderboard-7c91cf9a`
- GDD sections: 20, 25, 27, 28
- Done:
  - Closed the asset pipeline research dot as resolved by the shipped placeholder grunt atlas, SVG sheet, 8-angle engine support, and debug HUD.
  - Closed the leaderboard research dot as resolved by `Q-003` and shipped local leaderboard persistence.
  - Confirmed no `blocks-release` followups remain open.
  - Confirmed all open questions are answered.
- Verification:
  - Main CodeQL passed after PR #6.
  - `npm run verify` passed.
  - `npm audit --audit-level=moderate` passed.
- Review:
  - No PR yet.
- GDD edits:
  - None.
- Followups:
  - `F-002` remains high priority for future hosting because no deploy target exists.
  - `F-003` remains later backlog.
- Open questions:
  - None.

## 2026-04-30: Slice: Web Game Polish

- Status: Merged
- Branch: `feat/slice-5-web-polish`
- Dot: `Flatline-implement-slice-5-0b00421a`
- GDD sections: 5, 10, 15, 16, 20, 21, 22, 24
- Done:
  - Added pause and resume flow with settings controls.
  - Added persisted sensitivity, FOV, and audio settings.
  - Added generated audio cues for fire, hit, kill, and pickup events.
  - Added local leaderboard persistence and display on run summary.
  - Added deterministic daily seed utility and `/arena/daily` route.
  - Expanded Playwright smoke for leaderboard, pause, settings, restart, and daily route.
- Verification:
  - `npm run verify` passed with 9 unit test files, 29 unit tests, and 4 browser smoke checks.
  - `npm audit --audit-level=moderate` passed.
- Review:
  - PR #6 merged after no review threads and CodeQL passed.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - Answered `Q-001`, `Q-003`, and `Q-005` according to implemented MVP defaults.

## 2026-04-30: Slice: Endless Spawn Director

- Status: Merged
- Branch: `feat/slice-4-spawn-director`
- Dot: `Flatline-implement-slice-4-8251595e`
- GDD sections: 12, 13, 14, 15, 20, 21, 22
- Done:
  - Added a deterministic pressure-based spawn director with four MVP spawn doors and cadence ramp.
  - Added score tracking for shots, accuracy, kills, combo, survival bonus, and final score.
  - Added an endless prototype loop with enemy respawns, score HUD, kill HUD, run timer, center health pickup, death summary, and restart.
  - Added unit tests for pressure ramp, spawn cadence, safe door selection, scoring, combo, survival bonus, and accuracy.
  - Expanded Playwright smoke to force a death summary and verify restart.
- Verification:
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test` passed with 7 files and 26 tests.
  - `npm run verify` passed.
  - `npm audit --audit-level=moderate` passed.
- Review:
  - PR #5 merged after no review threads and CodeQL passed.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-04-30: Slice: Enemy AI

- Status: Merged
- Branch: `feat/slice-3-enemy-ai`
- Dot: `Flatline-implement-slice-3-c0d80db8`
- GDD sections: 8, 11, 17, 18, 20, 21, 22
- Done:
  - Added pure enemy state logic for chase, melee windup, release, hurt recovery, damage, and death.
  - Added player damage handling and enemy health display to the playable prototype.
  - Connected the billboard enemy position, facing angle, animation, and hit state to the enemy simulation.
  - Added deterministic unit tests for chase movement, circle collision safety, melee hit and miss transitions, and damage states.
- Verification:
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test` passed with 5 files and 18 tests.
  - `npm run verify` passed.
  - `npm audit --audit-level=moderate` passed.
- Review:
  - PR #4 merged after no review threads and CodeQL passed.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-04-30: Slice: First Billboard Enemy

- Status: Merged
- Branch: `feat/slice-2-billboard-enemy`
- Dot: `Flatline-implement-slice-2-b073353e`
- GDD sections: 6, 7, 8, 18, 20, 21, 22, 25
- Done:
  - Added 8-angle billboard bucket selection and sprite animation frame selection logic.
  - Added a placeholder grunt atlas metadata file and SVG sprite sheet with idle, hurt, and death rows.
  - Replaced the debug target capsule with a camera-facing billboard enemy plane using atlas UV updates.
  - Added a debug HUD readout for angle bucket, sprite angle, and animation state.
  - Added unit tests for angle buckets, atlas clip selection, frame timing, and UV transforms.
  - Expanded Playwright smoke to capture screenshots and validate WebGL pixels on desktop and mobile viewports.
- Verification:
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test` passed with 4 files and 13 tests.
  - `npm run build` passed.
  - `npm run test:e2e` passed with 2 browser smoke checks.
  - `npm run verify` passed.
  - `npm audit --audit-level=moderate` passed.
- Review:
  - PR #3 merged after no review threads and CodeQL passed.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - Answered `Q-002` with 8-angle engine support and placeholder mirrored art.

## 2026-04-30: Slice: Walk and Shoot

- Status: Merged
- Branch: `feat/slice-1-walk-shoot`
- Dot: `Flatline-implement-slice-1-c57819d8`
- GDD sections: 6, 9, 10, 20, 21, 22, 28
- Done:
  - Added the Next.js, React, Three.js, TypeScript, Vitest, and Playwright scaffold.
  - Added a full-screen Three.js room with landmarks, pillars, center altar, first-person camera, crosshair, and foreground pistol presentation.
  - Added pointer lock mouse look, WASD movement, hitscan pistol fire, debug target dummy hit feedback, and HUD status.
  - Added deterministic unit tests for movement and hitscan raycast basics.
  - Added Playwright smoke coverage for run start plus WebGL canvas pixel checks on desktop and mobile viewports.
- Verification:
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test` passed.
  - `npm run build` passed.
  - `npm run test:e2e` passed with 2 browser smoke checks.
  - `npm run verify` passed.
  - `npm audit --audit-level=moderate` passed.
- Review:
  - PR #2 merged after no review threads and CodeQL passed on main.
- GDD edits:
  - None.
- Followups:
  - Marked `F-001` done.
- Open questions:
  - Proceeded with the Q-004 recommended default for a manually authored MVP room.

## 2026-04-30: Slice: Loop scaffold

- Status: Prepared
- Branch: `chore/loop-scaffold`
- Dot: `Flatline-chore-loop-scaffold-a719ba0d`
- GDD sections: 20, 21, 22, 25, 27, 28
- Done:
  - Added agent operating rules.
  - Added implementation loop plan.
  - Added working agreement.
  - Added progress, open question, and followup ledgers.
  - Prepared the repo for Dots-based research and implementation tasks.
  - Seeded Dots with the five GDD vertical slices plus research tasks.
- Verification:
  - `dot ls` shows initial backlog.
  - `dot ready` shows slice 1 and research tasks ready.
  - `git diff --check` passed.
  - No U+2014 or U+2013 characters found in repo docs or Dots files.
- Review:
  - Pending PR review.
- GDD edits:
  - None.
- Followups:
  - Initial entries seeded in `docs/FOLLOWUPS.md`.
- Open questions:
  - Initial entries seeded in `docs/OPEN_QUESTIONS.md`.
