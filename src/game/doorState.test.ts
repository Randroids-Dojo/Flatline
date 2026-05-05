import { describe, expect, it } from 'vitest'
import {
  DOOR_COOLING_MS,
  DOOR_OPENING_MS,
  DOOR_OPEN_MS,
  DOOR_TOTAL_MS,
  doorPhaseAtElapsedMs,
  doorPhaseVisualAtElapsedMs
} from './doorState'

describe('door state phase windows', () => {
  it('has total window equal to the sum of phase windows', () => {
    expect(DOOR_TOTAL_MS).toBe(DOOR_OPENING_MS + DOOR_OPEN_MS + DOOR_COOLING_MS)
  })

  it('returns idle for a never-spawned door', () => {
    expect(doorPhaseAtElapsedMs(DOOR_TOTAL_MS)).toBe('idle')
    expect(doorPhaseAtElapsedMs(DOOR_TOTAL_MS + 5000)).toBe('idle')
  })

  it('starts in opening at t = 0', () => {
    expect(doorPhaseAtElapsedMs(0)).toBe('opening')
  })

  it('transitions opening to open at the opening boundary', () => {
    expect(doorPhaseAtElapsedMs(DOOR_OPENING_MS - 1)).toBe('opening')
    expect(doorPhaseAtElapsedMs(DOOR_OPENING_MS)).toBe('open')
  })

  it('transitions open to cooling at the open boundary', () => {
    expect(doorPhaseAtElapsedMs(DOOR_OPENING_MS + DOOR_OPEN_MS - 1)).toBe('open')
    expect(doorPhaseAtElapsedMs(DOOR_OPENING_MS + DOOR_OPEN_MS)).toBe('cooling')
  })

  it('treats negative input as the opening boundary start', () => {
    expect(doorPhaseAtElapsedMs(-50)).toBe('opening')
  })
})

describe('door state visual style', () => {
  it('idle visual has the closed baseline opacity and scale', () => {
    const visual = doorPhaseVisualAtElapsedMs(DOOR_TOTAL_MS)
    expect(visual.opacity).toBeCloseTo(0.08, 5)
    expect(visual.scaleY).toBeCloseTo(0.58, 5)
  })

  it('opening peaks at the burst midpoint above the open baseline', () => {
    const peakAt = DOOR_OPENING_MS / 2
    const peak = doorPhaseVisualAtElapsedMs(peakAt)
    const start = doorPhaseVisualAtElapsedMs(0)

    expect(peak.opacity).toBeGreaterThan(start.opacity)
    expect(peak.scaleY).toBeGreaterThan(start.scaleY)
    expect(peak.opacity).toBeGreaterThan(0.46)
    expect(peak.scaleY).toBeGreaterThan(0.84)
  })

  it('opening start matches the open baseline (envelope begins at 0)', () => {
    const start = doorPhaseVisualAtElapsedMs(0)
    const open = doorPhaseVisualAtElapsedMs(DOOR_OPENING_MS)

    expect(start.opacity).toBeCloseTo(open.opacity, 5)
    expect(start.scaleY).toBeCloseTo(open.scaleY, 5)
  })

  it('open phase holds steady at the open baseline', () => {
    const a = doorPhaseVisualAtElapsedMs(DOOR_OPENING_MS + 50)
    const b = doorPhaseVisualAtElapsedMs(DOOR_OPENING_MS + 400)

    expect(a.opacity).toBeCloseTo(b.opacity, 5)
    expect(a.scaleY).toBeCloseTo(b.scaleY, 5)
  })

  it('cooling phase decreases opacity and scale toward idle', () => {
    const coolingStart = DOOR_OPENING_MS + DOOR_OPEN_MS
    const early = doorPhaseVisualAtElapsedMs(coolingStart + 1)
    const mid = doorPhaseVisualAtElapsedMs(coolingStart + DOOR_COOLING_MS / 2)
    const late = doorPhaseVisualAtElapsedMs(coolingStart + DOOR_COOLING_MS - 1)

    expect(mid.opacity).toBeLessThan(early.opacity)
    expect(late.opacity).toBeLessThan(mid.opacity)
    expect(mid.scaleY).toBeLessThan(early.scaleY)
    expect(late.scaleY).toBeLessThan(mid.scaleY)
  })

  it('end of cooling lands close to the idle baseline', () => {
    const visual = doorPhaseVisualAtElapsedMs(DOOR_TOTAL_MS - 1)
    const idle = doorPhaseVisualAtElapsedMs(DOOR_TOTAL_MS)

    expect(visual.opacity).toBeCloseTo(idle.opacity, 1)
    expect(visual.scaleY).toBeCloseTo(idle.scaleY, 1)
  })

  it('uses different colors per phase so the consumer can tint material', () => {
    const opening = doorPhaseVisualAtElapsedMs(0)
    const open = doorPhaseVisualAtElapsedMs(DOOR_OPENING_MS + 50)
    const cooling = doorPhaseVisualAtElapsedMs(DOOR_OPENING_MS + DOOR_OPEN_MS + 50)
    const idle = doorPhaseVisualAtElapsedMs(DOOR_TOTAL_MS)

    expect(opening.color).not.toBe(open.color)
    expect(open.color).not.toBe(cooling.color)
    expect(cooling.color).not.toBe(idle.color)
  })
})
