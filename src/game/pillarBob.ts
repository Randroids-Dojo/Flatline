// REQ-047 cover-phase mutation. The four arena pillars bob in place
// once room pressure approaches its peak so the late-run arena reads
// as "alive." Bob does NOT change the pillar collision rect (which
// continues to clip the player and AI), only the rendered mesh
// position. The visual cue alone is enough to satisfy the "Pillars
// rise" hint from `docs/gdd/47-arena-mutations.md`; gameplay-changing
// pillar-cycle behavior is left for a later slice if playtest signals
// call for it.

export const PILLAR_BOB_PRESSURE_THRESHOLD = 0.75
export const PILLAR_BOB_AMPLITUDE_M = 0.18
export const PILLAR_BOB_HZ = 0.4

// Returns the [0..1] amplitude scale for the pillar bob at a given
// room pressure. Below the threshold the bob is silent; between the
// threshold and 1.0 it ramps in linearly so the visual fades up.
export function pillarBobAmplitudeScale(pressure: number): number {
  if (!Number.isFinite(pressure) || pressure <= PILLAR_BOB_PRESSURE_THRESHOLD) {
    return 0
  }

  if (pressure >= 1) {
    return 1
  }

  return (pressure - PILLAR_BOB_PRESSURE_THRESHOLD) / (1 - PILLAR_BOB_PRESSURE_THRESHOLD)
}

// Returns the per-pillar vertical offset (in metres) at a given
// elapsed time and pressure. Each pillar gets its own `phaseOffset`
// (radians) so the four pillars bob out of sync, which keeps the
// arena from feeling like a single mass moving in lockstep.
export function pillarBobOffsetMeters(
  elapsedMs: number,
  pressure: number,
  phaseOffset: number = 0
): number {
  const scale = pillarBobAmplitudeScale(pressure)
  if (scale === 0) {
    return 0
  }
  const radiansPerMs = 2 * Math.PI * PILLAR_BOB_HZ / 1000
  return Math.sin(elapsedMs * radiansPerMs + phaseOffset) * PILLAR_BOB_AMPLITUDE_M * scale
}
