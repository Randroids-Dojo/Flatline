---
title: "fix: mobile touch coordinate handling"
status: closed
priority: 1
issue-type: task
created-at: "\"\\\"2026-05-01T22:31:02.794385-05:00\\\"\""
closed-at: "2026-05-01T22:37:08.742671-05:00"
close-reason: "PR #45 merged, CodeQL and Vercel passed, production deployment ready, live Pixel 5 native touch smoke verified stick placement, no scroll, and HUD fit"
---

Fix real phone touch controls where joystick visuals anchor at 0,0 and drag does not move or look. Add native TouchEvent handling using changedTouches coordinates as the primary mobile path, keep pointer handling as fallback, and verify with browser smoke.
