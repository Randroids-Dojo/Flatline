import { describe, expect, it } from 'vitest'

import type { MovementInput } from './types'
import {
  DASH_COOLDOWN_MS,
  DASH_DISTANCE_M,
  DASH_DURATION_MS,
  DASH_SPEED_MPS,
  dashCooldownRemainingMs,
  dashReadyAt,
  dashStep,
  dashWorldDirection,
  startDash
} from './dash'

const noInput: MovementInput = { forward: false, backward: false, left: false, right: false }

describe('dash constants', () => {
  it('exposes the documented duration and cooldown', () => {
    expect(DASH_DURATION_MS).toBe(180)
    expect(DASH_COOLDOWN_MS).toBe(1400)
    expect(DASH_DISTANCE_M).toBeCloseTo(3.2, 5)
  })

  it('derives speed so the dash covers DASH_DISTANCE_M across DASH_DURATION_MS', () => {
    const distance = (DASH_SPEED_MPS * DASH_DURATION_MS) / 1000
    expect(distance).toBeCloseTo(DASH_DISTANCE_M, 5)
  })
})

describe('dashWorldDirection', () => {
  it('returns view forward when no input keys are pressed (yaw 0 = -z forward)', () => {
    const dir = dashWorldDirection(noInput, 0)
    expect(dir.x).toBeCloseTo(0, 5)
    expect(dir.z).toBeCloseTo(-1, 5)
  })

  it('returns view forward when no input keys are pressed (yaw PI/2 = -x forward)', () => {
    const dir = dashWorldDirection(noInput, Math.PI / 2)
    expect(dir.x).toBeCloseTo(-1, 5)
    expect(dir.z).toBeCloseTo(0, 5)
  })

  it('maps W (forward) at yaw 0 to -z direction', () => {
    const dir = dashWorldDirection({ ...noInput, forward: true }, 0)
    expect(dir.x).toBeCloseTo(0, 5)
    expect(dir.z).toBeCloseTo(-1, 5)
  })

  it('maps S (backward) at yaw 0 to +z direction', () => {
    const dir = dashWorldDirection({ ...noInput, backward: true }, 0)
    expect(dir.x).toBeCloseTo(0, 5)
    expect(dir.z).toBeCloseTo(1, 5)
  })

  it('maps D (right) at yaw 0 to +x direction', () => {
    const dir = dashWorldDirection({ ...noInput, right: true }, 0)
    expect(dir.x).toBeCloseTo(1, 5)
    expect(dir.z).toBeCloseTo(0, 5)
  })

  it('maps A (left) at yaw 0 to -x direction', () => {
    const dir = dashWorldDirection({ ...noInput, left: true }, 0)
    expect(dir.x).toBeCloseTo(-1, 5)
    expect(dir.z).toBeCloseTo(0, 5)
  })

  it('normalizes diagonal input so the magnitude is 1', () => {
    const dir = dashWorldDirection({ ...noInput, forward: true, right: true }, 0)
    expect(Math.hypot(dir.x, dir.z)).toBeCloseTo(1, 5)
  })
})

describe('dashCooldownRemainingMs', () => {
  it('returns full cooldown right after a dash started', () => {
    expect(dashCooldownRemainingMs(0, 0)).toBe(DASH_COOLDOWN_MS)
  })

  it('returns 0 once the cooldown has elapsed', () => {
    expect(dashCooldownRemainingMs(DASH_COOLDOWN_MS, 0)).toBe(0)
    expect(dashCooldownRemainingMs(DASH_COOLDOWN_MS + 100, 0)).toBe(0)
  })

  it('decreases linearly', () => {
    expect(dashCooldownRemainingMs(700, 0)).toBe(700)
  })
})

describe('dashReadyAt', () => {
  it('is true when no dash has started yet (or far in the past)', () => {
    expect(dashReadyAt(10_000, Number.NEGATIVE_INFINITY)).toBe(true)
  })

  it('is false during cooldown', () => {
    expect(dashReadyAt(500, 0)).toBe(false)
  })

  it('is true exactly at cooldown end', () => {
    expect(dashReadyAt(DASH_COOLDOWN_MS, 0)).toBe(true)
  })
})

describe('startDash', () => {
  it('captures the trigger time and a unit world direction', () => {
    const state = startDash(1234, { ...noInput, forward: true }, 0)
    expect(state.startMs).toBe(1234)
    expect(Math.hypot(state.dirX, state.dirZ)).toBeCloseTo(1, 5)
  })

  it('falls back to view forward when no input is pressed', () => {
    const state = startDash(0, noInput, 0)
    expect(state.dirX).toBeCloseTo(0, 5)
    expect(state.dirZ).toBeCloseTo(-1, 5)
  })
})

describe('dashStep', () => {
  it('returns inactive when state is null', () => {
    const step = dashStep(null, 0)
    expect(step.active).toBe(false)
    expect(step.vx).toBe(0)
    expect(step.vz).toBe(0)
    expect(step.remainingMs).toBe(0)
  })

  it('returns full speed at the start of the window', () => {
    const state = startDash(0, { ...noInput, forward: true }, 0)
    const step = dashStep(state, 0)
    expect(step.active).toBe(true)
    expect(Math.hypot(step.vx, step.vz)).toBeCloseTo(DASH_SPEED_MPS, 5)
    expect(step.remainingMs).toBe(DASH_DURATION_MS)
  })

  it('returns full speed mid-window (constant velocity dash)', () => {
    const state = startDash(0, { ...noInput, forward: true }, 0)
    const step = dashStep(state, DASH_DURATION_MS / 2)
    expect(step.active).toBe(true)
    expect(Math.hypot(step.vx, step.vz)).toBeCloseTo(DASH_SPEED_MPS, 5)
    expect(step.remainingMs).toBe(DASH_DURATION_MS / 2)
  })

  it('returns inactive at exactly the duration boundary', () => {
    const state = startDash(0, { ...noInput, forward: true }, 0)
    expect(dashStep(state, DASH_DURATION_MS).active).toBe(false)
  })

  it('returns inactive after the window has elapsed', () => {
    const state = startDash(0, { ...noInput, forward: true }, 0)
    expect(dashStep(state, DASH_DURATION_MS + 100).active).toBe(false)
  })

  it('integrates to DASH_DISTANCE_M when stepped across the full window', () => {
    const state = startDash(0, { ...noInput, forward: true }, 0)
    const stepCount = 20
    let posX = 0
    let posZ = 0

    for (let i = 0; i < stepCount; i += 1) {
      const t = (i * DASH_DURATION_MS) / stepCount
      const tNext = ((i + 1) * DASH_DURATION_MS) / stepCount
      const step = dashStep(state, t)

      if (step.active) {
        const dtSec = (tNext - t) / 1000
        posX += step.vx * dtSec
        posZ += step.vz * dtSec
      }
    }

    expect(Math.hypot(posX, posZ)).toBeCloseTo(DASH_DISTANCE_M, 4)
  })
})
