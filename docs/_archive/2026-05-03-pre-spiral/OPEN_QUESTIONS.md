# Flatline Open Questions

Resolved questions are marked `answered` or `obsolete`. Do not delete them.

### Q-001: Should MVP use mostly grayscale with accent colors?

- Status: answered
- Date: 2026-04-30
- Context: GDD section 7 recommends mostly grayscale with one interactable accent and one danger color, but section 27 asks whether the game should be pure black-and-white or mostly grayscale.
- Recommendation: Use mostly grayscale for MVP with one interactable accent and one danger color.
- Decision: Use mostly grayscale for MVP with teal interactable accents and red danger feedback.

### Q-002: Should MVP enemy art use 5 angles or 8 angles first?

- Status: answered
- Date: 2026-04-30
- Context: GDD sections 7 and 20 list 8-direction animation support, while section 7 allows a 5-angle shortcut for MVP art cost.
- Recommendation: Implement 8-angle engine support first, but ship placeholder art that can mirror down from 5 authored angles.
- Decision: Implement 8-angle engine support in slice 2. Placeholder art may mirror authored angles until final enemy sheets exist.

### Q-003: Should first public leaderboard be local-only or server-backed?

- Status: answered
- Date: 2026-04-30
- Context: GDD section 20 says basic leaderboard, section 20.2 says local first is acceptable, and section 3.2 lists optional Upstash Redis.
- Recommendation: Ship local personal best and local leaderboard first. Add server leaderboard after the run loop is fun.
- Decision: Ship shared all-time and daily leaderboards through Vercel KV, with local leaderboard as a fallback when KV is unavailable.

### Q-004: Should the MVP room be authored manually or generated from a seed?

- Status: answered
- Date: 2026-04-30
- Context: GDD section 27 leaves room authoring unresolved, while section 9 defines a concrete MVP room.
- Recommendation: Use one manually authored MVP room, then add seeded daily configuration later.
- Decision: Use one manually authored MVP room for slice 1 and defer seeded daily configuration to the later daily mode slice.

### Q-005: Should weapons reload in MVP?

- Status: answered
- Date: 2026-04-30
- Context: GDD section 10.3 recommends no reloads in MVP unless required by weapon fantasy.
- Recommendation: Do not implement reloads in MVP.
- Decision: Do not implement reloads in MVP. The current pistol remains infinite ammo.
