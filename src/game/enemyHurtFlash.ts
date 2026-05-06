import type { EnemyType } from './enemies'

/**
 * Per-enemy-type visual tuning for the on-damage hurt flash.
 *
 * `peakIntensity` is the maximum lerp factor (0..1) toward `flashColor`
 * applied to the enemy material when a hit lands. 1 = solid flash color,
 * 0 = no tint shift. `holdMs` is how long the flash sits at peak before
 * starting to fall off. `decayMs` is the linear fall-off duration that
 * follows. `flashColor` is the target color the material lerps toward
 * during the flash window. Values are first-pass and chosen so a one-shot
 * grunt kill still reads as a flash before the dead-state cleanup.
 */
export type EnemyHurtFlashStyle = {
  peakIntensity: number
  holdMs: number
  decayMs: number
  flashColor: { r: number; g: number; b: number }
}

const gruntStyle: EnemyHurtFlashStyle = {
  peakIntensity: 0.85,
  holdMs: 60,
  decayMs: 140,
  flashColor: { r: 1, g: 1, b: 1 }
}

const skitterStyle: EnemyHurtFlashStyle = {
  peakIntensity: 0.95,
  holdMs: 40,
  decayMs: 110,
  flashColor: { r: 1, g: 1, b: 1 }
}

const bruteStyle: EnemyHurtFlashStyle = {
  peakIntensity: 0.7,
  holdMs: 90,
  decayMs: 220,
  flashColor: { r: 1, g: 0.95, b: 0.92 }
}

const spitterStyle: EnemyHurtFlashStyle = {
  peakIntensity: 0.9,
  holdMs: 50,
  decayMs: 130,
  flashColor: { r: 1, g: 1, b: 1 }
}

export function enemyHurtFlashStyle(enemyType: EnemyType): EnemyHurtFlashStyle {
  switch (enemyType) {
    case 'skitter':
      return skitterStyle
    case 'brute':
      return bruteStyle
    case 'spitter':
      return spitterStyle
    case 'grunt':
    default:
      return gruntStyle
  }
}

/**
 * Returns the flash intensity (0..1) at `elapsedMs` past the hurt start.
 * 1 means lerp the material fully to `flashColor`; 0 means no flash.
 *
 * Curve: instant rise to `peakIntensity`, hold for `holdMs`, then linear
 * decay to 0 across `decayMs`. Values past hold + decay return 0.
 */
export function enemyHurtFlashIntensity(style: EnemyHurtFlashStyle, elapsedMs: number): number {
  if (elapsedMs < 0) {
    return 0
  }

  if (elapsedMs <= style.holdMs) {
    return style.peakIntensity
  }

  const decayElapsed = elapsedMs - style.holdMs

  if (decayElapsed >= style.decayMs) {
    return 0
  }

  const remaining = 1 - decayElapsed / style.decayMs
  return style.peakIntensity * remaining
}
