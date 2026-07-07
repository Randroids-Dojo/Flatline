// Meta progression, structured like Rogue Legacy 2:
//
// - Cheddar earned in a run is carried back to the Office on death.
// - The Case Board is a fog-of-war upgrade tree: buying a node reveals its
//   neighbors. Every rank of every node is permanent.
// - The Armory sells weapon unlocks and permanent weapon tiers.
// - The Fence sells relics: one-run items consumed by the next run.
// - Starting a run, the landlord collects ALL cheddar you did not spend,
//   unless Floor Safe ranks bank a percentage (the Charon rule).
// - Cost inflation: every rank purchased anywhere raises all later node
//   prices once you pass 30 total ranks (RL2's labor costs).

import { z } from 'zod'
import type { WeaponId } from './weapons'

export type NodeEffect =
  | { stat: 'maxHp'; perRank: number }
  | { stat: 'damage'; perRank: number }
  | { stat: 'speed'; perRank: number }
  | { stat: 'startArmor'; perRank: number }
  | { stat: 'cheddarGain'; perRank: number }
  | { stat: 'ammoMax'; perRank: number }
  | { stat: 'dropLuck'; perRank: number }
  | { stat: 'fireRate'; perRank: number }
  | { stat: 'keepFraction'; perRank: number }
  | { stat: 'automapRadius'; perRank: number }
  | { stat: 'unlockArmory'; perRank: number }
  | { stat: 'unlockFence'; perRank: number }

export type BoardNode = {
  id: string
  name: string
  flavor: string
  x: number
  y: number
  maxRank: number
  baseCost: number
  effect: NodeEffect
}

export const BOARD_NODES: BoardNode[] = [
  { id: 'office', name: 'The Office', flavor: 'Home base. Rent is due.', x: 2, y: 2, maxRank: 1, baseCost: 0, effect: { stat: 'automapRadius', perRank: 0 } },
  { id: 'snacks', name: 'Late Night Snacks', flavor: '+10 max health per rank.', x: 2, y: 1, maxRank: 10, baseCost: 80, effect: { stat: 'maxHp', perRank: 10 } },
  { id: 'safe', name: 'Floor Safe', flavor: 'Bank 10% of leftover cheddar per rank when a run starts.', x: 2, y: 0, maxRank: 6, baseCost: 200, effect: { stat: 'keepFraction', perRank: 0.1 } },
  { id: 'offshore', name: 'Offshore Account', flavor: 'Bank another 10% per rank.', x: 1, y: 0, maxRank: 4, baseCost: 800, effect: { stat: 'keepFraction', perRank: 0.1 } },
  { id: 'stomach', name: 'Iron Stomach', flavor: '+15 max health per rank.', x: 3, y: 0, maxRank: 10, baseCost: 400, effect: { stat: 'maxHp', perRank: 15 } },
  { id: 'boxing', name: 'Boxing Lessons', flavor: '+5% damage per rank.', x: 1, y: 2, maxRank: 10, baseCost: 90, effect: { stat: 'damage', perRank: 0.05 } },
  { id: 'gunlocker', name: 'Gun Locker', flavor: 'Opens the Armory.', x: 0, y: 2, maxRank: 1, baseCost: 150, effect: { stat: 'unlockArmory', perRank: 1 } },
  { id: 'range', name: 'Range Time', flavor: '+5% fire rate per rank.', x: 0, y: 1, maxRank: 5, baseCost: 250, effect: { stat: 'fireRate', perRank: 0.05 } },
  { id: 'haymaker', name: 'Haymaker', flavor: '+5% damage per rank, again.', x: 0, y: 3, maxRank: 10, baseCost: 450, effect: { stat: 'damage', perRank: 0.05 } },
  { id: 'streetsmarts', name: 'Street Smarts', flavor: '+10% cheddar from coins per rank.', x: 3, y: 2, maxRank: 10, baseCost: 100, effect: { stat: 'cheddarGain', perRank: 0.1 } },
  { id: 'fence', name: 'The Fence', flavor: 'A guy who knows a guy. Opens one-run contraband.', x: 4, y: 2, maxRank: 1, baseCost: 200, effect: { stat: 'unlockFence', perRank: 1 } },
  { id: 'charm', name: "Rabbit's Charm", flavor: '+4% enemy drop chance per rank.', x: 4, y: 1, maxRank: 5, baseCost: 130, effect: { stat: 'dropLuck', perRank: 0.04 } },
  { id: 'jog', name: 'Morning Jog', flavor: '+3% move speed per rank.', x: 2, y: 3, maxRank: 5, baseCost: 100, effect: { stat: 'speed', perRank: 0.03 } },
  { id: 'pockets', name: 'Deep Pockets', flavor: '+20% max ammo per rank.', x: 3, y: 3, maxRank: 5, baseCost: 150, effect: { stat: 'ammoMax', perRank: 0.2 } },
  { id: 'maps', name: 'City Maps', flavor: 'The automap sees further per rank.', x: 1, y: 3, maxRank: 3, baseCost: 60, effect: { stat: 'automapRadius', perRank: 8 } },
  { id: 'coat', name: 'Padded Coat', flavor: 'Start each run with +10 vest armor per rank.', x: 1, y: 1, maxRank: 10, baseCost: 120, effect: { stat: 'startArmor', perRank: 10 } }
]

const NODE_BY_ID = new Map(BOARD_NODES.map((node) => [node.id, node]))

export function boardNode(id: string): BoardNode {
  const node = NODE_BY_ID.get(id)
  if (!node) {
    throw new Error(`unknown board node ${id}`)
  }
  return node
}

export function nodeNeighbors(node: BoardNode): BoardNode[] {
  return BOARD_NODES.filter((other) => Math.abs(other.x - node.x) + Math.abs(other.y - node.y) === 1)
}

// --- Armory ---

export type ArmoryWeapon = Exclude<WeaponId, 'paws' | 'snub'>

export const WEAPON_UNLOCK_COSTS: Record<ArmoryWeapon, number> = {
  scattergun: 300,
  chatter: 650,
  lobber: 1200,
  raygun: 2000,
  bigcheese: 4000
}

export const WEAPON_TIER_MAX = 3
export const WEAPON_TIER_DAMAGE_PER_TIER = 0.2

// Meta-aware prices so the shop UI and the purchase functions can never
// drift: both read the same number, labor inflation included.
export function weaponUnlockCost(meta: MetaState, weapon: ArmoryWeapon): number {
  return WEAPON_UNLOCK_COSTS[weapon] + laborCost(meta)
}

// Tier prices follow RL2's blacksmith multiplier feel: each tier costs a
// growing multiple of the weapon's unlock price.
export function weaponTierCost(meta: MetaState, weapon: WeaponId, tier: number): number {
  const base = weapon === 'snub' ? 150 : WEAPON_UNLOCK_COSTS[weapon as ArmoryWeapon] ?? 150
  return Math.round(base * 0.5 * (tier + 1)) + laborCost(meta)
}

// --- Relics (one-run contraband) ---

export type RelicId =
  | 'rabbitsfoot'
  | 'espresso'
  | 'picnic'
  | 'loadeddice'
  | 'umbrella'
  | 'ammocase'
  | 'skeletonkey'
  | 'bloodhound'

export type RelicDef = { id: RelicId; name: string; flavor: string; cost: number }

export const RELICS: RelicDef[] = [
  { id: 'rabbitsfoot', name: "Rabbit's Foot", flavor: 'Cheat death once. Wake up at 50 health.', cost: 250 },
  { id: 'espresso', name: 'Double Espresso', flavor: '+25% move speed for the run.', cost: 150 },
  { id: 'picnic', name: 'Picnic Basket', flavor: 'Start the run 50 health over the cap.', cost: 120 },
  { id: 'loadeddice', name: 'Loaded Dice', flavor: 'Enemies drop double coins.', cost: 200 },
  { id: 'umbrella', name: 'Iron Umbrella', flavor: 'Start with 100 trench armor.', cost: 180 },
  { id: 'ammocase', name: 'Case of Ammo', flavor: 'Start with every pocket full.', cost: 160 },
  { id: 'skeletonkey', name: 'Skeleton Key', flavor: 'Vault doors swing open for you.', cost: 220 },
  { id: 'bloodhound', name: 'Bloodhound Nose', flavor: 'The automap sniffs out pickups.', cost: 100 }
]

export const RELIC_BY_ID = new Map(RELICS.map((relic) => [relic.id, relic]))

// --- Persistent state ---

export const metaSchema = z.object({
  version: z.literal(1),
  cheddar: z.number().int().nonnegative(),
  nodes: z.record(z.string(), z.number().int().nonnegative()),
  weaponsUnlocked: z.array(z.string()),
  weaponTiers: z.record(z.string(), z.number().int().nonnegative()),
  relics: z.array(z.string()),
  bestRing: z.number().int().nonnegative(),
  totalKills: z.number().int().nonnegative(),
  totalDeaths: z.number().int().nonnegative(),
  rentPaid: z.number().int().nonnegative()
})

export type MetaState = z.infer<typeof metaSchema>

export function createMetaState(): MetaState {
  return {
    version: 1,
    cheddar: 0,
    nodes: { office: 1 },
    weaponsUnlocked: ['paws', 'snub'],
    weaponTiers: {},
    relics: [],
    bestRing: 0,
    totalKills: 0,
    totalDeaths: 0,
    rentPaid: 0
  }
}

export function totalRanks(meta: MetaState): number {
  return Object.values(meta.nodes).reduce((sum, rank) => sum + rank, 0)
}

// RL2 labor costs: past 30 total ranks, every further rank anywhere makes
// every purchase pricier.
export function laborCost(meta: MetaState): number {
  return 10 * Math.max(0, totalRanks(meta) - 30)
}

export function nodeRank(meta: MetaState, id: string): number {
  return meta.nodes[id] ?? 0
}

export function nodeCost(meta: MetaState, id: string): number | null {
  const node = boardNode(id)
  const rank = nodeRank(meta, id)
  if (rank >= node.maxRank) {
    return null
  }
  return Math.round(node.baseCost * (1 + 0.6 * rank)) + laborCost(meta)
}

// Fog of war: a node is visible when purchased or adjacent to a purchase.
export function visibleNodes(meta: MetaState): Set<string> {
  const visible = new Set<string>()
  for (const node of BOARD_NODES) {
    if (nodeRank(meta, node.id) > 0) {
      visible.add(node.id)
      for (const neighbor of nodeNeighbors(node)) {
        visible.add(neighbor.id)
      }
    }
  }
  return visible
}

export function purchaseNode(meta: MetaState, id: string): MetaState | null {
  const cost = nodeCost(meta, id)
  if (cost === null || meta.cheddar < cost) {
    return null
  }
  if (!visibleNodes(meta).has(id)) {
    return null
  }
  return {
    ...meta,
    cheddar: meta.cheddar - cost,
    nodes: { ...meta.nodes, [id]: nodeRank(meta, id) + 1 }
  }
}

export function armoryUnlocked(meta: MetaState): boolean {
  return nodeRank(meta, 'gunlocker') > 0
}

export function fenceUnlocked(meta: MetaState): boolean {
  return nodeRank(meta, 'fence') > 0
}

export function purchaseWeapon(meta: MetaState, weapon: ArmoryWeapon): MetaState | null {
  if (!armoryUnlocked(meta) || meta.weaponsUnlocked.includes(weapon)) {
    return null
  }
  const cost = weaponUnlockCost(meta, weapon)
  if (meta.cheddar < cost) {
    return null
  }
  return { ...meta, cheddar: meta.cheddar - cost, weaponsUnlocked: [...meta.weaponsUnlocked, weapon] }
}

export function purchaseWeaponTier(meta: MetaState, weapon: WeaponId): MetaState | null {
  if (!armoryUnlocked(meta) || !meta.weaponsUnlocked.includes(weapon) || weapon === 'paws') {
    return null
  }
  const tier = meta.weaponTiers[weapon] ?? 0
  if (tier >= WEAPON_TIER_MAX) {
    return null
  }
  const cost = weaponTierCost(meta, weapon, tier)
  if (meta.cheddar < cost) {
    return null
  }
  return {
    ...meta,
    cheddar: meta.cheddar - cost,
    weaponTiers: { ...meta.weaponTiers, [weapon]: tier + 1 }
  }
}

export function purchaseRelic(meta: MetaState, relicId: RelicId): MetaState | null {
  if (!fenceUnlocked(meta) || meta.relics.includes(relicId)) {
    return null
  }
  const relic = RELIC_BY_ID.get(relicId)
  if (!relic || meta.cheddar < relic.cost) {
    return null
  }
  return { ...meta, cheddar: meta.cheddar - relic.cost, relics: [...meta.relics, relicId] }
}

// --- Derived run configuration ---

export type RunConfig = {
  maxHp: number
  startHp: number
  damageMult: number
  speedMult: number
  startArmor: number
  startArmorClass: 'none' | 'vest' | 'trench'
  cheddarMult: number
  ammoMaxMult: number
  dropLuck: number
  fireRateMult: number
  automapRadius: number
  startFullAmmo: boolean
  reviveOnce: boolean
  doubleCoins: boolean
  skeletonKey: boolean
  bloodhound: boolean
}

function statTotal(meta: MetaState, stat: NodeEffect['stat']): number {
  let total = 0
  for (const node of BOARD_NODES) {
    if (node.effect.stat === stat) {
      total += node.effect.perRank * nodeRank(meta, node.id)
    }
  }
  return total
}

export function deriveRunConfig(meta: MetaState): RunConfig {
  const relics = meta.relics.filter((id): id is RelicId => RELIC_BY_ID.has(id as RelicId))
  const maxHp = 100 + statTotal(meta, 'maxHp')
  const umbrella = relics.includes('umbrella')
  const coatArmor = statTotal(meta, 'startArmor')
  return {
    maxHp,
    startHp: maxHp + (relics.includes('picnic') ? 50 : 0),
    damageMult: 1 + statTotal(meta, 'damage'),
    speedMult: (1 + statTotal(meta, 'speed')) * (relics.includes('espresso') ? 1.25 : 1),
    startArmor: umbrella ? Math.max(100, coatArmor) : coatArmor,
    startArmorClass: umbrella ? 'trench' : coatArmor > 0 ? 'vest' : 'none',
    cheddarMult: 1 + statTotal(meta, 'cheddarGain'),
    ammoMaxMult: 1 + statTotal(meta, 'ammoMax'),
    dropLuck: statTotal(meta, 'dropLuck'),
    fireRateMult: 1 + statTotal(meta, 'fireRate'),
    automapRadius: 16 + statTotal(meta, 'automapRadius'),
    startFullAmmo: relics.includes('ammocase'),
    reviveOnce: relics.includes('rabbitsfoot'),
    doubleCoins: relics.includes('loadeddice'),
    skeletonKey: relics.includes('skeletonkey'),
    bloodhound: relics.includes('bloodhound')
  }
}

export function keepFraction(meta: MetaState): number {
  return Math.min(1, statTotal(meta, 'keepFraction'))
}

// The Charon rule: starting a run costs all unbanked cheddar and consumes
// the relics bought for this run.
export function beginRun(meta: MetaState): MetaState {
  const kept = Math.floor(meta.cheddar * keepFraction(meta))
  return {
    ...meta,
    cheddar: kept,
    relics: [],
    rentPaid: meta.rentPaid + (meta.cheddar - kept)
  }
}

export type RunSummary = { cheddarEarned: number; kills: number; ring: number }

export function endRun(meta: MetaState, summary: RunSummary): MetaState {
  return {
    ...meta,
    cheddar: meta.cheddar + summary.cheddarEarned,
    bestRing: Math.max(meta.bestRing, summary.ring),
    totalKills: meta.totalKills + summary.kills,
    totalDeaths: meta.totalDeaths + 1
  }
}
