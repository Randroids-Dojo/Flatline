# Pickup Readability

**Status:** done

Because the art is mostly grayscale (Q-001), pickups need help to stand out:

- Pickups bounce
- Pickups glow
- Pickups use bright rim light
- Pickups make a subtle looping sound
- Pickup zones are visually consistent

### Build log

- 2026-05-09: Subtle looping audio cue on the central altar pickup, closing the last unaudited readability item. New pure helper `src/game/pickupLoopCue.ts` exposes `pickupLoopStyle()` (110 Hz sine, 0.6 Hz breath, breath depth 0.55, base gain 0.012, cooldown gain 0) and `pickupLoopGain(style, elapsedMs, ready)` returning a target gain that sits at 0 during cooldown and breathes around `baseGain` while supplies are ready. Base gain stays below the loudest enemy windup cue (0.038) so combat audio stays in front. `src/components/FlatlineGame.tsx` adds a `pickupLoopLayerRef` (long-lived `AudioContext` + `OscillatorNode` + master `GainNode`) started in `startRun` when audio is on, stopped in `startRun` (re-armed), `finishRun`, and the unmount cleanup, mirroring the `musicLayerRef` lifecycle. Per-frame the animate loop ramps `masterGain.gain.setTargetAtTime(target, ..., 0.18)` next to `applyPickupReadability` so the audio breath stays phase-locked to the visual breath. Files: `src/game/pickupLoopCue.ts`, `src/game/pickupLoopCue.test.ts`, `src/components/FlatlineGame.tsx`. Status flips `partial` to `done`. PR #TBD.
- 2026-05-03: Bounce + glow pulse + halo ring on the central altar pickup. New pure helpers in `src/game/pickupReadability.ts`: `pickupBounceY(elapsedMs, ready)` (sin oscillation, larger amplitude when ready), `pickupGlowIntensity(elapsedMs, ready)` (emissive intensity breathing between a baseline and a peak), `pickupHaloScale(elapsedMs)` (outward expanding ring scale 1 to 1.45), `pickupHaloOpacity(elapsedMs, ready)` (peak then fade across each cycle). `src/components/FlatlineGame.tsx` gives the altar its own `MeshStandardMaterial` (so emissive can pulse without recoloring the clock and furnace), adds an additive-blended `RingGeometry` halo at floor level, exposes `pickup: { altar, halo, restY }` from `createRoom`, and ticks the readability via a new `applyPickupReadability(runtime, time, ready)` helper called every animate frame. Files: `src/game/pickupReadability.ts`, `src/game/pickupReadability.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD. Loop sound is the remaining unaudited cue and is part of REQ-040 (audio).
- 2026-05-03: Split out of `GDD.md`. The accent palette is in place per `docs/gdd/12-art-direction.md`, but bounce / glow / rim-light / loop-sound on pickups have not been individually audited. Status `partial` until each readability cue is verified or explicitly cut.
