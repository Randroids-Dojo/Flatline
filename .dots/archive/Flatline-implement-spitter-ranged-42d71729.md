---
title: "implement: spitter ranged enemy v1 (REQ-031)"
status: closed
priority: 2
issue-type: task
created-at: "\"\\\"2026-05-05T21:22:38.924194-05:00\\\"\""
closed-at: "2026-05-06T13:20:20.024357-05:00"
close-reason: Shipped on feat/spitter-ranged. New spitter enemy type with ranged attack, new src/game/spitterProjectile.ts plus tests, FlatlineGame projectile rendering + collision + audio cues, spitter spawn rotation at every 5th. REQ-031 status partial (uses grunt sprite placeholder until dedicated atlas).
---

F-008. Add the missing ranged threat. Slow projectile, telegraphed windup, distinctive audio sting. Tuning starting point: speed 1.6 m/s (slower than grunt), max health 2, attackRange 7.5, projectile speed 8 m/s, attackWindupMs 720, projectileDamage 8, scale 0.85, tint distinct from grunt/skitter/brute. Affected: src/game/enemies.ts (add 'spitter' type and config; extend EnemyEvent with 'enemyProjectileFired'), src/game/spitterProjectile.ts (new pure helper for projectile motion + collision), tests for both, src/components/FlatlineGame.tsx (render projectiles, handle collisions, audio cue). Out of scope here: infighting (lands as F-013 after this ships). Verify: tests cover the windup state machine, projectile travel, and collision; e2e shows a spitter firing at the player from across the room.
