// Pure tier definitions for the meta-progression system.
//
// PR A scopes the tree to a single stat (max HP) so the wallet, accrual,
// run-start hook, and spend UI can ship as one vertical slice. PR B will
// extend `UpgradeStatId`, `UpgradeTierState`, and the effective-value
// helpers with starting ammo, weapon damage, and move speed.

export type UpgradeStatId = 'maxHp'

export type UpgradeTierState = {
  [K in UpgradeStatId]: number
}

export const MAX_TIER = 5

// Geometric ramp (x2 per tier). Index i is the cost to move from tier i to
// tier i + 1, so a fresh wallet (tier 0) pays TIER_COSTS[0] = 5 to reach
// tier 1, then 10 to reach tier 2, and so on.
export const TIER_COSTS: ReadonlyArray<number> = [5, 10, 20, 40, 80] as const

export const MAX_HP_BASE = 100
export const MAX_HP_PER_TIER = 10

export function createUpgradeTierState(): UpgradeTierState {
  return { maxHp: 0 }
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
