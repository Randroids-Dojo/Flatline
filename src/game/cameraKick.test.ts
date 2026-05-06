import { describe, expect, it } from 'vitest'

import { cameraKickProgressAtElapsedMs, cameraKickStyle } from './cameraKick'

describe('cameraKickStyle', () => {
  it('returns small punch values for the peashooter', () => {
    const style = cameraKickStyle('peashooter')
    expect(style.fovDeltaDeg).toBe(-0.6)
    expect(style.kickPx).toBe(1)
    expect(style.durationMs).toBe(140)
  })

  it('returns mid punch values for the inkblaster', () => {
    const style = cameraKickStyle('inkblaster')
    expect(style.fovDeltaDeg).toBe(-1.4)
    expect(style.kickPx).toBe(3)
    expect(style.durationMs).toBe(180)
  })

  it('returns the heaviest punch for the boomstick', () => {
    const style = cameraKickStyle('boomstick')
    expect(style.fovDeltaDeg).toBe(-3.0)
    expect(style.kickPx).toBe(6)
    expect(style.durationMs).toBe(220)
  })

  it('orders FOV deltas peashooter > inkblaster > boomstick (deeper zoom-in for heavier weapons)', () => {
    expect(cameraKickStyle('peashooter').fovDeltaDeg).toBeGreaterThan(cameraKickStyle('inkblaster').fovDeltaDeg)
    expect(cameraKickStyle('inkblaster').fovDeltaDeg).toBeGreaterThan(cameraKickStyle('boomstick').fovDeltaDeg)
  })

  it('orders durations peashooter < inkblaster < boomstick (heavier weapons settle slower)', () => {
    expect(cameraKickStyle('peashooter').durationMs).toBeLessThan(cameraKickStyle('inkblaster').durationMs)
    expect(cameraKickStyle('inkblaster').durationMs).toBeLessThan(cameraKickStyle('boomstick').durationMs)
  })
})

describe('cameraKickProgressAtElapsedMs', () => {
  it('returns 0 when there is no active kick', () => {
    expect(cameraKickProgressAtElapsedMs(null, 0)).toBe(0)
    expect(cameraKickProgressAtElapsedMs(null, 9999)).toBe(0)
  })

  it('returns 0 at elapsedMs <= 0', () => {
    const style = cameraKickStyle('boomstick')
    expect(cameraKickProgressAtElapsedMs(style, 0)).toBe(0)
    expect(cameraKickProgressAtElapsedMs(style, -5)).toBe(0)
  })

  it('returns 0 once the window has fully elapsed', () => {
    const style = cameraKickStyle('boomstick')
    expect(cameraKickProgressAtElapsedMs(style, style.durationMs)).toBe(0)
    expect(cameraKickProgressAtElapsedMs(style, style.durationMs + 1)).toBe(0)
  })

  it('reaches 1 (peak) at the snap point (18 percent of the window)', () => {
    const style = cameraKickStyle('boomstick')
    const peakMs = style.durationMs * 0.18
    expect(cameraKickProgressAtElapsedMs(style, peakMs)).toBeCloseTo(1, 5)
  })

  it('rises linearly from 0 to 1 across the snap window', () => {
    const style = cameraKickStyle('boomstick')
    const peakMs = style.durationMs * 0.18
    expect(cameraKickProgressAtElapsedMs(style, peakMs * 0.5)).toBeCloseTo(0.5, 5)
    expect(cameraKickProgressAtElapsedMs(style, peakMs * 0.25)).toBeCloseTo(0.25, 5)
  })

  it('eases linearly from 1 to 0 across the ease window', () => {
    const style = cameraKickStyle('boomstick')
    const peakMs = style.durationMs * 0.18
    const easeStart = peakMs
    const easeEnd = style.durationMs
    const halfEaseMs = (easeStart + easeEnd) / 2
    expect(cameraKickProgressAtElapsedMs(style, halfEaseMs)).toBeCloseTo(0.5, 5)
  })

  it('treats the boundary at exactly the peak as the peak itself', () => {
    const style = cameraKickStyle('inkblaster')
    expect(cameraKickProgressAtElapsedMs(style, style.durationMs * 0.18)).toBeCloseTo(1, 5)
  })
})
