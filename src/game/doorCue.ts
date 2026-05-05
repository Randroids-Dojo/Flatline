/**
 * Audio sting for door spawn events.
 *
 * The required-SFX list in `docs/gdd/40-audio.md` calls for a "Door
 * spawn cue" so the player can hear which direction an enemy is
 * appearing from, even when their gaze is across the room. Until
 * this slice the door spawn was visual-only.
 *
 * The cue is a single short metallic-feeling thunk: a sawtooth tone
 * at a low pitch with a tight envelope. Sawtooth is chosen because
 * the existing audio palette already uses sine for pickup and
 * skitter windup, square for grunt windup and player damage, and
 * triangle for hazard ink-pool ticks; sawtooth is the next distinct
 * timbre and reads as a heavy mechanical hit rather than a
 * synthetic blip.
 *
 * `frequency` is the oscillator pitch in Hz. 220 Hz is low enough
 * to read as a "door slam" rather than a "beep" but high enough to
 * cut through ambient combat audio.
 * `waveform` is `'sawtooth'` for the reasons above.
 * `durationMs` is the total tone hold; 180 ms is short enough that
 * back-to-back spawns from different doors do not stack into a
 * sustained chord, and long enough that the envelope's exponential
 * decay reads as a thunk rather than a click.
 * `gain` is the oscillator amplitude. 0.034 sits below the loudest
 * player damage cue (0.05) and brute windup cue (0.038) so a door
 * spawn never dominates a damage frame, but above the quieter
 * skitter windup (0.022) so the player still notices it across the
 * room.
 */

export type DoorCueStyle = {
  frequency: number
  waveform: OscillatorType
  durationMs: number
  gain: number
}

const openCue: DoorCueStyle = {
  frequency: 220,
  waveform: 'sawtooth',
  durationMs: 180,
  gain: 0.034
}

export function doorOpenCue(): DoorCueStyle {
  return openCue
}
