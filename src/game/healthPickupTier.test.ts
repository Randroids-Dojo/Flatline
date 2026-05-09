import { describe, expect, it } from 'vitest'
import {
  healthPickupAmount,
  healthPickupTier,
  LARGE_HEAL_AMOUNT,
  LARGE_HEAL_HEALTH_THRESHOLD,
  LARGE_HEAL_MIN_PRESSURE,
  LARGE_HEAL_REARM_MS,
  SMALL_HEAL_AMOUNT
} from './healthPickupTier'

describe('healthPickupTier', () => {
  const baseInput = {
    playerHealth: 30,
    pressure: 2,
    runMs: 120_000,
    lastLargeRunMs: 0
  }

  it('returns large when health is low, pressure is high, and rearm has elapsed', () => {
    expect(healthPickupTier(baseInput)).toBe('large')
  })

  it('returns small when player health is above the large-heal threshold', () => {
    expect(
      healthPickupTier({
        ...baseInput,
        playerHealth: LARGE_HEAL_HEALTH_THRESHOLD + 1
      })
    ).toBe('small')
  })

  it('returns small when pressure is below the minimum', () => {
    expect(
      healthPickupTier({
        ...baseInput,
        pressure: LARGE_HEAL_MIN_PRESSURE - 0.1
      })
    ).toBe('small')
  })

  it('returns small when the rearm window has not elapsed since the last large pickup', () => {
    expect(
      healthPickupTier({
        ...baseInput,
        runMs: 30_000,
        lastLargeRunMs: 0
      })
    ).toBe('small')
  })

  it('returns large exactly at the rearm boundary', () => {
    expect(
      healthPickupTier({
        ...baseInput,
        runMs: LARGE_HEAL_REARM_MS,
        lastLargeRunMs: 0
      })
    ).toBe('large')
  })

  it('returns large exactly at the health threshold', () => {
    expect(
      healthPickupTier({
        ...baseInput,
        playerHealth: LARGE_HEAL_HEALTH_THRESHOLD
      })
    ).toBe('large')
  })

  it('returns small for a fresh run before pressure ramps up', () => {
    expect(
      healthPickupTier({
        playerHealth: 20,
        pressure: 1.2,
        runMs: 5_000,
        lastLargeRunMs: 0
      })
    ).toBe('small')
  })
})

describe('healthPickupAmount', () => {
  it('returns the small heal value for the small tier', () => {
    expect(healthPickupAmount('small')).toBe(SMALL_HEAL_AMOUNT)
  })

  it('returns the large heal value for the large tier', () => {
    expect(healthPickupAmount('large')).toBe(LARGE_HEAL_AMOUNT)
  })

  it('matches the spec values from REQ-033', () => {
    expect(SMALL_HEAL_AMOUNT).toBe(10)
    expect(LARGE_HEAL_AMOUNT).toBe(35)
  })
})
