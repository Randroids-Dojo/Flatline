# Flatline Progress Log

Newest entries go first.

## 2026-05-01: Slice: Room hazard visual polish

- Status: Complete
- Branch: `feat/room-hazard-visual-polish`
- Dot: `Flatline-implement-room-hazard-b7b648ba`
- GDD sections: 9, 20.1, 29.4, 29.5
- Done:
  - Added visible spawn door panels to the room landmarks.
  - Added pulsing door signal meshes when the spawn director opens a door.
  - Improved hazard warning and active phases with stronger opacity, scale, and color changes.
  - Updated GDD coverage for room and hazard visuals.
- Verification:
  - `node -e "JSON.parse(require('fs').readFileSync('docs/GDD_COVERAGE.json','utf8')); console.log('coverage json ok')"` passed.
  - `npm run test -- hazards` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test:e2e` passed with 6 browser smoke checks.
  - `npm run verify` passed with 14 test files, 54 unit tests, production build, and 6 browser smoke checks.
  - `git diff --check` passed.
  - Banned character scans for U+2014 and U+2013 returned no matches.
- Review:
  - PR #36 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `05527d8` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/`: root returned 200.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-05-01: Slice: Daily schedule preview

- Status: Complete
- Branch: `feat/daily-schedule-preview`
- Dot: `Flatline-implement-daily-schedule-2768d4c1`
- GDD sections: 5.2, 20.1, 29.7
- Done:
  - Added a deterministic daily schedule preview derived from the daily arena config.
  - Exposed spawn order, supply cooldown, and hazard first-warning times on the Daily route start screen.
  - Added unit coverage for preview determinism and browser smoke coverage for the Daily schedule panel.
  - Updated GDD coverage for Daily Mode.
- Verification:
  - `node -e "JSON.parse(require('fs').readFileSync('docs/GDD_COVERAGE.json','utf8')); console.log('coverage json ok')"` passed.
  - `npm run test -- dailyArena dailySeed` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test:e2e` passed with 6 browser smoke checks.
  - `npm run verify` passed with 14 test files, 54 unit tests, production build, and 6 browser smoke checks.
  - `git diff --check` passed.
  - Banned character scans for U+2014 and U+2013 returned no matches.
- Review:
  - PR #34 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `396551e` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/arena/daily`: route returned 200 and included the Daily schedule panel.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-05-01: Slice: Enemy atlas variants

- Status: Complete
- Branch: `feat/enemy-atlas-variants`
- Dot: `Flatline-implement-distinct-skitter-2482b448`
- GDD sections: 7, 8, 25, 26.1
- Done:
  - Added transparent PNG atlases for Skitter and Brute with the same 8-angle idle, hurt, and death contract as Grunt.
  - Added a reproducible enemy variant atlas generator.
  - Updated the renderer to load per-enemy atlas assets and switch the billboard texture by active enemy type.
  - Extended atlas validation tests to cover all committed enemy atlases.
  - Extended Practice Mode smoke coverage to start a Brute-only run.
- Verification:
  - `node -e "const fs=require('fs'); for (const path of ['docs/GDD_COVERAGE.json','public/assets/enemies/grunt/grunt.atlas.json','public/assets/enemies/skitter/skitter.atlas.json','public/assets/enemies/brute/brute.atlas.json']) JSON.parse(fs.readFileSync(path,'utf8')); console.log('json ok')"` passed.
  - `npm run test -- spriteAtlas billboard` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test:e2e` passed with 6 browser smoke checks.
  - `npm run verify` passed with 14 test files, 53 unit tests, production build, and 6 browser smoke checks.
  - `git diff --check` passed.
  - Banned character scans for U+2014 and U+2013 returned no matches.
- Review:
  - PR #32 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `031818f` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/`: root returned 200 and `/assets/enemies/skitter/skitter.png` plus `/assets/enemies/brute/brute.png` returned `image/png`.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-05-01: Slice: Weapon sprite foreground V1

- Status: Complete
- Branch: `feat/weapon-sprite-foreground`
- Dot: `Flatline-implement-weapon-sprite-ad59eb55`
- GDD sections: 7, 10, 25, 26.1
- Done:
  - Added transparent PNG foreground sprites for Peashooter, Boomstick, and Inkblaster.
  - Added idle and fire sprite states for each weapon.
  - Replaced CSS-only weapon geometry with sprite-backed weapon classes.
  - Wired the existing firing path to show a short weapon fire state.
  - Added browser smoke assertions for weapon sprite state changes.
- Verification:
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test:e2e` passed with 6 browser smoke checks.
  - `node -e "JSON.parse(require('fs').readFileSync('docs/GDD_COVERAGE.json','utf8')); console.log('coverage json ok')"` passed.
  - `npm run verify` passed with 14 test files, 53 unit tests, production build, and 6 browser smoke checks.
  - `git diff --check` passed.
  - Banned character scans for U+2014 and U+2013 returned no matches.
- Review:
  - PR #30 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `dba5f18` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/`: root returned 200 and `/assets/weapons/boomstick-fire.png` returned `image/png`.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-05-01: Slice: Polished Grunt atlas V1

- Status: Complete
- Branch: `feat/polished-grunt-atlas`
- Dot: `Flatline-implement-polished-grunt-b9596b0a`
- GDD sections: 7, 8, 25, 26.1
- Done:
  - Replaced the placeholder labeled Grunt SVG atlas with a transparent PNG atlas.
  - Added a reproducible Grunt atlas generator with 8 angles, 4 idle frames, 2 hurt frames, and 4 death frames.
  - Updated Grunt atlas metadata to load `grunt.png` at 1536 by 1920.
  - Added sprite atlas validation and committed metadata coverage.
  - Added a follow-on implementation dot for distinct Skitter and Brute atlas variants.
- Verification:
  - `npm run test -- spriteAtlas billboard` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `node -e "JSON.parse(require('fs').readFileSync('docs/GDD_COVERAGE.json','utf8')); JSON.parse(require('fs').readFileSync('public/assets/enemies/grunt/grunt.atlas.json','utf8')); console.log('json ok')"` passed.
  - `npm run verify` passed with 14 test files, 53 unit tests, production build, and 6 browser smoke checks.
  - `git diff --check` passed.
  - Banned character scans for U+2014 and U+2013 returned no matches.
- Review:
  - PR #28 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `8025172` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/`: root returned 200 and `/assets/enemies/grunt/grunt.png` returned `image/png`.
- GDD edits:
  - None.
- Followups:
  - `Flatline-implement-distinct-skitter-2482b448`
- Open questions:
  - None.

## 2026-04-30: Slice: Practice room state freeze

- Status: Complete
- Branch: `feat/practice-room-freeze`
- Dot: `Flatline-implement-practice-room-b6778fd9`
- GDD sections: 5.3, 29.8
- Done:
  - Added a Practice Mode freeze room control.
  - Split room state timing from run timing so hazards, moving cover, and pressure lighting can freeze while play continues.
  - Updated practice smoke coverage for the new control.
  - Marked Practice Mode coverage implemented.
- Verification:
  - `node -e "JSON.parse(require('fs').readFileSync('docs/GDD_COVERAGE.json','utf8')); console.log('coverage json ok')"` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test:e2e` passed with 6 browser smoke checks.
  - `npm run verify` passed with 14 test files, 51 unit tests, production build, and 6 browser smoke checks.
  - `git diff --check` passed.
  - Banned character scans for U+2014 and U+2013 returned no matches.
- Review:
  - PR #26 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `9429c83` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/arena/practice`: route returned 200.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-04-30: Research: Final art pipeline and first polished enemy sheet

- Status: Complete
- Branch: `docs/final-art-pipeline-research`
- Dot: `Flatline-research-final-art-83b50647`
- GDD sections: 7, 8, 25, 26, 29.8
- Findings:
  - The renderer already supports 8 angle buckets and atlas-driven frame selection.
  - The committed Grunt art is still a placeholder SVG with labels and grid cells.
  - Skitter and Brute still reuse Grunt art through tint and scale.
  - Practice Mode is the right validation surface for art, but it still lacks the GDD-required room state freeze control.
- Decisions:
  - The first polished art target is Grunt because it is centered at run start and appears in every mode.
  - The first committed polished enemy should be a transparent PNG plus existing atlas JSON shape, not a new runtime asset format.
  - Idle, hurt, and death are the first animation contract because those are the runtime states currently available.
- Done:
  - Added `docs/ART_PIPELINE.md` with asset direction, atlas contract, validation checklist, and implementation slices.
  - Corrected GDD coverage for Practice Mode to partial because room state freeze remains open.
  - Refined final-art coverage from gap to partial with the pipeline spec as the current implementation artifact.
  - Created follow-on implement dots for room state freeze, polished Grunt atlas V1, and weapon sprite foreground V1.
- Verification:
  - `node -e "JSON.parse(require('fs').readFileSync('docs/GDD_COVERAGE.json','utf8')); console.log('coverage json ok')"` passed.
  - `npm run lint` passed.
  - `git diff --check` passed.
  - Banned character scans for U+2014 and U+2013 returned no matches.
- Review:
  - PR #24 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `03fcb56` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/` and `/arena/practice`: both routes returned 200.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-04-30: Slice: Practice mode controls

- Status: Complete
- Branch: `feat/practice-mode-controls`
- Dot: `Flatline-implement-practice-mode-7c1fb46f`
- GDD sections: 5.3, 20, 29.8
- Done:
  - Added `/arena/practice` as a no-leaderboard practice route.
  - Added practice tuning controls for starting weapon, enemy types, spawn rate, infinite ammo, damage, and billboard debug overlays.
  - Wired practice settings into run startup, ammo spending, damage handling, spawn cadence, enemy selection, and debug HUD visibility.
  - Added unit coverage for spawn cadence scaling and browser smoke coverage for practice controls.
- Verification:
  - `npm run test -- spawnDirector` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test:e2e` passed with 6 browser smoke checks.
  - `npm run verify` passed with 14 test files, 51 unit tests, production build, and 6 browser smoke checks.
- Review:
  - PR #22 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `5d64b5c` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/arena/practice`: route returned 200 and included the Flatline app shell.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-04-30: Slice: Continuous loop docs and coverage ledger

- Status: Complete
- Branch: `docs/continuous-loop-coverage`
- Dot: `Flatline-new-b7840626`
- GDD sections: 20, 21, 25, 27, 28, 29
- Done:
  - Strengthened the agent docs so continuing the loop is the default after every clean merge.
  - Added `docs/GDD_COVERAGE.json` as the coverage ledger for implemented requirements, tests, and remaining gaps.
  - Added the coverage ledger to mandatory reading, slice selection, documentation policy, and pre-commit expectations.
  - Updated README project docs and loop quickstart to describe the continuous loop.
- Verification:
  - `node -e "JSON.parse(require('fs').readFileSync('docs/GDD_COVERAGE.json','utf8')); console.log('coverage json ok')"` passed.
  - `npm run lint` passed.
  - `git diff --check` passed.
  - Banned character scans for U+2014 and U+2013 returned no matches.
- Review:
  - PR #20 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `997a9d3` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/`: root returned 200 and `/api/leaderboard` returned `unavailable:false`.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-04-30: Slice: Deterministic daily room V2

- Status: Complete
- Branch: `feat/daily-room-v2`
- Dot: `Flatline-new-8e878312`
- GDD sections: 5, 20, 29
- Done:
  - Added deterministic daily arena config derived from the daily seed.
  - Added daily hazard timing offset, spawn role offset, and supply cooldown variation.
  - Wired `/arena/daily` to run in daily arena mode while keeping daily leaderboard as the default scope.
  - Added unit tests for daily config stability and seed variation.
- Verification:
  - `npm run test -- dailyArena dailySeed` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run verify` passed with 14 test files, 50 unit tests, and 4 browser smoke checks.
  - `npm audit --audit-level=moderate` found 0 vulnerabilities.
- Review:
  - PR #18 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `c4a4fed` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/arena/daily`: loaded the daily seed and daily leaderboard.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-04-30: Slice: Room states and hazards V1

- Status: Complete
- Branch: `feat/room-hazards-v1`
- Dot: `Flatline-new-e560593f`
- GDD sections: 9, 20, 29
- Done:
  - Added deterministic hazard timing for flame lane, ink pool, and falling light.
  - Added pure hazard tests for warning, activation, damage shapes, and pressure intensity.
  - Added browser-visible hazard telegraphs and active overlays.
  - Added pressure-linked overhead lighting.
  - Added a moving cover panel cycle in the arena.
  - Added player hazard damage with cooldown and HUD status feedback.
- Verification:
  - `npm run test -- hazards` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run verify` passed with 13 test files, 47 unit tests, and 4 browser smoke checks.
  - `npm audit --audit-level=moderate` found 0 vulnerabilities.
- Review:
  - PR #16 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `fbd10e7` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/`: started a run and confirmed the WebGL canvas rendered.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-04-30: Slice: Enemy roster V1

- Status: Complete
- Branch: `feat/enemy-roster-v1`
- Dot: `Flatline-new-eae2c1f1`
- GDD sections: 8, 11, 20, 29
- Done:
  - Added enemy types for Grunt, Skitter, and Brute.
  - Added distinct health, speed, attack timing, pressure cost, scale, and tint configs.
  - Added deterministic spawn-type rotation so Skitters and Brutes enter future waves.
  - Updated the HUD and spawn status to show enemy role names.
  - Added unit tests for role stats and spawn rotation.
- Verification:
  - `npm run test -- enemies` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run verify` passed with 12 test files, 44 unit tests, and 4 browser smoke checks.
  - `npm audit --audit-level=moderate` found 0 vulnerabilities.
- Review:
  - PR #14 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `a3efdd3` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/`: started a run and confirmed the HUD shows the Grunt enemy role.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-04-30: Slice: Weapon set V1

- Status: Complete
- Branch: `feat/weapon-set-v1`
- Dot: `Flatline-new-bc692035`
- GDD sections: 10, 20, 29
- Done:
  - Added a pure weapon config and ammo model for Peashooter, Boomstick, and Inkblaster.
  - Added HUD weapon selection with number keys and Q cycling.
  - Kept Peashooter as infinite ammo hitscan fallback.
  - Added Boomstick spread fire with limited ammo and knockback.
  - Added Inkblaster moving projectiles with limited ammo and splash collision.
  - Expanded center supplies to restore limited weapon ammo.
  - Added weapon unit tests and browser smoke coverage for weapon switching and firing.
- Verification:
  - `npm run test -- weapons movement shooting` passed.
  - `npm run lint` passed.
  - `npm run typecheck` passed.
  - `npm run test:e2e` passed with 4 browser smoke checks.
  - `npm run verify` passed with 12 test files, 42 unit tests, and 4 browser smoke checks.
  - `npm audit --audit-level=moderate` found 0 vulnerabilities.
- Review:
  - PR #12 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `41178c2` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/`: switched to Boomstick, fired, saw `Boomstick dropped the enemy.`, switched to Inkblaster, fired, and saw `Inkblaster projectile launched.`.
- GDD edits:
  - None.
- Followups:
  - None.
- Open questions:
  - None.

## 2026-04-30: Slice: Input, projectile feedback, and post-MVP plan

- Status: Complete
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
  - PR #10 merged to `main` after CodeQL, Vercel, and Vercel Preview Comments passed.
  - Review thread query found no unresolved threads.
- Deploy:
  - Production Vercel deployment for merge commit `6b62cbf` passed.
  - Live smoke passed on `https://flatline-gamma.vercel.app/`: started a run, fired a shot, status showed `Billboard enemy hurt.`, and the HUD showed `Hits 1`.
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
