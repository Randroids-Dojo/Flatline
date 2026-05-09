import { describe, expect, it } from 'vitest'
import {
  applyCrossfireRetarget,
  applyCrossfireStagger,
  CROSSFIRE_PURSUIT_DURATION_MS,
  CROSSFIRE_STAGGER_DURATION_MS,
  CROSSFIRE_STAGGER_PROBABILITY,
  circlesOverlap,
  createEnemy,
  createGrunt,
  crossfireStaggerIntensity,
  damageEnemy,
  enemyConfigs,
  enemyTypeForSpawn,
  gruntConfig,
  isFinisherReady,
  tickEnemy
} from './enemies'

const player = {
  position: { x: 0, y: 1.7, z: 0 },
  radius: 0.4,
  health: 100
}

describe('enemy AI', () => {
  it('creates distinct enemy roles', () => {
    const skitter = createEnemy('skitter', 'skitter-1', { x: 0, y: 1.05, z: 3 }, player.position)
    const brute = createEnemy('brute', 'brute-1', { x: 0, y: 1.05, z: 3 }, player.position)

    expect(skitter.health).toBe(enemyConfigs.skitter.maxHealth)
    expect(brute.health).toBe(enemyConfigs.brute.maxHealth)
    expect(skitter.radius).toBeLessThan(brute.radius)
    expect(enemyConfigs.skitter.speed).toBeGreaterThan(enemyConfigs.grunt.speed)
    expect(enemyConfigs.brute.speed).toBeLessThan(enemyConfigs.grunt.speed)
  })

  it('rotates spawn types by pressure role', () => {
    expect(enemyTypeForSpawn(1)).toBe('grunt')
    expect(enemyTypeForSpawn(3)).toBe('skitter')
    expect(enemyTypeForSpawn(7)).toBe('brute')
  })

  it('rotates spitter into the spawn order at every fifth count', () => {
    expect(enemyTypeForSpawn(5)).toBe('spitter')
    expect(enemyTypeForSpawn(10)).toBe('spitter')
    // 15 % 7 != 0, 15 % 5 == 0, 15 % 3 == 0 → spitter takes the slot before skitter
    expect(enemyTypeForSpawn(15)).toBe('spitter')
    // 35 % 7 == 0 takes priority over 35 % 5
    expect(enemyTypeForSpawn(35)).toBe('brute')
  })

  it('falls through to grunt for any non-multiple spawn count', () => {
    expect(enemyTypeForSpawn(0)).toBe('grunt')
    expect(enemyTypeForSpawn(2)).toBe('grunt')
    expect(enemyTypeForSpawn(4)).toBe('grunt')
    expect(enemyTypeForSpawn(8)).toBe('grunt')
  })

  it('exposes ranged config for the spitter and melee config for the others', () => {
    expect(enemyConfigs.spitter.attackKind).toBe('ranged')
    expect(enemyConfigs.spitter.projectileSpeed).toBeGreaterThan(0)
    expect(enemyConfigs.grunt.attackKind ?? 'melee').toBe('melee')
    expect(enemyConfigs.brute.attackKind ?? 'melee').toBe('melee')
    expect(enemyConfigs.skitter.attackKind ?? 'melee').toBe('melee')
  })

  it('emits a projectile event on the spitter windup-to-release boundary instead of resolving melee damage', () => {
    const spitter = createEnemy('spitter', 'spitter-1', { x: 0, y: 1.05, z: 4 }, player.position)
    const config = enemyConfigs.spitter
    const startedTick = tickEnemy(spitter, player, 16, config)
    expect(startedTick.events.some((event) => event.type === 'enemyAttackStarted')).toBe(true)

    // Advance through the windup so the next tick crosses the release boundary.
    const releaseTick = tickEnemy(startedTick.enemy, player, config.attackWindupMs, config)
    const projectileEvent = releaseTick.events.find((event) => event.type === 'enemyProjectileFired')
    expect(projectileEvent).toBeDefined()
    if (projectileEvent && projectileEvent.type === 'enemyProjectileFired') {
      expect(projectileEvent.speed).toBe(config.projectileSpeed)
      expect(projectileEvent.damage).toBe(config.attackDamage)
      expect(Math.hypot(projectileEvent.direction.x, projectileEvent.direction.z)).toBeCloseTo(1, 5)
    }

    // Player health is unchanged because ranged enemies do not deal melee damage at release.
    expect(releaseTick.player.health).toBe(player.health)
  })

  it('chases toward the player without overlapping the player circle', () => {
    const enemy = createGrunt('grunt-1', { x: 0, y: 1, z: 5 }, player.position)
    const result = tickEnemy(enemy, player, 1000, gruntConfig)

    expect(result.enemy.position.z).toBeLessThan(5)
    expect(circlesOverlap(result.enemy.position, result.enemy.radius, player.position, player.radius)).toBe(false)
  })

  it('starts a melee windup when inside range', () => {
    const enemy = createGrunt('grunt-1', { x: 0, y: 1, z: 1.2 }, player.position)
    const result = tickEnemy(enemy, player, 16, gruntConfig)

    expect(result.enemy.state).toBe('attackWindup')
    expect(result.events).toContainEqual({ type: 'enemyAttackStarted', enemyId: 'grunt-1', enemyType: 'grunt' })
  })

  it('damages the player on attack release if still in range', () => {
    const enemy = {
      ...createGrunt('grunt-1', { x: 0, y: 1, z: 1.2 }, player.position),
      state: 'attackWindup' as const,
      animationTimeMs: gruntConfig.attackWindupMs - 1
    }
    const result = tickEnemy(enemy, player, 1, gruntConfig)

    expect(result.enemy.state).toBe('attackRelease')
    expect(result.player.health).toBe(90)
    expect(result.events).toContainEqual({ type: 'enemyAttackHit', enemyId: 'grunt-1', damage: 10 })
  })

  it('can miss if the player leaves melee range before release', () => {
    const enemy = {
      ...createGrunt('grunt-1', { x: 0, y: 1, z: 1.2 }, player.position),
      state: 'attackWindup' as const,
      animationTimeMs: gruntConfig.attackWindupMs - 1
    }
    const result = tickEnemy(enemy, { ...player, position: { x: 0, y: 1.7, z: 5 } }, 1, gruntConfig)

    expect(result.player.health).toBe(100)
    expect(result.events).toContainEqual({ type: 'enemyAttackMissed', enemyId: 'grunt-1' })
  })

  it('emits melee arc crossfire events for nearby enemies on the brute swing release', () => {
    const config = enemyConfigs.brute
    const brute = {
      ...createEnemy('brute', 'brute-1', { x: 0, y: 1.05, z: 0 }, player.position),
      state: 'attackWindup' as const,
      animationTimeMs: config.attackWindupMs - 1
    }
    const adjacent = createEnemy('grunt', 'grunt-near', { x: 0, y: 1.05, z: 1.0 }, player.position)
    const farAway = createEnemy('grunt', 'grunt-far', { x: 0, y: 1.05, z: 5.0 }, player.position)
    const nearby = [
      { id: brute.id, position: brute.position, radius: brute.radius },
      { id: adjacent.id, position: adjacent.position, radius: adjacent.radius },
      { id: farAway.id, position: farAway.position, radius: farAway.radius }
    ]

    const result = tickEnemy(brute, { ...player, position: { x: 0, y: 1.7, z: 5 } }, 1, config, nearby)

    const crossfire = result.events.filter((event) => event.type === 'enemyMeleeArcCrossfire')
    expect(crossfire).toHaveLength(1)
    if (crossfire[0].type === 'enemyMeleeArcCrossfire') {
      expect(crossfire[0].sourceId).toBe('brute-1')
      expect(crossfire[0].sourceType).toBe('brute')
      expect(crossfire[0].targetEnemyId).toBe('grunt-near')
      expect(crossfire[0].damage).toBe(config.attackDamage)
    }
  })

  it('does not emit crossfire events for ranged enemies on release', () => {
    const config = enemyConfigs.spitter
    const spitter = {
      ...createEnemy('spitter', 'spitter-1', { x: 0, y: 1.05, z: 0 }, player.position),
      state: 'attackWindup' as const,
      animationTimeMs: config.attackWindupMs - 1
    }
    const adjacent = createEnemy('grunt', 'grunt-near', { x: 0, y: 1.05, z: 0.6 }, player.position)
    const nearby = [
      { id: spitter.id, position: spitter.position, radius: spitter.radius },
      { id: adjacent.id, position: adjacent.position, radius: adjacent.radius }
    ]

    const result = tickEnemy(spitter, player, 1, config, nearby)

    expect(result.events.some((event) => event.type === 'enemyMeleeArcCrossfire')).toBe(false)
  })

  it('does not emit crossfire when no nearby enemies are passed', () => {
    const config = enemyConfigs.brute
    const brute = {
      ...createEnemy('brute', 'brute-1', { x: 0, y: 1.05, z: 0 }, player.position),
      state: 'attackWindup' as const,
      animationTimeMs: config.attackWindupMs - 1
    }

    const result = tickEnemy(brute, player, 1, config)

    expect(result.events.some((event) => event.type === 'enemyMeleeArcCrossfire')).toBe(false)
  })

  it('triggers a skitter dash burst when chasing in the dashable range', () => {
    const skitter = createEnemy('skitter', 'skitter-1', { x: 0, y: 1.05, z: 2.5 }, player.position)
    const config = enemyConfigs.skitter

    const result = tickEnemy(skitter, player, 16, config)

    expect(result.enemy.dashBurstMsRemaining).toBeGreaterThan(0)
    expect(result.enemy.attackCooldownMs).toBeGreaterThan(0)
  })

  it('emits a crossfire event and ends the dash when a dashing skitter overlaps another enemy', () => {
    const config = enemyConfigs.skitter
    const skitter = {
      ...createEnemy('skitter', 'skitter-1', { x: 0, y: 1.05, z: 0 }, player.position),
      dashBurstMsRemaining: 200
    }
    const target = createEnemy('grunt', 'grunt-victim', { x: 0, y: 1.05, z: 0.4 }, player.position)
    const nearby = [
      { id: skitter.id, position: skitter.position, radius: skitter.radius },
      { id: target.id, position: target.position, radius: target.radius }
    ]

    const result = tickEnemy(skitter, { ...player, position: { x: 0, y: 1.7, z: 8 } }, 16, config, nearby)

    const crossfire = result.events.filter((event) => event.type === 'enemyMeleeArcCrossfire')
    expect(crossfire).toHaveLength(1)
    if (crossfire[0].type === 'enemyMeleeArcCrossfire') {
      expect(crossfire[0].sourceType).toBe('skitter')
      expect(crossfire[0].targetEnemyId).toBe('grunt-victim')
    }
    expect(result.enemy.dashBurstMsRemaining).toBe(0)
  })

  it('does not emit a dash crossfire event when no enemy is in contact', () => {
    const config = enemyConfigs.skitter
    const skitter = {
      ...createEnemy('skitter', 'skitter-1', { x: 0, y: 1.05, z: 0 }, player.position),
      dashBurstMsRemaining: 200
    }
    const farTarget = createEnemy('grunt', 'grunt-far', { x: 0, y: 1.05, z: 5.0 }, player.position)
    const nearby = [
      { id: skitter.id, position: skitter.position, radius: skitter.radius },
      { id: farTarget.id, position: farTarget.position, radius: farTarget.radius }
    ]

    const result = tickEnemy(skitter, { ...player, position: { x: 0, y: 1.7, z: 8 } }, 16, config, nearby)

    expect(result.events.some((event) => event.type === 'enemyMeleeArcCrossfire')).toBe(false)
    expect(result.enemy.dashBurstMsRemaining).toBeGreaterThan(0)
  })

  it('does not trigger a dash burst on grunt or brute', () => {
    const grunt = createEnemy('grunt', 'grunt-1', { x: 0, y: 1.05, z: 2.5 }, player.position)
    const brute = createEnemy('brute', 'brute-1', { x: 0, y: 1.05, z: 2.5 }, player.position)

    const gruntResult = tickEnemy(grunt, player, 16, enemyConfigs.grunt)
    const bruteResult = tickEnemy(brute, player, 16, enemyConfigs.brute)

    expect(gruntResult.enemy.dashBurstMsRemaining).toBe(0)
    expect(bruteResult.enemy.dashBurstMsRemaining).toBe(0)
  })

  it('enters hurt and death states through damage', () => {
    const enemy = createGrunt('grunt-1', { x: 0, y: 1, z: 5 }, player.position)
    const hurt = damageEnemy(enemy, 1)
    const dead = damageEnemy(hurt, 2)

    expect(hurt.state).toBe('hurt')
    expect(dead.state).toBe('dead')
  })

  it('applies crossfire stagger when the roll lands under the probability', () => {
    const enemy = createGrunt('grunt-1', { x: 0, y: 1.05, z: 3 }, player.position)
    const source = { id: 'source-1', position: { x: 5, y: 1.05, z: 3 } }
    const staggered = applyCrossfireStagger(enemy, source, CROSSFIRE_STAGGER_PROBABILITY - 0.0001)

    expect(staggered.crossfireStaggerMs).toBe(CROSSFIRE_STAGGER_DURATION_MS)
    expect(staggered.facingAngle).not.toBe(enemy.facingAngle)
  })

  it('skips crossfire stagger when the roll lands at or above the probability', () => {
    const enemy = createGrunt('grunt-1', { x: 0, y: 1.05, z: 3 }, player.position)
    const source = { id: 'source-1', position: { x: 5, y: 1.05, z: 3 } }
    const unchanged = applyCrossfireStagger(enemy, source, CROSSFIRE_STAGGER_PROBABILITY)

    expect(unchanged).toBe(enemy)
  })

  it('skips crossfire stagger on dead enemies', () => {
    const enemy = createGrunt('grunt-1', { x: 0, y: 1.05, z: 3 }, player.position)
    const dead = damageEnemy(damageEnemy(enemy, enemy.health), enemy.health)
    const source = { id: 'source-1', position: { x: 5, y: 1.05, z: 3 } }
    const result = applyCrossfireStagger(dead, source, 0)

    expect(result).toBe(dead)
    expect(result.crossfireStaggerMs).toBe(0)
  })

  it('freezes player chase while staggered and decrements the timer', () => {
    const enemy = createGrunt('grunt-1', { x: 0, y: 1.05, z: 3 }, player.position)
    const source = { id: 'source-1', position: { x: 5, y: 1.05, z: 3 } }
    const staggered = applyCrossfireStagger(enemy, source, 0)

    const tickResult = tickEnemy(staggered, player, 100, gruntConfig)

    expect(tickResult.enemy.crossfireStaggerMs).toBe(CROSSFIRE_STAGGER_DURATION_MS - 100)
    expect(tickResult.enemy.velocity).toEqual({ x: 0, y: 0, z: 0 })
    // Position must not advance toward the player while staggered.
    expect(tickResult.enemy.position).toEqual(staggered.position)
    // Facing angle was set toward source by applyCrossfireStagger and must not flip
    // back toward the player while the stagger is still active.
    expect(tickResult.enemy.facingAngle).toBe(staggered.facingAngle)
  })

  it('resumes player chase after the stagger window expires', () => {
    const enemy = createGrunt('grunt-1', { x: 0, y: 1.05, z: 3 }, player.position)
    const source = { id: 'source-1', position: { x: 5, y: 1.05, z: 3 } }
    const staggered = applyCrossfireStagger(enemy, source, 0)
    const expirationDelta = CROSSFIRE_STAGGER_DURATION_MS + 16

    const tickResult = tickEnemy(staggered, player, expirationDelta, gruntConfig)

    expect(tickResult.enemy.crossfireStaggerMs).toBe(0)
    // After the stagger expires the enemy should be facing the player again.
    expect(tickResult.enemy.facingAngle).not.toBe(staggered.facingAngle)
  })

  it('pauses attack windup progression while staggered', () => {
    // Set up a brute mid-windup. Stagger for 700ms is longer than any single
    // animation frame and should freeze the windup so the attack does not
    // release on schedule.
    const brute = {
      ...createEnemy('brute', 'brute-1', { x: 0, y: 1.05, z: 1 }, player.position),
      state: 'attackWindup' as const,
      animationTimeMs: enemyConfigs.brute.attackWindupMs - 50
    }
    const source = { id: 'source-1', position: { x: 5, y: 1.05, z: 1 } }
    const staggered = applyCrossfireStagger(brute, source, 0)

    const tickResult = tickEnemy(staggered, player, 100, enemyConfigs.brute)

    // animationTimeMs must NOT advance during the stagger window or the
    // brute would punch through a 100ms tick at the 50ms-from-release mark.
    expect(tickResult.enemy.animationTimeMs).toBe(brute.animationTimeMs)
    expect(tickResult.enemy.state).toBe('attackWindup')
    expect(tickResult.events).toHaveLength(0)
  })

  it('does not let a long-frame tick bypass the stagger window', () => {
    // A 16-second tick is well past the 700ms stagger duration. A naive
    // implementation that decrements first and gates on the post-decrement
    // value would skip the freeze entirely; the activeDeltaMs split keeps
    // movement off until the stagger has been credited.
    const enemy = createGrunt('grunt-1', { x: 0, y: 1.05, z: 3 }, player.position)
    const source = { id: 'source-1', position: { x: 5, y: 1.05, z: 3 } }
    const staggered = applyCrossfireStagger(enemy, source, 0)
    const longDeltaMs = CROSSFIRE_STAGGER_DURATION_MS + 50

    const tickResult = tickEnemy(staggered, player, longDeltaMs, gruntConfig)

    const expectedActiveMs = longDeltaMs - CROSSFIRE_STAGGER_DURATION_MS
    expect(tickResult.enemy.crossfireStaggerMs).toBe(0)
    // Animation timer only advances by the post-stagger remainder of the frame.
    expect(tickResult.enemy.animationTimeMs).toBe(expectedActiveMs)
  })

  it('arms a pursuit window alongside the stagger on retarget', () => {
    const enemy = createGrunt('grunt-1', { x: 0, y: 1.05, z: 3 }, player.position)
    const source = { id: 'brute-7', position: { x: 4, y: 1.05, z: 3 } }
    const retargeted = applyCrossfireRetarget(enemy, source, 0)

    expect(retargeted.crossfirePursuitMs).toBe(CROSSFIRE_PURSUIT_DURATION_MS)
    expect(retargeted.crossfirePursuitTargetId).toBe('brute-7')
  })

  it('skips retarget when the victim is already pursuing a different source', () => {
    // Cascade prevention: a victim already chasing source A should not be
    // redirected mid-stride to source B by another infighting hit.
    const enemy = createGrunt('grunt-1', { x: 0, y: 1.05, z: 3 }, player.position)
    const sourceA = { id: 'brute-7', position: { x: 4, y: 1.05, z: 3 } }
    const sourceB = { id: 'spitter-2', position: { x: -4, y: 1.05, z: 3 } }
    const firstRetarget = applyCrossfireRetarget(enemy, sourceA, 0)
    const secondRetarget = applyCrossfireRetarget(firstRetarget, sourceB, 0)

    expect(secondRetarget).toBe(firstRetarget)
    expect(secondRetarget.crossfirePursuitTargetId).toBe('brute-7')
  })

  it('chases the pursuit target instead of the player after stagger ends', () => {
    // Place the player to the +z side, the pursuit target to the +x side,
    // and an enemy at the origin. Drive a tick whose deltaMs spans the
    // stagger window so movement begins; verify the enemy moved toward
    // the pursuit target, not the player.
    const enemy = {
      ...createGrunt('grunt-1', { x: 0, y: 1.05, z: 0 }, player.position),
      crossfireStaggerMs: 0,
      crossfirePursuitMs: CROSSFIRE_PURSUIT_DURATION_MS,
      crossfirePursuitTargetId: 'brute-7'
    }
    const pursuitTarget = {
      id: 'brute-7',
      position: { x: 5, y: 1.05, z: 0 },
      radius: 0.6,
      health: 50
    }

    const tickResult = tickEnemy(enemy, player, 100, gruntConfig, [], pursuitTarget)

    expect(tickResult.enemy.position.x).toBeGreaterThan(0)
    expect(Math.abs(tickResult.enemy.position.z)).toBeLessThan(0.01)
  })

  it('attacks the pursuit target with enemyAttackEnemy and does not damage the player', () => {
    // Drive a grunt mid-windup against the pursuit target standing in
    // melee range. Tick past the windup so attackRelease fires.
    const grunt = {
      ...createGrunt('grunt-1', { x: 0, y: 1.05, z: 0 }, player.position),
      state: 'attackWindup' as const,
      animationTimeMs: enemyConfigs.grunt.attackWindupMs - 10,
      crossfireStaggerMs: 0,
      crossfirePursuitMs: CROSSFIRE_PURSUIT_DURATION_MS,
      crossfirePursuitTargetId: 'brute-7'
    }
    const pursuitTarget = {
      id: 'brute-7',
      position: { x: 0.6, y: 1.05, z: 0 },
      radius: 0.6,
      health: 50
    }
    const playerStart = { ...player, health: player.health }

    const tickResult = tickEnemy(grunt, playerStart, 50, enemyConfigs.grunt, [], pursuitTarget)

    const attack = tickResult.events.find((event) => event.type === 'enemyAttackEnemy')
    expect(attack).toBeDefined()
    if (attack && attack.type === 'enemyAttackEnemy') {
      expect(attack.sourceId).toBe('grunt-1')
      expect(attack.targetEnemyId).toBe('brute-7')
      expect(attack.damage).toBe(enemyConfigs.grunt.attackDamage)
    }
    // No enemyAttackHit (player damage) on this tick.
    expect(tickResult.events.find((event) => event.type === 'enemyAttackHit')).toBeUndefined()
    expect(tickResult.player.health).toBe(player.health)
  })

  it('clears pursuit when the pursuit target is dead', () => {
    const enemy = {
      ...createGrunt('grunt-1', { x: 0, y: 1.05, z: 3 }, player.position),
      crossfireStaggerMs: 0,
      crossfirePursuitMs: CROSSFIRE_PURSUIT_DURATION_MS,
      crossfirePursuitTargetId: 'brute-7'
    }
    const deadTarget = {
      id: 'brute-7',
      position: { x: 4, y: 1.05, z: 3 },
      radius: 0.6,
      health: 0
    }

    const tickResult = tickEnemy(enemy, player, 50, gruntConfig, [], deadTarget)

    expect(tickResult.enemy.crossfirePursuitMs).toBe(0)
    expect(tickResult.enemy.crossfirePursuitTargetId).toBeNull()
  })

  it('clears pursuit when the caller does not supply a matching target', () => {
    const enemy = {
      ...createGrunt('grunt-1', { x: 0, y: 1.05, z: 3 }, player.position),
      crossfireStaggerMs: 0,
      crossfirePursuitMs: CROSSFIRE_PURSUIT_DURATION_MS,
      crossfirePursuitTargetId: 'brute-7'
    }

    // Call without a pursuit target; AI should fall back to the player.
    const tickResult = tickEnemy(enemy, player, 50, gruntConfig)

    expect(tickResult.enemy.crossfirePursuitMs).toBe(0)
    expect(tickResult.enemy.crossfirePursuitTargetId).toBeNull()
  })

  it('does not let a long frame drop the tail of the pursuit window', () => {
    // Mirror of the long-frame stagger test, but for the pursuit phase.
    // A grunt is mid-windup against the pursuit target with only 20ms
    // of pursuit left and the tick is 50ms. Naive code that gates
    // isPursuing on the post-decrement value would treat the whole
    // tick as no-pursuit and route the attack release at the player.
    // With the pre-decrement gate, the final infighting attack still
    // lands on the source. The pursuit target is also passed inside
    // nearbyEnemies, exercising the arc crossfire suppression on the
    // same long-frame path so pursuit-target damage is not double-emitted.
    const grunt = {
      ...createGrunt('grunt-1', { x: 0, y: 1.05, z: 0 }, player.position),
      state: 'attackWindup' as const,
      animationTimeMs: enemyConfigs.grunt.attackWindupMs - 10,
      crossfireStaggerMs: 0,
      crossfirePursuitMs: 20,
      crossfirePursuitTargetId: 'brute-7'
    }
    const pursuitTarget = {
      id: 'brute-7',
      position: { x: 0.6, y: 1.05, z: 0 },
      radius: 0.6,
      health: 50
    }
    const nearbyEnemies = [{ id: 'brute-7', position: pursuitTarget.position, radius: pursuitTarget.radius }]

    const tickResult = tickEnemy(grunt, player, 50, enemyConfigs.grunt, nearbyEnemies, pursuitTarget)

    const attackEnemyEvents = tickResult.events.filter((event) => event.type === 'enemyAttackEnemy')
    const arcCrossfireForTarget = tickResult.events.filter(
      (event) => event.type === 'enemyMeleeArcCrossfire' && event.targetEnemyId === 'brute-7'
    )
    expect(attackEnemyEvents).toHaveLength(1)
    expect(arcCrossfireForTarget).toHaveLength(0)
    expect(tickResult.events.find((event) => event.type === 'enemyAttackHit')).toBeUndefined()
    // Pursuit timer cleared at the end of the draining tick.
    expect(tickResult.enemy.crossfirePursuitMs).toBe(0)
    expect(tickResult.enemy.crossfirePursuitTargetId).toBeNull()
  })

  it('flags the finisher tint only for softened-up multi-HP enemies', () => {
    // Grunt (maxHealth 3): finisher only at 1 HP.
    expect(isFinisherReady(3, enemyConfigs.grunt.maxHealth)).toBe(false)
    expect(isFinisherReady(2, enemyConfigs.grunt.maxHealth)).toBe(false)
    expect(isFinisherReady(1, enemyConfigs.grunt.maxHealth)).toBe(true)
    // Brute (maxHealth 6): only at 1 HP, not at 2+ even though wounded.
    expect(isFinisherReady(2, enemyConfigs.brute.maxHealth)).toBe(false)
    expect(isFinisherReady(1, enemyConfigs.brute.maxHealth)).toBe(true)
    // Spitter (maxHealth 2): one damage event puts them at 1 HP.
    expect(isFinisherReady(2, enemyConfigs.spitter.maxHealth)).toBe(false)
    expect(isFinisherReady(1, enemyConfigs.spitter.maxHealth)).toBe(true)
    // Skitter (maxHealth 1): always at 1 HP if alive, but maxHealth filter
    // excludes them because every skitter is already a one-hit kill so the
    // tint would carry no information.
    expect(isFinisherReady(1, enemyConfigs.skitter.maxHealth)).toBe(false)
    // Edge: dead enemies (0 HP) and over-healed values do not fire the tint.
    expect(isFinisherReady(0, enemyConfigs.grunt.maxHealth)).toBe(false)
    expect(isFinisherReady(5, enemyConfigs.grunt.maxHealth)).toBe(false)
  })

  it('reports crossfire stagger intensity as a normalized 0..1 ramp', () => {
    expect(crossfireStaggerIntensity(0)).toBe(0)
    expect(crossfireStaggerIntensity(-50)).toBe(0)
    expect(crossfireStaggerIntensity(CROSSFIRE_STAGGER_DURATION_MS)).toBe(1)
    expect(crossfireStaggerIntensity(CROSSFIRE_STAGGER_DURATION_MS + 200)).toBe(1)
    expect(crossfireStaggerIntensity(CROSSFIRE_STAGGER_DURATION_MS / 2)).toBeCloseTo(0.5, 5)
  })

  it('does not emit a duplicate melee arc crossfire for the pursuit target', () => {
    // Pursuit melee release applies damage through enemyAttackEnemy;
    // the nearbyEnemies arc loop must not emit enemyMeleeArcCrossfire
    // for the same target, or infighting damage applies twice and the
    // retarget can be re-armed on the victim.
    const brute = {
      ...createEnemy('brute', 'brute-1', { x: 0, y: 1.05, z: 0 }, player.position),
      state: 'attackWindup' as const,
      animationTimeMs: enemyConfigs.brute.attackWindupMs - 10,
      crossfireStaggerMs: 0,
      crossfirePursuitMs: CROSSFIRE_PURSUIT_DURATION_MS,
      crossfirePursuitTargetId: 'grunt-target'
    }
    const targetPosition = { x: 0.6, y: 1.05, z: 0 }
    const pursuitTarget = {
      id: 'grunt-target',
      position: targetPosition,
      radius: 0.55,
      health: enemyConfigs.grunt.maxHealth
    }
    const nearbyEnemies = [{ id: 'grunt-target', position: targetPosition, radius: 0.55 }]

    const tickResult = tickEnemy(
      brute,
      player,
      50,
      enemyConfigs.brute,
      nearbyEnemies,
      pursuitTarget
    )

    const arcEventsForTarget = tickResult.events.filter(
      (event) => event.type === 'enemyMeleeArcCrossfire' && event.targetEnemyId === 'grunt-target'
    )
    const attackEventsForTarget = tickResult.events.filter(
      (event) => event.type === 'enemyAttackEnemy' && event.targetEnemyId === 'grunt-target'
    )
    expect(arcEventsForTarget).toHaveLength(0)
    expect(attackEventsForTarget).toHaveLength(1)
  })
})
