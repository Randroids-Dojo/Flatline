export type JoystickState = {
  active: boolean
  pointerId: number | null
  originX: number
  originY: number
  currentX: number
  currentY: number
}

export type JoystickVector = {
  x: number
  y: number
}

export const joystickRadius = 64
export const joystickDeadzone = 0.22

export function createJoystick(): JoystickState {
  return {
    active: false,
    pointerId: null,
    originX: 0,
    originY: 0,
    currentX: 0,
    currentY: 0
  }
}

export function beginJoystick(joystick: JoystickState, pointerId: number, x: number, y: number): void {
  joystick.active = true
  joystick.pointerId = pointerId
  joystick.originX = x
  joystick.originY = y
  joystick.currentX = x
  joystick.currentY = y
}

export function moveJoystick(joystick: JoystickState, x: number, y: number): void {
  if (!joystick.active) {
    return
  }

  joystick.currentX = x
  joystick.currentY = y
}

export function endJoystick(joystick: JoystickState): void {
  joystick.active = false
  joystick.pointerId = null
}

export function readJoystick(joystick: JoystickState): JoystickVector {
  if (!joystick.active) {
    return { x: 0, y: 0 }
  }

  const dx = joystick.currentX - joystick.originX
  const dy = joystick.currentY - joystick.originY
  const length = Math.hypot(dx, dy)

  if (length <= joystickRadius) {
    return { x: dx / joystickRadius, y: dy / joystickRadius }
  }

  return { x: dx / length, y: dy / length }
}

export function joystickMovedBeyond(joystick: JoystickState, threshold: number): boolean {
  return Math.hypot(joystick.currentX - joystick.originX, joystick.currentY - joystick.originY) > threshold
}
