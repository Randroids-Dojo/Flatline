export const weaponIds = ['peashooter', 'boomstick', 'inkblaster'] as const

export type WeaponId = (typeof weaponIds)[number]

export type WeaponConfig = {
  id: WeaponId
  label: string
  damage: number
  fireIntervalMs: number
  ammoPerShot: number
  maxAmmo: number | null
  spreadRadians: readonly number[]
}

export type WeaponAmmoState = {
  boomstick: number
  inkblaster: number
}

export type WeaponCooldownState = Record<WeaponId, number>

export const weaponConfigs: Record<WeaponId, WeaponConfig> = {
  peashooter: {
    id: 'peashooter',
    label: 'Peashooter',
    damage: 1,
    fireIntervalMs: 220,
    ammoPerShot: 0,
    maxAmmo: null,
    spreadRadians: [0]
  },
  boomstick: {
    id: 'boomstick',
    label: 'Boomstick',
    damage: 1,
    fireIntervalMs: 760,
    ammoPerShot: 1,
    maxAmmo: 6,
    spreadRadians: [-0.09, -0.05, -0.02, 0.02, 0.05, 0.09]
  },
  inkblaster: {
    id: 'inkblaster',
    label: 'Inkblaster',
    damage: 2,
    fireIntervalMs: 680,
    ammoPerShot: 1,
    maxAmmo: 4,
    spreadRadians: [0]
  }
}

export function createWeaponCooldownState(): WeaponCooldownState {
  return {
    peashooter: Number.NEGATIVE_INFINITY,
    boomstick: Number.NEGATIVE_INFINITY,
    inkblaster: Number.NEGATIVE_INFINITY
  }
}

export function createWeaponAmmo(): WeaponAmmoState {
  return {
    boomstick: weaponConfigs.boomstick.maxAmmo ?? 0,
    inkblaster: weaponConfigs.inkblaster.maxAmmo ?? 0
  }
}

export function weaponAmmoLabel(weapon: WeaponId, ammo: WeaponAmmoState): string {
  if (weapon === 'peashooter') {
    return 'Inf'
  }

  return String(ammo[weapon])
}

export function canFireWeapon(weapon: WeaponId, ammo: WeaponAmmoState): boolean {
  const config = weaponConfigs[weapon]

  if (weapon === 'peashooter' || config.maxAmmo === null) {
    return true
  }

  return ammo[weapon] >= config.ammoPerShot
}

export function spendWeaponAmmo(weapon: WeaponId, ammo: WeaponAmmoState): WeaponAmmoState {
  const config = weaponConfigs[weapon]

  if (weapon === 'peashooter' || config.maxAmmo === null) {
    return ammo
  }

  return {
    ...ammo,
    [weapon]: Math.max(0, ammo[weapon] - config.ammoPerShot)
  }
}

export function weaponCooldownRemainingMs(weapon: WeaponId, lastFiredAtMs: number, nowMs: number): number {
  return Math.max(0, weaponConfigs[weapon].fireIntervalMs - (nowMs - lastFiredAtMs))
}

export function canFireWeaponAt(weapon: WeaponId, lastFiredAtMs: number, nowMs: number): boolean {
  return weaponCooldownRemainingMs(weapon, lastFiredAtMs, nowMs) === 0
}

export function collectWeaponAmmo(ammo: WeaponAmmoState, boomstick = 2, inkblaster = 1): WeaponAmmoState {
  return {
    boomstick: Math.min(weaponConfigs.boomstick.maxAmmo ?? 0, ammo.boomstick + boomstick),
    inkblaster: Math.min(weaponConfigs.inkblaster.maxAmmo ?? 0, ammo.inkblaster + inkblaster)
  }
}

export function nextWeapon(current: WeaponId): WeaponId {
  const index = weaponIds.indexOf(current)
  return weaponIds[(index + 1) % weaponIds.length]
}
