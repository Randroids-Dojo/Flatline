---
title: Replace src/game/virtualJoystick.ts with @randroid/game-kit
status: open
priority: 2
issue-type: task
created-at: "2026-05-08T22:37:25.866362-05:00"
---

Flatline's virtualJoystick.ts is near-identical to game-kit/src/virtual-joystick.ts (same JoystickState / JoystickVector shape, equivalent constants apart from JOYSTICK_DEADZONE 0.22 vs 0.25). Add @randroid/game-kit as a file:../game-kit dep, replace the local module with a re-export or rewrite callers, keep the existing tests pinning behavior (or move them to game-kit if they cover something the kit does not already). Decide on the final deadzone value (0.22 or 0.25) before merging so all projects converge.
