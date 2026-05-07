import { describe, expect, it } from 'vitest'
import { MUSIC_BASS_HZ, MUSIC_THROB_HZ } from './musicIntensity'
import {
  RAGE_PULSE_BASS_HZ,
  RAGE_PULSE_GAIN,
  RAGE_PULSE_THROB_HZ
} from './ragePulse'

describe('rage pulse constants', () => {
  it('sits above the music bass so the two layers do not muddy', () => {
    expect(RAGE_PULSE_BASS_HZ).toBeGreaterThan(MUSIC_BASS_HZ)
  })

  it('throbs faster than the music layer for an angry-heartbeat read', () => {
    expect(RAGE_PULSE_THROB_HZ).toBeGreaterThan(MUSIC_THROB_HZ)
  })

  it('uses a low master gain so the cue is felt, not overwhelming', () => {
    expect(RAGE_PULSE_GAIN).toBeGreaterThan(0)
    expect(RAGE_PULSE_GAIN).toBeLessThan(0.1)
  })
})
