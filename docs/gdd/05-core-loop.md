# Core Game Loop

**Status:** done

1. Player opens `/` or `/arena/[slug]`.
2. Title screen appears.
3. Player starts a run.
4. Countdown: 3, 2, 1.
5. Player spawns in the arena.
6. Enemies spawn from doors, vents, holes, portals, or shadows.
7. Player kills enemies, dodges attacks, and collects pickups.
8. Difficulty ramps forever.
9. Player dies.
10. Run summary appears.
11. Score is submitted.
12. Player restarts instantly.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation in `src/components/FlatlineGame.tsx` covers title, countdown, spawn, kill loop, death, summary, and instant restart.
