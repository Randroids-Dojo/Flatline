// Pure tier definitions for the meta-progression system.
//
// All four stats from the GDD spec ship in this slice. Each stat has 5
// tiers, each tier doubles the previous cost (5, 10, 20, 40, 80 credits).
// Effects per tier:
//   - maxHp:        +10 HP on top of the 100 base.
//   - startingAmmo: +1 to both Boomstick and Inkblaster max ammo (boosts
//                   both the run-start refill and the supply pickup cap).
//   - weaponDamage: +10% additive damage multiplier.
//   - moveSpeed:    +4% additive move speed multiplier.

export type UpgradeStatId = 'maxHp' | 'startingAmmo' | 'weaponDamage' | 'moveSpeed'

export type UpgradeTierState = {
  [K in UpgradeStatId]: number
}

export const UPGRADE_STAT_IDS: ReadonlyArray<UpgradeStatId> = [
  'maxHp',
  'startingAmmo',
  'weaponDamage',
  'moveSpeed'
]

export const MAX_TIER = 5

// Geometric ramp (x2 per tier). Index i is the cost to move from tier i to
// tier i + 1, so a fresh wallet (tier 0) pays TIER_COSTS[0] = 5 to reach
// tier 1, then 10 to reach tier 2, and so on.
export const TIER_COSTS: ReadonlyArray<number> = [5, 10, 20, 40, 80] as const

export const MAX_HP_BASE = 100
export const MAX_HP_PER_TIER = 10
export const STARTING_AMMO_PER_TIER = 1
export const WEAPON_DAMAGE_PER_TIER = 0.1
export const MOVE_SPEED_PER_TIER = 0.04

export function createUpgradeTierState(): UpgradeTierState {
  return { maxHp: 0, startingAmmo: 0, weaponDamage: 0, moveSpeed: 0 }
}

export function nextTierCost(currentTier: number): number | null {
  if (currentTier >= MAX_TIER) {
    return null
  }
  if (currentTier < 0) {
    return TIER_COSTS[0]
  }
  return TIER_COSTS[currentTier]
}

export function effectiveMaxHp(state: UpgradeTierState): number {
  return MAX_HP_BASE + state.maxHp * MAX_HP_PER_TIER
}

export function effectiveMaxAmmoBonus(state: UpgradeTierState): number {
  return state.startingAmmo * STARTING_AMMO_PER_TIER
}

export function effectiveDamageMultiplier(state: UpgradeTierState): number {
  return 1 + state.weaponDamage * WEAPON_DAMAGE_PER_TIER
}

export function effectiveMoveSpeedMultiplier(state: UpgradeTierState): number {
  return 1 + state.moveSpeed * MOVE_SPEED_PER_TIER
}

export function canAffordNextTier(credits: number, currentTier: number): boolean {
  const cost = nextTierCost(currentTier)
  return cost !== null && credits >= cost
}

export type PurchaseResult = {
  tiers: UpgradeTierState
  creditsRemaining: number
}

export function purchaseTier(
  tiers: UpgradeTierState,
  credits: number,
  stat: UpgradeStatId
): PurchaseResult | null {
  const currentTier = tiers[stat]
  const cost = nextTierCost(currentTier)
  if (cost === null || credits < cost) {
    return null
  }
  return {
    tiers: { ...tiers, [stat]: currentTier + 1 },
    creditsRemaining: credits - cost
  }
}
