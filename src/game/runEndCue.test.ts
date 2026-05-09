import { describe, expect, it } from 'vitest'
import { runEndCue, runEndCueTotalDurationMs } from './runEndCue'

describe('runEndCue', () => {
  it('returns three descending tones so the sting reads as a fall arpeggio', () => {
    const cue = runEndCue()
    expect(cue.tones).toHaveLength(3)
    expect(cue.tones[0].frequency).toBeGreaterThan(cue.tones[1].frequency)
    expect(cue.tones[1].frequency).toBeGreaterThan(cue.tones[2].frequency)
  })

  it('uses sawtooth so the timbre cuts through residual layer noise', () => {
    expect(runEndCue().waveform).toBe('sawtooth')
  })

  it('keeps every tone gain at or below the loudest player damage cue (0.05)', () => {
    for (const tone of runEndCue().tones) {
      expect(tone.gain).toBeLessThanOrEqual(0.05)
      expect(tone.gain).toBeGreaterThan(0)
    }
  })

  it('makes each subsequent tone quieter than the first (the sting decays away)', () => {
    const tones = runEndCue().tones
    expect(tones[1].gain).toBeLessThan(tones[0].gain)
    expect(tones[2].gain).toBeLessThan(tones[1].gain)
  })

  it('keeps every tone frequency below the music bass throb baseline so the sting sits low', () => {
    for (const tone of runEndCue().tones) {
      expect(tone.frequency).toBeLessThanOrEqual(400)
      expect(tone.frequency).toBeGreaterThan(60)
    }
  })

  it('matches the exact tuning so a drift fails this test', () => {
    expect(runEndCue()).toEqual({
      waveform: 'sawtooth',
      tones: [
        { frequency: 320, durationMs: 240, gain: 0.05 },
        { frequency: 200, durationMs: 240, gain: 0.045 },
        { frequency: 110, durationMs: 360, gain: 0.04 }
      ]
    })
  })

  it('returns stable references across calls', () => {
    expect(runEndCue()).toBe(runEndCue())
  })

  it('freezes the style and tones so a downstream consumer cannot mutate shared tuning', () => {
    expect(Object.isFrozen(runEndCue())).toBe(true)
    expect(Object.isFrozen(runEndCue().tones)).toBe(true)
    for (const tone of runEndCue().tones) {
      expect(Object.isFrozen(tone)).toBe(true)
    }
  })
})

describe('runEndCueTotalDurationMs', () => {
  it('sums every tone duration', () => {
    expect(runEndCueTotalDurationMs(runEndCue())).toBe(840)
  })

  it('keeps the total below 1.5 s so the sting feels like an end, not a song', () => {
    expect(runEndCueTotalDurationMs(runEndCue())).toBeLessThan(1500)
  })
})
