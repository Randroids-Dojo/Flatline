# Flatline

A hard-boiled mouse story. First-person Doom mechanics in an endless on-the-fly generated dungeon, drawn like a 1934 rubber-hose cartoon, with Rogue Legacy style meta progression: die, bank your cheddar, buy permanent upgrades at the office, hit the streets again.

This is the 2026-07 reboot. The previous single-arena game is archived under `docs/_archive/2026-07-07-pre-reboot/`.

## Play

- WASD to move, mouse to aim (click grants pointer lock), click to shoot.
- 1 to 7 swap weapons, E or Space opens doors, hold Tab for the automap, Escape pauses.
- Death is progress: earnings convert to Case Board ranks, Armory unlocks, and one-run contraband. Unspent cheddar is taken as rent when the next run starts, so spend before you leave.

## Development

```bash
npm install
npm run dev        # http://127.0.0.1:3000
npm run verify     # lint + typecheck + unit tests + build + e2e
```

E2e uses Playwright. In environments with a preinstalled browser, point at it with `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e`.

All art and audio are generated at runtime (canvas 2D + WebAudio); the repo has no binary game assets. No environment variables are required.

## Project Docs

- `docs/gdd/`: canonical requirement-granular game design document (start at `docs/gdd/README.md`).
- `AGENTS.md`: required operating rules for agentic coding tools.
- `docs/IMPLEMENTATION_PLAN.md`: backlog shape, slice order, loop rules, and definitions of done.
- `docs/WORKING_AGREEMENT.md`: branch, commit, PR, review, CI, and deploy rules.
- `docs/PROGRESS_LOG.md`: newest-first implementation history.
- `docs/OPEN_QUESTIONS.md`: durable design and technical decisions.
- `docs/FOLLOWUPS.md`: deferred work that should survive context loss.
- `docs/GDD_COVERAGE.json`: maps GDD requirements to implementation, tests, and remaining gaps.

## Source Layout

- `src/game/`: pure simulation logic (dungeon generation, movement, combat, enemies, doors, pickups, meta progression), each module unit-tested.
- `src/art/`: procedural rubber-hose drawing (ink primitives, textures, sprites, viewmodels, mugshot, film grain).
- `src/audio/`: synthesized sound.
- `src/components/`: the Three.js game component and the Office screen.
- `tests/`: Playwright e2e (full loop, pause, persistence, film-motion QA).
