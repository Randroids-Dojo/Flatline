import type { Vec3 } from './types'

export type HazardKind = 'flameLane' | 'inkPool' | 'fallingLight'
export type HazardPhase = 'idle' | 'warning' | 'active'

export type HazardState = {
  kind: HazardKind
  phase: HazardPhase
}

/**
 * Cycle timing per hazard kind. `cycleMs` is the total period.
 * `warningMs` is how long the telegraph plays before the hazard activates.
 * `activeMs` is how long the hazard damages while active. The remainder of
 * the cycle is idle.
 *
 * `offsetMs` is added to `runMs` before the cycle math so different hazards
 * stagger across the run instead of all firing at once.
 */
export type HazardCycleConfig = {
  kind: HazardKind
  cycleMs: number
  warningMs: number
  activeMs: number
  offsetMs: number
}

export const hazardCycleConfigs: readonly HazardCycleConfig[] = [
  { kind: 'flameLane', cycleMs: 18000, warningMs: 2200, activeMs: 2600, offsetMs: 0 },
  { kind: 'inkPool', cycleMs: 26000, warningMs: 1800, activeMs: 4200, offsetMs: 7000 },
  { kind: 'fallingLight', cycleMs: 32000, warningMs: 2400, activeMs: 900, offsetMs: 13000 }
]

export function hazardStatesForRunMs(runMs: number): HazardState[] {
  return hazardCycleConfigs.map((config) => ({
    kind: config.kind,
    phase: phaseInCycle(runMs + config.offsetMs, config.cycleMs, config.warningMs, config.activeMs)
  }))
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
