/**
 * Audio sting for pickup collection events.
 *
 * The art is mostly grayscale (Q-001), so audio has to replace some color
 * cues. The required-SFX list in `docs/gdd/40-audio.md` calls for a
 * "Pickup" sound, and the audio-readability examples include
 * "Health pickup has a soft sparkle". Until this slice the pickup
 * collection trigger reused the generic 60 ms 520 Hz `playCue` blip,
 * which sounded indistinguishable from other one-shots.
 *
 * The sparkle is built from two short sine tones played back to back,
 * tuned as an ascending interval so the cue reads as "good, you got
 * something" rather than "bad" or "neutral". Two tones (instead of one)
 * are what makes a sparkle feel like a sparkle: a single tone at the
 * same gain reads as a beep.
 *
 * `firstFrequency` is the leading tone in Hz.
 * `secondFrequency` is the trailing tone in Hz. Higher than the first so
 * the cue ascends.
 * `waveform` is the OscillatorNode type used for both tones. Sine is
 * chosen because the existing audio palette already covers square /
 * triangle / sawtooth in damage and windup cues, so sine reads as a
 * different category of event.
 * `firstDurationMs` and `secondDurationMs` are the per-tone hold times.
 * The first tone is the longer of the two so the cue lands with a
 * snappy, brighter accent at the end.
 * `gain` is the oscillator amplitude. Pickups happen far less often
 * than damage events; the gain sits above the muted enemy-windup cues
 * but below the player-damage stings so collecting supplies feels
 * confirming without overpowering the in-progress combat audio.
 */
export type PickupKind = 'supply' | 'ammo-shell' | 'ammo-cell' | 'medkit'

export type PickupCueStyle = {
  firstFrequency: number
  secondFrequency: number
  waveform: OscillatorType
  firstDurationMs: number
  secondDurationMs: number
  gain: number
}

const supplyStyle: PickupCueStyle = {
  firstFrequency: 880,
  secondFrequency: 1320,
  waveform: 'sine',
  firstDurationMs: 150,
  secondDurationMs: 110,
  gain: 0.04
}

// Ammo shells: warmer, lower than the supply sparkle so the player
// hears "weapon refill" rather than "supplies." Square wave gives a
// faintly mechanical click that suits a shell box landing.
const ammoShellStyle: PickupCueStyle = {
  firstFrequency: 520,
  secondFrequency: 720,
  waveform: 'square',
  firstDurationMs: 90,
  secondDurationMs: 70,
  gain: 0.035
}

// Energy cells: brighter and faster, with a triangle wave so the cue
// reads as electronic rather than mechanical.
const ammoCellStyle: PickupCueStyle = {
  firstFrequency: 660,
  secondFrequency: 990,
  waveform: 'triangle',
  firstDurationMs: 80,
  secondDurationMs: 70,
  gain: 0.035
}

// Medkit pickup: warm sine "double chime" pitched lower than the
// supply sparkle so it reads as restorative rather than alert. Same
// waveform family as the supply cue (both restore the player) but
// different frequency band so the player can tell them apart.
const medkitStyle: PickupCueStyle = {
  firstFrequency: 720,
  secondFrequency: 1080,
  waveform: 'sine',
  firstDurationMs: 120,
  secondDurationMs: 100,
  gain: 0.045
}

export function pickupCue(kind: PickupKind): PickupCueStyle {
  switch (kind) {
    case 'ammo-shell':
      return ammoShellStyle
    case 'ammo-cell':
      return ammoCellStyle
    case 'medkit':
      return medkitStyle
    case 'supply':
    default:
      return supplyStyle
  }
}

/**
 * Total time the cue occupies, from the start of the first tone to the
 * end of the second. Useful for tests that need to assert the cue stays
 * inside a sensible window for back-to-back pickups, and for the
 * consumer if it ever needs to schedule a follow-up sound.
 */
export function pickupCueTotalDurationMs(style: PickupCueStyle): number {
  return style.firstDurationMs + style.secondDurationMs
}
