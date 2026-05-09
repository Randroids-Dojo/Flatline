---
title: Migrate localStorage stores to @randroids-dojo/vibekit/storage
status: open
priority: 2
issue-type: task
created-at: "2026-05-08T23:28:09.387539-05:00"
---

Flatline's dailyStreak.ts has its own readDailyStreak / write / sanitize plumbing; other lib/* modules likely follow the same shape. Once @randroids-dojo/vibekit is added as a file:../VibeKit dep, replace defensive try/catch + JSON.parse + manual storage event chains with readStorage<T>(key, zSchema) / writeStorage / listenStorage. The kit's writeStorage already fires the same-tab event so a writer in tab A reacts to its own write.
