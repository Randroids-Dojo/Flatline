import { describe, expect, it } from 'vitest'
import { createDirectorState, selectSpawnDoor, spawnCadenceForRunMs, targetPressureForRunMs, tickDirector } from './spawnDirector'

describe('spawn director', () => {
  it('ramps pressure over survival time', () => {
    expect(targetPressureForRunMs(0)).toBe(1)
    expect(targetPressureForRunMs(60000)).toBe(2)
    expect(targetPressureForRunMs(120000)).toBe(3)
    expect(targetPressureForRunMs(240000)).toBe(4)
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
    const result = tickDirector(createDirectorState(), 3000, 1, { x: 0, y: 1.7, z: 0 })

    expect(result.spawn).toBeNull()
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
