# Flatline Working Agreement

This document defines how agents work in the Flatline repo.

## 1. Branching

Use one branch per slice:

- `feat/<slice>` for features.
- `fix/<slice>` for bugs.
- `chore/<slice>` for tooling, CI, release, or dependencies.
- `docs/<slice>` for docs-only changes.

Branch from `main`. Do not push directly to `main`.

## 2. Commits

Commit format:

```text
<type>(<area>): <imperative summary>
```

Examples:

```text
feat(input): add pointer lock movement
fix(enemy): clamp chase velocity near player
docs(loop): add implementation backlog rules
```

Commit bodies should explain why the change exists when the subject is not enough.

Do not use AI attribution in commit messages.

## 3. Pull Requests

Every implementation slice uses one PR.

PR body should include:

- Summary.
- GDD sections.
- Dots task id.
- Progress log entry.
- Verification commands and results.
- Review comment status.
- Followups and open questions.

Before merge:

1. Wait for CI green.
2. Inspect unresolved review threads.
3. Address actionable feedback.
4. Reply to each handled thread.
5. Resolve handled threads.
6. Re-run relevant checks.

## 4. Review Comment Protocol

Use GitHub PR review threads as part of the loop.

For each unresolved thread:

- If actionable, fix it or explain why the existing code is correct.
- Reply in the thread with the disposition.
- Resolve the thread after the disposition is complete.
- If the comment requires a larger slice, create a Dots task and a `docs/FOLLOWUPS.md` entry, then reply with the followup id.

Do not silently ignore Copilot, human, inline, or threaded comments.

## 5. CI and Deploy

CI must be green before merge.

If a deploy target exists:

1. Merge only after checks pass.
2. Sync local `main`.
3. Watch the deploy for the merge commit.
4. Smoke the deployed build.
5. If deploy is broken, stop new feature work and fix deploy first.

## 6. Testing Policy

New pure game logic needs unit tests.

Required unit test areas include:

- Movement.
- Shooting and raycast.
- Enemy state transitions.
- Collision.
- Spawn director.
- Scoring.
- Billboard angle bucket selection.
- Sprite animation frame selection.
- Daily seed determinism.

Critical browser flows need Playwright smoke tests once the app exists:

- Page loads.
- Run starts.
- HUD appears.
- Pause opens.
- Restart works.
- Run summary appears after forced death.
- Daily route loads a deterministic seed.

## 7. Documentation Policy

Docs are part of the product.

Each slice updates:

- `docs/PROGRESS_LOG.md`
- `docs/OPEN_QUESTIONS.md` when decisions change.
- `docs/FOLLOWUPS.md` when work is deferred.
- `docs/GDD_COVERAGE.json` when GDD coverage changes.
- `GDD.md` when design changes.
- Dots task state.

## 8. Clarification Protocol

When requirements are ambiguous:

1. Search the GDD and docs.
2. If still ambiguous, add an entry to `docs/OPEN_QUESTIONS.md` as `Q-NNN`.
3. Recommend a default.
4. If the decision is cheap to reverse, proceed under a labelled assumption.
5. If the decision is expensive to reverse, block the slice and ask the user.

Open question format:

```markdown
### Q-NNN: <question>

- Status: open | answered | obsolete
- Date: YYYY-MM-DD
- Context: <why it matters>
- Recommendation: <default>
- Decision: <blank until answered>
```

## 9. Followup Protocol

Use `docs/FOLLOWUPS.md` for deferred work that should survive context loss.

Followup format:

```markdown
### F-NNN: <title>

- Status: open | done | obsolete
- Priority: blocks-release | high | normal | polish | later
- Created: YYYY-MM-DD
- Source: <PR, GDD section, bug, or review thread>
- Description: <what remains>
- Completion: <blank until done>
```

## 10. Risky Actions

Get explicit confirmation before:

- Deleting branches.
- Force pushing.
- Dropping persisted save fields.
- Changing license.
- Changing deploy target.
- Adding paid services.
- Adding telemetry or analytics.
- Publishing assets under a new license.
- Replacing the tech stack after implementation starts.

## 11. Loop Prompt Contract

Agents running the implementation loop must:

1. Read the mandatory docs.
2. Sync `main`.
3. Inspect Dots.
4. Inspect followups and GDD coverage gaps.
5. Inspect open PR review comments.
6. Pick one ready slice.
7. Work on a branch.
8. Verify locally.
9. Open or update a PR.
10. Address review comments.
11. Wait for CI.
12. Merge only when clean.
13. Verify deploy when applicable.
14. Close the task with evidence.
15. Continue to the next ready task or create a task for the next actionable coverage gap.

Stopping is only allowed when all planned work is complete or the backlog is genuinely blocked by a user decision.
