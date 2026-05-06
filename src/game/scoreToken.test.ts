import { describe, expect, it } from 'vitest'

import {
  SCORE_TOKEN_DURATION_MS,
  SCORE_TOKEN_MULTIPLIER,
  SCORE_TOKEN_REARM_MS,
  scoreTokenActive,
  scoreTokenMultiplier,
  scoreTokenRemainingMs
} from './scoreToken'

describe('score token constants', () => {
  it('exposes the documented duration, multiplier, and rearm', () => {
    expect(SCORE_TOKEN_DURATION_MS).toBe(6_000)
    expect(SCORE_TOKEN_MULTIPLIER).toBe(2)
    expect(SCORE_TOKEN_REARM_MS).toBe(70_000)
  })
})

describe('scoreTokenActive', () => {
  it('is false when state is null', () => {
    expect(scoreTokenActive(null, 0)).toBe(false)
    expect(scoreTokenActive(null, 9999)).toBe(false)
  })

  it('is true at the very start', () => {
    expect(scoreTokenActive({ startMs: 1000 }, 1000)).toBe(true)
  })

  it('is true mid-window', () => {
    expect(scoreTokenActive({ startMs: 0 }, SCORE_TOKEN_DURATION_MS / 2)).toBe(true)
  })

  it('is false at exactly the duration boundary', () => {
    expect(scoreTokenActive({ startMs: 0 }, SCORE_TOKEN_DURATION_MS)).toBe(false)
  })

  it('is false beyond the duration', () => {
    expect(scoreTokenActive({ startMs: 0 }, SCORE_TOKEN_DURATION_MS + 1000)).toBe(false)
  })

  it('is false on negative elapsed (clock skew)', () => {
    expect(scoreTokenActive({ startMs: 1000 }, 500)).toBe(false)
  })
})

describe('scoreTokenRemainingMs', () => {
  it('is 0 when no token is active', () => {
    expect(scoreTokenRemainingMs(null, 0)).toBe(0)
  })

  it('is full duration at the very start', () => {
    expect(scoreTokenRemainingMs({ startMs: 0 }, 0)).toBe(SCORE_TOKEN_DURATION_MS)
  })

  it('decreases linearly', () => {
    expect(scoreTokenRemainingMs({ startMs: 0 }, 2_000)).toBe(SCORE_TOKEN_DURATION_MS - 2_000)
  })

  it('clamps at 0 once expired', () => {
    expect(scoreTokenRemainingMs({ startMs: 0 }, SCORE_TOKEN_DURATION_MS + 1_000)).toBe(0)
  })
})

describe('scoreTokenMultiplier', () => {
  it('is 1 when no token is active', () => {
    expect(scoreTokenMultiplier(null, 0)).toBe(1)
  })

  it('is the configured multiplier mid-window', () => {
    expect(scoreTokenMultiplier({ startMs: 0 }, SCORE_TOKEN_DURATION_MS / 2)).toBe(SCORE_TOKEN_MULTIPLIER)
  })

  it('snaps back to 1 at the duration boundary', () => {
    expect(scoreTokenMultiplier({ startMs: 0 }, SCORE_TOKEN_DURATION_MS)).toBe(1)
  })

  it('snaps back to 1 past the duration', () => {
    expect(scoreTokenMultiplier({ startMs: 0 }, SCORE_TOKEN_DURATION_MS + 100)).toBe(1)
  })
})
