# Movement

**Status:** done

Classic Doom-inspired movement, but with modern comfort.

Keyboard:

- WASD: move
- Mouse: aim
- Left click: fire
- Right click: alt fire, later
- Shift: dash, later
- Space: interact or quick shove, later
- R: reload, only if weapon requires reload
- Esc: pause

Movement feel:

- Fast acceleration
- Low friction
- No realistic inertia
- No crouch in MVP
- No jumping in MVP unless a later arena variant needs it

Mobile (early secondary): virtual joystick + look-pad.

### Build log

- 2026-05-05: Removed the `(0, 0)` origin guards from the mobile touch overlay. Real-device report: thumbsticks never appeared on first run; only started rendering after backgrounding and foregrounding the browser. The guards added in the prior 2026-05-05 slice (in `beginTouch` and `JoystickVisual`) were a band-aid for a phantom flash that was only ever reported from PC Chrome with phone-size emulation, never from a real device, and the band-aid evidently rejected legitimate touches on at least one real phone. Reverted both guards: `beginTouch` now claims a joystick at any coordinate, and `JoystickVisual` only checks `joystick.active`. Removed the `mobile (0,0) pointerdown does not activate a joystick` test that asserted the dropped behavior; coverage of touch activation stays in `mobile thumbsticks stay hidden until touched and clear on tab hide` and `mobile touch controls fit the viewport and block page scroll`. Files: `src/components/FlatlineGame.tsx`, `tests/smoke.spec.ts`. PR #TBD. F-005 resolved by this slice.
- 2026-05-05: Added a `(0, 0)` origin guard to the mobile touch overlay. `beginTouch` now returns early when `event.clientX` and `event.clientY` are both zero, and `JoystickVisual` returns null when origin is exactly `(0, 0)`. Real-device report from PC Chrome with phone-size emulation showed a brief move-stick flash anchored at the screen origin during the first interaction with a fresh round; not reproducible from Playwright tap injection across Pixel 5, iPhone 12, iPhone 13 Mini, or narrow Desktop Chrome, so the guard targets the symptom (origin (0,0) = phantom) rather than a confirmed root cause. Tests: appended `mobile (0,0) pointerdown does not activate a joystick` in `tests/smoke.spec.ts`. Files: `src/components/FlatlineGame.tsx`, `tests/smoke.spec.ts`. PR #63.
- 2026-05-05: Mobile thumbsticks now render only while a touch is held and clear themselves when the tab is hidden or loses focus. Dropped the always-on `.touch-zone-label-left` / `.touch-zone-label-right` pills from `TouchControls` in `src/components/FlatlineGame.tsx` and removed the matching `.touch-zone-label*` rules in `app/globals.css`. Added a `releaseAllTouches` helper inside the touch effect that resets both joysticks, zeroes `touchLookVectorRef`, and re-syncs `touchJoysticksView` only when a stick was active; wired it to a new `window.blur` listener, a new `document.visibilitychange` listener, and the existing effect cleanup. Tests: appended a new mobile-only Playwright spec `mobile thumbsticks stay hidden until touched and clear on tab hide` in `tests/smoke.spec.ts`. Background: real-device report from iPhone Safari where two stuck stick visuals stayed visible after a touch sequence, one anchored at the screen origin and one near screen center, presumably from `pointercancel` being stolen by the OS gesture system. PR #63.
- 2026-05-04: Fixed mobile menu touch. Switched the in-game touch handlers in `src/components/FlatlineGame.tsx` from a dual `pointer*` plus `touch*` window-listener model to pointer-events-only, patterned on `../VibeRacer/src/hooks/useTouchControls.ts`. The unconditional `preventDefault()` in the legacy `onTouchEnd` was suppressing browser click synthesis on every tap that landed on a menu button (Start Run, Resume, Submit Score, leaderboard scope toggle), so real phones could not start a run. Pointer handlers now run unconditionally for `pointerType === 'touch'`, bail on `isInteractiveTarget`, and only `preventDefault` when `beginTouch` actually claims a half-screen joystick. Tap-to-fire on the look stick is preserved. Tests: rewrote the synthetic-touch helper in `tests/smoke.spec.ts` to dispatch `PointerEvent` instead of `TouchEvent`, plus added a new mobile-only test `mobile tap on Start run begins the run` that uses Playwright's real `locator.tap()` to catch the regression. PR #TBD.
- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `src/game/movement.ts`, `src/game/virtualJoystick.ts`, plus mobile touch fix landed in PRs #44, #45, #46. Tests: `src/game/movement.test.ts`, `src/game/virtualJoystick.test.ts`.
