import type { HitscanResult, SphereTarget, Vec3 } from './types'

export function fireHitscan(origin: Vec3, direction: Vec3, targets: SphereTarget[], maxDistance: number): HitscanResult {
  const normalizedDirection = normalize(direction)
  let closest: HitscanResult = null

  for (const target of targets) {
    const distance = raySphereDistance(origin, normalizedDirection, target.center, target.radius)

    if (distance === null || distance > maxDistance) {
      continue
    }

    if (closest === null || distance < closest.distance) {
      closest = {
        targetId: target.id,
        distance
      }
    }
  }

  return closest
}

export function forwardFromYawPitch(yawRadians: number, pitchRadians: number): Vec3 {
  const pitchCos = Math.cos(pitchRadians)

  return normalize({
    x: Math.sin(yawRadians) * pitchCos,
    y: Math.sin(pitchRadians),
    z: Math.cos(yawRadians) * pitchCos
  })
}

function raySphereDistance(origin: Vec3, direction: Vec3, center: Vec3, radius: number): number | null {
  const ox = origin.x - center.x
  const oy = origin.y - center.y
  const oz = origin.z - center.z
  const b = 2 * (direction.x * ox + direction.y * oy + direction.z * oz)
  const c = ox * ox + oy * oy + oz * oz - radius * radius
  const discriminant = b * b - 4 * c

  if (discriminant < 0) {
    return null
  }

  const root = Math.sqrt(discriminant)
  const near = (-b - root) / 2
  const far = (-b + root) / 2

  if (near >= 0) {
    return near
  }

  if (far >= 0) {
    return far
  }

  return null
}

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector.x, vector.y, vector.z)

  if (length === 0) {
    return { x: 0, y: 0, z: 1 }
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  }
}
