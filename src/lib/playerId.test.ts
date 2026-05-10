import { describe, expect, it, vi } from 'vitest'
import { ensurePlayerId, isValidPlayerId, playerIdStorageKey, readPlayerId } from './playerId'

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
    clear: () => {
      data.clear()
    },
    key: (index) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size
    }
  }
}

const FIXTURE_ID = '11111111-2222-3333-4444-555555555555'
const ALT_FIXTURE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

describe('isValidPlayerId', () => {
  it('accepts a v4-shaped uuid', () => {
    expect(isValidPlayerId(FIXTURE_ID)).toBe(true)
  })

  it('rejects strings that do not match the uuid shape', () => {
    expect(isValidPlayerId('not-a-uuid')).toBe(false)
    expect(isValidPlayerId('')).toBe(false)
    expect(isValidPlayerId(FIXTURE_ID + 'x')).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isValidPlayerId(null)).toBe(false)
    expect(isValidPlayerId(undefined)).toBe(false)
    expect(isValidPlayerId(123)).toBe(false)
  })
})

describe('ensurePlayerId', () => {
  it('generates and persists a new id when storage is empty', () => {
    const storage = memoryStorage()
    const newId = vi.fn(() => FIXTURE_ID)
    expect(ensurePlayerId(storage, newId)).toBe(FIXTURE_ID)
    expect(newId).toHaveBeenCalledTimes(1)
    expect(storage.getItem(playerIdStorageKey)).toBe(FIXTURE_ID)
  })

  it('returns the existing id without regenerating on subsequent calls', () => {
    const storage = memoryStorage()
    const newId = vi.fn(() => ALT_FIXTURE_ID)
    storage.setItem(playerIdStorageKey, FIXTURE_ID)
    expect(ensurePlayerId(storage, newId)).toBe(FIXTURE_ID)
    expect(newId).not.toHaveBeenCalled()
  })

  it('regenerates and overwrites when the stored value is malformed', () => {
    const storage = memoryStorage()
    storage.setItem(playerIdStorageKey, 'not-a-uuid')
    expect(ensurePlayerId(storage, () => FIXTURE_ID)).toBe(FIXTURE_ID)
    expect(storage.getItem(playerIdStorageKey)).toBe(FIXTURE_ID)
  })

  it('returns the generated id even when setItem throws (locked storage)', () => {
    const storage: Storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0
    }
    expect(ensurePlayerId(storage, () => FIXTURE_ID)).toBe(FIXTURE_ID)
  })
})

describe('readPlayerId', () => {
  it('returns null when storage is empty', () => {
    expect(readPlayerId(memoryStorage())).toBeNull()
  })

  it('returns the stored id when valid', () => {
    const storage = memoryStorage()
    storage.setItem(playerIdStorageKey, FIXTURE_ID)
    expect(readPlayerId(storage)).toBe(FIXTURE_ID)
  })

  it('returns null when storage holds a non-uuid value', () => {
    const storage = memoryStorage()
    storage.setItem(playerIdStorageKey, 'not-a-uuid')
    expect(readPlayerId(storage)).toBeNull()
  })

  it('returns null when getItem throws', () => {
    const storage: Storage = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0
    }
    expect(readPlayerId(storage)).toBeNull()
  })
})
