import { z } from 'zod'
import { readStorage, writeStorage } from './storage'

export type DailyStreakRecord = {
  lastPlayedDate: string
  currentStreak: number
  bestStreak: number
  totalDailyRuns: number
}

export const dailyStreakStorageKey = 'flatline.dailyStreak.v1'

const DailyStreakRecordSchema = z.object({
  lastPlayedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currentStreak: z.number().int().min(1),
  bestStreak: z.number().int().min(1),
  totalDailyRuns: z.number().int().min(1)
})

export function createDailyStreakRecord(dateKey: string): DailyStreakRecord {
  return {
    lastPlayedDate: dateKey,
    currentStreak: 1,
    bestStreak: 1,
    totalDailyRuns: 1
  }
}

export function readDailyStreak(): DailyStreakRecord | null {
  return readStorage(dailyStreakStorageKey, DailyStreakRecordSchema)
}

export function writeDailyStreak(record: DailyStreakRecord): void {
  writeStorage(dailyStreakStorageKey, record)
}

export function recordDailyRun(previous: DailyStreakRecord | null, dateKey: string): DailyStreakRecord {
  if (!previous) {
    return createDailyStreakRecord(dateKey)
  }

  if (previous.lastPlayedDate === dateKey) {
    return {
      ...previous,
      totalDailyRuns: previous.totalDailyRuns + 1
    }
  }

  const nextStreak = daysBetween(previous.lastPlayedDate, dateKey) === 1 ? previous.currentStreak + 1 : 1

  return {
    lastPlayedDate: dateKey,
    currentStreak: nextStreak,
    bestStreak: Math.max(previous.bestStreak, nextStreak),
    totalDailyRuns: previous.totalDailyRuns + 1
  }
}

export function dailyStreakLabel(record: DailyStreakRecord | null): string {
  if (!record) {
    return 'First daily run'
  }

  if (record.currentStreak === 1) {
    return '1 day streak'
  }

  return `${record.currentStreak} day streak`
}

function daysBetween(fromDateKey: string, toDateKey: string): number {
  const from = Date.parse(`${fromDateKey}T00:00:00.000Z`)
  const to = Date.parse(`${toDateKey}T00:00:00.000Z`)

  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return Number.POSITIVE_INFINITY
  }

  return Math.round((to - from) / 86_400_000)
}
