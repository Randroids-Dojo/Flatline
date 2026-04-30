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
    expect(result.events).toContainEqual({ type: 'enemyAttackStarted', enemyId: 'grunt-1' })
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

  it('enters hurt and death states through damage', () => {
    const enemy = createGrunt('grunt-1', { x: 0, y: 1, z: 5 }, player.position)
    const hurt = damageEnemy(enemy, 1)
    const dead = damageEnemy(hurt, 2)

    expect(hurt.state).toBe('hurt')
    expect(dead.state).toBe('dead')
  })
})
