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

/** Hitstop weight on a confirmed kill. The base style still sets the
 * scale dip; this helper extends the duration so the freeze is felt
 * as a beat rather than a frame. Scale is also pulled lower so the
 * kill reads heavier than a chip-damage tick at the same weapon. */
export const HITSTOP_KILL_DURATION_MULT = 1.6
export const HITSTOP_KILL_SCALE_MULT = 0.5

export function hitstopOnKill(base: HitstopStyle): HitstopStyle {
  return {
    scale: base.scale * HITSTOP_KILL_SCALE_MULT,
    durationMs: base.durationMs * HITSTOP_KILL_DURATION_MULT
  }
}
