import type { EnemyType } from './enemies'

/**
 * Doom-style health pickup drops.
 *
 * REQ-033 (Pickup: Health) is satisfied today only by the central
 * altar: the player has to retreat to the room center to heal. Doom
 * has medkits scattered around the level so a wounded player can
 * heal on the way to or from the fight. This module is the
 * enemy-dropped equivalent: a small chance per kill, two sizes
 * mirroring the altar's `small` and `large` heal amounts so the
 * player has a single mental model for "how much HP does this
 * give me."
 *
 * Two kinds:
 *
 * - `medkit-small`: matches `SMALL_HEAL_AMOUNT` (10 HP). The common
 *   trickle.
 * - `medkit-large`: matches `LARGE_HEAL_AMOUNT` (35 HP). The rare
 *   brute reward.
 *
 * Drop chance is intentionally lower than the ammo table because
 * health is more valuable; if every other kill dropped a medkit the
 * room would never feel dangerous.
 */

export type HealthDropKind = 'medkit-small' | 'medkit-large'

export type HealthDrop = {
  id: string
  kind: HealthDropKind
  position: { x: number; y: number; z: number }
  ageMs: number
}

export const HEALTH_DROP_TTL_MS = 7500
export const HEALTH_DROP_PICKUP_RADIUS_M = 0.95

type EnemyDropTable = Readonly<Partial<Record<HealthDropKind, number>>>

export const HEALTH_DROP_TABLE: Readonly<Record<EnemyType, EnemyDropTable>> = Object.freeze({
  skitter: { 'medkit-small': 0.04 },
  grunt: { 'medkit-small': 0.06 },
  brute: { 'medkit-small': 0.05, 'medkit-large': 0.05 },
  spitter: { 'medkit-small': 0.05 }
})

export function rollHealthDrop(type: EnemyType, rng: number): HealthDropKind | null {
  if (!Number.isFinite(rng) || rng < 0 || rng >= 1) {
    return null
  }

  const table = HEALTH_DROP_TABLE[type]
  let cursor = 0

  for (const kind of ['medkit-large', 'medkit-small'] as const) {
    const chance = table[kind] ?? 0
    cursor += chance
    if (rng < cursor) {
      return kind
    }
  }

  return null
}

export function healthDropAmount(kind: HealthDropKind): number {
  // Mirror the altar's tier amounts (see `healthPickupTier.ts`) so
  // the player has one mental model for medkit values.
  return kind === 'medkit-large' ? 35 : 10
}

export function tickHealthDrops(drops: readonly HealthDrop[], deltaMs: number): HealthDrop[] {
  const next: HealthDrop[] = []

  for (const drop of drops) {
    const ageMs = drop.ageMs + deltaMs
    if (ageMs >= HEALTH_DROP_TTL_MS) {
      continue
    }
    next.push({ id: drop.id, kind: drop.kind, position: drop.position, ageMs })
  }

  return next
}

export function healthDropPickupIds(
  drops: readonly HealthDrop[],
  playerPosition: { x: number; z: number }
): string[] {
  const hits: string[] = []
  const rSq = HEALTH_DROP_PICKUP_RADIUS_M * HEALTH_DROP_PICKUP_RADIUS_M

  for (const drop of drops) {
    const dx = drop.position.x - playerPosition.x
    const dz = drop.position.z - playerPosition.z

    if (dx * dx + dz * dz <= rSq) {
      hits.push(drop.id)
    }
  }

  return hits
}

/**
 * Vertical bob. Slightly slower than ammo drops (0.9 Hz vs 1.5 Hz)
 * and a lower baseline so a medkit sits closer to the floor and
 * reads as heavier than an ammo box.
 */
export function healthDropBobY(ageMs: number): number {
  const phase = (ageMs / 1000) * 2 * Math.PI * 0.9
  return 0.35 + Math.sin(phase) * 0.08
}

/**
 * Cross-on-white medkit palette. Both sizes share the same body
 * (`#f0e6d6` warm cream) and cross (`#d6432a` red); large variants
 * use a brighter accent and glow so the rarity reads at a glance.
 */
export type HealthDropPalette = {
  body: string
  cross: string
  glow: string
}

const PALETTES: Readonly<Record<HealthDropKind, HealthDropPalette>> = Object.freeze({
  'medkit-small': { body: '#f0e6d6', cross: '#d6432a', glow: '#ff8070' },
  'medkit-large': { body: '#f8eee0', cross: '#e84a30', glow: '#ff9080' }
})

export function healthDropPalette(kind: HealthDropKind): HealthDropPalette {
  return PALETTES[kind]
}
