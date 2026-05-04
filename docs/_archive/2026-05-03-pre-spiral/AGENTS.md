# AGENTS.md

Shared rules for every agentic coding tool working in this repo. This file is mandatory reading before writing code, editing docs, opening a PR, or changing task state.

This file is the entry point. It points at the documents that govern what to build and how to behave while building it.

## Rule 1: never use em dashes or en dashes

Do not use Unicode em dash U+2014 or Unicode en dash U+2013 in chat, code comments, commit messages, PR descriptions, docs, tests, or generated content.

Use a period, comma, colon, parentheses, or a plain hyphen instead.

Before every commit or PR, run:

```bash
grep -rn $'\u2014' .
grep -rn $'\u2013' .
```

Both commands must return nothing, excluding ignored dependency output.

## Rule 2: mandatory reading order

Before starting a slice, read in this order:

1. `README.md` for orientation.
2. `docs/IMPLEMENTATION_PLAN.md` for what to build, loop shape, slice selection, and definitions of done.
3. `docs/WORKING_AGREEMENT.md` for branching, commits, PRs, verification, review handling, and deploy behavior.
4. `GDD.md` for the game design. It is the source of truth.
5. The most recent dozen entries in `docs/PROGRESS_LOG.md`, then `docs/OPEN_QUESTIONS.md` and `docs/FOLLOWUPS.md`.
6. `docs/GDD_COVERAGE.json` for implemented requirements and remaining gaps.

If this file conflicts with `docs/IMPLEMENTATION_PLAN.md` or `docs/WORKING_AGREEMENT.md`, those documents win. Fix the conflict in the same PR.

## Rule 3: GDD is the source of truth

`GDD.md` defines Flatline.

Before adding features, changing game mechanics, choosing architecture, changing routes, renaming data fields, or adding tasks, read the relevant GDD section.

If code and GDD disagree, resolve the disagreement explicitly in the same PR:

- Change the code to match the GDD, or
- Update the GDD and note the change in `docs/PROGRESS_LOG.md`.

If the GDD is silent on a decision that cannot be reversed cheaply, use the clarification protocol in `docs/WORKING_AGREEMENT.md`.

## Rule 4: one slice, one branch, one PR

Implementation work runs the loop in `docs/IMPLEMENTATION_PLAN.md`.

- Branch from `main` as `feat/<slice>`, `fix/<slice>`, `chore/<slice>`, or `docs/<slice>`.
- Never push directly to `main`.
- Keep one PR per slice.
- Commit messages follow `<type>(<area>): <imperative summary>`.
- Do not use `--no-verify`.
- Do not force push `main` or any branch with someone else's commits.
- Wait for CI green before merge.

After merge, sync `main`, watch CI and deploys, and smoke the deployed build if a deploy target exists.

## Rule 5: always log the loop

Every slice ends with these documentation updates:

- Add a new entry to the top of `docs/PROGRESS_LOG.md`.
- Add or update decisions in `docs/OPEN_QUESTIONS.md`.
- Add, update, or close deferred work in `docs/FOLLOWUPS.md`.
- Update `docs/GDD_COVERAGE.json` when a slice implements, scopes, or changes coverage of a GDD requirement.
- Update Dots task state with `dot on <id>` before work and `dot off <id> -r "<reason>"` when done.

A cold agent must be able to read the mandatory docs and continue without guessing.

## Rule 5A: work continuously in the loop

Do not stop after one completed task while ready or discoverable work remains.

After every merge:

1. Sync `main`.
2. Watch CI and deployment.
3. Smoke the deployed build when a deploy target exists.
4. Close the completed dot with evidence.
5. Read `dot ready`, `docs/FOLLOWUPS.md`, and `docs/GDD_COVERAGE.json`.
6. Pick the next highest-priority unblocked task.
7. Start the next branch.

Stopping is allowed only when no ready dots, no release-blocking followups, no critical open questions, and no actionable GDD coverage gaps remain, or when a user decision blocks further work.

## Rule 6: review comments are part of the loop

Before merging any PR:

1. Check CI status.
2. Inspect unresolved PR review threads, including inline and threaded comments.
3. Address actionable feedback with code, tests, or docs.
4. Reply to each actionable thread with the disposition.
5. Resolve handled threads.
6. Re-run the relevant verification.

Do not merge while unresolved actionable review comments remain.

## Rule 7: secrets and services

- Never commit `.env`, `.env.local`, credentials, private keys, access tokens, or secret values.
- Never print secret values in logs, chat, commit messages, or PR bodies.
- Do not add paid services, telemetry, analytics, or production environment variables without explicit confirmation.
- Prefer local storage and local-only leaderboards until the GDD or a slice explicitly calls for server persistence.

## Rule 8: testing expectations

Testing scales with risk.

- Pure game logic needs unit tests.
- Routes need route-handler tests and at least one browser smoke.
- Renderer and input changes need real browser verification when possible.
- Deterministic systems need deterministic tests.
- Do not mark a task complete with failing tests, lint errors, type errors, or red CI.

If browser automation is unavailable, say so in the progress log and request manual verification.

## Rule 9: scope discipline

- One slice should fit in one PR.
- Do not add features the GDD does not require.
- Do not invent large abstractions before the code asks for them.
- Do not add comments that restate the code.
- If a slice grows, split it and create followup dots.

## Quick pre-commit checklist

1. No U+2014 or U+2013 characters.
2. No AI attribution in commits or PR bodies.
3. Tests and checks pass locally.
4. GDD remains accurate.
5. `docs/PROGRESS_LOG.md`, `docs/OPEN_QUESTIONS.md`, and `docs/FOLLOWUPS.md` reflect the slice.
6. `docs/GDD_COVERAGE.json` reflects implemented coverage and gaps.
7. Dots task state is correct.
8. No secrets in the diff.
9. Branch and commits follow `docs/WORKING_AGREEMENT.md`.
