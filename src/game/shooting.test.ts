import { describe, expect, it } from 'vitest'
import { fireHitscan, forwardFromYawPitch } from './shooting'

describe('fireHitscan', () => {
  it('returns the closest target on the ray', () => {
    const hit = fireHitscan(
      { x: 0, y: 1.7, z: 0 },
      { x: 0, y: 0, z: 1 },
      [
        { id: 'far', center: { x: 0, y: 1.7, z: 8 }, radius: 0.5 },
        { id: 'near', center: { x: 0, y: 1.7, z: 4 }, radius: 0.5 }
      ],
      12
    )

    expect(hit).toEqual({ targetId: 'near', distance: 3.5 })
  })

  it('misses targets outside the sphere radius', () => {
    const hit = fireHitscan(
      { x: 0, y: 1.7, z: 0 },
      { x: 0, y: 0, z: 1 },
      [{ id: 'dummy', center: { x: 2, y: 1.7, z: 4 }, radius: 0.5 }],
      12
    )

    expect(hit).toBeNull()
  })
})

describe('forwardFromYawPitch', () => {
  it('builds the expected forward vector from yaw and pitch', () => {
    const forward = forwardFromYawPitch(0, 0)

    expect(forward.x).toBeCloseTo(0)
    expect(forward.y).toBeCloseTo(0)
    expect(forward.z).toBeCloseTo(-1)
  })

  it('matches the starting arena facing toward positive z', () => {
    const forward = forwardFromYawPitch(Math.PI, 0)

    expect(forward.x).toBeCloseTo(0)
    expect(forward.y).toBeCloseTo(0)
    expect(forward.z).toBeCloseTo(1)
  })
})
