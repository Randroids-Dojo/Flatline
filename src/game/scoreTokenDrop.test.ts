import { describe, expect, it } from 'vitest'
import {
  SCORE_TOKEN_BONUS,
  SCORE_TOKEN_DROP_CHANCE,
  SCORE_TOKEN_PICKUP_RADIUS_M,
  SCORE_TOKEN_TTL_MS,
  scoreTokenBobY,
  scoreTokenPickupIds,
  shouldDropScoreToken,
  tickScoreTokens,
  type ScoreTokenDrop
} from './scoreTokenDrop'

describe('shouldDropScoreToken', () => {
  it('returns true when the rng roll is below the per-type drop chance', () => {
    expect(shouldDropScoreToken('skitter', 0.1)).toBe(true)
    expect(shouldDropScoreToken('brute', 0.4)).toBe(true)
  })

  it('returns false when the roll is at or above the drop chance', () => {
    expect(shouldDropScoreToken('skitter', SCORE_TOKEN_DROP_CHANCE.skitter)).toBe(false)
    expect(shouldDropScoreToken('grunt', 0.99)).toBe(false)
  })

  it('uses a higher drop chance for heavier enemies', () => {
    expect(SCORE_TOKEN_DROP_CHANCE.brute).toBeGreaterThan(SCORE_TOKEN_DROP_CHANCE.grunt)
    expect(SCORE_TOKEN_DROP_CHANCE.grunt).toBeGreaterThan(SCORE_TOKEN_DROP_CHANCE.skitter)
  })

  it('keeps every drop chance below 0.5 so kills do not become token spam', () => {
    for (const chance of Object.values(SCORE_TOKEN_DROP_CHANCE)) {
      expect(chance).toBeLessThan(0.5)
      expect(chance).toBeGreaterThan(0)
    }
  })
})

describe('tickScoreTokens', () => {
  const sampleToken = (overrides: Partial<ScoreTokenDrop> = {}): ScoreTokenDrop => ({
    id: 't1',
    position: { x: 0, y: 0.5, z: 0 },
    ageMs: 0,
    ...overrides
  })

  it('ages every token by deltaMs', () => {
    const next = tickScoreTokens([sampleToken({ ageMs: 100 })], 50)
    expect(next).toHaveLength(1)
    expect(next[0].ageMs).toBe(150)
  })

  it('drops tokens whose age has crossed the TTL', () => {
    const next = tickScoreTokens(
      [sampleToken({ id: 'expired', ageMs: SCORE_TOKEN_TTL_MS - 10 }), sampleToken({ id: 'live', ageMs: 0 })],
      50
    )
    expect(next.map((token) => token.id)).toEqual(['live'])
  })

  it('keeps tokens that are right at the TTL', () => {
    const next = tickScoreTokens([sampleToken({ ageMs: SCORE_TOKEN_TTL_MS - 1 })], 0)
    expect(next).toHaveLength(1)
  })

  it('returns a fresh array (does not mutate input)', () => {
    const input = [sampleToken({ ageMs: 100 })]
    const next = tickScoreTokens(input, 50)
    expect(next).not.toBe(input)
    expect(input[0].ageMs).toBe(100)
  })
})

describe('scoreTokenPickupIds', () => {
  const at = (x: number, z: number): ScoreTokenDrop => ({
    id: `${x}:${z}`,
    position: { x, y: 0.5, z },
    ageMs: 0
  })

  it('returns ids of tokens within the pickup radius', () => {
    const tokens = [at(0, 0), at(0.5, 0), at(2, 0)]
    const ids = scoreTokenPickupIds(tokens, { x: 0, z: 0 })
    expect(ids).toContain('0:0')
    expect(ids).toContain('0.5:0')
    expect(ids).not.toContain('2:0')
  })

  it('treats the boundary as a hit (player at exactly pickup radius)', () => {
    const ids = scoreTokenPickupIds([at(SCORE_TOKEN_PICKUP_RADIUS_M, 0)], { x: 0, z: 0 })
    expect(ids).toEqual([`${SCORE_TOKEN_PICKUP_RADIUS_M}:0`])
  })

  it('uses 2D distance (ignores y)', () => {
    const token: ScoreTokenDrop = {
      id: 'high',
      position: { x: 0, y: 99, z: 0 },
      ageMs: 0
    }
    expect(scoreTokenPickupIds([token], { x: 0, z: 0 })).toEqual(['high'])
  })
})

describe('scoreTokenBobY', () => {
  it('bobs around a positive baseline so the token never sits below the floor', () => {
    for (let t = 0; t < SCORE_TOKEN_TTL_MS; t += 50) {
      expect(scoreTokenBobY(t)).toBeGreaterThan(0)
    }
  })

  it('peaks above and dips below the baseline (it bobs, not just rises)', () => {
    let max = -Infinity
    let min = Infinity

    for (let t = 0; t < 1000; t += 25) {
      const y = scoreTokenBobY(t)
      max = Math.max(max, y)
      min = Math.min(min, y)
    }

    expect(max).toBeGreaterThan(min)
  })
})

describe('SCORE_TOKEN_BONUS', () => {
  it('is a positive integer score amount', () => {
    expect(SCORE_TOKEN_BONUS).toBeGreaterThan(0)
    expect(Number.isInteger(SCORE_TOKEN_BONUS)).toBe(true)
  })
})
