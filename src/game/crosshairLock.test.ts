import { describe, expect, it } from 'vitest'
import {
  CROSSHAIR_LOCK_ANGLE_RADIANS,
  CROSSHAIR_LOCK_MAX_RANGE_M,
  isEnemyOnCrosshair
} from './crosshairLock'

describe('isEnemyOnCrosshair', () => {
  const player = { x: 0, y: 1, z: 0 }

  it('locks when the enemy sits directly along the forward axis (yaw 0)', () => {
    // Yaw 0 forward is -z, so an enemy at -z is dead ahead.
    const enemy = { x: 0, y: 1, z: -5 }
    expect(isEnemyOnCrosshair(player, 0, enemy)).toBe(true)
  })

  it('does not lock when the enemy is behind the player', () => {
    // Enemy at +z is straight behind at yaw 0.
    const enemy = { x: 0, y: 1, z: 5 }
    expect(isEnemyOnCrosshair(player, 0, enemy)).toBe(false)
  })

  it('does not lock when the enemy is at 90 degrees off-axis', () => {
    const enemy = { x: 5, y: 1, z: 0 }
    expect(isEnemyOnCrosshair(player, 0, enemy)).toBe(false)
  })

  it('locks when the camera is rotated to face the enemy', () => {
    // Yaw PI flips forward to +z.
    const enemy = { x: 0, y: 1, z: 5 }
    expect(isEnemyOnCrosshair(player, Math.PI, enemy)).toBe(true)
  })

  it('rejects locks beyond the max range even if angularly aligned', () => {
    const enemy = { x: 0, y: 1, z: -(CROSSHAIR_LOCK_MAX_RANGE_M + 1) }
    expect(isEnemyOnCrosshair(player, 0, enemy)).toBe(false)
  })

  it('locks when the enemy sits just inside the angular tolerance', () => {
    // Place the enemy at 5m distance but skewed by half the tolerance.
    const offset = 5 * Math.tan(CROSSHAIR_LOCK_ANGLE_RADIANS * 0.5)
    const enemy = { x: offset, y: 1, z: -5 }
    expect(isEnemyOnCrosshair(player, 0, enemy)).toBe(true)
  })

  it('does not lock when the enemy sits just outside the angular tolerance', () => {
    const offset = 5 * Math.tan(CROSSHAIR_LOCK_ANGLE_RADIANS * 1.5)
    const enemy = { x: offset, y: 1, z: -5 }
    expect(isEnemyOnCrosshair(player, 0, enemy)).toBe(false)
  })

  it('returns false for the degenerate same-position case', () => {
    expect(isEnemyOnCrosshair(player, 0, player)).toBe(false)
  })
})
