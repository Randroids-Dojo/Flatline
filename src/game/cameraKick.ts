import type { WeaponId } from './weapons'

export type CameraKickStyle = {
  fovDeltaDeg: number
  kickPx: number
  durationMs: number
}

const styles: Record<WeaponId, CameraKickStyle> = {
  peashooter: { fovDeltaDeg: -0.6, kickPx: 1, durationMs: 140 },
  inkblaster: { fovDeltaDeg: -1.4, kickPx: 3, durationMs: 180 },
  boomstick: { fovDeltaDeg: -3.0, kickPx: 6, durationMs: 220 }
}

export function cameraKickStyle(weapon: WeaponId): CameraKickStyle {
  return styles[weapon]
}

// Snap to the peak in the first 18 percent of the window, then ease
// linearly back to zero. The snap-then-ease shape reads as a punch
// rather than a slow ramp; tuning matches the weapon-recoil sprite
// kick which peaks at 35 percent of its own window.
const PEAK_FRACTION = 0.18

export function cameraKickProgressAtElapsedMs(style: CameraKickStyle | null, elapsedMs: number): number {
  if (style === null || elapsedMs <= 0 || elapsedMs >= style.durationMs) {
    return 0
  }

  const t = elapsedMs / style.durationMs

  if (t <= PEAK_FRACTION) {
    return t / PEAK_FRACTION
  }

  return (1 - t) / (1 - PEAK_FRACTION)
}
