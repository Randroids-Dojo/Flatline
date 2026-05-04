# Open Questions

Questions here block or influence implementation.

> **Critical convention.** Every question must include a `Recommended default:` line. The loop ships under that default and leaves the question open for override. Do not block the loop on dev sign-off. Stress-tested values that survive multiple iterations get frozen.

## How to add a new question

```
## Q-NNN: Short title

- Context: one or two sentences on why this is a decision point.
- Options:
  - A. Option A description.
  - B. Option B description.
  - C. Option C description.
- Recommended default: B. One sentence on the rationale.
- Status: open
- Resolution: (filled in once dev confirms or overrides)
```

Keep `Q-NNN` IDs monotonically increasing. When a question resolves, leave the entry in place and update `Status: resolved` plus the `Resolution:` line. Never delete.

## Open

(none)

## Resolved

### Q-001: Should MVP use mostly grayscale with accent colors?

- Context: GDD section 12 (art direction) recommends mostly grayscale with one interactable accent and one danger color, but section 54 (risks: readability) asks whether the game should be pure black-and-white or mostly grayscale.
- Options:
  - A. Pure black-and-white.
  - B. Mostly grayscale with one interactable accent and one danger color.
  - C. Full color palette.
- Recommended default: B. Grayscale plus accents reads as drawn while still flagging gameplay-critical objects.
- Status: resolved
- Resolution: Use mostly grayscale for MVP with teal interactable accents and red danger feedback. Decided 2026-04-30.

### Q-002: Should MVP enemy art use 5 angles or 8 angles first?

- Context: GDD section 13 (character art) lists 8-direction animation support, while section 13 also allows a 5-angle shortcut for MVP art cost.
- Options:
  - A. Author 5 angles, mirror left/right.
  - B. Author 8 angles up front.
  - C. Build 8-angle engine, ship placeholder art that may mirror down from 5 authored angles.
- Recommended default: C. Engine matches GDD, art cost stays low until gameplay is validated.
- Status: resolved
- Resolution: Implement 8-angle engine support in slice 2. Placeholder art may mirror authored angles until final enemy sheets exist. Decided 2026-04-30.

### Q-003: Should the first public leaderboard be local-only or server-backed?

- Context: GDD section 48 (MVP must have) lists basic leaderboard, section 48 (MVP can fake) accepts local-first, and section 04 (technical base) lists optional Upstash Redis.
- Options:
  - A. Local personal best only.
  - B. Local leaderboard plus optional server leaderboard.
  - C. Server leaderboards (all-time and daily) with local fallback when KV is unavailable.
- Recommended default: C. The infra is small, the GDD calls for shared leaderboards, and the local fallback keeps the game playable offline.
- Status: resolved
- Resolution: Ship shared all-time and daily leaderboards through Upstash Redis, with local leaderboard as a fallback when KV is unavailable. Decided 2026-04-30.

### Q-004: Should the MVP room be authored manually or generated from a seed?

- Context: GDD section 54 (risks) leaves room authoring unresolved, while section 19 (arena shape) defines a concrete MVP room.
- Options:
  - A. Manually authored single room.
  - B. Seed-driven generation from day one.
  - C. Manually authored MVP room, seeded daily mode later.
- Recommended default: C. Hand-authored room makes slice 1 cheap; deterministic seed work belongs to the daily mode slice.
- Status: resolved
- Resolution: Use one manually authored MVP room for slice 1 and defer seeded daily configuration to the later daily mode slice. Decided 2026-04-30.

### Q-005: Should weapons reload in MVP?

- Context: GDD section 27 (no reloads in MVP) recommends no reloads in MVP unless required by weapon fantasy.
- Options:
  - A. No reloads.
  - B. Reloads on every weapon.
  - C. Reloads only on weapons whose fantasy demands it.
- Recommended default: A. Doom-like flow is stronger without reloads.
- Status: resolved
- Resolution: Do not implement reloads in MVP. The pistol remains infinite ammo. Decided 2026-04-30.
