import { describe, expect, it } from 'vitest'
import {
  beginJoystick,
  createJoystick,
  endJoystick,
  joystickMovedBeyond,
  joystickRadius,
  moveJoystick,
  readJoystick
} from './virtualJoystick'

describe('virtual joystick', () => {
  it('starts inactive and reads neutral', () => {
    const joystick = createJoystick()

    expect(joystick.active).toBe(false)
    expect(readJoystick(joystick)).toEqual({ x: 0, y: 0 })
  })

  it('reads normalized movement inside the radius', () => {
    const joystick = createJoystick()
    beginJoystick(joystick, 7, 100, 100)
    moveJoystick(joystick, 100 + joystickRadius / 2, 100 - joystickRadius / 4)

    expect(readJoystick(joystick)).toEqual({ x: 0.5, y: -0.25 })
  })

  it('clamps movement beyond the radius', () => {
    const joystick = createJoystick()
    beginJoystick(joystick, 7, 100, 100)
    moveJoystick(joystick, 300, 100)

    expect(readJoystick(joystick)).toEqual({ x: 1, y: 0 })
    expect(joystickMovedBeyond(joystick, 24)).toBe(true)
  })

  it('ends and returns neutral again', () => {
    const joystick = createJoystick()
    beginJoystick(joystick, 7, 100, 100)
    endJoystick(joystick)

    expect(joystick.active).toBe(false)
    expect(joystick.pointerId).toBeNull()
    expect(readJoystick(joystick)).toEqual({ x: 0, y: 0 })
  })
})
