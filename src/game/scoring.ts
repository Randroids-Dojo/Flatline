import type { WeaponId } from './weapons'

export type ScoreState = {
  score: number
  kills: number
  shotsFired: number
  shotsHit: number
  bestCombo: number
  combo: number
  comboExpiresAtMs: number
  closeRangeKills: number
  weaponsUsedForKills: ReadonlyArray<WeaponId>
  noDamageStreakKills: number
  bestNoDamageStreak: number
}

export type RecordKillOptions = {
  /** Distance in world units between player and enemy at the moment of the kill. */
  distance?: number
  /** Weapon that landed the killing blow. */
  weapon?: WeaponId
  /** True when the player has taken damage since the previous kill (or run start). */
  tookDamageSinceLastKill?: boolean
  /** Optional override for the base kill score. Defaults to 100. */
  baseScore?: number
}

/** Kills landed inside this radius count as close-range. */
export const CLOSE_RANGE_THRESHOLD = 3
/** Bonus points granted per close-range kill on top of the base + combo. */
export const CLOSE_RANGE_BONUS = 50
/** Bonus points granted the first time a kill lands with a fresh weapon in the run. */
export const WEAPON_VARIETY_BONUS = 75
/** Bonus points granted per kill while the player has not taken damage since the last kill. */
export const NO_DAMAGE_STREAK_BONUS = 30
/** Final-score multiplier applied to accuracy (0..1). */
export const ACCURACY_BONUS_MULTIPLIER = 500

export function createScoreState(): ScoreState {
  return {
    score: 0,
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
    bestCombo: 0,
    combo: 0,
    comboExpiresAtMs: 0,
    closeRangeKills: 0,
    weaponsUsedForKills: [],
    noDamageStreakKills: 0,
    bestNoDamageStreak: 0
  }
}

export function recordShot(score: ScoreState, hit: boolean): ScoreState {
  return {
    ...score,
    shotsFired: score.shotsFired + 1,
    shotsHit: score.shotsHit + Number(hit)
  }
}

export function recordKill(score: ScoreState, nowMs: number, options: RecordKillOptions = {}): ScoreState {
  const baseScore = options.baseScore ?? 100
  const combo = nowMs <= score.comboExpiresAtMs ? score.combo + 1 : 1
  const comboBonus = Math.max(0, combo - 1) * 25

  const isCloseRange = options.distance !== undefined && options.distance <= CLOSE_RANGE_THRESHOLD
  const closeRangeBonus = isCloseRange ? CLOSE_RANGE_BONUS : 0

  const weapon = options.weapon
  const isNewWeapon = weapon !== undefined && !score.weaponsUsedForKills.includes(weapon)
  const weaponVarietyBonus = isNewWeapon ? WEAPON_VARIETY_BONUS : 0
  const weaponsUsedForKills = isNewWeapon
    ? [...score.weaponsUsedForKills, weapon]
    : score.weaponsUsedForKills

  const tookDamage = options.tookDamageSinceLastKill === true
  const noDamageStreakKills = tookDamage ? 1 : score.noDamageStreakKills + 1
  const noDamageStreakBonus = tookDamage ? 0 : NO_DAMAGE_STREAK_BONUS
  const bestNoDamageStreak = Math.max(score.bestNoDamageStreak, noDamageStreakKills)

  const nextScore =
    score.score + baseScore + comboBonus + closeRangeBonus + weaponVarietyBonus + noDamageStreakBonus

  return {
    ...score,
    score: nextScore,
    kills: score.kills + 1,
    combo,
    bestCombo: Math.max(score.bestCombo, combo),
    comboExpiresAtMs: nowMs + 2500,
    closeRangeKills: score.closeRangeKills + (isCloseRange ? 1 : 0),
    weaponsUsedForKills,
    noDamageStreakKills,
    bestNoDamageStreak
  }
}

export function survivalBonus(runMs: number): number {
  return Math.floor(runMs / 1000) * 5
}

export function accuracy(score: ScoreState): number {
  if (score.shotsFired === 0) {
    return 0
  }

  return score.shotsHit / score.shotsFired
}

export function accuracyBonus(score: ScoreState): number {
  if (score.shotsFired === 0) {
    return 0
  }

  return Math.round(accuracy(score) * ACCURACY_BONUS_MULTIPLIER)
}

export function finalScore(score: ScoreState, runMs: number): number {
  return score.score + survivalBonus(runMs) + accuracyBonus(score)
}
