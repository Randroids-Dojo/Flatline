# Flatline Implementation Plan

This document defines how agents select, execute, and complete work on Flatline.

## 1. Product Target

Flatline is a desktop web first, single-room, Doom-like survival shooter with hand-drawn billboard enemies. `GDD.md` is the canonical design.

MVP means a player can:

1. Open the game in a desktop browser.
2. Start a run quickly.
3. Move through one room with first-person controls.
4. Aim and shoot.
5. Fight billboard enemies.
6. Survive an endless difficulty ramp.
7. Die, see a run summary, and restart.

## 2. Loop Modes

The repo uses two loop modes.

### Research Mode

Research mode answers unknowns and prepares implementation tasks.

It may:

- Read source, docs, issues, PRs, and external references.
- Add or refine Dots tasks.
- Update `docs/OPEN_QUESTIONS.md`.
- Update `docs/FOLLOWUPS.md`.
- Write implementation specs.

It must not:

- Ship production code.
- Leave decisions undocumented.
- Close implementation tasks without evidence.

### Implementation Mode

Implementation mode executes ready Dots tasks.

It must:

- Pick one ready implementation task.
- Create one branch.
- Update code, tests, docs, and task state.
- Open one PR.
- Inspect and respond to PR review comments.
- Wait for CI.
- Merge only when green and review feedback is handled.
- Verify the deployed build when a deploy exists.
- Continue to the next ready task.

It must keep looping until one of these stop conditions is true:

- No ready dots remain.
- No release-blocking followups remain.
- No critical open questions block release.
- `docs/GDD_COVERAGE.json` has no actionable high-priority gaps.
- Further work is blocked by a documented user decision.

Completing one PR is not a stop condition.

## 3. Dots Taxonomy

Use Dots as the durable backlog.

Recommended title prefixes:

- `research:` for investigation and spec work.
- `implement:` for production code, tests, and docs.
- `bug:` for observed defects.
- `chore:` for workflow, CI, release, or dependency work.
- `docs:` for documentation-only work.

Priority levels:

- `0`: critical, blocks boot or deploy.
- `1`: high, blocks the next vertical slice.
- `2`: normal MVP work.
- `3`: polish.
- `4`: later backlog.

## 4. Slice Selection Rules

At the start of each loop:

1. Run `git checkout main && git pull --ff-only`.
2. Run `dot ls` and `dot ready`.
3. Check open PRs and CI.
4. Read `docs/FOLLOWUPS.md` for deferred work and release blockers.
5. Read `docs/GDD_COVERAGE.json` for implemented coverage and remaining gaps.
6. If main is broken, choose the hotfix first.
7. If a PR has unresolved actionable review comments, address them before new work.
8. Choose the highest-priority ready implementation task.
9. If no implementation task is ready, choose the highest-priority research task that can unblock one.
10. If no tasks are ready but coverage gaps remain, create the missing dot from the GDD coverage ledger.
11. If no tasks, followups, or coverage gaps are actionable, report that the backlog is complete or blocked.

## 5. Initial Vertical Slice Roadmap

The GDD defines five major slices.

### Slice 1: Walk and Shoot

Goal: a player can move around one room and shoot.

Expected work:

- Next.js application shell.
- Three.js room renderer.
- First-person camera.
- Pointer lock and mouse look.
- WASD movement.
- Crosshair.
- Pistol hitscan.
- Debug target dummy.
- Unit tests for movement and raycast basics.
- Playwright smoke for page load and starting a run.

### Slice 2: First Billboard Enemy

Goal: a flat enemy stands in the room, faces the player, and uses angle-aware sprite selection.

Expected work:

- Sprite atlas metadata loader.
- Billboard enemy render component.
- Angle bucket calculation.
- Placeholder idle, hurt, and death frames.
- Debug view for angle bucket and facing direction.
- Unit tests for angle bucket and animation frame selection.

### Slice 3: Enemy AI

Goal: an enemy chases, attacks, damages the player, and dies.

Expected work:

- Enemy state model.
- Chase movement.
- Melee attack windup and release.
- Health and damage.
- Death state.
- Player damage handling.
- Collision tests.
- Enemy state transition tests.

### Slice 4: Endless Spawn Director

Goal: the game becomes replayable.

Expected work:

- Spawn doors.
- Pressure budget.
- Difficulty ramp.
- Score model.
- Health and ammo pickups.
- Run summary.
- Restart flow.
- Spawn director tests.
- Scoring tests.

### Slice 5: Web Game Polish

Goal: the game feels like a real browser game.

Expected work:

- Title screen.
- Pause.
- Settings.
- Audio cues.
- Local leaderboard.
- Daily seed.
- Browser smoke coverage.
- Performance budget checks.

## 6. Per-Slice Definition of Done

A slice is done when:

1. The intended behavior works locally.
2. Tests exist for new pure logic.
3. Browser smoke exists for new critical user flow when applicable.
4. Docs reflect the new behavior.
5. The progress log has a new top entry.
6. Open questions and followups are current.
7. `docs/GDD_COVERAGE.json` reflects the covered GDD requirements and remaining gaps.
8. Dots state is current.
9. PR review comments are handled.
10. CI is green.
11. The merge commit is deployed and smoked when a deploy target exists.
12. The next loop candidate is known, or the stop condition is documented.

## 7. Progress Log Template

Add new entries at the top of `docs/PROGRESS_LOG.md`.

```markdown
## YYYY-MM-DD: Slice: <title>

- Status: Planned | In progress | Prepared | Merged | Blocked
- Branch: `<branch>`
- Dot: `<dot id>`
- GDD sections: `<sections>`
- Done:
  - <what changed>
- Verification:
  - <commands and results>
- Review:
  - <review comments handled or none>
- GDD edits:
  - <none or summary>
- Followups:
  - <none or ids>
- Open questions:
  - <none or ids>
```

## 8. Verification Baseline

Until the repo has a package manager and scripts, each slice should document the checks it can run.

Once the app scaffold exists, add standard scripts for:

- `lint`
- `typecheck`
- `test`
- `test:e2e`
- `build`
- `verify`

Implementation tasks should use `npm run verify` or the repo's equivalent before PR readiness.

## 9. Release Definition

The first public MVP release is ready when:

- All MVP must-have items in GDD section 20 are implemented or explicitly scoped out with approval.
- No open `blocks-release` followups remain.
- Main CI is green.
- The production build boots to the title screen.
- A smoke run can start, play, die, show summary, and restart.
- A version tag is created and pushed.

## 10. Continuous Loop Contract

The implementation loop is not a one-task workflow.

In practice:

1. Read rules and latest state.
2. Pick the highest-priority unblocked task from Dots, followups, GDD coverage gaps, and the implementation plan.
3. Build one PR-sized slice.
4. Update continuity docs and the coverage ledger.
5. Verify locally.
6. Open a PR, handle review comments, and wait for CI.
7. Merge, verify production, and close the task.
8. Repeat from step 1.

The agent should not ask whether to continue after a clean merge when ready work remains. It should continue until the backlog is complete or blocked.
