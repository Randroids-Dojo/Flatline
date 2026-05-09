---
title: Audit src/lib/dailyStreak.ts for VibeKit contribution
status: open
priority: 4
issue-type: task
created-at: "2026-05-08T23:28:01.643192-05:00"
---

Both Flatline and VibeRacer have daily-streak helpers but with different shapes (Flatline uses a {lastPlayedDate, currentStreak, bestStreak, totalDailyRuns} record; VibeRacer uses a date-keys array). Compare to determine if a unified API can replace both. If yes, contribute to ../VibeKit. If shapes are deliberately different, document the decision and skip.
