import { describe, expect, it } from 'vitest'
import {
  EMERGENCY_BRIGHT_SCALE,
  EMERGENCY_DIM_SCALE,
  EMERGENCY_LIGHT_COLOR,
  EMERGENCY_PRESSURE_THRESHOLD,
  EMERGENCY_STEP_MS,
  FLICKER_PEAK_SCALE,
  FLICKER_PRESSURE_THRESHOLD,
  FLICKER_TROUGH_SCALE,
  NEAR_DEATH_HEALTH_THRESHOLD,
  NEAR_DEATH_PEAK_SCALE,
  NEAR_DEATH_TROUGH_SCALE,
  NORMAL_LIGHT_COLOR,
  combinedLightingIntensityScale,
  emergencyIntensityScale,
  flickerIntensityScale,
  lightingColorForPhase,
  lightingIntensityScale,
  lightingPhase,
  lightingPhaseForPressure,
  nearDeathIntensityScale
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

  it('returns emergency once pressure reaches the emergency threshold', () => {
    expect(lightingPhaseForPressure(EMERGENCY_PRESSURE_THRESHOLD - 0.01)).toBe('flicker')
    expect(lightingPhaseForPressure(EMERGENCY_PRESSURE_THRESHOLD)).toBe('emergency')
    expect(lightingPhaseForPressure(EMERGENCY_PRESSURE_THRESHOLD + 5)).toBe('emergency')
  })
})

describe('emergencyIntensityScale', () => {
  it('alternates bright and dim every EMERGENCY_STEP_MS (strobe)', () => {
    expect(emergencyIntensityScale(0)).toBe(EMERGENCY_BRIGHT_SCALE)
    expect(emergencyIntensityScale(EMERGENCY_STEP_MS - 1)).toBe(EMERGENCY_BRIGHT_SCALE)
    expect(emergencyIntensityScale(EMERGENCY_STEP_MS)).toBe(EMERGENCY_DIM_SCALE)
    expect(emergencyIntensityScale(EMERGENCY_STEP_MS * 2)).toBe(EMERGENCY_BRIGHT_SCALE)
  })

  it('keeps the dim trough noticeably darker than the bright peak (visible strobe)', () => {
    expect(EMERGENCY_DIM_SCALE).toBeLessThan(EMERGENCY_BRIGHT_SCALE - 0.5)
  })

  it('is deterministic in elapsed time', () => {
    expect(emergencyIntensityScale(700)).toBe(emergencyIntensityScale(700))
  })
})

describe('lightingColorForPhase', () => {
  it('tints to the emergency red only on emergency', () => {
    expect(lightingColorForPhase('emergency')).toBe(EMERGENCY_LIGHT_COLOR)
  })

  it('returns the normal teal for every non-emergency phase', () => {
    expect(lightingColorForPhase('normal')).toBe(NORMAL_LIGHT_COLOR)
    expect(lightingColorForPhase('flicker')).toBe(NORMAL_LIGHT_COLOR)
    expect(lightingColorForPhase('near-death')).toBe(NORMAL_LIGHT_COLOR)
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

describe('lightingPhase', () => {
  it('returns near-death when player health is at or below the threshold (and alive)', () => {
    expect(lightingPhase(0, NEAR_DEATH_HEALTH_THRESHOLD)).toBe('near-death')
    expect(lightingPhase(0.9, 5)).toBe('near-death')
  })

  it('does not return near-death for a dead player (health 0)', () => {
    expect(lightingPhase(0, 0)).toBe('normal')
  })

  it('returns flicker on high pressure when player health is above the near-death threshold', () => {
    expect(lightingPhase(FLICKER_PRESSURE_THRESHOLD, 100)).toBe('flicker')
  })

  it('returns normal on low pressure with healthy player', () => {
    expect(lightingPhase(0.2, 80)).toBe('normal')
  })

  it('lets near-death override flicker on overlap', () => {
    expect(lightingPhase(0.95, 10)).toBe('near-death')
  })
})

describe('nearDeathIntensityScale', () => {
  it('stays inside the trough and peak bounds', () => {
    for (let t = 0; t < 4000; t += 50) {
      const scale = nearDeathIntensityScale(t)
      expect(scale).toBeGreaterThanOrEqual(NEAR_DEATH_TROUGH_SCALE - 1e-9)
      expect(scale).toBeLessThanOrEqual(NEAR_DEATH_PEAK_SCALE + 1e-9)
    }
  })

  it('hits both the trough and the peak across one cycle', () => {
    let max = -Infinity
    let min = Infinity

    for (let t = 0; t < 1500; t += 25) {
      const s = nearDeathIntensityScale(t)
      max = Math.max(max, s)
      min = Math.min(min, s)
    }

    expect(max).toBeGreaterThan(NEAR_DEATH_PEAK_SCALE - 0.05)
    expect(min).toBeLessThan(NEAR_DEATH_TROUGH_SCALE + 0.05)
  })

  it('is deterministic in elapsed time', () => {
    expect(nearDeathIntensityScale(421)).toBe(nearDeathIntensityScale(421))
  })
})

describe('combinedLightingIntensityScale', () => {
  it('returns 1 in the normal phase', () => {
    expect(combinedLightingIntensityScale(0.1, 100, 0)).toBe(1)
  })

  it('returns the flicker scale on flicker phase', () => {
    const t = 0
    expect(combinedLightingIntensityScale(FLICKER_PRESSURE_THRESHOLD, 100, t)).toBe(flickerIntensityScale(t))
  })

  it('returns the near-death scale when player health is critical', () => {
    const t = 0
    expect(combinedLightingIntensityScale(0.1, 10, t)).toBe(nearDeathIntensityScale(t))
  })

  it('uses near-death precedence over flicker on overlap', () => {
    const t = 250
    expect(combinedLightingIntensityScale(0.95, 10, t)).toBe(nearDeathIntensityScale(t))
  })
})
