import { describe, expect, it } from 'vitest'
import { createDirectorState, selectSpawnDoor, spawnCadenceForRunMs, targetPressureForRunMs, tickDirector } from './spawnDirector'

describe('spawn director', () => {
  it('ramps pressure over survival time', () => {
    expect(targetPressureForRunMs(0)).toBe(2)
    expect(targetPressureForRunMs(15000)).toBe(3)
    expect(targetPressureForRunMs(45000)).toBe(4)
    expect(targetPressureForRunMs(90000)).toBe(5)
    expect(targetPressureForRunMs(150000)).toBe(6)
    expect(targetPressureForRunMs(210000)).toBe(7)
    expect(targetPressureForRunMs(300000)).toBe(8)
  })

  it('asymptotes at 8 so the late-game cap matches MAX_ENEMIES headroom', () => {
    expect(targetPressureForRunMs(600000)).toBe(8)
    expect(targetPressureForRunMs(3_600_000)).toBe(8)
  })

  it('reduces spawn cadence as the run ages', () => {
    expect(spawnCadenceForRunMs(0)).toBe(2600)
    expect(spawnCadenceForRunMs(30000)).toBeLessThan(2600)
    expect(spawnCadenceForRunMs(999999)).toBe(900)
  })

  it('spawns when active pressure is below target and cadence elapsed', () => {
    const result = tickDirector(createDirectorState(), 3000, 0, { x: 0, y: 1.7, z: 0 })

    expect(result.spawn?.door.id).toBe('north')
    expect(result.state.spawnCount).toBe(1)
  })

  it('does not spawn when pressure is already at target', () => {
    const result = tickDirector(createDirectorState(), 3000, 2, { x: 0, y: 1.7, z: 0 })

    expect(result.spawn).toBeNull()
  })

  it('can scale spawn cadence for tuned practice runs', () => {
    const state = { ...createDirectorState(), lastSpawnMs: 0 }
    const fast = tickDirector(state, 1500, 0, { x: 0, y: 1.7, z: 0 }, undefined, { cadenceScale: 0.5 })
    const normal = tickDirector(state, 1500, 0, { x: 0, y: 1.7, z: 0 })

    expect(fast.spawn?.door.id).toBe('north')
    expect(fast.spawn?.cadenceMs).toBe(spawnCadenceForRunMs(1500) * 0.5)
    expect(normal.spawn).toBeNull()
  })

  it('avoids doors too close to the player when possible', () => {
    const door = selectSpawnDoor(
      [
        { id: 'near', position: { x: 0, y: 1, z: 1 }, facingAngle: 0 },
        { id: 'far', position: { x: 0, y: 1, z: 8 }, facingAngle: 0 }
      ],
      { x: 0, y: 1.7, z: 0 },
      0
    )

    expect(door.id).toBe('far')
  })
})
