import type { Vec3 } from './types'

export type SpawnDoor = {
  id: string
  position: Vec3
  facingAngle: number
}

export type DirectorState = {
  runMs: number
  lastSpawnMs: number
  spawnCount: number
}

export type SpawnDecision = {
  door: SpawnDoor
  pressureTarget: number
  cadenceMs: number
}

export type DirectorOptions = {
  cadenceScale?: number
}

export const mvpSpawnDoors: SpawnDoor[] = [
  { id: 'north', position: { x: 0, y: 1.05, z: 8.2 }, facingAngle: -Math.PI / 2 },
  { id: 'east', position: { x: 8.2, y: 1.05, z: 0 }, facingAngle: Math.PI },
  { id: 'south', position: { x: 0, y: 1.05, z: -8.2 }, facingAngle: Math.PI / 2 },
  { id: 'west', position: { x: -8.2, y: 1.05, z: 0 }, facingAngle: 0 }
]

export function createDirectorState(): DirectorState {
  return {
    runMs: 0,
    lastSpawnMs: -3000,
    spawnCount: 0
  }
}

export function tickDirector(
  state: DirectorState,
  deltaMs: number,
  activePressure: number,
  playerPosition: Vec3,
  doors = mvpSpawnDoors,
  options: DirectorOptions = {}
): { state: DirectorState; spawn: SpawnDecision | null } {
  const next = {
    ...state,
    runMs: state.runMs + deltaMs
  }
  const pressureTarget = targetPressureForRunMs(next.runMs)
  const cadenceMs = spawnCadenceForRunMs(next.runMs) * Math.max(0.25, options.cadenceScale ?? 1)

  if (activePressure >= pressureTarget || next.runMs - next.lastSpawnMs < cadenceMs) {
    return { state: next, spawn: null }
  }

  const door = selectSpawnDoor(doors, playerPosition, next.spawnCount)
  next.lastSpawnMs = next.runMs
  next.spawnCount += 1

  return {
    state: next,
    spawn: {
      door,
      pressureTarget,
      cadenceMs
    }
  }
}

export function targetPressureForRunMs(runMs: number): number {
  if (runMs < 60000) {
    return 1
  }

  if (runMs < 120000) {
    return 2
  }

  if (runMs < 240000) {
    return 3
  }

  return 4
}

export function spawnCadenceForRunMs(runMs: number): number {
  return Math.max(900, 2600 - Math.floor(runMs / 1000) * 120)
}

export function selectSpawnDoor(doors: SpawnDoor[], playerPosition: Vec3, spawnCount: number): SpawnDoor {
  const safeDoors = doors
    .map((door) => ({
      door,
      distance: Math.hypot(door.position.x - playerPosition.x, door.position.z - playerPosition.z)
    }))
    .filter((entry) => entry.distance >= 5)

  const candidates = safeDoors.length > 0 ? safeDoors : doors.map((door) => ({ door, distance: 0 }))
  return candidates[spawnCount % candidates.length].door
}
