import type { WeaponId } from './weapons'

/**
 * Per-weapon audio cue fired on every shot.
 *
 * REQ-040 (audio) lists "Weapon fire" in the required SFX. The
 * existing wiring used a generic `playCue(weapon === 'boomstick' ?
 * 120 : 180)` blip, which made the peashooter and inkblaster sound
 * identical and the boomstick read as a slightly lower beep. With
 * three weapons in rotation the player needs each shot to sound like
 * the gun in their hand. Different waveforms per weapon so the
 * timbre matches the silhouette: peashooter is a quick triangle
 * pluck, boomstick is a low sawtooth boom, inkblaster is a square
 * blip with a wet drop in pitch.
 *
 * `frequencyStart` and `frequencyEnd` define the pitch envelope. Each
 * weapon drops in pitch over the duration so the cue reads as a
 * snap, not a hold. Boomstick drops the furthest (low body, lower
 * tail) for the shotgun thud.
 * `waveform` picks the timbre.
 * `durationMs` is how long the oscillator runs. Boomstick lasts the
 * longest (heavier shot); peashooter is the shortest (rapid plinks).
 * `gain` is the amplitude. Boomstick is the loudest; peashooter is
 * the quietest because it fires the most often.
 */
export type WeaponFireCueStyle = {
  frequencyStart: number
  frequencyEnd: number
  waveform: OscillatorType
  durationMs: number
  gain: number
}

const peashooterStyle: WeaponFireCueStyle = {
  frequencyStart: 720,
  frequencyEnd: 480,
  waveform: 'triangle',
  durationMs: 70,
  gain: 0.028
}

const boomstickStyle: WeaponFireCueStyle = {
  frequencyStart: 180,
  frequencyEnd: 60,
  waveform: 'sawtooth',
  durationMs: 220,
  gain: 0.05
}

const inkblasterStyle: WeaponFireCueStyle = {
  frequencyStart: 540,
  frequencyEnd: 240,
  waveform: 'square',
  durationMs: 130,
  gain: 0.038
}

export function weaponFireCue(weapon: WeaponId): WeaponFireCueStyle {
  switch (weapon) {
    case 'boomstick':
      return boomstickStyle
    case 'inkblaster':
      return inkblasterStyle
    case 'peashooter':
    default:
      return peashooterStyle
  }
}
