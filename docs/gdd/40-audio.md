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

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: generated audio cues are wired into `src/components/FlatlineGame.tsx`. Adaptive music layers, the full required-SFX list, and the audio-readability cues have not been individually audited. Status `partial`.
