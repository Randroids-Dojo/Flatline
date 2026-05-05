import { describe, expect, it } from 'vitest'
import { doorOpenCue } from './doorCue'

describe('door open cue', () => {
  it('returns a sawtooth tone for the metallic door-slam timbre', () => {
    expect(doorOpenCue().waveform).toBe('sawtooth')
  })

  it('uses a low pitch that reads as a thunk rather than a beep', () => {
    const cue = doorOpenCue()
    expect(cue.frequency).toBeGreaterThanOrEqual(180)
    expect(cue.frequency).toBeLessThanOrEqual(280)
  })

  it('keeps duration short enough to avoid stacking across rapid spawns', () => {
    expect(doorOpenCue().durationMs).toBeLessThanOrEqual(220)
  })

  it('keeps gain below the loudest player damage cue so damage stays foregrounded', () => {
    expect(doorOpenCue().gain).toBeLessThan(0.05)
  })

  it('keeps gain above the quietest enemy windup cue so the spawn cue is still audible', () => {
    expect(doorOpenCue().gain).toBeGreaterThanOrEqual(0.022)
  })

  it('returns the same cue style on every call', () => {
    const a = doorOpenCue()
    const b = doorOpenCue()
    expect(a).toEqual(b)
  })
})
