---
title: "implement: enemy infighting (cross-faction crossfire)"
status: closed
priority: 3
issue-type: task
created-at: "\"2026-05-05T21:23:09.848789-05:00\""
closed-at: "2026-05-06T20:59:43.588776-05:00"
close-reason: "Damage portions shipped in PR #73, #74, #88, and #90. Remaining aggro-retarget idea preserved as F-016."
---

F-013. Q-008 recommended default: 50% damage. Lands AFTER spitter (F-008) ships. Spitter projectiles passing through other enemies deal 50% of their player damage to the first enemy they hit. Brute melee swings damage adjacent enemies inside the swing arc at 50%. Skitter dash collisions damage other enemies at 50%. Aggro: an enemy that takes cross-faction damage rolls a small probability to retarget the source enemy for one attack cycle. Affected: src/game/enemies.ts (cross-faction damage rule and aggro retarget hook), src/game/spitterProjectile.ts (collision against other enemies), tests, src/components/FlatlineGame.tsx (event handling for enemy-on-enemy hits). Verify: tests cover damage scaling, aggro retarget probability, and that scoring/combo do not credit the player for an enemy-killed enemy.
