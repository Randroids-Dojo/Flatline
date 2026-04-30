import { describe, expect, it } from 'vitest'
import { updatePlayerPosition } from './movement'

const config = {
  speed: 6,
  bounds: {
    minX: -8,
    maxX: 8,
    minZ: -8,
    maxZ: 8
  }
}

describe('updatePlayerPosition', () => {
  it('moves forward relative to yaw', () => {
    const next = updatePlayerPosition(
      { x: 0, y: 1.7, z: 0 },
      0,
      { forward: true, backward: false, left: false, right: false },
      0.5,
      config
    )

    expect(next.x).toBeCloseTo(0)
    expect(next.z).toBeCloseTo(-3)
    expect(next.y).toBe(1.7)
  })

  it('moves backward opposite the camera forward vector', () => {
    const next = updatePlayerPosition(
      { x: 0, y: 1.7, z: 0 },
      0,
      { forward: false, backward: true, left: false, right: false },
      0.5,
      config
    )

    expect(next.x).toBeCloseTo(0)
    expect(next.z).toBeCloseTo(3)
  })

  it('normalizes diagonal movement speed', () => {
    const next = updatePlayerPosition(
      { x: 0, y: 1.7, z: 0 },
      0,
      { forward: true, backward: false, left: false, right: true },
      1,
      config
    )

    expect(Math.hypot(next.x, next.z)).toBeCloseTo(6)
  })

  it('clamps the player inside room bounds', () => {
    const next = updatePlayerPosition(
      { x: -7.9, y: 1.7, z: 7.9 },
      Math.PI,
      { forward: true, backward: false, left: false, right: true },
      1,
      config
    )

    expect(next.x).toBe(-8)
    expect(next.z).toBe(8)
  })
})
