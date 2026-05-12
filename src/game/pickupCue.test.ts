import { describe, expect, it } from 'vitest'
import { pickupCue, pickupCueTotalDurationMs, type PickupKind } from './pickupCue'

const ALL_KINDS: readonly PickupKind[] = ['supply', 'ammo-shell', 'ammo-cell']

describe('pickupCue (all kinds)', () => {
  it('every kind ascends in pitch so the cue reads as a good event, not a warning', () => {
    for (const kind of ALL_KINDS) {
      const cue = pickupCue(kind)
      expect(cue.secondFrequency).toBeGreaterThan(cue.firstFrequency)
    }
  })

  it('every kind keeps gain under the loudest player damage cue (0.05) so combat audio leads', () => {
    for (const kind of ALL_KINDS) {
      expect(pickupCue(kind).gain).toBeLessThan(0.05)
    }
  })

  it('every kind fires within a sparkle-length window so back-to-back pickups do not stack', () => {
    for (const kind of ALL_KINDS) {
      const cue = pickupCue(kind)
      expect(pickupCueTotalDurationMs(cue)).toBeLessThanOrEqual(320)
    }
  })

  it('returns stable references for each kind so the audio scheduler can rely on identity', () => {
    for (const kind of ALL_KINDS) {
      expect(pickupCue(kind)).toBe(pickupCue(kind))
    }
  })

  it('uses a distinct waveform per kind so shells, cells, and supply do not sound identical', () => {
    const waveforms = new Set(ALL_KINDS.map((kind) => pickupCue(kind).waveform))
    expect(waveforms.size).toBe(ALL_KINDS.length)
  })

  it('routes shell and cell kinds to distinct frequency centers so the player can tell shells from cells by ear', () => {
    expect(pickupCue('ammo-shell').firstFrequency).not.toBe(pickupCue('ammo-cell').firstFrequency)
  })
})

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
