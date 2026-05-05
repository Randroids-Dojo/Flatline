import { describe, expect, it } from 'vitest'
import { pickupCue, pickupCueTotalDurationMs } from './pickupCue'

describe('pickupCue', () => {
  it('returns a cue with positive frequencies, gain, and per-tone durations', () => {
    const cue = pickupCue('supply')
    expect(cue.firstFrequency).toBeGreaterThan(0)
    expect(cue.secondFrequency).toBeGreaterThan(0)
    expect(cue.firstDurationMs).toBeGreaterThan(0)
    expect(cue.secondDurationMs).toBeGreaterThan(0)
    expect(cue.gain).toBeGreaterThan(0)
  })

  it('ascends in pitch so the cue reads as a good event, not a warning', () => {
    const cue = pickupCue('supply')
    expect(cue.secondFrequency).toBeGreaterThan(cue.firstFrequency)
  })

  it('uses sine waveform so the cue stays distinct from existing damage and windup cues', () => {
    const cue = pickupCue('supply')
    expect(cue.waveform).toBe('sine')
  })

  it('keeps the total duration short enough to feel like a sparkle, not a melody', () => {
    const cue = pickupCue('supply')
    const total = pickupCueTotalDurationMs(cue)
    expect(total).toBeGreaterThanOrEqual(180)
    expect(total).toBeLessThanOrEqual(320)
  })

  it('keeps gain below the loudest player damage cue (0.05) so combat audio still leads', () => {
    const cue = pickupCue('supply')
    expect(cue.gain).toBeLessThan(0.05)
  })

  it('keeps gain above the loudest enemy windup cue (0.038) so collection cuts through', () => {
    const cue = pickupCue('supply')
    expect(cue.gain).toBeGreaterThan(0.038)
  })

  it('returns stable references for the same kind', () => {
    expect(pickupCue('supply')).toBe(pickupCue('supply'))
  })

  it('defaults unknown kinds to the supply style', () => {
    const supply = pickupCue('supply')
    const unknown = pickupCue('totally-unknown' as 'supply')
    expect(unknown).toBe(supply)
  })
})

describe('pickupCueTotalDurationMs', () => {
  it('sums the per-tone durations', () => {
    const total = pickupCueTotalDurationMs({
      firstFrequency: 100,
      secondFrequency: 200,
      waveform: 'sine',
      firstDurationMs: 90,
      secondDurationMs: 130,
      gain: 0.04
    })
    expect(total).toBe(220)
  })
})
