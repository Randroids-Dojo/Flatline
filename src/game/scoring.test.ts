import { describe, expect, it } from 'vitest'
import {
  ACCURACY_BONUS_MULTIPLIER,
  CLOSE_RANGE_BONUS,
  CLOSE_RANGE_THRESHOLD,
  NO_DAMAGE_STREAK_BONUS,
  WEAPON_VARIETY_BONUS,
  accuracy,
  accuracyBonus,
  createScoreState,
  finalScore,
  recordKill,
  recordShot,
  survivalBonus
} from './scoring'

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

    // First kill: 100 base + 30 no-damage-streak bonus = 130.
    expect(first.score).toBe(130)
    // Second kill (combo 2): 100 base + 25 combo + 30 no-damage-streak = 285 cumulative.
    expect(second.score).toBe(285)
    expect(second.bestCombo).toBe(2)
  })

  it('adds survival bonus to the final score', () => {
    const score = recordKill(createScoreState(), 1000)

    expect(survivalBonus(61000)).toBe(305)
    // 130 (kill + no-damage) + 305 (survival) + 0 (no shots fired, no accuracy bonus) = 435.
    expect(finalScore(score, 61000)).toBe(435)
  })

  it('grants close-range bonus when the kill is within the threshold', () => {
    const close = recordKill(createScoreState(), 1000, { distance: CLOSE_RANGE_THRESHOLD - 0.1 })
    const far = recordKill(createScoreState(), 1000, { distance: CLOSE_RANGE_THRESHOLD + 0.1 })

    // Close: 100 base + 30 no-damage + 50 close-range = 180.
    expect(close.score).toBe(100 + NO_DAMAGE_STREAK_BONUS + CLOSE_RANGE_BONUS)
    expect(close.closeRangeKills).toBe(1)
    expect(far.score).toBe(100 + NO_DAMAGE_STREAK_BONUS)
    expect(far.closeRangeKills).toBe(0)
  })

  it('grants weapon variety bonus only the first time each weapon scores a kill', () => {
    const first = recordKill(createScoreState(), 1000, { weapon: 'peashooter' })
    const secondSameWeapon = recordKill(first, 2000, { weapon: 'peashooter' })
    const thirdNewWeapon = recordKill(secondSameWeapon, 3000, { weapon: 'boomstick' })

    // First weapon kill triggers variety bonus.
    expect(first.score).toBe(100 + NO_DAMAGE_STREAK_BONUS + WEAPON_VARIETY_BONUS)
    expect(first.weaponsUsedForKills).toEqual(['peashooter'])

    // Second kill with same weapon: 100 base + 25 combo + 30 streak.
    const expectedSecond = first.score + 100 + 25 + NO_DAMAGE_STREAK_BONUS
    expect(secondSameWeapon.score).toBe(expectedSecond)

    // Third kill with new weapon: combo 3 (+50), streak, plus variety bonus again.
    const expectedThird = secondSameWeapon.score + 100 + 50 + NO_DAMAGE_STREAK_BONUS + WEAPON_VARIETY_BONUS
    expect(thirdNewWeapon.score).toBe(expectedThird)
    expect(thirdNewWeapon.weaponsUsedForKills).toEqual(['peashooter', 'boomstick'])
  })

  it('breaks the no-damage streak when the player took damage between kills', () => {
    const first = recordKill(createScoreState(), 1000)
    const second = recordKill(first, 2000, { tookDamageSinceLastKill: true })
    const third = recordKill(second, 3000)

    expect(first.noDamageStreakKills).toBe(1)
    expect(second.noDamageStreakKills).toBe(1)
    // Second kill resets streak so it grants no streak bonus: 100 base + 25 combo only.
    expect(second.score - first.score).toBe(125)
    // Third kill resumes streak: 100 base + 50 combo + 30 streak.
    expect(third.score - second.score).toBe(180)
    expect(third.bestNoDamageStreak).toBe(2)
  })

  it('keeps the best no-damage streak after a break', () => {
    let state = createScoreState()
    for (let i = 0; i < 5; i += 1) {
      state = recordKill(state, 1000 + i * 500)
    }
    expect(state.bestNoDamageStreak).toBe(5)

    state = recordKill(state, 4000, { tookDamageSinceLastKill: true })
    state = recordKill(state, 4500)

    expect(state.noDamageStreakKills).toBe(2)
    expect(state.bestNoDamageStreak).toBe(5)
  })

  it('adds an accuracy bonus to final score when shots have been fired', () => {
    let state = recordShot(createScoreState(), true)
    state = recordShot(state, true)
    state = recordShot(state, false)
    state = recordKill(state, 1000)

    expect(accuracyBonus(state)).toBe(Math.round((2 / 3) * ACCURACY_BONUS_MULTIPLIER))
    // Final = state.score + survival(0) + accuracyBonus.
    expect(finalScore(state, 0)).toBe(state.score + accuracyBonus(state))
  })

  it('reports zero accuracy bonus when no shots have been fired', () => {
    const state = recordKill(createScoreState(), 1000)
    expect(accuracyBonus(state)).toBe(0)
    expect(finalScore(state, 0)).toBe(state.score)
  })
})
