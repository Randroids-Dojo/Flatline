import type { Vec3 } from './types'

export const billboardAngles = [
  'front',
  'frontRight',
  'right',
  'backRight',
  'back',
  'backLeft',
  'left',
  'frontLeft'
] as const

export type BillboardAngle = (typeof billboardAngles)[number]

export function normalizeRadians(angleRadians: number): number {
  const turn = Math.PI * 2
  return ((angleRadians % turn) + turn) % turn
}

export function angleToBucket(relativeAngleRadians: number, bucketCount = billboardAngles.length): number {
  const turn = Math.PI * 2
  const bucketWidth = turn / bucketCount
  return Math.floor(normalizeRadians(relativeAngleRadians + bucketWidth / 2) / bucketWidth) % bucketCount
}

export function angleNameForBucket(bucket: number): BillboardAngle {
  return billboardAngles[((bucket % billboardAngles.length) + billboardAngles.length) % billboardAngles.length]
}

export function angleToPlayerBucket(enemyPosition: Vec3, enemyFacingAngle: number, playerPosition: Vec3): number {
  const angleToPlayer = Math.atan2(playerPosition.z - enemyPosition.z, playerPosition.x - enemyPosition.x)
  return angleToBucket(angleToPlayer - enemyFacingAngle)
}

export function angleToPlayerName(
  enemyPosition: Vec3,
  enemyFacingAngle: number,
  playerPosition: Vec3
): BillboardAngle {
  return angleNameForBucket(angleToPlayerBucket(enemyPosition, enemyFacingAngle, playerPosition))
}
