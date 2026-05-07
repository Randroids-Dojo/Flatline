import { enemyTypeForSpawn, type EnemyType } from './enemies'
import type { HazardKind } from './hazards'

export type DailyArenaConfig = {
  seed: string
  hazardOffsetMs: number
  spawnTypeOffset: number
  supplyCooldownMs: number
  modifier: DailyModifier
}

export type DailyModifierId = 'scoreRush' | 'pressureWave' | 'thinSupplies' | 'cleanKills'

export type DailyModifier = {
  id: DailyModifierId
  label: string
  description: string
  cadenceScale: number
  killScoreMultiplier: number
  supplyCooldownScale: number
}

export type DailySpawnPreview = {
  spawnNumber: number
  enemyType: EnemyType
}

export type DailyHazardPreview = {
  kind: HazardKind
  firstWarningMs: number
  cycleMs: number
  activeMs: number
}

export type DailySchedulePreview = {
  seed: string
  modifier: DailyModifier
  spawnTypeOffset: number
  supplyCooldownMs: number
  hazardOffsetMs: number
  spawnOrder: DailySpawnPreview[]
  hazards: DailyHazardPreview[]
}

export const dailyModifiers: readonly DailyModifier[] = [
  {
    id: 'scoreRush',
    label: 'Score Rush',
    description: 'All kills score 15% more, but pressure arrives 8% faster.',
    cadenceScale: 0.92,
    killScoreMultiplier: 1.15,
    supplyCooldownScale: 1
  },
  {
    id: 'pressureWave',
    label: 'Pressure Wave',
    description: 'Spawns arrive 14% faster. The daily board rewards survival under heat.',
    cadenceScale: 0.86,
    killScoreMultiplier: 1.08,
    supplyCooldownScale: 1
  },
  {
    id: 'thinSupplies',
    label: 'Thin Supplies',
    description: 'Supply pickups take 20% longer to rearm, with a 12% kill score bonus.',
    cadenceScale: 1,
    killScoreMultiplier: 1.12,
    supplyCooldownScale: 1.2
  },
  {
    id: 'cleanKills',
    label: 'Clean Kills',
    description: 'Kills score 10% more and supply timing stays normal.',
    cadenceScale: 1,
    killScoreMultiplier: 1.1,
    supplyCooldownScale: 1
  }
]

const hazardPreviewContracts: Array<Omit<DailyHazardPreview, 'firstWarningMs'>> = [
  { kind: 'flameLane', cycleMs: 18000, activeMs: 2600 },
  { kind: 'inkPool', cycleMs: 26000, activeMs: 4200 },
  { kind: 'fallingLight', cycleMs: 32000, activeMs: 900 }
]

export function createDailyArenaConfig(seed: string): DailyArenaConfig {
  const hash = hashSeed(seed)
  const modifier = dailyModifierForHash(Math.floor(hash / 31))
  const baseSupplyCooldownMs = 7000 + (Math.floor(hash / 17) % 5000)

  return {
    seed,
    hazardOffsetMs: 1000 + (hash % 9000),
    spawnTypeOffset: Math.floor(hash / 7) % 5,
    supplyCooldownMs: Math.round(baseSupplyCooldownMs * modifier.supplyCooldownScale),
    modifier
  }
}

export function createDailySchedulePreview(config: DailyArenaConfig, spawnCount = 8): DailySchedulePreview {
  return {
    seed: config.seed,
    modifier: config.modifier,
    spawnTypeOffset: config.spawnTypeOffset,
    supplyCooldownMs: config.supplyCooldownMs,
    hazardOffsetMs: config.hazardOffsetMs,
    spawnOrder: Array.from({ length: spawnCount }, (_, index) => ({
      spawnNumber: index + 1,
      enemyType: enemyTypeForSpawn(applyDailySpawnOffset(index + 1, config))
    })),
    hazards: hazardPreviewContracts.map((hazard) => ({
      ...hazard,
      firstWarningMs: firstWarningMsForHazard(config.hazardOffsetMs, hazard.cycleMs)
    }))
  }
}

export function applyDailySpawnOffset(spawnCount: number, config: DailyArenaConfig | null): number {
  return spawnCount + (config?.spawnTypeOffset ?? 0)
}

export function dailyCadenceScale(config: DailyArenaConfig | null): number {
  return config?.modifier.cadenceScale ?? 1
}

export function dailyKillScoreMultiplier(config: DailyArenaConfig | null): number {
  return config?.modifier.killScoreMultiplier ?? 1
}

export function dailyModifierForHash(hash: number): DailyModifier {
  return dailyModifiers[positiveModulo(hash, dailyModifiers.length)]
}

function firstWarningMsForHazard(hazardOffsetMs: number, cycleMs: number): number {
  return positiveModulo(cycleMs - hazardOffsetMs, cycleMs)
}

function hashSeed(seed: string): number {
  let hash = 2166136261

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}
