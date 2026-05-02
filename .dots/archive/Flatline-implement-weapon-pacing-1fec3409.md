---
title: "implement: weapon pacing and projectile feedback"
status: closed
priority: 2
issue-type: task
created-at: "\"\\\"2026-05-01T21:58:59.166564-05:00\\\"\""
closed-at: "2026-05-01T22:06:01.777390-05:00"
close-reason: "PR #41 merged, CodeQL and Vercel passed, production deployment ready, live root smoked with HTTP 200"
---

Improve core shooting feel by adding per-weapon fire pacing, preventing click-spam from bypassing weapon roles, surfacing cooldown-ready feedback in status/HUD where useful, and making Inkblaster projectiles easier to read in motion. Keep this PR-sized with deterministic weapon tests, browser smoke, progress docs, and deploy verification.
