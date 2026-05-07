/**
 * Score floater HUD entries.
 *
 * Without a per-kill score readout, the player has to look at the
 * top score pill to confirm a kill landed. Floaters land at the
 * enemy's last screen-space position and rise as they fade so the
 * confirmation reads even without a glance away from the action.
 */
export const SCORE_FLOATER_TTL_MS = 1200

export type ScoreFloater = {
  id: number
  text: string
  startedAtMs: number
  screenX: number
  screenY: number
}

/** Renders the displayed text for a kill score delta. Always shows
 * a leading "+" so the floater is unambiguously additive. */
export function formatScoreFloaterText(scoreDelta: number): string {
  if (!Number.isFinite(scoreDelta) || scoreDelta <= 0) {
    return '+0'
  }

  return `+${Math.round(scoreDelta)}`
}

/** Returns the floater list with expired entries dropped. */
export function pruneExpiredFloaters(floaters: readonly ScoreFloater[], nowMs: number): ScoreFloater[] {
  return floaters.filter((floater) => nowMs - floater.startedAtMs < SCORE_FLOATER_TTL_MS)
}
