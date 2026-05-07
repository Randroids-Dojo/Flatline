/**
 * Audio sting for a combo break.
 *
 * The combo HUD pill shows the current streak; when the streak times out
 * without a fresh kill, it silently snaps to 0. Without a cue, the player
 * does not register that a real bonus track was lost. A short descending
 * two-tone reads as "lost something" without competing with the louder
 * weapon and damage stings.
 *
 * Combo breaks should only cue when a real streak existed. A 1-kill
 * streak that times out is just normal pacing; it would over-trigger
 * the cue and turn into noise. The consumer guards on a minimum prior
 * combo before calling `playComboBreakCue`.
 */
export type ComboBreakCueStyle = {
  firstFrequency: number
  secondFrequency: number
  waveform: OscillatorType
  firstDurationMs: number
  secondDurationMs: number
  gain: number
}

const defaultStyle: ComboBreakCueStyle = {
  firstFrequency: 620,
  secondFrequency: 360,
  waveform: 'triangle',
  firstDurationMs: 80,
  secondDurationMs: 110,
  gain: 0.05
}

export function comboBreakCue(): ComboBreakCueStyle {
  return defaultStyle
}

export function comboBreakCueTotalDurationMs(style: ComboBreakCueStyle): number {
  return style.firstDurationMs + style.secondDurationMs
}

/** Minimum prior combo length that triggers the cue. A 1-kill streak that
 * times out is normal pacing; treat 2+ as a real break worth cueing. */
export const COMBO_BREAK_MIN_PRIOR = 2

/**
 * Returns true if the combo just transitioned from a real streak to 0.
 * The consumer compares the previous-frame active combo against the
 * current-frame value; the helper centralizes the threshold so tests
 * pin the rule.
 */
export function comboJustBroke(previousActive: number, currentActive: number): boolean {
  return currentActive === 0 && previousActive >= COMBO_BREAK_MIN_PRIOR
}
