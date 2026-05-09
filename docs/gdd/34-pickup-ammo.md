# Pickup: Ammo

**Status:** done

Ammo types:

- Shells (Boomstick)
- Ink cells (Inkblaster)
- Later: special ammo

Ammo pickups should matter only after the Boomstick and Inkblaster exist; the pistol stays infinite.

### Build log

- 2026-05-09: Audit pass. Each spec line is satisfied by the current implementation. (1) Shells live as `WeaponAmmoState.boomstick` with `maxAmmo: 6` in `src/game/weapons.ts`. (2) Ink cells live as `WeaponAmmoState.inkblaster` with `maxAmmo: 4` in the same module. (3) Peashooter stays infinite via the `maxAmmo: null` branch in `canFireWeapon` and `spendWeaponAmmo`. (4) Both ammo types are refilled at the central altar via `collectWeaponAmmo(state, boomstick = 2, inkblaster = 1)` invoked from `src/components/FlatlineGame.tsx`, only matters because the Boomstick and Inkblaster both exist as in-game weapons (the spec's gating condition). (5) "Later: special ammo" is post-MVP and stays out of scope. No code changes; status flips `partial` to `done`. Files: `docs/gdd/34-pickup-ammo.md`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: ammo wired through `src/game/weapons.ts` and `src/components/FlatlineGame.tsx`. Pickup spawn rules and per-type drops have not been audited as a stand-alone system; status `partial`.
