import { describe, expect, it } from 'vitest'
import { circlesOverlap, createEnemy, createGrunt, damageEnemy, enemyConfigs, enemyTypeForSpawn, gruntConfig, tickEnemy } from './enemies'

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
})
