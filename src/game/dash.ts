import type { MovementInput } from './types'

export const DASH_DURATION_MS = 180
export const DASH_DISTANCE_M = 3.2
export const DASH_COOLDOWN_MS = 1400
export const DASH_SPEED_MPS = (DASH_DISTANCE_M * 1000) / DASH_DURATION_MS

export type DashState = {
  startMs: number
  dirX: number
  dirZ: number
}

export type DashStep = {
  vx: number
  vz: number
  remainingMs: number
  active: boolean
}

export function dashCooldownRemainingMs(nowMs: number, lastDashStartMs: number): number {
  return Math.max(0, DASH_COOLDOWN_MS - (nowMs - lastDashStartMs))
}

export function dashReadyAt(nowMs: number, lastDashStartMs: number): boolean {
  return dashCooldownRemainingMs(nowMs, lastDashStartMs) === 0
}

// World-space unit vector for the dash. Uses the active WASD input
// when one is pressed, otherwise falls back to the player's view
// forward direction so a tap with no movement key still dashes.
export function dashWorldDirection(input: MovementInput, yawRadians: number): { x: number; z: number } {
  const forwardAxis = Number(input.forward) - Number(input.backward)
  const strafeAxis = Number(input.right) - Number(input.left)
  const len = Math.hypot(forwardAxis, strafeAxis)
  const sin = Math.sin(yawRadians)
  const cos = Math.cos(yawRadians)

  if (len === 0) {
    return { x: -sin, z: -cos }
  }

  const moveForward = forwardAxis / len
  const moveRight = strafeAxis / len

  return {
    x: -sin * moveForward + cos * moveRight,
    z: -cos * moveForward - sin * moveRight
  }
}

export function startDash(nowMs: number, input: MovementInput, yawRadians: number): DashState {
  const dir = dashWorldDirection(input, yawRadians)
  return { startMs: nowMs, dirX: dir.x, dirZ: dir.z }
}

export function dashStep(state: DashState | null, nowMs: number): DashStep {
  if (state === null) {
    return { vx: 0, vz: 0, remainingMs: 0, active: false }
  }

  const elapsedMs = nowMs - state.startMs

  if (elapsedMs < 0 || elapsedMs >= DASH_DURATION_MS) {
    return { vx: 0, vz: 0, remainingMs: 0, active: false }
  }

  return {
    vx: state.dirX * DASH_SPEED_MPS,
    vz: state.dirZ * DASH_SPEED_MPS,
    remainingMs: DASH_DURATION_MS - elapsedMs,
    active: true
  }
}
