/**
 * Audio sting for player damage events.
 *
 * The art is mostly grayscale (Q-001), so audio has to replace some color
 * cues. The required-SFX list in `docs/gdd/40-audio.md` calls for a
 * "Player damage" sound. Two damage sources currently reach the player:
 * an enemy melee hit and a hazard tick. They need distinct timbres so
 * the player can tell from sound alone what hit them, even when they
 * cannot see the source.
 *
 * `frequency` is the oscillator pitch in Hz.
 * `waveform` is the OscillatorNode type. Different waveforms keep two
 * overlapping cues distinguishable.
 * `durationMs` is how long the oscillator stays on. The cue is a
 * stinger, not a drone; durations stay under ~250 ms so a series of
 * fast hits does not pile up into noise.
 * `gain` is the oscillator amplitude. Player damage cuts through other
 * SFX, so gain is tuned higher than the windup cues but still below
 * the weapon-fire cues so the player can still hear their own shots.
 *
 * Tuning intent:
 *   - `enemy`:  short low square. A blunt punch read at the moment the
 *     enemy lands a melee hit. Square chosen so it stays distinct from
 *     the existing enemy-windup cues (which use sine / square / saw at
 *     different pitches). Sits below the grunt windup pitch so a
 *     windup-then-hit sequence reads as a falling tone.
 *   - `hazard`: medium triangle. Triangle waveform is uncommon in the
 *     existing cue set, which makes hazard ticks distinguishable from
 *     enemy hits at a glance. Pitch sits between the brute windup and
 *     the grunt windup.
 */
export type PlayerDamageSource = 'enemy' | 'hazard'

export type PlayerDamageCueStyle = {
  frequency: number
  waveform: OscillatorType
  durationMs: number
  gain: number
}

const enemyStyle: PlayerDamageCueStyle = {
  frequency: 200,
  waveform: 'square',
  durationMs: 180,
  gain: 0.045
}

const hazardStyle: PlayerDamageCueStyle = {
  frequency: 260,
  waveform: 'triangle',
  durationMs: 220,
  gain: 0.05
}

export function playerDamageCue(source: PlayerDamageSource): PlayerDamageCueStyle {
  switch (source) {
    case 'hazard':
      return hazardStyle
    case 'enemy':
    default:
      return enemyStyle
  }
}
