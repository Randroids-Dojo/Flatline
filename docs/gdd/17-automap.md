# Automap

**Status:** done

Hold Tab for a Doom-style overlay map of explored cells (cells within 3 of the player mark as visited while walking). Walls, floors, doors, and vault doors render in distinct grays around a player arrow. Radius starts at 16 cells and grows with City Maps board ranks; the Bloodhound Nose relic dots visible pickups.

### Build log

- 2026-07-07: hold-Tab automap with explored-cell tracking. Files: `src/components/FlatlineGame.tsx` (drawAutomap). PR #pending.
