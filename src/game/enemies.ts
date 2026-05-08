import {
  SKITTER_DASH_DURATION_MS,
  SKITTER_DASH_REARM_COOLDOWN_MS,
  shouldStartSkitterDash,
  skitterDashSpeedScale
} from './skitterDash'
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
  dashBurstMsRemaining: number
  // F-016 v1: time remaining in a crossfire stagger window. While > 0 the
  // enemy stops chasing the player and faces the source of the infighting
  // damage. Decremented by tickEnemy.
  crossfireStaggerMs: number
  // F-016 v2: time remaining in the post-stagger pursuit window. While > 0
  // and the source is alive, the enemy chases and attempts to attack the
  // source instead of the player.
  crossfirePursuitMs: number
  // F-016 v2: id of the source enemy the victim is currently retargeted
  // against. Cleared when pursuit expires or the source dies.
  crossfirePursuitTargetId: string | null
}

// F-016 tuning. Probability is the chance per crossfire damage event
// that the victim enters the retarget. Stagger duration is how long the
// victim freezes player chase and faces the source. Pursuit duration is
// how long after the stagger the victim chases and attacks the source.
export const CROSSFIRE_STAGGER_PROBABILITY = 0.35
export const CROSSFIRE_STAGGER_DURATION_MS = 700
export const CROSSFIRE_PURSUIT_DURATION_MS = 1500

// F-016 v2: optional pursuit target description handed to tickEnemy.
// When pursuit is active and an entry with the matching id is supplied,
// the enemy chases and attacks this target instead of the player.
export type PursuitTarget = {
  id: string
  position: Vec3
  radius: number
  health: number
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
      // F-016 v2: emitted when a pursuing enemy lands its primary attack
      // on the source enemy it was retargeted against. The consumer
      // applies the damage WITHOUT crediting the player, so retargeted
      // kills do not show up in score / kill streak / accuracy paths.
      type: 'enemyAttackEnemy'
      sourceId: string
      sourceType: EnemyType
      targetEnemyId: string
      damage: number
    }
  | {
      type: 'enemyProjectileFired'
      enemyId: string
      enemyType: EnemyType
      origin: Vec3
      direction: Vec3
      speed: number
      damage: number
    }
  | {
      // Emitted when a melee swing release overlaps another enemy in the
      // swing arc. The consumer scales by its infighting damage rule and
      // applies the damage without crediting the player.
      type: 'enemyMeleeArcCrossfire'
      sourceId: string
      sourceType: EnemyType
      targetEnemyId: string
      damage: number
    }

export type NearbyEnemy = {
  id: string
  position: Vec3
  radius: number
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
    attackCooldownMs: 0,
    dashBurstMsRemaining: 0,
    crossfireStaggerMs: 0,
    crossfirePursuitMs: 0,
    crossfirePursuitTargetId: null
  }
}

// F-016. Pure helper: given a roll in [0, 1), returns the enemy
// updated with a stagger window, a pursuit window, and a facing angle
// pointing at the source of the crossfire damage if the roll lands
// under CROSSFIRE_STAGGER_PROBABILITY. Dead enemies are returned
// unchanged. The caller is responsible for supplying the roll so
// production code can use Math.random() while tests inject
// deterministic values.
//
// v2 behavior: also stores the source id and arms a pursuit window
// (CROSSFIRE_PURSUIT_DURATION_MS) so tickEnemy can chase and attack the
// source after the stagger ends. Existing v1 semantics (stagger + face)
// are unchanged for callers that only care about the freeze.
//
// Cascade prevention: if the victim already has an active pursuit the
// roll is skipped so an enemy cannot get yanked between sources by
// successive crossfire hits.
export function applyCrossfireRetarget(
  enemy: EnemyModel,
  source: { id: string; position: Vec3 },
  roll: number
): EnemyModel {
  if (enemy.state === 'dead') {
    return enemy
  }

  if (enemy.crossfirePursuitMs > 0) {
    return enemy
  }

  if (roll >= CROSSFIRE_STAGGER_PROBABILITY) {
    return enemy
  }

  return {
    ...enemy,
    crossfireStaggerMs: CROSSFIRE_STAGGER_DURATION_MS,
    crossfirePursuitMs: CROSSFIRE_PURSUIT_DURATION_MS,
    crossfirePursuitTargetId: source.id,
    facingAngle: angleBetween(enemy.position, source.position)
  }
}

// F-016 v1 alias. The v1 helper signature did not include the source
// id; the v2 helper adds it. Existing callers and tests that imported
// applyCrossfireStagger keep working through this alias, with the
// caller-supplied source object simply needing an id field now.
export const applyCrossfireStagger = applyCrossfireRetarget

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
  config: EnemyConfig,
  nearbyEnemies: readonly NearbyEnemy[] = [],
  pursuitTarget?: PursuitTarget
): EnemyTickResult {
  if (enemy.state === 'dead') {
    return { enemy, player, events: [] }
  }

  // F-016 v1: stagger consumes wall-clock time first. Animation, attack
  // windup, attack release, attack cooldown, and dash burst progression
  // only advance with the un-staggered remainder of the frame so a long
  // frame cannot bypass the freeze, and a stagger applied mid-windup
  // pauses the windup instead of letting it elapse.
  const staggerConsumedMs = Math.min(enemy.crossfireStaggerMs, deltaMs)
  const activeDeltaMs = deltaMs - staggerConsumedMs

  const events: EnemyEvent[] = []
  // F-016 v2: pursuit timer ticks down only with the un-staggered
  // remainder so the stagger and pursuit phases stay sequential rather
  // than overlapping.
  let pursuitMsRemaining = Math.max(0, enemy.crossfirePursuitMs - activeDeltaMs)
  let pursuitTargetId = enemy.crossfirePursuitTargetId

  // Pursuit is "live" this tick only when the timer is still running,
  // the source id is set, and the caller supplied a matching live
  // pursuit target. Anything else (timer expired, target died, target
  // missing) clears the pursuit so the AI falls back to chasing the
  // player.
  const pursuitMatches =
    pursuitTargetId !== null &&
    pursuitTarget !== undefined &&
    pursuitTarget.id === pursuitTargetId &&
    pursuitTarget.health > 0
  const isPursuing = pursuitMsRemaining > 0 && pursuitMatches

  if (!isPursuing) {
    pursuitMsRemaining = 0
    pursuitTargetId = null
  }

  const nextEnemy = {
    ...enemy,
    position: { ...enemy.position },
    velocity: { ...enemy.velocity },
    animationTimeMs: enemy.animationTimeMs + activeDeltaMs,
    attackCooldownMs: Math.max(0, enemy.attackCooldownMs - activeDeltaMs),
    dashBurstMsRemaining: Math.max(0, enemy.dashBurstMsRemaining - activeDeltaMs),
    crossfireStaggerMs: Math.max(0, enemy.crossfireStaggerMs - deltaMs),
    crossfirePursuitMs: pursuitMsRemaining,
    crossfirePursuitTargetId: pursuitTargetId
  }
  const nextPlayer = { ...player, position: { ...player.position } }

  // chaseTarget: the entity the AI uses for movement, facing, and attack
  // range checks. Defaults to the player; swaps to the pursuit target
  // while v2 retarget is active. Damage routing still branches on
  // isPursuing so the player's health is never modified during a
  // pursuit attack release.
  const chaseTarget: PlayerCombatState = isPursuing && pursuitTarget
    ? { position: pursuitTarget.position, radius: pursuitTarget.radius, health: pursuitTarget.health }
    : nextPlayer

  if (nextEnemy.crossfireStaggerMs <= 0) {
    nextEnemy.facingAngle = angleBetween(nextEnemy.position, chaseTarget.position)
  }

  if (nextEnemy.health <= 0) {
    nextEnemy.state = 'dead'
    nextEnemy.velocity = { x: 0, y: 0, z: 0 }
    return { enemy: nextEnemy, player: nextPlayer, events }
  }

  // If the entire frame was consumed by the stagger window, freeze
  // velocity and return without running chase, attack, or dash logic.
  // Any state ('chase', 'attackWindup', 'attackRelease', 'hurt') is
  // implicitly paused because activeDeltaMs is 0 and animation timers
  // did not advance.
  if (activeDeltaMs === 0) {
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
        const dx = chaseTarget.position.x - nextEnemy.position.x
        const dz = chaseTarget.position.z - nextEnemy.position.z
        const distance = Math.hypot(dx, dz)
        const direction = distance > 0
          ? { x: dx / distance, y: 0, z: dz / distance }
          : { x: 0, y: 0, z: 1 }
        // Ranged attacks during a v2 pursuit still produce a projectile;
        // the projectile resolution path applies infighting damage when
        // the projectile hits a non-player enemy and credits no score.
        events.push({
          type: 'enemyProjectileFired',
          enemyId: nextEnemy.id,
          enemyType: nextEnemy.type,
          origin: { x: nextEnemy.position.x, y: nextEnemy.position.y, z: nextEnemy.position.z },
          direction,
          speed: config.projectileSpeed ?? 0,
          damage: config.attackDamage
        })
      } else if (isPursuing && pursuitTarget) {
        // F-016 v2 pursuit melee hit: route damage to the pursuit target
        // through enemyAttackEnemy without touching nextPlayer.health and
        // without going through the player kill credit path.
        if (enemyCanHitPlayer(nextEnemy, chaseTarget, config)) {
          events.push({
            type: 'enemyAttackEnemy',
            sourceId: nextEnemy.id,
            sourceType: nextEnemy.type,
            targetEnemyId: pursuitTarget.id,
            damage: config.attackDamage
          })
        } else {
          events.push({ type: 'enemyAttackMissed', enemyId: nextEnemy.id })
        }
      } else if (enemyCanHitPlayer(nextEnemy, nextPlayer, config)) {
        nextPlayer.health = Math.max(0, nextPlayer.health - config.attackDamage)
        events.push({ type: 'enemyAttackHit', enemyId: nextEnemy.id, damage: config.attackDamage })
      } else {
        events.push({ type: 'enemyAttackMissed', enemyId: nextEnemy.id })
      }

      if (config.attackKind !== 'ranged') {
        for (const candidate of nearbyEnemies) {
          if (candidate.id === nextEnemy.id) {
            continue
          }

          // The pursuit target already received its damage through the
          // enemyAttackEnemy branch above; emitting an additional
          // enemyMeleeArcCrossfire here would double-apply infighting
          // damage and could re-arm the retarget on the same victim.
          if (isPursuing && candidate.id === pursuitTargetId) {
            continue
          }

          const dx = candidate.position.x - nextEnemy.position.x
          const dz = candidate.position.z - nextEnemy.position.z
          const distance = Math.hypot(dx, dz)

          if (distance <= config.attackRange + candidate.radius) {
            events.push({
              type: 'enemyMeleeArcCrossfire',
              sourceId: nextEnemy.id,
              sourceType: nextEnemy.type,
              targetEnemyId: candidate.id,
              damage: config.attackDamage
            })
          }
        }
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

  if (enemyCanStartAttack(nextEnemy, chaseTarget, config)) {
    nextEnemy.state = 'attackWindup'
    nextEnemy.animationTimeMs = 0
    nextEnemy.velocity = { x: 0, y: 0, z: 0 }
    events.push({ type: 'enemyAttackStarted', enemyId: nextEnemy.id, enemyType: nextEnemy.type })
    return { enemy: nextEnemy, player: nextPlayer, events }
  }

  // F-016 v2: skitter dash trigger reads the distance to whichever
  // entity the AI is currently chasing, so a pursuing skitter can dash
  // into the source enemy as readily as it would dash into the player.
  if (
    shouldStartSkitterDash({
      type: nextEnemy.type,
      state: nextEnemy.state,
      attackCooldownMs: nextEnemy.attackCooldownMs,
      dashBurstMsRemaining: nextEnemy.dashBurstMsRemaining,
      distanceToPlayerM: distance2d(nextEnemy.position, chaseTarget.position)
    })
  ) {
    nextEnemy.dashBurstMsRemaining = SKITTER_DASH_DURATION_MS
    nextEnemy.attackCooldownMs = SKITTER_DASH_REARM_COOLDOWN_MS
  }

  moveEnemyTowardPlayer(nextEnemy, chaseTarget, activeDeltaMs, config)

  // Skitter dash crossfire: closes F-013. While in an active dash burst,
  // a skitter that overlaps another alive enemy applies infighting damage
  // and ends its own burst so the dash reads as a single-target lunge.
  if (nextEnemy.type === 'skitter' && nextEnemy.dashBurstMsRemaining > 0) {
    for (const candidate of nearbyEnemies) {
      if (candidate.id === nextEnemy.id) {
        continue
      }

      const cdx = candidate.position.x - nextEnemy.position.x
      const cdz = candidate.position.z - nextEnemy.position.z
      const cDistance = Math.hypot(cdx, cdz)

      if (cDistance <= nextEnemy.radius + candidate.radius) {
        events.push({
          type: 'enemyMeleeArcCrossfire',
          sourceId: nextEnemy.id,
          sourceType: nextEnemy.type,
          targetEnemyId: candidate.id,
          damage: config.attackDamage
        })
        nextEnemy.dashBurstMsRemaining = 0
        break
      }
    }
  }

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

  const speedScale = skitterDashSpeedScale(enemy.dashBurstMsRemaining)
  const speed = config.speed * speedScale
  const step = Math.min(speed * (deltaMs / 1000), distance - minDistance)
  const nx = dx / distance
  const nz = dz / distance
  enemy.position = {
    x: enemy.position.x + nx * step,
    y: enemy.position.y,
    z: enemy.position.z + nz * step
  }
  enemy.velocity = {
    x: nx * speed,
    y: 0,
    z: nz * speed
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
