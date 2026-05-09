import { z } from 'zod'
import { readStorage, writeStorage } from './storage'

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

const LeaderboardEntrySchema = z.object({
  playerInitials: z.string(),
  score: z.number(),
  survivalMs: z.number(),
  kills: z.number(),
  accuracy: z.number(),
  bestCombo: z.number(),
  createdAt: z.string()
})

const LeaderboardSchema = z.array(LeaderboardEntrySchema)

export function insertLeaderboardEntry(
  entries: LeaderboardEntry[],
  entry: LeaderboardEntry,
  limit = 5
): LeaderboardEntry[] {
  return [...entries, entry]
    .sort((a, b) => b.score - a.score || b.survivalMs - a.survivalMs || b.kills - a.kills)
    .slice(0, limit)
}

export function readLeaderboard(): LeaderboardEntry[] {
  return readStorage(leaderboardStorageKey, LeaderboardSchema) ?? []
}

export function writeLeaderboard(entries: LeaderboardEntry[]): void {
  writeStorage(leaderboardStorageKey, entries)
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
