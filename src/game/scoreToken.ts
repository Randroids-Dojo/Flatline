export const SCORE_TOKEN_DURATION_MS = 6_000
export const SCORE_TOKEN_MULTIPLIER = 2
export const SCORE_TOKEN_REARM_MS = 70_000

export type ScoreTokenState = {
  startMs: number
}

export function scoreTokenActive(state: ScoreTokenState | null, nowMs: number): boolean {
  if (state === null) {
    return false
  }

  const elapsed = nowMs - state.startMs
  return elapsed >= 0 && elapsed < SCORE_TOKEN_DURATION_MS
}

export function scoreTokenRemainingMs(state: ScoreTokenState | null, nowMs: number): number {
  if (state === null) {
    return 0
  }

  return Math.max(0, SCORE_TOKEN_DURATION_MS - (nowMs - state.startMs))
}

export function scoreTokenMultiplier(state: ScoreTokenState | null, nowMs: number): number {
  return scoreTokenActive(state, nowMs) ? SCORE_TOKEN_MULTIPLIER : 1
}
