// Cross-device sync for the per-player upgrade wallet.
//
// Architecture mirrors `sharedLeaderboard.ts` but the data model is
// per-player single-document, not a leaderboard sorted set. Each player
// is identified by an opaque uuid generated client-side
// (`src/lib/playerId.ts`); the server stores the wallet under
// `flatline:wallet:{playerId}` as a JSON string and rejects any
// payload that fails the schema or the no-regression merge invariant.
//
// Anti-cheat strategy is intentionally light because progression is
// single-player and the worst a tampered client can achieve is grant
// itself unearned tiers on its own save. The server-side merge enforces
// monotonic, highest-water-mark fields (server >= client always wins
// per field) so an attacker who pushes a degraded payload cannot wipe
// progression for the same player. Stronger validation that the
// purchases imply the lifetime credits is left as a follow-up because
// it locks in the cost ramp.

import type { Redis } from '@upstash/redis'
import { z } from 'zod'
import { MAX_TIER, type UpgradeTierState } from '@/game/upgradeTree'
import { createUpgradeWallet, type UpgradeWallet } from '@/lib/upgradeWallet'

const tierFieldSchema = z.number().int().min(0).max(MAX_TIER)

export const SharedUpgradeWalletSchema = z.object({
  credits: z.number().int().min(0).max(10_000_000),
  totalCreditsEarned: z.number().int().min(0).max(10_000_000),
  tiers: z.object({
    maxHp: tierFieldSchema,
    startingAmmo: tierFieldSchema,
    weaponDamage: tierFieldSchema,
    moveSpeed: tierFieldSchema
  })
}).refine(
  (wallet) => wallet.credits <= wallet.totalCreditsEarned,
  { message: 'credits cannot exceed totalCreditsEarned' }
)

export type SharedUpgradeWallet = z.infer<typeof SharedUpgradeWalletSchema>

export const UpgradeWalletSubmissionSchema = z.object({
  playerId: z.string().regex(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
  wallet: SharedUpgradeWalletSchema
})

export type UpgradeWalletSubmission = z.infer<typeof UpgradeWalletSubmissionSchema>

export type UpgradeWalletGetResponse = {
  wallet: UpgradeWallet | null
  unavailable: boolean
}

export type UpgradeWalletPostResponse =
  | { ok: true; wallet: UpgradeWallet; unavailable: false }
  | { ok: false; error: string }

export type UpgradeWalletKv = {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: string) => Promise<unknown>
  incr: (key: string) => Promise<number>
  expire: (key: string, seconds: number) => Promise<unknown>
}

export function sanitizeWalletSubmission(input: unknown): UpgradeWalletSubmission | null {
  const parsed = UpgradeWalletSubmissionSchema.safeParse(input)
  return parsed.success ? parsed.data : null
}

// Merge two wallets element-wise by taking the maximum of each field. A
// successful purchase or kill never decreases any field, so the merge
// preserves every gain from either side. If a tampered client pushes a
// regressed payload (e.g. trying to lower the server's totalCreditsEarned
// to refresh an upgrade gate), the server's record wins. A new stat
// added to `UpgradeTierState` will fail this function's structural typing
// at compile time, so missing-field defense is left to the type system.
export function mergeWallets(a: SharedUpgradeWallet, b: SharedUpgradeWallet): SharedUpgradeWallet {
  const tiers: UpgradeTierState = {
    maxHp: Math.max(a.tiers.maxHp, b.tiers.maxHp),
    startingAmmo: Math.max(a.tiers.startingAmmo, b.tiers.startingAmmo),
    weaponDamage: Math.max(a.tiers.weaponDamage, b.tiers.weaponDamage),
    moveSpeed: Math.max(a.tiers.moveSpeed, b.tiers.moveSpeed)
  }
  return {
    credits: Math.max(a.credits, b.credits),
    totalCreditsEarned: Math.max(a.totalCreditsEarned, b.totalCreditsEarned),
    tiers
  }
}

export async function readSharedUpgradeWallet(
  kv: Pick<UpgradeWalletKv, 'get'>,
  key: string
): Promise<SharedUpgradeWallet | null> {
  const raw = await kv.get(key)
  if (raw === null || raw === undefined) {
    return null
  }
  // Upstash sdk auto-parses JSON for some SET shapes but not others;
  // accept either a string or a parsed object so the call site does
  // not have to care.
  let candidate: unknown = raw
  if (typeof raw === 'string') {
    try {
      candidate = JSON.parse(raw)
    } catch {
      return null
    }
  }
  const parsed = SharedUpgradeWalletSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export async function writeSharedUpgradeWallet(
  kv: Pick<UpgradeWalletKv, 'set'>,
  key: string,
  wallet: SharedUpgradeWallet
): Promise<void> {
  await kv.set(key, JSON.stringify(wallet))
}

// Coerce between the local persistence shape and the schema-validated
// shared shape. They are structurally identical today, but a future
// slice may add transient fields to UpgradeWallet (e.g. last sync
// timestamp) that should not flow over the wire. Centralizing here
// gives us a single seam.
export function toSharedWallet(wallet: UpgradeWallet): SharedUpgradeWallet {
  return {
    credits: wallet.credits,
    totalCreditsEarned: wallet.totalCreditsEarned,
    tiers: { ...wallet.tiers }
  }
}

export function fromSharedWallet(shared: SharedUpgradeWallet): UpgradeWallet {
  return {
    credits: shared.credits,
    totalCreditsEarned: shared.totalCreditsEarned,
    tiers: { ...shared.tiers }
  }
}

export function emptySharedWallet(): SharedUpgradeWallet {
  return toSharedWallet(createUpgradeWallet())
}

export type WalletRateLimitRule = {
  key: string
  limit: number
  windowSec: number
}

export async function hitWalletRateLimit(
  kv: Pick<UpgradeWalletKv, 'incr' | 'expire'>,
  rule: WalletRateLimitRule
): Promise<boolean> {
  // Keep the same fixed-window pattern as `incrementWithExpiry` in
  // vibekit/server but inline it so we can run against the same Pick
  // type the leaderboard uses without depending on the full Redis
  // surface.
  const count = await kv.incr(rule.key)
  if (count === 1) {
    await kv.expire(rule.key, rule.windowSec)
  }
  return count <= rule.limit
}

// Type-erase an Upstash Redis instance to the small surface this lib
// uses. Lets the route code call us without leaking the full Redis
// interface to the browser bundle.
export function asUpgradeWalletKv(kv: Redis): UpgradeWalletKv {
  return kv as unknown as UpgradeWalletKv
}
