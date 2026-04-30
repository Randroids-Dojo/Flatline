import { z } from 'zod'
import { kvKeys } from './kv'

export const leaderboardScopes = ['all', 'daily'] as const
export type LeaderboardScope = (typeof leaderboardScopes)[number]

export const sharedLeaderboardLimit = 25
export const maxSharedLeaderboardEntries = 100

export const SharedLeaderboardEntrySchema = z.object({
  id: z.string().min(1),
  playerInitials: z.string().regex(/^[A-Z]{1,3}$/),
  score: z.number().int().min(0).max(10_000_000),
  survivalMs: z.number().int().min(0).max(8 * 60 * 60 * 1000),
  kills: z.number().int().min(0).max(100_000),
  accuracy: z.number().min(0).max(1),
  bestCombo: z.number().int().min(0).max(100_000),
  createdAt: z.string().datetime()
})

export type SharedLeaderboardEntry = z.infer<typeof SharedLeaderboardEntrySchema>

export type RankedLeaderboardEntry = SharedLeaderboardEntry & {
  rank: number
}

export const LeaderboardSubmissionSchema = z.object({
  initials: z.string().min(1).max(16),
  score: z.number().int().min(0).max(10_000_000),
  survivalMs: z.number().int().min(0).max(8 * 60 * 60 * 1000),
  kills: z.number().int().min(0).max(100_000),
  accuracy: z.number().min(0).max(1),
  bestCombo: z.number().int().min(0).max(100_000),
  scope: z.enum(leaderboardScopes).default('all'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
})

export type LeaderboardSubmission = z.infer<typeof LeaderboardSubmissionSchema>

export type SharedLeaderboardResponse = {
  scope: LeaderboardScope
  date: string | null
  entries: RankedLeaderboardEntry[]
  unavailable: boolean
}

export type LeaderboardKv = {
  zrange: (key: string, start: number, stop: number, options?: { rev?: boolean }) => Promise<unknown[]>
  zadd: (key: string, entry: { score: number; member: string }) => Promise<unknown>
  zcard: (key: string) => Promise<number>
  zremrangebyrank: (key: string, start: number, stop: number) => Promise<unknown>
  incr: (key: string) => Promise<number>
  expire: (key: string, seconds: number) => Promise<unknown>
}

export type RateLimitRule = {
  key: string
  limit: number
  windowSec: number
}

export function normalizeInitials(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
}

export function dailyDateKey(date = new Date()): string {
  const year = date.getUTCFullYear()
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = date.getUTCDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function leaderboardKey(scope: LeaderboardScope, date: string | null): string {
  if (scope === 'daily') {
    return kvKeys.leaderboardDaily(date ?? dailyDateKey())
  }

  return kvKeys.leaderboardAll()
}

export function sanitizeSubmission(input: unknown): LeaderboardSubmission | null {
  const parsed = LeaderboardSubmissionSchema.safeParse(input)

  if (!parsed.success) {
    return null
  }

  const initials = normalizeInitials(parsed.data.initials)

  if (!initials) {
    return null
  }

  return {
    ...parsed.data,
    initials
  }
}

export async function hitRateLimit(kv: LeaderboardKv, rule: RateLimitRule): Promise<boolean> {
  const count = await kv.incr(rule.key)

  if (count === 1) {
    await kv.expire(rule.key, rule.windowSec)
  }

  return count <= rule.limit
}

export async function readSharedLeaderboard(
  kv: Pick<LeaderboardKv, 'zrange'>,
  scope: LeaderboardScope,
  date: string | null,
  limit = sharedLeaderboardLimit
): Promise<RankedLeaderboardEntry[]> {
  const safeLimit = Math.max(1, Math.min(maxSharedLeaderboardEntries, Math.trunc(limit)))
  const raw = await kv.zrange(leaderboardKey(scope, date), 0, safeLimit - 1, { rev: true })
  const entries = raw
    .map(parseLeaderboardMember)
    .filter((entry): entry is SharedLeaderboardEntry => entry !== null)
    .sort(compareSharedEntries)
    .slice(0, safeLimit)

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }))
}

export async function writeSharedLeaderboardEntry(
  kv: Pick<LeaderboardKv, 'zadd' | 'zcard' | 'zremrangebyrank'>,
  scope: LeaderboardScope,
  date: string | null,
  entry: SharedLeaderboardEntry
): Promise<void> {
  const key = leaderboardKey(scope, date)
  await kv.zadd(key, {
    score: entry.score,
    member: JSON.stringify(entry)
  })
  const count = await kv.zcard(key)

  if (count > maxSharedLeaderboardEntries) {
    await kv.zremrangebyrank(key, 0, count - maxSharedLeaderboardEntries - 1)
  }
}

export function makeSharedLeaderboardEntry(
  submission: LeaderboardSubmission,
  id: string,
  createdAt: string
): SharedLeaderboardEntry {
  return {
    id,
    playerInitials: submission.initials,
    score: submission.score,
    survivalMs: submission.survivalMs,
    kills: submission.kills,
    accuracy: submission.accuracy,
    bestCombo: submission.bestCombo,
    createdAt
  }
}

function parseLeaderboardMember(value: unknown): SharedLeaderboardEntry | null {
  try {
    const raw = typeof value === 'string' ? JSON.parse(value) : value
    const parsed = SharedLeaderboardEntrySchema.safeParse(raw)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function compareSharedEntries(a: SharedLeaderboardEntry, b: SharedLeaderboardEntry): number {
  return b.score - a.score ||
    b.survivalMs - a.survivalMs ||
    b.kills - a.kills ||
    Date.parse(a.createdAt) - Date.parse(b.createdAt)
}
