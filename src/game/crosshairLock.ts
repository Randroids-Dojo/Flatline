import type { Vec3 } from './types'

// Feel pass: detect whether an alive enemy currently sits within a
// soft angular cone of the camera forward axis (xz only). The
// FlatlineGame render loop scans alive enemies once per frame and
// flips a `data-locked` attribute on the crosshair so the player
// gets a faint "you are on target" read without changing aim
// behavior or rule.
//
// The cone uses dot-product comparison rather than atan2 so the
// helper is allocation-free and stable at the edges. Yaw 0 forward
// is -z (matches `forwardFromYawPitch`), so the forward vector here
// is `(-sin(yaw), -cos(yaw))` projected onto xz.
//
// `maxRangeM` filters far enemies that happen to align with the
// camera but are not really shootable yet; a typical room is ~12 m
// across so the default 16 m matches the longest reasonable shot.
export const CROSSHAIR_LOCK_ANGLE_RADIANS = 0.07 // about 4 degrees half-angle
export const CROSSHAIR_LOCK_MAX_RANGE_M = 16

export function isEnemyOnCrosshair(
  playerPosition: Vec3,
  yawRadians: number,
  enemyPosition: Vec3,
  angleToleranceRadians: number = CROSSHAIR_LOCK_ANGLE_RADIANS,
  maxRangeM: number = CROSSHAIR_LOCK_MAX_RANGE_M
): boolean {
  const dx = enemyPosition.x - playerPosition.x
  const dz = enemyPosition.z - playerPosition.z
  const distance = Math.hypot(dx, dz)

  if (distance === 0 || distance > maxRangeM) {
    return false
  }

  const forwardX = -Math.sin(yawRadians)
  const forwardZ = -Math.cos(yawRadians)
  const dot = (forwardX * dx + forwardZ * dz) / distance

  return dot >= Math.cos(angleToleranceRadians)
}
