export type Vec2 = {
  x: number
  z: number
}

export type Vec3 = Vec2 & {
  y: number
}

export type MovementInput = {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
}

export type MovementConfig = {
  speed: number
  bounds: {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
  }
}

export type SphereTarget = {
  id: string
  center: Vec3
  radius: number
}

export type HitscanResult = {
  targetId: string
  distance: number
} | null
