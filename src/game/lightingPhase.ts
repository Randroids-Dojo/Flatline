/**
 * Arena lighting phase mutations.
 *
 * `docs/gdd/47-arena-mutations.md` lists five lighting phases. The
 * MVP only needs lighting to vary noticeably; an intensity ramp tied
 * to pressure already ships in `src/components/FlatlineGame.tsx`. This
 * helper adds a flicker phase that kicks in at high pressure so the
 * room reads as overloaded right when the spawn director is dumping
 * waves on the player.
 *
 * `flickerPressureThreshold` is the wave-director pressure value at
 * which the overhead light starts to flicker. Below it, the light
 * sits at its smooth pressure-tied intensity. Above it, the flicker
 * scale modulates the intensity per-frame.
 *
 * The flicker is deterministic in `elapsedMs`: same time, same scale.
 * Two short hash steps produce a stair-stepped low-frequency drop
 * pattern, occasionally hitting the trough so the room "stutters"
 * rather than wavering.
 */
export type LightingPhase = 'normal' | 'flicker' | 'near-death'

export const FLICKER_PRESSURE_THRESHOLD = 0.7
export const FLICKER_TROUGH_SCALE = 0.5
export const FLICKER_PEAK_SCALE = 1.05

export const NEAR_DEATH_HEALTH_THRESHOLD = 25
export const NEAR_DEATH_PULSE_HZ = 1.33
export const NEAR_DEATH_TROUGH_SCALE = 0.55
export const NEAR_DEATH_PEAK_SCALE = 1.25

export function lightingPhaseForPressure(pressure: number): LightingPhase {
  if (pressure >= FLICKER_PRESSURE_THRESHOLD) {
    return 'flicker'
  }

  return 'normal'
}

/**
 * Pick the active lighting phase from both signals. Near-death (low
 * player health) takes precedence over the wave-driven flicker so a
 * near-death player feels the heartbeat regardless of pressure.
 */
export function lightingPhase(pressure: number, playerHealth: number): LightingPhase {
  if (playerHealth <= NEAR_DEATH_HEALTH_THRESHOLD && playerHealth > 0) {
    return 'near-death'
  }

  return lightingPhaseForPressure(pressure)
}

export function nearDeathIntensityScale(elapsedMs: number): number {
  const phase = (elapsedMs / 1000) * NEAR_DEATH_PULSE_HZ * 2 * Math.PI
  const norm = (Math.sin(phase) + 1) / 2
  return NEAR_DEATH_TROUGH_SCALE + norm * (NEAR_DEATH_PEAK_SCALE - NEAR_DEATH_TROUGH_SCALE)
}

export function flickerIntensityScale(elapsedMs: number): number {
  const stepMs = 80
  const step = Math.floor(elapsedMs / stepMs)
  const hashed = Math.sin(step * 12.9898) * 43758.5453
  const noise = hashed - Math.floor(hashed)

  if (noise < 0.18) {
    return FLICKER_TROUGH_SCALE
  }

  if (noise > 0.92) {
    return FLICKER_PEAK_SCALE
  }

  return 1
}

export function lightingIntensityScale(pressure: number, elapsedMs: number): number {
  if (lightingPhaseForPressure(pressure) === 'normal') {
    return 1
  }

  return flickerIntensityScale(elapsedMs)
}

/**
 * Combined per-frame scale that picks the right modulation from
 * both the pressure-tied flicker and the health-tied near-death
 * pulse. Near-death wins on overlap because the player's situation
 * is more urgent than the room's.
 */
export function combinedLightingIntensityScale(
  pressure: number,
  playerHealth: number,
  elapsedMs: number
): number {
  const phase = lightingPhase(pressure, playerHealth)

  if (phase === 'near-death') {
    return nearDeathIntensityScale(elapsedMs)
  }

  if (phase === 'flicker') {
    return flickerIntensityScale(elapsedMs)
  }

  return 1
}
