export {
  JOYSTICK_RADIUS,
  JOYSTICK_DEADZONE,
  createJoystick,
  beginJoystick,
  moveJoystick,
  endJoystick,
  readJoystick,
} from '@randroids-dojo/vibekit'
export type { JoystickState, JoystickVector } from '@randroids-dojo/vibekit'

import type { JoystickState } from '@randroids-dojo/vibekit'

export function joystickMovedBeyond(joystick: JoystickState, threshold: number): boolean {
  return Math.hypot(joystick.currentX - joystick.originX, joystick.currentY - joystick.originY) > threshold
}
