import { describe, expect, it } from 'vitest'

import {
  BLOOD_DECAL_FADE_LAST_MS,
  BLOOD_DECAL_TTL_MS,
  bloodDecalAlphaScale,
  bloodDecalBaseAlphaFor,
  bloodDecalColorFor,
  bloodDecalRadiusFor,
  tickBloodDecal,
  type BloodDecalState
} from './bloodDecal'

describe('bloodDecalRadiusFor', () => {
  it('returns a positive radius per enemy type', () => {
    for (const type of ['skitter', 'grunt', 'brute', 'spitter'] as const) {
      expect(bloodDecalRadiusFor(type)).toBeGreaterThan(0)
    }
  })

  it('heavier enemies leave bigger stains', () => {
    expect(bloodDecalRadiusFor('brute')).toBeGreaterThan(bloodDecalRadiusFor('grunt'))
    expect(bloodDecalRadiusFor('grunt')).toBeGreaterThan(bloodDecalRadiusFor('skitter'))
  })

  it('every type stays under 1 m so a decal never covers more than a tile', () => {
    for (const type of ['skitter', 'grunt', 'brute', 'spitter'] as const) {
      expect(bloodDecalRadiusFor(type)).toBeLessThan(1)
    }
  })
})

describe('bloodDecalBaseAlphaFor', () => {
  it('returns a base alpha in (0, 1) per enemy type', () => {
    for (const type of ['skitter', 'grunt', 'brute', 'spitter'] as const) {
      const alpha = bloodDecalBaseAlphaFor(type)
      expect(alpha).toBeGreaterThan(0)
      expect(alpha).toBeLessThan(1)
    }
  })

  it('heavier enemies leave a stronger stain', () => {
    expect(bloodDecalBaseAlphaFor('brute')).toBeGreaterThan(bloodDecalBaseAlphaFor('skitter'))
  })
})

describe('bloodDecalColorFor', () => {
  it('returns a hex color per enemy type', () => {
    for (const type of ['skitter', 'grunt', 'brute', 'spitter'] as const) {
      expect(bloodDecalColorFor(type)).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('spitter uses ink purple, not red, so the floor reads which enemy died', () => {
    const ink = bloodDecalColorFor('spitter')
    const reds = [
      bloodDecalColorFor('skitter'),
      bloodDecalColorFor('grunt'),
      bloodDecalColorFor('brute')
    ]
    expect(reds).not.toContain(ink)
  })
})

describe('bloodDecalAlphaScale', () => {
  it('is 1 at age 0', () => {
    expect(bloodDecalAlphaScale(0)).toBe(1)
  })

  it('stays at 1 for most of the lifetime', () => {
    expect(bloodDecalAlphaScale(BLOOD_DECAL_TTL_MS - BLOOD_DECAL_FADE_LAST_MS - 1)).toBe(1)
  })

  it('starts the fade exactly at the fade window', () => {
    expect(bloodDecalAlphaScale(BLOOD_DECAL_TTL_MS - BLOOD_DECAL_FADE_LAST_MS)).toBe(1)
  })

  it('is 0.5 halfway through the fade window', () => {
    const t = BLOOD_DECAL_TTL_MS - BLOOD_DECAL_FADE_LAST_MS / 2
    expect(bloodDecalAlphaScale(t)).toBeCloseTo(0.5, 5)
  })

  it('reaches 0 at or past the TTL', () => {
    expect(bloodDecalAlphaScale(BLOOD_DECAL_TTL_MS)).toBe(0)
    expect(bloodDecalAlphaScale(BLOOD_DECAL_TTL_MS + 1000)).toBe(0)
  })

  it('clamps negative or non-finite inputs to full alpha', () => {
    expect(bloodDecalAlphaScale(-100)).toBe(1)
    expect(bloodDecalAlphaScale(Number.NaN)).toBe(1)
  })
})

describe('tickBloodDecal', () => {
  const seed = (overrides: Partial<BloodDecalState> = {}): BloodDecalState => ({
    ageMs: 0,
    radius: 0.5,
    baseAlpha: 0.6,
    ...overrides
  })

  it('ages decals by deltaMs', () => {
    const next = tickBloodDecal(seed(), 1000)
    expect(next).not.toBeNull()
    if (!next) return
    expect(next.ageMs).toBe(1000)
  })

  it('preserves radius and baseAlpha across ticks', () => {
    const start = seed({ radius: 0.7, baseAlpha: 0.75 })
    const next = tickBloodDecal(start, 500)
    expect(next).not.toBeNull()
    if (!next) return
    expect(next.radius).toBe(0.7)
    expect(next.baseAlpha).toBe(0.75)
  })

  it('returns null past the TTL so the caller can dispose the mesh', () => {
    expect(tickBloodDecal(seed({ ageMs: BLOOD_DECAL_TTL_MS - 10 }), 20)).toBeNull()
  })

  it('returns the same state for non-finite or negative deltaMs', () => {
    const start = seed()
    expect(tickBloodDecal(start, -1)).toBe(start)
    expect(tickBloodDecal(start, Number.NaN)).toBe(start)
  })
})
