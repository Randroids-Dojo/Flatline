---
title: "implement: boomstick weight (camera FOV punch + screen impulse)"
status: closed
priority: 1
issue-type: task
created-at: "\"\\\"2026-05-05T21:22:29.287912-05:00\\\"\""
closed-at: "2026-05-05T23:34:47.795086-05:00"
close-reason: Shipped on feat/boomstick-weight. New helper src/game/cameraKick.ts plus tests; wired into FlatlineGame fire() and animate loop with FOV punch + screen translateY; verification green (29 unit-test files / 210 tests, e2e 10/10, build, typecheck, lint clean).
---

F-007. Add a brief camera FOV punch and vertical screen impulse on weapon fire, scaled per weapon. Shipped tuning uses NEGATIVE fovDeltaDeg for the zoom-in punch idiom: peashooter -0.6 deg / 1 px, inkblaster -1.4 deg / 3 px, boomstick -3.0 deg / 6 px, all snap-then-ease across the per-weapon window (140 / 180 / 220 ms). Affected: src/game/cameraKick.ts (new pure helper returns { fovDeltaDeg, kickPx, durationMs }), src/game/cameraKick.test.ts (new), src/components/FlatlineGame.tsx (apply to camera.fov each frame from the active envelope; translate the .render-root mount via inline style.transform; reuse the snap-then-ease pattern from weaponRecoil). Verify: tests cover all three weapons; e2e shows visible camera nudge on boomstick fire.
