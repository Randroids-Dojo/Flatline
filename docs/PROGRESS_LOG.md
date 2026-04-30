# Flatline Progress Log

Newest entries go first.

## 2026-04-30: Slice: Walk and Shoot

- Status: In progress
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
  - No PR yet.
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
