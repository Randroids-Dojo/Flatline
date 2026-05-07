import { describe, expect, it } from 'vitest'
import {
  SKITTER_DASH_DURATION_MS,
  SKITTER_DASH_MAX_RANGE_M,
  SKITTER_DASH_MIN_RANGE_M,
  SKITTER_DASH_SPEED_MULTIPLIER,
  shouldStartSkitterDash,
  skitterDashSpeedScale
} from './skitterDash'

const baseArgs = {
  type: 'skitter',
  state: 'chase',
  attackCooldownMs: 0,
  dashBurstMsRemaining: 0,
  distanceToPlayerM: 2.5
}

describe('shouldStartSkitterDash', () => {
  it('triggers in the dashable range when the skitter is idle', () => {
    expect(shouldStartSkitterDash(baseArgs)).toBe(true)
  })

  it('does not trigger for non-skitter types', () => {
    expect(shouldStartSkitterDash({ ...baseArgs, type: 'grunt' })).toBe(false)
    expect(shouldStartSkitterDash({ ...baseArgs, type: 'brute' })).toBe(false)
    expect(shouldStartSkitterDash({ ...baseArgs, type: 'spitter' })).toBe(false)
  })

  it('does not trigger outside the dashable range', () => {
    expect(shouldStartSkitterDash({ ...baseArgs, distanceToPlayerM: SKITTER_DASH_MIN_RANGE_M - 0.01 })).toBe(false)
    expect(shouldStartSkitterDash({ ...baseArgs, distanceToPlayerM: SKITTER_DASH_MAX_RANGE_M + 0.01 })).toBe(false)
  })

  it('does not trigger while a dash is already running', () => {
    expect(shouldStartSkitterDash({ ...baseArgs, dashBurstMsRemaining: 100 })).toBe(false)
  })

  it('does not trigger while the attack cooldown is active', () => {
    expect(shouldStartSkitterDash({ ...baseArgs, attackCooldownMs: 200 })).toBe(false)
  })

  it('does not trigger outside the chase state', () => {
    expect(shouldStartSkitterDash({ ...baseArgs, state: 'attackWindup' })).toBe(false)
    expect(shouldStartSkitterDash({ ...baseArgs, state: 'hurt' })).toBe(false)
    expect(shouldStartSkitterDash({ ...baseArgs, state: 'dead' })).toBe(false)
  })
})

describe('skitterDashSpeedScale', () => {
  it('returns 1 when no burst is active', () => {
    expect(skitterDashSpeedScale(0)).toBe(1)
  })

  it('returns the multiplier while the burst is active', () => {
    expect(skitterDashSpeedScale(100)).toBe(SKITTER_DASH_SPEED_MULTIPLIER)
    expect(skitterDashSpeedScale(SKITTER_DASH_DURATION_MS)).toBe(SKITTER_DASH_SPEED_MULTIPLIER)
  })
})
