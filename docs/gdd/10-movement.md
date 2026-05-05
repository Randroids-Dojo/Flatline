# Movement

**Status:** done

Classic Doom-inspired movement, but with modern comfort.

Keyboard:

- WASD: move
- Mouse: aim
- Left click: fire
- Right click: alt fire, later
- Shift: dash, later
- Space: interact or quick shove, later
- R: reload, only if weapon requires reload
- Esc: pause

Movement feel:

- Fast acceleration
- Low friction
- No realistic inertia
- No crouch in MVP
- No jumping in MVP unless a later arena variant needs it

Mobile (early secondary): virtual joystick + look-pad.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/movement.ts`, `src/game/virtualJoystick.ts`, plus mobile touch fix landed in PRs #44, #45, #46. Tests: `src/game/movement.test.ts`, `src/game/virtualJoystick.test.ts`.
