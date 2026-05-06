---
title: "implement: berserk rage power pickup"
status: closed
priority: 2
issue-type: task
created-at: "\"\\\"2026-05-05T21:22:51.009528-05:00\\\"\""
closed-at: "2026-05-06T13:28:50.467150-05:00"
close-reason: Shipped on feat/berserk-rage. New src/game/rageBuff.ts plus 21 tests; FlatlineGame applies multipliers in fire/move/damage paths, gates rage on runMs>=90s and pressure>=2, plays sawtooth swoop cue, renders radial-gradient red tint and HUD pill. Q-007 resolved under default B.
---

F-011. Q-007 recommended default: 1.5x damage, 1.3x movement, 1.5x fire rate, 10s. Spawns rarely (every ~90s of run time, gated by pressure>=2) at the central altar in place of a health pickup. Screen-edge red tint at 0.35 opacity, pulsed by a low-frequency oscillator. Affected: src/game/rageBuff.ts (new pure helper with envelope and stat-multipliers), src/game/rageBuff.test.ts (new), src/components/FlatlineGame.tsx (pickup, buff state ref, apply multipliers in fire/movement/damage paths, render tint overlay), src/game/spawnDirector.ts (rare spawn rule for the altar pickup type). Audio: distinct sustained pulse layer fading in over 220ms and out over 600ms at buff end. Verify: tests cover envelope, multiplier application, and timing; e2e shows the pickup spawn and the buff window with tint.
