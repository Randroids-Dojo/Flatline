/**
 * Audio sting fired at run end (player flatlined).
 *
 * REQ-040 (audio) lists "Run end" in the required SFX. Today
 * `finishRun` mutes the music and rage layers and shows "Flatlined.";
 * the moment lands silently. A short three-tone descending sting
 * punctuates the death so it reads as a deliberate end, not a glitch.
 *
 * Three tones land in classic fall-arpeggio territory (think Doom's
 * obituary stinger). The first tone is the heaviest; subsequent
 * tones drop in pitch and shorten so the sting decays away rather
 * than holding flat. Sawtooth waveform so the timbre cuts through
 * any residual layer noise mid-fade.
 *
 * Frequencies are tuned below the loudest player damage cue (gain
 * 0.05) and above the music bass (60 Hz) so the sting sits in its
 * own space.
 */
export type RunEndTone = {
  frequency: number
  durationMs: number
  gain: number
}

export type RunEndCueStyle = {
  waveform: OscillatorType
  tones: readonly RunEndTone[]
}

const flatlineStyle: RunEndCueStyle = Object.freeze({
  waveform: 'sawtooth',
  tones: Object.freeze([
    Object.freeze({ frequency: 320, durationMs: 240, gain: 0.05 }),
    Object.freeze({ frequency: 200, durationMs: 240, gain: 0.045 }),
    Object.freeze({ frequency: 110, durationMs: 360, gain: 0.04 })
  ])
})

export function runEndCue(): RunEndCueStyle {
  return flatlineStyle
}

export function runEndCueTotalDurationMs(style: RunEndCueStyle): number {
  return style.tones.reduce((total, tone) => total + tone.durationMs, 0)
}
