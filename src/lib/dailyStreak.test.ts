import { describe, expect, it } from 'vitest'
import { dailyStreakLabel, recordDailyRun } from './dailyStreak'

describe('recordDailyRun', () => {
  it('creates a first daily record', () => {
    expect(recordDailyRun(null, '2026-05-07')).toEqual({
      lastPlayedDate: '2026-05-07',
      currentStreak: 1,
      bestStreak: 1,
      totalDailyRuns: 1
    })
  })

  it('keeps the streak stable for repeat runs on the same date', () => {
    expect(
      recordDailyRun(
        {
          lastPlayedDate: '2026-05-07',
          currentStreak: 3,
          bestStreak: 5,
          totalDailyRuns: 8
        },
        '2026-05-07'
      )
    ).toEqual({
      lastPlayedDate: '2026-05-07',
      currentStreak: 3,
      bestStreak: 5,
      totalDailyRuns: 9
    })
  })

  it('extends a streak on the next UTC date', () => {
    expect(
      recordDailyRun(
        {
          lastPlayedDate: '2026-05-07',
          currentStreak: 2,
          bestStreak: 2,
          totalDailyRuns: 4
        },
        '2026-05-08'
      )
    ).toEqual({
      lastPlayedDate: '2026-05-08',
      currentStreak: 3,
      bestStreak: 3,
      totalDailyRuns: 5
    })
  })

  it('resets a streak after a missed date', () => {
    expect(
      recordDailyRun(
        {
          lastPlayedDate: '2026-05-07',
          currentStreak: 4,
          bestStreak: 6,
          totalDailyRuns: 10
        },
        '2026-05-09'
      )
    ).toEqual({
      lastPlayedDate: '2026-05-09',
      currentStreak: 1,
      bestStreak: 6,
      totalDailyRuns: 11
    })
  })
})

describe('dailyStreakLabel', () => {
  it('labels a player with no daily history', () => {
    expect(dailyStreakLabel(null)).toBe('First daily run')
  })

  it('labels one-day and multi-day streaks', () => {
    expect(dailyStreakLabel(recordDailyRun(null, '2026-05-07'))).toBe('1 day streak')
    expect(
      dailyStreakLabel(
        recordDailyRun(
          {
            lastPlayedDate: '2026-05-07',
            currentStreak: 1,
            bestStreak: 1,
            totalDailyRuns: 1
          },
          '2026-05-08'
        )
      )
    ).toBe('2 day streak')
  })
})
