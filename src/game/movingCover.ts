// REQ-059 moving cover element. One slab sweeps east-to-west and back
// across z = 4 between the altar and the north spawn doors, with a
// fixed period so the player can time their crossings. Solid cover
// (not breakable) by spec: "one moving cover element that cycles
// predictably."

import type { CoverRect } from './coverCollision'

export const MOVING_COVER_PERIOD_MS = 8000
export const MOVING_COVER_Z = 4
export const MOVING_COVER_MIN_X = -3.5
export const MOVING_COVER_MAX_X = 3.5
export const MOVING_COVER_HALF_W = 0.5
export const MOVING_COVER_HALF_L = 0.2
export const MOVING_COVER_HEIGHT_M = 1.8

// Triangle-wave interpolation between MIN_X and MAX_X. At t=0 the slab
// is at MIN_X, at t=period/2 it is at MAX_X, at t=period it is back at
// MIN_X. The wave is linear in time so the slab's worldspace speed is
// constant across the run (no sinusoidal ease, since "predictably" in
// the spec means the player can time a crossing by counting beats,
// not by feeling out a curve).
export function movingCoverPositionX(
  elapsedMs: number,
  periodMs: number = MOVING_COVER_PERIOD_MS,
  minX: number = MOVING_COVER_MIN_X,
  maxX: number = MOVING_COVER_MAX_X
): number {
  const safePeriod = periodMs > 0 ? periodMs : MOVING_COVER_PERIOD_MS
  const phase = ((elapsedMs % safePeriod) + safePeriod) % safePeriod / safePeriod
  // Phase 0..0.5 sweeps min -> max; 0.5..1.0 sweeps max -> min.
  const t = phase < 0.5 ? phase * 2 : 2 - phase * 2
  return minX + (maxX - minX) * t
}

export function movingCoverRectAt(
  elapsedMs: number,
  periodMs: number = MOVING_COVER_PERIOD_MS
): CoverRect {
  return {
    x: movingCoverPositionX(elapsedMs, periodMs),
    z: MOVING_COVER_Z,
    halfW: MOVING_COVER_HALF_W,
    halfL: MOVING_COVER_HALF_L
  }
}

// Multiplier applied to the moving cover sweep period as room
// pressure rises. At pressure 0 the slab keeps its baseline period;
// at pressure 1 the period compresses to
// `MOVING_COVER_MIN_PERIOD_SCALE` so the slab sweeps faster. Caller
// scales the cover clock rather than the period directly so the
// phase stays continuous when pressure drifts mid-run.
export const MOVING_COVER_MIN_PERIOD_SCALE = 0.6
export function movingCoverPeriodScale(pressure: number): number {
  if (!Number.isFinite(pressure) || pressure <= 0) {
    return 1
  }
  if (pressure >= 1) {
    return MOVING_COVER_MIN_PERIOD_SCALE
  }
  return 1 + (MOVING_COVER_MIN_PERIOD_SCALE - 1) * pressure
}

// Inverse of the period scale. Multiply wall-clock delta by this when
// advancing the moving cover clock so a 0.6 period scale advances the
// clock ~1.67x faster at peak pressure.
export function movingCoverClockRate(pressure: number): number {
  return 1 / movingCoverPeriodScale(pressure)
}
