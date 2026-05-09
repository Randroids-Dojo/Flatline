import { ARENA_COVER_RECTS, segmentBlockedByRects } from './coverCollision'
import type { Vec3 } from './types'

export const SPITTER_PROJECTILE_RADIUS_M = 0.18
export const SPITTER_PROJECTILE_TTL_MS = 3000

const INFLATED_COVER_RECTS = ARENA_COVER_RECTS.map((rect) => ({
  x: rect.x,
  z: rect.z,
  halfW: rect.halfW + SPITTER_PROJECTILE_RADIUS_M,
  halfL: rect.halfL + SPITTER_PROJECTILE_RADIUS_M
}))

export type SpitterProjectile = {
  id: string
  position: Vec3
  direction: Vec3
  speed: number
  damage: number
  ageMs: number
  // F-016 v2: id of the spitter that fired this projectile, so a
  // crossfire splash can route an aggro retarget back to the source.
  sourceEnemyId: string
  // F-023 / REQ-021: set true when the projectile has been blocked by
  // an arena cover rect this tick. Consumers remove the projectile.
  blockedByCover: boolean
}

export function createSpitterProjectile(
  id: string,
  origin: Vec3,
  direction: Vec3,
  speed: number,
  damage: number,
  sourceEnemyId: string
): SpitterProjectile {
  return {
    id,
    position: { x: origin.x, y: origin.y, z: origin.z },
    direction: { x: direction.x, y: direction.y, z: direction.z },
    speed,
    damage,
    ageMs: 0,
    sourceEnemyId,
    blockedByCover: false
  }
}

export function tickSpitterProjectile(projectile: SpitterProjectile, deltaMs: number): SpitterProjectile {
  const dt = deltaMs / 1000

  const startX = projectile.position.x
  const startZ = projectile.position.z
  const nextX = startX + projectile.direction.x * projectile.speed * dt
  const nextZ = startZ + projectile.direction.z * projectile.speed * dt

  // F-023 / REQ-021: line-segment test against the cover rects from
  // the pre-step to post-step position. The cover rects are inflated
  // by the projectile radius so a graze that visually clips a corner
  // still reads as blocked. If a rect blocks the segment, snap the
  // projectile to the entry point and mark it for removal.
  const hit = segmentBlockedByRects(
    { x: startX, z: startZ },
    { x: nextX, z: nextZ },
    INFLATED_COVER_RECTS
  )

  if (hit !== null) {
    return {
      ...projectile,
      position: { x: hit.x, y: projectile.position.y, z: hit.z },
      ageMs: projectile.ageMs + deltaMs,
      blockedByCover: true
    }
  }

  return {
    ...projectile,
    position: {
      x: nextX,
      y: projectile.position.y,
      z: nextZ
    },
    ageMs: projectile.ageMs + deltaMs
  }
}

export function spitterProjectileExpired(projectile: SpitterProjectile): boolean {
  return projectile.ageMs >= SPITTER_PROJECTILE_TTL_MS || projectile.blockedByCover
}

export function spitterProjectileHitsPlayer(
  projectile: SpitterProjectile,
  playerPosition: Vec3,
  playerRadius: number
): boolean {
  const dx = projectile.position.x - playerPosition.x
  const dz = projectile.position.z - playerPosition.z
  const distance = Math.hypot(dx, dz)

  return distance <= SPITTER_PROJECTILE_RADIUS_M + playerRadius
}
