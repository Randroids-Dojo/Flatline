---
title: Replace src/game/virtualJoystick.ts with @randroids-dojo/vibekit
status: open
priority: 2
issue-type: task
created-at: "2026-05-08T23:27:55.204678-05:00"
---

Flatline's virtualJoystick.ts is near-identical to ../VibeKit/src/virtual-joystick.ts (same JoystickState / JoystickVector shape, equivalent constants apart from JOYSTICK_DEADZONE 0.22 vs 0.25). Add @randroids-dojo/vibekit as a file:../VibeKit dep, replace the local module with a re-export or rewrite callers. Decide on the final deadzone value (0.22 or 0.25) before merging so all projects converge.
