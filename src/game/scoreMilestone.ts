// F-016 feel pass continuation. Score milestone detection.
//
// Three escalating tiers signal progress without changing scoring
// rules. The audio palette in FlatlineGame.tsx pitches each tier
// distinctly so a returning player hears their run climbing.
//
// Tier choice: 1000 lands inside the first minute of a typical run,
// 5000 lands as a clear "good run" signal, 10000 lands as a "best
// run material" signal. Higher tiers are intentionally absent for
// v1 because daily / endless runs above 10k are rare today; the
// list can grow as run lengths grow.
export const SCORE_MILESTONES = [1000, 5000, 10000] as const

export type ScoreMilestone = (typeof SCORE_MILESTONES)[number]

// Returns the highest milestone whose threshold was crossed during
// this update (prev < m <= current), or null when no milestone
// crossed. The rule lets one update fire at most one cue, even when
// a single kill scores past multiple thresholds at once. A score
// decrease never fires a cue.
export function crossedScoreMilestone(prev: number, current: number): ScoreMilestone | null {
  if (current <= prev) {
    return null
  }

  let highest: ScoreMilestone | null = null
  for (const milestone of SCORE_MILESTONES) {
    if (prev < milestone && milestone <= current) {
      highest = milestone
    }
  }

  return highest
}
