# Weapons

**Status:** done

Seven slots mapping one-to-one onto Doom's arsenal, re-skinned noir. Damage dice, cycle times, pellet counts, spread, and ammo economy follow the Doom tables.

| Slot | Name | Doom analog | Notes |
|---|---|---|---|
| 1 | Bare Paws | Fist | 2x1d10 melee, always available |
| 2 | Snubnose | Pistol | 5x1d3, first tapped shot perfectly accurate |
| 3 | Scattergun | Shotgun | 7 pellets of 5x1d3, 1.06s cycle |
| 4 | Chatter Gun | Chaingun | 5x1d3 at 8.75 rounds/sec |
| 5 | TNT Lobber | Rocket launcher | 20x1d8 direct plus 128-over-4m splash, hurts you too |
| 6 | Ray-O-Matic | Plasma rifle | 5x1d8 projectiles at 27 m/s |
| 7 | Big Cheese | BFG (simplified) | 100x1d8 ball, 40 cells per shot, big splash |

Ammo types: bullets (200 max), shells (50), tnt (50), cells (300); max scales with the Deep Pockets board node. Dry-firing swaps to the best owned weapon with ammo. Paws and Snubnose are always owned; the rest unlock in the Armory, with three purchasable +20% damage tiers per gun.

Hitscan spread uses Doom's triangular twin-random distribution at 5.6 degrees.

### Build log

- 2026-07-07: full arsenal with Doom-table stats and tests. Files: `src/game/weapons.ts`, `src/game/weapons.test.ts`, `src/art/viewmodel.ts`. PR #pending.
