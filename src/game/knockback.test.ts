import { describe, expect, it } from 'vitest'

import { knockbackDistance } from './knockback'

describe('knockbackDistance', () => {
  it('returns the configured close-range impulse for each weapon against a grunt at zero distance', () => {
    expect(knockbackDistance('peashooter', 0, 'grunt')).toBeCloseTo(0.15, 5)
    expect(knockbackDistance('inkblaster', 0, 'grunt')).toBeCloseTo(0.4, 5)
    expect(knockbackDistance('boomstick', 0, 'grunt')).toBeCloseTo(0.9, 5)
  })

  it('falls off linearly toward the configured far-range impulse at max range (18 m)', () => {
    expect(knockbackDistance('peashooter', 18, 'grunt')).toBeCloseTo(0.08, 5)
    expect(knockbackDistance('inkblaster', 18, 'grunt')).toBeCloseTo(0.18, 5)
    expect(knockbackDistance('boomstick', 18, 'grunt')).toBeCloseTo(0.2, 5)
  })

  it('clamps at the far-range impulse for distances beyond max range', () => {
    expect(knockbackDistance('boomstick', 100, 'grunt')).toBeCloseTo(0.2, 5)
  })

  it('treats negative distances as point-blank', () => {
    expect(knockbackDistance('boomstick', -5, 'grunt')).toBeCloseTo(0.9, 5)
  })

  it('mid-range returns the linear midpoint between close and far', () => {
    expect(knockbackDistance('boomstick', 9, 'grunt')).toBeCloseTo(0.55, 5)
    expect(knockbackDistance('peashooter', 9, 'grunt')).toBeCloseTo(0.115, 5)
    expect(knockbackDistance('inkblaster', 9, 'grunt')).toBeCloseTo(0.29, 5)
  })

  it('boosts knockback against the lighter skitter (130 percent)', () => {
    expect(knockbackDistance('boomstick', 0, 'skitter')).toBeCloseTo(0.9 * 1.3, 5)
    expect(knockbackDistance('peashooter', 0, 'skitter')).toBeCloseTo(0.15 * 1.3, 5)
  })

  it('halves knockback against the heavy brute (50 percent)', () => {
    expect(knockbackDistance('boomstick', 0, 'brute')).toBeCloseTo(0.45, 5)
    expect(knockbackDistance('peashooter', 0, 'brute')).toBeCloseTo(0.075, 5)
  })

  it('orders by weapon at point-blank: peashooter < inkblaster < boomstick', () => {
    expect(knockbackDistance('peashooter', 0, 'grunt')).toBeLessThan(knockbackDistance('inkblaster', 0, 'grunt'))
    expect(knockbackDistance('inkblaster', 0, 'grunt')).toBeLessThan(knockbackDistance('boomstick', 0, 'grunt'))
  })

  it('orders by enemy at point-blank: brute < grunt < skitter', () => {
    expect(knockbackDistance('boomstick', 0, 'brute')).toBeLessThan(knockbackDistance('boomstick', 0, 'grunt'))
    expect(knockbackDistance('boomstick', 0, 'grunt')).toBeLessThan(knockbackDistance('boomstick', 0, 'skitter'))
  })
})
