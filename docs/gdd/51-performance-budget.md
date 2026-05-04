# Performance Budget

**Status:** partial

Target:

- 60 FPS desktop
- 30 FPS low-end browser minimum

Initial enemy cap:

- Soft cap: 25 active enemies
- Hard cap: 40 active enemies

Rendering rules:

- Use atlases
- Reuse materials
- Reuse geometry
- Avoid per-frame allocation
- Pool projectiles
- Pool pickup meshes
- Pool enemy render handles
- Throttle React HUD updates to 10 to 20 Hz

### Build log

- 2026-05-03: Split out of `GDD.md`. Atlases and unlit billboard materials are in place. Soft / hard enemy caps and React HUD throttle have not been individually verified; status `partial` until the budget is exercised in a stress playtest.
