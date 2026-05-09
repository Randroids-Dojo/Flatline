import { describe, expect, it } from 'vitest'
import { weaponFireCue } from './weaponFireCue'

describe('weaponFireCue', () => {
  const weapons = ['peashooter', 'boomstick', 'inkblaster'] as const

  it('returns positive frequency, duration, and gain for every weapon', () => {
    for (const weapon of weapons) {
      const cue = weaponFireCue(weapon)
      expect(cue.frequencyStart).toBeGreaterThan(0)
      expect(cue.frequencyEnd).toBeGreaterThan(0)
      expect(cue.durationMs).toBeGreaterThan(0)
      expect(cue.gain).toBeGreaterThan(0)
    }
  })

  it('drops in pitch (start above end) so each shot reads as a snap, not a hold', () => {
    for (const weapon of weapons) {
      const cue = weaponFireCue(weapon)
      expect(cue.frequencyStart).toBeGreaterThan(cue.frequencyEnd)
    }
  })

  it('uses different waveforms across weapons so the timbre matches the silhouette', () => {
    const waveforms = new Set(weapons.map((weapon) => weaponFireCue(weapon).waveform))
    expect(waveforms.size).toBe(3)
  })

  it('makes the boomstick the heaviest shot (lowest pitch, longest, loudest)', () => {
    const boomstick = weaponFireCue('boomstick')
    const peashooter = weaponFireCue('peashooter')
    expect(boomstick.frequencyStart).toBeLessThan(peashooter.frequencyStart)
    expect(boomstick.durationMs).toBeGreaterThan(peashooter.durationMs)
    expect(boomstick.gain).toBeGreaterThan(peashooter.gain)
  })

  it('keeps the peashooter the quietest because it fires the most often', () => {
    const peashooter = weaponFireCue('peashooter')
    const inkblaster = weaponFireCue('inkblaster')
    expect(peashooter.gain).toBeLessThan(inkblaster.gain)
  })

  it('keeps every gain at or below the loudest player damage cue (0.05)', () => {
    for (const weapon of weapons) {
      expect(weaponFireCue(weapon).gain).toBeLessThanOrEqual(0.05)
    }
  })

  it('returns stable references for the same weapon', () => {
    expect(weaponFireCue('boomstick')).toBe(weaponFireCue('boomstick'))
    expect(weaponFireCue('peashooter')).toBe(weaponFireCue('peashooter'))
  })

  it('defaults unknown weapons to the peashooter style', () => {
    const peashooter = weaponFireCue('peashooter')
    const unknown = weaponFireCue('unknown' as 'peashooter')
    expect(unknown).toBe(peashooter)
  })
})
