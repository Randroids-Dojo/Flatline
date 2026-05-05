# Post-MVP: Room State V1

**Status:** partial

The room should change during a run without becoming a maze:

- Door states: closed, warning, open, cooling down.
- Lighting intensity tied to pressure.
- One moving cover element that cycles predictably.
- Breakable or reactive props for juice, not tactics at first.
- More visible landmarks on each wall.

The room must remain readable at high pressure. Add one state change at a time and smoke it in browser.

### Build log

- 2026-05-04: Door state machine v1 shipped. Spawn doors now run a three-phase post-spawn life cycle (opening burst at peak opacity 0.78 / scaleY 0.96 / warm white, open hold at opacity 0.46 / scaleY 0.84 / amber, cooling fade back to opacity 0.08 / scaleY 0.58 / teal) plus a 220 Hz sawtooth audio cue at the spawn frame so the player can hear which door produced an enemy. New pure helpers `src/game/doorState.ts` (phase + visual style) and `src/game/doorCue.ts` (audio cue style) carry the per-phase tuning so future tweaks live in one place. `src/components/FlatlineGame.tsx` switches `doorSignalTimersRef` from countdown-to-zero to elapsed-since-spawn, refactors `applyDoorSignals` to read the visual from the helper, sets the timer to 0 instead of 950 on the spawn frame, and adds the new `playDoorOpenCue` runtime. Files: `src/game/doorState.ts`, `src/game/doorState.test.ts`, `src/game/doorCue.ts`, `src/game/doorCue.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD. Status stays `partial` (moving cover that cycles predictably and breakable props remain). The four named landmarks (north clock, east furnace, south curtain, west organ) shipped earlier in `feat/arena-landmarks-curtain-organ`.
- 2026-05-03: Split out of `GDD.md`. Lighting-by-pressure exists. Door state machine, moving cover, breakable props, and the four named landmarks remain follow-on work; status `partial`.
