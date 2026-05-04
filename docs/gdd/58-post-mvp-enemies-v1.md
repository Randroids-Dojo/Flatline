# Post-MVP: Enemy Roster V1

**Status:** done

Add enemy types by combat job, not by art novelty:

- Grunt: baseline chaser and melee attacker.
- Skitter: fast low-health pressure enemy that forces tracking and movement.
- Brute: slow high-health blocker that soaks damage and creates pathing pressure.

Each new enemy needs:

- Pure state tests.
- Distinct silhouette.
- Distinct speed and attack timing.
- Clear hurt and death feedback.
- Spawn director budget cost.

### Build log

- 2026-05-03: Split out of `GDD.md`. All three enemies ship pre-spiral with atlases under `public/assets/enemies/{grunt,skitter,brute}/`. Distinct-silhouette and distinct-attack-timing checks roll up into `docs/PLAYTEST.md` "Variety and surprise".
