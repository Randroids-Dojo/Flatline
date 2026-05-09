import { describe, expect, it } from 'vitest'
import { SCORE_MILESTONES, crossedScoreMilestone } from './scoreMilestone'

describe('crossedScoreMilestone', () => {
  it('returns null when no milestone is crossed', () => {
    expect(crossedScoreMilestone(0, 500)).toBeNull()
    expect(crossedScoreMilestone(1500, 2500)).toBeNull()
    expect(crossedScoreMilestone(5500, 7000)).toBeNull()
  })

  it('returns the milestone when the score lands exactly on it', () => {
    expect(crossedScoreMilestone(0, 1000)).toBe(1000)
    expect(crossedScoreMilestone(4999, 5000)).toBe(5000)
    expect(crossedScoreMilestone(9999, 10000)).toBe(10000)
  })

  it('returns the milestone when the score crosses through it', () => {
    expect(crossedScoreMilestone(999, 1001)).toBe(1000)
    expect(crossedScoreMilestone(4900, 5300)).toBe(5000)
  })

  it('returns the highest milestone when multiple cross in one update', () => {
    // Big bonus payout that vaults past two thresholds in one tick.
    expect(crossedScoreMilestone(900, 5500)).toBe(5000)
    // All three crossed in one fanciful jump.
    expect(crossedScoreMilestone(0, 11000)).toBe(10000)
  })

  it('does not refire a milestone the score has already passed', () => {
    // 1000 already credited last update; this update only adds 200 above.
    expect(crossedScoreMilestone(1000, 1200)).toBeNull()
    expect(crossedScoreMilestone(5000, 5400)).toBeNull()
  })

  it('returns null when the score decreases', () => {
    expect(crossedScoreMilestone(1500, 1200)).toBeNull()
    expect(crossedScoreMilestone(11000, 9500)).toBeNull()
  })

  it('exposes the canonical milestone tiers', () => {
    expect(SCORE_MILESTONES).toEqual([1000, 5000, 10000])
  })
})
