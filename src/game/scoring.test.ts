import { describe, expect, it } from 'vitest'
import { accuracy, createScoreState, finalScore, recordKill, recordShot, survivalBonus } from './scoring'

describe('scoring', () => {
  it('tracks shots and accuracy', () => {
    const score = recordShot(recordShot(createScoreState(), false), true)

    expect(score.shotsFired).toBe(2)
    expect(score.shotsHit).toBe(1)
    expect(accuracy(score)).toBe(0.5)
  })

  it('adds combo bonuses for quick kills', () => {
    const first = recordKill(createScoreState(), 1000)
    const second = recordKill(first, 2000)

    expect(first.score).toBe(100)
    expect(second.score).toBe(225)
    expect(second.bestCombo).toBe(2)
  })

  it('adds survival bonus to the final score', () => {
    const score = recordKill(createScoreState(), 1000)

    expect(survivalBonus(61000)).toBe(305)
    expect(finalScore(score, 61000)).toBe(405)
  })
})
