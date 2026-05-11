export const MUSIC_RAMP_START = 0.5
export const MUSIC_RAMP_END = 1.0
export const MUSIC_PEAK_GAIN = 0.07
export const MUSIC_BASS_HZ = 60
export const MUSIC_THROB_HZ = 3.2

// Layer 2: combat-intensity stem. Fades in once the room is busy
// (above the bass-thrash midpoint) and finishes ramping before the
// high-pressure layer starts. Mixed lower than the bass so it sits
// underneath the player's verbs.
export const COMBAT_RAMP_START = 0.6
export const COMBAT_RAMP_END = 0.75
export const COMBAT_PEAK_GAIN = 0.045
export const COMBAT_LEAD_HZ = 180
export const COMBAT_DETUNE_CENTS = 4

// Maps the active-pressure / target-pressure ratio to a 0..1 gain
// envelope. The thrash layer is silent below 0.5 (the player is not
// under threat), ramps in linearly across 0.5..1.0 so the music
// rises as the room fills up, and holds at full gain above 1.0 so
// the layer stays present during sustained peak phases.
export function musicIntensityGain(pressureRatio: number): number {
  if (!Number.isFinite(pressureRatio) || pressureRatio <= MUSIC_RAMP_START) {
    return 0
  }

  if (pressureRatio >= MUSIC_RAMP_END) {
    return 1
  }

  return (pressureRatio - MUSIC_RAMP_START) / (MUSIC_RAMP_END - MUSIC_RAMP_START)
}

// Layer 2 envelope. Fades in across `COMBAT_RAMP_START..COMBAT_RAMP_END`
// (a shorter, higher window than the bass thrash). Once pressure
// crosses 0.75 the combat stem holds at peak so the layer keeps adding
// tension during sustained peak waves.
export function combatMusicGain(pressureRatio: number): number {
  if (!Number.isFinite(pressureRatio) || pressureRatio <= COMBAT_RAMP_START) {
    return 0
  }

  if (pressureRatio >= COMBAT_RAMP_END) {
    return 1
  }

  return (pressureRatio - COMBAT_RAMP_START) / (COMBAT_RAMP_END - COMBAT_RAMP_START)
}
