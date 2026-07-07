# Enemies

**Status:** done

Five goons mirroring Doom's early bestiary, with Doom's HP, pain chance (out of 255), damage dice, and the P_CheckMissileRange attack gamble. Monster hitscan spread is 4x the player's, per the original.

| Goon | Doom analog | HP | Attack |
|---|---|---|---|
| Torpedo Rat | Zombieman | 20 | 1 pistol bullet, 3x1d5 |
| Scattergun Capo | Shotgun guy | 30 | 3 pellets, 3x1d5 each |
| Alley Shiv | Imp | 60 | thrown knife 3x1d8, melee scratch |
| Sewer Bruiser | Pinky | 150 | melee only 4x1d10, fastest walker |
| Fat Cat | Baron (scaled) | 350 | cigar ember 8x1d6 at 16 m/s, heavy melee |

AI is a five-state machine (idle, chase, windup, pain, dying) with Doom's zigzag chase (commit to a direction toward the target plus a random offset, re-roll when blocked or expired). Enemies wake on sight within 24m or on gunfire within 20m, open unlocked doors, and take pain rolls per damage event. Deaths play a three-frame squash collapse into an ink puddle decal and drop coins.

Spawn mix by ring: torpedoes everywhere; capos and shivs from ring 1; bruisers ring 2; fat cats ring 3 and deeper, weight rising with the ring.

### Build log

- 2026-07-07: bestiary, AI state machine, infight retargeting, tests. Files: `src/game/enemies.ts`, `src/game/enemies.test.ts`, `src/art/sprites.ts`. PR #pending.
