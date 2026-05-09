import type { EnemyType } from './enemies'

/**
 * Per-enemy-type audio cue fired when an enemy transitions to dead.
 *
 * REQ-040 (audio) lists "Enemy death" in the required SFX. The kill
 * confirmation already lands visually (death pop ring + score floater
 * in `src/components/FlatlineGame.tsx`), but a distinct death sound
 * makes every kill *feel* like an event rather than a silent state
 * flip. Tuning per type so a brute kill reads heavier than a skitter
 * kill and stacked kills stay legible.
 *
 * `frequencyStart` and `frequencyEnd` define the pitch envelope. The
 * cue uses `setTargetAtTime` to ease from start to end so each death
 * reads as a "drop" rather than a flat tone.
 * `waveform` picks the timbre. Different enemies use different
 * waveforms so two kills landing in the same frame stay
 * distinguishable.
 * `durationMs` is how long the oscillator runs. Short for skitter pop
 * (lighter weight), longer for the brute thud (heavy collapse).
 * `gain` is the oscillator amplitude. Sits below the loudest player
 * damage cue (0.05) so the kill cue never drowns out an incoming hit
 * cue, and below the windup family so windup-then-death does not
 * stomp itself.
 */
export type EnemyDeathCueStyle = {
  frequencyStart: number
  frequencyEnd: number
  waveform: OscillatorType
  durationMs: number
  gain: number
}

const skitterStyle: EnemyDeathCueStyle = {
  frequencyStart: 720,
  frequencyEnd: 320,
  waveform: 'triangle',
  durationMs: 110,
  gain: 0.024
}

const gruntStyle: EnemyDeathCueStyle = {
  frequencyStart: 420,
  frequencyEnd: 160,
  waveform: 'square',
  durationMs: 160,
  gain: 0.03
}

const bruteStyle: EnemyDeathCueStyle = {
  frequencyStart: 220,
  frequencyEnd: 70,
  waveform: 'sawtooth',
  durationMs: 280,
  gain: 0.04
}

const spitterStyle: EnemyDeathCueStyle = {
  frequencyStart: 540,
  frequencyEnd: 180,
  waveform: 'triangle',
  durationMs: 200,
  gain: 0.032
}

export function enemyDeathCue(type: EnemyType): EnemyDeathCueStyle {
  switch (type) {
    case 'skitter':
      return skitterStyle
    case 'brute':
      return bruteStyle
    case 'spitter':
      return spitterStyle
    case 'grunt':
    default:
      return gruntStyle
  }
}
