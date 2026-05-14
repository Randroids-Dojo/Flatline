import { describe, expect, it } from 'vitest'
import {
  CENTER_SURGE_PRESSURE_THRESHOLD,
  HAZARD_MIN_CYCLE_SCALE,
  hazardClockRate,
  hazardCycleScale,
  hazardDamageAtPosition,
  hazardStatesForRunMs,
  roomPressureIntensity
} from './hazards'

describe('hazards', () => {
  it('starts with a flame lane warning before activation', () => {
    expect(hazardStatesForRunMs(0).find((hazard) => hazard.kind === 'flameLane')?.phase).toBe('warning')
    expect(hazardStatesForRunMs(2300).find((hazard) => hazard.kind === 'flameLane')?.phase).toBe('active')
  })

  it('damages only inside active hazard shapes', () => {
    const hazards = hazardStatesForRunMs(2300)

    expect(hazardDamageAtPosition({ x: 0, y: 1.7, z: 0 }, hazards)).toBe(10)
    expect(hazardDamageAtPosition({ x: 4, y: 1.7, z: 0 }, hazards)).toBe(0)
  })

  it('ramps room pressure intensity over time', () => {
    expect(roomPressureIntensity(0)).toBe(0)
    expect(roomPressureIntensity(90000)).toBeCloseTo(0.5)
    expect(roomPressureIntensity(999999)).toBe(1)
  })

  it('keeps the center surge idle until late room pressure', () => {
    expect(hazardStatesForRunMs(0, CENTER_SURGE_PRESSURE_THRESHOLD - 0.01)
      .find((hazard) => hazard.kind === 'centerSurge')?.phase).toBe('idle')
  })

  it('warns and activates the center surge once late room pressure is reached', () => {
    const warning = hazardStatesForRunMs(13000, CENTER_SURGE_PRESSURE_THRESHOLD)
      .find((hazard) => hazard.kind === 'centerSurge')
    const active = hazardStatesForRunMs(15100, CENTER_SURGE_PRESSURE_THRESHOLD)
      .find((hazard) => hazard.kind === 'centerSurge')

    expect(warning?.phase).toBe('warning')
    expect(active?.phase).toBe('active')
  })

  it('damages the center only while the center surge is active', () => {
    const inactive = hazardStatesForRunMs(15100, CENTER_SURGE_PRESSURE_THRESHOLD - 0.01)
    const active = hazardStatesForRunMs(15100, CENTER_SURGE_PRESSURE_THRESHOLD)

    expect(hazardDamageAtPosition({ x: 0, y: 1.7, z: 0 }, inactive)).toBe(0)
    expect(hazardDamageAtPosition({ x: 0, y: 1.7, z: 0 }, active)).toBe(8)
    expect(hazardDamageAtPosition({ x: 2, y: 1.7, z: 0 }, active)).toBe(0)
  })
})

describe('hazardCycleScale', () => {
  it('runs at baseline at pressure 0 so early-run cycles match the legacy timing', () => {
    expect(hazardCycleScale(0)).toBe(1)
  })

  it('compresses to the floor at peak pressure', () => {
    expect(hazardCycleScale(1)).toBe(HAZARD_MIN_CYCLE_SCALE)
  })

  it('interpolates linearly between baseline and floor', () => {
    expect(hazardCycleScale(0.5)).toBeCloseTo(1 + (HAZARD_MIN_CYCLE_SCALE - 1) * 0.5)
  })

  it('clamps non-finite and negative pressures to baseline', () => {
    expect(hazardCycleScale(Number.NaN)).toBe(1)
    expect(hazardCycleScale(-1)).toBe(1)
  })

  it('clamps pressures above 1 to the floor', () => {
    expect(hazardCycleScale(3)).toBe(HAZARD_MIN_CYCLE_SCALE)
  })

  it('floor is well below baseline so the player feels the compression', () => {
    expect(HAZARD_MIN_CYCLE_SCALE).toBeLessThan(0.75)
    expect(HAZARD_MIN_CYCLE_SCALE).toBeGreaterThan(0.4)
  })
})

describe('hazardClockRate', () => {
  it('runs at real time at pressure 0', () => {
    expect(hazardClockRate(0)).toBe(1)
  })

  it('advances faster at peak pressure', () => {
    expect(hazardClockRate(1)).toBeCloseTo(1 / HAZARD_MIN_CYCLE_SCALE)
  })

  it('is the multiplicative inverse of hazardCycleScale', () => {
    for (const pressure of [0, 0.25, 0.5, 0.75, 1]) {
      expect(hazardClockRate(pressure) * hazardCycleScale(pressure)).toBeCloseTo(1)
    }
  })

  it('rises monotonically with pressure', () => {
    const samples = [0, 0.25, 0.5, 0.75, 1].map(hazardClockRate)
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1])
    }
  })
})
