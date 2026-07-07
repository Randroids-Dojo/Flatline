import { describe, expect, it } from 'vitest'
import { hashCoords, hashString, mulberry32, rngInt, rollDice } from './rng'

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(1234)
    const b = mulberry32(1234)
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b())
    }
  })

  it('stays in [0, 1)', () => {
    const rng = mulberry32(99)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('hashCoords', () => {
  it('differs for different coordinates and matches for equal ones', () => {
    expect(hashCoords(7, 1, 2)).toBe(hashCoords(7, 1, 2))
    expect(hashCoords(7, 1, 2)).not.toBe(hashCoords(7, 2, 1))
    expect(hashCoords(7, -1, 0)).not.toBe(hashCoords(7, 1, 0))
  })
})

describe('hashString', () => {
  it('is stable', () => {
    expect(hashString('flatline')).toBe(hashString('flatline'))
    expect(hashString('a')).not.toBe(hashString('b'))
  })
})

describe('rngInt and rollDice', () => {
  it('respects bounds', () => {
    const rng = mulberry32(5)
    for (let i = 0; i < 500; i++) {
      const v = rngInt(rng, 2, 5)
      expect(v).toBeGreaterThanOrEqual(2)
      expect(v).toBeLessThanOrEqual(5)
    }
  })

  it('rolls doom dice in the documented range', () => {
    const rng = mulberry32(6)
    for (let i = 0; i < 500; i++) {
      // Pistol: 5*(1d3) = 5..15
      const v = rollDice(rng, 1, 3, 5)
      expect(v).toBeGreaterThanOrEqual(5)
      expect(v).toBeLessThanOrEqual(15)
      expect(v % 5).toBe(0)
    }
  })
})
