import type { EnemyType } from './enemies'

/**
 * Doom-style ammo pickup drops.
 *
 * Real Doom scatters visible ammo crates and weapon pickups around
 * the level. Flatline's arena is a single room and weapons are all
 * pre-unlocked, so the equivalent is enemy-dropped ammo crates: a
 * kill spawns a bobbing pickup at the corpse's feet, the player
 * walks over it to collect, the box visibly vanishes.
 *
 * Four kinds, in two pairs:
 *
 * - `shell-small`: single boomstick shell (`+1`). Cheap drop, common.
 * - `shell-large`: a four-shell carton (`+3`). Rarer, brute-tier
 *   reward.
 * - `cell-small`: a single inkblaster cell (`+1`). Cheap drop,
 *   common.
 * - `cell-large`: a four-cell pack (`+2`). Rarer, spitter-tier
 *   reward.
 *
 * The drop chance is split per enemy type so the visual + audio
 * payload feels appropriate for the kill (a shotgun-leaning grunt
 * drops shells, a ranged spitter drops cells, a heavy brute
 * sometimes drops the larger box).
 */

export type AmmoDropKind = 'shell-small' | 'shell-large' | 'cell-small' | 'cell-large'

export type AmmoDrop = {
  id: string
  kind: AmmoDropKind
  position: { x: number; y: number; z: number }
  ageMs: number
}

export const AMMO_DROP_TTL_MS = 6500
export const AMMO_DROP_PICKUP_RADIUS_M = 0.95

// Per-enemy chance to drop each kind. The probabilities sum to less
// than 1 so the majority of kills still drop nothing (otherwise the
// floor becomes a junk pile and the player stops moving).
type EnemyDropTable = Readonly<Partial<Record<AmmoDropKind, number>>>

export const AMMO_DROP_TABLE: Readonly<Record<EnemyType, EnemyDropTable>> = Object.freeze({
  skitter: { 'shell-small': 0.12, 'cell-small': 0.08 },
  grunt: { 'shell-small': 0.22, 'shell-large': 0.05 },
  brute: { 'shell-small': 0.18, 'shell-large': 0.2, 'cell-small': 0.05 },
  spitter: { 'cell-small': 0.28, 'cell-large': 0.07 }
})

/**
 * Roll a drop kind for a kill. `rng` is a uniform [0, 1) sample
 * (caller passes `Math.random()` or a seeded value). Returns
 * `null` when nothing dropped this frame.
 */
export function rollAmmoDrop(type: EnemyType, rng: number): AmmoDropKind | null {
  if (!Number.isFinite(rng) || rng < 0 || rng >= 1) {
    return null
  }

  const table = AMMO_DROP_TABLE[type]
  let cursor = 0

  for (const kind of ['shell-large', 'cell-large', 'shell-small', 'cell-small'] as const) {
    const chance = table[kind] ?? 0
    cursor += chance
    if (rng < cursor) {
      return kind
    }
  }

  return null
}

export function ammoDropBoomstickAmount(kind: AmmoDropKind): number {
  if (kind === 'shell-small') return 1
  if (kind === 'shell-large') return 3
  return 0
}

export function ammoDropInkblasterAmount(kind: AmmoDropKind): number {
  if (kind === 'cell-small') return 1
  if (kind === 'cell-large') return 2
  return 0
}

/**
 * Drop a frame's worth of ttl on each drop, splicing out anything
 * that aged past the TTL. The dropped drops decay so the world
 * does not accumulate dead pickups for a player who stays far away.
 */
export function tickAmmoDrops(drops: readonly AmmoDrop[], deltaMs: number): AmmoDrop[] {
  const next: AmmoDrop[] = []

  for (const drop of drops) {
    const ageMs = drop.ageMs + deltaMs
    if (ageMs >= AMMO_DROP_TTL_MS) {
      continue
    }
    next.push({ id: drop.id, kind: drop.kind, position: drop.position, ageMs })
  }

  return next
}

/**
 * Return IDs the player is currently overlapping, so the caller can
 * apply the ammo grant and despawn them.
 */
export function ammoDropPickupIds(
  drops: readonly AmmoDrop[],
  playerPosition: { x: number; z: number }
): string[] {
  const hits: string[] = []
  const rSq = AMMO_DROP_PICKUP_RADIUS_M * AMMO_DROP_PICKUP_RADIUS_M

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
 * Vertical bob offset in metres. Doom pickups rest just above the
 * floor and pulse; this sin wave settles at a 0.45 m baseline and
 * sways +/-0.1 m at ~1.5 Hz so the pickup reads as "floating loot."
 */
export function ammoDropBobY(ageMs: number): number {
  const phase = (ageMs / 1000) * 2 * Math.PI * 1.5
  return 0.45 + Math.sin(phase) * 0.1
}

/**
 * Pickup color per kind. Shells are warm (red shell, yellow accent);
 * cells are cold (cyan-blue with a teal accent). The large variant
 * uses the same hue family with a higher emissive intensity so the
 * size + glow read together as "this one is the big drop."
 */
export type AmmoDropPalette = {
  body: string
  accent: string
  glow: string
}

const PALETTES: Readonly<Record<AmmoDropKind, AmmoDropPalette>> = Object.freeze({
  'shell-small': { body: '#c8311c', accent: '#f0c668', glow: '#ff7a4f' },
  'shell-large': { body: '#a8261a', accent: '#f8d878', glow: '#ff7a4f' },
  'cell-small': { body: '#2a78c8', accent: '#7ff0e0', glow: '#5ad0f0' },
  'cell-large': { body: '#1f5fa8', accent: '#a8f4e8', glow: '#5ad0f0' }
})

export function ammoDropPalette(kind: AmmoDropKind): AmmoDropPalette {
  return PALETTES[kind]
}
