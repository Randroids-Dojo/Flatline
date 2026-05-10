import { describe, expect, it } from 'vitest'
import {
  SharedUpgradeWalletSchema,
  emptySharedWallet,
  fromSharedWallet,
  hitWalletRateLimit,
  mergeWallets,
  readSharedUpgradeWallet,
  sanitizeWalletSubmission,
  toSharedWallet,
  writeSharedUpgradeWallet,
  type SharedUpgradeWallet,
  type UpgradeWalletKv
} from './sharedUpgradeWallet'

const FIXTURE_PLAYER_ID = '11111111-2222-3333-4444-555555555555'

function fakeWallet(overrides: Partial<SharedUpgradeWallet> = {}): SharedUpgradeWallet {
  return {
    credits: 0,
    totalCreditsEarned: 0,
    tiers: { maxHp: 0, startingAmmo: 0, weaponDamage: 0, moveSpeed: 0 },
    ...overrides
  }
}

class FakeKv implements UpgradeWalletKv {
  values = new Map<string, string>()
  counts = new Map<string, number>()
  ttls = new Map<string, number>()

  async get(key: string): Promise<unknown> {
    return this.values.get(key) ?? null
  }

  async set(key: string, value: string): Promise<unknown> {
    this.values.set(key, value)
    return 'OK'
  }

  async incr(key: string): Promise<number> {
    const next = (this.counts.get(key) ?? 0) + 1
    this.counts.set(key, next)
    return next
  }

  async expire(key: string, seconds: number): Promise<unknown> {
    this.ttls.set(key, seconds)
    return 1
  }
}

describe('SharedUpgradeWalletSchema', () => {
  it('accepts a fresh wallet', () => {
    const result = SharedUpgradeWalletSchema.safeParse(fakeWallet())
    expect(result.success).toBe(true)
  })

  it('rejects credits exceeding totalCreditsEarned', () => {
    const result = SharedUpgradeWalletSchema.safeParse(fakeWallet({ credits: 50, totalCreditsEarned: 10 }))
    expect(result.success).toBe(false)
  })

  it('rejects negative credits', () => {
    const result = SharedUpgradeWalletSchema.safeParse(fakeWallet({ credits: -1, totalCreditsEarned: 0 }))
    expect(result.success).toBe(false)
  })

  it('rejects a tier above MAX_TIER', () => {
    const result = SharedUpgradeWalletSchema.safeParse(
      fakeWallet({ tiers: { maxHp: 99, startingAmmo: 0, weaponDamage: 0, moveSpeed: 0 } })
    )
    expect(result.success).toBe(false)
  })

  it('rejects credits beyond the absolute ceiling', () => {
    const result = SharedUpgradeWalletSchema.safeParse(
      fakeWallet({ credits: 100_000_000, totalCreditsEarned: 100_000_000 })
    )
    expect(result.success).toBe(false)
  })
})

describe('sanitizeWalletSubmission', () => {
  it('accepts a valid submission', () => {
    const result = sanitizeWalletSubmission({
      playerId: FIXTURE_PLAYER_ID,
      wallet: fakeWallet({ credits: 5, totalCreditsEarned: 5 })
    })
    expect(result).not.toBeNull()
    expect(result?.playerId).toBe(FIXTURE_PLAYER_ID)
  })

  it('rejects a submission with a malformed playerId', () => {
    expect(sanitizeWalletSubmission({ playerId: 'nope', wallet: fakeWallet() })).toBeNull()
  })

  it('rejects a submission with a malformed wallet', () => {
    expect(
      sanitizeWalletSubmission({ playerId: FIXTURE_PLAYER_ID, wallet: { credits: 'oops' } })
    ).toBeNull()
  })

  it('rejects undefined or null', () => {
    expect(sanitizeWalletSubmission(null)).toBeNull()
    expect(sanitizeWalletSubmission(undefined)).toBeNull()
  })
})

describe('mergeWallets', () => {
  it('returns the input when both sides are empty', () => {
    expect(mergeWallets(fakeWallet(), fakeWallet())).toEqual(fakeWallet())
  })

  it('takes the higher credits and totalCreditsEarned', () => {
    const a = fakeWallet({ credits: 5, totalCreditsEarned: 50 })
    const b = fakeWallet({ credits: 8, totalCreditsEarned: 40 })
    const merged = mergeWallets(a, b)
    expect(merged.credits).toBe(8)
    expect(merged.totalCreditsEarned).toBe(50)
  })

  it('takes the higher tier per stat element-wise', () => {
    const a = fakeWallet({
      totalCreditsEarned: 100,
      tiers: { maxHp: 3, startingAmmo: 0, weaponDamage: 1, moveSpeed: 2 }
    })
    const b = fakeWallet({
      totalCreditsEarned: 100,
      tiers: { maxHp: 1, startingAmmo: 4, weaponDamage: 2, moveSpeed: 0 }
    })
    expect(mergeWallets(a, b).tiers).toEqual({
      maxHp: 3,
      startingAmmo: 4,
      weaponDamage: 2,
      moveSpeed: 2
    })
  })

  it('is commutative (a, b) === (b, a)', () => {
    const a = fakeWallet({
      credits: 5,
      totalCreditsEarned: 50,
      tiers: { maxHp: 3, startingAmmo: 0, weaponDamage: 1, moveSpeed: 2 }
    })
    const b = fakeWallet({
      credits: 8,
      totalCreditsEarned: 40,
      tiers: { maxHp: 1, startingAmmo: 4, weaponDamage: 2, moveSpeed: 0 }
    })
    expect(mergeWallets(a, b)).toEqual(mergeWallets(b, a))
  })

  it('never regresses any field across consecutive merges', () => {
    const initial = fakeWallet({
      credits: 5,
      totalCreditsEarned: 25,
      tiers: { maxHp: 1, startingAmmo: 0, weaponDamage: 0, moveSpeed: 0 }
    })
    const tampered = fakeWallet({
      credits: 0,
      totalCreditsEarned: 0,
      tiers: { maxHp: 0, startingAmmo: 0, weaponDamage: 0, moveSpeed: 0 }
    })
    const result = mergeWallets(initial, tampered)
    expect(result).toEqual(initial)
  })
})

describe('toSharedWallet / fromSharedWallet', () => {
  it('round-trips a wallet without mutating the input', () => {
    const local = {
      credits: 5,
      totalCreditsEarned: 25,
      tiers: { maxHp: 2, startingAmmo: 0, weaponDamage: 1, moveSpeed: 0 }
    }
    const shared = toSharedWallet(local)
    expect(shared).toEqual(local)
    expect(shared.tiers).not.toBe(local.tiers)
    const back = fromSharedWallet(shared)
    expect(back).toEqual(local)
    expect(back.tiers).not.toBe(shared.tiers)
  })
})

describe('emptySharedWallet', () => {
  it('matches the fresh-wallet shape', () => {
    expect(emptySharedWallet()).toEqual(fakeWallet())
  })
})

describe('readSharedUpgradeWallet / writeSharedUpgradeWallet', () => {
  it('returns null when the key is absent', async () => {
    const kv = new FakeKv()
    expect(await readSharedUpgradeWallet(kv, 'flatline:wallet:abc')).toBeNull()
  })

  it('round-trips a stored wallet', async () => {
    const kv = new FakeKv()
    const wallet = fakeWallet({
      credits: 5,
      totalCreditsEarned: 25,
      tiers: { maxHp: 2, startingAmmo: 0, weaponDamage: 1, moveSpeed: 0 }
    })
    await writeSharedUpgradeWallet(kv, 'flatline:wallet:abc', wallet)
    expect(await readSharedUpgradeWallet(kv, 'flatline:wallet:abc')).toEqual(wallet)
  })

  it('returns null when storage holds a malformed wallet', async () => {
    const kv = new FakeKv()
    kv.values.set('flatline:wallet:abc', '{not json')
    expect(await readSharedUpgradeWallet(kv, 'flatline:wallet:abc')).toBeNull()
  })

  it('returns null when storage holds a parsed object that fails the schema', async () => {
    const kv = new FakeKv()
    kv.values.set('flatline:wallet:abc', JSON.stringify({ credits: 'oops' }))
    expect(await readSharedUpgradeWallet(kv, 'flatline:wallet:abc')).toBeNull()
  })
})

describe('hitWalletRateLimit', () => {
  it('allows the first hit and starts a TTL window', async () => {
    const kv = new FakeKv()
    const allowed = await hitWalletRateLimit(kv, { key: 'k', limit: 2, windowSec: 30 })
    expect(allowed).toBe(true)
    expect(kv.ttls.get('k')).toBe(30)
  })

  it('allows up to the limit then refuses', async () => {
    const kv = new FakeKv()
    expect(await hitWalletRateLimit(kv, { key: 'k', limit: 2, windowSec: 30 })).toBe(true)
    expect(await hitWalletRateLimit(kv, { key: 'k', limit: 2, windowSec: 30 })).toBe(true)
    expect(await hitWalletRateLimit(kv, { key: 'k', limit: 2, windowSec: 30 })).toBe(false)
  })

  it('only sets the TTL on the first hit so existing windows are not extended', async () => {
    const kv = new FakeKv()
    await hitWalletRateLimit(kv, { key: 'k', limit: 5, windowSec: 30 })
    kv.ttls.set('k', 30)
    await hitWalletRateLimit(kv, { key: 'k', limit: 5, windowSec: 999 })
    // The fake records the latest expire call; the only call after the
    // first should be skipped because count > 1.
    expect(kv.ttls.get('k')).toBe(30)
  })
})
