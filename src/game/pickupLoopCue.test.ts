import { describe, expect, it } from 'vitest'
import { pickupLoopGain, pickupLoopStyle } from './pickupLoopCue'

describe('pickupLoopStyle', () => {
  it('returns positive frequency, positive base gain, and a non-negative cooldown gain', () => {
    const style = pickupLoopStyle()
    expect(style.frequencyHz).toBeGreaterThan(0)
    expect(style.breathHz).toBeGreaterThan(0)
    expect(style.baseGain).toBeGreaterThan(0)
    expect(style.cooldownGain).toBeGreaterThanOrEqual(0)
  })

  it('keeps the breath depth below 1 so the loop never inverts to negative gain', () => {
    const style = pickupLoopStyle()
    expect(style.breathDepth).toBeGreaterThan(0)
    expect(style.breathDepth).toBeLessThan(1)
  })

  it('keeps base gain below the loudest enemy windup cue (0.038) so combat audio stays in front', () => {
    const style = pickupLoopStyle()
    expect(style.baseGain).toBeLessThan(0.038)
  })

  it('returns the same style reference across calls so a consumer can hold it stable', () => {
    expect(pickupLoopStyle()).toBe(pickupLoopStyle())
  })
})

describe('pickupLoopGain', () => {
  const style = pickupLoopStyle()

  it('returns the cooldown gain when the pickup is not ready', () => {
    expect(pickupLoopGain(style, 0, false)).toBe(style.cooldownGain)
    expect(pickupLoopGain(style, 4321, false)).toBe(style.cooldownGain)
  })

  it('breathes around the base gain when the pickup is ready', () => {
    const samples: number[] = []
    const periodMs = 1000 / style.breathHz

    for (let i = 0; i < 16; i += 1) {
      samples.push(pickupLoopGain(style, (periodMs / 16) * i, true))
    }

    const max = Math.max(...samples)
    const min = Math.min(...samples)
    expect(max).toBeGreaterThan(style.baseGain)
    expect(min).toBeLessThan(style.baseGain)
  })

  it('never returns a negative gain even at the trough of the breath', () => {
    const periodMs = 1000 / style.breathHz

    for (let i = 0; i < 32; i += 1) {
      const g = pickupLoopGain(style, (periodMs / 32) * i, true)
      expect(g).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns 0 at t = 0 only if cooldownGain is 0 and ready is false', () => {
    expect(pickupLoopGain(style, 0, false)).toBe(0)
  })

  it('caps the peak gain at base * (1 + breathDepth)', () => {
    const peak = style.baseGain * (1 + style.breathDepth)
    const periodMs = 1000 / style.breathHz

    for (let i = 0; i < 64; i += 1) {
      const g = pickupLoopGain(style, (periodMs / 64) * i, true)
      expect(g).toBeLessThanOrEqual(peak + 1e-9)
    }
  })
})
