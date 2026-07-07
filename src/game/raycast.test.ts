import { describe, expect, it } from 'vitest'
import { castRay, hasLineOfSight, rayPointDistance } from './raycast'
import type { SolidAt } from './collision'

// Solid wall filling grid column gx === 5 (world x in [10, 12]).
const wallColumn: SolidAt = (gx) => gx === 5

describe('castRay', () => {
  it('hits a wall at the expected distance', () => {
    // Fire along +x from (5, 5): wall face at x = 10, so distance 5.
    const hit = castRay(wallColumn, { x: 5, z: 5 }, Math.PI / 2, 50)
    expect(hit).not.toBeNull()
    expect(hit?.distance).toBeCloseTo(5, 1)
    expect(hit?.gx).toBe(5)
    expect(hit?.side).toBe('x')
  })

  it('returns null when nothing is in range', () => {
    const hit = castRay(wallColumn, { x: 5, z: 5 }, Math.PI / 2, 3)
    expect(hit).toBeNull()
  })

  it('misses when firing away from the wall', () => {
    const hit = castRay(wallColumn, { x: 5, z: 5 }, -Math.PI / 2, 8)
    expect(hit).toBeNull()
  })
})

describe('hasLineOfSight', () => {
  it('is blocked through walls and clear otherwise', () => {
    expect(hasLineOfSight(wallColumn, { x: 5, z: 5 }, { x: 15, z: 5 })).toBe(false)
    expect(hasLineOfSight(wallColumn, { x: 5, z: 5 }, { x: 8, z: 9 })).toBe(true)
  })
})

describe('rayPointDistance', () => {
  it('measures lateral distance to targets ahead', () => {
    const r = rayPointDistance({ x: 0, z: 0 }, 0, { x: 1, z: 10 })
    expect(r).not.toBeNull()
    expect(r?.along).toBeCloseTo(10)
    expect(r?.lateral).toBeCloseTo(1)
  })

  it('rejects targets behind the origin', () => {
    expect(rayPointDistance({ x: 0, z: 0 }, 0, { x: 0, z: -3 })).toBeNull()
  })
})
