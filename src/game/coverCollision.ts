// F-023 / REQ-021. Axis-aligned collision rectangles for the four
// arena pillars and the four ground-level cover billboards. The fifth
// cover billboard (the hanging banner at y=2.4) is intentionally
// excluded because it sits above head height and the player + enemies
// walk under it.
//
// Pillar coordinates mirror the cylinder placements in `createRoom()`
// (`src/components/FlatlineGame.tsx`). Cover billboard coordinates and
// orientations mirror the `coverInstances` list in the same function.
// Sizes are picked so the collision box reads slightly smaller than
// the visible silhouette, which keeps movement from snagging on a hair
// of clearance the player expects to slip through.

export type CoverRect = {
  x: number
  z: number
  halfW: number
  halfL: number
}

export const ARENA_COVER_RECTS: readonly CoverRect[] = [
  // Pillars: cylinders of radius 0.45 at the four positions wired in
  // `createRoom()`. halfW = halfL = 0.5 so the AABB sits flush with
  // the cylinder bound plus a small skin.
  { x: -3.5, z: -1.8, halfW: 0.5, halfL: 0.5 },
  { x: 3.5, z: -1.8, halfW: 0.5, halfL: 0.5 },
  { x: -3.5, z: 2.1, halfW: 0.5, halfL: 0.5 },
  { x: 3.5, z: 2.1, halfW: 0.5, halfL: 0.5 },
  // Crates flanking the south doors. Wide front (halfW = 0.6),
  // thin slab in z (halfL = 0.3).
  { x: -2.1, z: 7.6, halfW: 0.6, halfL: 0.3 },
  { x: 2.1, z: 7.6, halfW: 0.6, halfL: 0.3 },
  // Partition by the west pillar pair.
  { x: -3.5, z: 0.15, halfW: 0.45, halfL: 0.2 },
  // Broken-wall fragment by the east pillar pair.
  { x: 3.5, z: 0.15, halfW: 0.8, halfL: 0.3 },
  // REQ-059 moving cover element. The rect is the *seed* position
  // (start of the east-west sweep at the west endpoint); FlatlineGame
  // overwrites this entry every frame from `movingCoverRectAt` so the
  // collision rect tracks the visual mesh.
  { x: -3.5, z: 4, halfW: 0.5, halfL: 0.2 }
]

// Push the (x, z) point out of every rect that overlaps a circle of
// the supplied radius. For each overlap we resolve along the shortest
// axis (the side the point is already closest to). Iteration is
// linear; the rect list is small (single digits), so the cost is
// negligible per tick.
export function clampOutsideRects(
  x: number,
  z: number,
  radius: number,
  rects: readonly CoverRect[]
): { x: number; z: number } {
  let nx = x
  let nz = z

  for (const rect of rects) {
    const minX = rect.x - rect.halfW - radius
    const maxX = rect.x + rect.halfW + radius
    const minZ = rect.z - rect.halfL - radius
    const maxZ = rect.z + rect.halfL + radius

    if (nx <= minX || nx >= maxX || nz <= minZ || nz >= maxZ) {
      continue
    }

    const pushRight = maxX - nx
    const pushLeft = nx - minX
    const pushUp = maxZ - nz
    const pushDown = nz - minZ

    const minPush = Math.min(pushRight, pushLeft, pushUp, pushDown)

    if (minPush === pushRight) {
      nx = maxX
    } else if (minPush === pushLeft) {
      nx = minX
    } else if (minPush === pushUp) {
      nz = maxZ
    } else {
      nz = minZ
    }
  }

  return { x: nx, z: nz }
}

// Slab-test a 2D segment against an axis-aligned rect. Returns the t
// (0..1) of the entry point if the segment hits, else null.
function segmentRectEntryT(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  rect: CoverRect
): number | null {
  const dx = x1 - x0
  const dz = z1 - z0

  const minX = rect.x - rect.halfW
  const maxX = rect.x + rect.halfW
  const minZ = rect.z - rect.halfL
  const maxZ = rect.z + rect.halfL

  let tMin = 0
  let tMax = 1

  if (dx === 0) {
    if (x0 < minX || x0 > maxX) {
      return null
    }
  } else {
    const tx1 = (minX - x0) / dx
    const tx2 = (maxX - x0) / dx
    const tEnter = Math.min(tx1, tx2)
    const tExit = Math.max(tx1, tx2)
    if (tEnter > tMin) tMin = tEnter
    if (tExit < tMax) tMax = tExit
    if (tMin > tMax) return null
  }

  if (dz === 0) {
    if (z0 < minZ || z0 > maxZ) {
      return null
    }
  } else {
    const tz1 = (minZ - z0) / dz
    const tz2 = (maxZ - z0) / dz
    const tEnter = Math.min(tz1, tz2)
    const tExit = Math.max(tz1, tz2)
    if (tEnter > tMin) tMin = tEnter
    if (tExit < tMax) tMax = tExit
    if (tMin > tMax) return null
  }

  if (tMin < 0 || tMin > 1) {
    return null
  }

  return tMin
}

// `rectIndex` is the position in the supplied `rects` array on this
// call. Splicing the list invalidates the index for the next call;
// breakable callers must act on the rect in the same tick.
export function segmentBlockedByRects(
  start: { x: number; z: number },
  end: { x: number; z: number },
  rects: readonly CoverRect[]
): { x: number; z: number; rectIndex: number } | null {
  let bestT: number | null = null
  let bestIndex = -1

  for (let i = 0; i < rects.length; i++) {
    const t = segmentRectEntryT(start.x, start.z, end.x, end.z, rects[i])
    if (t === null) {
      continue
    }
    if (bestT === null || t < bestT) {
      bestT = t
      bestIndex = i
    }
  }

  if (bestT === null) {
    return null
  }

  return {
    x: start.x + (end.x - start.x) * bestT,
    z: start.z + (end.z - start.z) * bestT,
    rectIndex: bestIndex
  }
}
