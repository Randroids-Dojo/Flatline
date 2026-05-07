/**
 * Skitter dash burst.
 *
 * The skitter chases at a flat 3.45 m/s and only ever varies through
 * its melee attack windup. The threat reads as "the small one is fast
 * but predictable." Adding a brief burst when the skitter sees an
 * opening turns the encounter into "the small one *just* moved into
 * range" and gives the player a real reason to keep distance.
 *
 * The burst is a single transient speed multiplier with no dedicated
 * state. The skitter stays in the chase state during the burst; the
 * movement function reads `dashBurstMsRemaining` directly. The
 * trigger predicate fires when the skitter has seen the player at a
 * dashable distance for at least one full attack-cooldown window,
 * which throttles dashes naturally without adding a separate cooldown
 * field.
 */
export const SKITTER_DASH_DURATION_MS = 380
export const SKITTER_DASH_SPEED_MULTIPLIER = 1.85
export const SKITTER_DASH_MIN_RANGE_M = 1.5
export const SKITTER_DASH_MAX_RANGE_M = 4.0
export const SKITTER_DASH_REARM_COOLDOWN_MS = 1600

export function shouldStartSkitterDash(args: {
  type: string
  state: string
  attackCooldownMs: number
  dashBurstMsRemaining: number
  distanceToPlayerM: number
}): boolean {
  if (args.type !== 'skitter') {
    return false
  }

  if (args.state !== 'chase') {
    return false
  }

  if (args.attackCooldownMs > 0) {
    return false
  }

  if (args.dashBurstMsRemaining > 0) {
    return false
  }

  return (
    args.distanceToPlayerM >= SKITTER_DASH_MIN_RANGE_M &&
    args.distanceToPlayerM <= SKITTER_DASH_MAX_RANGE_M
  )
}

export function skitterDashSpeedScale(dashBurstMsRemaining: number): number {
  return dashBurstMsRemaining > 0 ? SKITTER_DASH_SPEED_MULTIPLIER : 1
}
