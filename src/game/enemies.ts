// Enemy definitions and AI. The bestiary mirrors Doom's early roster
// (zombieman, shotgun guy, imp, pinky, baron) re-cast as 1930s cartoon
// mobsters. Stats follow Doom's tables: HP, pain chance out of 255,
// damage dice, and the distance-based attack gamble.

import type { EnemyKind } from './dungeon'
import { rngInt, type Rng } from './rng'
import { angleTo, dist, type Vec2 } from './types'

export type EnemyDef = {
  kind: EnemyKind
  name: string
  hp: number
  speedM: number
  radiusM: number
  // Chance out of 255 that a hit interrupts into the pain state.
  painChance: number
  attack:
    | { type: 'hitscan'; pellets: number; dice: { count: number; sides: number; mult: number }; spreadRad: number }
    | { type: 'projectile'; dice: { count: number; sides: number; mult: number }; speedM: number; radiusM: number }
  melee?: { dice: { count: number; sides: number; mult: number }; rangeM: number }
  windupSec: number
  attackCooldownSec: number
  // Cheddar coins dropped on death (each worth COIN_VALUE).
  coinDrop: { min: number; max: number }
  heightM: number
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  torpedo: {
    kind: 'torpedo',
    name: 'Torpedo Rat',
    hp: 20,
    speedM: 2.2,
    radiusM: 0.55,
    painChance: 200,
    // Monster hitscan spread is 4x the player's: +-22.4 degrees.
    attack: { type: 'hitscan', pellets: 1, dice: { count: 1, sides: 5, mult: 3 }, spreadRad: 0.391 },
    windupSec: 0.5,
    attackCooldownSec: 1.4,
    coinDrop: { min: 2, max: 4 },
    heightM: 1.8
  },
  capo: {
    kind: 'capo',
    name: 'Scattergun Capo',
    hp: 30,
    speedM: 2.9,
    radiusM: 0.55,
    painChance: 170,
    attack: { type: 'hitscan', pellets: 3, dice: { count: 1, sides: 5, mult: 3 }, spreadRad: 0.391 },
    windupSec: 0.55,
    attackCooldownSec: 1.8,
    coinDrop: { min: 3, max: 6 },
    heightM: 1.8
  },
  alleycat: {
    kind: 'alleycat',
    name: 'Alley Shiv',
    hp: 60,
    speedM: 2.9,
    radiusM: 0.55,
    painChance: 200,
    attack: { type: 'projectile', dice: { count: 1, sides: 8, mult: 3 }, speedM: 10.9, radiusM: 0.2 },
    melee: { dice: { count: 1, sides: 8, mult: 3 }, rangeM: 1.4 },
    windupSec: 0.55,
    attackCooldownSec: 1.6,
    coinDrop: { min: 3, max: 7 },
    heightM: 1.9
  },
  bruiser: {
    kind: 'bruiser',
    name: 'Sewer Bruiser',
    hp: 150,
    speedM: 4.6,
    radiusM: 0.65,
    painChance: 180,
    attack: { type: 'hitscan', pellets: 0, dice: { count: 1, sides: 10, mult: 4 }, spreadRad: 0 },
    melee: { dice: { count: 1, sides: 10, mult: 4 }, rangeM: 1.5 },
    windupSec: 0.4,
    attackCooldownSec: 1.1,
    coinDrop: { min: 5, max: 9 },
    heightM: 2
  },
  fatcat: {
    kind: 'fatcat',
    name: 'Fat Cat',
    hp: 350,
    speedM: 2.4,
    radiusM: 0.8,
    painChance: 50,
    attack: { type: 'projectile', dice: { count: 1, sides: 6, mult: 8 }, speedM: 16.4, radiusM: 0.3 },
    melee: { dice: { count: 1, sides: 8, mult: 10 }, rangeM: 1.7 },
    windupSec: 0.6,
    attackCooldownSec: 2,
    coinDrop: { min: 12, max: 20 },
    heightM: 2.4
  }
}

export type EnemyState = 'idle' | 'chase' | 'windup' | 'pain' | 'dying' | 'dead'

export type Enemy = {
  id: number
  kind: EnemyKind
  pos: Vec2
  hp: number
  state: EnemyState
  stateTimer: number
  // Direction the enemy is currently walking; resampled Doom-style.
  moveAngle: number
  wanderTimer: number
  attackCooldown: number
  // Set when hurt by another enemy: classic monster infighting.
  infightTargetId: number | null
  awake: boolean
  deathTimer: number
}

let nextEnemyId = 1

export function createEnemy(kind: EnemyKind, pos: Vec2): Enemy {
  return {
    id: nextEnemyId++,
    kind,
    pos: { ...pos },
    hp: ENEMY_DEFS[kind].hp,
    state: 'idle',
    stateTimer: 0,
    moveAngle: 0,
    wanderTimer: 0,
    attackCooldown: 1,
    infightTargetId: null,
    awake: false,
    deathTimer: 0
  }
}

export type EnemyEvent =
  | { type: 'meleeHit'; damage: number }
  | { type: 'hitscan'; pellets: number; dice: { count: number; sides: number; mult: number }; spreadRad: number }
  | { type: 'projectile'; dice: { count: number; sides: number; mult: number }; speedM: number; radiusM: number; angle: number }
  | { type: 'died' }

export type EnemyTickInput = {
  dt: number
  target: Vec2
  canSeeTarget: boolean
  rng: Rng
}

// Doom's attack gamble (P_CheckMissileRange): d = dist_mu - 64, minus 128
// more for melee-capable monsters, clamped to 200; attack iff a 0-255 roll
// is >= d. Distances converted at 32 map units per meter.
export function attackChance(distanceM: number, hasMelee: boolean): number {
  let d = distanceM * 32 - 64
  if (hasMelee) {
    d -= 128
  }
  d = Math.min(200, Math.max(0, d))
  return (256 - d) / 256
}

export function tickEnemy(enemy: Enemy, input: EnemyTickInput): EnemyEvent[] {
  const def = ENEMY_DEFS[enemy.kind]
  const events: EnemyEvent[] = []
  const { dt, target, canSeeTarget, rng } = input
  const distance = dist(enemy.pos, target)

  enemy.stateTimer -= dt
  enemy.attackCooldown -= dt
  enemy.wanderTimer -= dt

  switch (enemy.state) {
    case 'idle': {
      if (canSeeTarget && distance < 24) {
        enemy.awake = true
        enemy.state = 'chase'
      }
      break
    }
    case 'chase': {
      if (enemy.wanderTimer <= 0) {
        // Zigzag toward the target: aim with a random offset, commit briefly.
        const offset = (rng() - 0.5) * 1.5
        enemy.moveAngle = angleTo(enemy.pos, target) + offset
        enemy.wanderTimer = 0.3 + rng() * 0.6
      }
      const inMelee = def.melee !== undefined && distance <= def.melee.rangeM
      const canRanged = def.attack.type !== 'hitscan' || def.attack.pellets > 0
      // The gamble runs on a decision clock (~Doom's 0-15 step counter).
      const gamble = rng() < attackChance(distance, def.melee !== undefined) * dt * 2.2
      if (enemy.attackCooldown <= 0 && (inMelee || (canSeeTarget && canRanged && gamble))) {
        enemy.state = 'windup'
        enemy.stateTimer = def.windupSec
      }
      break
    }
    case 'windup': {
      if (enemy.stateTimer <= 0) {
        const inMelee = def.melee !== undefined && distance <= def.melee.rangeM + 0.3
        if (inMelee && def.melee) {
          events.push({ type: 'meleeHit', damage: rollDamage(rng, def.melee.dice) })
        } else if (def.attack.type === 'hitscan' && def.attack.pellets > 0) {
          events.push({
            type: 'hitscan',
            pellets: def.attack.pellets,
            dice: def.attack.dice,
            spreadRad: def.attack.spreadRad
          })
        } else if (def.attack.type === 'projectile') {
          events.push({
            type: 'projectile',
            dice: def.attack.dice,
            speedM: def.attack.speedM,
            radiusM: def.attack.radiusM,
            angle: angleTo(enemy.pos, target)
          })
        }
        enemy.attackCooldown = def.attackCooldownSec * (0.75 + rng() * 0.5)
        enemy.state = 'chase'
      }
      break
    }
    case 'pain': {
      if (enemy.stateTimer <= 0) {
        enemy.state = 'chase'
      }
      break
    }
    case 'dying': {
      enemy.deathTimer += dt
      if (enemy.deathTimer > 0.7) {
        enemy.state = 'dead'
        events.push({ type: 'died' })
      }
      break
    }
    case 'dead':
      break
  }

  return events
}

export function enemyMoveSpeed(enemy: Enemy): number {
  const def = ENEMY_DEFS[enemy.kind]
  if (enemy.state === 'chase') {
    return def.speedM
  }
  return 0
}

export type DamageResult = 'pain' | 'died' | 'hit' | 'ignored'

export function damageEnemy(enemy: Enemy, damage: number, rng: Rng, attackerId: number | null = null): DamageResult {
  if (enemy.state === 'dying' || enemy.state === 'dead') {
    return 'ignored'
  }
  const def = ENEMY_DEFS[enemy.kind]
  enemy.hp -= damage
  enemy.awake = true
  if (attackerId !== null && attackerId !== enemy.id) {
    enemy.infightTargetId = attackerId
  }
  if (enemy.hp <= 0) {
    enemy.state = 'dying'
    enemy.deathTimer = 0
    return 'died'
  }
  if (rng() * 255 < def.painChance) {
    enemy.state = 'pain'
    enemy.stateTimer = 0.35
    return 'pain'
  }
  return 'hit'
}

export function rollDamage(rng: Rng, dice: { count: number; sides: number; mult: number }): number {
  let total = 0
  for (let i = 0; i < dice.count; i++) {
    total += rngInt(rng, 1, dice.sides)
  }
  return total * dice.mult
}
