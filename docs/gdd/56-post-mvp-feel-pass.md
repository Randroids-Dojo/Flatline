# Post-MVP: Feel Pass

**Status:** partial

Fix the verbs before adding breadth:

- WASD must always match the camera direction.
- Every shot needs readable feedback: muzzle flash, visible bolt or tracer, hit flash, miss feedback, and audio.
- The first enemy should be centered in the starting view so the player can shoot within the first second.
- Movement should feel fast but controllable around pillars.
- The player should understand enemy damage range without reading text.

Done when a fresh player can start a run, move, shoot, kill the first enemy, and understand what happened without instruction.

### Build log

- 2026-05-03: Enemy hurt flash now lerps the billboard material toward white (or a warm tone for the brute) on every damage event so the player gets an unmissable hit-confirm read in addition to the existing health bar / status line. Per-enemy-type curves (peakIntensity / hold / decay) live in pure helper `src/game/enemyHurtFlash.ts`. Files: `src/game/enemyHurtFlash.ts`, `src/game/enemyHurtFlash.test.ts`, `src/components/FlatlineGame.tsx`. PR #TBD.
- 2026-05-03: Weapon recoil sprite kick added so every fire physically moves the foreground gun, not just the muzzle flash and bolt. Per-weapon kick / rotation / duration live in pure helper `src/game/weaponRecoil.ts`. CSS keyframes drive a translateY + rotate animation through CSS custom properties on the weapon element; the element key is bumped on every shot via a fire counter so consecutive shots retrigger cleanly. Files: `src/game/weaponRecoil.ts`, `src/game/weaponRecoil.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #51.
- 2026-05-03: Foreground muzzle flash overlay pops on every fire so the gun visually punctuates each shot, not just the world-space bolt. Per-weapon style (color, scale, duration) lives in a pure helper `src/game/muzzleFlashStyle`. Peashooter and boomstick use warm gold; inkblaster uses teal. CSS animation is 110 to 150 ms with a screen blend mode so it reads against any wall. Files: `src/game/muzzleFlash.ts`, `src/game/muzzleFlash.test.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #TBD.
- 2026-05-03: Per-shot impact bursts spawn at the bolt's terminal point: red ring on hit, teal ring on miss. Each burst expands and fades over 160 to 220 ms. Capped at 12 concurrent rings, cleared on run reset and unmount. Files: `src/components/FlatlineGame.tsx`. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Movement, shooting, and the kill-first-enemy flow ship pre-spiral. Per-shot readable feedback (tracer / hit flash / miss feedback / audio) has not been individually audited; status `partial` until that audit runs against `docs/PLAYTEST.md` "First 90 seconds" and "Core loop fun" sections.
