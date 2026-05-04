# Post-MVP: Weapon Set V1

**Status:** done

The first real weapon set should include three clear roles:

- Peashooter: infinite ammo, precise hitscan fallback, visible tracer.
- Boomstick: limited ammo, short range burst, wide pellet spread, strong knockback.
- Inkblaster: slow projectile, splash damage, strong area denial, self-risk at close range.

Ammo pickups should matter only after the Boomstick and Inkblaster exist. Until then, the pistol remains infinite.

### Build log

- 2026-05-03: Split out of `GDD.md`. All three weapons exist in `src/game/weapons.ts`. Per-weapon feel polish (visible tracer on peashooter, knockback on boomstick, splash arc on inkblaster) is folded into `docs/gdd/56-post-mvp-feel-pass.md`.
