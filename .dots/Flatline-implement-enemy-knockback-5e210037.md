---
title: "implement: enemy knockback on damage"
status: open
priority: 1
issue-type: task
created-at: "2026-05-05T21:22:24.762664-05:00"
---

F-010. Per-weapon impulse on enemy damage. Scales: peashooter 0.15m, inkblaster 0.4m, boomstick 0.9m point-blank with falloff to 0.2m at max range. Brute resists 50%, skitter takes 130%. Affected: src/game/knockback.ts (new pure helper that takes weapon/distance/enemy and returns impulse), src/game/knockback.test.ts (new), src/game/enemies.ts (apply impulse decay during chase tick), src/components/FlatlineGame.tsx (call helper inside damageCurrentEnemy). Verify: tests cover all 9 weapon x enemy combos, distance falloff, and resistance multipliers; e2e shows brute visibly shoved by boomstick at point-blank.
