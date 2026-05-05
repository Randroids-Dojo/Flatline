# Audio

**Status:** partial

## Music

Adaptive loop.

Intensity layers:

1. Low tension
2. Combat
3. High pressure
4. Near death
5. Boss-like surge, later

## Sound effects

Required:

- Weapon fire
- Enemy hurt
- Enemy death
- Enemy attack windup
- Player damage
- Pickup
- Door spawn cue
- Hazard warning
- Combo increase
- Run end

## Audio readability

Audio should help replace color cues.

Examples:

- Spitter windup has a distinct whistle.
- Brute charge has a bassy inhale.
- Health pickup has a soft sparkle.
- Hazard has a countdown click.

### Build log

- 2026-05-04: Player damage audio sting. The required-SFX line "Player damage" is now satisfied with a distinct cue per source. New pure helper `src/game/playerDamageCue.ts` returns `{ frequency, waveform, durationMs, gain }` for `enemy` (200 Hz square, 180 ms, gain 0.045) and `hazard` (260 Hz triangle, 220 ms, gain 0.05). New local helper `playPlayerDamageCue` in `src/components/FlatlineGame.tsx` runs an attack-then-exponential-decay envelope. Wired into the enemy-melee-hit branch (replaces the previous silent damage event) and the hazard-tick branch (replaces the prior generic `playCue(70)`). Files: `src/game/playerDamageCue.ts`, `src/game/playerDamageCue.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD. Status `partial` (adaptive music, hazard countdown click, pickup loop sound, weapon fire / enemy hurt / enemy death / pickup / door spawn cue / combo increase / run end SFX still unaudited).
- 2026-05-04: Distinct per-enemy-type windup audio cues. New pure helper `src/game/enemyWindupCue.ts` returns `{ frequency, waveform, durationMs, gain }` per enemy type (skitter: 880 Hz sine 110 ms, grunt: 340 Hz square 150 ms, brute: 150 Hz sawtooth 280 ms). The `enemyAttackStarted` event in `src/game/enemies.ts` now carries `enemyType` so the FlatlineGame consumer can pick the right cue without re-deriving it. New local helper `playWindupCue` in `src/components/FlatlineGame.tsx` runs an attack-then-exponential-decay envelope so the cue does not click on stop. Files: `src/game/enemyWindupCue.ts`, `src/game/enemyWindupCue.test.ts`, `src/game/enemies.ts`, `src/game/enemies.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD. Status `partial` (adaptive music, hazard countdown click, pickup loop sound, full required-SFX list still unaudited).
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: generated audio cues are wired into `src/components/FlatlineGame.tsx`. Adaptive music layers, the full required-SFX list, and the audio-readability cues have not been individually audited. Status `partial`.
