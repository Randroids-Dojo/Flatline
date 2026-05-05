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
