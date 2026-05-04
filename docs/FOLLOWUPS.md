# Followups

Backlog spillover discovered during implementation. Keep items PR-sized when possible.

> **Critical convention.** Every followup must carry a `Priority:` tag. Three buckets:
> - `blocks-release`: cannot ship v1 without this.
> - `nice-to-have`: improves the product but does not block.
> - `polish`: post-release cleanup.

## How to add a followup

```
## F-NNN: Short title

- Priority: blocks-release | nice-to-have | polish
- Context: one or two sentences on why this came up.
- Blocker (if any): the condition that prevents working on this now.
- Unblock condition: what has to be true to start.
- PR / Dot reference (when picked up): #N or dots-N
```

Keep `F-NNN` IDs monotonically increasing. When a followup ships, leave the entry in place and append a `- Resolved: PR #N` line. Never delete.

## Blocks Release

(none yet)

## Nice To Have

(none yet)

## Polish

(none yet)

## Resolved

### F-001: Split GDD into requirement-granular section files

- Priority: blocks-release
- Context: monolithic `GDD.md` flagged by `/spiral audit` as the chapter-granular coverage anti-pattern. Each requirement needs its own file so the coverage ledger can carry one row per requirement and the loop can find atomic gaps.
- Blocker: none.
- Unblock condition: re-init scaffold complete.
- Resolved: 2026-05-03 spiral re-init slice. `GDD.md` archived to `docs/_archive/2026-05-03-pre-spiral/GDD.md`. Sections live as files under `docs/gdd/`.

Pre-spiral followups (`F-001: Add package scaffold`, `F-002: Add deployed build smoke`, `F-003: Split GDD`) are preserved in `docs/_archive/2026-05-03-pre-spiral/FOLLOWUPS.md`. New IDs are monotonic from this re-init.
