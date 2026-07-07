import { describe, expect, it } from 'vitest'
import { applyFriction, applyThrust, type MoveInput } from './movement'

const FORWARD: MoveInput = { forward: true, backward: false, left: false, right: false }
const DIAGONAL: MoveInput = { forward: true, backward: false, left: false, right: true }
const NONE: MoveInput = { forward: false, backward: false, left: false, right: false }

function simulate(input: MoveInput, seconds: number): { x: number; z: number } {
  let momentum = { x: 0, z: 0 }
  const dt = 1 / 60
  for (let t = 0; t < seconds; t += dt) {
    momentum = applyThrust(momentum, 0, input, dt, 1)
    momentum = applyFriction(momentum, dt)
  }
  return momentum
}

describe('doom movement model', () => {
  it('accelerates to a stable top speed', () => {
    const early = Math.hypot(simulate(FORWARD, 0.2).x, simulate(FORWARD, 0.2).z)
    const late = Math.hypot(simulate(FORWARD, 2).x, simulate(FORWARD, 2).z)
    const later = Math.hypot(simulate(FORWARD, 4).x, simulate(FORWARD, 4).z)
    expect(early).toBeLessThan(late)
    expect(late).toBeCloseTo(later, 0)
    // Doom-fast: scaled run speed lands around 11 m/s.
    expect(late).toBeGreaterThan(9)
    expect(late).toBeLessThan(13)
  })

  it('keeps the doom quirk: diagonal is faster than forward', () => {
    const forward = Math.hypot(simulate(FORWARD, 2).x, simulate(FORWARD, 2).z)
    const diagonal = Math.hypot(simulate(DIAGONAL, 2).x, simulate(DIAGONAL, 2).z)
    expect(diagonal).toBeGreaterThan(forward * 1.1)
  })

  it('friction brings the player to a full stop', () => {
    let momentum = simulate(FORWARD, 2)
    const dt = 1 / 60
    for (let t = 0; t < 2; t += dt) {
      momentum = applyFriction(momentum, dt)
    }
    expect(momentum.x).toBe(0)
    expect(momentum.z).toBe(0)
  })

  it('no input means no movement', () => {
    const momentum = simulate(NONE, 1)
    expect(momentum.x).toBe(0)
    expect(momentum.z).toBe(0)
  })
})
