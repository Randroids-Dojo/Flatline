import { describe, expect, it } from 'vitest'
import {
  MOVING_COVER_HALF_L,
  MOVING_COVER_HALF_W,
  MOVING_COVER_MAX_X,
  MOVING_COVER_MIN_PERIOD_SCALE,
  MOVING_COVER_MIN_X,
  MOVING_COVER_PERIOD_MS,
  MOVING_COVER_Z,
  movingCoverClockRate,
  movingCoverPeriodScale,
  movingCoverPositionX,
  movingCoverRectAt
} from './movingCover'

describe('movingCoverPositionX', () => {
  it('starts at MIN_X at t=0', () => {
    expect(movingCoverPositionX(0)).toBeCloseTo(MOVING_COVER_MIN_X, 10)
  })

  it('reaches MAX_X exactly at half-period', () => {
    expect(movingCoverPositionX(MOVING_COVER_PERIOD_MS / 2)).toBeCloseTo(MOVING_COVER_MAX_X, 10)
  })

  it('returns to MIN_X at full period (wraps cleanly)', () => {
    expect(movingCoverPositionX(MOVING_COVER_PERIOD_MS)).toBeCloseTo(MOVING_COVER_MIN_X, 10)
  })

  it('hits the midpoint at quarter-period (linear sweep)', () => {
    const midpoint = (MOVING_COVER_MIN_X + MOVING_COVER_MAX_X) / 2
    expect(movingCoverPositionX(MOVING_COVER_PERIOD_MS / 4)).toBeCloseTo(midpoint, 10)
  })

  it('hits the midpoint at three-quarter period (back-sweep mirror)', () => {
    const midpoint = (MOVING_COVER_MIN_X + MOVING_COVER_MAX_X) / 2
    expect(movingCoverPositionX((3 * MOVING_COVER_PERIOD_MS) / 4)).toBeCloseTo(midpoint, 10)
  })

  it('repeats across multiple periods', () => {
    expect(movingCoverPositionX(MOVING_COVER_PERIOD_MS * 1.5)).toBeCloseTo(MOVING_COVER_MAX_X, 10)
    expect(movingCoverPositionX(MOVING_COVER_PERIOD_MS * 2)).toBeCloseTo(MOVING_COVER_MIN_X, 10)
  })

  it('respects custom min / max endpoints', () => {
    expect(movingCoverPositionX(0, MOVING_COVER_PERIOD_MS, -1, 1)).toBeCloseTo(-1, 10)
    expect(movingCoverPositionX(MOVING_COVER_PERIOD_MS / 2, MOVING_COVER_PERIOD_MS, -1, 1)).toBeCloseTo(1, 10)
  })

  it('falls back to the default period when given a non-positive override', () => {
    // A defensive default. Calling with zero would otherwise divide
    // by zero and the runtime would NaN every frame.
    expect(movingCoverPositionX(0, 0)).toBeCloseTo(MOVING_COVER_MIN_X, 10)
    expect(movingCoverPositionX(0, -100)).toBeCloseTo(MOVING_COVER_MIN_X, 10)
  })

  it('handles negative elapsedMs as if the cycle ran in reverse from zero', () => {
    // The phase normalization wraps negatives back into [0, period),
    // so a small negative time is just shy of the end of a cycle.
    const justBeforeOne = movingCoverPositionX(-1)
    expect(justBeforeOne).toBeGreaterThan(MOVING_COVER_MIN_X)
    expect(justBeforeOne).toBeLessThan(MOVING_COVER_MIN_X + 0.01)
  })
})

describe('movingCoverRectAt', () => {
  it('returns a CoverRect with the swept x, fixed z, and constant halves', () => {
    const rect = movingCoverRectAt(MOVING_COVER_PERIOD_MS / 4)
    expect(rect.x).toBeCloseTo((MOVING_COVER_MIN_X + MOVING_COVER_MAX_X) / 2, 10)
    expect(rect.z).toBe(MOVING_COVER_Z)
    expect(rect.halfW).toBe(MOVING_COVER_HALF_W)
    expect(rect.halfL).toBe(MOVING_COVER_HALF_L)
  })

  it('produces structurally distinct rects each call (no shared reference)', () => {
    const a = movingCoverRectAt(0)
    const b = movingCoverRectAt(0)
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('movingCoverPeriodScale', () => {
  it('runs at baseline at pressure 0 so early-run sweeps match legacy timing', () => {
    expect(movingCoverPeriodScale(0)).toBe(1)
  })

  it('compresses to the floor at peak pressure', () => {
    expect(movingCoverPeriodScale(1)).toBe(MOVING_COVER_MIN_PERIOD_SCALE)
  })

  it('interpolates linearly between baseline and floor', () => {
    expect(movingCoverPeriodScale(0.5)).toBeCloseTo(1 + (MOVING_COVER_MIN_PERIOD_SCALE - 1) * 0.5)
  })

  it('clamps non-finite, negative, and above-1 pressures', () => {
    expect(movingCoverPeriodScale(Number.NaN)).toBe(1)
    expect(movingCoverPeriodScale(-1)).toBe(1)
    expect(movingCoverPeriodScale(2)).toBe(MOVING_COVER_MIN_PERIOD_SCALE)
  })

  it('floor sits well below baseline so the player feels the speed-up', () => {
    expect(MOVING_COVER_MIN_PERIOD_SCALE).toBeLessThan(0.75)
    expect(MOVING_COVER_MIN_PERIOD_SCALE).toBeGreaterThan(0.4)
  })
})

describe('movingCoverClockRate', () => {
  it('is the inverse of the period scale', () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      expect(movingCoverClockRate(p) * movingCoverPeriodScale(p)).toBeCloseTo(1)
    }
  })

  it('rises monotonically with pressure', () => {
    const rates = [0, 0.25, 0.5, 0.75, 1].map(movingCoverClockRate)
    for (let i = 1; i < rates.length; i += 1) {
      expect(rates[i]).toBeGreaterThanOrEqual(rates[i - 1])
    }
  })
})
