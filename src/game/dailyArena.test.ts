import { describe, expect, it } from 'vitest'
import { applyDailySpawnOffset, createDailyArenaConfig, createDailySchedulePreview } from './dailyArena'

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
    expect(preview.spawnOrder).toHaveLength(6)
    expect(preview.spawnOrder.map((spawn) => spawn.spawnNumber)).toEqual([1, 2, 3, 4, 5, 6])
    expect(preview.hazards.map((hazard) => hazard.kind)).toEqual(['flameLane', 'inkPool', 'fallingLight'])
    expect(preview.hazards.every((hazard) => hazard.firstWarningMs >= 0 && hazard.firstWarningMs < hazard.cycleMs)).toBe(true)
  })
})
