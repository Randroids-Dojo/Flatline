# Doors and vaults

**Status:** done

Doom doors: slide up at 2.19 m/s, hold open 4.3 seconds, slide back down, and bounce back up if something stands under them. Placed at corridor pinch points (about a third of candidates, capped at 5 per chunk). The player uses them with E or Space within two cells ahead; enemies open unlocked doors when one blocks their chase.

Vault doors are locked variants (bank-wheel texture) ringing a treasure room. Opening one requires the chunk's vault key pickup (consumed on use) or the Skeleton Key relic (reusable for the run). Vaults hold coin piles, an armor or big heal, and heavy ammo.

### Build log

- 2026-07-07: door state machine, locked vaults, key consumption, tests. Files: `src/game/doors.ts`, `src/game/doors.test.ts`, `src/art/textures.ts`. PR #172.
