/**
 * Boomstick point-blank damage ramp.
 *
 * Doom's iconic feel beat is the super shotgun at face range: the shot
 * stops being a sequence of pellets and becomes an instant kill on
 * standard chaff. Without a damage ramp the boomstick's per-pellet
 * baseline reads the same at 1 m and at 8 m, which flattens the verb.
 *
 * The ramp is intentionally a hard step rather than a curve. The verb
 * is "I am close enough, this is the kill shot" not "every meter
 * matters." The threshold and multiplier are exposed as constants so
 * tests pin the rule and tuning lives in one place.
 */
export const BOOMSTICK_POINT_BLANK_M = 2.0
export const BOOMSTICK_POINT_BLANK_MULT = 1.5

export function boomstickPointBlankMultiplier(closestPelletDistanceM: number): number {
  if (closestPelletDistanceM < BOOMSTICK_POINT_BLANK_M) {
    return BOOMSTICK_POINT_BLANK_MULT
  }

  return 1
}
