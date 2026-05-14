export const DOOR_SMOKE_TTL_MS = 650
export const DOOR_SMOKE_FADE_LAST_MS = 420
export const DOOR_SMOKE_RISE_M = 0.55
export const DOOR_SMOKE_DRIFT_M = 0.75
export const DOOR_SMOKE_START_ALPHA = 0.42

export type Vec3 = { x: number; y: number; z: number }

export type DoorSmokeState = {
  ageMs: number
  origin: Vec3
  direction: Vec3
  lateral: Vec3
  size: number
}

export function doorSmokeDirectionFor(doorId: string): Vec3 {
  if (doorId === 'north') return { x: 0, y: 0, z: -1 }
  if (doorId === 'south') return { x: 0, y: 0, z: 1 }
  if (doorId === 'east') return { x: -1, y: 0, z: 0 }
  if (doorId === 'west') return { x: 1, y: 0, z: 0 }
  return { x: 0, y: 0, z: 0 }
}

export function doorSmokeAlphaScale(ageMs: number): number {
  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return 1
  }
  if (ageMs >= DOOR_SMOKE_TTL_MS) {
    return 0
  }
  const remainingMs = DOOR_SMOKE_TTL_MS - ageMs
  if (remainingMs >= DOOR_SMOKE_FADE_LAST_MS) {
    return 1
  }
  return Math.max(0, remainingMs / DOOR_SMOKE_FADE_LAST_MS)
}

export function doorSmokeProgress(ageMs: number): number {
  if (!Number.isFinite(ageMs) || ageMs <= 0) {
    return 0
  }
  return Math.min(1, ageMs / DOOR_SMOKE_TTL_MS)
}

export function doorSmokePosition(state: DoorSmokeState): Vec3 {
  const progress = doorSmokeProgress(state.ageMs)
  return {
    x: state.origin.x + state.direction.x * DOOR_SMOKE_DRIFT_M * progress + state.lateral.x,
    y: state.origin.y + DOOR_SMOKE_RISE_M * progress + state.lateral.y,
    z: state.origin.z + state.direction.z * DOOR_SMOKE_DRIFT_M * progress + state.lateral.z
  }
}

export function doorSmokeScale(state: DoorSmokeState): number {
  const progress = doorSmokeProgress(state.ageMs)
  return state.size * (1 + progress * 0.9)
}

export function tickDoorSmoke(state: DoorSmokeState, deltaMs: number): DoorSmokeState | null {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    return state
  }
  const ageMs = state.ageMs + deltaMs
  if (ageMs >= DOOR_SMOKE_TTL_MS) {
    return null
  }
  return { ...state, ageMs }
}
