# Pickup: Health

**Status:** done

Small health:

- Restores 10
- Common

Large health:

- Restores 35
- Rare
- Usually in dangerous location

### Build log

- 2026-05-09: Split altar heal into the spec's two tiers and gated the large heal behind low health + high pressure + rearm. New pure helper `src/game/healthPickupTier.ts` exposes `healthPickupTier({ playerHealth, pressure, runMs, lastLargeRunMs })` returning `'small' | 'large'`, and `healthPickupAmount(tier)` returning 10 or 35. Large is eligible only when `playerHealth <= 35` AND `pressure >= 2` AND `runMs - lastLargeRunMs >= 60_000`. The arena has a single central altar pickup zone, so "dangerous location" is satisfied by route (the player crosses open ground past spawn doors to reach the altar). The previous flat `+15` heal is replaced; small now restores 10 per spec. Status flips `partial` to `done`. Files: `src/game/healthPickupTier.ts`, `src/game/healthPickupTier.test.ts`, `src/components/FlatlineGame.tsx`. PR #137.
- 2026-05-03: Split out of `GDD.md`. The archived coverage ledger does not list a dedicated health-pickup module; pickups are currently scattered through `src/components/FlatlineGame.tsx`. Status `partial` until small-vs-large health values, spawn cadence, and risk-reward placement are individually verified.
