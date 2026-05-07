import { describe, expect, it } from 'vitest'
import {
  BOOMSTICK_POINT_BLANK_M,
  BOOMSTICK_POINT_BLANK_MULT,
  boomstickPointBlankMultiplier
} from './boomstickPointBlank'

describe('boomstickPointBlankMultiplier', () => {
  it('boosts damage strictly inside the threshold', () => {
    expect(boomstickPointBlankMultiplier(0)).toBe(BOOMSTICK_POINT_BLANK_MULT)
    expect(boomstickPointBlankMultiplier(1.0)).toBe(BOOMSTICK_POINT_BLANK_MULT)
    expect(boomstickPointBlankMultiplier(BOOMSTICK_POINT_BLANK_M - 0.01)).toBe(BOOMSTICK_POINT_BLANK_MULT)
  })

  it('returns 1 at and beyond the threshold', () => {
    expect(boomstickPointBlankMultiplier(BOOMSTICK_POINT_BLANK_M)).toBe(1)
    expect(boomstickPointBlankMultiplier(3.0)).toBe(1)
    expect(boomstickPointBlankMultiplier(18)).toBe(1)
  })

  it('exposes the threshold and multiplier as constants', () => {
    expect(BOOMSTICK_POINT_BLANK_M).toBe(2.0)
    expect(BOOMSTICK_POINT_BLANK_MULT).toBe(1.5)
  })
})
