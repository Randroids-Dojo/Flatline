# Open Questions

Questions here block or influence implementation.

> **Critical convention.** Every question must include a `Recommended default:` line. The loop ships under that default and leaves the question open for override. Do not block the loop on dev sign-off. Stress-tested values that survive multiple iterations get frozen.

## How to add a new question

```
### Q-NNN: Short title

- Context: one or two sentences on why this is a decision point.
- Options:
  - A. Option A description.
  - B. Option B description.
  - C. Option C description.
- Recommended default: B. One sentence on the rationale.
- Status: open
- Resolution: (filled in once dev confirms or overrides)
```

Use `###` (h3) for question entries so they nest under the `## Open` and `## Resolved` section headers.

Keep `Q-NNN` IDs monotonically increasing. When a question resolves, leave the entry in place and update `Status: resolved` plus the `Resolution:` line. Never delete.

## Open

### Q-007: What does the rage / berserk powerup actually do?

- Context: Doom 1993 berserk gave 100 health, made fists one-shot most enemies, and tinted the screen red. Quake's quad damage was time-limited 4x damage with audio cue. Flatline currently has no power pickup. The audit (`docs/FUN_FACTOR_AUDIT.md`, 2026-05-05) calls for one. The shape decides what the buff means.
- Options:
  - A. Damage-only. 2x weapon damage for 10s. Cleanest math. Reads as "pop, kill, kill, kill."
  - B. Damage + speed. 1.5x damage, 1.3x movement, 1.5x fire rate, 10s. Reads as "I am the threat now."
  - C. Damage + speed + invuln window. Full B plus 80% incoming damage reduction for the duration. Reads as a Doom invuln sphere blended with berserk.
- Recommended default: B. Stacking damage + speed + fire-rate creates a multiplicative power fantasy without removing player agency the way invuln does. A clean Web Audio pulse layer plus a screen-edge tint conveys the state. The 10s window keeps it rare and memorable. Difficulty stays honest because the player still has to play.
- Status: open

### Q-008: Should enemies hurt each other through crossfire?

- Context: Infighting is one of Doom's signature mechanics. Imps shooting pinkies aggro the pinkies; the player can engineer kills by positioning. Flatline's enemy roster does not yet have a ranged enemy (Q-N/A, REQ-031 not_started), so infighting first lands when the spitter ships. The damage rule decides whether infighting is a flavor mechanic or a primary combat solver.
- Options:
  - A. Full damage. Spitter projectile that lands on a brute does the same damage it would do to the player. Reads as "if I can dodge, the enemies kill themselves."
  - B. Half damage. Cross-faction projectiles do 50% of player damage. Reads as "I can soften a brute by tricking a spitter, but I still have to finish."
  - C. No infighting. Cross-faction projectiles pass through other enemies harmlessly.
- Recommended default: B. Half damage keeps infighting a *flavor* mechanic that rewards positioning without letting the player skip combat entirely. It also keeps the player accountable for the kill so combo and accuracy bonuses still mean something.
- Status: open

## Resolved

### Q-006: Should Shift be a held sprint or an instant dash?

- Context: `docs/gdd/10-movement.md` lists `Shift: dash, later`. The player currently runs at a constant 6.8 m/s with no movement modifier. Adding an expressive movement verb is the highest-leverage Doom-feel move (see `docs/FUN_FACTOR_AUDIT.md`, 2026-05-05). Two shapes are in scope.
- Options:
  - A. Held sprint. Holding Shift sets the player to 1.35x base speed for up to 1.2s of continuous run, then a 0.6s cooldown after release. Reads as "I can choose to commit to a flank."
  - B. Instant dash. Tapping Shift fires a 0.18s impulse that displaces the player ~3.2 m in current input direction, with a 1.4s cooldown. Reads as "I just got out of a brute swing."
  - C. Both. Tap = dash, hold = sprint.
- Recommended default: B. A short dash is a single tuned impulse with a clear cooldown, the cleanest mapping for a one-room arena where evading a windup matters more than crossing distance, and the cheapest first slice. Sprint can layer in later as Q-006B if the player feedback asks for it.
- Status: resolved
- Resolution: Shipped under Recommended default B (instant dash). 180 ms duration, 3.2 m displacement, 1.4 s cooldown. Sprint variant (A) deferred unless playtest asks for it. Decided 2026-05-06 in PR #TBD (F-006).

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
