import { describe, expect, it } from 'vitest'
import {
  COMBO_BREAK_MIN_PRIOR,
  comboBreakCue,
  comboBreakCueTotalDurationMs,
  comboJustBroke
} from './comboBreakCue'

describe('comboBreakCue', () => {
  it('exposes a descending two-tone style', () => {
    const style = comboBreakCue()
    expect(style.firstFrequency).toBeGreaterThan(style.secondFrequency)
    expect(style.firstDurationMs).toBeGreaterThan(0)
    expect(style.secondDurationMs).toBeGreaterThan(0)
    expect(style.gain).toBeGreaterThan(0)
    expect(style.gain).toBeLessThan(0.1)
  })

  it('totals the two tone durations', () => {
    const style = comboBreakCue()
    expect(comboBreakCueTotalDurationMs(style)).toBe(
      style.firstDurationMs + style.secondDurationMs
    )
  })
})

describe('comboJustBroke', () => {
  it('triggers when a streak of 2+ snaps to 0', () => {
    expect(comboJustBroke(2, 0)).toBe(true)
    expect(comboJustBroke(7, 0)).toBe(true)
  })

  it('does not trigger when a 1-kill streak times out', () => {
    expect(comboJustBroke(1, 0)).toBe(false)
  })

  it('does not trigger when the combo is still active', () => {
    expect(comboJustBroke(3, 3)).toBe(false)
    expect(comboJustBroke(3, 4)).toBe(false)
  })

  it('does not trigger when there was no prior combo', () => {
    expect(comboJustBroke(0, 0)).toBe(false)
  })

  it('exposes the threshold so callers can mirror the rule', () => {
    expect(COMBO_BREAK_MIN_PRIOR).toBe(2)
  })
})
