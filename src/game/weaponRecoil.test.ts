import { describe, expect, it } from 'vitest'
import { weaponRecoilStyle } from './weaponRecoil'

describe('weaponRecoilStyle', () => {
  it('returns positive kick and rotation for every weapon', () => {
    for (const weapon of ['peashooter', 'boomstick', 'inkblaster'] as const) {
      const style = weaponRecoilStyle(weapon)
      expect(style.kickPx).toBeGreaterThan(0)
      expect(style.rotateDeg).toBeLessThan(0)
      expect(style.durationMs).toBeGreaterThan(0)
    }
  })

  it('orders kick intensity peashooter < inkblaster < boomstick', () => {
    const peashooter = weaponRecoilStyle('peashooter')
    const inkblaster = weaponRecoilStyle('inkblaster')
    const boomstick = weaponRecoilStyle('boomstick')
    expect(inkblaster.kickPx).toBeGreaterThan(peashooter.kickPx)
    expect(boomstick.kickPx).toBeGreaterThan(inkblaster.kickPx)
  })

  it('orders rotation magnitude peashooter < inkblaster < boomstick', () => {
    const peashooter = Math.abs(weaponRecoilStyle('peashooter').rotateDeg)
    const inkblaster = Math.abs(weaponRecoilStyle('inkblaster').rotateDeg)
    const boomstick = Math.abs(weaponRecoilStyle('boomstick').rotateDeg)
    expect(inkblaster).toBeGreaterThan(peashooter)
    expect(boomstick).toBeGreaterThan(inkblaster)
  })

  it('keeps every duration short enough not to block the next shot', () => {
    for (const weapon of ['peashooter', 'boomstick', 'inkblaster'] as const) {
      const { durationMs } = weaponRecoilStyle(weapon)
      expect(durationMs).toBeGreaterThanOrEqual(100)
      expect(durationMs).toBeLessThanOrEqual(300)
    }
  })

  it('keeps every kick within a reasonable visual range', () => {
    for (const weapon of ['peashooter', 'boomstick', 'inkblaster'] as const) {
      const { kickPx } = weaponRecoilStyle(weapon)
      expect(kickPx).toBeLessThanOrEqual(28)
    }
  })

  it('returns stable references for the same weapon id', () => {
    expect(weaponRecoilStyle('peashooter')).toBe(weaponRecoilStyle('peashooter'))
    expect(weaponRecoilStyle('boomstick')).toBe(weaponRecoilStyle('boomstick'))
    expect(weaponRecoilStyle('inkblaster')).toBe(weaponRecoilStyle('inkblaster'))
  })
})
