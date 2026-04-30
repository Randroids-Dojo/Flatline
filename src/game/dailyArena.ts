export type DailyArenaConfig = {
  seed: string
  hazardOffsetMs: number
  spawnTypeOffset: number
  supplyCooldownMs: number
}

export function createDailyArenaConfig(seed: string): DailyArenaConfig {
  const hash = hashSeed(seed)

  return {
    seed,
    hazardOffsetMs: 1000 + (hash % 9000),
    spawnTypeOffset: Math.floor(hash / 7) % 5,
    supplyCooldownMs: 7000 + (Math.floor(hash / 17) % 5000)
  }
}

export function applyDailySpawnOffset(spawnCount: number, config: DailyArenaConfig | null): number {
  return spawnCount + (config?.spawnTypeOffset ?? 0)
}

function hashSeed(seed: string): number {
  let hash = 2166136261

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}
