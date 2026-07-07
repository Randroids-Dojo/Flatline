# Vertical Slice Plan

**Status:** done

## Slice 1: Walk and Shoot

Goal: a player can move around a room and shoot.

Includes:

- Next.js page
- Three.js room
- First-person camera
- WASD + mouse input
- Crosshair
- Pistol raycast
- Debug target dummy

## Slice 2: First Billboard Enemy

Goal: a flat enemy stands in the room and faces the player.

Includes:

- Sprite atlas loader
- Billboard plane
- Angle bucket calculation
- Idle animation
- Hurt animation
- Death animation

## Slice 3: Enemy AI

Goal: enemy chases and damages player.

Includes:

- Enemy movement
- Melee attack
- Health
- Player damage
- Death state

## Slice 4: Endless Spawn Director

Goal: game becomes replayable.

Includes:

- Spawn doors
- Spawn budget
- Increasing pressure
- Score
- Run summary
- Restart

## Slice 5: Web Game Polish

Goal: feels like a real browser game.

Includes:

- Title screen
- Pause
- Settings
- Audio
- Leaderboard
- Daily seed
- Playwright smoke tests

### Build log

- 2026-05-03: Split out of `GDD.md`. All five slices shipped during the pre-spiral build; future iteration runs through the post-MVP files (`docs/gdd/56-..` through `docs/gdd/64-..`).
