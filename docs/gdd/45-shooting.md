# Shooting

**Status:** done

Use raycast for hitscan weapons.

For the pistol and shotgun:

- Cast ray from camera center.
- Check enemy hit circles or billboard bounds.
- Apply damage.
- Spawn impact effect.
- Trigger enemy hurt state.

For projectiles:

- Spawn projectile entity.
- Move each tick.
- Check collision against enemies and walls.
- Explode or despawn.

### Build log

- 2026-05-03: Hitscan bolts now spawn an impact ring at their terminal point so every shot has an on-impact effect, satisfying the "Spawn impact effect" line. Hit rings are red, miss rings are teal. Files: `src/components/FlatlineGame.tsx`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/shooting.ts`. Tests: `src/game/shooting.test.ts`.
