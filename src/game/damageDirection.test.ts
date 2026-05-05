import { describe, expect, it } from 'vitest'
import { damageDirectionRadians } from './damageDirection'

const player = { x: 0, y: 1.7, z: 0 }

describe('damageDirectionRadians', () => {
  it('returns 0 when the source is directly ahead of the player', () => {
    // yaw 0 looks toward -z; place the source ahead of the player there.
    const angle = damageDirectionRadians(0, { x: 0, y: 1, z: -4 }, player)
    expect(angle).toBeCloseTo(0)
  })

  it('returns +PI/2 when the source is to the players right', () => {
    // At yaw 0, right is -x.
    const angle = damageDirectionRadians(0, { x: -3, y: 1, z: 0 }, player)
    expect(angle).toBeCloseTo(Math.PI / 2)
  })

  it('returns -PI/2 when the source is to the players left', () => {
    // At yaw 0, left is +x.
    const angle = damageDirectionRadians(0, { x: 3, y: 1, z: 0 }, player)
    expect(angle).toBeCloseTo(-Math.PI / 2)
  })

  it('returns +-PI when the source is directly behind', () => {
    const angle = damageDirectionRadians(0, { x: 0, y: 1, z: 4 }, player)
    expect(Math.abs(angle)).toBeCloseTo(Math.PI)
  })

  it('matches the arena starting yaw of PI looking down +z', () => {
    // Player initially faces +z (yaw PI). Source ahead there should read 0.
    const angle = damageDirectionRadians(Math.PI, { x: 0, y: 1, z: 5 }, player)
    expect(angle).toBeCloseTo(0)
  })

  it('reports +PI/4 for a source to the front-right diagonal', () => {
    // Forward at yaw 0 is -z; right at yaw 0 is -x. Front-right is (-1, 0, -1).
    const angle = damageDirectionRadians(0, { x: -2, y: 1, z: -2 }, player)
    expect(angle).toBeCloseTo(Math.PI / 4)
  })

  it('returns 0 when the source and player share the same xz position', () => {
    const angle = damageDirectionRadians(Math.PI / 3, { x: 0, y: 1, z: 0 }, player)
    expect(angle).toBe(0)
  })
})
