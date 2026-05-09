import type { EnemyType } from './enemies'

/**
 * Per-enemy-type audio cue fired when an enemy takes damage but
 * survives the hit.
 *
 * REQ-040 (audio) lists "Enemy hurt" in the required SFX. The kill
 * path already fires a distinct death cue (`enemyDeathCue.ts`); the
 * hurt path was using a generic `playCue(320)` blip that gave no
 * read on which enemy got tagged. Distinct hurt cues per type let
 * the player track damage on multiple enemies in flight without
 * looking at health bars.
 *
 * Tuning intent vs the death cue family:
 *   - Hurt cues are SHORTER and QUIETER than their death counterparts
 *     so the rhythm of multiple plinks on a brute does not drown
 *     combat audio.
 *   - Hurt cues sit ABOVE their death cue's `frequencyEnd` so the
 *     "this hit landed" stays bright; deaths drop into the bass.
 *   - Same waveform per type as the death cue so the player learns
 *     a consistent timbre for "skitter audio family."
 *
 * `frequency` is a flat oscillator pitch (no envelope). Hurt cues
 * are quick blips, not falling tones.
 * `waveform` mirrors the death cue's waveform per type.
 * `durationMs` is the oscillator hold time. Heavier enemies hold
 * slightly longer.
 * `gain` stays well below the player damage cue (0.05) and below
 * the death cue's gain so a hit does not feel as final as a kill.
 */
export type EnemyHurtCueStyle = Readonly<{
  frequency: number
  waveform: OscillatorType
  durationMs: number
  gain: number
}>

const skitterStyle: EnemyHurtCueStyle = Object.freeze({
  frequency: 620,
  waveform: 'triangle',
  durationMs: 60,
  gain: 0.018
})

const gruntStyle: EnemyHurtCueStyle = Object.freeze({
  frequency: 380,
  waveform: 'square',
  durationMs: 80,
  gain: 0.022
})

const bruteStyle: EnemyHurtCueStyle = Object.freeze({
  frequency: 220,
  waveform: 'sawtooth',
  durationMs: 110,
  gain: 0.03
})

const spitterStyle: EnemyHurtCueStyle = Object.freeze({
  frequency: 480,
  waveform: 'triangle',
  durationMs: 90,
  gain: 0.024
})

export function enemyHurtCue(type: EnemyType): EnemyHurtCueStyle {
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
