# Source Layout

**Status:** done

```text
src/
  components/
    FlatlineGame.tsx        # main session component
  game/
    billboard.ts
    enemies.ts
    hazards.ts
    movement.ts
    scoring.ts
    shooting.ts
    spawnDirector.ts
    spriteAtlas.ts
    weapons.ts
    virtualJoystick.ts
    dailyArena.ts
  lib/
    leaderboard.ts          # local fallback
    sharedLeaderboard.ts    # KV-backed
    kv.ts
    dailySeed.ts
```

The repository ships closer to this layout than the original GDD draft (which proposed `src/app/`). React/Three/tick separation matches the VibeRacer-style split.

### Build log

- 2026-05-03: Split out of `GDD.md`. Layout above reflects the actual pre-spiral source tree; the original speculative layout is preserved in `docs/_archive/2026-05-03-pre-spiral/GDD.md` section 17.
