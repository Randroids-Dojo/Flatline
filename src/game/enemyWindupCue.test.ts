import { describe, expect, it } from 'vitest'
import { enemyWindupCue } from './enemyWindupCue'

describe('enemyWindupCue', () => {
  it('returns a cue with positive frequency, gain, and duration for every enemy type', () => {
    for (const type of ['grunt', 'skitter', 'brute'] as const) {
      const cue = enemyWindupCue(type)
      expect(cue.frequency).toBeGreaterThan(0)
      expect(cue.durationMs).toBeGreaterThan(0)
      expect(cue.gain).toBeGreaterThan(0)
    }
  })

  it('uses a high pitch for the skitter and a low pitch for the brute', () => {
    const skitter = enemyWindupCue('skitter')
    const grunt = enemyWindupCue('grunt')
    const brute = enemyWindupCue('brute')
    expect(skitter.frequency).toBeGreaterThan(grunt.frequency)
    expect(grunt.frequency).toBeGreaterThan(brute.frequency)
  })

  it('makes the brute cue louder than the lighter enemies', () => {
    const skitter = enemyWindupCue('skitter')
    const grunt = enemyWindupCue('grunt')
    const brute = enemyWindupCue('brute')
    expect(brute.gain).toBeGreaterThan(grunt.gain)
    expect(brute.gain).toBeGreaterThan(skitter.gain)
  })

  it('keeps the skitter cue snappy and the brute cue lingering', () => {
    const skitter = enemyWindupCue('skitter')
    const brute = enemyWindupCue('brute')
    expect(skitter.durationMs).toBeLessThan(brute.durationMs)
    expect(skitter.durationMs).toBeLessThanOrEqual(150)
    expect(brute.durationMs).toBeGreaterThanOrEqual(220)
  })

  it('uses distinct waveforms per enemy type for timbre separation', () => {
    const waveforms = new Set(
      (['grunt', 'skitter', 'brute'] as const).map((type) => enemyWindupCue(type).waveform)
    )
    expect(waveforms.size).toBe(3)
  })

  it('keeps every cue duration short enough to feel like a stinger, not a drone', () => {
    for (const type of ['grunt', 'skitter', 'brute'] as const) {
      const { durationMs } = enemyWindupCue(type)
      expect(durationMs).toBeGreaterThanOrEqual(80)
      expect(durationMs).toBeLessThanOrEqual(320)
    }
  })

  it('returns stable references for the same enemy type', () => {
    expect(enemyWindupCue('grunt')).toBe(enemyWindupCue('grunt'))
    expect(enemyWindupCue('skitter')).toBe(enemyWindupCue('skitter'))
    expect(enemyWindupCue('brute')).toBe(enemyWindupCue('brute'))
  })
})
