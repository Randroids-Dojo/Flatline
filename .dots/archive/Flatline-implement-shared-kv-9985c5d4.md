---
title: "implement: shared KV leaderboards"
status: closed
priority: 1
issue-type: task
created-at: "\"\\\"2026-04-30T17:21:45.575449-05:00\\\"\""
closed-at: "2026-04-30T17:36:55.662161-05:00"
close-reason: "PR #8 merged to main. npm run verify passed. npm audit --audit-level=moderate found 0 vulnerabilities. CodeQL and Vercel production checks passed. Live smoke passed on https://flatline-gamma.vercel.app/. Production API currently returns unavailable until KV_REST_API_URL and KV_REST_API_TOKEN are configured in Vercel."
---

Add Upstash Redis backed all-time and daily Flatline leaderboards, initials submission, API tests, UI integration, and docs.
