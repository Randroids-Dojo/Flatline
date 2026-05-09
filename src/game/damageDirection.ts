import type { Vec3 } from './types'

/**
 * Compute the angle from the player's forward direction toward the damage source,
 * measured horizontally in the xz plane. Output range is the signed half-open
 * interval (-PI, PI]. 0 = source ahead, +PI/2 = source to the right,
 * +-PI = source directly behind, -PI/2 = source to the left. Matches the yaw
 * convention used by `forwardFromYawPitch` (yaw 0 forward is -z; yaw PI forward
 * is +z).
 *
 * Returns 0 when the source and player share the same xz position.
 */
export function damageDirectionRadians(
  playerYaw: number,
  sourcePosition: Vec3,
  playerPosition: Vec3
): number {
  const dx = sourcePosition.x - playerPosition.x
  const dz = sourcePosition.z - playerPosition.z

  if (dx === 0 && dz === 0) {
    return 0
  }

  const forwardX = -Math.sin(playerYaw)
  const forwardZ = -Math.cos(playerYaw)
  const rightX = -Math.cos(playerYaw)
  const rightZ = Math.sin(playerYaw)
  const forwardProjection = forwardX * dx + forwardZ * dz
  const rightProjection = rightX * dx + rightZ * dz

  return Math.atan2(rightProjection, forwardProjection)
}

// Severity tier for the damage direction HUD indicator. The HUD
// pulls warmer / brighter as severity climbs so the player can
// triage which threats hit hard. Tiers map to the current enemy
// damage table:
//   low    : <= 8   (skitter 6, spitter 8, hazard ticks)
//   medium : 9..14  (grunt 10)
//   high   : >= 15  (brute 18, future heavy hits)
// Non-positive or non-finite damage falls back to 'low' so the
// renderer never sees an unhandled tier.
export type DamageIndicatorSeverity = 'low' | 'medium' | 'high'

export function damageIndicatorSeverity(damage: number): DamageIndicatorSeverity {
  if (!Number.isFinite(damage) || damage <= 8) {
    return 'low'
  }
  if (damage <= 14) {
    return 'medium'
  }
  return 'high'
}
