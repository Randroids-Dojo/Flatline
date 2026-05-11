import { describe, expect, it } from 'vitest'

import {
  PILLAR_BOB_AMPLITUDE_M,
  PILLAR_BOB_HZ,
  PILLAR_BOB_PRESSURE_THRESHOLD,
  pillarBobAmplitudeScale,
  pillarBobOffsetMeters
} from './pillarBob'

describe('pillarBobAmplitudeScale', () => {
  it('is silent below the threshold so early-run pillars stay static', () => {
    expect(pillarBobAmplitudeScale(0)).toBe(0)
    expect(pillarBobAmplitudeScale(PILLAR_BOB_PRESSURE_THRESHOLD - 0.01)).toBe(0)
    expect(pillarBobAmplitudeScale(PILLAR_BOB_PRESSURE_THRESHOLD)).toBe(0)
  })

  it('ramps linearly between the threshold and 1', () => {
    const halfway = (PILLAR_BOB_PRESSURE_THRESHOLD + 1) / 2
    expect(pillarBobAmplitudeScale(halfway)).toBeCloseTo(0.5)
  })

  it('reaches full amplitude at pressure 1', () => {
    expect(pillarBobAmplitudeScale(1)).toBe(1)
    expect(pillarBobAmplitudeScale(3)).toBe(1)
  })

  it('clamps non-finite inputs', () => {
    expect(pillarBobAmplitudeScale(Number.NaN)).toBe(0)
  })
})

describe('pillarBobOffsetMeters', () => {
  it('returns zero below the threshold', () => {
    expect(pillarBobOffsetMeters(0, 0)).toBe(0)
    expect(pillarBobOffsetMeters(500, PILLAR_BOB_PRESSURE_THRESHOLD)).toBe(0)
  })

  it('returns zero at t=0 with no phase offset because sin(0) is zero', () => {
    expect(pillarBobOffsetMeters(0, 1)).toBeCloseTo(0)
  })

  it('reaches +amplitude one quarter into the cycle at peak pressure', () => {
    const periodMs = 1000 / PILLAR_BOB_HZ
    expect(pillarBobOffsetMeters(periodMs / 4, 1)).toBeCloseTo(PILLAR_BOB_AMPLITUDE_M)
  })

  it('reaches -amplitude three quarters into the cycle at peak pressure', () => {
    const periodMs = 1000 / PILLAR_BOB_HZ
    expect(pillarBobOffsetMeters((3 * periodMs) / 4, 1)).toBeCloseTo(-PILLAR_BOB_AMPLITUDE_M)
  })

  it('respects phase offsets so different pillars bob out of sync', () => {
    const offsetA = pillarBobOffsetMeters(0, 1, 0)
    const offsetB = pillarBobOffsetMeters(0, 1, Math.PI / 2)
    expect(offsetA).toBeCloseTo(0)
    expect(offsetB).toBeCloseTo(PILLAR_BOB_AMPLITUDE_M)
  })

  it('amplitude scales with pressure', () => {
    const periodMs = 1000 / PILLAR_BOB_HZ
    const peak = pillarBobOffsetMeters(periodMs / 4, 1)
    const halfway = pillarBobOffsetMeters(periodMs / 4, (PILLAR_BOB_PRESSURE_THRESHOLD + 1) / 2)
    expect(halfway).toBeLessThan(peak)
    expect(halfway).toBeGreaterThan(0)
  })

  it('amplitude is small enough that the pillar never lifts off the floor at peak', () => {
    expect(PILLAR_BOB_AMPLITUDE_M).toBeLessThan(0.3)
  })

  it('bob frequency is in a slow "breathing" range', () => {
    expect(PILLAR_BOB_HZ).toBeGreaterThan(0.2)
    expect(PILLAR_BOB_HZ).toBeLessThan(1.5)
  })
})
