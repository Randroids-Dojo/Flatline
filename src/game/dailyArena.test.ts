import { describe, expect, it } from 'vitest'
import { applyDailySpawnOffset, createDailyArenaConfig } from './dailyArena'

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
})
