// Feel pass: combo milestone tiers, mirror of score milestones but
// tracking the kill streak (combo) instead of score. The audio cue
// in FlatlineGame celebrates a sustained streak so a player who is
// stringing kills hears the run climbing without a HUD popup.
//
// Tier choice: 5 is a clean "rolling" streak, 10 is "this is a real
// run," 20 is "exceptional." Same one-cue-per-update rule as score
// milestones; a streak that resets and rebuilds re-fires once it
// crosses the next threshold for the first time within the new run.
export const COMBO_MILESTONES = [5, 10, 20] as const

export type ComboMilestone = (typeof COMBO_MILESTONES)[number]

// Returns the highest milestone whose threshold was crossed during
// this update (prev < m <= current), or null when no milestone
// crossed. A combo timing out (prev high, current low) returns null
// because no threshold is freshly crossed.
export function crossedComboMilestone(prev: number, current: number): ComboMilestone | null {
  if (current <= prev) {
    return null
  }

  let highest: ComboMilestone | null = null
  for (const milestone of COMBO_MILESTONES) {
    if (prev < milestone && milestone <= current) {
      highest = milestone
    }
  }

  return highest
}
