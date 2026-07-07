// Doom's momentum model, converted from tic-based fixed point to seconds.
// Thrust accumulates into momentum; friction multiplies momentum by 0.90625
// per tic (35 tics/sec). Equilibrium top speed running forward is about
// 18.2 m/s in original units; we scale it down slightly because this
// dungeon's corridors are tighter than Doom's arenas.
//
// Doom quirk kept on purpose: diagonal movement is NOT normalized, so
// running forward while strafing really is faster.

import type { Vec2 } from './types'

export const SPEED_SCALE = 0.62
export const FRICTION_PER_TIC = 0.90625
export const TICS_PER_SEC = 35

// mu/tic^2 thrust converted to m/s^2: value * 35 tics / 32 mu-per-m * 35.
const RUN_FORWARD_THRUST = (1.5625 * 35 * 35) / 32
const RUN_STRAFE_THRUST = (1.25 * 35 * 35) / 32

export type MoveInput = {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
}

export function applyThrust(
  momentum: Vec2,
  yaw: number,
  input: MoveInput,
  dt: number,
  speedMultiplier: number
): Vec2 {
  const forwardAxis = Number(input.forward) - Number(input.backward)
  const strafeAxis = Number(input.right) - Number(input.left)
  const sin = Math.sin(yaw)
  const cos = Math.cos(yaw)
  const scale = SPEED_SCALE * speedMultiplier * dt
  const fwd = forwardAxis * RUN_FORWARD_THRUST * scale
  const str = strafeAxis * RUN_STRAFE_THRUST * scale
  return {
    x: momentum.x + sin * fwd + cos * str,
    z: momentum.z + cos * fwd - sin * str
  }
}

export function applyFriction(momentum: Vec2, dt: number): Vec2 {
  const factor = Math.pow(FRICTION_PER_TIC, dt * TICS_PER_SEC)
  const x = momentum.x * factor
  const z = momentum.z * factor
  // STOPSPEED: kill tiny drift so the player actually halts.
  if (Math.hypot(x, z) < 0.07) {
    return { x: 0, z: 0 }
  }
  return { x, z }
}
