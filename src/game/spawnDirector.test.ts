import { describe, expect, it } from 'vitest'
import {
  MAX_ACTIVE_ENEMIES,
  createDirectorState,
  fillSpawnCadenceForRunMs,
  maxActiveEnemiesForRunMs,
  minActiveEnemiesForRunMs,
  missingActiveEnemiesForFloor,
  selectSpawnDoor,
  spawnCadenceForRunMs,
  targetPressureForRunMs,
  tickDirector
} from './spawnDirector'

describe('spawn director', () => {
  it('ramps pressure over survival time', () => {
    expect(targetPressureForRunMs(0)).toBe(4)
    expect(targetPressureForRunMs(15000)).toBe(5)
    expect(targetPressureForRunMs(45000)).toBe(6)
    expect(targetPressureForRunMs(90000)).toBe(7)
    expect(targetPressureForRunMs(150000)).toBe(8)
    expect(targetPressureForRunMs(210000)).toBe(9)
    expect(targetPressureForRunMs(300000)).toBe(10)
  })

  it('keeps adding late-game pressure for long roguelike runs', () => {
    expect(targetPressureForRunMs(300000)).toBe(10)
    expect(targetPressureForRunMs(360000)).toBe(11)
    expect(targetPressureForRunMs(420000)).toBe(12)
    expect(targetPressureForRunMs(3_600_000)).toBe(65)
  })

  it('raises the active enemy cap over time within render headroom', () => {
    expect(maxActiveEnemiesForRunMs(0)).toBe(8)
    expect(maxActiveEnemiesForRunMs(75000)).toBe(10)
    expect(maxActiveEnemiesForRunMs(150000)).toBe(12)
    expect(maxActiveEnemiesForRunMs(300000)).toBe(12)
    expect(maxActiveEnemiesForRunMs(360000)).toBe(13)
    expect(maxActiveEnemiesForRunMs(780000)).toBe(MAX_ACTIVE_ENEMIES)
    expect(maxActiveEnemiesForRunMs(3_600_000)).toBe(MAX_ACTIVE_ENEMIES)
  })

  it('sets a stronger active enemy floor so the room does not look empty', () => {
    expect(minActiveEnemiesForRunMs(0)).toBe(5)
    expect(minActiveEnemiesForRunMs(30000)).toBe(6)
    expect(minActiveEnemiesForRunMs(75000)).toBe(8)
    expect(minActiveEnemiesForRunMs(150000)).toBe(10)
    expect(minActiveEnemiesForRunMs(3_600_000)).toBe(10)
  })

  it('reports how many enemies are missing from the active floor', () => {
    expect(missingActiveEnemiesForFloor(0, 0)).toBe(5)
    expect(missingActiveEnemiesForFloor(0, 4)).toBe(1)
    expect(missingActiveEnemiesForFloor(30000, 4)).toBe(2)
    expect(missingActiveEnemiesForFloor(75000, 4)).toBe(4)
    expect(missingActiveEnemiesForFloor(150000, 4)).toBe(6)
    expect(missingActiveEnemiesForFloor(150000, 10)).toBe(0)
  })

  it('reduces spawn cadence as the run ages', () => {
    expect(spawnCadenceForRunMs(0)).toBe(2600)
    expect(spawnCadenceForRunMs(30000)).toBeLessThan(2600)
    expect(spawnCadenceForRunMs(999999)).toBe(900)
  })

  it('uses a faster fill cadence while the room is below its enemy floor', () => {
    expect(fillSpawnCadenceForRunMs(0)).toBeLessThan(spawnCadenceForRunMs(0))
    expect(fillSpawnCadenceForRunMs(0)).toBe(909)
    expect(fillSpawnCadenceForRunMs(999999)).toBe(350)
  })

  it('spawns when active pressure is below target and cadence elapsed', () => {
    const result = tickDirector(createDirectorState(), 3000, 0, { x: 0, y: 1.7, z: 0 })

    expect(result.spawn?.door.id).toBe('north')
    expect(result.state.spawnCount).toBe(1)
  })

  it('does not spawn when pressure is already at target', () => {
    const result = tickDirector(createDirectorState(), 3000, 4, { x: 0, y: 1.7, z: 0 })

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

  it('uses fill cadence when requested', () => {
    const state = { ...createDirectorState(), lastSpawnMs: 0 }
    const fill = tickDirector(state, 1000, 0, { x: 0, y: 1.7, z: 0 }, undefined, { fillMode: true })
    const normal = tickDirector(state, 1000, 0, { x: 0, y: 1.7, z: 0 })

    expect(fill.spawn?.door.id).toBe('north')
    expect(fill.spawn?.cadenceMs).toBe(fillSpawnCadenceForRunMs(1000))
    expect(normal.spawn).toBeNull()
  })

  it('ignores pressure while filling below the enemy floor', () => {
    const state = { ...createDirectorState(), lastSpawnMs: 0 }
    const result = tickDirector(state, 1000, 99, { x: 0, y: 1.7, z: 0 }, undefined, { fillMode: true })

    expect(result.spawn?.door.id).toBe('north')
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
