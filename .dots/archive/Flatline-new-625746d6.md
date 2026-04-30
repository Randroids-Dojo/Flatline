---
title: "bug: fix WASD direction and visible projectiles"
status: closed
priority: 0
issue-type: task
created-at: "\"\\\"2026-04-30T17:50:09.228841-05:00\\\"\""
closed-at: "2026-04-30T17:58:06.482960-05:00"
close-reason: "PR #10 merged to main. npm run verify passed. npm audit --audit-level=moderate found 0 vulnerabilities. Main CodeQL and Vercel production deployment passed. Live smoke on https://flatline-gamma.vercel.app/ started a run, fired a shot, showed Billboard enemy hurt, and HUD showed Hits 1."
---

Fix camera-relative movement so W moves forward and S moves backward in the rendered view. Add visible shot bolts for pistol fire while keeping hitscan damage timing. Add the next GDD product plan and backlog dots for post-MVP work.
