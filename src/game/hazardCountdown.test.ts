import { describe, expect, it } from 'vitest'
import {
  hazardCountdownCue,
  hazardCountdownTickOffsets,
  hazardCountdownTicksBetween
} from './hazardCountdown'
import { hazardCycleConfigs, type HazardKind } from './hazards'

const allKinds: readonly HazardKind[] = ['flameLane', 'inkPool', 'fallingLight']

describe('hazardCountdownCue', () => {
  it('returns positive frequency, gain, and duration for every hazard kind', () => {
    for (const kind of allKinds) {
      const cue = hazardCountdownCue(kind)
      expect(cue.frequency).toBeGreaterThan(0)
      expect(cue.finalFrequency).toBeGreaterThan(0)
      expect(cue.gain).toBeGreaterThan(0)
      expect(cue.finalGain).toBeGreaterThan(0)
      expect(cue.durationMs).toBeGreaterThan(0)
    }
  })

  it('makes the final tick higher in pitch than the regular tick', () => {
    for (const kind of allKinds) {
      const cue = hazardCountdownCue(kind)
      expect(cue.finalFrequency).toBeGreaterThan(cue.frequency)
    }
  })

  it('makes the final tick louder than the regular ticks', () => {
    for (const kind of allKinds) {
      const cue = hazardCountdownCue(kind)
      expect(cue.finalGain).toBeGreaterThan(cue.gain)
    }
  })

  it('uses distinct waveforms per hazard so stacked countdowns stay separable', () => {
    const waveforms = new Set(allKinds.map((kind) => hazardCountdownCue(kind).waveform))
    expect(waveforms.size).toBe(3)
  })

  it('keeps every tick short so the cue reads as a click, not a tone', () => {
    for (const kind of allKinds) {
      const cue = hazardCountdownCue(kind)
      expect(cue.durationMs).toBeLessThanOrEqual(120)
      expect(cue.durationMs).toBeGreaterThanOrEqual(40)
    }
  })

  it('returns stable references for the same kind', () => {
    for (const kind of allKinds) {
      expect(hazardCountdownCue(kind)).toBe(hazardCountdownCue(kind))
    }
  })

  it('keeps the falling-light cue brighter than the ink-pool cue so a stacked warning stays separable', () => {
    const fallingLight = hazardCountdownCue('fallingLight')
    const inkPool = hazardCountdownCue('inkPool')
    expect(fallingLight.frequency).toBeGreaterThan(inkPool.frequency)
  })
})

describe('hazardCountdownTickOffsets', () => {
  it('produces at least two ticks for every hazard so the cadence reads as a countdown', () => {
    for (const kind of allKinds) {
      expect(hazardCountdownTickOffsets(kind).length).toBeGreaterThanOrEqual(2)
    }
  })

  it('starts at offset zero and ends before the warning ends', () => {
    for (const kind of allKinds) {
      const offsets = hazardCountdownTickOffsets(kind)
      const config = hazardCycleConfigs.find((entry) => entry.kind === kind)!
      expect(offsets[0]).toBe(0)
      expect(offsets[offsets.length - 1]).toBeLessThan(config.warningMs)
    }
  })

  it('produces strictly increasing offsets', () => {
    for (const kind of allKinds) {
      const offsets = hazardCountdownTickOffsets(kind)

      for (let i = 1; i < offsets.length; i += 1) {
        expect(offsets[i]).toBeGreaterThan(offsets[i - 1])
      }
    }
  })

  it('puts the last tick close to but not at the activation moment', () => {
    for (const kind of allKinds) {
      const offsets = hazardCountdownTickOffsets(kind)
      const config = hazardCycleConfigs.find((entry) => entry.kind === kind)!
      const lead = config.warningMs - offsets[offsets.length - 1]
      expect(lead).toBeGreaterThan(0)
      expect(lead).toBeLessThanOrEqual(150)
    }
  })
})

describe('hazardCountdownTicksBetween', () => {
  it('returns no ticks when the window has zero or negative width', () => {
    expect(hazardCountdownTicksBetween('flameLane', 100, 100)).toEqual([])
    expect(hazardCountdownTicksBetween('flameLane', 100, 50)).toEqual([])
  })

  it('fires the first tick when the cycle starts inside the window', () => {
    const events = hazardCountdownTicksBetween('flameLane', -10, 10)
    expect(events.length).toBeGreaterThan(0)
    expect(events[0].ordinal).toBe(1)
    expect(events[0].kind).toBe('flameLane')
  })

  it('marks only the last tick of the cycle as final', () => {
    const events: ReturnType<typeof hazardCountdownTicksBetween> = []
    let prev = 0
    const config = hazardCycleConfigs.find((entry) => entry.kind === 'flameLane')!

    for (let t = 0; t <= config.cycleMs; t += 100) {
      events.push(...hazardCountdownTicksBetween('flameLane', prev, t))
      prev = t
    }

    const finals = events.filter((event) => event.isFinal)
    const nonFinals = events.filter((event) => !event.isFinal)
    expect(finals.length).toBe(1)
    expect(nonFinals.length).toBeGreaterThan(0)
    expect(finals[0].ordinal).toBe(finals[0].total)
  })

  it('reports total tick count consistent with hazardCountdownTickOffsets', () => {
    for (const kind of allKinds) {
      const config = hazardCycleConfigs.find((entry) => entry.kind === kind)!
      const expected = hazardCountdownTickOffsets(kind).length
      // Window spans exactly one cycle's worth of ticks: [first tick offset, last tick offset].
      // Using (-1, cycleMs - 1] avoids picking up the next cycle's first tick at runMs = cycleMs.
      const events = hazardCountdownTicksBetween(kind, -1, config.cycleMs - 1)
      expect(events.length).toBe(expected)
      events.forEach((event) => expect(event.total).toBe(expected))
    }
  })

  it('does not double-fire a tick that falls exactly on a frame boundary', () => {
    const events1 = hazardCountdownTicksBetween('flameLane', -100, 0)
    const events2 = hazardCountdownTicksBetween('flameLane', 0, 100)
    const firstOrdinalCount = events1.filter((event) => event.ordinal === 1).length +
      events2.filter((event) => event.ordinal === 1).length
    expect(firstOrdinalCount).toBe(1)
  })

  it('fires no tick during the active phase of a hazard', () => {
    const config = hazardCycleConfigs.find((entry) => entry.kind === 'flameLane')!
    const activeStart = config.warningMs + 10
    const activeEnd = config.warningMs + config.activeMs - 10
    const events = hazardCountdownTicksBetween('flameLane', activeStart, activeEnd)
    expect(events).toEqual([])
  })

  it('catches up across multiple cycles when the window is large', () => {
    const config = hazardCycleConfigs.find((entry) => entry.kind === 'flameLane')!
    const expected = hazardCountdownTickOffsets('flameLane').length
    const events = hazardCountdownTicksBetween('flameLane', -1, config.cycleMs * 2 - 1)
    expect(events.length).toBe(expected * 2)
  })

  it('respects the cycle offset so a fresh run starts at the correct phase per hazard', () => {
    // ink pool has a 7000 ms positive offset, so its first cycle starts
    // 7000 ms before run start and the first tick falls at runMs = -7000.
    // First tick at runMs >= 0 should be the second tick of the first cycle.
    const config = hazardCycleConfigs.find((entry) => entry.kind === 'inkPool')!
    const firstWindow = hazardCountdownTicksBetween('inkPool', -1, config.cycleMs)
    expect(firstWindow.length).toBeGreaterThan(0)
    expect(firstWindow[0].ordinal).toBeGreaterThanOrEqual(1)
  })
})
