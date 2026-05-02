---
title: "fix: mobile touch coordinate handling"
status: active
priority: 1
issue-type: task
created-at: "\"2026-05-01T22:31:02.794385-05:00\""
---

Fix real phone touch controls where joystick visuals anchor at 0,0 and drag does not move or look. Add native TouchEvent handling using changedTouches coordinates as the primary mobile path, keep pointer handling as fallback, and verify with browser smoke.
