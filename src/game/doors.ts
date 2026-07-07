// Doom-style vertical sliding doors: open on use, wait, slide back down.
// Doom doors move at 2 map units per tic (about 2.19 m/s) and stay open for
// 150 tics (about 4.3 seconds).

export const DOOR_SPEED_M_PER_S = 2.19
export const DOOR_OPEN_HOLD_S = 4.3

export type DoorPhase = 'closed' | 'opening' | 'open' | 'closing'

export type DoorState = {
  gx: number
  gz: number
  axis: 'x' | 'z'
  locked: boolean
  phase: DoorPhase
  // 0 fully closed, 1 fully open (slid up into the ceiling).
  openness: number
  holdTimer: number
}

export function createDoor(gx: number, gz: number, axis: 'x' | 'z', locked: boolean): DoorState {
  return { gx, gz, axis, locked, phase: 'closed', openness: 0, holdTimer: 0 }
}

export type UseDoorResult = 'opened' | 'locked' | 'ignored'

export function operateDoor(door: DoorState, hasKey: boolean): UseDoorResult {
  if (door.locked && !hasKey) {
    return 'locked'
  }
  if (door.phase === 'closed' || door.phase === 'closing') {
    door.locked = false
    door.phase = 'opening'
    return 'opened'
  }
  return 'ignored'
}

export function tickDoor(door: DoorState, dt: number, wallHeightM: number, blocked: boolean) {
  const rate = DOOR_SPEED_M_PER_S / wallHeightM
  if (door.phase === 'opening') {
    door.openness = Math.min(1, door.openness + rate * dt)
    if (door.openness >= 1) {
      door.phase = 'open'
      door.holdTimer = DOOR_OPEN_HOLD_S
    }
  } else if (door.phase === 'open') {
    door.holdTimer -= dt
    if (door.holdTimer <= 0 && !blocked) {
      door.phase = 'closing'
    }
  } else if (door.phase === 'closing') {
    if (blocked) {
      // Doom doors bounce back up when something stands under them.
      door.phase = 'opening'
      return
    }
    door.openness = Math.max(0, door.openness - rate * dt)
    if (door.openness <= 0) {
      door.phase = 'closed'
    }
  }
}

// A door cell blocks movement until it is mostly open.
export function doorBlocks(door: DoorState): boolean {
  return door.openness < 0.9
}
