export const MUSIC_RAMP_START = 0.5
export const MUSIC_RAMP_END = 1.0
export const MUSIC_PEAK_GAIN = 0.07
export const MUSIC_BASS_HZ = 60
export const MUSIC_THROB_HZ = 3.2

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
