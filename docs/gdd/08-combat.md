# Combat

**Status:** done

Hitscan: grid DDA raycast finds the wall distance, then the nearest enemy, crate, or player billboard whose lateral distance to the ray is under its radius and closer than the wall takes the hit. Wall hits spawn ink-star impact puffs; flesh hits spawn ink splats.

Projectiles (knives, cigar embers, TNT, rays, the Big Cheese) are always visible cartoon objects, sub-stepped against the grid and target circles.

Splash follows Doom: damage = max at center falling linearly to zero at the blast radius, hurts the shooter too, and chains through TNT crates. Explosive crates spawn in rooms and detonate at 0 hp.

Player damage: armor soaks 1/3 (vest) or 1/2 (trench armor) of each hit, consumed point for point, class drops at 0. Death triggers the camera collapse and the run summary; the Rabbit's Foot relic converts the first death into a 50 hp revive.

Monster infighting: an enemy hurt by another enemy retargets its attacker; same-species projectiles do no damage (the Doom rule).

### Build log

- 2026-07-07: raycast, projectile, splash, and armor systems with tests. Files: `src/game/raycast.ts`, `src/game/projectiles.ts`, `src/game/combat.ts`, and matching `.test.ts` files. PR #172.
