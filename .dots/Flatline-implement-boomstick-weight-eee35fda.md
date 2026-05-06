---
title: "implement: boomstick weight (camera FOV punch + screen impulse)"
status: open
priority: 1
issue-type: task
created-at: "2026-05-05T21:22:29.287912-05:00"
---

F-007. Add a brief camera FOV punch and vertical screen impulse on weapon fire, scaled per weapon. Peashooter +0.6 deg / 1px, inkblaster +1.4 deg / 3px, boomstick +3.0 deg / 6px snap-then-ease over 220ms. Affected: src/game/cameraKick.ts (new pure helper returns { fovDeltaDeg, kickPx, durationMs }), src/game/cameraKick.test.ts (new), src/components/FlatlineGame.tsx (apply to camera.fov each frame from the active envelope; reuse pattern from weaponRecoil). Verify: tests cover all three weapons; e2e shows visible camera nudge on boomstick fire.
