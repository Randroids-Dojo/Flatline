import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UpgradeWalletKv } from '@/lib/sharedUpgradeWallet'

const FIXTURE_PLAYER_ID = '11111111-2222-3333-4444-555555555555'

const { fakeKv } = vi.hoisted(() => {
  class HoistedFakeKv implements UpgradeWalletKv {
    values = new Map<string, string>()
    counts = new Map<string, number>()

    reset() {
      this.values.clear()
      this.counts.clear()
    }

    async get(key: string) {
      return this.values.get(key) ?? null
    }

    async set(key: string, value: string) {
      this.values.set(key, value)
      return 'OK'
    }

    async incr(key: string) {
      const next = (this.counts.get(key) ?? 0) + 1
      this.counts.set(key, next)
      return next
    }

    async expire() {
      return 1
    }
  }

  return { fakeKv: new HoistedFakeKv() }
})

vi.mock('@/lib/kv', () => ({
  getKv: () => fakeKv,
  hasKvConfigured: () => true,
  kvKeys: {
    leaderboardAll: () => 'flatline:leaderboard:all',
    leaderboardDaily: (date: string) => `flatline:leaderboard:daily:${date}`,
    ratelimitIp: (ip: string) => `flatline:ratelimit:submit:ip:${ip}`,
    ratelimitDaily: (ip: string) => `flatline:ratelimit:submit:daily:${ip}`,
    upgradeWallet: (playerId: string) => `flatline:wallet:${playerId}`,
    ratelimitWalletIp: (ip: string) => `flatline:ratelimit:wallet:ip:${ip}`
  }
}))

function postRequest(body: unknown) {
  return new Request('http://test/api/upgrade-wallet', {
    method: 'POST',
    headers: { 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body)
  }) as never
}

function getRequest(playerId: string | null) {
  const url = playerId
    ? `http://test/api/upgrade-wallet?playerId=${encodeURIComponent(playerId)}`
    : 'http://test/api/upgrade-wallet'
  return new Request(url) as never
}

describe('/api/upgrade-wallet', () => {
  beforeEach(() => {
    fakeKv.reset()
  })

  it('GET returns null wallet for an empty store', async () => {
    const { GET } = await import('../app/api/upgrade-wallet/route')
    const response = await GET(getRequest(FIXTURE_PLAYER_ID))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.wallet).toBeNull()
    expect(body.unavailable).toBe(false)
  })

  it('GET rejects a malformed playerId with 400', async () => {
    const { GET } = await import('../app/api/upgrade-wallet/route')
    const response = await GET(getRequest('not-a-uuid'))
    expect(response.status).toBe(400)
  })

  it('POST accepts a valid wallet, persists it, and returns the merged result', async () => {
    const { POST } = await import('../app/api/upgrade-wallet/route')
    const response = await POST(postRequest({
      playerId: FIXTURE_PLAYER_ID,
      wallet: {
        credits: 5,
        totalCreditsEarned: 25,
        tiers: { maxHp: 2, startingAmmo: 0, weaponDamage: 1, moveSpeed: 0 }
      }
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.wallet.credits).toBe(5)
    expect(body.wallet.tiers.maxHp).toBe(2)
    expect(body.wallet.tiers.weaponDamage).toBe(1)
  })

  it('POST merges with the existing record taking the higher of each field', async () => {
    const { POST } = await import('../app/api/upgrade-wallet/route')

    await POST(postRequest({
      playerId: FIXTURE_PLAYER_ID,
      wallet: {
        credits: 10,
        totalCreditsEarned: 30,
        tiers: { maxHp: 3, startingAmmo: 0, weaponDamage: 1, moveSpeed: 0 }
      }
    }))

    const second = await POST(postRequest({
      playerId: FIXTURE_PLAYER_ID,
      wallet: {
        credits: 0,
        totalCreditsEarned: 0,
        tiers: { maxHp: 1, startingAmmo: 4, weaponDamage: 0, moveSpeed: 2 }
      }
    }))
    const body = await second.json()

    expect(body.wallet.credits).toBe(10)
    expect(body.wallet.totalCreditsEarned).toBe(30)
    expect(body.wallet.tiers).toEqual({ maxHp: 3, startingAmmo: 4, weaponDamage: 1, moveSpeed: 2 })
  })

  it('POST rejects an invalid submission with 400', async () => {
    const { POST } = await import('../app/api/upgrade-wallet/route')
    const response = await POST(postRequest({ playerId: 'nope', wallet: {} }))
    expect(response.status).toBe(400)
  })

  it('POST rate-limits the 31st request in a 60-second window', async () => {
    const { POST } = await import('../app/api/upgrade-wallet/route')
    const validBody = {
      playerId: FIXTURE_PLAYER_ID,
      wallet: {
        credits: 0,
        totalCreditsEarned: 0,
        tiers: { maxHp: 0, startingAmmo: 0, weaponDamage: 0, moveSpeed: 0 }
      }
    }

    for (let i = 0; i < 30; i++) {
      const response = await POST(postRequest(validBody))
      expect(response.status).toBe(200)
    }

    const overflow = await POST(postRequest(validBody))
    expect(overflow.status).toBe(429)
  })
})

describe('/api/upgrade-wallet (kv unavailable)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/lib/kv', () => ({
      getKv: () => {
        throw new Error('not configured')
      },
      hasKvConfigured: () => false,
      kvKeys: {
        upgradeWallet: (playerId: string) => `flatline:wallet:${playerId}`,
        ratelimitWalletIp: (ip: string) => `flatline:ratelimit:wallet:ip:${ip}`
      }
    }))
  })

  it('GET reports unavailable when KV is not configured', async () => {
    const { GET } = await import('../app/api/upgrade-wallet/route')
    const response = await GET(getRequest(FIXTURE_PLAYER_ID))
    const body = await response.json()
    expect(body.unavailable).toBe(true)
    expect(body.wallet).toBeNull()
  })

  it('POST returns 503 when KV is not configured', async () => {
    const { POST } = await import('../app/api/upgrade-wallet/route')
    const response = await POST(postRequest({
      playerId: FIXTURE_PLAYER_ID,
      wallet: {
        credits: 0,
        totalCreditsEarned: 0,
        tiers: { maxHp: 0, startingAmmo: 0, weaponDamage: 0, moveSpeed: 0 }
      }
    }))
    expect(response.status).toBe(503)
  })
})
