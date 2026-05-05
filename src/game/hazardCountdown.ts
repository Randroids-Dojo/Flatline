import { hazardCycleConfigs, type HazardCycleConfig, type HazardKind } from './hazards'

/**
 * Audio countdown click that plays during a hazard's warning phase.
 *
 * Because the art is mostly grayscale (Q-001), audio has to replace some
 * color cues. The required-SFX list and the audio-readability section in
 * `docs/gdd/40-audio.md` call for a "hazard countdown click." The click is
 * an evenly spaced tick across the warning phase, with the final tick
 * landing right before the hazard activates so the player hears
 * "tick... tick... tick... DING" and knows when to clear the area.
 *
 * `frequency` is the oscillator pitch in Hz for non-final ticks.
 * `finalFrequency` is the oscillator pitch for the last tick in the
 * countdown so the player can hear "this is the moment of impact."
 * `waveform` is the OscillatorNode type. Different waveforms keep two
 * overlapping countdowns (for example flame lane + ink pool) distinguishable.
 * `durationMs` is how long each tick stays on. Ticks are short stingers
 * so the cue is unambiguously a click, not a drone.
 * `gain` is the oscillator amplitude for non-final ticks.
 * `finalGain` is the amplitude for the last tick. Slightly louder so the
 * activation moment cuts through other SFX.
 *
 * Tuning intent:
 *   - flameLane:    bright square click, mid-low pitch. Sits below the
 *     grunt windup so countdown and combat cues stay separable.
 *   - inkPool:      dull triangle click, low pitch. Triangle waveform
 *     stays distinct from the existing damage/windup cue palette.
 *   - fallingLight: high sine click. Reads as something dropping from
 *     above; pitch sits well above the other two countdowns so a
 *     stacked warning never collapses into a single tone.
 */
export type HazardCountdownStyle = {
  frequency: number
  finalFrequency: number
  waveform: OscillatorType
  durationMs: number
  gain: number
  finalGain: number
}

const flameLaneStyle: HazardCountdownStyle = {
  frequency: 440,
  finalFrequency: 660,
  waveform: 'square',
  durationMs: 60,
  gain: 0.024,
  finalGain: 0.04
}

const inkPoolStyle: HazardCountdownStyle = {
  frequency: 300,
  finalFrequency: 460,
  waveform: 'triangle',
  durationMs: 70,
  gain: 0.024,
  finalGain: 0.04
}

const fallingLightStyle: HazardCountdownStyle = {
  frequency: 720,
  finalFrequency: 1040,
  waveform: 'sine',
  durationMs: 55,
  gain: 0.022,
  finalGain: 0.038
}

export function hazardCountdownCue(kind: HazardKind): HazardCountdownStyle {
  switch (kind) {
    case 'inkPool':
      return inkPoolStyle
    case 'fallingLight':
      return fallingLightStyle
    case 'flameLane':
    default:
      return flameLaneStyle
  }
}

/**
 * One countdown tick that fires on a single frame.
 * `ordinal` is 1-indexed within the warning cycle.
 * `total` is how many ticks the warning phase produces in total.
 * `isFinal` is true on the last tick (when ordinal === total). The caller
 * uses the flag to pitch the activation moment up.
 */
export type HazardCountdownTick = {
  kind: HazardKind
  ordinal: number
  total: number
  isFinal: boolean
}

const minTickGapMs = 350
const finalTickLeadMs = 80

/**
 * Returns the tick offsets (ms from warning-phase start) that should fire
 * during a single warning cycle for the given hazard. The number of ticks
 * scales with warning length so a 2400 ms warning gets enough ticks to
 * read as a countdown without overlapping itself, and a 1800 ms warning
 * stays sparse enough to not feel rushed.
 *
 * The last offset is placed `finalTickLeadMs` ms before activation so the
 * "DING" lands on top of the visible activation cue.
 */
export function hazardCountdownTickOffsets(kind: HazardKind): readonly number[] {
  const config = configForKind(kind)
  const usableMs = Math.max(0, config.warningMs - finalTickLeadMs)
  const tickCount = Math.max(2, Math.floor(usableMs / minTickGapMs) + 1)
  const offsets: number[] = []

  for (let i = 0; i < tickCount; i += 1) {
    const fraction = tickCount === 1 ? 0 : i / (tickCount - 1)
    offsets.push(fraction * usableMs)
  }

  return offsets
}

/**
 * Returns the countdown ticks that crossed the prev->current run-time
 * window for the given hazard. Empty array means no tick fired this
 * frame. The function is pure and safe to call every frame.
 *
 * The half-open interval is `(prevRunMs, currentRunMs]` so a tick on the
 * exact frame boundary fires exactly once.
 */
export function hazardCountdownTicksBetween(
  kind: HazardKind,
  prevRunMs: number,
  currentRunMs: number
): HazardCountdownTick[] {
  if (currentRunMs <= prevRunMs) {
    return []
  }

  const config = configForKind(kind)
  const offsets = hazardCountdownTickOffsets(kind)
  const total = offsets.length
  const events: HazardCountdownTick[] = []

  // The window can span at most one cycle in normal frame deltas, but be
  // robust to long pauses or large catch-up steps by walking each cycle
  // the window touches.
  const startCycleIndex = Math.floor((prevRunMs + config.offsetMs) / config.cycleMs)
  const endCycleIndex = Math.floor((currentRunMs + config.offsetMs) / config.cycleMs)

  for (let cycleIndex = startCycleIndex; cycleIndex <= endCycleIndex; cycleIndex += 1) {
    const cycleStartRunMs = cycleIndex * config.cycleMs - config.offsetMs

    for (let i = 0; i < total; i += 1) {
      const tickRunMs = cycleStartRunMs + offsets[i]

      if (tickRunMs > prevRunMs && tickRunMs <= currentRunMs) {
        events.push({
          kind,
          ordinal: i + 1,
          total,
          isFinal: i === total - 1
        })
      }
    }
  }

  return events
}

function configForKind(kind: HazardKind): HazardCycleConfig {
  const config = hazardCycleConfigs.find((entry) => entry.kind === kind)

  if (!config) {
    throw new Error(`Unknown hazard kind: ${kind}`)
  }

  return config
}
