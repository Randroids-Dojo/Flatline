import { describe, expect, it } from 'vitest'
import {
  dailyDateKey,
  leaderboardKey,
  makeSharedLeaderboardEntry,
  normalizeInitials,
  readSharedLeaderboard,
  sanitizeSubmission,
  writeSharedLeaderboardEntry
} from './sharedLeaderboard'
import type { LeaderboardKv } from './sharedLeaderboard'

describe('shared leaderboard helpers', () => {
  it('normalizes initials and validates submissions', () => {
    expect(normalizeInitials('r2d2')).toBe('RD')
    expect(sanitizeSubmission({
      initials: 'abc',
      score: 100,
      survivalMs: 1000,
      kills: 2,
      accuracy: 0.5,
      bestCombo: 1,
      scope: 'daily',
      date: '2026-04-30'
    })?.initials).toBe('ABC')
    expect(sanitizeSubmission({ initials: '123' })).toBeNull()
  })

  it('generates stable date and key names', () => {
    expect(dailyDateKey(new Date('2026-04-30T23:59:59Z'))).toBe('2026-04-30')
    expect(leaderboardKey('all', null)).toBe('flatline:leaderboard:all')
    expect(leaderboardKey('daily', '2026-04-30')).toBe('flatline:leaderboard:daily:2026-04-30')
  })

  it('writes and reads ranked entries in high-score order', async () => {
    const kv = new FakeKv()
    const low = makeSharedLeaderboardEntry(
      {
        initials: 'LOW',
        score: 100,
        survivalMs: 1000,
        kills: 1,
        accuracy: 0.5,
        bestCombo: 1,
        scope: 'all'
      },
      'low',
      '2026-04-30T00:00:00.000Z'
    )
    const high = makeSharedLeaderboardEntry(
      {
        initials: 'HI',
        score: 300,
        survivalMs: 1000,
        kills: 1,
        accuracy: 0.5,
        bestCombo: 1,
        scope: 'all'
      },
      'high',
      '2026-04-30T00:00:00.000Z'
    )

    await writeSharedLeaderboardEntry(kv, 'all', null, low)
    await writeSharedLeaderboardEntry(kv, 'all', null, high)

    expect((await readSharedLeaderboard(kv, 'all', null)).map((entry) => entry.playerInitials)).toEqual(['HI', 'LOW'])
  })
})

class FakeKv implements LeaderboardKv {
  private sets = new Map<string, Array<{ score: number; member: string }>>()
  private counters = new Map<string, number>()

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
