import { describe, expect, it } from 'vitest'
import { hazardDamageAtPosition, hazardStatesForRunMs, roomPressureIntensity } from './hazards'

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
})
