# MVP Scope

**Status:** done

## MVP must have

- One playable room
- First-person movement
- Mouse aiming
- Hitscan pistol
- Shotgun
- Health
- Ammo pickups
- 2 enemy types
- Enemy billboard renderer
- 8-direction animation support
- Spawn director
- Endless difficulty ramp
- Score
- Run summary
- Restart
- Basic leaderboard
- Basic settings
- Unit tests for tick, scoring, director, angle bucket selection
- Playwright smoke test for starting a run

## MVP can fake

- Enemy art can start as placeholder hand-drawn silhouettes.
- Weapon art can be rough.
- Room can be one layout.
- Audio can use simple generated sounds.
- Death animations can be short.
- Leaderboard can be local first, server later.

### Build log

- 2026-05-03: Split out of `GDD.md`. Every must-have item except possibly damage-direction indicator and full settings menu is shipped. Out-of-scope items live in `docs/gdd/99-out-of-scope.md`.
