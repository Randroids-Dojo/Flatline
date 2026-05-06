---
title: "implement: hitstop on confirmed hit"
status: open
priority: 1
issue-type: task
created-at: "2026-05-05T21:22:20.873557-05:00"
---

F-009. Add a brief 30-60ms time-scale dip when a player shot lands on an enemy. Highest-leverage Doom-feel slice: every weapon and every enemy benefit. Affected files: src/game/hitstop.ts (new), src/game/hitstop.test.ts (new), src/components/FlatlineGame.tsx (apply scale to animate-loop delta). Tuning: peashooter 30ms / 0.05 scale dip, inkblaster 45ms / 0.04, boomstick 60ms / 0.02 (deeper but shorter window for chunkier feel). Verify: build succeeds, unit tests for the helper, e2e shows visible micro-pause on first kill.
