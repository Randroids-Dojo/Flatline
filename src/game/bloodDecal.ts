import type { EnemyType } from './enemies'

/**
 * Floor blood decals at enemy death positions.
 *
 * Gibs (`enemyGibs.ts`) give a kill its instantaneous weight but
 * vanish after 1.4 s. To give the room a sense of escalating
 * violence over a long run, each death also stamps a flat circular
 * decal at the corpse's floor position. The decals persist for
 * ~25 s, fade out gradually, and the live count is capped so the
 * floor cannot become a single solid red blob during a peak wave.
 *
 * Color matches the gib palette so a brute decal is deep crimson
 * and a spitter decal is ink purple, giving the player a coarse
 * "what died here" read from the floor pattern alone.
 */

export const BLOOD_DECAL_TTL_MS = 25_000
export const BLOOD_DECAL_FADE_LAST_MS = 3_000

export type BloodDecalState = {
  ageMs: number
  radius: number
  baseAlpha: number
}

/**
 * Per-enemy decal radius (metres). Heavier enemies leave a bigger
 * stain. Skitter is small, brute is the largest.
 */
export function bloodDecalRadiusFor(type: EnemyType): number {
  if (type === 'skitter') return 0.42
  if (type === 'grunt') return 0.55
  if (type === 'spitter') return 0.5
  return 0.7
}

/**
 * Per-enemy starting opacity. Bumped slightly higher for the
 * heavier enemies so the size + alpha read together as
 * "something big died here."
 */
export function bloodDecalBaseAlphaFor(type: EnemyType): number {
  if (type === 'skitter') return 0.55
  if (type === 'grunt') return 0.65
  if (type === 'spitter') return 0.6
  return 0.75
}

/**
 * Per-enemy hex color. Matches the gib palette so a kill's
 * instantaneous chunks and persistent floor stain share a color
 * family. Spitter uses an ink purple instead of red.
 */
export function bloodDecalColorFor(type: EnemyType): string {
  if (type === 'skitter') return '#c0301a'
  if (type === 'grunt') return '#a8261a'
  if (type === 'spitter') return '#5e2a8c'
  return '#7a1a10'
}

/**
 * Compute the alpha multiplier for a decal at a given age. Returns
 * `1` for most of the lifetime, then ramps linearly down across
 * the final `BLOOD_DECAL_FADE_LAST_MS` window so the decal does not
 * pop out in a single frame. Returns `0` when the decal has aged
 * past the TTL.
 */
export function bloodDecalAlphaScale(ageMs: number): number {
  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return 1
  }
  if (ageMs >= BLOOD_DECAL_TTL_MS) {
    return 0
  }
  const ttlRemaining = BLOOD_DECAL_TTL_MS - ageMs
  if (ttlRemaining >= BLOOD_DECAL_FADE_LAST_MS) {
    return 1
  }
  return Math.max(0, ttlRemaining / BLOOD_DECAL_FADE_LAST_MS)
}

/**
 * Advance the age of a decal and return the new state, or null when
 * the decal has aged past the TTL. Pure: does not mutate the input.
 */
export function tickBloodDecal(state: BloodDecalState, deltaMs: number): BloodDecalState | null {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    return state
  }
  const ageMs = state.ageMs + deltaMs
  if (ageMs >= BLOOD_DECAL_TTL_MS) {
    return null
  }
  return { ageMs, radius: state.radius, baseAlpha: state.baseAlpha }
}
