// REQ-059 breakable cover. Renumbering after a splice keeps the API
// in a single rectIndex namespace (no parallel id system) at the cost
// of a Map rebuild per destruction; crate count is two, so the cost
// is irrelevant.

import type { CoverRect } from './coverCollision'

export const BREAKABLE_CRATE_HP = 1

// Score awarded for destroying a breakable crate. Sized as a fraction
// of the base enemy kill score (100) so smashing a crate feels like a
// satisfying environment punch without competing with enemy kills as
// a scoring strategy.
export const CRATE_DESTRUCTION_SCORE = 25

export function spliceRectAt(rects: ReadonlyArray<CoverRect>, index: number): CoverRect[] {
  const next = [...rects]
  next.splice(index, 1)
  return next
}

export function renumberMapAfterSplice<T>(
  map: ReadonlyMap<number, T>,
  splicedIndex: number
): Map<number, T> {
  const next = new Map<number, T>()
  for (const [key, value] of map) {
    if (key < splicedIndex) {
      next.set(key, value)
    } else if (key === splicedIndex) {
      continue
    } else {
      next.set(key - 1, value)
    }
  }
  return next
}

// Collapse multi-pellet rect hits to one tick per rect, sorted highest
// index first. The high-to-low order matters because the caller splices
// each rect after damaging it, and a low-to-high order would invalidate
// any higher index still pending in the same shot.
export function collapsePelletCoverHits(indices: ReadonlyArray<number>): number[] {
  return Array.from(new Set(indices)).sort((a, b) => b - a)
}
