import { describe, expect, it } from 'vitest'
import {
  JOYSTICK_RADIUS,
  beginJoystick,
  createJoystick,
  isTapRelease,
  joystickMovedBeyond,
  lookVectorFromStick,
  moveInputFromStick,
  moveJoystick,
  rebaseOriginIfPhantom,
  TAP_MAX_DRIFT_PX,
  TAP_MAX_MS
} from './touch'

function stickAt(dx: number, dy: number) {
  const stick = createJoystick()
  beginJoystick(stick, 7, 200, 300)
  moveJoystick(stick, 200 + dx, 300 + dy)
  return stick
}

describe('moveInputFromStick', () => {
  it('returns no movement inside the deadzone', () => {
    expect(moveInputFromStick(stickAt(5, -5))).toEqual({
      forward: false,
      backward: false,
      left: false,
      right: false
    })
  })

  it('maps thumb up to forward and thumb right to strafe right', () => {
    const input = moveInputFromStick(stickAt(JOYSTICK_RADIUS, -JOYSTICK_RADIUS))
    expect(input.forward).toBe(true)
    expect(input.right).toBe(true)
    expect(input.backward).toBe(false)
    expect(input.left).toBe(false)
  })

  it('maps thumb down-left to backward and left', () => {
    const input = moveInputFromStick(stickAt(-JOYSTICK_RADIUS, JOYSTICK_RADIUS))
    expect(input.backward).toBe(true)
    expect(input.left).toBe(true)
  })

  it('is all-false when the stick is inactive', () => {
    expect(moveInputFromStick(createJoystick())).toEqual({
      forward: false,
      backward: false,
      left: false,
      right: false
    })
  })
})

describe('lookVectorFromStick', () => {
  it('zeroes each axis independently inside the deadzone', () => {
    const v = lookVectorFromStick(stickAt(JOYSTICK_RADIUS, 4))
    expect(v.x).toBeCloseTo(1)
    expect(v.y).toBe(0)
  })

  it('keeps analog deflection outside the deadzone', () => {
    const v = lookVectorFromStick(stickAt(-JOYSTICK_RADIUS / 2, JOYSTICK_RADIUS / 2))
    expect(v.x).toBeCloseTo(-0.5)
    expect(v.y).toBeCloseTo(0.5)
  })
})

describe('tap classification', () => {
  it('a quick still release is a tap', () => {
    expect(isTapRelease(stickAt(3, 3), TAP_MAX_MS - 50)).toBe(true)
  })

  it('a slow release is not a tap', () => {
    expect(isTapRelease(stickAt(0, 0), TAP_MAX_MS + 1)).toBe(false)
  })

  it('a dragged release is not a tap', () => {
    expect(isTapRelease(stickAt(TAP_MAX_DRIFT_PX + 2, 0), 100)).toBe(false)
  })

  it('joystickMovedBeyond measures euclidean drift', () => {
    expect(joystickMovedBeyond(stickAt(10, 10), 14)).toBe(true)
    expect(joystickMovedBeyond(stickAt(9, 9), 14)).toBe(false)
  })
})

describe('rebaseOriginIfPhantom', () => {
  it('rebases a stick anchored at the exact screen origin', () => {
    const stick = createJoystick()
    beginJoystick(stick, 1, 0, 0)
    rebaseOriginIfPhantom(stick, 140, 520)
    expect(stick.originX).toBe(140)
    expect(stick.originY).toBe(520)
    expect(stick.currentX).toBe(140)
    expect(stick.currentY).toBe(520)
  })

  it('leaves a normally anchored stick alone', () => {
    const stick = stickAt(20, 0)
    rebaseOriginIfPhantom(stick, 999, 999)
    expect(stick.originX).toBe(200)
    expect(stick.currentX).toBe(220)
  })
})
