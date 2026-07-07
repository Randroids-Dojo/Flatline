# Pickup: Ammo

**Status:** done

Ammo types:

- Shells (Boomstick)
- Ink cells (Inkblaster)
- Later: special ammo

Ammo pickups should matter only after the Boomstick and Inkblaster exist; the pistol stays infinite.

### Build log

- 2026-05-12: Doom-style ammo drops on enemy kill. Until now ammo only refilled at the central altar, so players had no visible loot during combat. New pure helper `src/game/ammoDrop.ts` exposes four kinds (`shell-small`, `shell-large`, `cell-small`, `cell-large`) with `rollAmmoDrop(type, rng)` returning the drop (or `null`) per enemy. Drop tables: skitter mixes both kinds at low chance, grunt and brute lean shells, spitter leans cells. Per-table probabilities sum to less than 1 so the majority of kills still drop nothing. `ammoDropBoomstickAmount` / `ammoDropInkblasterAmount` map drops to ammo grants (small = +1, large = +3 shells / +2 cells). `ammoDropPalette(kind)` returns body / accent / glow hex so shells read warm (red body + yellow stripe) and cells read cold (blue body + cyan accent); large variants share the family hue with a higher emissive intensity. `ammoDropBobY(age)` is a 1.5 Hz sin so the boxes float at the right doorknob height. `tickAmmoDrops` ages out drops past the 6.5 s TTL; `ammoDropPickupIds` returns boxes the player is overlapping. `src/components/FlatlineGame.tsx` adds an `AmmoDropEntry` group (body `BoxGeometry` + accent strip + floor halo `RingGeometry`) and wires spawn-on-kill alongside the existing score-token drop, per-frame tick with a y-axis spin and TTL fade, per-frame pickup check with `collectWeaponAmmo` and a per-kind `playPickupCue('ammo-shell' | 'ammo-cell')`. Two new pickup cue styles: shell (520 Hz / 720 Hz square) and cell (660 Hz / 990 Hz triangle), both quieter than the supply sparkle so combat audio stays in front. Cleanup hooked into run reset, finish, and unmount paths. Files: `src/game/ammoDrop.ts`, `src/game/ammoDrop.test.ts`, `src/game/pickupCue.ts`, `src/components/FlatlineGame.tsx`. PR #169. Status stays `done` (existing altar refill behavior unchanged; this slice adds visible drops alongside).
- 2026-05-09: Audit pass. Each spec line is satisfied by the current implementation. (1) Shells live as `WeaponAmmoState.boomstick` with `maxAmmo: 6` in `src/game/weapons.ts`. (2) Ink cells live as `WeaponAmmoState.inkblaster` with `maxAmmo: 4` in the same module. (3) Peashooter stays infinite via the `maxAmmo: null` branch in `canFireWeapon` and `spendWeaponAmmo`. (4) Both ammo types are refilled at the central altar via `collectWeaponAmmo(state, boomstick = 2, inkblaster = 1)` invoked from `src/components/FlatlineGame.tsx`, only matters because the Boomstick and Inkblaster both exist as in-game weapons (the spec's gating condition). (5) "Later: special ammo" is post-MVP and stays out of scope. No code changes; status flips `partial` to `done`. Files: `docs/gdd/34-pickup-ammo.md`. PR #138.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: ammo wired through `src/game/weapons.ts` and `src/components/FlatlineGame.tsx`. Pickup spawn rules and per-type drops have not been audited as a stand-alone system; status `partial`.
