import { describe, expect, it } from 'vitest'

import {
  HITSTOP_KILL_DURATION_MULT,
  HITSTOP_KILL_SCALE_MULT,
  hitstopOnKill,
  hitstopScaleAtElapsedMs,
  hitstopStyle
} from './hitstop'

describe('hitstopStyle', () => {
  it('returns a snappier, shallower dip for the peashooter', () => {
    const style = hitstopStyle('peashooter')
    expect(style.durationMs).toBe(30)
    expect(style.scale).toBe(0.05)
  })

  it('returns a mid weight dip for the inkblaster', () => {
    const style = hitstopStyle('inkblaster')
    expect(style.durationMs).toBe(45)
    expect(style.scale).toBe(0.04)
  })

  it('returns a deeper, longer dip for the boomstick', () => {
    const style = hitstopStyle('boomstick')
    expect(style.durationMs).toBe(60)
    expect(style.scale).toBe(0.02)
  })

  it('orders durations peashooter < inkblaster < boomstick', () => {
    expect(hitstopStyle('peashooter').durationMs).toBeLessThan(hitstopStyle('inkblaster').durationMs)
    expect(hitstopStyle('inkblaster').durationMs).toBeLessThan(hitstopStyle('boomstick').durationMs)
  })

  it('orders scale dips so the boomstick freezes hardest', () => {
    expect(hitstopStyle('boomstick').scale).toBeLessThan(hitstopStyle('inkblaster').scale)
    expect(hitstopStyle('inkblaster').scale).toBeLessThan(hitstopStyle('peashooter').scale)
  })
})

describe('hitstopScaleAtElapsedMs', () => {
  it('returns 1 when no hitstop is active', () => {
    expect(hitstopScaleAtElapsedMs(null, 0)).toBe(1)
    expect(hitstopScaleAtElapsedMs(null, 9999)).toBe(1)
  })

  it('returns the configured scale at the start of the window', () => {
    const style = hitstopStyle('boomstick')
    expect(hitstopScaleAtElapsedMs(style, 0)).toBe(style.scale)
  })

  it('returns the configured scale anywhere inside the window', () => {
    const style = hitstopStyle('inkblaster')
    expect(hitstopScaleAtElapsedMs(style, 1)).toBe(style.scale)
    expect(hitstopScaleAtElapsedMs(style, style.durationMs / 2)).toBe(style.scale)
    expect(hitstopScaleAtElapsedMs(style, style.durationMs - 1)).toBe(style.scale)
  })

  it('returns 1 once the window has fully elapsed', () => {
    const style = hitstopStyle('peashooter')
    expect(hitstopScaleAtElapsedMs(style, style.durationMs)).toBe(1)
    expect(hitstopScaleAtElapsedMs(style, style.durationMs + 1)).toBe(1)
    expect(hitstopScaleAtElapsedMs(style, 9999)).toBe(1)
  })

  it('treats elapsedMs at exactly durationMs as fully resolved', () => {
    const style = hitstopStyle('boomstick')
    expect(hitstopScaleAtElapsedMs(style, style.durationMs)).toBe(1)
  })
})

describe('hitstopOnKill', () => {
  it('extends the duration by the kill multiplier', () => {
    const base = hitstopStyle('peashooter')
    const kill = hitstopOnKill(base)
    expect(kill.durationMs).toBe(base.durationMs * HITSTOP_KILL_DURATION_MULT)
  })

  it('pulls the scale dip lower so the kill reads heavier', () => {
    const base = hitstopStyle('boomstick')
    const kill = hitstopOnKill(base)
    expect(kill.scale).toBe(base.scale * HITSTOP_KILL_SCALE_MULT)
    expect(kill.scale).toBeLessThan(base.scale)
  })

  it('preserves the per-weapon ordering on kill', () => {
    const peashooterKill = hitstopOnKill(hitstopStyle('peashooter'))
    const inkblasterKill = hitstopOnKill(hitstopStyle('inkblaster'))
    const boomstickKill = hitstopOnKill(hitstopStyle('boomstick'))
    expect(peashooterKill.durationMs).toBeLessThan(inkblasterKill.durationMs)
    expect(inkblasterKill.durationMs).toBeLessThan(boomstickKill.durationMs)
    expect(boomstickKill.scale).toBeLessThan(inkblasterKill.scale)
    expect(inkblasterKill.scale).toBeLessThan(peashooterKill.scale)
  })
})
