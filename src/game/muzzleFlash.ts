import type { WeaponId } from './weapons'

/**
 * Per-weapon visual tuning for the foreground muzzle flash overlay.
 * `color` is a CSS color string used by the radial-gradient flash.
 * `scale` multiplies the base flash size (1 = baseline pistol burst).
 * `durationMs` is how long the flash element stays mounted before
 * the parent component clears it; the CSS animation fades within this window.
 *
 * Values are first-pass and tuned against the existing 3D point-light
 * intensities (boomstick uses the brightest light, so its flash is biggest
 * and yellow-white; inkblaster uses a teal cell-energy color).
 */
export type MuzzleFlashStyle = {
  color: string
  scale: number
  durationMs: number
}

const peashooterStyle: MuzzleFlashStyle = {
  color: 'rgba(255, 220, 140, 0.95)',
  scale: 1,
  durationMs: 110
}

const boomstickStyle: MuzzleFlashStyle = {
  color: 'rgba(255, 200, 110, 0.98)',
  scale: 1.55,
  durationMs: 150
}

const inkblasterStyle: MuzzleFlashStyle = {
  color: 'rgba(80, 209, 192, 0.92)',
  scale: 1.2,
  durationMs: 130
}

export function muzzleFlashStyle(weapon: WeaponId): MuzzleFlashStyle {
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
