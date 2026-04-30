import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LeaderboardKv } from '@/lib/sharedLeaderboard'

const { fakeKv } = vi.hoisted(() => {
  class HoistedFakeKv implements LeaderboardKv {
    private sets = new Map<string, Array<{ score: number; member: string }>>()
    private counters = new Map<string, number>()

    reset() {
      this.sets.clear()
      this.counters.clear()
    }

    async zrange(key: string, start: number, stop: number, options?: { rev?: boolean }) {
      const values = [...(this.sets.get(key) ?? [])].sort((a, b) => a.score - b.score)

      if (options?.rev) {
        values.reverse()
      }

      return values.slice(start, stop + 1).map((entry) => entry.member)
    }

    async zadd(key: string, entry: { score: number; member: string }) {
      const values = this.sets.get(key) ?? []
      values.push(entry)
      this.sets.set(key, values)
    }

    async zcard(key: string) {
      return this.sets.get(key)?.length ?? 0
    }

    async zremrangebyrank(key: string, start: number, stop: number) {
      const values = [...(this.sets.get(key) ?? [])].sort((a, b) => a.score - b.score)
      values.splice(start, stop - start + 1)
      this.sets.set(key, values)
    }

    async incr(key: string) {
      const next = (this.counters.get(key) ?? 0) + 1
      this.counters.set(key, next)
      return next
    }

    async expire() {}
  }

  return {
    fakeKv: new HoistedFakeKv()
  }
})

vi.mock('@/lib/kv', () => ({
  getKv: () => fakeKv,
  hasKvConfigured: () => true,
  kvKeys: {
    leaderboardAll: () => 'flatline:leaderboard:all',
    leaderboardDaily: (date: string) => `flatline:leaderboard:daily:${date}`,
    ratelimitIp: (ip: string) => `flatline:ratelimit:submit:ip:${ip}`,
    ratelimitDaily: (ip: string) => `flatline:ratelimit:submit:daily:${ip}`
  }
}))

describe('/api/leaderboard', () => {
  beforeEach(() => {
    fakeKv.reset()
  })

  it('accepts a daily score and returns the daily board', async () => {
    const { POST } = await import('../app/api/leaderboard/route')
    const response = await POST(new Request('http://test/api/leaderboard', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '1.2.3.4'
      },
      body: JSON.stringify({
        initials: 'abc',
        score: 500,
        survivalMs: 2000,
        kills: 4,
        accuracy: 0.5,
        bestCombo: 2,
        scope: 'daily',
        date: '2026-04-30'
      })
    }) as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.entries[0].playerInitials).toBe('ABC')
    expect(body.scope).toBe('daily')
  })

  it('rate limits rapid repeated submits by IP', async () => {
    const { POST } = await import('../app/api/leaderboard/route')
    const makeRequest = () => new Request('http://test/api/leaderboard', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '1.2.3.4'
      },
      body: JSON.stringify({
        initials: 'AAA',
        score: 500,
        survivalMs: 2000,
        kills: 4,
        accuracy: 0.5,
        bestCombo: 2,
        scope: 'all'
      })
    }) as never

    expect((await POST(makeRequest())).status).toBe(200)
    expect((await POST(makeRequest())).status).toBe(429)
  })

  it('returns empty all-time entries on GET', async () => {
    const { GET } = await import('../app/api/leaderboard/route')
    const response = await GET(new Request('http://test/api/leaderboard?scope=all') as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.entries).toEqual([])
    expect(body.unavailable).toBe(false)
  })
})
