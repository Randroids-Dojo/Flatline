---
title: "implement: encounter wave choreography"
status: closed
priority: 2
issue-type: task
created-at: "\"\\\"2026-05-05T21:22:56.223324-05:00\\\"\""
closed-at: "2026-05-06T13:34:33.403650-05:00"
close-reason: Shipped on feat/encounter-wave. New encounterWave helper plus 18 tests; spawnDirector consumes signal for pressureTarget + cadence; FlatlineGame plays peak horn and renders wave HUD pill. Verification green.
---

F-014. Layer a wave shape on the existing spawn director: 25s lull (target -0, cadence x1.0), 18s surge (target +1, cadence x0.75), 7s peak (target +2, cadence x0.55, single audio horn at peak start). Affected: src/game/encounterWave.ts (new pure helper that maps runMs to { phase, targetDelta, cadenceScale, peakSignal }), src/game/encounterWave.test.ts (new), src/game/spawnDirector.ts (consume the wave struct in tickDirector), src/components/FlatlineGame.tsx (peak-start audio horn, optional HUD warning glyph). Audio: 90 Hz sawtooth horn at 220ms / gain 0.05 distinct from all existing cues. Verify: tests cover phase boundaries at runMs 0/25k/43k/50k; e2e shows pacing pulse instead of constant pressure.
