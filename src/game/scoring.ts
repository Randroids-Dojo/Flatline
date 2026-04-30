export type ScoreState = {
  score: number
  kills: number
  shotsFired: number
  shotsHit: number
  bestCombo: number
  combo: number
  comboExpiresAtMs: number
}

export function createScoreState(): ScoreState {
  return {
    score: 0,
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
    bestCombo: 0,
    combo: 0,
    comboExpiresAtMs: 0
  }
}

export function recordShot(score: ScoreState, hit: boolean): ScoreState {
  return {
    ...score,
    shotsFired: score.shotsFired + 1,
    shotsHit: score.shotsHit + Number(hit)
  }
}

export function recordKill(score: ScoreState, nowMs: number, baseScore = 100): ScoreState {
  const combo = nowMs <= score.comboExpiresAtMs ? score.combo + 1 : 1
  const comboBonus = Math.max(0, combo - 1) * 25
  const nextScore = score.score + baseScore + comboBonus

  return {
    ...score,
    score: nextScore,
    kills: score.kills + 1,
    combo,
    bestCombo: Math.max(score.bestCombo, combo),
    comboExpiresAtMs: nowMs + 2500
  }
}

export function survivalBonus(runMs: number): number {
  return Math.floor(runMs / 1000) * 5
}

export function accuracy(score: ScoreState): number {
  if (score.shotsFired === 0) {
    return 0
  }

  return score.shotsHit / score.shotsFired
}

export function finalScore(score: ScoreState, runMs: number): number {
  return score.score + survivalBonus(runMs)
}
