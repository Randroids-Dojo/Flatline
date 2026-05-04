# Progress Log

Newest entries first. Every implementation slice adds an entry. Append-only: never delete, never reorder, never edit a previous entry.

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

## 2026-05-03, Spiral Re-Init

- Branch: `chore/spiral-re-init`
- Changed: full re-init via the `spiral` skill after `/spiral audit` flagged 13 findings on the pre-spiral scaffold (chapter-granular coverage, missing qualitative gates, monolith GDD, Q-NNN entries without `Recommended default:` lines). Archived the old scaffold under `docs/_archive/2026-05-03-pre-spiral/` via `git mv` to preserve history. Wrote the canonical templates: `AGENTS.md`, `CLAUDE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/WORKING_AGREEMENT.md`, `docs/gdd/README.md`, `docs/GDD_COVERAGE.json`, `docs/PROGRESS_LOG.md`, `docs/OPEN_QUESTIONS.md`, `docs/FOLLOWUPS.md`, `docs/PLAYTEST.md`, `docs/FUN_FACTOR_AUDIT.md`, plus the three `.claude/rules/*.md` path-scoped rule files and the two `docs/AGENTS.md` / `docs/gdd/AGENTS.md` Codex symlinks. Split `GDD.md` (29 sections, ~1600 lines) into requirement-granular files under `docs/gdd/`. Replaced the placeholder coverage rows with real requirement rows, status-tagged from the archived `GDD_COVERAGE.json` and the existing codebase. Ported the 5 design Q-NNN (grayscale, angles, leaderboard, room authoring, reloads) into the new `OPEN_QUESTIONS.md` with `Recommended default:` lines and resolved status preserved.
- Verification: em-dash and en-dash grep returned nothing (`grep -rnP '[\x{2014}\x{2013}]'`); the spiral audit script printed 0 findings on its final run.
- Assumptions: requirement rows whose archived coverage said `implemented` were carried forward as `done` only when an implementation file path still exists; ambiguous rows downgraded to `partial`. Polish-area requirements without code refs marked `not_started`.
- GDD coverage: ledger fully rewritten at requirement granularity. Every `docs/gdd/*.md` file has a `Status:` line.
- Followups: F-001 (split GDD) created and resolved by this slice.
