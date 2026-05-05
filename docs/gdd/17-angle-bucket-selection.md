# Angle Bucket Selection

**Status:** done

Calculate where the player is relative to the enemy. Then choose a sprite angle.

Simple version:

```ts
const angleToPlayer = atan2(player.z - enemy.z, player.x - enemy.x)
const relativeAngle = normalizeAngle(angleToPlayer - enemy.facingAngle)
const bucket = angleToBucket(relativeAngle, 8)
```

Buckets:

| Bucket | Sprite |
| - | - |
| 0 | front |
| 1 | front-right |
| 2 | right |
| 3 | back-right |
| 4 | back |
| 5 | back-left |
| 6 | left |
| 7 | front-left |

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: angle bucket math lives in `src/game/billboard.ts`; verified by `src/game/billboard.test.ts`.
