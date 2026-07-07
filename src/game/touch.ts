// Touch control mapping for the mobile layer. The float-where-you-tap
// joystick math comes from vibekit (proven in the pre-reboot Flatline and
// VibeRacer); this module adds the Flatline-specific pieces: stick
// deflection to Doom-style digital move input, a filtered look vector,
// tap-vs-drag classification for tap-to-fire, and the phantom (0, 0)
// pointerdown rebase carried over from pre-reboot followup F-005.

import {
  JOYSTICK_DEADZONE,
  readJoystick,
  type JoystickState,
  type JoystickVector
} from '@randroids-dojo/vibekit'
import type { MoveInput } from './movement'

export {
  JOYSTICK_DEADZONE,
  JOYSTICK_RADIUS,
  beginJoystick,
  createJoystick,
  endJoystick,
  moveJoystick,
  readJoystick
} from '@randroids-dojo/vibekit'
export type { JoystickState, JoystickVector } from '@randroids-dojo/vibekit'

// A release counts as a tap (fire once) when the thumb stayed inside this
// drift radius and lifted quickly; anything longer is aiming.
export const TAP_MAX_DRIFT_PX = 14
export const TAP_MAX_MS = 260

// Radians per second at full stick deflection.
export const LOOK_YAW_RATE = 2.6
export const LOOK_PITCH_RATE = 1.9

// Doom movement is digital, so the stick maps to four booleans; past the
// deadzone the player runs at full speed like a held key.
export function moveInputFromStick(stick: JoystickState): MoveInput {
  const v = readJoystick(stick)
  return {
    forward: v.y < -JOYSTICK_DEADZONE,
    backward: v.y > JOYSTICK_DEADZONE,
    left: v.x < -JOYSTICK_DEADZONE,
    right: v.x > JOYSTICK_DEADZONE
  }
}

// Look keeps the analog deflection but zeroes each axis inside the
// deadzone so a resting thumb does not drift the camera.
export function lookVectorFromStick(stick: JoystickState): JoystickVector {
  const v = readJoystick(stick)
  return {
    x: Math.abs(v.x) > JOYSTICK_DEADZONE ? v.x : 0,
    y: Math.abs(v.y) > JOYSTICK_DEADZONE ? v.y : 0
  }
}

export function joystickMovedBeyond(stick: JoystickState, thresholdPx: number): boolean {
  return Math.hypot(stick.currentX - stick.originX, stick.currentY - stick.originY) > thresholdPx
}

export function isTapRelease(stick: JoystickState, heldMs: number): boolean {
  return heldMs < TAP_MAX_MS && !joystickMovedBeyond(stick, TAP_MAX_DRIFT_PX)
}

// Some mobile Chrome builds deliver the first touch of a session anchored
// at the exact screen origin (pre-reboot F-005). A stick whose origin is
// (0, 0) rebases onto the first real move so the knob does not lunge from
// the corner.
export function rebaseOriginIfPhantom(stick: JoystickState, x: number, y: number): void {
  if (stick.originX === 0 && stick.originY === 0 && (x !== 0 || y !== 0)) {
    stick.originX = x
    stick.originY = y
    stick.currentX = x
    stick.currentY = y
  }
}
