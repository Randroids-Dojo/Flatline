import { describe, expect, it } from 'vitest'

import {
  WAVE_LULL_MS,
  WAVE_PEAK_MS,
  WAVE_SURGE_MS,
  WAVE_TOTAL_MS,
  encounterWaveSignal,
  peakStartedBetween
} from './encounterWave'

describe('wave constants', () => {
  it('totals 50 s across lull (25), surge (18), and peak (7)', () => {
    expect(WAVE_LULL_MS).toBe(25_000)
    expect(WAVE_SURGE_MS).toBe(18_000)
    expect(WAVE_PEAK_MS).toBe(7_000)
    expect(WAVE_TOTAL_MS).toBe(50_000)
  })
})

describe('encounterWaveSignal', () => {
  it('starts in lull at run start', () => {
    const signal = encounterWaveSignal(0)
    expect(signal.phase).toBe('lull')
    expect(signal.targetDelta).toBe(0)
    expect(signal.cadenceScale).toBe(1)
  })

  it('stays in lull through the entire 25 s lull window', () => {
    expect(encounterWaveSignal(WAVE_LULL_MS - 1).phase).toBe('lull')
  })

  it('flips to surge at the lull / surge boundary', () => {
    const signal = encounterWaveSignal(WAVE_LULL_MS)
    expect(signal.phase).toBe('surge')
    expect(signal.targetDelta).toBe(1)
    expect(signal.cadenceScale).toBeCloseTo(0.75, 5)
  })

  it('stays in surge through the 18 s surge window', () => {
    expect(encounterWaveSignal(WAVE_LULL_MS + WAVE_SURGE_MS - 1).phase).toBe('surge')
  })

  it('flips to peak at the surge / peak boundary', () => {
    const signal = encounterWaveSignal(WAVE_LULL_MS + WAVE_SURGE_MS)
    expect(signal.phase).toBe('peak')
    expect(signal.targetDelta).toBe(2)
    expect(signal.cadenceScale).toBeCloseTo(0.55, 5)
  })

  it('stays in peak through the 7 s peak window', () => {
    expect(encounterWaveSignal(WAVE_LULL_MS + WAVE_SURGE_MS + WAVE_PEAK_MS - 1).phase).toBe('peak')
  })

  it('cycles back to lull at the wave boundary (50 s)', () => {
    const signal = encounterWaveSignal(WAVE_TOTAL_MS)
    expect(signal.phase).toBe('lull')
    expect(signal.targetDelta).toBe(0)
  })

  it('cycles correctly across multiple wave cycles', () => {
    expect(encounterWaveSignal(WAVE_TOTAL_MS + WAVE_LULL_MS).phase).toBe('surge')
    expect(encounterWaveSignal(WAVE_TOTAL_MS + WAVE_LULL_MS + WAVE_SURGE_MS).phase).toBe('peak')
    expect(encounterWaveSignal(2 * WAVE_TOTAL_MS).phase).toBe('lull')
  })

  it('returns lull when runMs is negative (clock skew safety)', () => {
    expect(encounterWaveSignal(-100).phase).toBe('lull')
  })
})

describe('peakStartedBetween', () => {
  it('is false when both ticks are inside lull', () => {
    expect(peakStartedBetween(0, 1000)).toBe(false)
  })

  it('is false when both ticks are inside surge', () => {
    expect(peakStartedBetween(WAVE_LULL_MS + 100, WAVE_LULL_MS + 5000)).toBe(false)
  })

  it('is false when both ticks are inside peak (the boundary already passed)', () => {
    const peakOffset = WAVE_LULL_MS + WAVE_SURGE_MS
    expect(peakStartedBetween(peakOffset + 100, peakOffset + 200)).toBe(false)
  })

  it('is true when the surge / peak boundary is crossed in this tick', () => {
    const peakOffset = WAVE_LULL_MS + WAVE_SURGE_MS
    expect(peakStartedBetween(peakOffset - 50, peakOffset + 10)).toBe(true)
  })

  it('is true at exactly the boundary', () => {
    const peakOffset = WAVE_LULL_MS + WAVE_SURGE_MS
    expect(peakStartedBetween(peakOffset - 1, peakOffset)).toBe(true)
  })

  it('is true when the boundary in the next cycle is crossed', () => {
    const nextCyclePeak = WAVE_TOTAL_MS + WAVE_LULL_MS + WAVE_SURGE_MS
    expect(peakStartedBetween(nextCyclePeak - 5, nextCyclePeak + 5)).toBe(true)
  })

  it('handles cycle rollover when the prev tick is in the prior cycle peak and current is in the new lull', () => {
    expect(peakStartedBetween(WAVE_TOTAL_MS - 100, WAVE_TOTAL_MS + 10)).toBe(false)
  })

  it('returns false on rewound time (currentRunMs < prevRunMs)', () => {
    const peakOffset = WAVE_LULL_MS + WAVE_SURGE_MS
    expect(peakStartedBetween(peakOffset + 100, peakOffset - 100)).toBe(false)
  })
})
