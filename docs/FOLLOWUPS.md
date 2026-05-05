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

(none yet)

## Polish

### F-004: Resolve orphan pickup-cue work

- Priority: nice-to-have
- Context: an earlier loop iteration started a pickup audio sting slice but exited mid-slice, leaving `src/game/pickupCue.ts` and `src/game/pickupCue.test.ts` untracked on disk. The helper module is self-consistent (exports `pickupCue` and `pickupCueTotalDurationMs`) and the tests pass on their own, but `FlatlineGame.tsx` was edited to call a `playPickupCue` function that was never written. The 2026-05-04 mobile-touch slice reverted the broken call site at `FlatlineGame.tsx` line 850 back to `playCue(520, settingsRef.current.audio)` so typecheck would pass.
- Blocker: none.
- Unblock condition: dev decides whether to revive the slice (write `playPickupCue` against the existing `PickupCueStyle` shape and re-wire the call site) or discard the orphan files via `git clean -fd src/game/pickupCue.*`.
- Status: done
- Resolved: 2026-05-04 pickup collection sparkle slice (PR #TBD). Slice revived: `playPickupCue` written in `src/components/FlatlineGame.tsx`, call site re-wired, `pickupCue.ts` and `pickupCue.test.ts` committed.

## Resolved

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
