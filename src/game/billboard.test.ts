import { describe, expect, it } from 'vitest'
import { angleNameForBucket, angleToPlayerName, angleToBucket, normalizeRadians } from './billboard'

describe('billboard angle buckets', () => {
  it('normalizes radians into a positive turn', () => {
    expect(normalizeRadians(-Math.PI / 2)).toBeCloseTo((Math.PI * 3) / 2)
  })

  it('maps relative angles to the expected 8-way bucket names', () => {
    expect(angleNameForBucket(angleToBucket(0))).toBe('front')
    expect(angleNameForBucket(angleToBucket(Math.PI / 2))).toBe('right')
    expect(angleNameForBucket(angleToBucket(Math.PI))).toBe('back')
    expect(angleNameForBucket(angleToBucket(-Math.PI / 2))).toBe('left')
  })

  it('selects the sprite angle from enemy facing and player position', () => {
    expect(
      angleToPlayerName(
        { x: 0, y: 0, z: 0 },
        0,
        { x: 1, y: 0, z: 0 }
      )
    ).toBe('front')
    expect(
      angleToPlayerName(
        { x: 0, y: 0, z: 0 },
        0,
        { x: 0, y: 0, z: 1 }
      )
    ).toBe('right')
  })
})
