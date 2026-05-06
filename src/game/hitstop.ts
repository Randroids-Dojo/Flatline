import type { WeaponId } from './weapons'

export type HitstopStyle = {
  scale: number
  durationMs: number
}

const styles: Record<WeaponId, HitstopStyle> = {
  peashooter: { scale: 0.05, durationMs: 30 },
  inkblaster: { scale: 0.04, durationMs: 45 },
  boomstick: { scale: 0.02, durationMs: 60 }
}

export function hitstopStyle(weapon: WeaponId): HitstopStyle {
  return styles[weapon]
}

export function hitstopScaleAtElapsedMs(style: HitstopStyle | null, elapsedMs: number): number {
  if (style === null || elapsedMs >= style.durationMs) {
    return 1
  }

  return style.scale
}
