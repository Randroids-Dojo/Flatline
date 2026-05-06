import type { Vec3 } from './types'

export type EnemyState = 'chase' | 'attackWindup' | 'attackRelease' | 'hurt' | 'dead'
export type EnemyType = 'grunt' | 'skitter' | 'brute' | 'spitter'
export type EnemyAttackKind = 'melee' | 'ranged'

export type EnemyModel = {
  id: string
  type: EnemyType
  position: Vec3
  velocity: Vec3
  radius: number
  health: number
  state: EnemyState
  facingAngle: number
  animationTimeMs: number
  attackCooldownMs: number
}

export type PlayerCombatState = {
  position: Vec3
  radius: number
  health: number
}

export type EnemyConfig = {
  speed: number
  attackRange: number
  attackDamage: number
  attackWindupMs: number
  attackReleaseMs: number
  attackCooldownMs: number
  hurtDurationMs: number
  contactPadding: number
  maxHealth: number
  pressureCost: number
  scale: number
  tint: string
  attackKind?: EnemyAttackKind
  projectileSpeed?: number
}

export type EnemyTickResult = {
  enemy: EnemyModel
  player: PlayerCombatState
  events: EnemyEvent[]
}

export type EnemyEvent =
  | { type: 'enemyAttackStarted'; enemyId: string; enemyType: EnemyType }
  | { type: 'enemyAttackHit'; enemyId: string; damage: number }
  | { type: 'enemyAttackMissed'; enemyId: string }
  | { type: 'enemyRecovered'; enemyId: string }
  | {
      type: 'enemyProjectileFired'
      enemyId: string
      enemyType: EnemyType
      origin: Vec3
      direction: Vec3
      speed: number
      damage: number
    }

export const gruntConfig: EnemyConfig = {
  speed: 2.15,
  attackRange: 1.25,
  attackDamage: 10,
  attackWindupMs: 420,
  attackReleaseMs: 180,
  attackCooldownMs: 760,
  hurtDurationMs: 180,
  contactPadding: 0.08,
  maxHealth: 3,
  pressureCost: 1,
  scale: 1,
  tint: '#ffffff'
}

export const enemyConfigs: Record<EnemyType, EnemyConfig> = {
  grunt: gruntConfig,
  skitter: {
    speed: 3.45,
    attackRange: 0.95,
    attackDamage: 6,
    attackWindupMs: 260,
    attackReleaseMs: 140,
    attackCooldownMs: 520,
    hurtDurationMs: 120,
    contactPadding: 0.06,
    maxHealth: 1,
    pressureCost: 0.75,
    scale: 0.72,
    tint: '#c9fff6'
  },
  brute: {
    speed: 1.28,
    attackRange: 1.45,
    attackDamage: 18,
    attackWindupMs: 620,
    attackReleaseMs: 240,
    attackCooldownMs: 980,
    hurtDurationMs: 260,
    contactPadding: 0.12,
    maxHealth: 6,
    pressureCost: 1.75,
    scale: 1.35,
    tint: '#f7d0c9'
  },
  spitter: {
    speed: 1.6,
    attackRange: 7.5,
    attackDamage: 8,
    attackWindupMs: 720,
    attackReleaseMs: 200,
    attackCooldownMs: 1400,
    hurtDurationMs: 200,
    contactPadding: 0.08,
    maxHealth: 2,
    pressureCost: 1.25,
    scale: 0.85,
    tint: '#a8e07a',
    attackKind: 'ranged',
    projectileSpeed: 8
  }
}

export function createEnemy(type: EnemyType, id: string, position: Vec3, playerPosition: Vec3): EnemyModel {
  const config = enemyConfigs[type]

  return {
    id,
    type,
    position,
    velocity: { x: 0, y: 0, z: 0 },
    radius: 0.55 * config.scale,
    health: config.maxHealth,
    state: 'chase',
    facingAngle: angleBetween(position, playerPosition),
    animationTimeMs: 0,
    attackCooldownMs: 0
  }
}

export function createGrunt(id: string, position: Vec3, playerPosition: Vec3): EnemyModel {
  return createEnemy('grunt', id, position, playerPosition)
}

export function enemyTypeForSpawn(spawnCount: number): EnemyType {
  if (spawnCount > 0 && spawnCount % 7 === 0) {
    return 'brute'
  }

  if (spawnCount > 0 && spawnCount % 5 === 0) {
    return 'spitter'
  }

  if (spawnCount > 0 && spawnCount % 3 === 0) {
    return 'skitter'
  }

  return 'grunt'
}

export function tickEnemy(
  enemy: EnemyModel,
  player: PlayerCombatState,
  deltaMs: number,
  config: EnemyConfig
): EnemyTickResult {
  if (enemy.state === 'dead') {
    return { enemy, player, events: [] }
  }

  const events: EnemyEvent[] = []
  const nextEnemy = {
    ...enemy,
    position: { ...enemy.position },
    velocity: { ...enemy.velocity },
    animationTimeMs: enemy.animationTimeMs + deltaMs,
    attackCooldownMs: Math.max(0, enemy.attackCooldownMs - deltaMs)
  }
  const nextPlayer = { ...player, position: { ...player.position } }

  nextEnemy.facingAngle = angleBetween(nextEnemy.position, nextPlayer.position)

  if (nextEnemy.health <= 0) {
    nextEnemy.state = 'dead'
    nextEnemy.velocity = { x: 0, y: 0, z: 0 }
    return { enemy: nextEnemy, player: nextPlayer, events }
  }

  if (nextEnemy.state === 'hurt') {
    nextEnemy.velocity = { x: 0, y: 0, z: 0 }

    if (nextEnemy.animationTimeMs >= config.hurtDurationMs) {
      nextEnemy.state = 'chase'
      nextEnemy.animationTimeMs = 0
      events.push({ type: 'enemyRecovered', enemyId: nextEnemy.id })
    }

    return { enemy: nextEnemy, player: nextPlayer, events }
  }

  if (nextEnemy.state === 'attackWindup') {
    nextEnemy.velocity = { x: 0, y: 0, z: 0 }

    if (nextEnemy.animationTimeMs >= config.attackWindupMs) {
      nextEnemy.state = 'attackRelease'
      nextEnemy.animationTimeMs = 0

      if (config.attackKind === 'ranged') {
        const dx = nextPlayer.position.x - nextEnemy.position.x
        const dz = nextPlayer.position.z - nextEnemy.position.z
        const distance = Math.hypot(dx, dz)
        const direction = distance > 0
          ? { x: dx / distance, y: 0, z: dz / distance }
          : { x: 0, y: 0, z: 1 }
        events.push({
          type: 'enemyProjectileFired',
          enemyId: nextEnemy.id,
          enemyType: nextEnemy.type,
          origin: { x: nextEnemy.position.x, y: nextEnemy.position.y, z: nextEnemy.position.z },
          direction,
          speed: config.projectileSpeed ?? 0,
          damage: config.attackDamage
        })
      } else if (enemyCanHitPlayer(nextEnemy, nextPlayer, config)) {
        nextPlayer.health = Math.max(0, nextPlayer.health - config.attackDamage)
        events.push({ type: 'enemyAttackHit', enemyId: nextEnemy.id, damage: config.attackDamage })
      } else {
        events.push({ type: 'enemyAttackMissed', enemyId: nextEnemy.id })
      }
    }

    return { enemy: nextEnemy, player: nextPlayer, events }
  }

  if (nextEnemy.state === 'attackRelease') {
    nextEnemy.velocity = { x: 0, y: 0, z: 0 }

    if (nextEnemy.animationTimeMs >= config.attackReleaseMs) {
      nextEnemy.state = 'chase'
      nextEnemy.animationTimeMs = 0
      nextEnemy.attackCooldownMs = config.attackCooldownMs
    }

    return { enemy: nextEnemy, player: nextPlayer, events }
  }

  if (enemyCanStartAttack(nextEnemy, nextPlayer, config)) {
    nextEnemy.state = 'attackWindup'
    nextEnemy.animationTimeMs = 0
    nextEnemy.velocity = { x: 0, y: 0, z: 0 }
    events.push({ type: 'enemyAttackStarted', enemyId: nextEnemy.id, enemyType: nextEnemy.type })
    return { enemy: nextEnemy, player: nextPlayer, events }
  }

  moveEnemyTowardPlayer(nextEnemy, nextPlayer, deltaMs, config)
  return { enemy: nextEnemy, player: nextPlayer, events }
}

export function damageEnemy(enemy: EnemyModel, damage: number): EnemyModel {
  if (enemy.state === 'dead' || damage <= 0) {
    return enemy
  }

  const health = Math.max(0, enemy.health - damage)

  return {
    ...enemy,
    health,
    state: health === 0 ? 'dead' : 'hurt',
    animationTimeMs: 0,
    velocity: { x: 0, y: 0, z: 0 }
  }
}

export function circlesOverlap(a: Vec3, aRadius: number, b: Vec3, bRadius: number): boolean {
  return distance2d(a, b) < aRadius + bRadius
}

function moveEnemyTowardPlayer(
  enemy: EnemyModel,
  player: PlayerCombatState,
  deltaMs: number,
  config: EnemyConfig
) {
  const dx = player.position.x - enemy.position.x
  const dz = player.position.z - enemy.position.z
  const distance = Math.hypot(dx, dz)
  const minDistance = enemy.radius + player.radius + config.contactPadding

  if (distance <= minDistance || distance === 0) {
    enemy.velocity = { x: 0, y: 0, z: 0 }
    return
  }

  const step = Math.min(config.speed * (deltaMs / 1000), distance - minDistance)
  const nx = dx / distance
  const nz = dz / distance
  enemy.position = {
    x: enemy.position.x + nx * step,
    y: enemy.position.y,
    z: enemy.position.z + nz * step
  }
  enemy.velocity = {
    x: nx * config.speed,
    y: 0,
    z: nz * config.speed
  }
}

function enemyCanStartAttack(enemy: EnemyModel, player: PlayerCombatState, config: EnemyConfig): boolean {
  return enemy.attackCooldownMs <= 0 && enemyCanHitPlayer(enemy, player, config)
}

function enemyCanHitPlayer(enemy: EnemyModel, player: PlayerCombatState, config: EnemyConfig): boolean {
  return distance2d(enemy.position, player.position) <= enemy.radius + player.radius + config.attackRange
}

function distance2d(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

function angleBetween(from: Vec3, to: Vec3): number {
  return Math.atan2(to.z - from.z, to.x - from.x)
}
