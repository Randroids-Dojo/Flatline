import type { MovementConfig, MovementInput, Vec3 } from './types'

export function updatePlayerPosition(
  position: Vec3,
  yawRadians: number,
  input: MovementInput,
  deltaSeconds: number,
  config: MovementConfig
): Vec3 {
  const forwardAxis = Number(input.forward) - Number(input.backward)
  const strafeAxis = Number(input.right) - Number(input.left)
  const length = Math.hypot(forwardAxis, strafeAxis)

  if (length === 0 || deltaSeconds <= 0) {
    return position
  }

  const moveForward = forwardAxis / length
  const moveRight = strafeAxis / length
  const sin = Math.sin(yawRadians)
  const cos = Math.cos(yawRadians)
  const distance = config.speed * deltaSeconds

  const dx = (sin * moveForward + cos * moveRight) * distance
  const dz = (cos * moveForward - sin * moveRight) * distance

  return {
    x: clamp(position.x + dx, config.bounds.minX, config.bounds.maxX),
    y: position.y,
    z: clamp(position.z + dz, config.bounds.minZ, config.bounds.maxZ)
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
