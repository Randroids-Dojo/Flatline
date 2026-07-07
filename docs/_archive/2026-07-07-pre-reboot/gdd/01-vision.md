# Vision

**Status:** done

Flatline is a fast, arcade-style, single-room first-person shooter built for the web.

The player is trapped in one strange room. Enemies keep spawning. Weapons, ammo, health, and hazards cycle in. The room gradually mutates through lighting, props, doors, traps, fog, and enemy pressure. The goal is not to beat the game. The goal is to survive longer, score higher, and master the room.

The visual hook is a 3D world filled with flat, hand-drawn 2D animated enemies. Characters always face the player like cartoon cutouts, but swap between different hand-drawn angles so they feel like they belong in 3D space.

Reference shape:

- Doom-style movement and shooting
- One-room survival arena
- Rubber-hose / hand-drawn billboard enemies
- Web-first, instant play
- Score chasing
- Strong mood, strong silhouettes, readable chaos

Tagline: Drawn flat. Killed fast.

### Build log

- 2026-05-03: Vision split out of monolithic `GDD.md` into this file. Pre-spiral implementation: the playable build at `app/page.tsx` and `src/components/FlatlineGame.tsx` realizes the room-survival shape.
