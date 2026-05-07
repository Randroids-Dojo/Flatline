import { describe, expect, it } from 'vitest'
import {
  applyDailySpawnOffset,
  createDailyArenaConfig,
  createDailySchedulePreview,
  dailyCadenceScale,
  dailyKillScoreMultiplier,
  dailyModifierForHash,
  dailyModifiers
} from './dailyArena'

describe('daily arena config', () => {
  it('creates stable config for the same seed', () => {
    expect(createDailyArenaConfig('flatline-20260430')).toEqual(createDailyArenaConfig('flatline-20260430'))
  })

  it('varies config across seeds', () => {
    expect(createDailyArenaConfig('flatline-20260430')).not.toEqual(createDailyArenaConfig('flatline-20260501'))
  })

  it('offsets spawn rotation for daily mode only', () => {
    const config = createDailyArenaConfig('flatline-20260430')

    expect(applyDailySpawnOffset(3, config)).toBe(3 + config.spawnTypeOffset)
    expect(applyDailySpawnOffset(3, null)).toBe(3)
  })

  it('creates a deterministic schedule preview from the daily config', () => {
    const config = createDailyArenaConfig('flatline-20260430')
    const preview = createDailySchedulePreview(config, 6)

    expect(preview).toEqual(createDailySchedulePreview(config, 6))
    expect(preview.seed).toBe(config.seed)
    expect(preview.modifier).toBe(config.modifier)
    expect(preview.spawnOrder).toHaveLength(6)
    expect(preview.spawnOrder.map((spawn) => spawn.spawnNumber)).toEqual([1, 2, 3, 4, 5, 6])
    expect(preview.hazards.map((hazard) => hazard.kind)).toEqual(['flameLane', 'inkPool', 'fallingLight'])
    expect(preview.hazards.every((hazard) => hazard.firstWarningMs >= 0 && hazard.firstWarningMs < hazard.cycleMs)).toBe(true)
  })

  it('selects daily modifiers deterministically from a hash', () => {
    expect(dailyModifierForHash(0)).toBe(dailyModifiers[0])
    expect(dailyModifierForHash(1)).toBe(dailyModifiers[1])
    expect(dailyModifierForHash(dailyModifiers.length)).toBe(dailyModifiers[0])
    expect(dailyModifierForHash(-1)).toBe(dailyModifiers[dailyModifiers.length - 1])
  })

  it('exposes neutral modifier values outside daily mode', () => {
    expect(dailyCadenceScale(null)).toBe(1)
    expect(dailyKillScoreMultiplier(null)).toBe(1)
  })

  it('applies modifier tuning to daily helpers', () => {
    const modifier = dailyModifierForHash(2)
    const config = createDailyArenaConfig('flatline-20260506')
    const tunedConfig = { ...config, modifier }

    expect(dailyCadenceScale(tunedConfig)).toBe(modifier.cadenceScale)
    expect(dailyKillScoreMultiplier(tunedConfig)).toBe(modifier.killScoreMultiplier)
  })

  it('bakes modifier.supplyCooldownScale into config.supplyCooldownMs', () => {
    const config = createDailyArenaConfig('flatline-20260430')
    // Back-derive the base cooldown; it must fall in [7000, 12000) regardless of scale.
    const estimatedBase = config.supplyCooldownMs / config.modifier.supplyCooldownScale
    expect(estimatedBase).toBeGreaterThanOrEqual(7000 - 1)
    expect(estimatedBase).toBeLessThan(12000 + 1)
  })
})
