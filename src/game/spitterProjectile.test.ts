import { describe, expect, it } from 'vitest'

import {
  SPITTER_PROJECTILE_RADIUS_M,
  SPITTER_PROJECTILE_TTL_MS,
  createSpitterProjectile,
  spitterProjectileExpired,
  spitterProjectileHitsPlayer,
  tickSpitterProjectile
} from './spitterProjectile'

describe('createSpitterProjectile', () => {
  it('clones origin and direction so mutating callers cannot bleed into the projectile', () => {
    const origin = { x: 1, y: 1.05, z: 2 }
    const direction = { x: 0, y: 0, z: 1 }
    const projectile = createSpitterProjectile('p-1', origin, direction, 8, 8, 'spitter-source')
    origin.x = 999
    direction.z = -999
    expect(projectile.position.x).toBe(1)
    expect(projectile.direction.z).toBe(1)
  })

  it('starts with ageMs at zero', () => {
    const projectile = createSpitterProjectile('p-1', { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 8, 8, 'spitter-source')
    expect(projectile.ageMs).toBe(0)
  })
})

describe('tickSpitterProjectile', () => {
  it('advances position by speed * direction * deltaSeconds', () => {
    const projectile = createSpitterProjectile('p-1', { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 8, 8, 'spitter-source')
    const next = tickSpitterProjectile(projectile, 100)
    expect(next.position.z).toBeCloseTo(0.8, 5)
    expect(next.position.x).toBeCloseTo(0, 5)
  })

  it('preserves Y position (projectile travels in xz plane)', () => {
    const projectile = createSpitterProjectile('p-1', { x: 0, y: 1.5, z: 0 }, { x: 0, y: 0, z: 1 }, 8, 8, 'spitter-source')
    const next = tickSpitterProjectile(projectile, 250)
    expect(next.position.y).toBeCloseTo(1.5, 5)
  })

  it('accumulates ageMs across ticks', () => {
    let projectile = createSpitterProjectile('p-1', { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 8, 8, 'spitter-source')
    projectile = tickSpitterProjectile(projectile, 100)
    projectile = tickSpitterProjectile(projectile, 50)
    expect(projectile.ageMs).toBe(150)
  })

  it('returns a new projectile and does not mutate the input', () => {
    const projectile = createSpitterProjectile('p-1', { x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }, 8, 8, 'spitter-source')
    const next = tickSpitterProjectile(projectile, 100)
    expect(projectile.position.x).toBe(0)
    expect(next.position.x).toBeCloseTo(0.8, 5)
  })
})

describe('spitterProjectileExpired', () => {
  it('is false before TTL elapses', () => {
    const projectile = { ...createSpitterProjectile('p-1', { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 8, 8, 'spitter-source'), ageMs: SPITTER_PROJECTILE_TTL_MS - 1 }
    expect(spitterProjectileExpired(projectile)).toBe(false)
  })

  it('is true exactly at TTL', () => {
    const projectile = { ...createSpitterProjectile('p-1', { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 8, 8, 'spitter-source'), ageMs: SPITTER_PROJECTILE_TTL_MS }
    expect(spitterProjectileExpired(projectile)).toBe(true)
  })

  it('is true beyond TTL', () => {
    const projectile = { ...createSpitterProjectile('p-1', { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 8, 8, 'spitter-source'), ageMs: SPITTER_PROJECTILE_TTL_MS + 1000 }
    expect(spitterProjectileExpired(projectile)).toBe(true)
  })
})

describe('tickSpitterProjectile cover blocking', () => {
  it('marks the projectile blockedByCover when its path passes through a pillar rect', () => {
    // Pillar at (-3.5, -1.8) with halfW = halfL = 0.5. Fire from west
    // of the pillar moving +x straight through the center.
    const projectile = createSpitterProjectile(
      'p-cov-1',
      { x: -5, y: 1.05, z: -1.8 },
      { x: 1, y: 0, z: 0 },
      8,
      8,
      'spitter-source'
    )
    const stepped = tickSpitterProjectile(projectile, 500)
    expect(stepped.blockedByCover).toBe(true)
  })

  it('blocks a corner graze that the un-inflated rect would have missed', () => {
    // Pillar at (-3.5, -1.8) has its corner at (-3.0, -1.3). Fire a
    // projectile along z = -1.3 + (SPITTER_PROJECTILE_RADIUS_M / 2),
    // which clears the un-inflated rect by SPITTER_PROJECTILE_RADIUS_M / 2
    // but should be blocked once the rect is inflated by the projectile
    // radius.
    const grazeZ = -1.3 + SPITTER_PROJECTILE_RADIUS_M / 2
    const projectile = createSpitterProjectile(
      'p-cov-2',
      { x: -5, y: 1.05, z: grazeZ },
      { x: 1, y: 0, z: 0 },
      8,
      8,
      'spitter-source'
    )
    const stepped = tickSpitterProjectile(projectile, 500)
    expect(stepped.blockedByCover).toBe(true)
  })

  it('does not block a projectile travelling well clear of every cover rect', () => {
    // Aim down +z from origin: nothing in ARENA_COVER_RECTS sits on
    // the z axis until z = 7.6, so a short tick should clear easily.
    const projectile = createSpitterProjectile(
      'p-cov-3',
      { x: 0, y: 1.05, z: 0 },
      { x: 0, y: 0, z: 1 },
      8,
      8,
      'spitter-source'
    )
    const stepped = tickSpitterProjectile(projectile, 100)
    expect(stepped.blockedByCover).toBe(false)
  })
})

describe('spitterProjectileHitsPlayer', () => {
  it('hits when projectile is closer than projectile radius + player radius', () => {
    const projectile = createSpitterProjectile('p-1', { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 8, 8, 'spitter-source')
    const playerPos = { x: 0, y: 1.7, z: 0 }
    const playerRadius = 0.4
    expect(spitterProjectileHitsPlayer(projectile, playerPos, playerRadius)).toBe(true)
  })

  it('misses when projectile is just outside the combined radius', () => {
    const projectile = createSpitterProjectile('p-1', { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 8, 8, 'spitter-source')
    const playerPos = { x: SPITTER_PROJECTILE_RADIUS_M + 0.4 + 0.01, y: 1.7, z: 0 }
    const playerRadius = 0.4
    expect(spitterProjectileHitsPlayer(projectile, playerPos, playerRadius)).toBe(false)
  })

  it('only checks the xz plane (ignores Y separation)', () => {
    const projectile = createSpitterProjectile('p-1', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, 8, 8, 'spitter-source')
    const playerPos = { x: 0, y: 100, z: 0 }
    const playerRadius = 0.4
    expect(spitterProjectileHitsPlayer(projectile, playerPos, playerRadius)).toBe(true)
  })
})
