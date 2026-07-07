// Deterministic seeded randomness. Every procedural system (dungeon chunks,
// enemy dice rolls, drop tables) draws from one of these so runs are
// reproducible from a single run seed.

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Combine a base seed with arbitrary integer coordinates into a new seed.
export function hashCoords(seed: number, ...coords: number[]): number {
  let h = seed >>> 0
  for (const c of coords) {
    h = Math.imul(h ^ (c + 0x9e3779b9), 2654435761)
    h ^= h >>> 13
  }
  return h >>> 0
}

export function rngInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

// Doom-style dice: count rolls of 1..sides, summed, times multiplier.
export function rollDice(rng: Rng, count: number, sides: number, multiplier = 1): number {
  let total = 0
  for (let i = 0; i < count; i++) {
    total += rngInt(rng, 1, sides)
  }
  return total * multiplier
}
