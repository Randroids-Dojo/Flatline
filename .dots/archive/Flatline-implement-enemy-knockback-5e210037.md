---
title: "implement: enemy knockback on damage"
status: closed
priority: 1
issue-type: task
created-at: "\"\\\"2026-05-05T21:22:24.762664-05:00\\\"\""
closed-at: "2026-05-05T23:30:32.480420-05:00"
close-reason: Shipped on feat/enemy-knockback. New helper src/game/knockback.ts plus tests; wired into FlatlineGame fire() and inkblaster projectile-hit paths; verification green (29 unit-test files / 207 tests, e2e 10/10, build, typecheck, lint clean).
---

F-010. Per-weapon impulse on enemy damage. Scales: peashooter 0.15m, inkblaster 0.4m, boomstick 0.9m point-blank with falloff to 0.2m at max range. Brute resists 50%, skitter takes 130%. Affected: src/game/knockback.ts (new pure helper that takes weapon/distance/enemy and returns impulse), src/game/knockback.test.ts (new), src/game/enemies.ts (apply impulse decay during chase tick), src/components/FlatlineGame.tsx (call helper inside damageCurrentEnemy). Verify: tests cover all 9 weapon x enemy combos, distance falloff, and resistance multipliers; e2e shows brute visibly shoved by boomstick at point-blank.
