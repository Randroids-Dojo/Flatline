import { describe, expect, it } from 'vitest'
import { playerDamageCue } from './playerDamageCue'

describe('playerDamageCue', () => {
  it('returns a cue with positive frequency, gain, and duration for every source', () => {
    for (const source of ['enemy', 'hazard'] as const) {
      const cue = playerDamageCue(source)
      expect(cue.frequency).toBeGreaterThan(0)
      expect(cue.durationMs).toBeGreaterThan(0)
      expect(cue.gain).toBeGreaterThan(0)
    }
  })

  it('uses distinct waveforms per source so overlapping cues stay separable', () => {
    const enemy = playerDamageCue('enemy')
    const hazard = playerDamageCue('hazard')
    expect(enemy.waveform).not.toBe(hazard.waveform)
  })

  it('keeps every cue duration short enough to feel like a stinger, not a drone', () => {
    for (const source of ['enemy', 'hazard'] as const) {
      const { durationMs } = playerDamageCue(source)
      expect(durationMs).toBeGreaterThanOrEqual(120)
      expect(durationMs).toBeLessThanOrEqual(260)
    }
  })

  it('cuts through other SFX with a gain higher than the loudest enemy windup cue (0.038)', () => {
    for (const source of ['enemy', 'hazard'] as const) {
      const { gain } = playerDamageCue(source)
      expect(gain).toBeGreaterThan(0.038)
    }
  })

  it('keeps the enemy hit pitch below the grunt windup pitch (340 Hz) so a windup-then-hit sequence falls', () => {
    const enemy = playerDamageCue('enemy')
    expect(enemy.frequency).toBeLessThan(340)
  })

  it('returns stable references for the same source', () => {
    expect(playerDamageCue('enemy')).toBe(playerDamageCue('enemy'))
    expect(playerDamageCue('hazard')).toBe(playerDamageCue('hazard'))
  })

  it('defaults unknown sources to the enemy style', () => {
    const enemy = playerDamageCue('enemy')
    const unknown = playerDamageCue('totally-unknown' as 'enemy')
    expect(unknown).toBe(enemy)
  })
})
