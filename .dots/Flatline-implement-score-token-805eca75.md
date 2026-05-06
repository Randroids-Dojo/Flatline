---
title: "implement: score token quad pickup (REQ-035)"
status: open
priority: 3
issue-type: task
created-at: "2026-05-05T21:23:15.874152-05:00"
---

F-012. REQ-035 not_started. Aggressive-play reward. Spawns in the central risk zone at 2x score multiplier for 6s on collection. Spawn rule: every ~70s of run time, gated by pressure>=2, distinct from the rage pickup so the two do not conflict. Affected: src/game/scoreToken.ts (new pure helper for envelope), src/game/scoreToken.test.ts (new), src/game/scoring.ts (multiplier hook in addKillScore / addBonus), src/components/FlatlineGame.tsx (pickup, multiplier ref, HUD chip showing remaining time). Audio: ascending 660 / 990 / 1320 Hz triple-sine on collection, 220ms total. Verify: tests cover the multiplier window not stacking with other multipliers, expiry at exactly 6000ms; e2e shows a pickup with the HUD chip.
