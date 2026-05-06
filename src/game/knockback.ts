import type { EnemyType } from './enemies'
import type { WeaponId } from './weapons'

const KNOCKBACK_MAX_RANGE_M = 18

const baseImpulses: Record<WeaponId, { closeM: number; farM: number }> = {
  peashooter: { closeM: 0.15, farM: 0.08 },
  inkblaster: { closeM: 0.4, farM: 0.18 },
  boomstick: { closeM: 0.9, farM: 0.2 }
}

const enemyResistance: Record<EnemyType, number> = {
  grunt: 1,
  skitter: 1.3,
  brute: 0.5
}

export function knockbackDistance(weapon: WeaponId, hitDistanceM: number, enemy: EnemyType): number {
  const { closeM, farM } = baseImpulses[weapon]
  const t = Math.min(1, Math.max(0, hitDistanceM / KNOCKBACK_MAX_RANGE_M))
  const baseM = closeM + (farM - closeM) * t

  return baseM * enemyResistance[enemy]
}
