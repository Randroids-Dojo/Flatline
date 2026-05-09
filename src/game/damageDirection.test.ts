import { describe, expect, it } from 'vitest'
import { damageDirectionRadians, damageIndicatorSeverity } from './damageDirection'

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

describe('damageIndicatorSeverity', () => {
  it('returns low for skitter / spitter / hazard-tick range damage', () => {
    expect(damageIndicatorSeverity(6)).toBe('low')
    expect(damageIndicatorSeverity(8)).toBe('low')
    expect(damageIndicatorSeverity(1)).toBe('low')
  })

  it('returns medium for grunt-range damage', () => {
    expect(damageIndicatorSeverity(9)).toBe('medium')
    expect(damageIndicatorSeverity(10)).toBe('medium')
    expect(damageIndicatorSeverity(14)).toBe('medium')
  })

  it('returns high for brute-range and above', () => {
    expect(damageIndicatorSeverity(15)).toBe('high')
    expect(damageIndicatorSeverity(18)).toBe('high')
    expect(damageIndicatorSeverity(50)).toBe('high')
  })

  it('falls back to low for non-positive or non-finite damage', () => {
    expect(damageIndicatorSeverity(0)).toBe('low')
    expect(damageIndicatorSeverity(-5)).toBe('low')
    expect(damageIndicatorSeverity(Number.NaN)).toBe('low')
    expect(damageIndicatorSeverity(Number.POSITIVE_INFINITY)).toBe('low')
  })
})
