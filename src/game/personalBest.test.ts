import { describe, expect, it } from 'vitest'
import { justCrossedPersonalBest } from './personalBest'

describe('justCrossedPersonalBest', () => {
  it('returns false when there is no previous best', () => {
    expect(justCrossedPersonalBest(0, 1000, null)).toBe(false)
    expect(justCrossedPersonalBest(900, 1100, null)).toBe(false)
  })

  it('returns false when the run is still under the previous best', () => {
    expect(justCrossedPersonalBest(0, 500, 1000)).toBe(false)
    expect(justCrossedPersonalBest(900, 1000, 1000)).toBe(false)
  })

  it('returns true on the transition that crosses the previous best', () => {
    expect(justCrossedPersonalBest(900, 1100, 1000)).toBe(true)
    expect(justCrossedPersonalBest(0, 1500, 1000)).toBe(true)
  })

  it('returns false on subsequent kills after the cross', () => {
    // Already over the record, another kill should not refire.
    expect(justCrossedPersonalBest(1100, 1200, 1000)).toBe(false)
    expect(justCrossedPersonalBest(2000, 2200, 1000)).toBe(false)
  })

  it('treats reaching exact equality as not yet over', () => {
    // Strict greater-than: tying the record does not fire the cue.
    expect(justCrossedPersonalBest(900, 1000, 1000)).toBe(false)
    // Crossing strictly above tying does fire.
    expect(justCrossedPersonalBest(1000, 1001, 1000)).toBe(true)
  })

  it('handles a previousBest of zero', () => {
    // Edge: leaderboard has a 0-score entry. First scoring kill fires once.
    expect(justCrossedPersonalBest(0, 100, 0)).toBe(true)
    expect(justCrossedPersonalBest(100, 200, 0)).toBe(false)
  })
})
