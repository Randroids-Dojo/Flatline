import { describe, expect, it } from 'vitest'
import {
  DOOR_SMOKE_DRIFT_M,
  DOOR_SMOKE_FADE_LAST_MS,
  DOOR_SMOKE_RISE_M,
  DOOR_SMOKE_TTL_MS,
  doorSmokeAlphaScale,
  doorSmokeDirectionFor,
  doorSmokePosition,
  doorSmokeProgress,
  doorSmokeScale,
  tickDoorSmoke,
  type DoorSmokeState
} from './doorSmoke'

const baseState: DoorSmokeState = {
  ageMs: 0,
  origin: { x: 1, y: 0.7, z: 2 },
  direction: { x: 0, y: 0, z: -1 },
  lateral: { x: 0.2, y: 0.1, z: 0 },
  size: 0.5
}

describe('door smoke directions', () => {
  it('points each cardinal door inward toward the room', () => {
    expect(doorSmokeDirectionFor('north')).toEqual({ x: 0, y: 0, z: -1 })
    expect(doorSmokeDirectionFor('south')).toEqual({ x: 0, y: 0, z: 1 })
    expect(doorSmokeDirectionFor('east')).toEqual({ x: -1, y: 0, z: 0 })
    expect(doorSmokeDirectionFor('west')).toEqual({ x: 1, y: 0, z: 0 })
  })

  it('returns a zero vector for unknown door ids', () => {
    expect(doorSmokeDirectionFor('ceiling')).toEqual({ x: 0, y: 0, z: 0 })
  })
})

describe('door smoke lifecycle', () => {
  it('keeps full alpha until the fade window begins', () => {
    const fadeStart = DOOR_SMOKE_TTL_MS - DOOR_SMOKE_FADE_LAST_MS
    expect(doorSmokeAlphaScale(0)).toBe(1)
    expect(doorSmokeAlphaScale(fadeStart - 1)).toBe(1)
  })

  it('fades linearly across the final window', () => {
    const halfway = DOOR_SMOKE_TTL_MS - DOOR_SMOKE_FADE_LAST_MS / 2
    expect(doorSmokeAlphaScale(halfway)).toBeCloseTo(0.5, 5)
    expect(doorSmokeAlphaScale(DOOR_SMOKE_TTL_MS)).toBe(0)
  })

  it('advances age immutably and expires at the ttl', () => {
    const next = tickDoorSmoke(baseState, 100)
    expect(next).toEqual({ ...baseState, ageMs: 100 })
    expect(baseState.ageMs).toBe(0)
    expect(tickDoorSmoke(baseState, DOOR_SMOKE_TTL_MS)).toBeNull()
  })

  it('ignores invalid deltas', () => {
    expect(tickDoorSmoke(baseState, -1)).toBe(baseState)
    expect(tickDoorSmoke(baseState, Number.NaN)).toBe(baseState)
  })
})

describe('door smoke transform helpers', () => {
  it('clamps progress between zero and one', () => {
    expect(doorSmokeProgress(-50)).toBe(0)
    expect(doorSmokeProgress(DOOR_SMOKE_TTL_MS * 2)).toBe(1)
  })

  it('drifts inward and rises over its lifetime', () => {
    const state = { ...baseState, ageMs: DOOR_SMOKE_TTL_MS / 2 }
    const position = doorSmokePosition(state)

    expect(position.x).toBeCloseTo(baseState.origin.x + baseState.lateral.x, 5)
    expect(position.y).toBeCloseTo(baseState.origin.y + baseState.lateral.y + DOOR_SMOKE_RISE_M / 2, 5)
    expect(position.z).toBeCloseTo(baseState.origin.z - DOOR_SMOKE_DRIFT_M / 2, 5)
  })

  it('expands from the starting size', () => {
    expect(doorSmokeScale({ ...baseState, ageMs: 0 })).toBeCloseTo(0.5, 5)
    expect(doorSmokeScale({ ...baseState, ageMs: DOOR_SMOKE_TTL_MS })).toBeGreaterThan(0.5)
  })
})
