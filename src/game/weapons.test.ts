import { describe, expect, it } from 'vitest'
import {
  canFireWeapon,
  collectWeaponAmmo,
  createWeaponAmmo,
  nextWeapon,
  spendWeaponAmmo,
  weaponAmmoLabel
} from './weapons'

describe('weapon ammo', () => {
  it('starts limited weapons at their caps', () => {
    expect(createWeaponAmmo()).toEqual({ boomstick: 6, inkblaster: 4 })
  })

  it('lets the peashooter fire without ammo', () => {
    expect(canFireWeapon('peashooter', { boomstick: 0, inkblaster: 0 })).toBe(true)
    expect(weaponAmmoLabel('peashooter', { boomstick: 0, inkblaster: 0 })).toBe('Inf')
  })

  it('spends limited ammo and blocks empty weapons', () => {
    const spent = spendWeaponAmmo('boomstick', { boomstick: 1, inkblaster: 0 })

    expect(spent).toEqual({ boomstick: 0, inkblaster: 0 })
    expect(canFireWeapon('boomstick', spent)).toBe(false)
  })

  it('refills limited weapons without exceeding caps', () => {
    expect(collectWeaponAmmo({ boomstick: 5, inkblaster: 4 })).toEqual({ boomstick: 6, inkblaster: 4 })
  })

  it('cycles weapons in hud order', () => {
    expect(nextWeapon('peashooter')).toBe('boomstick')
    expect(nextWeapon('boomstick')).toBe('inkblaster')
    expect(nextWeapon('inkblaster')).toBe('peashooter')
  })
})
