// Grid DDA raycast, used for hitscan weapons and enemy line of sight.

import { CELL_M } from './dungeon'
import type { SolidAt } from './collision'
import type { Vec2 } from './types'

export type RayHit = {
  distance: number
  gx: number
  gz: number
  // Which face was struck, for wall-impact puffs.
  side: 'x' | 'z'
  point: Vec2
}

// March a ray through the cell grid until it hits a solid cell or exceeds
// maxDistance. Angle follows the game convention: 0 faces +z, measured
// clockwise toward +x (matches atan2(dx, dz)).
export function castRay(solidAt: SolidAt, origin: Vec2, angle: number, maxDistance: number): RayHit | null {
  const dirX = Math.sin(angle)
  const dirZ = Math.cos(angle)

  let gx = Math.floor(origin.x / CELL_M)
  let gz = Math.floor(origin.z / CELL_M)

  const stepGx = dirX > 0 ? 1 : -1
  const stepGz = dirZ > 0 ? 1 : -1

  const deltaX = dirX === 0 ? Infinity : Math.abs(CELL_M / dirX)
  const deltaZ = dirZ === 0 ? Infinity : Math.abs(CELL_M / dirZ)

  let tMaxX =
    dirX === 0
      ? Infinity
      : (dirX > 0 ? (gx + 1) * CELL_M - origin.x : origin.x - gx * CELL_M) / Math.abs(dirX)
  let tMaxZ =
    dirZ === 0
      ? Infinity
      : (dirZ > 0 ? (gz + 1) * CELL_M - origin.z : origin.z - gz * CELL_M) / Math.abs(dirZ)

  let distance = 0
  let side: 'x' | 'z' = 'x'

  while (distance <= maxDistance) {
    if (tMaxX < tMaxZ) {
      distance = tMaxX
      tMaxX += deltaX
      gx += stepGx
      side = 'x'
    } else {
      distance = tMaxZ
      tMaxZ += deltaZ
      gz += stepGz
      side = 'z'
    }
    if (distance > maxDistance) {
      return null
    }
    if (solidAt(gx, gz)) {
      return {
        distance,
        gx,
        gz,
        side,
        point: { x: origin.x + dirX * distance, z: origin.z + dirZ * distance }
      }
    }
  }
  return null
}

export function hasLineOfSight(solidAt: SolidAt, from: Vec2, to: Vec2): boolean {
  const distance = Math.hypot(to.x - from.x, to.z - from.z)
  if (distance < 0.001) {
    return true
  }
  const angle = Math.atan2(to.x - from.x, to.z - from.z)
  const hit = castRay(solidAt, from, angle, distance)
  return hit === null
}

// Distance from a point to a ray, used to pick which billboard a shot hits.
// Returns null when the target is behind the origin.
export function rayPointDistance(origin: Vec2, angle: number, target: Vec2): { along: number; lateral: number } | null {
  const dirX = Math.sin(angle)
  const dirZ = Math.cos(angle)
  const relX = target.x - origin.x
  const relZ = target.z - origin.z
  const along = relX * dirX + relZ * dirZ
  if (along <= 0) {
    return null
  }
  const lateral = Math.abs(relX * dirZ - relZ * dirX)
  return { along, lateral }
}
