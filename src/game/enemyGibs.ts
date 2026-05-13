import type { EnemyType } from './enemies'

/**
 * Enemy gibs on death.
 *
 * The current death visual is a single expanding ring (see
 * `spawnEnemyDeathPop`). That reads as "something happened" but
 * doesn't carry the weight of a Doom kill. This module spawns a
 * small burst of physics-driven chunks at the corpse position:
 * 4 to 8 small boxes per kill, launched up and outward, falling
 * under gravity, despawned on floor contact or TTL.
 *
 * The helper is intentionally pure: it returns the next physics
 * state for a single gib so the renderer can drive a mesh per
 * gib without needing to know the math. The caller (FlatlineGame)
 * owns mesh creation, color, and disposal.
 */

export const GIB_TTL_MS = 1400
export const GIB_GRAVITY_M_PER_SS = 14
export const GIB_FLOOR_Y = 0.04
export const GIB_BOUNCE_DAMPING = 0.35
export const GIB_DRAG_PER_S = 1.6

export type Vec3 = { x: number; y: number; z: number }

export type GibState = {
  position: Vec3
  velocity: Vec3
  ageMs: number
  // When the gib has settled on the floor (low downward velocity
  // after a bounce) it stops simulating and just sits there until
  // the TTL expires.
  settled: boolean
}

/**
 * How many gibs spray per kill, by enemy type. Heavier enemies
 * spray more so a brute kill reads as bigger than a skitter pop.
 */
export function gibCountFor(type: EnemyType): number {
  if (type === 'skitter') return 4
  if (type === 'grunt') return 6
  if (type === 'spitter') return 5
  return 8
}

/**
 * Per-type color shade. Skitter is bright orange-red, grunt is a
 * medium red, brute is a deep crimson, spitter is a desaturated
 * ink purple so the visual matches the enemy's audio family.
 */
export function gibColorFor(type: EnemyType): string {
  if (type === 'skitter') return '#ff7a4f'
  if (type === 'grunt') return '#d6432a'
  if (type === 'spitter') return '#9255c8'
  return '#a8261a'
}

/**
 * Initial velocity vector for a gib. `azimuth` is the horizontal
 * angle (radians) and `speed` is the metres-per-second magnitude
 * the caller draws from a uniform sample (radial seeding stays
 * pure so tests can pin a sample).
 *
 * The vertical component is biased upward (`upBias = 0.55` of
 * speed) so the gib pops UP first and then arcs down under
 * gravity, matching the Doom "splat" feel.
 */
export function gibInitialVelocity(azimuth: number, speed: number, upBias = 0.55): Vec3 {
  if (!Number.isFinite(azimuth) || !Number.isFinite(speed) || speed <= 0) {
    return { x: 0, y: 0, z: 0 }
  }
  const horizontal = Math.sqrt(Math.max(0, 1 - upBias * upBias)) * speed
  return {
    x: Math.cos(azimuth) * horizontal,
    y: upBias * speed,
    z: Math.sin(azimuth) * horizontal
  }
}

/**
 * Advance one gib by `deltaMs`. Returns the next state, or null
 * if the gib has aged past `GIB_TTL_MS`. Pure: no mutation of
 * input.
 *
 * Physics steps:
 *   1. Apply gravity to vy.
 *   2. Apply linear drag to vx / vz so gibs do not skate
 *      forever on smooth floors.
 *   3. Integrate position.
 *   4. Floor clamp + bounce when y dips below the floor plane
 *      (one bounce only; subsequent floor hits settle).
 */
export function tickGibPhysics(state: GibState, deltaMs: number): GibState | null {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    return state
  }
  const ageMs = state.ageMs + deltaMs
  if (ageMs >= GIB_TTL_MS) {
    return null
  }

  if (state.settled) {
    return { ...state, ageMs }
  }

  const dt = deltaMs / 1000
  const drag = Math.max(0, 1 - GIB_DRAG_PER_S * dt)
  const vy = state.velocity.y - GIB_GRAVITY_M_PER_SS * dt
  const vx = state.velocity.x * drag
  const vz = state.velocity.z * drag

  const nx = state.position.x + vx * dt
  let ny = state.position.y + vy * dt
  const nz = state.position.z + vz * dt
  let nvy = vy
  let settled = false

  if (ny <= GIB_FLOOR_Y) {
    ny = GIB_FLOOR_Y
    if (vy < 0) {
      const bounced = -vy * GIB_BOUNCE_DAMPING
      if (bounced < 0.6) {
        // Bounce energy is below the "noticeable hop" threshold,
        // so the gib settles for the rest of its TTL.
        nvy = 0
        settled = true
      } else {
        nvy = bounced
      }
    } else {
      nvy = 0
      settled = true
    }
  }

  return {
    position: { x: nx, y: ny, z: nz },
    velocity: { x: vx, y: nvy, z: vz },
    ageMs,
    settled
  }
}
