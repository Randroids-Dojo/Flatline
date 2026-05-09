import { describe, expect, it } from 'vitest'
import { enemyDeathCue } from './enemyDeathCue'
import { enemyHurtCue } from './enemyHurtCue'

describe('enemyHurtCue', () => {
  const types = ['skitter', 'grunt', 'brute', 'spitter'] as const
  const expected = {
    skitter: { frequency: 620, waveform: 'triangle', durationMs: 60, gain: 0.018 },
    grunt: { frequency: 380, waveform: 'square', durationMs: 80, gain: 0.022 },
    brute: { frequency: 220, waveform: 'sawtooth', durationMs: 110, gain: 0.03 },
    spitter: { frequency: 480, waveform: 'triangle', durationMs: 90, gain: 0.024 }
  } as const

  it('matches the exact per-type hurt-cue tuning', () => {
    for (const type of types) {
      expect(enemyHurtCue(type)).toEqual(expected[type])
    }
  })

  it('returns positive frequency, duration, and gain for every enemy type', () => {
    for (const type of types) {
      const cue = enemyHurtCue(type)
      expect(cue.frequency).toBeGreaterThan(0)
      expect(cue.durationMs).toBeGreaterThan(0)
      expect(cue.gain).toBeGreaterThan(0)
    }
  })

  it('keeps every gain below the loudest player damage cue (0.05)', () => {
    for (const type of types) {
      expect(enemyHurtCue(type).gain).toBeLessThan(0.05)
    }
  })

  it('makes the brute the heaviest hurt cue (longest, lowest, loudest)', () => {
    const brute = enemyHurtCue('brute')
    const skitter = enemyHurtCue('skitter')
    expect(brute.durationMs).toBeGreaterThan(skitter.durationMs)
    expect(brute.frequency).toBeLessThan(skitter.frequency)
    expect(brute.gain).toBeGreaterThan(skitter.gain)
  })

  it('mirrors the death cue waveform per type so the timbre stays consistent', () => {
    for (const type of types) {
      expect(enemyHurtCue(type).waveform).toBe(enemyDeathCue(type).waveform)
    }
  })

  it('stays shorter and quieter than the corresponding death cue per type', () => {
    for (const type of types) {
      const hurt = enemyHurtCue(type)
      const death = enemyDeathCue(type)
      expect(hurt.durationMs).toBeLessThan(death.durationMs)
      expect(hurt.gain).toBeLessThan(death.gain)
    }
  })

  it('returns stable references for the same type', () => {
    expect(enemyHurtCue('grunt')).toBe(enemyHurtCue('grunt'))
  })

  it('defaults unknown types to the grunt style', () => {
    const grunt = enemyHurtCue('grunt')
    const unknown = enemyHurtCue('unknown' as 'grunt')
    expect(unknown).toBe(grunt)
  })
})
