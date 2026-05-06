---
title: "implement: dash on Shift (movement weapon)"
status: open
priority: 2
issue-type: task
created-at: "2026-05-05T21:22:43.815538-05:00"
---

F-006. Q-006 recommended default: instant dash. Tap Shift fires a 0.18s impulse that displaces the player ~3.2m in current input direction (or forward if no input), with a 1.4s cooldown. Affected: src/game/dash.ts (new pure helper returning { vx, vz, remainingMs } per frame from input + state), src/game/dash.test.ts (new), src/components/FlatlineGame.tsx (Shift key handler, apply dash velocity each frame, brief afterimage trail). Audio cue: 1100 Hz sine swoop down to 700 Hz over 180ms. Visual: subtle motion blur or trail. Verify: tests cover cooldown, input-direction mapping, no-input default to forward; e2e shows player dash on Shift with cooldown visible in HUD.
