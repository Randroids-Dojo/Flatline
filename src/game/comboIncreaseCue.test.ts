import { describe, expect, it } from 'vitest'
import { comboIncreaseCue, shouldPlayComboIncreaseCue } from './comboIncreaseCue'

describe('comboIncreaseCue', () => {
  it('returns positive frequency, duration, and gain for any combo level', () => {
    for (const combo of [1, 2, 3, 7, 12, 25, 100]) {
      const cue = comboIncreaseCue(combo)
      expect(cue.frequency).toBeGreaterThan(0)
      expect(cue.durationMs).toBeGreaterThan(0)
      expect(cue.gain).toBeGreaterThan(0)
    }
  })

  it('rises in pitch as the streak grows so the build reads as ascent', () => {
    expect(comboIncreaseCue(2).frequency).toBeGreaterThan(comboIncreaseCue(1).frequency)
    expect(comboIncreaseCue(8).frequency).toBeGreaterThan(comboIncreaseCue(2).frequency)
  })

  it('caps the pitch so very long streaks do not climb past audible sweet spots', () => {
    const cue = comboIncreaseCue(200)
    expect(cue.frequency).toBeLessThanOrEqual(720)
  })

  it('uses sine so the tick stays distinct from the sawtooth milestone cues', () => {
    expect(comboIncreaseCue(3).waveform).toBe('sine')
  })

  it('keeps gain well below the loudest milestone cue (0.074)', () => {
    expect(comboIncreaseCue(1).gain).toBeLessThan(0.074)
  })

  it('returns frozen style objects so a downstream consumer cannot mutate shared tuning', () => {
    expect(Object.isFrozen(comboIncreaseCue(1))).toBe(true)
  })

  it('clamps below combo 1 (e.g. combo 0) to the base frequency', () => {
    expect(comboIncreaseCue(0).frequency).toBe(comboIncreaseCue(1).frequency)
  })
})

describe('shouldPlayComboIncreaseCue', () => {
  it('fires when combo grows and no milestone was crossed', () => {
    expect(shouldPlayComboIncreaseCue(2, 3, null)).toBe(true)
  })

  it('does not fire when combo did not grow', () => {
    expect(shouldPlayComboIncreaseCue(3, 3, null)).toBe(false)
  })

  it('does not fire when combo dropped (streak reset)', () => {
    expect(shouldPlayComboIncreaseCue(7, 0, null)).toBe(false)
  })

  it('does not fire when a milestone cue is taking the same kill', () => {
    expect(shouldPlayComboIncreaseCue(4, 5, 5)).toBe(false)
    expect(shouldPlayComboIncreaseCue(9, 10, 10)).toBe(false)
  })
})
