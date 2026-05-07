export type DailyStreakRecord = {
  lastPlayedDate: string
  currentStreak: number
  bestStreak: number
  totalDailyRuns: number
}

export const dailyStreakStorageKey = 'flatline.dailyStreak.v1'

export function createDailyStreakRecord(dateKey: string): DailyStreakRecord {
  return {
    lastPlayedDate: dateKey,
    currentStreak: 1,
    bestStreak: 1,
    totalDailyRuns: 1
  }
}

export function readDailyStreak(storage: Storage): DailyStreakRecord | null {
  try {
    const raw = storage.getItem(dailyStreakStorageKey)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    return isDailyStreakRecord(parsed) ? parsed : null
  } catch {
    // SecurityError (private-browsing) or malformed JSON: streak data is non-critical, treat as absent.
    return null
  }
}

export function writeDailyStreak(storage: Storage, record: DailyStreakRecord): void {
  try {
    storage.setItem(dailyStreakStorageKey, JSON.stringify(record))
  } catch {
    // QuotaExceededError or SecurityError on locked-down browsers; swallow silently.
  }
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

function isDailyStreakRecord(value: unknown): value is DailyStreakRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as DailyStreakRecord
  return (
    typeof record.lastPlayedDate === 'string' &&
    typeof record.currentStreak === 'number' &&
    typeof record.bestStreak === 'number' &&
    typeof record.totalDailyRuns === 'number'
  )
}
