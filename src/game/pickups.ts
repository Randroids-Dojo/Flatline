// Pickup effects. Values follow Doom's item table: small heal +10, big heal
// +25 (capped at max HP), vest sets 100 armor at 1/3 absorb, trench armor
// sets 200 at 1/2 absorb. Coins follow the Rogue Legacy denominations:
// small 10, pile 100.

import type { PickupKind } from './dungeon'
import type { PlayerVitals } from './combat'
import { AMMO_PICKUPS, type AmmoState } from './weapons'

export const COIN_SMALL_VALUE = 10
export const COIN_PILE_VALUE = 100

export type PickupPlayerState = {
  vitals: PlayerVitals
  ammo: AmmoState
  ammoMax: AmmoState
  cheddar: number
  hasVaultKey: boolean
}

export type PickupResult = {
  state: PickupPlayerState
  // False when the pickup would do nothing (full health etc.); the item
  // stays on the floor, like Doom.
  consumed: boolean
}

export function applyPickup(kind: PickupKind, state: PickupPlayerState, cheddarMult = 1): PickupResult {
  const { vitals, ammo, ammoMax } = state
  switch (kind) {
    case 'coinSmall': {
      const gain = Math.round(COIN_SMALL_VALUE * cheddarMult)
      return { state: { ...state, cheddar: state.cheddar + gain }, consumed: true }
    }
    case 'coinPile': {
      const gain = Math.round(COIN_PILE_VALUE * cheddarMult)
      return { state: { ...state, cheddar: state.cheddar + gain }, consumed: true }
    }
    case 'cheeseBit': {
      if (vitals.hp >= vitals.maxHp) {
        return { state, consumed: false }
      }
      const hp = Math.min(vitals.maxHp, vitals.hp + 10)
      return { state: { ...state, vitals: { ...vitals, hp } }, consumed: true }
    }
    case 'cheeseWheel': {
      if (vitals.hp >= vitals.maxHp) {
        return { state, consumed: false }
      }
      const hp = Math.min(vitals.maxHp, vitals.hp + 25)
      return { state: { ...state, vitals: { ...vitals, hp } }, consumed: true }
    }
    case 'vest': {
      if (vitals.armor >= 100) {
        return { state, consumed: false }
      }
      return {
        state: { ...state, vitals: { ...vitals, armor: 100, armorClass: 'vest' } },
        consumed: true
      }
    }
    case 'trenchArmor': {
      if (vitals.armor >= 200) {
        return { state, consumed: false }
      }
      return {
        state: { ...state, vitals: { ...vitals, armor: 200, armorClass: 'trench' } },
        consumed: true
      }
    }
    case 'bullets':
    case 'shells':
    case 'tnt':
    case 'cells': {
      if (ammo[kind] >= ammoMax[kind]) {
        return { state, consumed: false }
      }
      const next = Math.min(ammoMax[kind], ammo[kind] + AMMO_PICKUPS[kind])
      return { state: { ...state, ammo: { ...ammo, [kind]: next } }, consumed: true }
    }
    case 'vaultKey': {
      if (state.hasVaultKey) {
        return { state, consumed: false }
      }
      return { state: { ...state, hasVaultKey: true }, consumed: true }
    }
  }
}
