import { describe, expect, it } from 'vitest'
import { muzzleFlashStyle } from './muzzleFlash'

describe('muzzleFlashStyle', () => {
  it('returns a peashooter style with baseline scale', () => {
    const style = muzzleFlashStyle('peashooter')
    expect(style.scale).toBe(1)
    expect(style.color).toMatch(/^rgba\(/)
    expect(style.durationMs).toBeGreaterThan(0)
  })

  it('returns the largest, longest flash for the boomstick', () => {
    const peashooter = muzzleFlashStyle('peashooter')
    const boomstick = muzzleFlashStyle('boomstick')
    expect(boomstick.scale).toBeGreaterThan(peashooter.scale)
    expect(boomstick.durationMs).toBeGreaterThanOrEqual(peashooter.durationMs)
  })

  it('returns a teal-tinted color for the inkblaster', () => {
    const style = muzzleFlashStyle('inkblaster')
    // Teal accent: green channel should dominate red and equal/exceed blue baseline.
    const match = style.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/)
    expect(match).not.toBeNull()
    const [, r, g, b] = (match as RegExpMatchArray).map(Number)
    expect(g).toBeGreaterThan(r)
    expect(g).toBeGreaterThan(b)
  })

  it('returns a warm-tinted color for hitscan weapons', () => {
    for (const weapon of ['peashooter', 'boomstick'] as const) {
      const match = muzzleFlashStyle(weapon).color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/)
      expect(match).not.toBeNull()
      const [, r, , b] = (match as RegExpMatchArray).map(Number)
      expect(r).toBeGreaterThan(b)
    }
  })

  it('keeps every duration short enough to feel snappy', () => {
    for (const weapon of ['peashooter', 'boomstick', 'inkblaster'] as const) {
      const { durationMs } = muzzleFlashStyle(weapon)
      expect(durationMs).toBeGreaterThanOrEqual(80)
      expect(durationMs).toBeLessThanOrEqual(200)
    }
  })

  it('returns stable references for the same weapon id', () => {
    expect(muzzleFlashStyle('peashooter')).toBe(muzzleFlashStyle('peashooter'))
    expect(muzzleFlashStyle('boomstick')).toBe(muzzleFlashStyle('boomstick'))
    expect(muzzleFlashStyle('inkblaster')).toBe(muzzleFlashStyle('inkblaster'))
  })
})
