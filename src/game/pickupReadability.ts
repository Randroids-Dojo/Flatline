/**
 * Pure visual-feel helpers for the central supply pickup. Pickups are mostly
 * grayscale-friendly accents, so they need motion + glow to read against the
 * floor. See `docs/gdd/36-pickup-readability.md`.
 *
 * `elapsedMs` is run-clock time. The functions are deterministic, allocation
 * free, and safe to call every frame from the React/Three render loop.
 *
 * `ready` is true when the pickup can be collected (active prompt). When
 * false, the pickup is on cooldown after a recent collection: it should
 * still wiggle, but more subdued, so the player can find the spot without
 * thinking the pickup is about to grant resources.
 */

const READY_BOUNCE_AMPLITUDE_M = 0.08
const COOLDOWN_BOUNCE_AMPLITUDE_M = 0.025
const READY_BOUNCE_PERIOD_MS = 1100
const COOLDOWN_BOUNCE_PERIOD_MS = 1700

const READY_GLOW_BASE = 0.55
const READY_GLOW_PEAK = 1
const COOLDOWN_GLOW_BASE = 0.05
const COOLDOWN_GLOW_PEAK = 0.18

const HALO_PERIOD_MS = 1400
const HALO_MIN_SCALE = 1
const HALO_MAX_SCALE = 1.45
const HALO_READY_PEAK_OPACITY = 0.55
const HALO_COOLDOWN_PEAK_OPACITY = 0.12

/**
 * Vertical bounce offset in meters. Positive = above resting position.
 * Smooth sin wave. Amplitude collapses on cooldown so the pickup still
 * tells the player where it is without faking readiness.
 */
export function pickupBounceY(elapsedMs: number, ready: boolean): number {
  const amplitude = ready ? READY_BOUNCE_AMPLITUDE_M : COOLDOWN_BOUNCE_AMPLITUDE_M
  const period = ready ? READY_BOUNCE_PERIOD_MS : COOLDOWN_BOUNCE_PERIOD_MS
  const phase = (elapsedMs / period) * Math.PI * 2
  return Math.sin(phase) * amplitude
}

/**
 * Emissive intensity scalar for the pickup material. Pulses between a
 * baseline and a peak so the surface "breathes" rather than blinking.
 * On cooldown the entire range is much dimmer, so a depleted pickup is
 * visibly off.
 */
export function pickupGlowIntensity(elapsedMs: number, ready: boolean): number {
  const base = ready ? READY_GLOW_BASE : COOLDOWN_GLOW_BASE
  const peak = ready ? READY_GLOW_PEAK : COOLDOWN_GLOW_PEAK
  const phase = (elapsedMs / READY_BOUNCE_PERIOD_MS) * Math.PI * 2
  // (sin + 1) / 2 maps to [0, 1]; lerp between base and peak.
  const eased = (Math.sin(phase) + 1) / 2
  return base + (peak - base) * eased
}

/**
 * Outward-expanding halo ring scale. Sweeps from 1 to a peak then snaps
 * back, faster than the bounce so the halo reads as an "I am here" pulse.
 */
export function pickupHaloScale(elapsedMs: number): number {
  const cyclePhase = (elapsedMs % HALO_PERIOD_MS) / HALO_PERIOD_MS
  return HALO_MIN_SCALE + (HALO_MAX_SCALE - HALO_MIN_SCALE) * cyclePhase
}

/**
 * Outward-expanding halo ring opacity. Fades out across the cycle so the
 * ring reads as an outward pulse. Peak opacity is much lower on cooldown.
 */
export function pickupHaloOpacity(elapsedMs: number, ready: boolean): number {
  const peak = ready ? HALO_READY_PEAK_OPACITY : HALO_COOLDOWN_PEAK_OPACITY
  const cyclePhase = (elapsedMs % HALO_PERIOD_MS) / HALO_PERIOD_MS
  // Fade from peak to 0 across the cycle.
  return peak * (1 - cyclePhase)
}
