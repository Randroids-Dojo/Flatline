import { describe, expect, it } from 'vitest'
import { circleFits, moveWithSliding, type SolidAt } from './collision'

// A single solid cell at grid (5, 5): world box x [10,12], z [10,12].
const oneWall: SolidAt = (gx, gz) => gx === 5 && gz === 5

describe('circleFits', () => {
  it('rejects positions overlapping a solid cell', () => {
    expect(circleFits(oneWall, 11, 11, 0.4)).toBe(false)
    expect(circleFits(oneWall, 9.8, 11, 0.4)).toBe(false)
  })

  it('accepts positions clear of walls', () => {
    expect(circleFits(oneWall, 9.5, 11, 0.4)).toBe(true)
    expect(circleFits(oneWall, 11, 13, 0.4)).toBe(true)
  })
})

describe('moveWithSliding', () => {
  it('moves freely in open space', () => {
    const end = moveWithSliding(() => false, { x: 0, z: 0 }, 1, 1, 0.4)
    expect(end.x).toBeCloseTo(1)
    expect(end.z).toBeCloseTo(1)
  })

  it('slides along a wall instead of sticking', () => {
    // Moving diagonally into the wall face: x blocked, z free.
    const end = moveWithSliding(oneWall, { x: 9.5, z: 10.5 }, 0.5, 0.5, 0.4)
    expect(end.x).toBeLessThan(9.7)
    expect(end.z).toBeCloseTo(11, 0)
  })

  it('does not tunnel through walls at high speed', () => {
    const end = moveWithSliding(oneWall, { x: 9, z: 11 }, 6, 0, 0.4)
    expect(end.x).toBeLessThan(10)
  })
})
