import { describe, expect, it } from 'vitest'

import {
  RAGE_DAMAGE_MULTIPLIER,
  RAGE_DURATION_MS,
  RAGE_FADE_IN_MS,
  RAGE_FADE_OUT_MS,
  RAGE_FIRE_RATE_MULTIPLIER,
  RAGE_SPEED_MULTIPLIER,
  RAGE_TINT_PEAK_OPACITY,
  rageBuffActive,
  rageBuffRemainingMs,
  rageMultipliers,
  rageTintOpacity
} from './rageBuff'

describe('rage buff constants', () => {
  it('exposes the documented duration and multipliers', () => {
    expect(RAGE_DURATION_MS).toBe(10_000)
    expect(RAGE_DAMAGE_MULTIPLIER).toBeCloseTo(1.5, 5)
    expect(RAGE_SPEED_MULTIPLIER).toBeCloseTo(1.3, 5)
    expect(RAGE_FIRE_RATE_MULTIPLIER).toBeCloseTo(1.5, 5)
  })
})

describe('rageBuffActive', () => {
  it('is false when no buff is active', () => {
    expect(rageBuffActive(null, 0)).toBe(false)
    expect(rageBuffActive(null, 9999)).toBe(false)
  })

  it('is true at the very start of the window', () => {
    expect(rageBuffActive({ startMs: 1000 }, 1000)).toBe(true)
  })

  it('is true mid-window', () => {
    expect(rageBuffActive({ startMs: 0 }, RAGE_DURATION_MS / 2)).toBe(true)
  })

  it('is false at exactly the duration boundary', () => {
    expect(rageBuffActive({ startMs: 0 }, RAGE_DURATION_MS)).toBe(false)
  })

  it('is false beyond the duration', () => {
    expect(rageBuffActive({ startMs: 0 }, RAGE_DURATION_MS + 1000)).toBe(false)
  })

  it('is false if elapsed is negative (clock skew)', () => {
    expect(rageBuffActive({ startMs: 1000 }, 500)).toBe(false)
  })
})

describe('rageBuffRemainingMs', () => {
  it('is 0 when no buff is active', () => {
    expect(rageBuffRemainingMs(null, 0)).toBe(0)
  })

  it('is full duration at start', () => {
    expect(rageBuffRemainingMs({ startMs: 0 }, 0)).toBe(RAGE_DURATION_MS)
  })

  it('decreases linearly', () => {
    expect(rageBuffRemainingMs({ startMs: 0 }, 4000)).toBe(RAGE_DURATION_MS - 4000)
  })

  it('clamps at 0 when expired', () => {
    expect(rageBuffRemainingMs({ startMs: 0 }, RAGE_DURATION_MS + 1000)).toBe(0)
  })
})

describe('rageMultipliers', () => {
  it('returns 1.0 across the board when inactive', () => {
    const m = rageMultipliers(null, 0)
    expect(m.damage).toBe(1)
    expect(m.speed).toBe(1)
    expect(m.fireRate).toBe(1)
  })

  it('returns the configured multipliers when active', () => {
    const m = rageMultipliers({ startMs: 0 }, RAGE_DURATION_MS / 2)
    expect(m.damage).toBeCloseTo(RAGE_DAMAGE_MULTIPLIER, 5)
    expect(m.speed).toBeCloseTo(RAGE_SPEED_MULTIPLIER, 5)
    expect(m.fireRate).toBeCloseTo(RAGE_FIRE_RATE_MULTIPLIER, 5)
  })

  it('snaps back to 1.0 the frame the buff expires', () => {
    const m = rageMultipliers({ startMs: 0 }, RAGE_DURATION_MS)
    expect(m.damage).toBe(1)
    expect(m.speed).toBe(1)
    expect(m.fireRate).toBe(1)
  })
})

describe('rageTintOpacity', () => {
  it('is 0 when there is no buff', () => {
    expect(rageTintOpacity(null, 0)).toBe(0)
  })

  it('is 0 at exactly elapsedMs = 0 (fade in starts there)', () => {
    expect(rageTintOpacity({ startMs: 0 }, 0)).toBe(0)
  })

  it('reaches near peak at the end of the fade-in window', () => {
    // Pulse modulates between 0.8 and 1.0 of peak; at fade-in end the envelope is 1.
    const opacity = rageTintOpacity({ startMs: 0 }, RAGE_FADE_IN_MS)
    expect(opacity).toBeGreaterThan(RAGE_TINT_PEAK_OPACITY * 0.8 - 0.001)
    expect(opacity).toBeLessThanOrEqual(RAGE_TINT_PEAK_OPACITY + 0.001)
  })

  it('stays in the peak band during the held middle of the buff', () => {
    const midMs = RAGE_DURATION_MS / 2
    const opacity = rageTintOpacity({ startMs: 0 }, midMs)
    expect(opacity).toBeGreaterThan(RAGE_TINT_PEAK_OPACITY * 0.79)
    expect(opacity).toBeLessThanOrEqual(RAGE_TINT_PEAK_OPACITY + 0.001)
  })

  it('is 0 once the duration ends', () => {
    expect(rageTintOpacity({ startMs: 0 }, RAGE_DURATION_MS)).toBe(0)
  })

  it('eases out across the final RAGE_FADE_OUT_MS so the last instant is near 0', () => {
    const justBeforeEnd = RAGE_DURATION_MS - 1
    expect(rageTintOpacity({ startMs: 0 }, justBeforeEnd)).toBeLessThan(RAGE_TINT_PEAK_OPACITY * 0.05)
  })

  it('halfway through the fade-out is roughly half the peak band', () => {
    const halfFadeOutMs = RAGE_DURATION_MS - RAGE_FADE_OUT_MS / 2
    const opacity = rageTintOpacity({ startMs: 0 }, halfFadeOutMs)
    // Envelope = 0.5; pulse [0.8, 1.0]; expected band [0.4, 0.5] of peak
    expect(opacity).toBeGreaterThan(RAGE_TINT_PEAK_OPACITY * 0.39)
    expect(opacity).toBeLessThan(RAGE_TINT_PEAK_OPACITY * 0.51)
  })
})
