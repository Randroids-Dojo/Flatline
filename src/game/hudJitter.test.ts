import { describe, expect, it } from 'vitest'
import {
  hudGrainOpacity,
  hudPillWobbleAmplitudePx,
  hudPillWobblePeriodMs,
  hudPillWobbleRotationDeg,
  hudSplatterIntensity
} from './hudJitter'

describe('hudPillWobbleAmplitudePx', () => {
  it('returns a small positive amplitude at full health', () => {
    const amp = hudPillWobbleAmplitudePx(100)
    expect(amp).toBeGreaterThan(0)
    expect(amp).toBeLessThanOrEqual(1)
  })

  it('grows as health drops but stays under the readability cap', () => {
    const full = hudPillWobbleAmplitudePx(100)
    const low = hudPillWobbleAmplitudePx(20)
    expect(low).toBeGreaterThan(full)
    // Amplitude must stay small enough to keep numbers legible.
    expect(hudPillWobbleAmplitudePx(0)).toBeLessThanOrEqual(1.2)
  })
})

describe('hudPillWobbleRotationDeg', () => {
  it('returns a sub-degree rotation at full health', () => {
    const rot = hudPillWobbleRotationDeg(100)
    expect(rot).toBeGreaterThan(0)
    expect(rot).toBeLessThan(1)
  })

  it('grows as health drops but stays under one degree', () => {
    const full = hudPillWobbleRotationDeg(100)
    const low = hudPillWobbleRotationDeg(0)
    expect(low).toBeGreaterThan(full)
    expect(low).toBeLessThan(1)
  })
})

describe('hudPillWobblePeriodMs', () => {
  it('returns a stable, multi-second period so pills wobble in sync', () => {
    const period = hudPillWobblePeriodMs()
    expect(period).toBeGreaterThan(800)
    expect(period).toBeLessThan(4000)
  })
})

describe('hudGrainOpacity', () => {
  it('keeps a baseline opacity at full health so the HUD never feels glassy-clean', () => {
    expect(hudGrainOpacity(100)).toBeGreaterThan(0)
  })

  it('rises monotonically as health drops', () => {
    const a = hudGrainOpacity(100)
    const b = hudGrainOpacity(60)
    const c = hudGrainOpacity(20)
    const d = hudGrainOpacity(0)
    expect(b).toBeGreaterThanOrEqual(a)
    expect(c).toBeGreaterThan(b)
    expect(d).toBeGreaterThan(c)
  })

  it('stays inside [0, 1] for any health value', () => {
    for (let h = 0; h <= 100; h += 5) {
      const opacity = hudGrainOpacity(h)
      expect(opacity).toBeGreaterThanOrEqual(0)
      expect(opacity).toBeLessThanOrEqual(1)
    }
  })

  it('handles overflow / negative health without breaking the [0, 1] clamp', () => {
    expect(hudGrainOpacity(-25)).toBeLessThanOrEqual(1)
    expect(hudGrainOpacity(250)).toBeGreaterThanOrEqual(0)
  })
})

describe('hudSplatterIntensity', () => {
  it('returns 0 at full health', () => {
    expect(hudSplatterIntensity(100)).toBe(0)
  })

  it('returns 0 at the threshold and just above', () => {
    expect(hudSplatterIntensity(60)).toBe(0)
    expect(hudSplatterIntensity(75)).toBe(0)
  })

  it('rises as health drops below the threshold', () => {
    const just_under = hudSplatterIntensity(55)
    const half = hudSplatterIntensity(30)
    const critical = hudSplatterIntensity(5)
    expect(just_under).toBeGreaterThan(0)
    expect(half).toBeGreaterThan(just_under)
    expect(critical).toBeGreaterThan(half)
  })

  it('peaks at or below 1 at zero health', () => {
    const v = hudSplatterIntensity(0)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThanOrEqual(1)
  })
})
