# Weapon: No Reloads in MVP

**Status:** done

Unless reloads are core to the weapon fantasy, skip them.

Doom-like flow is stronger with:

- Fire rate
- Ammo type
- Weapon switching
- Pickup management

Decision recorded as Q-005: do not implement reloads in MVP. Pistol stays infinite ammo.

### Build log

- 2026-05-03: Split out of `GDD.md`. Decision implemented in `src/game/weapons.ts`; no reload state machine is wired.
