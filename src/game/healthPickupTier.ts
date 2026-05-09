/**
 * Tier selection for the central altar health pickup.
 *
 * `docs/gdd/33-pickup-health.md` calls for two heal sizes:
 * - Small: restores 10, common
 * - Large: restores 35, rare, in dangerous locations
 *
 * The arena has one pickup zone (the central altar) so "dangerous
 * locations" is satisfied by route, not geometry: the player has to
 * cross open ground past the spawn doors to reach it. Rarity is
 * gated on three signals so the large heal reads as a comeback verb,
 * not a free top-up:
 *
 * 1. Player health is at or below `LARGE_HEAL_HEALTH_THRESHOLD`. The
 *    large heal is meaningless to a healthy player.
 * 2. Wave director pressure is at or above `LARGE_HEAL_MIN_PRESSURE`.
 *    Same threshold the rage and score-token pickups already use, so
 *    the altar stays calm in early-run and dangerous in late-run.
 * 3. The rearm window `LARGE_HEAL_REARM_MS` has elapsed since the
 *    last large pickup. Without this gate a player who lingers near
 *    the altar would farm large heals every supply cooldown.
 */
export const SMALL_HEAL_AMOUNT = 10
export const LARGE_HEAL_AMOUNT = 35
export const LARGE_HEAL_HEALTH_THRESHOLD = 35
export const LARGE_HEAL_MIN_PRESSURE = 2
export const LARGE_HEAL_REARM_MS = 60_000

export type HealthPickupTier = 'small' | 'large'

export type HealthPickupTierInput = {
  playerHealth: number
  pressure: number
  runMs: number
  lastLargeRunMs: number
}

export function healthPickupTier(input: HealthPickupTierInput): HealthPickupTier {
  if (input.playerHealth > LARGE_HEAL_HEALTH_THRESHOLD) {
    return 'small'
  }

  if (input.pressure < LARGE_HEAL_MIN_PRESSURE) {
    return 'small'
  }

  if (input.runMs - input.lastLargeRunMs < LARGE_HEAL_REARM_MS) {
    return 'small'
  }

  return 'large'
}

export function healthPickupAmount(tier: HealthPickupTier): number {
  return tier === 'large' ? LARGE_HEAL_AMOUNT : SMALL_HEAL_AMOUNT
}
