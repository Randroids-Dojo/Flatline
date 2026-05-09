import type { EnemyType } from './enemies'

/**
 * Small floating score tokens dropped by enemies on death.
 *
 * `docs/gdd/35-pickup-score.md` describes the spec form: "Optional
 * small floating tokens dropped by enemies. They vanish quickly and
 * reward aggressive play." The existing `scoreToken.ts` v1 ships a
 * different shape (an altar-buff multiplier window). This module
 * adds the spec's drop-on-kill form alongside.
 *
 * `SCORE_TOKEN_DROP_CHANCE` is the per-type probability that a kill
 * spawns a token. Heavier enemies drop more often so finishing a
 * brute feels rewarded; the skitter is the lowest.
 * `SCORE_TOKEN_TTL_MS` keeps tokens short-lived so the player has to
 * push forward to collect (the "reward aggressive play" line).
 * `SCORE_TOKEN_PICKUP_RADIUS_M` is generous enough that brushing a
 * token while moving picks it up.
 * `SCORE_TOKEN_BONUS` is the score amount on collect.
 */
export const SCORE_TOKEN_TTL_MS = 1500
export const SCORE_TOKEN_PICKUP_RADIUS_M = 0.9
export const SCORE_TOKEN_BONUS = 25

export const SCORE_TOKEN_DROP_CHANCE: Readonly<Record<EnemyType, number>> = Object.freeze({
  skitter: 0.2,
  grunt: 0.25,
  spitter: 0.3,
  brute: 0.45
})

export type ScoreTokenDrop = {
  id: string
  position: { x: number; y: number; z: number }
  ageMs: number
}

export function shouldDropScoreToken(type: EnemyType, rng: number): boolean {
  return rng < SCORE_TOKEN_DROP_CHANCE[type]
}

export function tickScoreTokens(tokens: readonly ScoreTokenDrop[], deltaMs: number): ScoreTokenDrop[] {
  const next: ScoreTokenDrop[] = []

  for (const token of tokens) {
    const ageMs = token.ageMs + deltaMs

    if (ageMs >= SCORE_TOKEN_TTL_MS) {
      continue
    }

    next.push({ id: token.id, position: token.position, ageMs })
  }

  return next
}

export function scoreTokenPickupIds(
  tokens: readonly ScoreTokenDrop[],
  playerPosition: { x: number; z: number }
): string[] {
  const hits: string[] = []
  const rSq = SCORE_TOKEN_PICKUP_RADIUS_M * SCORE_TOKEN_PICKUP_RADIUS_M

  for (const token of tokens) {
    const dx = token.position.x - playerPosition.x
    const dz = token.position.z - playerPosition.z

    if (dx * dx + dz * dz <= rSq) {
      hits.push(token.id)
    }
  }

  return hits
}

/**
 * Vertical bob offset in metres so the token reads as floating.
 * Deterministic in `ageMs` so two tokens spawned the same frame
 * stay in phase, which is fine because they spawn at different
 * positions.
 */
export function scoreTokenBobY(ageMs: number): number {
  const phase = (ageMs / 1000) * 2 * Math.PI * 2
  return 0.6 + Math.sin(phase) * 0.08
}
