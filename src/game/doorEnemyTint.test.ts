import { describe, expect, it } from 'vitest'

import { DOOR_ENEMY_TINTS, doorEnemyTint } from './doorEnemyTint'

describe('doorEnemyTint', () => {
  it('returns a non-empty hex color for each enemy type', () => {
    for (const type of ['grunt', 'skitter', 'brute', 'spitter'] as const) {
      const color = doorEnemyTint(type)
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('keeps the grunt tint at the existing open-phase amber so the default door read is unchanged', () => {
    expect(doorEnemyTint('grunt')).toBe('#f0c668')
  })

  it('uses a distinct color per enemy type so the cue is unambiguous', () => {
    const colors = new Set(Object.values(DOOR_ENEMY_TINTS))
    expect(colors.size).toBe(Object.keys(DOOR_ENEMY_TINTS).length)
  })
})
