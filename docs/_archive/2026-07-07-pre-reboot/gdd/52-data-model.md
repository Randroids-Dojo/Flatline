# Data Model

**Status:** done

## Run submission

```ts
type RunSubmission = {
  playerInitials: string
  score: number
  survivalMs: number
  kills: number
  accuracy: number
  bestCombo: number
  arenaSlug: string
  seed: string
  clientVersion: string
  createdAt: string
}
```

## Leaderboard entry

```ts
type LeaderboardEntry = {
  rank: number
  playerInitials: string
  score: number
  survivalMs: number
  kills: number
  accuracy: number
  bestCombo: number
  createdAt: string
}
```

## Arena config

```ts
type ArenaConfig = {
  slug: string
  name: string
  seed: string
  roomLayout: RoomLayout
  spawnDoors: SpawnDoorConfig[]
  pickupZones: PickupZoneConfig[]
  hazardSchedule: HazardConfig[]
  lightingPreset: LightingPreset
}
```

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: zod schemas land alongside `src/lib/sharedLeaderboard.ts` and `app/api/leaderboard/route.ts`. Tests: `tests/api.leaderboard.test.ts`, `src/lib/sharedLeaderboard.test.ts`.
