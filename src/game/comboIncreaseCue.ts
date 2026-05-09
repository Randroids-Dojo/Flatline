/**
 * Audio tick fired on every combo-increasing kill (a kill that
 * extends the streak without crossing a milestone).
 *
 * REQ-040 (audio) lists "Combo" in the required SFX. The milestone
 * cue (`comboMilestone.ts`) fires at 5 / 10 / 20 only; intermediate
 * kills landed silently so the player heard a chunky cue at 5,
 * nothing at 6 / 7 / 8 / 9, then another at 10. This helper fills
 * the silence with a small per-tick blip that rises in pitch as the
 * streak grows so the build feels like ascent rather than flat-line
 * repetition.
 *
 * `baseFrequency` is the pitch at combo 1.
 * `frequencyStepHz` is added per combo step, capped via
 * `maxFrequencyHz` so very long streaks do not climb past audible
 * sweet spots.
 * `waveform` is sine so the tick reads as a soft pulse, distinct
 * from the milestone cue's sawtooth bigger-event timbre.
 * `durationMs` is short (a tick, not a tone).
 * `gain` sits well below the milestone cues so the tick is felt as
 * texture, not foreground.
 */
export type ComboIncreaseCueStyle = Readonly<{
  frequency: number
  waveform: OscillatorType
  durationMs: number
  gain: number
}>

const BASE_FREQUENCY_HZ = 360
const STEP_FREQUENCY_HZ = 24
const MAX_FREQUENCY_HZ = 720
const STYLE_DURATION_MS = 60
const STYLE_GAIN = 0.022

export function comboIncreaseCue(combo: number): ComboIncreaseCueStyle {
  const stepCount = Math.max(0, combo - 1)
  const frequency = Math.min(MAX_FREQUENCY_HZ, BASE_FREQUENCY_HZ + stepCount * STEP_FREQUENCY_HZ)

  return Object.freeze({
    frequency,
    waveform: 'sine',
    durationMs: STYLE_DURATION_MS,
    gain: STYLE_GAIN
  })
}

/**
 * True when a kill should fire the combo-increase cue: combo grew
 * from prev to current AND the cue is not pre-empted by a milestone
 * boundary on the same kill.
 */
export function shouldPlayComboIncreaseCue(
  previousCombo: number,
  currentCombo: number,
  crossedMilestone: number | null
): boolean {
  if (currentCombo <= previousCombo) {
    return false
  }

  if (crossedMilestone !== null) {
    return false
  }

  return true
}
