// Feel pass: detect when a run crosses the player's previous local
// best for the first time. The cue this drives in FlatlineGame is a
// triumphant sting that reads as "you just passed your record" -- a
// distinct signal from the score milestone cues, which fire on
// arbitrary thresholds rather than personal achievements.
//
// `previousBest` is the highest score in the local leaderboard at
// run start (null when the player has no recorded runs yet -- in
// that case the first run never fires the cue, since there is no
// record to beat). The helper takes the score state delta plus the
// previousBest, and returns true only on the transition that the
// kill puts the run over the record. Subsequent kills in the same
// run pass through silently.
export function justCrossedPersonalBest(
  previousScore: number,
  currentScore: number,
  previousBest: number | null
): boolean {
  if (previousBest === null) {
    return false
  }
  if (previousScore > previousBest) {
    return false
  }
  return currentScore > previousBest
}
