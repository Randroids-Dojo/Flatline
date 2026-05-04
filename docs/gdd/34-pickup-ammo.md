# Pickup: Ammo

**Status:** partial

Ammo types:

- Shells (Boomstick)
- Ink cells (Inkblaster)
- Later: special ammo

Ammo pickups should matter only after the Boomstick and Inkblaster exist; the pistol stays infinite.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: ammo wired through `src/game/weapons.ts` and `src/components/FlatlineGame.tsx`. Pickup spawn rules and per-type drops have not been audited as a stand-alone system; status `partial`.
