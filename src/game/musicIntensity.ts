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

// Layer 3: high-pressure stem. Joins after the combat stem so the mix
// keeps thickening as the room saturates. Sawtooth pitched well above
// the combat lead so the harmonics broaden into a "wall of pressure."
export const HIGH_PRESSURE_RAMP_START = 0.8
export const HIGH_PRESSURE_RAMP_END = 0.95
export const HIGH_PRESSURE_PEAK_GAIN = 0.035
export const HIGH_PRESSURE_LEAD_HZ = 320
export const HIGH_PRESSURE_DETUNE_CENTS = 9

// Layer 4: near-death stem. Driven by player health rather than room
// pressure: silent above `NEAR_DEATH_HEALTH_THRESHOLD`, ramps in as
// HP drops, holds at peak once HP is at `NEAR_DEATH_FULL_HEALTH` or
// below. Sine pitched under the bass thrash with a 1.33 Hz LFO so the
// stem reads as a slow heartbeat thudding under the music. The
// threshold and pulse frequency intentionally match the lighting
// near-death pulse phase so audio and lighting throb in unison.
export const NEAR_DEATH_HEALTH_THRESHOLD = 25
export const NEAR_DEATH_FULL_HEALTH = 5
export const NEAR_DEATH_PEAK_GAIN = 0.04
export const NEAR_DEATH_LEAD_HZ = 55
export const NEAR_DEATH_PULSE_HZ = 1.33
export const NEAR_DEATH_PULSE_DEPTH = 0.5

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

// Layer 3 envelope. Same shape as the combat envelope but a higher
// band so the high-pressure stem fades in only after the combat layer
// has hit peak.
export function highPressureMusicGain(pressureRatio: number): number {
  if (!Number.isFinite(pressureRatio) || pressureRatio <= HIGH_PRESSURE_RAMP_START) {
    return 0
  }

  if (pressureRatio >= HIGH_PRESSURE_RAMP_END) {
    return 1
  }

  return (
    (pressureRatio - HIGH_PRESSURE_RAMP_START) /
    (HIGH_PRESSURE_RAMP_END - HIGH_PRESSURE_RAMP_START)
  )
}

// Layer 4 envelope. Keyed to player health (lower health is more
// dangerous, so the gain rises as HP falls). Silent above the
// threshold, ramps in linearly between threshold and `FULL_HEALTH`,
// and holds at peak once HP is at or below `FULL_HEALTH` so a player
// hovering at 1 HP feels the layer sustained rather than spiking and
// receding.
export function nearDeathMusicGain(playerHealth: number): number {
  if (!Number.isFinite(playerHealth) || playerHealth >= NEAR_DEATH_HEALTH_THRESHOLD) {
    return 0
  }

  if (playerHealth <= NEAR_DEATH_FULL_HEALTH) {
    return 1
  }

  return (
    (NEAR_DEATH_HEALTH_THRESHOLD - playerHealth) /
    (NEAR_DEATH_HEALTH_THRESHOLD - NEAR_DEATH_FULL_HEALTH)
  )
}
