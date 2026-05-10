import { MAX_TIER, createUpgradeTierState, type UpgradeTierState } from '@/game/upgradeTree'

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
    return isUpgradeWallet(parsed) ? parsed : createUpgradeWallet()
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

function isUpgradeWallet(value: unknown): value is UpgradeWallet {
  if (!value || typeof value !== 'object') {
    return false
  }
  const wallet = value as UpgradeWallet
  if (
    !Number.isInteger(wallet.credits) ||
    wallet.credits < 0 ||
    !Number.isInteger(wallet.totalCreditsEarned) ||
    wallet.totalCreditsEarned < 0
  ) {
    return false
  }
  // Spendable balance is bounded by lifetime earnings. Any payload that
  // claims more spendable than ever earned is corrupt or tampered.
  if (wallet.credits > wallet.totalCreditsEarned) {
    return false
  }
  if (!wallet.tiers || typeof wallet.tiers !== 'object') {
    return false
  }
  const tiers = wallet.tiers as UpgradeTierState
  return Number.isInteger(tiers.maxHp) && tiers.maxHp >= 0 && tiers.maxHp <= MAX_TIER
}
