---
title: "implement: deterministic daily room v2"
status: closed
priority: 2
issue-type: task
created-at: "\"\\\"2026-04-30T17:53:46.237198-05:00\\\"\""
closed-at: "2026-04-30T18:33:16.617315-05:00"
close-reason: "PR #18 merged to main. npm run verify passed. npm audit --audit-level=moderate found 0 vulnerabilities. Main CodeQL and Vercel production deployment passed. Live smoke on https://flatline-gamma.vercel.app/arena/daily loaded the daily seed and daily leaderboard."
---

Make daily mode deterministic beyond the date string with seeded spawn sequence, pickup schedule, hazard schedule, and room state pattern. Daily submissions should default to the daily leaderboard and practice mode must not submit.
