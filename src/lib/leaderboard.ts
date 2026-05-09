export type LeaderboardEntry = {
  playerInitials: string
  score: number
  survivalMs: number
  kills: number
  accuracy: number
  bestCombo: number
  createdAt: string
}

export const leaderboardStorageKey = 'flatline.localLeaderboard.v1'

export function insertLeaderboardEntry(
  entries: LeaderboardEntry[],
  entry: LeaderboardEntry,
  limit = 5
): LeaderboardEntry[] {
  return [...entries, entry]
    .sort((a, b) => b.score - a.score || b.survivalMs - a.survivalMs || b.kills - a.kills)
    .slice(0, limit)
}

export function readLeaderboard(storage: Storage): LeaderboardEntry[] {
  const raw = storage.getItem(leaderboardStorageKey)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isLeaderboardEntry) : []
  } catch {
    return []
  }
}

export function writeLeaderboard(storage: Storage, entries: LeaderboardEntry[]) {
  storage.setItem(leaderboardStorageKey, JSON.stringify(entries))
}

/** Top score across the current local leaderboard. Returns null if there
 * is no recorded entry yet so the consumer can render a different state
 * for first-time players (e.g. hide the "Best" line). */
export function bestLocalScore(entries: readonly LeaderboardEntry[]): number | null {
  if (entries.length === 0) {
    return null
  }

  let best = Number.NEGATIVE_INFINITY
  for (const entry of entries) {
    if (entry.score > best) {
      best = entry.score
    }
  }

  return best === Number.NEGATIVE_INFINITY ? null : best
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  const entry = value as LeaderboardEntry
  return (
    typeof entry.playerInitials === 'string' &&
    typeof entry.score === 'number' &&
    typeof entry.survivalMs === 'number' &&
    typeof entry.kills === 'number' &&
    typeof entry.accuracy === 'number' &&
    typeof entry.bestCombo === 'number' &&
    typeof entry.createdAt === 'string'
  )
}
