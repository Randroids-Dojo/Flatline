import { describe, expect, it } from 'vitest'
import {
  pickupBounceY,
  pickupGlowIntensity,
  pickupHaloOpacity,
  pickupHaloScale
} from './pickupReadability'

describe('pickupBounceY', () => {
  it('returns 0 at the start of a cycle', () => {
    expect(pickupBounceY(0, true)).toBeCloseTo(0, 5)
    expect(pickupBounceY(0, false)).toBeCloseTo(0, 5)
  })

  it('oscillates around 0 across a cycle', () => {
    const samples: number[] = []
    for (let t = 0; t < 4400; t += 50) {
      samples.push(pickupBounceY(t, true))
    }
    const max = Math.max(...samples)
    const min = Math.min(...samples)
    expect(max).toBeGreaterThan(0)
    expect(min).toBeLessThan(0)
    expect(max).toBeCloseTo(-min, 1)
  })

  it('uses a smaller amplitude on cooldown than when ready', () => {
    let readyMax = 0
    let cooldownMax = 0
    for (let t = 0; t < 4400; t += 25) {
      readyMax = Math.max(readyMax, Math.abs(pickupBounceY(t, true)))
      cooldownMax = Math.max(cooldownMax, Math.abs(pickupBounceY(t, false)))
    }
    expect(cooldownMax).toBeLessThan(readyMax)
  })

  it('keeps bounce amplitude small enough to not look like teleporting', () => {
    for (let t = 0; t < 5000; t += 30) {
      expect(Math.abs(pickupBounceY(t, true))).toBeLessThanOrEqual(0.12)
    }
  })
})

describe('pickupGlowIntensity', () => {
  it('stays inside [0, 1] for any positive elapsed time', () => {
    for (let t = 0; t < 6000; t += 17) {
      const ready = pickupGlowIntensity(t, true)
      const cooldown = pickupGlowIntensity(t, false)
      expect(ready).toBeGreaterThanOrEqual(0)
      expect(ready).toBeLessThanOrEqual(1)
      expect(cooldown).toBeGreaterThanOrEqual(0)
      expect(cooldown).toBeLessThanOrEqual(1)
    }
  })

  it('is brighter when ready than when on cooldown', () => {
    let readyMax = -Infinity
    let cooldownMax = -Infinity
    for (let t = 0; t < 4400; t += 17) {
      readyMax = Math.max(readyMax, pickupGlowIntensity(t, true))
      cooldownMax = Math.max(cooldownMax, pickupGlowIntensity(t, false))
    }
    expect(readyMax).toBeGreaterThan(cooldownMax)
  })

  it('breathes between a baseline and a peak rather than blinking', () => {
    let min = Infinity
    let max = -Infinity
    for (let t = 0; t < 2200; t += 17) {
      const v = pickupGlowIntensity(t, true)
      min = Math.min(min, v)
      max = Math.max(max, v)
    }
    expect(max - min).toBeGreaterThan(0.2)
    expect(min).toBeGreaterThan(0)
  })
})

describe('pickupHaloScale', () => {
  it('sweeps outward across the cycle', () => {
    const start = pickupHaloScale(0)
    const middle = pickupHaloScale(700)
    const end = pickupHaloScale(1399)
    expect(middle).toBeGreaterThan(start)
    expect(end).toBeGreaterThan(middle)
  })

  it('resets at the cycle boundary', () => {
    expect(pickupHaloScale(0)).toBeCloseTo(pickupHaloScale(1400), 5)
  })

  it('stays >= 1 (never shrinks below the source ring)', () => {
    for (let t = 0; t < 5000; t += 23) {
      expect(pickupHaloScale(t)).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('pickupHaloOpacity', () => {
  it('fades from peak to 0 across the cycle', () => {
    const start = pickupHaloOpacity(0, true)
    const end = pickupHaloOpacity(1399, true)
    expect(start).toBeGreaterThan(end)
    expect(end).toBeGreaterThanOrEqual(0)
  })

  it('peaks lower on cooldown than when ready', () => {
    expect(pickupHaloOpacity(0, false)).toBeLessThan(pickupHaloOpacity(0, true))
  })

  it('stays inside [0, 1] across many samples', () => {
    for (let t = 0; t < 6000; t += 17) {
      const v = pickupHaloOpacity(t, true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})
