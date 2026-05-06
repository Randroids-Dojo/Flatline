import type { Vec3 } from './types'

export const SPITTER_PROJECTILE_RADIUS_M = 0.18
export const SPITTER_PROJECTILE_TTL_MS = 3000

export type SpitterProjectile = {
  id: string
  position: Vec3
  direction: Vec3
  speed: number
  damage: number
  ageMs: number
}

export function createSpitterProjectile(
  id: string,
  origin: Vec3,
  direction: Vec3,
  speed: number,
  damage: number
): SpitterProjectile {
  return {
    id,
    position: { x: origin.x, y: origin.y, z: origin.z },
    direction: { x: direction.x, y: direction.y, z: direction.z },
    speed,
    damage,
    ageMs: 0
  }
}

export function tickSpitterProjectile(projectile: SpitterProjectile, deltaMs: number): SpitterProjectile {
  const dt = deltaMs / 1000

  return {
    ...projectile,
    position: {
      x: projectile.position.x + projectile.direction.x * projectile.speed * dt,
      y: projectile.position.y,
      z: projectile.position.z + projectile.direction.z * projectile.speed * dt
    },
    ageMs: projectile.ageMs + deltaMs
  }
}

export function spitterProjectileExpired(projectile: SpitterProjectile): boolean {
  return projectile.ageMs >= SPITTER_PROJECTILE_TTL_MS
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
