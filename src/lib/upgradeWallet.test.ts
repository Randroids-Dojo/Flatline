import { describe, expect, it } from 'vitest'
import {
  createUpgradeWallet,
  depositKills,
  readUpgradeWallet,
  upgradeWalletStorageKey,
  writeUpgradeWallet
} from './upgradeWallet'

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
    clear: () => {
      data.clear()
    },
    key: (index) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size
    }
  }
}

describe('createUpgradeWallet', () => {
  it('starts at zero credits with tier-0 stats', () => {
    const wallet = createUpgradeWallet()
    expect(wallet.credits).toBe(0)
    expect(wallet.totalCreditsEarned).toBe(0)
    expect(wallet.tiers.maxHp).toBe(0)
  })
})

describe('depositKills', () => {
  it('adds kills to both spendable balance and lifetime total', () => {
    const next = depositKills(createUpgradeWallet(), 7)
    expect(next.credits).toBe(7)
    expect(next.totalCreditsEarned).toBe(7)
  })

  it('is a no-op for zero, negative, or fractional kills (defensive against runtime drift)', () => {
    const wallet = createUpgradeWallet()
    expect(depositKills(wallet, 0)).toBe(wallet)
    expect(depositKills(wallet, -3)).toBe(wallet)
    expect(depositKills(wallet, 0.4)).toBe(wallet)
  })

  it('keeps lifetime total monotonically increasing across deposits', () => {
    let wallet = createUpgradeWallet()
    wallet = depositKills(wallet, 12)
    wallet = depositKills(wallet, 5)
    expect(wallet.credits).toBe(17)
    expect(wallet.totalCreditsEarned).toBe(17)
  })

  it('preserves the existing tier state', () => {
    const wallet = { ...createUpgradeWallet(), tiers: { maxHp: 3 } }
    const next = depositKills(wallet, 1)
    expect(next.tiers.maxHp).toBe(3)
  })

  it('does not mutate the input wallet', () => {
    const wallet = createUpgradeWallet()
    depositKills(wallet, 5)
    expect(wallet.credits).toBe(0)
  })
})

describe('readUpgradeWallet / writeUpgradeWallet', () => {
  it('returns a fresh wallet when storage is empty', () => {
    expect(readUpgradeWallet(memoryStorage())).toEqual(createUpgradeWallet())
  })

  it('round-trips a written wallet', () => {
    const storage = memoryStorage()
    const stored = { credits: 14, totalCreditsEarned: 27, tiers: { maxHp: 2 } }
    writeUpgradeWallet(storage, stored)
    expect(readUpgradeWallet(storage)).toEqual(stored)
  })

  it('falls back to a fresh wallet when storage holds malformed JSON', () => {
    const storage = memoryStorage()
    storage.setItem(upgradeWalletStorageKey, '{not json')
    expect(readUpgradeWallet(storage)).toEqual(createUpgradeWallet())
  })

  it('falls back to a fresh wallet when storage holds a value that fails the shape guard', () => {
    const storage = memoryStorage()
    storage.setItem(upgradeWalletStorageKey, JSON.stringify({ credits: 'oops' }))
    expect(readUpgradeWallet(storage)).toEqual(createUpgradeWallet())
  })

  it('rejects negative credits in stored data', () => {
    const storage = memoryStorage()
    storage.setItem(
      upgradeWalletStorageKey,
      JSON.stringify({ credits: -5, totalCreditsEarned: 0, tiers: { maxHp: 0 } })
    )
    expect(readUpgradeWallet(storage)).toEqual(createUpgradeWallet())
  })
})
