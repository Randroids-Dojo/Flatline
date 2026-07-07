# Design pillars

**Status:** done

1. **Doom in the fingers.** Movement speed, weapon cadence, damage dice, armor math, pain chance, door timing: taken from the original tables (via doomwiki and the released source constants), scaled only where the tighter dungeon demands it. Doom quirks are kept on purpose (unnormalized diagonal speed, first-shot pistol accuracy, monster infighting).
2. **Every frame a cel.** Strict grayscale, thick wobbly ink outlines, line boil at roughly 10Hz, ink splats instead of blood, film grain and vignette over everything. If a screenshot could not pass for a 1930s cartoon still, it is wrong.
3. **Death pays the rent.** Dying is progress. Cheddar earned in a run always converts to permanent power at the office. Unspent cheddar is lost when the next run starts (the Charon rule), so every visit to the office ends with a spending decision.
4. **The city never ends.** The dungeon streams forever in every direction from a run seed. Deeper rings spawn meaner mixes. There is no exit, only a personal best.

### Build log

- 2026-07-07: pillars established in the reboot implementation. Files: `src/game/*`, `src/art/ink.ts`. PR #172.
