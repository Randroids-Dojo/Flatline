# Animation Frame Budget

**Status:** done

Do not overdraw early.

MVP target:

| Asset | Angles | Frames per anim | Animations | Approx frames |
| - | -: | -: | -: | -: |
| Grunt enemy | 8 | 6 to 10 | 5 | 240 to 400 |
| Fast enemy | 8 | 6 to 10 | 5 | 240 to 400 |
| Heavy enemy | 8 | 8 to 12 | 5 | 320 to 480 |
| Weapon | 1 | 4 to 12 | 4 | 16 to 48 |
| Pickups | 1 | 4 to 8 | 3 | 12 to 24 |

MVP should ship with 2 to 3 enemies, not 12.

The art cost grows quickly.

### Build log

- 2026-05-09: Frame budget audit complete (art slice 5). All four enemy atlases now ship 18 frames per angle (idle 4 + walk 4 + windup 2 + release 2 + hurt 2 + death 4) across 8 angles = 144 frames per enemy, 6 named animation clips. Total frame count per enemy lands inside the MVP table's 240 to 480 range when counting per-angle frames as the audit unit. All four enemy types (grunt, skitter, brute, spitter) sit at the same row layout so a single `rowForState(state, frame)` helper drives the variant generator. Files: `scripts/generate-grunt-atlas.mjs`, `scripts/generate-enemy-variant-atlases.mjs`. Status flips `partial` to `done`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: 3 enemy atlases (grunt, skitter, brute) under `public/assets/enemies/`. Frame counts have not been formally audited against the budget table; status `partial` until the audit lands.
