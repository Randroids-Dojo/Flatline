/**
 * Score floater HUD entries.
 *
 * Without a per-kill score readout, the player has to look at the
 * top score pill to confirm a kill landed. Floaters land at the
 * enemy's last screen-space position and rise as they fade so the
 * confirmation reads even without a glance away from the action.
 */
export const SCORE_FLOATER_TTL_MS = 1200

// Combo tier the floater renders under. Higher tier = warmer color +
// stronger emphasis. Tiers align with the combo milestone tiers from
// `comboMilestone.ts` so the visual and audio feel passes point at
// the same break points.
export type ScoreFloaterTier = 'base' | 'streak' | 'rolling' | 'rampage'

export type ScoreFloater = {
  id: number
  text: string
  startedAtMs: number
  screenX: number
  screenY: number
  tier: ScoreFloaterTier
}

// Maps the combo level after a kill to the floater tier. Combo of
// 1 .. 4 stays "base"; 5 .. 9 is "streak"; 10 .. 19 is "rolling";
// 20+ is "rampage." Non-integer or non-positive inputs fall back to
// 'base' so the renderer never sees an unhandled tier.
export function scoreFloaterTier(combo: number): ScoreFloaterTier {
  if (!Number.isFinite(combo) || combo < 5) {
    return 'base'
  }
  if (combo >= 20) {
    return 'rampage'
  }
  if (combo >= 10) {
    return 'rolling'
  }
  return 'streak'
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
