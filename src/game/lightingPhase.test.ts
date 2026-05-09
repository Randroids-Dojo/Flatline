import { describe, expect, it } from 'vitest'
import {
  FLICKER_PEAK_SCALE,
  FLICKER_PRESSURE_THRESHOLD,
  FLICKER_TROUGH_SCALE,
  flickerIntensityScale,
  lightingIntensityScale,
  lightingPhaseForPressure
} from './lightingPhase'

describe('lightingPhaseForPressure', () => {
  it('returns normal below the flicker threshold', () => {
    expect(lightingPhaseForPressure(0)).toBe('normal')
    expect(lightingPhaseForPressure(FLICKER_PRESSURE_THRESHOLD - 0.01)).toBe('normal')
  })

  it('returns flicker at and above the threshold', () => {
    expect(lightingPhaseForPressure(FLICKER_PRESSURE_THRESHOLD)).toBe('flicker')
    expect(lightingPhaseForPressure(1)).toBe('flicker')
  })
})

describe('flickerIntensityScale', () => {
  it('returns one of the trough, peak, or baseline scales', () => {
    for (let t = 0; t < 5000; t += 27) {
      const scale = flickerIntensityScale(t)
      const matches =
        scale === FLICKER_TROUGH_SCALE || scale === FLICKER_PEAK_SCALE || scale === 1
      expect(matches).toBe(true)
    }
  })

  it('is deterministic in elapsed time', () => {
    expect(flickerIntensityScale(123)).toBe(flickerIntensityScale(123))
    expect(flickerIntensityScale(2417)).toBe(flickerIntensityScale(2417))
  })

  it('hits the trough at least once across a representative window', () => {
    let sawTrough = false

    for (let t = 0; t < 4000; t += 80) {
      if (flickerIntensityScale(t) === FLICKER_TROUGH_SCALE) {
        sawTrough = true
        break
      }
    }

    expect(sawTrough).toBe(true)
  })

  it('keeps the trough at half intensity (a noticeable flicker, not a blackout)', () => {
    expect(FLICKER_TROUGH_SCALE).toBe(0.5)
  })

  it('keeps the peak slightly above baseline so brighter steps still read', () => {
    expect(FLICKER_PEAK_SCALE).toBeGreaterThan(1)
    expect(FLICKER_PEAK_SCALE).toBeLessThan(1.2)
  })
})

describe('lightingIntensityScale', () => {
  it('returns 1 when the pressure has not yet crossed the flicker threshold', () => {
    expect(lightingIntensityScale(0, 0)).toBe(1)
    expect(lightingIntensityScale(0.5, 1234)).toBe(1)
  })

  it('returns the flicker scale once pressure crosses the threshold', () => {
    const t = 0
    const scale = lightingIntensityScale(FLICKER_PRESSURE_THRESHOLD, t)
    expect(scale).toBe(flickerIntensityScale(t))
  })
})
