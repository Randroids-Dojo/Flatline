import type { Vec3 } from './types'

export type HazardKind = 'flameLane' | 'inkPool' | 'fallingLight'
export type HazardPhase = 'idle' | 'warning' | 'active'

export type HazardState = {
  kind: HazardKind
  phase: HazardPhase
}

export function hazardStatesForRunMs(runMs: number): HazardState[] {
  return [
    { kind: 'flameLane', phase: phaseInCycle(runMs, 18000, 2200, 2600) },
    { kind: 'inkPool', phase: phaseInCycle(runMs + 7000, 26000, 1800, 4200) },
    { kind: 'fallingLight', phase: phaseInCycle(runMs + 13000, 32000, 2400, 900) }
  ]
}

export function hazardDamageAtPosition(position: Vec3, hazards: HazardState[]): number {
  return hazards.reduce((damage, hazard) => {
    if (hazard.phase !== 'active' || !isInsideHazard(position, hazard.kind)) {
      return damage
    }

    return damage + damageForHazard(hazard.kind)
  }, 0)
}

export function roomPressureIntensity(runMs: number): number {
  return Math.min(1, runMs / 180000)
}

function phaseInCycle(runMs: number, cycleMs: number, warningMs: number, activeMs: number): HazardPhase {
  const wrapped = positiveModulo(runMs, cycleMs)

  if (wrapped < warningMs) {
    return 'warning'
  }

  if (wrapped < warningMs + activeMs) {
    return 'active'
  }

  return 'idle'
}

function isInsideHazard(position: Vec3, kind: HazardKind): boolean {
  if (kind === 'flameLane') {
    return Math.abs(position.x) <= 0.75 && position.z > -8.5 && position.z < 8.5
  }

  if (kind === 'inkPool') {
    return Math.hypot(position.x - 2.8, position.z + 1.8) <= 1.45
  }

  return Math.hypot(position.x + 2.4, position.z - 2.1) <= 1.1
}

function damageForHazard(kind: HazardKind): number {
  if (kind === 'fallingLight') {
    return 18
  }

  if (kind === 'flameLane') {
    return 10
  }

  return 6
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}
