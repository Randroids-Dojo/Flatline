import type { EnemyType } from './enemies'

/**
 * Per-enemy-type audio cue for the start of a melee windup.
 *
 * Because the art is mostly grayscale (Q-001), audio has to replace some
 * color cues. A distinct windup tone tells the player which enemy is
 * about to swing without forcing them to read the silhouette mid-fight.
 *
 * `frequency` is the oscillator pitch in Hz.
 * `waveform` is the OscillatorNode type. Different waveforms have
 * different timbres so two enemies winding up at once stay
 * distinguishable.
 * `durationMs` is how long the oscillator stays on. The windup state
 * itself is longer; the cue only needs to mark the start.
 * `gain` is the oscillator amplitude. Heavier enemies are louder so
 * they cut through other SFX.
 *
 * Tuning intent:
 *   - Skitter: high, short whistle. Snappy pressure, tells the player to
 *     dodge fast.
 *   - Grunt:   mid square. The default melee read.
 *   - Brute:   low sawtooth inhale. Bassy warning that lasts long enough
 *     to read as "back up."
 */
export type EnemyWindupCueStyle = {
  frequency: number
  waveform: OscillatorType
  durationMs: number
  gain: number
}

const skitterStyle: EnemyWindupCueStyle = {
  frequency: 880,
  waveform: 'sine',
  durationMs: 110,
  gain: 0.022
}

const gruntStyle: EnemyWindupCueStyle = {
  frequency: 340,
  waveform: 'square',
  durationMs: 150,
  gain: 0.028
}

const bruteStyle: EnemyWindupCueStyle = {
  frequency: 150,
  waveform: 'sawtooth',
  durationMs: 280,
  gain: 0.038
}

export function enemyWindupCue(type: EnemyType): EnemyWindupCueStyle {
  switch (type) {
    case 'skitter':
      return skitterStyle
    case 'brute':
      return bruteStyle
    case 'grunt':
    default:
      return gruntStyle
  }
}
