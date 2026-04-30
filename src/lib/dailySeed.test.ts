import { describe, expect, it } from 'vitest'
import { dailySeed } from './dailySeed'

describe('dailySeed', () => {
  it('uses the UTC calendar day', () => {
    expect(dailySeed(new Date('2026-04-30T23:59:59Z'))).toBe('flatline-20260430')
    expect(dailySeed(new Date('2026-05-01T00:00:00Z'))).toBe('flatline-20260501')
  })
})
