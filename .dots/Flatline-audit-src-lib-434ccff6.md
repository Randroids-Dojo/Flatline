---
title: Audit src/lib/dailyStreak.ts for game-kit contribution
status: open
priority: 4
issue-type: task
created-at: "2026-05-08T22:37:32.245714-05:00"
---

Both Flatline and VibeRacer have daily-streak helpers but with different shapes (Flatline uses a {lastPlayedDate, currentStreak, bestStreak, totalDailyRuns} record; VibeRacer uses a date-keys array). Compare to determine if a unified API can replace both. If yes, contribute to ../game-kit. If shapes are deliberately different, document the decision and skip.
