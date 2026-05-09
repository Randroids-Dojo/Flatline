import type { WeaponAmmoState, WeaponId } from './weapons'

// Feel pass: detect the transition where the player just spent the
// next-to-last shot of a finite-ammo weapon (boomstick / inkblaster).
// The cue this drives in FlatlineGame is a brief warning sting so a
// player paced into a fight knows they are about to dry-fire.
//
// Returns true exactly on the transition from > 1 to === 1; same-tick
// pickup that drops ammo from 0 to a higher value never fires (those
// are increases, not depletions). Peashooter (infinite ammo) always
// returns false.
export function justHitLastAmmo(
  weapon: WeaponId,
  previous: WeaponAmmoState,
  current: WeaponAmmoState
): boolean {
  if (weapon === 'peashooter') {
    return false
  }

  const previousCount = previous[weapon]
  const currentCount = current[weapon]

  return previousCount > 1 && currentCount === 1
}
