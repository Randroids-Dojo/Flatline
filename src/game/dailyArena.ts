import { enemyTypeForSpawn, type EnemyType } from './enemies'
import type { HazardKind } from './hazards'

export type DailyArenaConfig = {
  seed: string
  hazardOffsetMs: number
  spawnTypeOffset: number
  supplyCooldownMs: number
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
  spawnTypeOffset: number
  supplyCooldownMs: number
  hazardOffsetMs: number
  spawnOrder: DailySpawnPreview[]
  hazards: DailyHazardPreview[]
}

const hazardPreviewContracts: Array<Omit<DailyHazardPreview, 'firstWarningMs'>> = [
  { kind: 'flameLane', cycleMs: 18000, activeMs: 2600 },
  { kind: 'inkPool', cycleMs: 26000, activeMs: 4200 },
  { kind: 'fallingLight', cycleMs: 32000, activeMs: 900 }
]

export function createDailyArenaConfig(seed: string): DailyArenaConfig {
  const hash = hashSeed(seed)

  return {
    seed,
    hazardOffsetMs: 1000 + (hash % 9000),
    spawnTypeOffset: Math.floor(hash / 7) % 5,
    supplyCooldownMs: 7000 + (Math.floor(hash / 17) % 5000)
  }
}

export function createDailySchedulePreview(config: DailyArenaConfig, spawnCount = 8): DailySchedulePreview {
  return {
    seed: config.seed,
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
