# Pickup Readability

**Status:** partial

Because the art is mostly grayscale (Q-001), pickups need help to stand out:

- Pickups bounce
- Pickups glow
- Pickups use bright rim light
- Pickups make a subtle looping sound
- Pickup zones are visually consistent

### Build log

- 2026-05-03: Bounce + glow pulse + halo ring on the central altar pickup. New pure helpers in `src/game/pickupReadability.ts`: `pickupBounceY(elapsedMs, ready)` (sin oscillation, larger amplitude when ready), `pickupGlowIntensity(elapsedMs, ready)` (emissive intensity breathing between a baseline and a peak), `pickupHaloScale(elapsedMs)` (outward expanding ring scale 1 to 1.45), `pickupHaloOpacity(elapsedMs, ready)` (peak then fade across each cycle). `src/components/FlatlineGame.tsx` gives the altar its own `MeshStandardMaterial` (so emissive can pulse without recoloring the clock and furnace), adds an additive-blended `RingGeometry` halo at floor level, exposes `pickup: { altar, halo, restY }` from `createRoom`, and ticks the readability via a new `applyPickupReadability(runtime, time, ready)` helper called every animate frame. Files: `src/game/pickupReadability.ts`, `src/game/pickupReadability.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD. Loop sound is the remaining unaudited cue and is part of REQ-040 (audio).
- 2026-05-03: Split out of `GDD.md`. The accent palette is in place per `docs/gdd/12-art-direction.md`, but bounce / glow / rim-light / loop-sound on pickups have not been individually audited. Status `partial` until each readability cue is verified or explicitly cut.
