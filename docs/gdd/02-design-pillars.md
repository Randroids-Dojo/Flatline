# Design Pillars

**Status:** partial

Four pillars govern every design decision. A feature that conflicts with a pillar gets cut, not bent.

## 2.1 Instant Violence, Instant Readability

The player should understand the game within 10 seconds:

1. Move.
2. Shoot.
3. Dodge.
4. Pick up ammo and health.
5. Survive.

No inventory screens. No long tutorial. No complex build crafting.

## 2.2 One Room, Many States

The game happens in one room, but that room should not feel static.

The room changes through:

- Spawn doors opening and closing
- Lights flickering
- Moving cover
- Hazards activating
- Enemy waves changing
- Floor symbols glowing
- Props breaking
- Music intensity rising
- Fog or smoke increasing
- Arena layout variants loading between runs

The room is the main character.

## 2.3 2D Characters in a 3D Space

Enemies are not full 3D models. They are animated 2D sprites placed in the 3D world.

The game uses billboard rendering:

- Each enemy is a flat plane.
- The plane rotates to face the camera.
- The shown sprite changes based on the player's angle around the enemy.
- Animation frames advance like a flipbook.

This creates the classic cartoon-in-a-3D-shooter effect.

## 2.4 Fast Runs, Strong Replay

A good run should last 2 to 8 minutes for most players.

Replay hooks:

- Score
- Survival time
- Kill count
- Accuracy
- Combo chains
- Personal bests
- Daily arena seed
- Leaderboards
- Unlockable visual variants

### Build log

- 2026-05-03: Pillars split out of `GDD.md`. Pillar 1 (instant violence) and pillar 3 (2D in 3D) realized in code; pillar 2 (one room many states) only partially realized (lighting and spawn doors land; moving cover, props, fog, layout variants do not).
