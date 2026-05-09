import { describe, expect, it } from 'vitest'
import { COMBO_MILESTONES, crossedComboMilestone } from './comboMilestone'

describe('crossedComboMilestone', () => {
  it('returns null when no milestone is crossed', () => {
    expect(crossedComboMilestone(0, 1)).toBeNull()
    expect(crossedComboMilestone(1, 4)).toBeNull()
    expect(crossedComboMilestone(6, 7)).toBeNull()
  })

  it('returns the milestone on exact-landing', () => {
    expect(crossedComboMilestone(4, 5)).toBe(5)
    expect(crossedComboMilestone(9, 10)).toBe(10)
    expect(crossedComboMilestone(19, 20)).toBe(20)
  })

  it('does not refire a milestone the streak has already passed', () => {
    expect(crossedComboMilestone(5, 6)).toBeNull()
    expect(crossedComboMilestone(10, 11)).toBeNull()
    expect(crossedComboMilestone(20, 21)).toBeNull()
  })

  it('returns null when the combo resets after timing out', () => {
    // prev was past the threshold, current is the freshly built 1; no
    // new threshold crossed.
    expect(crossedComboMilestone(7, 1)).toBeNull()
    expect(crossedComboMilestone(15, 1)).toBeNull()
  })

  it('refires a milestone after a reset on the rebuild', () => {
    // Combo broke then rebuilt to 5; this update crosses 5 fresh.
    expect(crossedComboMilestone(4, 5)).toBe(5)
  })

  it('exposes the canonical milestone tiers', () => {
    expect(COMBO_MILESTONES).toEqual([5, 10, 20])
  })
})
