import { describe, expect, it } from 'vitest'
import {
  MAX_HP_BASE,
  MAX_HP_PER_TIER,
  MAX_TIER,
  TIER_COSTS,
  canAffordNextTier,
  createUpgradeTierState,
  effectiveMaxHp,
  nextTierCost,
  purchaseTier
} from './upgradeTree'

describe('createUpgradeTierState', () => {
  it('starts with every stat at tier 0', () => {
    const state = createUpgradeTierState()
    expect(state.maxHp).toBe(0)
  })
})

describe('nextTierCost', () => {
  it('returns the next-tier cost for tiers 0..MAX_TIER-1', () => {
    for (let tier = 0; tier < MAX_TIER; tier++) {
      expect(nextTierCost(tier)).toBe(TIER_COSTS[tier])
    }
  })

  it('returns null at the cap', () => {
    expect(nextTierCost(MAX_TIER)).toBeNull()
  })

  it('clamps negative input to the tier-0 cost so a corrupt store cannot crash the UI', () => {
    expect(nextTierCost(-1)).toBe(TIER_COSTS[0])
  })
})

describe('effectiveMaxHp', () => {
  it('returns MAX_HP_BASE at tier 0', () => {
    expect(effectiveMaxHp(createUpgradeTierState())).toBe(MAX_HP_BASE)
  })

  it('adds MAX_HP_PER_TIER per purchased tier', () => {
    expect(effectiveMaxHp({ maxHp: 1 })).toBe(MAX_HP_BASE + MAX_HP_PER_TIER)
    expect(effectiveMaxHp({ maxHp: MAX_TIER })).toBe(MAX_HP_BASE + MAX_TIER * MAX_HP_PER_TIER)
  })
})

describe('canAffordNextTier', () => {
  it('is true when credits cover the next-tier cost', () => {
    expect(canAffordNextTier(TIER_COSTS[0], 0)).toBe(true)
    expect(canAffordNextTier(TIER_COSTS[0] + 1, 0)).toBe(true)
  })

  it('is false when credits fall short', () => {
    expect(canAffordNextTier(TIER_COSTS[0] - 1, 0)).toBe(false)
  })

  it('is false at the cap regardless of credits', () => {
    expect(canAffordNextTier(Number.MAX_SAFE_INTEGER, MAX_TIER)).toBe(false)
  })
})

describe('purchaseTier', () => {
  it('returns the new tier state and remaining credits on success', () => {
    const result = purchaseTier(createUpgradeTierState(), 10, 'maxHp')
    expect(result).not.toBeNull()
    expect(result?.tiers.maxHp).toBe(1)
    expect(result?.creditsRemaining).toBe(10 - TIER_COSTS[0])
  })

  it('returns null when the wallet cannot afford the next tier', () => {
    const result = purchaseTier(createUpgradeTierState(), TIER_COSTS[0] - 1, 'maxHp')
    expect(result).toBeNull()
  })

  it('returns null at the cap', () => {
    const capped = { maxHp: MAX_TIER }
    const result = purchaseTier(capped, Number.MAX_SAFE_INTEGER, 'maxHp')
    expect(result).toBeNull()
  })

  it('does not mutate the input state', () => {
    const state = createUpgradeTierState()
    purchaseTier(state, 100, 'maxHp')
    expect(state.maxHp).toBe(0)
  })

  it('walks the full tier ladder with the documented geometric ramp', () => {
    let tiers = createUpgradeTierState()
    let credits = TIER_COSTS.reduce((sum, cost) => sum + cost, 0)
    for (let step = 0; step < MAX_TIER; step++) {
      const result = purchaseTier(tiers, credits, 'maxHp')
      expect(result).not.toBeNull()
      tiers = result!.tiers
      credits = result!.creditsRemaining
    }
    expect(tiers.maxHp).toBe(MAX_TIER)
    expect(credits).toBe(0)
    expect(purchaseTier(tiers, credits, 'maxHp')).toBeNull()
  })
})
