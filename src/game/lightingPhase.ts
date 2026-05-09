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
export type LightingPhase = 'normal' | 'flicker'

export const FLICKER_PRESSURE_THRESHOLD = 0.7
export const FLICKER_TROUGH_SCALE = 0.5
export const FLICKER_PEAK_SCALE = 1.05

export function lightingPhaseForPressure(pressure: number): LightingPhase {
  if (pressure >= FLICKER_PRESSURE_THRESHOLD) {
    return 'flicker'
  }

  return 'normal'
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
