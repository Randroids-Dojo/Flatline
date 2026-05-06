export const RAGE_DURATION_MS = 10_000
export const RAGE_DAMAGE_MULTIPLIER = 1.5
export const RAGE_SPEED_MULTIPLIER = 1.3
export const RAGE_FIRE_RATE_MULTIPLIER = 1.5
export const RAGE_TINT_PEAK_OPACITY = 0.35
export const RAGE_FADE_IN_MS = 220
export const RAGE_FADE_OUT_MS = 600
export const RAGE_PULSE_PERIOD_MS = 540

export type RageBuffState = {
  startMs: number
}

export type RageMultipliers = {
  damage: number
  speed: number
  fireRate: number
}

const inactiveMultipliers: RageMultipliers = { damage: 1, speed: 1, fireRate: 1 }

export function rageBuffActive(state: RageBuffState | null, nowMs: number): boolean {
  if (state === null) {
    return false
  }

  const elapsed = nowMs - state.startMs
  return elapsed >= 0 && elapsed < RAGE_DURATION_MS
}

export function rageBuffRemainingMs(state: RageBuffState | null, nowMs: number): number {
  if (state === null) {
    return 0
  }

  return Math.max(0, RAGE_DURATION_MS - (nowMs - state.startMs))
}

export function rageMultipliers(state: RageBuffState | null, nowMs: number): RageMultipliers {
  if (!rageBuffActive(state, nowMs)) {
    return inactiveMultipliers
  }

  return {
    damage: RAGE_DAMAGE_MULTIPLIER,
    speed: RAGE_SPEED_MULTIPLIER,
    fireRate: RAGE_FIRE_RATE_MULTIPLIER
  }
}

// 0 outside the active window. Inside the window: ramps up over
// RAGE_FADE_IN_MS, holds at peak (with a low-frequency pulse), then
// ramps down over RAGE_FADE_OUT_MS at the end. Peak amplitude is
// RAGE_TINT_PEAK_OPACITY; the pulse modulates between roughly 80% and
// 100% of the peak so the tint reads as alive without drawing the eye
// off the gameplay.
export function rageTintOpacity(state: RageBuffState | null, nowMs: number): number {
  if (state === null) {
    return 0
  }

  const elapsed = nowMs - state.startMs

  if (elapsed < 0 || elapsed >= RAGE_DURATION_MS) {
    return 0
  }

  let envelope = 1

  if (elapsed < RAGE_FADE_IN_MS) {
    envelope = elapsed / RAGE_FADE_IN_MS
  } else if (elapsed > RAGE_DURATION_MS - RAGE_FADE_OUT_MS) {
    envelope = (RAGE_DURATION_MS - elapsed) / RAGE_FADE_OUT_MS
  }

  const pulse = 0.9 + 0.1 * Math.sin((elapsed * 2 * Math.PI) / RAGE_PULSE_PERIOD_MS)

  return RAGE_TINT_PEAK_OPACITY * envelope * pulse
}
