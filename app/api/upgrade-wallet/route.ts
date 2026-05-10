import { NextResponse, type NextRequest } from 'next/server'
import { getKv, hasKvConfigured, kvKeys } from '@/lib/kv'
import {
  asUpgradeWalletKv,
  emptySharedWallet,
  fromSharedWallet,
  hitWalletRateLimit,
  mergeWallets,
  readSharedUpgradeWallet,
  sanitizeWalletSubmission,
  writeSharedUpgradeWallet,
  type UpgradeWalletGetResponse,
  type UpgradeWalletPostResponse
} from '@/lib/sharedUpgradeWallet'
import { isValidPlayerId } from '@/lib/playerId'

export const runtime = 'nodejs'

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const playerId = url.searchParams.get('playerId')

  if (!isValidPlayerId(playerId)) {
    return NextResponse.json<UpgradeWalletGetResponse>(
      { wallet: null, unavailable: false },
      { status: 400 }
    )
  }

  if (!hasKvConfigured()) {
    return NextResponse.json<UpgradeWalletGetResponse>({ wallet: null, unavailable: true })
  }

  try {
    const kv = asUpgradeWalletKv(getKv())
    const stored = await readSharedUpgradeWallet(kv, kvKeys.upgradeWallet(playerId))
    return NextResponse.json<UpgradeWalletGetResponse>({
      wallet: stored ? fromSharedWallet(stored) : null,
      unavailable: false
    })
  } catch {
    return NextResponse.json<UpgradeWalletGetResponse>({ wallet: null, unavailable: true })
  }
}

export async function POST(req: NextRequest) {
  if (!hasKvConfigured()) {
    return NextResponse.json<UpgradeWalletPostResponse>(
      { ok: false, error: 'wallet sync unavailable' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<UpgradeWalletPostResponse>(
      { ok: false, error: 'invalid body' },
      { status: 400 }
    )
  }

  const submission = sanitizeWalletSubmission(body)
  if (!submission) {
    return NextResponse.json<UpgradeWalletPostResponse>(
      { ok: false, error: 'invalid submission' },
      { status: 400 }
    )
  }

  const kv = asUpgradeWalletKv(getKv())
  const ip = getClientIp(req)

  // Wallet sync runs after every kill-deposit and after every purchase,
  // so a single active session can fire several times a minute. The
  // window is generous enough to absorb that without burning CPU on
  // KV calls when the player is rapid-firing purchases.
  const burstAllowed = await hitWalletRateLimit(kv, {
    key: kvKeys.ratelimitWalletIp(ip),
    limit: 30,
    windowSec: 60
  })

  if (!burstAllowed) {
    return NextResponse.json<UpgradeWalletPostResponse>(
      { ok: false, error: 'too many wallet syncs' },
      { status: 429 }
    )
  }

  const key = kvKeys.upgradeWallet(submission.playerId)

  try {
    const existing = (await readSharedUpgradeWallet(kv, key)) ?? emptySharedWallet()
    const merged = mergeWallets(existing, submission.wallet)
    await writeSharedUpgradeWallet(kv, key, merged)
    return NextResponse.json<UpgradeWalletPostResponse>({
      ok: true,
      wallet: fromSharedWallet(merged),
      unavailable: false
    })
  } catch {
    return NextResponse.json<UpgradeWalletPostResponse>(
      { ok: false, error: 'wallet sync failed' },
      { status: 503 }
    )
  }
}
