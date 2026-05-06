import { describe, expect, it } from 'vitest'

import {
  MUSIC_BASS_HZ,
  MUSIC_PEAK_GAIN,
  MUSIC_RAMP_END,
  MUSIC_RAMP_START,
  MUSIC_THROB_HZ,
  musicIntensityGain
} from './musicIntensity'

describe('music intensity constants', () => {
  it('exposes a ramp band of (0.5, 1.0]', () => {
    expect(MUSIC_RAMP_START).toBe(0.5)
    expect(MUSIC_RAMP_END).toBe(1)
  })

  it('exposes a non-zero peak gain so the thrash layer is audible at peak', () => {
    expect(MUSIC_PEAK_GAIN).toBeGreaterThan(0)
    expect(MUSIC_PEAK_GAIN).toBeLessThan(0.2)
  })

  it('exposes a sub-bass pitch and throb frequency', () => {
    expect(MUSIC_BASS_HZ).toBeGreaterThan(40)
    expect(MUSIC_BASS_HZ).toBeLessThan(120)
    expect(MUSIC_THROB_HZ).toBeGreaterThan(0)
    expect(MUSIC_THROB_HZ).toBeLessThan(10)
  })
})

describe('musicIntensityGain', () => {
  it('is 0 at ratio 0', () => {
    expect(musicIntensityGain(0)).toBe(0)
  })

  it('is 0 just below the ramp start (0.49)', () => {
    expect(musicIntensityGain(0.49)).toBe(0)
  })

  it('is 0 exactly at ramp start (the layer enters at 0.5+)', () => {
    expect(musicIntensityGain(MUSIC_RAMP_START)).toBe(0)
  })

  it('rises to 0.4 at ratio 0.7 (40% across the ramp window)', () => {
    expect(musicIntensityGain(0.7)).toBeCloseTo(0.4, 5)
  })

  it('reaches 1 exactly at the ramp end', () => {
    expect(musicIntensityGain(MUSIC_RAMP_END)).toBe(1)
  })

  it('holds at 1 above the ramp end', () => {
    expect(musicIntensityGain(1.5)).toBe(1)
    expect(musicIntensityGain(3)).toBe(1)
  })

  it('returns 0 for non-finite or negative inputs', () => {
    expect(musicIntensityGain(Number.NaN)).toBe(0)
    expect(musicIntensityGain(Number.NEGATIVE_INFINITY)).toBe(0)
    expect(musicIntensityGain(-1)).toBe(0)
  })

  it('rises monotonically across the ramp band', () => {
    const samples = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(musicIntensityGain)

    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1])
    }
  })
})
