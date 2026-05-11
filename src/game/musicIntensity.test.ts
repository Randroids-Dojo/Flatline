import { describe, expect, it } from 'vitest'

import {
  COMBAT_LEAD_HZ,
  COMBAT_PEAK_GAIN,
  COMBAT_RAMP_END,
  COMBAT_RAMP_START,
  HIGH_PRESSURE_LEAD_HZ,
  HIGH_PRESSURE_PEAK_GAIN,
  HIGH_PRESSURE_RAMP_END,
  HIGH_PRESSURE_RAMP_START,
  MUSIC_BASS_HZ,
  MUSIC_PEAK_GAIN,
  MUSIC_RAMP_END,
  MUSIC_RAMP_START,
  MUSIC_THROB_HZ,
  NEAR_DEATH_FULL_HEALTH,
  NEAR_DEATH_HEALTH_THRESHOLD,
  NEAR_DEATH_LEAD_HZ,
  NEAR_DEATH_PEAK_GAIN,
  NEAR_DEATH_PULSE_DEPTH,
  NEAR_DEATH_PULSE_HZ,
  combatMusicGain,
  highPressureMusicGain,
  musicIntensityGain,
  nearDeathMusicGain
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

describe('combat-intensity layer constants', () => {
  it('starts later than the bass thrash and finishes sooner so layers stack', () => {
    expect(COMBAT_RAMP_START).toBeGreaterThan(MUSIC_RAMP_START)
    expect(COMBAT_RAMP_END).toBeLessThan(MUSIC_RAMP_END)
  })

  it('exposes a non-zero peak gain mixed below the bass thrash', () => {
    expect(COMBAT_PEAK_GAIN).toBeGreaterThan(0)
    expect(COMBAT_PEAK_GAIN).toBeLessThan(MUSIC_PEAK_GAIN)
  })

  it('runs above the bass band so the stems read as layered', () => {
    expect(COMBAT_LEAD_HZ).toBeGreaterThan(MUSIC_BASS_HZ * 2)
  })
})

describe('combatMusicGain', () => {
  it('is 0 below the combat ramp start', () => {
    expect(combatMusicGain(0)).toBe(0)
    expect(combatMusicGain(COMBAT_RAMP_START - 0.01)).toBe(0)
    expect(combatMusicGain(COMBAT_RAMP_START)).toBe(0)
  })

  it('reaches 1 exactly at the combat ramp end', () => {
    expect(combatMusicGain(COMBAT_RAMP_END)).toBe(1)
  })

  it('holds at 1 above the ramp end', () => {
    expect(combatMusicGain(1)).toBe(1)
    expect(combatMusicGain(5)).toBe(1)
  })

  it('rises monotonically across the combat band', () => {
    const samples = [0.6, 0.65, 0.7, 0.75].map(combatMusicGain)
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1])
    }
  })

  it('returns 0 for non-finite or negative inputs', () => {
    expect(combatMusicGain(Number.NaN)).toBe(0)
    expect(combatMusicGain(-1)).toBe(0)
  })
})

describe('high-pressure layer constants', () => {
  it('starts after the combat layer hits peak so the stems stack in order', () => {
    expect(HIGH_PRESSURE_RAMP_START).toBeGreaterThanOrEqual(COMBAT_RAMP_END)
  })

  it('exposes a non-zero peak gain mixed below the combat stem', () => {
    expect(HIGH_PRESSURE_PEAK_GAIN).toBeGreaterThan(0)
    expect(HIGH_PRESSURE_PEAK_GAIN).toBeLessThan(COMBAT_PEAK_GAIN)
  })

  it('runs above the combat lead so the layers read as separate bands', () => {
    expect(HIGH_PRESSURE_LEAD_HZ).toBeGreaterThan(COMBAT_LEAD_HZ)
  })
})

describe('highPressureMusicGain', () => {
  it('is 0 below the ramp start', () => {
    expect(highPressureMusicGain(0)).toBe(0)
    expect(highPressureMusicGain(HIGH_PRESSURE_RAMP_START - 0.01)).toBe(0)
    expect(highPressureMusicGain(HIGH_PRESSURE_RAMP_START)).toBe(0)
  })

  it('reaches 1 exactly at the ramp end', () => {
    expect(highPressureMusicGain(HIGH_PRESSURE_RAMP_END)).toBe(1)
  })

  it('holds at 1 above the ramp end', () => {
    expect(highPressureMusicGain(1)).toBe(1)
    expect(highPressureMusicGain(5)).toBe(1)
  })

  it('rises monotonically across the band', () => {
    const samples = [0.8, 0.85, 0.9, 0.95].map(highPressureMusicGain)
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1])
    }
  })

  it('returns 0 for non-finite or negative inputs', () => {
    expect(highPressureMusicGain(Number.NaN)).toBe(0)
    expect(highPressureMusicGain(-1)).toBe(0)
  })
})

describe('near-death layer constants', () => {
  it('uses the same health threshold as the lighting near-death pulse so audio and lighting throb together', () => {
    expect(NEAR_DEATH_HEALTH_THRESHOLD).toBe(25)
    expect(NEAR_DEATH_FULL_HEALTH).toBeLessThan(NEAR_DEATH_HEALTH_THRESHOLD)
    expect(NEAR_DEATH_FULL_HEALTH).toBeGreaterThanOrEqual(0)
  })

  it('exposes a non-zero peak gain mixed in the same band as the other stems', () => {
    expect(NEAR_DEATH_PEAK_GAIN).toBeGreaterThan(0)
    expect(NEAR_DEATH_PEAK_GAIN).toBeLessThan(MUSIC_PEAK_GAIN)
  })

  it('voices the stem below the bass thrash so the heartbeat thuds under the mix', () => {
    expect(NEAR_DEATH_LEAD_HZ).toBeLessThan(MUSIC_BASS_HZ)
  })

  it('pulses at a heart-rate cadence (roughly 80 bpm)', () => {
    expect(NEAR_DEATH_PULSE_HZ).toBeGreaterThan(0.8)
    expect(NEAR_DEATH_PULSE_HZ).toBeLessThan(2)
  })

  it('exposes a non-zero pulse depth below 1 so the LFO does not silence the layer at its trough', () => {
    expect(NEAR_DEATH_PULSE_DEPTH).toBeGreaterThan(0)
    expect(NEAR_DEATH_PULSE_DEPTH).toBeLessThan(1)
  })
})

describe('nearDeathMusicGain', () => {
  it('is 0 at full health and any HP at or above the threshold', () => {
    expect(nearDeathMusicGain(100)).toBe(0)
    expect(nearDeathMusicGain(NEAR_DEATH_HEALTH_THRESHOLD)).toBe(0)
    expect(nearDeathMusicGain(NEAR_DEATH_HEALTH_THRESHOLD + 0.01)).toBe(0)
  })

  it('reaches 1 at or below full-health threshold', () => {
    expect(nearDeathMusicGain(NEAR_DEATH_FULL_HEALTH)).toBe(1)
    expect(nearDeathMusicGain(1)).toBe(1)
    expect(nearDeathMusicGain(0)).toBe(1)
  })

  it('rises monotonically as health drops', () => {
    const samples = [24, 20, 15, 10, 5].map(nearDeathMusicGain)
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1])
    }
  })

  it('returns 0 for non-finite inputs', () => {
    expect(nearDeathMusicGain(Number.NaN)).toBe(0)
    expect(nearDeathMusicGain(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('holds at peak even when HP goes negative so dying mid-frame keeps the layer roaring', () => {
    expect(nearDeathMusicGain(-5)).toBe(1)
  })
})
