---
title: "implement: adaptive music intensity layer"
status: closed
priority: 3
issue-type: task
created-at: "\"\\\"2026-05-05T21:23:04.084112-05:00\\\"\""
closed-at: "2026-05-06T13:39:49.868039-05:00"
close-reason: Shipped on feat/adaptive-music. New musicIntensity helper + 11 tests. FlatlineGame adds sub-bass thrash layer (60Hz sawtooth + throb LFO + master gain) gated by pressure ratio.
---

F-015. REQ-040 partial. Add a single procedural Web Audio thrash layer (e.g., a low-pass-filtered sub bass throb plus a square-wave arpeggio) whose gain envelope tracks activePressure / pressureTarget: gain 0 below 0.5, ramps from 0 to 1 across 0.5..1.0, holds at 1 above 1.0. Affected: src/game/musicIntensity.ts (new pure helper for gain mapping and pattern timing), src/game/musicIntensity.test.ts (new), src/components/FlatlineGame.tsx (sustained oscillator pair set up once on run start, gain updated per frame, torn down on run end). Verify: tests cover gain mapping at ratio 0.0/0.49/0.5/0.7/1.0/1.5; e2e is hard for audio so a unit assertion plus a manual playtest note suffices.
