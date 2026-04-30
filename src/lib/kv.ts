import { Redis } from '@upstash/redis'

function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function hasKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

let kv: Redis | null = null

export function getKv(): Redis {
  if (!kv) {
    kv = new Redis({
      url: requireEnv('KV_REST_API_URL'),
      token: requireEnv('KV_REST_API_TOKEN')
    })
  }

  return kv
}

export const kvKeys = {
  leaderboardAll: () => 'flatline:leaderboard:all',
  leaderboardDaily: (date: string) => `flatline:leaderboard:daily:${date}`,
  ratelimitIp: (ip: string) => `flatline:ratelimit:submit:ip:${ip}`,
  ratelimitDaily: (ip: string) => `flatline:ratelimit:submit:daily:${ip}`
} as const
