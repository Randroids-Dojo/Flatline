import { describe, expect, it } from 'vitest'
import { createDoor, doorBlocks, tickDoor, operateDoor, DOOR_OPEN_HOLD_S } from './doors'

describe('doors', () => {
  it('opens on use, holds, then closes', () => {
    const door = createDoor(1, 1, 'x', false)
    expect(operateDoor(door, false)).toBe('opened')
    // Fully open after enough time (3m wall at 2.19 m/s ~ 1.4s).
    tickDoor(door, 2, 3, false)
    expect(door.phase).toBe('open')
    expect(doorBlocks(door)).toBe(false)
    // Hold expires, door closes.
    tickDoor(door, DOOR_OPEN_HOLD_S + 0.1, 3, false)
    expect(door.phase).toBe('closing')
    tickDoor(door, 2, 3, false)
    expect(door.phase).toBe('closed')
    expect(doorBlocks(door)).toBe(true)
  })

  it('locked doors refuse without the key and open with it', () => {
    const door = createDoor(1, 1, 'z', true)
    expect(operateDoor(door, false)).toBe('locked')
    expect(door.phase).toBe('closed')
    expect(operateDoor(door, true)).toBe('opened')
    expect(door.locked).toBe(false)
  })

  it('bounces back up when blocked while closing', () => {
    const door = createDoor(0, 0, 'x', false)
    operateDoor(door, false)
    tickDoor(door, 2, 3, false)
    tickDoor(door, DOOR_OPEN_HOLD_S + 0.1, 3, false)
    expect(door.phase).toBe('closing')
    tickDoor(door, 0.2, 3, true)
    expect(door.phase).toBe('opening')
  })

  it('stays open while something stands in it', () => {
    const door = createDoor(0, 0, 'x', false)
    operateDoor(door, false)
    tickDoor(door, 2, 3, false)
    tickDoor(door, DOOR_OPEN_HOLD_S + 5, 3, true)
    expect(door.phase).toBe('open')
  })
})
