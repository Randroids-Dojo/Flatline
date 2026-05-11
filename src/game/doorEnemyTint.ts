import type { EnemyType } from './enemies'

/**
 * Color the door signal should drift toward while the door is in its
 * post-spawn `opening` or `open` phase. The map satisfies the
 * "Door lights signal enemy type" hint from
 * `docs/gdd/47-arena-mutations.md`: the player can read which enemy
 * just came out of (or is about to come out of) a door by glancing at
 * its glow.
 *
 * Grunt keeps the default amber so the existing open-phase visual
 * stays continuous when the player has not yet learned the system.
 * The other three pick hues out of the enemy art family so the cue is
 * legible even at the edge of the player's peripheral vision.
 */
export const DOOR_ENEMY_TINTS: Readonly<Record<EnemyType, string>> = {
  grunt: '#f0c668',
  skitter: '#70e6b8',
  brute: '#e8553a',
  spitter: '#b478e8'
}

export function doorEnemyTint(type: EnemyType): string {
  return DOOR_ENEMY_TINTS[type]
}
