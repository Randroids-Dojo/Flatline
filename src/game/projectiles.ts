// Shared projectile simulation for player rockets/rays and enemy shots.
// Cartoon rule from the art bible: projectiles are always visible objects.

import type { SolidAt } from './collision'
import { splashDamage } from './combat'
import { dist, type Vec2 } from './types'

export type ProjectileKind = 'tnt' | 'ray' | 'bigcheese' | 'knife' | 'ember'

export type Projectile = {
  id: number
  kind: ProjectileKind
  pos: Vec2
  angle: number
  speedM: number
  radiusM: number
  damage: number
  splash?: { maxDamage: number; radiusM: number }
  fromPlayer: boolean
  // Enemy that fired it, for infighting attribution.
  shooterId: number | null
  ageSec: number
}

let nextProjectileId = 1

export function createProjectile(
  kind: ProjectileKind,
  pos: Vec2,
  angle: number,
  speedM: number,
  radiusM: number,
  damage: number,
  fromPlayer: boolean,
  shooterId: number | null = null,
  splash?: { maxDamage: number; radiusM: number }
): Projectile {
  return { id: nextProjectileId++, kind, pos: { ...pos }, angle, speedM, radiusM, damage, splash, fromPlayer, shooterId, ageSec: 0 }
}

export type ProjectileTarget = { id: number; pos: Vec2; radiusM: number }

export type ProjectileHit =
  | { type: 'wall'; pos: Vec2 }
  | { type: 'target'; targetId: number; pos: Vec2 }
  | { type: 'expired' }

// Advance one projectile. Returns a hit description or null while in flight.
export function tickProjectile(
  projectile: Projectile,
  dt: number,
  solidAt: SolidAt,
  targets: ProjectileTarget[]
): ProjectileHit | null {
  projectile.ageSec += dt
  if (projectile.ageSec > 8) {
    return { type: 'expired' }
  }

  const distance = projectile.speedM * dt
  const steps = Math.max(1, Math.ceil(distance / 0.5))
  const stepX = (Math.sin(projectile.angle) * distance) / steps
  const stepZ = (Math.cos(projectile.angle) * distance) / steps

  for (let i = 0; i < steps; i++) {
    projectile.pos.x += stepX
    projectile.pos.z += stepZ

    const gx = Math.floor(projectile.pos.x / 2)
    const gz = Math.floor(projectile.pos.z / 2)
    if (solidAt(gx, gz)) {
      return { type: 'wall', pos: { ...projectile.pos } }
    }
    for (const target of targets) {
      if (dist(projectile.pos, target.pos) < projectile.radiusM + target.radiusM) {
        return { type: 'target', targetId: target.id, pos: { ...projectile.pos } }
      }
    }
  }
  return null
}

export type SplashResult = { targetId: number | 'player'; damage: number }

export function resolveSplash(
  center: Vec2,
  splash: { maxDamage: number; radiusM: number },
  targets: Array<{ id: number | 'player'; pos: Vec2 }>
): SplashResult[] {
  const results: SplashResult[] = []
  for (const target of targets) {
    const damage = splashDamage(splash.maxDamage, splash.radiusM, dist(center, target.pos))
    if (damage > 0) {
      results.push({ targetId: target.id, damage })
    }
  }
  return results
}
