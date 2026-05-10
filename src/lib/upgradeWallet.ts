import {
  MAX_TIER,
  UPGRADE_STAT_IDS,
  createUpgradeTierState,
  type UpgradeStatId,
  type UpgradeTierState
} from '@/game/upgradeTree'

export type UpgradeWallet = {
  credits: number
  totalCreditsEarned: number
  tiers: UpgradeTierState
}

export const upgradeWalletStorageKey = 'flatline.upgradeWallet.v1'

export function createUpgradeWallet(): UpgradeWallet {
  return {
    credits: 0,
    totalCreditsEarned: 0,
    tiers: createUpgradeTierState()
  }
}

export function readUpgradeWallet(storage: Storage): UpgradeWallet {
  try {
    const raw = storage.getItem(upgradeWalletStorageKey)
    if (!raw) {
      return createUpgradeWallet()
    }
    const parsed = JSON.parse(raw)
    const normalized = normalizeWallet(parsed)
    return normalized ?? createUpgradeWallet()
  } catch {
    // SecurityError (private-browsing) or malformed JSON: progression
    // data is recoverable from future runs, so treat as a fresh wallet.
    return createUpgradeWallet()
  }
}

export function writeUpgradeWallet(storage: Storage, wallet: UpgradeWallet): void {
  try {
    storage.setItem(upgradeWalletStorageKey, JSON.stringify(wallet))
  } catch {
    // QuotaExceededError or SecurityError on locked-down browsers; swallow.
  }
}

export function depositKills(wallet: UpgradeWallet, kills: number): UpgradeWallet {
  const safeKills = Number.isFinite(kills) ? Math.max(0, Math.floor(kills)) : 0
  if (safeKills === 0) {
    return wallet
  }
  return {
    ...wallet,
    credits: wallet.credits + safeKills,
    totalCreditsEarned: wallet.totalCreditsEarned + safeKills
  }
}

// Validates the persisted shape and fills in defaults for any tier field
// that was missing. This is the migration seam for older wallets that
// only carried `tiers.maxHp` before this slice introduced startingAmmo,
// weaponDamage, and moveSpeed. Returning null means the payload was
// fundamentally invalid (bad credit math, bad object shape) and the
// caller should fall back to a fresh wallet.
function normalizeWallet(value: unknown): UpgradeWallet | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const wallet = value as UpgradeWallet
  if (
    !Number.isInteger(wallet.credits) ||
    wallet.credits < 0 ||
    !Number.isInteger(wallet.totalCreditsEarned) ||
    wallet.totalCreditsEarned < 0
  ) {
    return null
  }
  // Spendable balance is bounded by lifetime earnings. Any payload that
  // claims more spendable than ever earned is corrupt or tampered.
  if (wallet.credits > wallet.totalCreditsEarned) {
    return null
  }
  if (!wallet.tiers || typeof wallet.tiers !== 'object') {
    return null
  }
  const rawTiers = wallet.tiers as Partial<Record<UpgradeStatId, unknown>>
  const tiers = createUpgradeTierState()
  for (const id of UPGRADE_STAT_IDS) {
    const value = rawTiers[id]
    if (value === undefined) {
      // Missing field on a pre-extension wallet. Treat as tier 0.
      continue
    }
    if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > MAX_TIER) {
      return null
    }
    tiers[id] = value as number
  }
  return {
    credits: wallet.credits,
    totalCreditsEarned: wallet.totalCreditsEarned,
    tiers
  }
}
