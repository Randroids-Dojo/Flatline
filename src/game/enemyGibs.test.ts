import { describe, expect, it } from 'vitest'

import {
  GIB_FLOOR_Y,
  GIB_TTL_MS,
  gibColorFor,
  gibCountFor,
  gibInitialVelocity,
  tickGibPhysics,
  type GibState
} from './enemyGibs'

describe('gibCountFor', () => {
  it('returns a positive count per enemy type', () => {
    for (const type of ['skitter', 'grunt', 'brute', 'spitter'] as const) {
      expect(gibCountFor(type)).toBeGreaterThan(0)
    }
  })

  it('heavier enemies spray more chunks than lighter ones', () => {
    expect(gibCountFor('brute')).toBeGreaterThan(gibCountFor('skitter'))
    expect(gibCountFor('grunt')).toBeGreaterThanOrEqual(gibCountFor('skitter'))
  })

  it('every type stays under 10 so a peak-pressure kill flurry does not flood the scene', () => {
    for (const type of ['skitter', 'grunt', 'brute', 'spitter'] as const) {
      expect(gibCountFor(type)).toBeLessThanOrEqual(10)
    }
  })
})

describe('gibColorFor', () => {
  it('returns a hex color per enemy type', () => {
    for (const type of ['skitter', 'grunt', 'brute', 'spitter'] as const) {
      expect(gibColorFor(type)).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('spitter uses a distinct hue from the red family so ink kills read different', () => {
    const ink = gibColorFor('spitter')
    const red = [gibColorFor('skitter'), gibColorFor('grunt'), gibColorFor('brute')]
    expect(red).not.toContain(ink)
  })
})

describe('gibInitialVelocity', () => {
  it('returns zero vector for non-positive speed', () => {
    expect(gibInitialVelocity(0, 0)).toEqual({ x: 0, y: 0, z: 0 })
    expect(gibInitialVelocity(0, -1)).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('returns zero vector for non-finite inputs', () => {
    expect(gibInitialVelocity(Number.NaN, 5)).toEqual({ x: 0, y: 0, z: 0 })
    expect(gibInitialVelocity(0, Number.POSITIVE_INFINITY)).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('biases the initial velocity upward so gibs pop before arcing down', () => {
    const v = gibInitialVelocity(0, 4, 0.55)
    expect(v.y).toBeGreaterThan(0)
  })

  it('preserves total speed equal to the requested magnitude', () => {
    const v = gibInitialVelocity(0, 5, 0.55)
    const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    expect(mag).toBeCloseTo(5, 5)
  })

  it('different azimuths send chunks in different horizontal directions', () => {
    const east = gibInitialVelocity(0, 4)
    const north = gibInitialVelocity(Math.PI / 2, 4)
    expect(east.x).toBeCloseTo(north.z, 5)
    // East-going gib has near-zero z; north-going gib has near-zero x.
    expect(Math.abs(east.z)).toBeLessThan(0.01)
    expect(Math.abs(north.x)).toBeLessThan(0.01)
  })
})

describe('tickGibPhysics', () => {
  const seed = (overrides: Partial<GibState> = {}): GibState => ({
    position: { x: 0, y: 1.5, z: 0 },
    velocity: { x: 1, y: 2, z: 0 },
    ageMs: 0,
    settled: false,
    ...overrides
  })

  it('returns null when the gib ages past the TTL', () => {
    expect(tickGibPhysics(seed({ ageMs: GIB_TTL_MS - 1 }), 5)).toBeNull()
  })

  it('applies gravity to vy each step', () => {
    const next = tickGibPhysics(seed(), 100)
    expect(next).not.toBeNull()
    if (!next) return
    expect(next.velocity.y).toBeLessThan(2)
  })

  it('damps horizontal velocity so settled gibs do not skate', () => {
    const start = seed({ velocity: { x: 4, y: 0, z: 0 }, position: { x: 0, y: GIB_FLOOR_Y, z: 0 } })
    const next = tickGibPhysics(start, 100)
    expect(next).not.toBeNull()
    if (!next) return
    expect(Math.abs(next.velocity.x)).toBeLessThan(4)
  })

  it('floor clamps and zero-out vy on a soft landing', () => {
    // vy=-1 + 16ms of gravity gives the floor a hit with vy ~= -1.22,
    // bounce energy ~= 0.43 (below the 0.6 hop threshold) so the
    // gib settles instead of hopping.
    const start = seed({
      position: { x: 0, y: 0.05, z: 0 },
      velocity: { x: 0, y: -1, z: 0 }
    })
    const next = tickGibPhysics(start, 16)
    expect(next).not.toBeNull()
    if (!next) return
    expect(next.position.y).toBe(GIB_FLOOR_Y)
    expect(next.settled).toBe(true)
  })

  it('bounces on a strong landing instead of settling', () => {
    const start = seed({
      position: { x: 0, y: 0.05, z: 0 },
      velocity: { x: 0, y: -5, z: 0 }
    })
    const next = tickGibPhysics(start, 50)
    expect(next).not.toBeNull()
    if (!next) return
    expect(next.position.y).toBe(GIB_FLOOR_Y)
    expect(next.settled).toBe(false)
    expect(next.velocity.y).toBeGreaterThan(0)
  })

  it('settled gibs only age, no physics', () => {
    const start = seed({ settled: true, velocity: { x: 1, y: 0, z: 1 } })
    const next = tickGibPhysics(start, 50)
    expect(next).not.toBeNull()
    if (!next) return
    expect(next.position).toEqual(start.position)
    expect(next.velocity).toEqual(start.velocity)
    expect(next.ageMs).toBe(50)
  })

  it('returns the same state for non-finite or negative deltaMs', () => {
    const start = seed()
    expect(tickGibPhysics(start, -1)).toBe(start)
    expect(tickGibPhysics(start, Number.NaN)).toBe(start)
  })
})
