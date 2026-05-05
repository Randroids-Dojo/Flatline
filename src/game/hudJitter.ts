/**
 * Pure helpers for the cartoon-title-card HUD treatment described in
 * `docs/gdd/39-hud.md`.
 *
 * The HUD is built from grayscale CSS pills, so it needs ambient motion to
 * read like an old animated title card rather than a flat shooter overlay.
 * Three layered cues drive that feel:
 *
 *   1. A small ambient wobble on every HUD pill so the layout breathes.
 *   2. A film grain overlay whose opacity rises as the player gets hurt.
 *   3. An "ink splatter" damage frame that shows when health is critical.
 *
 * All four functions are pure, allocation free, and safe to call every frame.
 * They consume only `runMs` (the run clock for time-driven oscillation) and
 * `playerHealth` (current health, 0..100). The amplitudes are intentionally
 * conservative: jitter must stay under the readability threshold called out
 * in the GDD ("slight jitter, but not enough to hurt readability").
 */

const PILL_WOBBLE_PERIOD_MS = 1700
const PILL_WOBBLE_AMPLITUDE_PX = 0.55
const PILL_WOBBLE_ROT_DEG = 0.32

const GRAIN_BASELINE = 0.06
const GRAIN_PEAK = 0.22

const SPLATTER_HEALTH_THRESHOLD = 60
const SPLATTER_PEAK_INTENSITY = 0.85

const HEALTH_MAX = 100

function clamp01(value: number): number {
  if (value < 0) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  return value
}

function healthFraction(playerHealth: number): number {
  return clamp01(playerHealth / HEALTH_MAX)
}

/**
 * Amplitude (in pixels) for the ambient HUD pill wobble. The wobble is a
 * rendered as a CSS keyframe driven from a custom property; the helper just
 * picks the right magnitude so the value stays readable. Amplitude grows
 * slightly as health drops so the HUD feels "rattled" on low health, but it
 * is always small enough to keep numbers legible.
 */
export function hudPillWobbleAmplitudePx(playerHealth: number): number {
  const lowHealthBoost = 1 + (1 - healthFraction(playerHealth)) * 0.6
  return PILL_WOBBLE_AMPLITUDE_PX * lowHealthBoost
}

/**
 * Rotation amplitude (in degrees) for the same wobble keyframe.
 */
export function hudPillWobbleRotationDeg(playerHealth: number): number {
  const lowHealthBoost = 1 + (1 - healthFraction(playerHealth)) * 0.5
  return PILL_WOBBLE_ROT_DEG * lowHealthBoost
}

/**
 * Period (ms) for one full wobble cycle. Constant so multiple pills wobble in
 * sync and the layout reads as a single jittery card rather than independent
 * pieces drifting.
 */
export function hudPillWobblePeriodMs(): number {
  return PILL_WOBBLE_PERIOD_MS
}

/**
 * Film grain overlay opacity. Always at least the baseline so the HUD never
 * feels glassy-clean, and rises toward a peak as the player loses health.
 * Output is clamped to [0, 1].
 */
export function hudGrainOpacity(playerHealth: number): number {
  const fraction = healthFraction(playerHealth)
  const intensity = GRAIN_BASELINE + (GRAIN_PEAK - GRAIN_BASELINE) * (1 - fraction)
  return clamp01(intensity)
}

/**
 * Ink splatter damage-frame intensity. Returns 0 when health is above the
 * threshold (default 60), then ramps up linearly to a peak at 0 health. The
 * caller multiplies this into the splatter element's opacity / scale so the
 * frame appears as a low-health visual stress signal, not a per-hit pop
 * (which the existing `damage-flash` element already covers).
 */
export function hudSplatterIntensity(playerHealth: number): number {
  if (playerHealth >= SPLATTER_HEALTH_THRESHOLD) {
    return 0
  }
  const t = (SPLATTER_HEALTH_THRESHOLD - playerHealth) / SPLATTER_HEALTH_THRESHOLD
  return clamp01(t) * SPLATTER_PEAK_INTENSITY
}
