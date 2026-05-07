import { describe, expect, it } from 'vitest'
import { spitterChargeIntensity } from './spitterCharge'

describe('spitterChargeIntensity', () => {
  it('is 0 outside the windup state', () => {
    expect(spitterChargeIntensity('chase', 200, 720)).toBe(0)
    expect(spitterChargeIntensity('attackRelease', 100, 720)).toBe(0)
    expect(spitterChargeIntensity('hurt', 50, 720)).toBe(0)
    expect(spitterChargeIntensity('dead', 0, 720)).toBe(0)
  })

  it('ramps from 0 to 1 across the windup', () => {
    expect(spitterChargeIntensity('attackWindup', 0, 720)).toBe(0)
    expect(spitterChargeIntensity('attackWindup', 720, 720)).toBe(1)
  })

  it('uses an ease-in curve so the brightness builds slowly', () => {
    const half = spitterChargeIntensity('attackWindup', 360, 720)
    expect(half).toBeLessThan(0.5)
    expect(half).toBeCloseTo(0.25, 5)
  })

  it('clamps when animation time exceeds the windup', () => {
    expect(spitterChargeIntensity('attackWindup', 9000, 720)).toBe(1)
  })

  it('returns 1 for a zero-length windup so the consumer never divides by zero', () => {
    expect(spitterChargeIntensity('attackWindup', 0, 0)).toBe(1)
  })
})
