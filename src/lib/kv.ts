import type { Redis } from '@upstash/redis'
import { getKv as getKvFromVibekit } from '@randroids-dojo/vibekit/server'

export function hasKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

export function getKv(): Redis {
  const kv = getKvFromVibekit()

  if (!kv) {
    throw new Error('Missing required environment variable: KV_REST_API_URL or KV_REST_API_TOKEN')
  }

  return kv
}

export const kvKeys = {
  leaderboardAll: () => 'flatline:leaderboard:all',
  leaderboardDaily: (date: string) => `flatline:leaderboard:daily:${date}`,
  ratelimitIp: (ip: string) => `flatline:ratelimit:submit:ip:${ip}`,
  ratelimitDaily: (ip: string) => `flatline:ratelimit:submit:daily:${ip}`,
  upgradeWallet: (playerId: string) => `flatline:wallet:${playerId}`,
  ratelimitWalletIp: (ip: string) => `flatline:ratelimit:wallet:ip:${ip}`
} as const
