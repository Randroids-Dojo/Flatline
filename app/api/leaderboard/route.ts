import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getKv, hasKvConfigured, kvKeys } from '@/lib/kv'
import {
  dailyDateKey,
  hitRateLimit,
  leaderboardScopes,
  makeSharedLeaderboardEntry,
  readSharedLeaderboard,
  sanitizeSubmission,
  sharedLeaderboardLimit,
  writeSharedLeaderboardEntry,
  type LeaderboardScope,
  type SharedLeaderboardResponse
} from '@/lib/sharedLeaderboard'

export const runtime = 'nodejs'

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }

  return req.headers.get('x-real-ip') ?? 'unknown'
}

function parseScope(value: string | null): LeaderboardScope {
  return leaderboardScopes.includes(value as LeaderboardScope) ? (value as LeaderboardScope) : 'all'
}

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? sharedLeaderboardLimit)
  return Number.isFinite(parsed) ? parsed : sharedLeaderboardLimit
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const scope = parseScope(url.searchParams.get('scope'))
  const date = scope === 'daily' ? (url.searchParams.get('date') ?? dailyDateKey()) : null
  const limit = parseLimit(url.searchParams.get('limit'))

  if (!hasKvConfigured()) {
    return NextResponse.json<SharedLeaderboardResponse>({
      scope,
      date,
      entries: [],
      unavailable: true
    })
  }

  try {
    const entries = await readSharedLeaderboard(getKv(), scope, date, limit)
    return NextResponse.json<SharedLeaderboardResponse>({
      scope,
      date,
      entries,
      unavailable: false
    })
  } catch {
    return NextResponse.json<SharedLeaderboardResponse>({
      scope,
      date,
      entries: [],
      unavailable: true
    })
  }
}

export async function POST(req: NextRequest) {
  if (!hasKvConfigured()) {
    return NextResponse.json({ error: 'leaderboard unavailable' }, { status: 503 })
  }

  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const submission = sanitizeSubmission(body)

  if (!submission) {
    return NextResponse.json({ error: 'invalid submission' }, { status: 400 })
  }

  const kv = getKv()
  const ip = getClientIp(req)
  const burstAllowed = await hitRateLimit(kv, {
    key: kvKeys.ratelimitIp(ip),
    limit: 1,
    windowSec: 10
  })

  if (!burstAllowed) {
    return NextResponse.json({ error: 'too many submissions' }, { status: 429 })
  }

  const dailyAllowed = await hitRateLimit(kv, {
    key: kvKeys.ratelimitDaily(ip),
    limit: 50,
    windowSec: 24 * 60 * 60
  })

  if (!dailyAllowed) {
    return NextResponse.json({ error: 'daily submission limit reached' }, { status: 429 })
  }

  const date = submission.date ?? dailyDateKey()
  const entry = makeSharedLeaderboardEntry(submission, randomUUID(), new Date().toISOString())

  await writeSharedLeaderboardEntry(kv, 'all', null, entry)

  if (submission.scope === 'daily') {
    await writeSharedLeaderboardEntry(kv, 'daily', date, entry)
  }

  const entries = await readSharedLeaderboard(kv, submission.scope, submission.scope === 'daily' ? date : null)

  return NextResponse.json({
    ok: true,
    scope: submission.scope,
    date: submission.scope === 'daily' ? date : null,
    entries,
    unavailable: false
  })
}
