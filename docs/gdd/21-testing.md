# Testing strategy

**Status:** done

Unit (vitest, 79 tests): every pure module has a spec: rng determinism, dungeon reachability and gateway matching, vault-key pairing, collision sliding and anti-tunneling, raycast distances, weapon tables and ammo, armor math, splash falloff, door timing, enemy state machine and pain chance, projectile flight, pickup caps, and the full meta economy (fog of war, cost escalation, labor inflation, rent, relic consumption).

E2e (Playwright, chromium + mobile-chromium): the full loop (title, run, shoot spends ammo, death card, office purchase, armory unlock, next run reflects upgrades), pause, storage reload persistence, mobile title render, and rule-10 motion checks on the film overlay.

Test hooks are window custom events, kept deliberately (they are the only deterministic way to drive death and the economy in e2e).

### Build log

- 2026-07-07: suites shipped with the reboot. Files: `src/game/rng.test.ts`, `src/game/dungeon.test.ts`, `src/game/collision.test.ts`, `src/game/raycast.test.ts`, `src/game/movement.test.ts`, `src/game/weapons.test.ts`, `src/game/combat.test.ts`, `src/game/enemies.test.ts`, `src/game/projectiles.test.ts`, `src/game/doors.test.ts`, `src/game/pickups.test.ts`, `src/game/meta.test.ts`, `tests/smoke.spec.ts`, `tests/film-motion.spec.ts`. PR #172.
