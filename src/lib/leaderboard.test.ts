import { describe, expect, it } from 'vitest'
import { bestLocalScore, insertLeaderboardEntry } from './leaderboard'

describe('insertLeaderboardEntry', () => {
  it('sorts by score and keeps the requested limit', () => {
    const entries = insertLeaderboardEntry(
      [
        entry('AAA', 100, 10000, 1),
        entry('BBB', 300, 8000, 2)
      ],
      entry('CCC', 200, 12000, 3),
      2
    )

    expect(entries.map((item) => item.playerInitials)).toEqual(['BBB', 'CCC'])
  })

  it('reports null best score for an empty leaderboard', () => {
    expect(bestLocalScore([])).toBeNull()
  })

  it('reports the highest score across the entries', () => {
    expect(
      bestLocalScore([
        entry('AAA', 120, 9000, 1),
        entry('BBB', 540, 8000, 2),
        entry('CCC', 200, 12000, 3)
      ])
    ).toBe(540)
  })

  it('uses survival time and kills as ties after score', () => {
    const entries = insertLeaderboardEntry(
      [entry('AAA', 100, 10000, 1), entry('BBB', 100, 10000, 3)],
      entry('CCC', 100, 12000, 1),
      3
    )

    expect(entries.map((item) => item.playerInitials)).toEqual(['CCC', 'BBB', 'AAA'])
  })
})

function entry(playerInitials: string, score: number, survivalMs: number, kills: number) {
  return {
    playerInitials,
    score,
    survivalMs,
    kills,
    accuracy: 0.5,
    bestCombo: 1,
    createdAt: '2026-04-30T00:00:00.000Z'
  }
}
