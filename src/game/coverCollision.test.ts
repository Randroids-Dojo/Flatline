import { describe, expect, it } from 'vitest'
import {
  ARENA_COVER_RECTS,
  clampOutsideRects,
  segmentBlockedByRects,
  type CoverRect
} from './coverCollision'

describe('clampOutsideRects', () => {
  const rect: CoverRect = { x: 0, z: 0, halfW: 1, halfL: 1 }
  const rects: CoverRect[] = [rect]

  it('returns input unchanged when far from all rects', () => {
    const result = clampOutsideRects(5, 5, 0.4, rects)
    expect(result).toEqual({ x: 5, z: 5 })
  })

  it('pushes a point on the +x side of a rect to rect.x + halfW + radius', () => {
    const result = clampOutsideRects(1.2, 0, 0.4, rects)
    expect(result.x).toBeCloseTo(1.4)
    expect(result.z).toBeCloseTo(0)
  })

  it('pushes a point on the -x side to rect.x - halfW - radius', () => {
    const result = clampOutsideRects(-1.2, 0, 0.4, rects)
    expect(result.x).toBeCloseTo(-1.4)
    expect(result.z).toBeCloseTo(0)
  })

  it('pushes a point on the +z side to rect.z + halfL + radius', () => {
    const result = clampOutsideRects(0, 1.2, 0.4, rects)
    expect(result.x).toBeCloseTo(0)
    expect(result.z).toBeCloseTo(1.4)
  })

  it('pushes a corner overlap to the shortest-axis edge', () => {
    // Point at (1.3, 1.0). x-overlap = 1.4 - 1.3 = 0.1. z-overlap = 1.4 - 1.0 = 0.4.
    // Shortest push is along x.
    const result = clampOutsideRects(1.3, 1.0, 0.4, rects)
    expect(result.x).toBeCloseTo(1.4)
    expect(result.z).toBeCloseTo(1.0)
  })

  it('regression: a player that previously walked through pillar [-3.5, -1.8] now clamps to the rect edge', () => {
    // Pillar rect is { x: -3.5, z: -1.8, halfW: 0.5, halfL: 0.5 }.
    // Walking straight at the pillar from the south at x = -3.5, z = -1.0
    // would have intersected the pillar at z = -1.3 without collision.
    const result = clampOutsideRects(-3.5, -1.0, 0.4, ARENA_COVER_RECTS)
    // halfL + radius = 0.9; expected z is -1.8 + 0.9 = -0.9.
    expect(result.x).toBeCloseTo(-3.5)
    expect(result.z).toBeCloseTo(-0.9)
  })
})

describe('segmentBlockedByRects', () => {
  const rect: CoverRect = { x: 0, z: 0, halfW: 1, halfL: 1 }
  const rects: CoverRect[] = [rect]

  it('returns null for a clear segment that does not touch any rect', () => {
    const result = segmentBlockedByRects({ x: -5, z: 5 }, { x: 5, z: 5 }, rects)
    expect(result).toBeNull()
  })

  it('returns the entry point and the index of the only rect for a segment that crosses it from the left', () => {
    const result = segmentBlockedByRects({ x: -2, z: 0 }, { x: 2, z: 0 }, rects)
    expect(result).not.toBeNull()
    expect(result!.x).toBeCloseTo(-1)
    expect(result!.z).toBeCloseTo(0)
    expect(result!.rectIndex).toBe(0)
  })

  it('picks the closest of multiple overlapping rect hits and reports its index', () => {
    const a: CoverRect = { x: 5, z: 0, halfW: 0.5, halfL: 0.5 }
    const b: CoverRect = { x: 2, z: 0, halfW: 0.5, halfL: 0.5 }
    const result = segmentBlockedByRects({ x: 0, z: 0 }, { x: 10, z: 0 }, [a, b])
    expect(result).not.toBeNull()
    expect(result!.x).toBeCloseTo(1.5)
    expect(result!.rectIndex).toBe(1)
  })

  it('returns null for a segment that ends before reaching the rect', () => {
    const result = segmentBlockedByRects({ x: -2, z: 0 }, { x: -1.5, z: 0 }, rects)
    expect(result).toBeNull()
  })

  it('reports the new index when a rect is spliced out of the list mid-run', () => {
    const a: CoverRect = { x: 5, z: 0, halfW: 0.5, halfL: 0.5 }
    const b: CoverRect = { x: 2, z: 0, halfW: 0.5, halfL: 0.5 }
    const list = [a, b]
    expect(segmentBlockedByRects({ x: 0, z: 0 }, { x: 10, z: 0 }, list)?.rectIndex).toBe(1)
    list.splice(1, 1)
    // After splicing b, the only remaining rect (a) is now at index 0
    // and the segment hits it instead.
    const after = segmentBlockedByRects({ x: 0, z: 0 }, { x: 10, z: 0 }, list)
    expect(after).not.toBeNull()
    expect(after!.x).toBeCloseTo(4.5)
    expect(after!.rectIndex).toBe(0)
  })
})
