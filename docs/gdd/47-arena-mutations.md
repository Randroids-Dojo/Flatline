# Arena Mutations

**Status:** partial

The room should change over time without becoming a new level.

## Lighting phase

- Normal
- Flicker
- Emergency lights
- Near-death pulse
- Darkness with enemy eyes

## Door phase

- More spawn doors unlock
- Doors jam open
- Doors burst with smoke
- Door lights signal enemy type

## Hazard phase

- Floor traps activate
- Center zone becomes dangerous
- Corners become pickup traps
- Wall vents fire projectiles

## Cover phase

- Pillars rise
- Props break
- Moving partitions shift routes

MVP only needs lighting and spawn doors.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: lighting tied to pressure exists in `src/components/FlatlineGame.tsx`; spawn-door surface treatment is tied to `src/game/spawnDirector.ts`. Door / hazard / cover phase variations are not yet implemented as a unified mutation system; status `partial`.
