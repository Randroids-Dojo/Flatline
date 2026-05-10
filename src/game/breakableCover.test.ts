import { describe, expect, it } from 'vitest'
import type { CoverRect } from './coverCollision'
import { BREAKABLE_CRATE_HP, collapsePelletCoverHits, renumberMapAfterSplice, spliceRectAt } from './breakableCover'

const fixtureRect = (x: number): CoverRect => ({ x, z: 0, halfW: 0.5, halfL: 0.5 })

describe('BREAKABLE_CRATE_HP', () => {
  it('is one (crates are pinatas; multi-hit comes with multi-prop)', () => {
    expect(BREAKABLE_CRATE_HP).toBe(1)
  })
})

describe('spliceRectAt', () => {
  it('returns a new rect list with the indexed rect removed', () => {
    const rects = [fixtureRect(-1), fixtureRect(0), fixtureRect(1)]
    const result = spliceRectAt(rects, 1)
    expect(result.map((r) => r.x)).toEqual([-1, 1])
  })

  it('does not mutate the input rect list', () => {
    const rects = [fixtureRect(-1), fixtureRect(0)]
    spliceRectAt(rects, 0)
    expect(rects.map((r) => r.x)).toEqual([-1, 0])
  })
})

describe('renumberMapAfterSplice', () => {
  it('drops the entry at the spliced index', () => {
    const breakables = new Map<number, string>([
      [0, 'a'],
      [1, 'b']
    ])
    const result = renumberMapAfterSplice(breakables, 0)
    expect(result.size).toBe(1)
    expect(result.get(0)).toBe('b')
  })

  it('renumbers keys above the spliced index down by one', () => {
    const breakables = new Map<number, string>([
      [1, 'b'],
      [3, 'd']
    ])
    const result = renumberMapAfterSplice(breakables, 1)
    expect(result.get(2)).toBe('d')
    expect(result.has(1)).toBe(false)
    expect(result.has(3)).toBe(false)
  })

  it('preserves keys below the spliced index unchanged', () => {
    const breakables = new Map<number, string>([
      [0, 'a'],
      [2, 'c']
    ])
    const result = renumberMapAfterSplice(breakables, 2)
    expect(result.get(0)).toBe('a')
    expect(result.has(2)).toBe(false)
  })

  it('handles an empty map without throwing', () => {
    const result = renumberMapAfterSplice(new Map<number, string>(), 0)
    expect(result.size).toBe(0)
  })

  it('does not mutate the input map', () => {
    const breakables = new Map<number, string>([[1, 'b']])
    renumberMapAfterSplice(breakables, 0)
    expect(breakables.size).toBe(1)
    expect(breakables.get(1)).toBe('b')
  })

  it('renumbers a splice at index 0 with multiple keys above it', () => {
    const breakables = new Map<number, string>([
      [1, 'b'],
      [2, 'c'],
      [3, 'd']
    ])
    const result = renumberMapAfterSplice(breakables, 0)
    expect(result.get(0)).toBe('b')
    expect(result.get(1)).toBe('c')
    expect(result.get(2)).toBe('d')
    expect(result.size).toBe(3)
  })

  it('still shifts higher keys down when the spliced index is not in the map', () => {
    const breakables = new Map<number, string>([
      [3, 'd'],
      [4, 'e']
    ])
    const result = renumberMapAfterSplice(breakables, 2)
    expect(result.get(2)).toBe('d')
    expect(result.get(3)).toBe('e')
    expect(result.size).toBe(2)
  })

  it('walks two consecutive breakable destructions correctly (both crates broken)', () => {
    // Rect layout: two pillars at indices 0..1, two crates at 2..3.
    let rects = [fixtureRect(-3.5), fixtureRect(3.5), fixtureRect(-2.1), fixtureRect(2.1)]
    let breakables = new Map<number, string>([
      [2, 'crate-west'],
      [3, 'crate-east']
    ])
    // Destroy west first.
    rects = spliceRectAt(rects, 2)
    breakables = renumberMapAfterSplice(breakables, 2)
    expect(rects.map((r) => r.x)).toEqual([-3.5, 3.5, 2.1])
    expect(breakables.get(2)).toBe('crate-east')
    // Now destroy east, which is at the new index 2.
    rects = spliceRectAt(rects, 2)
    breakables = renumberMapAfterSplice(breakables, 2)
    expect(rects.map((r) => r.x)).toEqual([-3.5, 3.5])
    expect(breakables.size).toBe(0)
  })
})

describe('collapsePelletCoverHits', () => {
  it('returns the empty list when no pellets hit cover', () => {
    expect(collapsePelletCoverHits([])).toEqual([])
  })

  it('dedups duplicate rect indices to one entry', () => {
    expect(collapsePelletCoverHits([4, 4, 4])).toEqual([4])
  })

  it('returns indices sorted highest-first so the splice cascade does not invalidate pending indices', () => {
    expect(collapsePelletCoverHits([4, 5])).toEqual([5, 4])
    expect(collapsePelletCoverHits([5, 4])).toEqual([5, 4])
  })

  it('combines dedup + sort across a six-pellet boomstick spread', () => {
    expect(collapsePelletCoverHits([4, 4, 5, 5, 4, 5])).toEqual([5, 4])
  })
})
