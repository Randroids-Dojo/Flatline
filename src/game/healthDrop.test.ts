import { describe, expect, it } from 'vitest'

import {
  HEALTH_DROP_PICKUP_RADIUS_M,
  HEALTH_DROP_TABLE,
  HEALTH_DROP_TTL_MS,
  healthDropAmount,
  healthDropBobY,
  healthDropPalette,
  healthDropPickupIds,
  rollHealthDrop,
  tickHealthDrops,
  type HealthDrop
} from './healthDrop'

describe('HEALTH_DROP_TABLE', () => {
  it('sums to a low total per enemy so health stays a rare reward', () => {
    for (const type of ['skitter', 'grunt', 'brute', 'spitter'] as const) {
      const total = Object.values(HEALTH_DROP_TABLE[type]).reduce((a, b) => a + (b ?? 0), 0)
      expect(total).toBeLessThan(0.16)
      expect(total).toBeGreaterThan(0)
    }
  })

  it('only the brute drops the large medkit so big kills feel rewarding', () => {
    expect(HEALTH_DROP_TABLE.brute['medkit-large']).toBeGreaterThan(0)
    for (const type of ['skitter', 'grunt', 'spitter'] as const) {
      expect(HEALTH_DROP_TABLE[type]['medkit-large'] ?? 0).toBe(0)
    }
  })
})

describe('rollHealthDrop', () => {
  it('returns null when the rng is past every chance', () => {
    expect(rollHealthDrop('grunt', 0.999)).toBeNull()
  })

  it('routes brute kills to the large medkit at low rng', () => {
    expect(rollHealthDrop('brute', 0)).toBe('medkit-large')
  })

  it('falls through to small medkit when the rng is past the large band', () => {
    // Brute table: large 0.05, small 0.05. rng 0.06 lands inside the
    // small band (cumulative 0.1).
    expect(rollHealthDrop('brute', 0.06)).toBe('medkit-small')
  })

  it('treats non-finite or out-of-range rng as no drop', () => {
    expect(rollHealthDrop('grunt', Number.NaN)).toBeNull()
    expect(rollHealthDrop('grunt', -0.1)).toBeNull()
    expect(rollHealthDrop('grunt', 1)).toBeNull()
  })
})

describe('healthDropAmount', () => {
  it('matches the altar tier amounts so the player has one mental model', () => {
    expect(healthDropAmount('medkit-small')).toBe(10)
    expect(healthDropAmount('medkit-large')).toBe(35)
  })

  it('large heals strictly more than small', () => {
    expect(healthDropAmount('medkit-large')).toBeGreaterThan(healthDropAmount('medkit-small'))
  })
})

describe('tickHealthDrops', () => {
  const baseDrop: HealthDrop = {
    id: 'a',
    kind: 'medkit-small',
    position: { x: 0, y: 0, z: 0 },
    ageMs: 0
  }

  it('ages drops and keeps them within the TTL window', () => {
    const next = tickHealthDrops([baseDrop], 1000)
    expect(next).toHaveLength(1)
    expect(next[0].ageMs).toBe(1000)
  })

  it('drops drops past the TTL', () => {
    const next = tickHealthDrops([{ ...baseDrop, ageMs: HEALTH_DROP_TTL_MS - 50 }], 100)
    expect(next).toHaveLength(0)
  })
})

describe('healthDropPickupIds', () => {
  const drop = (id: string, x: number, z: number): HealthDrop => ({
    id,
    kind: 'medkit-small',
    position: { x, y: 0, z },
    ageMs: 0
  })

  it('returns the drop the player is overlapping', () => {
    const drops = [drop('near', 0.5, 0), drop('far', 5, 5)]
    expect(healthDropPickupIds(drops, { x: 0, z: 0 })).toEqual(['near'])
  })

  it('uses the configured pickup radius', () => {
    const just = drop('just', HEALTH_DROP_PICKUP_RADIUS_M - 0.01, 0)
    expect(healthDropPickupIds([just], { x: 0, z: 0 })).toEqual(['just'])
  })

  it('excludes drops outside the pickup radius', () => {
    const out = drop('out', HEALTH_DROP_PICKUP_RADIUS_M + 0.01, 0)
    expect(healthDropPickupIds([out], { x: 0, z: 0 })).toEqual([])
  })
})

describe('healthDropBobY', () => {
  it('starts at the resting height at age 0', () => {
    expect(healthDropBobY(0)).toBeCloseTo(0.35)
  })

  it('stays in a low-floor range so the medkit reads as heavier than an ammo box', () => {
    for (const t of [0, 100, 500, 1000, 5000]) {
      const y = healthDropBobY(t)
      expect(y).toBeGreaterThan(0.25)
      expect(y).toBeLessThan(0.5)
    }
  })
})

describe('healthDropPalette', () => {
  it('returns hex colors for body, cross, and glow', () => {
    for (const kind of ['medkit-small', 'medkit-large'] as const) {
      const palette = healthDropPalette(kind)
      expect(palette.body).toMatch(/^#[0-9a-f]{6}$/i)
      expect(palette.cross).toMatch(/^#[0-9a-f]{6}$/i)
      expect(palette.glow).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('both sizes share a cream body and red cross so the medkit silhouette reads at a glance', () => {
    // Common medkit silhouette across sizes: white body + red cross.
    const small = healthDropPalette('medkit-small')
    const large = healthDropPalette('medkit-large')
    expect(small.body).not.toBe(small.cross)
    expect(large.body).not.toBe(large.cross)
  })
})
