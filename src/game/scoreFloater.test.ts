import { describe, expect, it } from 'vitest'
import {
  SCORE_FLOATER_TTL_MS,
  formatScoreFloaterText,
  pruneExpiredFloaters,
  scoreFloaterTier,
  type ScoreFloater
} from './scoreFloater'

describe('formatScoreFloaterText', () => {
  it('renders a positive delta with a leading plus', () => {
    expect(formatScoreFloaterText(150)).toBe('+150')
    expect(formatScoreFloaterText(1)).toBe('+1')
  })

  it('rounds non-integer deltas', () => {
    expect(formatScoreFloaterText(150.7)).toBe('+151')
    expect(formatScoreFloaterText(150.4)).toBe('+150')
  })

  it('coerces zero or negative deltas to +0', () => {
    expect(formatScoreFloaterText(0)).toBe('+0')
    expect(formatScoreFloaterText(-25)).toBe('+0')
  })

  it('handles non-finite values defensively', () => {
    expect(formatScoreFloaterText(Number.NaN)).toBe('+0')
    expect(formatScoreFloaterText(Number.POSITIVE_INFINITY)).toBe('+0')
  })
})

describe('pruneExpiredFloaters', () => {
  const baseFloater: ScoreFloater = {
    id: 1,
    text: '+150',
    startedAtMs: 1000,
    screenX: 200,
    screenY: 300,
    tier: 'base'
  }

  it('keeps floaters within the TTL window', () => {
    expect(pruneExpiredFloaters([baseFloater], 1500)).toEqual([baseFloater])
    expect(pruneExpiredFloaters([baseFloater], 1000 + SCORE_FLOATER_TTL_MS - 1)).toEqual([baseFloater])
  })

  it('drops floaters at or past the TTL window', () => {
    expect(pruneExpiredFloaters([baseFloater], 1000 + SCORE_FLOATER_TTL_MS)).toEqual([])
    expect(pruneExpiredFloaters([baseFloater], 1000 + SCORE_FLOATER_TTL_MS + 999)).toEqual([])
  })

  it('returns an empty list when given an empty list', () => {
    expect(pruneExpiredFloaters([], 0)).toEqual([])
  })
})

describe('scoreFloaterTier', () => {
  it('returns base for combos below 5', () => {
    expect(scoreFloaterTier(1)).toBe('base')
    expect(scoreFloaterTier(4)).toBe('base')
  })

  it('returns streak for combos 5 through 9', () => {
    expect(scoreFloaterTier(5)).toBe('streak')
    expect(scoreFloaterTier(9)).toBe('streak')
  })

  it('returns rolling for combos 10 through 19', () => {
    expect(scoreFloaterTier(10)).toBe('rolling')
    expect(scoreFloaterTier(19)).toBe('rolling')
  })

  it('returns rampage for combos 20 and above', () => {
    expect(scoreFloaterTier(20)).toBe('rampage')
    expect(scoreFloaterTier(40)).toBe('rampage')
  })

  it('falls back to base for non-positive or non-finite combos', () => {
    expect(scoreFloaterTier(0)).toBe('base')
    expect(scoreFloaterTier(-3)).toBe('base')
    expect(scoreFloaterTier(Number.NaN)).toBe('base')
  })
})
