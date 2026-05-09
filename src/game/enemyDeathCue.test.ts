import { describe, expect, it } from 'vitest'
import { enemyDeathCue } from './enemyDeathCue'

describe('enemyDeathCue', () => {
  const types = ['skitter', 'grunt', 'brute', 'spitter'] as const

  it('returns a cue with positive durations and gains for every enemy type', () => {
    for (const type of types) {
      const cue = enemyDeathCue(type)
      expect(cue.frequencyStart).toBeGreaterThan(0)
      expect(cue.frequencyEnd).toBeGreaterThan(0)
      expect(cue.durationMs).toBeGreaterThan(0)
      expect(cue.gain).toBeGreaterThan(0)
    }
  })

  it('drops in pitch (start above end) so each death reads as a fall', () => {
    for (const type of types) {
      const cue = enemyDeathCue(type)
      expect(cue.frequencyStart).toBeGreaterThan(cue.frequencyEnd)
    }
  })

  it('keeps every cue gain below the loudest player damage cue (0.05)', () => {
    for (const type of types) {
      expect(enemyDeathCue(type).gain).toBeLessThan(0.05)
    }
  })

  it('makes the brute the heaviest of the four (longest duration, lowest pitch)', () => {
    const brute = enemyDeathCue('brute')
    const skitter = enemyDeathCue('skitter')
    expect(brute.durationMs).toBeGreaterThan(skitter.durationMs)
    expect(brute.frequencyStart).toBeLessThan(skitter.frequencyStart)
    expect(brute.gain).toBeGreaterThan(skitter.gain)
  })

  it('uses different waveforms across types so simultaneous deaths stay distinguishable', () => {
    const waveforms = new Set(types.map((type) => enemyDeathCue(type).waveform))
    expect(waveforms.size).toBeGreaterThanOrEqual(2)
  })

  it('returns stable references for the same type', () => {
    expect(enemyDeathCue('grunt')).toBe(enemyDeathCue('grunt'))
    expect(enemyDeathCue('brute')).toBe(enemyDeathCue('brute'))
  })

  it('defaults unknown types to the grunt style', () => {
    const grunt = enemyDeathCue('grunt')
    const unknown = enemyDeathCue('unknown' as 'grunt')
    expect(unknown).toBe(grunt)
  })
})
