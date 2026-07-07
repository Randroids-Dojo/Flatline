# HUD and mugshot

**Status:** done

A Doom status bar across the bottom: current ammo, health percent, weapon slot indicators 1 to 7 (owned lit, current inverted) with the weapon name, the mugshot, armor percent, run cheddar, and blocks out (ring), plus a [KEY] tag when carrying a vault key.

The mugshot is the detective's face with Doom's behavior: five health tiers at 80/60/40/20 percent get progressively more battered (bent whiskers, bandage, black eye, dazed stars), idle eyes glance randomly, damage shows a pain face for 0.7s, pickups flash a grin, and death shows X eyes.

Overlays: center crosshair, damage flash (dark ink vignette scaled by Doom's damagecount decay), brief paper-white pickup flash, weapon viewmodel canvas with the Doom bob formula (speed-squared amplitude, frozen while firing).

### Build log

- 2026-07-07: status bar, reactive mugshot, flashes, viewmodel bob. Files: `src/components/FlatlineGame.tsx`, `src/art/mugshot.ts`, `app/globals.css`. PR #pending.
