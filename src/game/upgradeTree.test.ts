import { describe, expect, it } from 'vitest'
import {
  MAX_HP_BASE,
  MAX_HP_PER_TIER,
  MAX_TIER,
  MOVE_SPEED_PER_TIER,
  STARTING_AMMO_PER_TIER,
  TIER_COSTS,
  UPGRADE_STAT_IDS,
  WEAPON_DAMAGE_PER_TIER,
  canAffordNextTier,
  createUpgradeTierState,
  effectiveDamageMultiplier,
  effectiveMaxAmmoBonus,
  effectiveMaxHp,
  effectiveMoveSpeedMultiplier,
  nextTierCost,
  purchaseTier
} from './upgradeTree'

describe('createUpgradeTierState', () => {
  it('starts with every stat at tier 0', () => {
    const state = createUpgradeTierState()
    expect(state.maxHp).toBe(0)
    expect(state.startingAmmo).toBe(0)
    expect(state.weaponDamage).toBe(0)
    expect(state.moveSpeed).toBe(0)
  })
})

describe('UPGRADE_STAT_IDS', () => {
  it('lists every stat key on the tier state, in render order', () => {
    expect([...UPGRADE_STAT_IDS]).toEqual(['maxHp', 'startingAmmo', 'weaponDamage', 'moveSpeed'])
    const state = createUpgradeTierState()
    for (const id of UPGRADE_STAT_IDS) {
      expect(typeof state[id]).toBe('number')
    }
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
    expect(effectiveMaxHp({ ...createUpgradeTierState(), maxHp: 1 })).toBe(MAX_HP_BASE + MAX_HP_PER_TIER)
    expect(effectiveMaxHp({ ...createUpgradeTierState(), maxHp: MAX_TIER })).toBe(MAX_HP_BASE + MAX_TIER * MAX_HP_PER_TIER)
  })
})

describe('effectiveMaxAmmoBonus', () => {
  it('returns 0 at tier 0', () => {
    expect(effectiveMaxAmmoBonus(createUpgradeTierState())).toBe(0)
  })

  it('adds STARTING_AMMO_PER_TIER per purchased tier', () => {
    expect(effectiveMaxAmmoBonus({ ...createUpgradeTierState(), startingAmmo: 3 })).toBe(3 * STARTING_AMMO_PER_TIER)
    expect(effectiveMaxAmmoBonus({ ...createUpgradeTierState(), startingAmmo: MAX_TIER })).toBe(MAX_TIER * STARTING_AMMO_PER_TIER)
  })
})

describe('effectiveDamageMultiplier', () => {
  it('returns 1 at tier 0 (no buff)', () => {
    expect(effectiveDamageMultiplier(createUpgradeTierState())).toBe(1)
  })

  it('returns 1 + WEAPON_DAMAGE_PER_TIER * tier', () => {
    const tier3 = { ...createUpgradeTierState(), weaponDamage: 3 }
    expect(effectiveDamageMultiplier(tier3)).toBeCloseTo(1 + 3 * WEAPON_DAMAGE_PER_TIER, 10)
  })

  it('caps cleanly at MAX_TIER (1.5x at +10%/tier x 5 tiers)', () => {
    const tierMax = { ...createUpgradeTierState(), weaponDamage: MAX_TIER }
    expect(effectiveDamageMultiplier(tierMax)).toBeCloseTo(1 + MAX_TIER * WEAPON_DAMAGE_PER_TIER, 10)
  })
})

describe('effectiveMoveSpeedMultiplier', () => {
  it('returns 1 at tier 0', () => {
    expect(effectiveMoveSpeedMultiplier(createUpgradeTierState())).toBe(1)
  })

  it('returns 1 + MOVE_SPEED_PER_TIER * tier', () => {
    const tier2 = { ...createUpgradeTierState(), moveSpeed: 2 }
    expect(effectiveMoveSpeedMultiplier(tier2)).toBeCloseTo(1 + 2 * MOVE_SPEED_PER_TIER, 10)
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
    const capped = { ...createUpgradeTierState(), maxHp: MAX_TIER }
    const result = purchaseTier(capped, Number.MAX_SAFE_INTEGER, 'maxHp')
    expect(result).toBeNull()
  })

  it('does not mutate the input state', () => {
    const state = createUpgradeTierState()
    purchaseTier(state, 100, 'maxHp')
    expect(state.maxHp).toBe(0)
  })

  it('walks the full tier ladder for any stat with the documented geometric ramp', () => {
    for (const stat of UPGRADE_STAT_IDS) {
      let tiers = createUpgradeTierState()
      let credits = TIER_COSTS.reduce((sum, cost) => sum + cost, 0)
      for (let step = 0; step < MAX_TIER; step++) {
        const result = purchaseTier(tiers, credits, stat)
        expect(result).not.toBeNull()
        tiers = result!.tiers
        credits = result!.creditsRemaining
      }
      expect(tiers[stat]).toBe(MAX_TIER)
      expect(credits).toBe(0)
      expect(purchaseTier(tiers, credits, stat)).toBeNull()
    }
  })

  it('only mutates the targeted stat', () => {
    const result = purchaseTier(createUpgradeTierState(), TIER_COSTS[0], 'weaponDamage')
    expect(result?.tiers.weaponDamage).toBe(1)
    expect(result?.tiers.maxHp).toBe(0)
    expect(result?.tiers.startingAmmo).toBe(0)
    expect(result?.tiers.moveSpeed).toBe(0)
  })
})
