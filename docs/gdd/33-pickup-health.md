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

- 2026-05-13: Doom-style medkit drops on enemy kill. Until now the only way to heal was the central altar; players who could not retreat to the room center had no path to recover. New pure helper `src/game/healthDrop.ts` exposes two kinds (`medkit-small` and `medkit-large`) matching the altar's tier amounts (`+10` / `+35` HP). Drop chance is intentionally low (every per-enemy total stays under 0.16) so medkits remain a rare reward; only the brute drops the large medkit (`0.05` chance). `rollHealthDrop(type, rng)` returns the drop or `null`; `healthDropPalette(kind)` returns a cream body + red cross + warm glow palette so the medkit silhouette reads at a glance even under the darkness lighting phase; `healthDropBobY(age)` is a slower 0.9 Hz sin so the box reads as heavier than an ammo box. `src/components/FlatlineGame.tsx` adds a `HealthDropEntry` group (body box + crossbar + crosspost + floor halo `RingGeometry`) and wires spawn-on-kill alongside the existing ammo drop, per-frame tick with TTL fade and halo pulse (no Y-axis spin since a rotating cross reads as unstable), per-frame pickup check that clamps via `effectiveMaxHp(walletRef.current.tiers)`. New pickup cue style `'medkit'` (720 / 1080 Hz sine, 220 ms total, gain 0.045). Cleanup hooked into run reset, finish, and unmount paths. Files: `src/game/healthDrop.ts`, `src/game/healthDrop.test.ts`, `src/game/pickupCue.ts`, `src/components/FlatlineGame.tsx`. PR #pending. Status stays `done` (existing altar tier behavior unchanged; this slice adds visible drops alongside).
- 2026-05-09: Split altar heal into the spec's two tiers and gated the large heal behind low health + high pressure + rearm. New pure helper `src/game/healthPickupTier.ts` exposes `healthPickupTier({ playerHealth, pressure, runMs, lastLargeRunMs })` returning `'small' | 'large'`, and `healthPickupAmount(tier)` returning 10 or 35. Large is eligible only when `playerHealth <= 35` AND `pressure >= 2` AND `runMs - lastLargeRunMs >= 60_000`. The arena has a single central altar pickup zone, so "dangerous location" is satisfied by route (the player crosses open ground past spawn doors to reach the altar). The previous flat `+15` heal is replaced; small now restores 10 per spec. Status flips `partial` to `done`. Files: `src/game/healthPickupTier.ts`, `src/game/healthPickupTier.test.ts`, `src/components/FlatlineGame.tsx`. PR #137.
- 2026-05-03: Split out of `GDD.md`. The archived coverage ledger does not list a dedicated health-pickup module; pickups are currently scattered through `src/components/FlatlineGame.tsx`. Status `partial` until small-vs-large health values, spawn cadence, and risk-reward placement are individually verified.
