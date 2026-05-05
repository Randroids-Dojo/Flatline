import type { WeaponId } from './weapons'

/**
 * Per-weapon recoil tuning for the foreground weapon sprite kick.
 *
 * `kickPx` is the downward translation in CSS pixels at the peak of
 * the recoil animation. The sprite is anchored at `bottom: 0`, so a
 * positive `kickPx` slides it visibly down and back up.
 *
 * `rotateDeg` is the rotation around the sprite center at the peak;
 * a small negative value tilts the muzzle up the way a real recoil
 * would. Heavier weapons rotate further.
 *
 * `durationMs` is how long the full kick + return animation runs.
 * Heavier weapons take longer to settle so the recoil reads.
 *
 * Values are first-pass and tuned to match the existing muzzle flash
 * scale ordering (peashooter < inkblaster < boomstick) so the kick
 * intensity tracks the visible shot weight.
 */
export type WeaponRecoilStyle = {
  kickPx: number
  rotateDeg: number
  durationMs: number
}

const peashooterStyle: WeaponRecoilStyle = {
  kickPx: 6,
  rotateDeg: -1.2,
  durationMs: 140
}

const inkblasterStyle: WeaponRecoilStyle = {
  kickPx: 10,
  rotateDeg: -2.2,
  durationMs: 180
}

const boomstickStyle: WeaponRecoilStyle = {
  kickPx: 18,
  rotateDeg: -3.5,
  durationMs: 240
}

export function weaponRecoilStyle(weapon: WeaponId): WeaponRecoilStyle {
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
