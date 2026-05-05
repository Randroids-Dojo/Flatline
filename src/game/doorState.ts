/**
 * Door state machine for the four cardinal spawn doors.
 *
 * Pre-existing behavior used a single 950 ms post-spawn pulse with a
 * sin-driven opacity. That conveyed "this door just spawned an enemy"
 * but did not communicate the full life cycle the GDD calls for in
 * `docs/gdd/47-arena-mutations.md` (door phase) and
 * `docs/gdd/59-post-mvp-room-v1.md` (door states: closed, warning,
 * open, cooling down). This helper splits the post-spawn window into
 * three distinct visual phases the player can read at a glance:
 *
 * - `opening`: short bright burst on the spawn frame so the eye snaps
 *   to the door that just produced an enemy. Brightest opacity, peak
 *   vertical scale, color shifted toward the danger accent.
 * - `open`: steady glow while the freshly spawned enemy is still in
 *   the threshold. Mid opacity, sustained scale.
 * - `cooling`: linear fade back to the closed baseline. Opacity drops
 *   from `open` toward 0; scale eases back to the rest pose.
 *
 * `idle` is the default closed state when no spawn has happened in
 * `DOOR_TOTAL_MS`. Visuals match the prior "closed" baseline.
 *
 * `elapsedMs` is the time *since the spawn fired*, not since run
 * start. It must be non-negative; values >= `DOOR_TOTAL_MS` resolve
 * to `idle`.
 */

export type DoorPhase = 'idle' | 'opening' | 'open' | 'cooling'

export type DoorVisual = {
  /** Material opacity, in [0, 1]. */
  opacity: number
  /** Signal mesh vertical scale. The closed baseline is 0.58. */
  scaleY: number
  /** Color the signal should drift toward in this phase. */
  color: string
}

export const DOOR_OPENING_MS = 150
export const DOOR_OPEN_MS = 600
export const DOOR_COOLING_MS = 350
export const DOOR_TOTAL_MS = DOOR_OPENING_MS + DOOR_OPEN_MS + DOOR_COOLING_MS

const IDLE_OPACITY = 0.08
const IDLE_SCALE_Y = 0.58
const IDLE_COLOR = '#50d1c0'

const OPENING_PEAK_OPACITY = 0.78
const OPENING_PEAK_SCALE_Y = 0.96
const OPENING_COLOR = '#f8f1d6'

const OPEN_OPACITY = 0.46
const OPEN_SCALE_Y = 0.84
const OPEN_COLOR = '#f0c668'

const COOLING_COLOR = '#7ad6c8'

/**
 * Resolve which phase a door is in, given how long ago it spawned an
 * enemy. Negative inputs are treated as 0; inputs at or beyond
 * `DOOR_TOTAL_MS` are `idle`.
 */
export function doorPhaseAtElapsedMs(elapsedSinceSpawnMs: number): DoorPhase {
  if (!Number.isFinite(elapsedSinceSpawnMs) || elapsedSinceSpawnMs >= DOOR_TOTAL_MS) {
    return 'idle'
  }

  const t = Math.max(0, elapsedSinceSpawnMs)

  if (t < DOOR_OPENING_MS) {
    return 'opening'
  }

  if (t < DOOR_OPENING_MS + DOOR_OPEN_MS) {
    return 'open'
  }

  return 'cooling'
}

/**
 * Continuous visual style for the door signal mesh. The opening burst
 * uses a half-sine envelope so the peak lands mid-burst rather than
 * snapping on at the start. The cooling phase eases linearly back to
 * the idle baseline.
 */
export function doorPhaseVisualAtElapsedMs(elapsedSinceSpawnMs: number): DoorVisual {
  const phase = doorPhaseAtElapsedMs(elapsedSinceSpawnMs)
  const t = Math.max(0, elapsedSinceSpawnMs)

  if (phase === 'idle') {
    return { opacity: IDLE_OPACITY, scaleY: IDLE_SCALE_Y, color: IDLE_COLOR }
  }

  if (phase === 'opening') {
    // Half-sine envelope: 0 -> peak -> 0 across the opening window.
    // The actual rendered values clamp at the open-phase floor so the
    // door does not appear to dip below the steady-glow baseline at
    // the end of the burst.
    const burst = Math.sin((t / DOOR_OPENING_MS) * Math.PI)
    const opacity = OPEN_OPACITY + (OPENING_PEAK_OPACITY - OPEN_OPACITY) * burst
    const scaleY = OPEN_SCALE_Y + (OPENING_PEAK_SCALE_Y - OPEN_SCALE_Y) * burst
    return { opacity, scaleY, color: OPENING_COLOR }
  }

  if (phase === 'open') {
    return { opacity: OPEN_OPACITY, scaleY: OPEN_SCALE_Y, color: OPEN_COLOR }
  }

  // cooling: linear fade from open baseline to idle baseline.
  const coolingStart = DOOR_OPENING_MS + DOOR_OPEN_MS
  const coolingT = Math.min(1, Math.max(0, (t - coolingStart) / DOOR_COOLING_MS))
  const opacity = OPEN_OPACITY + (IDLE_OPACITY - OPEN_OPACITY) * coolingT
  const scaleY = OPEN_SCALE_Y + (IDLE_SCALE_Y - OPEN_SCALE_Y) * coolingT
  return { opacity, scaleY, color: COOLING_COLOR }
}
