import { describe, expect, it } from 'vitest'

import {
  AMMO_DROP_PICKUP_RADIUS_M,
  AMMO_DROP_TABLE,
  AMMO_DROP_TTL_MS,
  ammoDropBobY,
  ammoDropBoomstickAmount,
  ammoDropInkblasterAmount,
  ammoDropPalette,
  ammoDropPickupIds,
  rollAmmoDrop,
  tickAmmoDrops,
  type AmmoDrop
} from './ammoDrop'

describe('AMMO_DROP_TABLE', () => {
  it('sums to less than 1 for every enemy type so most kills still drop nothing', () => {
    for (const enemyType of ['skitter', 'grunt', 'brute', 'spitter'] as const) {
      const total = Object.values(AMMO_DROP_TABLE[enemyType]).reduce((a, b) => a + (b ?? 0), 0)
      expect(total).toBeLessThan(1)
      expect(total).toBeGreaterThan(0)
    }
  })

  it('routes shotgun-leaning grunts and brutes toward shells, ranged spitters toward cells', () => {
    expect(AMMO_DROP_TABLE.grunt['cell-small'] ?? 0).toBe(0)
    expect((AMMO_DROP_TABLE.spitter['cell-small'] ?? 0)).toBeGreaterThan(0)
    expect((AMMO_DROP_TABLE.spitter['shell-small'] ?? 0)).toBe(0)
  })
})

describe('rollAmmoDrop', () => {
  it('returns null when the rng is past every chance', () => {
    expect(rollAmmoDrop('grunt', 0.999)).toBeNull()
  })

  it('returns a kind when the rng falls inside the drop window', () => {
    // Brute total chance is 0.18 + 0.2 + 0.05 = 0.43; rng 0.0 lands
    // on the first ordered kind (shell-large in our reverse order).
    expect(rollAmmoDrop('brute', 0)).toBe('shell-large')
  })

  it('routes spitter kills to cells', () => {
    // Spitter table: cell-small 0.28, cell-large 0.07. rng < 0.07
    // lands on cell-large; 0.07 to 0.35 lands on cell-small.
    expect(rollAmmoDrop('spitter', 0)).toBe('cell-large')
    expect(rollAmmoDrop('spitter', 0.2)).toBe('cell-small')
    expect(rollAmmoDrop('spitter', 0.5)).toBeNull()
  })

  it('treats non-finite or out-of-range rng as no drop', () => {
    expect(rollAmmoDrop('grunt', Number.NaN)).toBeNull()
    expect(rollAmmoDrop('grunt', -0.1)).toBeNull()
    expect(rollAmmoDrop('grunt', 1)).toBeNull()
  })
})

describe('ammoDropBoomstickAmount / ammoDropInkblasterAmount', () => {
  it('shells grant boomstick rounds and zero cells', () => {
    expect(ammoDropBoomstickAmount('shell-small')).toBe(1)
    expect(ammoDropBoomstickAmount('shell-large')).toBe(3)
    expect(ammoDropInkblasterAmount('shell-small')).toBe(0)
    expect(ammoDropInkblasterAmount('shell-large')).toBe(0)
  })

  it('cells grant inkblaster rounds and zero shells', () => {
    expect(ammoDropInkblasterAmount('cell-small')).toBe(1)
    expect(ammoDropInkblasterAmount('cell-large')).toBe(2)
    expect(ammoDropBoomstickAmount('cell-small')).toBe(0)
    expect(ammoDropBoomstickAmount('cell-large')).toBe(0)
  })

  it('large drops grant strictly more than small ones for the same family', () => {
    expect(ammoDropBoomstickAmount('shell-large')).toBeGreaterThan(ammoDropBoomstickAmount('shell-small'))
    expect(ammoDropInkblasterAmount('cell-large')).toBeGreaterThan(ammoDropInkblasterAmount('cell-small'))
  })
})

describe('tickAmmoDrops', () => {
  const baseDrop: AmmoDrop = {
    id: 'a',
    kind: 'shell-small',
    position: { x: 0, y: 0, z: 0 },
    ageMs: 0
  }

  it('ages drops by deltaMs and keeps them within the TTL window', () => {
    const next = tickAmmoDrops([baseDrop], 1000)
    expect(next).toHaveLength(1)
    expect(next[0].ageMs).toBe(1000)
  })

  it('drops drops that hit the TTL', () => {
    const next = tickAmmoDrops([{ ...baseDrop, ageMs: AMMO_DROP_TTL_MS - 50 }], 100)
    expect(next).toHaveLength(0)
  })

  it('preserves multiple drops independently', () => {
    const a: AmmoDrop = { ...baseDrop, id: 'a', ageMs: 100 }
    const b: AmmoDrop = { ...baseDrop, id: 'b', ageMs: AMMO_DROP_TTL_MS - 10 }
    const next = tickAmmoDrops([a, b], 50)
    expect(next.map((d) => d.id)).toEqual(['a'])
  })
})

describe('ammoDropPickupIds', () => {
  const drop = (id: string, x: number, z: number): AmmoDrop => ({
    id,
    kind: 'shell-small',
    position: { x, y: 0, z },
    ageMs: 0
  })

  it('returns the drop the player is overlapping', () => {
    const drops = [drop('near', 0.5, 0), drop('far', 5, 5)]
    expect(ammoDropPickupIds(drops, { x: 0, z: 0 })).toEqual(['near'])
  })

  it('uses a configurable pickup radius', () => {
    const just = drop('just', AMMO_DROP_PICKUP_RADIUS_M - 0.01, 0)
    expect(ammoDropPickupIds([just], { x: 0, z: 0 })).toEqual(['just'])
  })

  it('excludes drops outside the pickup radius', () => {
    const out = drop('out', AMMO_DROP_PICKUP_RADIUS_M + 0.01, 0)
    expect(ammoDropPickupIds([out], { x: 0, z: 0 })).toEqual([])
  })
})

describe('ammoDropBobY', () => {
  it('starts at the resting height at age 0', () => {
    expect(ammoDropBobY(0)).toBeCloseTo(0.45)
  })

  it('oscillates above and below the resting height', () => {
    const samples = [0, 100, 200, 300, 400].map(ammoDropBobY)
    const max = Math.max(...samples)
    const min = Math.min(...samples)
    expect(max).toBeGreaterThan(0.45)
    expect(min).toBeLessThan(0.55)
  })

  it('stays in a low-floor range so the pickup never floats higher than a doorknob', () => {
    for (const t of [0, 100, 200, 300, 1000, 5000]) {
      const y = ammoDropBobY(t)
      expect(y).toBeGreaterThan(0.3)
      expect(y).toBeLessThan(0.7)
    }
  })
})

describe('ammoDropPalette', () => {
  it('returns hex colors for body, accent, and glow', () => {
    for (const kind of ['shell-small', 'shell-large', 'cell-small', 'cell-large'] as const) {
      const palette = ammoDropPalette(kind)
      expect(palette.body).toMatch(/^#[0-9a-f]{6}$/i)
      expect(palette.accent).toMatch(/^#[0-9a-f]{6}$/i)
      expect(palette.glow).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('shells share a warm glow, cells share a cool glow', () => {
    expect(ammoDropPalette('shell-small').glow).toBe(ammoDropPalette('shell-large').glow)
    expect(ammoDropPalette('cell-small').glow).toBe(ammoDropPalette('cell-large').glow)
    expect(ammoDropPalette('shell-small').glow).not.toBe(ammoDropPalette('cell-small').glow)
  })
})
