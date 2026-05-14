import type { Vec3 } from './types'

export type HazardKind = 'flameLane' | 'inkPool' | 'fallingLight' | 'centerSurge'
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
  { kind: 'fallingLight', cycleMs: 32000, warningMs: 2400, activeMs: 900, offsetMs: 13000 },
  { kind: 'centerSurge', cycleMs: 24000, warningMs: 2000, activeMs: 3600, offsetMs: 11000 }
]

export const CENTER_SURGE_PRESSURE_THRESHOLD = 0.72

export function hazardStatesForRunMs(runMs: number, pressure = 0): HazardState[] {
  return hazardCycleConfigs.map((config) => ({
    kind: config.kind,
    phase: config.kind === 'centerSurge' && !centerSurgeEnabled(pressure)
      ? 'idle'
      : phaseInCycle(runMs + config.offsetMs, config.cycleMs, config.warningMs, config.activeMs)
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

// Multiplier applied to hazard cycle periods as a function of room
// pressure. At pressure 0 the cycles run at baseline (scale = 1); at
// pressure 1 the cycles compress to `HAZARD_MIN_CYCLE_SCALE` so the
// idle gaps shrink and hazards fire more often at peak pressure. The
// telegraph (`warningMs`) and damage window (`activeMs`) keep their
// proportional shape because the caller scales the hazard clock
// rather than the per-phase config; this means the player still gets
// the same warning duration, just sooner.
export const HAZARD_MIN_CYCLE_SCALE = 0.6
export function hazardCycleScale(pressure: number): number {
  if (!Number.isFinite(pressure) || pressure <= 0) {
    return 1
  }
  if (pressure >= 1) {
    return HAZARD_MIN_CYCLE_SCALE
  }
  return 1 + (HAZARD_MIN_CYCLE_SCALE - 1) * pressure
}

// Rate at which the hazard clock should advance against wall-clock
// time. The inverse of `hazardCycleScale` so a 0.6 cycle scale
// advances the hazard clock 1/0.6x faster (~1.67x).
export function hazardClockRate(pressure: number): number {
  return 1 / hazardCycleScale(pressure)
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

  if (kind === 'centerSurge') {
    return Math.hypot(position.x, position.z) <= 1.65
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

  if (kind === 'centerSurge') {
    return 8
  }

  return 6
}

function centerSurgeEnabled(pressure: number): boolean {
  return Number.isFinite(pressure) && pressure >= CENTER_SURGE_PRESSURE_THRESHOLD
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}
