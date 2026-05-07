/**
 * Spitter windup visualization.
 *
 * REQ-031 (the spitter ranged enemy) shipped with a tint and a 0.85x
 * scale, but the windup-to-fire moment is only telegraphed through
 * audio. The player has to *hear* the spitter charging to know a
 * projectile is coming. Without a visual cue the spitter's threat
 * reads weaker than the melee enemies whose lunge animations
 * telegraph through silhouette.
 *
 * `spitterChargeIntensity` maps a windup-state animation time to a
 * 0..1 brightness pulse the consumer can lerp the sprite tint toward.
 * The curve eases up so the brightness ramps slowly at the start of
 * the windup (when the player has time to react) and reaches peak
 * just before release.
 */
export type EnemyAnimationState = 'chase' | 'attackWindup' | 'attackRelease' | 'hurt' | 'dead'

/** Brightness intensity for a spitter currently winding up.
 * Returns 0 outside the windup state. */
export function spitterChargeIntensity(
  state: EnemyAnimationState,
  animationTimeMs: number,
  windupMs: number
): number {
  if (state !== 'attackWindup') {
    return 0
  }

  if (windupMs <= 0) {
    return 1
  }

  const ratio = Math.max(0, Math.min(1, animationTimeMs / windupMs))
  // Ease-in (quadratic): slow ramp at start, full at end.
  return ratio * ratio
}
