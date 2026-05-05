import { describe, expect, it } from 'vitest'
import { enemyHurtFlashIntensity, enemyHurtFlashStyle } from './enemyHurtFlash'

describe('enemyHurtFlashStyle', () => {
  it('returns a grunt style with white flash color and positive timing', () => {
    const style = enemyHurtFlashStyle('grunt')
    expect(style.peakIntensity).toBeGreaterThan(0)
    expect(style.peakIntensity).toBeLessThanOrEqual(1)
    expect(style.holdMs).toBeGreaterThan(0)
    expect(style.decayMs).toBeGreaterThan(0)
    expect(style.flashColor.r).toBe(1)
    expect(style.flashColor.g).toBe(1)
    expect(style.flashColor.b).toBe(1)
  })

  it('gives the skitter a snappier flash than the brute', () => {
    const skitter = enemyHurtFlashStyle('skitter')
    const brute = enemyHurtFlashStyle('brute')
    expect(skitter.holdMs + skitter.decayMs).toBeLessThan(brute.holdMs + brute.decayMs)
  })

  it('keeps every flash brighter than half-strength so the read is unmissable', () => {
    for (const type of ['grunt', 'skitter', 'brute'] as const) {
      expect(enemyHurtFlashStyle(type).peakIntensity).toBeGreaterThanOrEqual(0.5)
    }
  })

  it('returns stable references for the same enemy type', () => {
    expect(enemyHurtFlashStyle('grunt')).toBe(enemyHurtFlashStyle('grunt'))
    expect(enemyHurtFlashStyle('skitter')).toBe(enemyHurtFlashStyle('skitter'))
    expect(enemyHurtFlashStyle('brute')).toBe(enemyHurtFlashStyle('brute'))
  })
})

describe('enemyHurtFlashIntensity', () => {
  const style = enemyHurtFlashStyle('grunt')

  it('returns peak intensity at t=0', () => {
    expect(enemyHurtFlashIntensity(style, 0)).toBe(style.peakIntensity)
  })

  it('holds peak intensity throughout the hold window', () => {
    expect(enemyHurtFlashIntensity(style, style.holdMs)).toBe(style.peakIntensity)
  })

  it('decays linearly across the decay window', () => {
    const midDecay = style.holdMs + style.decayMs / 2
    expect(enemyHurtFlashIntensity(style, midDecay)).toBeCloseTo(style.peakIntensity / 2, 5)
  })

  it('returns 0 once the flash window has fully elapsed', () => {
    expect(enemyHurtFlashIntensity(style, style.holdMs + style.decayMs)).toBe(0)
    expect(enemyHurtFlashIntensity(style, style.holdMs + style.decayMs + 100)).toBe(0)
  })

  it('returns 0 for negative elapsed time', () => {
    expect(enemyHurtFlashIntensity(style, -1)).toBe(0)
  })

  it('monotonically decreases after the hold window', () => {
    const samples = [style.holdMs, style.holdMs + 20, style.holdMs + 60, style.holdMs + 120, style.holdMs + style.decayMs]
    for (let i = 1; i < samples.length; i += 1) {
      expect(enemyHurtFlashIntensity(style, samples[i])).toBeLessThanOrEqual(enemyHurtFlashIntensity(style, samples[i - 1]))
    }
  })
})
