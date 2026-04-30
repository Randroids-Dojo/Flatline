---
title: "implement: room states and hazards v1"
status: closed
priority: 2
issue-type: task
created-at: "\"\\\"2026-04-30T17:53:46.237190-05:00\\\"\""
closed-at: "2026-04-30T18:25:41.533669-05:00"
close-reason: "PR #16 merged to main. npm run verify passed. npm audit --audit-level=moderate found 0 vulnerabilities. Main CodeQL and Vercel production deployment passed. Live smoke on https://flatline-gamma.vercel.app/ started a run and confirmed the WebGL canvas rendered."
---

Add room door states, pressure-linked lighting, one moving cover cycle, and the first hazard set: flame vent lane, ink pool, and falling light. Hazards need telegraph timing, safety rules, director scheduling, tests, and browser smoke coverage.
