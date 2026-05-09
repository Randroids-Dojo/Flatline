import { describe, expect, it } from 'vitest'
import { createWeaponAmmo } from './weapons'
import { justHitLastAmmo } from './ammoWarning'

describe('justHitLastAmmo', () => {
  it('fires for the boomstick when the spent shot takes ammo from 2 to 1', () => {
    const previous = { ...createWeaponAmmo(), boomstick: 2 }
    const current = { ...createWeaponAmmo(), boomstick: 1 }
    expect(justHitLastAmmo('boomstick', previous, current)).toBe(true)
  })

  it('fires for the inkblaster on the same transition', () => {
    const previous = { ...createWeaponAmmo(), inkblaster: 2 }
    const current = { ...createWeaponAmmo(), inkblaster: 1 }
    expect(justHitLastAmmo('inkblaster', previous, current)).toBe(true)
  })

  it('does not fire when the spent shot was already the last', () => {
    // Already at 1, then the dry-fire / final shot drops to 0; the cue
    // is for "you have one left," not "you ran out."
    const previous = { ...createWeaponAmmo(), boomstick: 1 }
    const current = { ...createWeaponAmmo(), boomstick: 0 }
    expect(justHitLastAmmo('boomstick', previous, current)).toBe(false)
  })

  it('does not fire when ammo stays full or merely drops a step above 1', () => {
    const previous = { ...createWeaponAmmo(), boomstick: 6 }
    const current = { ...createWeaponAmmo(), boomstick: 5 }
    expect(justHitLastAmmo('boomstick', previous, current)).toBe(false)
  })

  it('does not fire for the peashooter even if state happens to land at 1', () => {
    // Peashooter is infinite; the WeaponAmmoState fields for it are not
    // checked, but the helper must still be a no-op.
    const previous = createWeaponAmmo()
    const current = createWeaponAmmo()
    expect(justHitLastAmmo('peashooter', previous, current)).toBe(false)
  })

  it('does not fire on ammo pickups that bring ammo up to 1', () => {
    // Ammo went UP from 0 to 1 (refill); not a depletion event.
    const previous = { ...createWeaponAmmo(), inkblaster: 0 }
    const current = { ...createWeaponAmmo(), inkblaster: 1 }
    expect(justHitLastAmmo('inkblaster', previous, current)).toBe(false)
  })
})
