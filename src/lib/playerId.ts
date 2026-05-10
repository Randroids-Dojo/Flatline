// Stable per-device player identifier for cross-device progression
// sync. Generated lazily on first read and persisted to localStorage so
// the same browser keeps the same id across runs. The id is opaque (a
// v4 UUID); it does not authenticate the player. Anti-abuse on the
// server side relies on the highest-water-mark merge in
// sharedUpgradeWallet.ts, plus the IP-keyed rate limit on the route.

export const playerIdStorageKey = 'flatline.playerId.v1'

const PLAYER_ID_REGEX = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/

export function isValidPlayerId(value: unknown): value is string {
  return typeof value === 'string' && PLAYER_ID_REGEX.test(value)
}

export function ensurePlayerId(
  storage: Storage,
  newId: () => string = defaultRandomUuid
): string {
  const existing = readPlayerId(storage)
  if (existing) {
    return existing
  }
  const generated = newId()
  try {
    storage.setItem(playerIdStorageKey, generated)
  } catch {
    // QuotaExceededError or SecurityError on locked-down browsers.
    // We still return the generated id so the in-memory session can
    // sync; it just will not persist across page loads.
  }
  return generated
}

export function readPlayerId(storage: Storage): string | null {
  try {
    const raw = storage.getItem(playerIdStorageKey)
    return isValidPlayerId(raw) ? raw : null
  } catch {
    return null
  }
}

function defaultRandomUuid(): string {
  // crypto.randomUUID is supported on every browser this game targets
  // (per AGENTS.md: desktop web modern). The injected `newId` parameter
  // on `ensurePlayerId` exists so tests can produce deterministic ids.
  return crypto.randomUUID()
}
