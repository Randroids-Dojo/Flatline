# GDD: Flatline

> **Anti-Flatline guardrail.** This GDD is a directory tree, not a single file. Each requirement is its own file. Coverage rows in `docs/GDD_COVERAGE.json` are written at requirement granularity, NOT chapter granularity. A multi-week project should produce on the order of 100+ rows, not 11. If you only have a dozen rows, your coverage is too coarse and the loop will self-terminate before the product is good.

Project pitch: Desktop web Doom-like survival shooter with hand-drawn billboard enemies.

The pre-split monolith is preserved at `docs/_archive/2026-05-03-pre-spiral/GDD.md`.

## How to use this directory

- Each `docs/gdd/<NN>-<title>.md` file is one requirement or one tightly-scoped section.
- Each file starts with a `**Status:**` line: `not_started` | `partial` | `done`.
- Once a file's work ships, append a `### Build log` section with what landed, the key files, and any non-obvious decisions. Build logs grow with the code.
- Keep file names short and stable. The file path is referenced from `docs/GDD_COVERAGE.json`.

## Conventions

- One requirement, one file, one row in the coverage ledger.
- File names: `<NN>-<kebab-title>.md`, e.g. `05-core-loop.md`, `52-data-model.md`.
- Cross-references between sections use relative links.
- The em-dash ban applies here.

## Index

### Foundation

- `01-vision.md`: what Flatline is, in three paragraphs.
- `02-design-pillars.md`: instant violence, one room many states, 2D in 3D, fast runs.
- `03-target-platform.md`: desktop web first; mobile / gamepad / PWA secondary.
- `04-technical-base.md`: Next.js + React + Three.js + TypeScript + Vitest + Playwright + Upstash Redis.

### Game shape

- `05-core-loop.md`: open, run, kill, die, summary, restart.
- `06-mode-endless.md`: default mode, scored, leaderboard.
- `07-mode-daily.md`: deterministic seed, daily-scoped leaderboard.
- `08-mode-practice.md`: no submission, tuning controls.

### Camera and movement

- `09-camera.md`: first-person, FOV 75, mouse look.
- `10-movement.md`: WASD + mouse, fast acceleration, mobile virtual joystick.
- `11-billboard-perspective.md`: flat enemy planes always face camera; sprite picks based on player relative angle.

### Art

- `12-art-direction.md`: mostly grayscale plus accents (Q-001).
- `13-character-art-angles.md`: 8 directions; placeholder may mirror down from 5 (Q-002).
- `14-frame-budget.md`: per-asset frame counts.

### Enemy rendering

- `15-enemy-entity-model.md`: Enemy struct.
- `16-billboard-rendering.md`: plane-faces-camera, sprite-faces-player rule.
- `17-angle-bucket-selection.md`: 8 buckets, math.
- `18-sprite-atlas.md`: per-enemy atlas + JSON metadata.

### Room

- `19-arena-shape.md`: rectangular room, pillars, 4 doors, pickup zones.
- `20-arena-landmarks.md`: distinct wall per cardinal direction.
- `21-arena-cover.md`: pillars, broken walls, crates, hanging props.
- `22-arena-hazards.md`: floor spikes, flame vents, ink pools, etc., with telegraph.

### Weapons

- `23-weapon-peashooter.md`: pistol, infinite ammo, hitscan.
- `24-weapon-boomstick.md`: shotgun, limited ammo, knockback.
- `25-weapon-inkblaster.md`: slow projectile, splash.
- `26-weapon-presentation.md`: 2D foreground sprites, idle / fire / cooldown.
- `27-weapon-no-reloads.md`: Q-005 decision.

### Enemies

- `28-enemy-grunt.md`: baseline melee chaser.
- `29-enemy-skitter.md`: fast low-health pressure (consolidated from Spitter + Swarm).
- `30-enemy-brute.md`: slow high-health blocker.
- `31-enemy-spitter.md`: ranged enemy (post-MVP, not yet implemented).

### Director and pickups

- `32-spawn-director.md`: pressure budget, ramp, fairness rules.
- `33-pickup-health.md`: small / large.
- `34-pickup-ammo.md`: shells, ink cells.
- `35-pickup-score.md`: optional score tokens.
- `36-pickup-readability.md`: bounce, glow, rim light, loop sound.

### Scoring and HUD

- `37-scoring-formula.md`: kill / survival / combo / accuracy / close-call / hazard.
- `38-run-summary.md`: end-of-run stat readout.
- `39-hud.md`: in-run elements + cartoon-title-card visual style.

### Audio

- `40-audio.md`: adaptive music, required SFX, audio readability cues.

### Architecture

- `41-routes.md`: page + API surface.
- `42-source-layout.md`: actual `src/` layout (post-implementation).
- `43-game-loop-architecture.md`: tick / render / state model.
- `44-collision.md`: 2D circles + walls.
- `45-shooting.md`: hitscan + projectile rules.
- `46-billboard-rendering-details.md`: per-frame render path.

### Mutations and scope

- `47-arena-mutations.md`: lighting / doors / hazards / cover phases.
- `48-mvp-scope.md`: must-have + can-fake.
- `49-vertical-slices.md`: original 5-slice plan.
- `50-testing-strategy.md`: unit / smoke / manual.

### Quality

- `51-performance-budget.md`: 60 FPS desktop, enemy caps.
- `52-data-model.md`: run submission + leaderboard entry + arena config.
- `53-asset-pipeline.md`: process and debug toggles.
- `54-risks.md`: art cost, readability, performance, controls.
- `55-recommended-first-build.md`: smallest fun version.

### Post-MVP

- `56-post-mvp-feel-pass.md`: fix the verbs before adding breadth.
- `57-post-mvp-weapons-v1.md`: 3-weapon set.
- `58-post-mvp-enemies-v1.md`: 3-enemy roster.
- `59-post-mvp-room-v1.md`: door states, moving cover, props.
- `60-post-mvp-hazards-v1.md`: flame vent / ink pool / falling light.
- `61-post-mvp-scoring-v2.md`: arcade-readable bonuses.
- `62-post-mvp-daily-v2.md`: deterministic daily.
- `63-post-mvp-practice.md`: full tuning controls.
- `64-post-mvp-completion.md`: definition of done for v1.

### Out of scope

- `99-out-of-scope.md`: explicit fence; carve-outs require a Q-NNN.
