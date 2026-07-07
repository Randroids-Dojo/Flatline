# Platform and stack

**Status:** done

Desktop web first: pointer lock mouse look, WASD, keyboard weapon slots. Touch devices get dual float-where-you-tap virtual sticks (vibekit joystick math: left half moves, right half aims, tap fires) plus on-screen FIRE, USE, MAP, and pause buttons; HUD weapon slots are tappable on every input mode.

Stack (fixed by AGENTS.md rule 3): Next.js (app router, static page), Three.js (WebGL renderer), Vercel (hosting and deploys). Upstash Redis is in the approved stack but currently unused; the leaderboard was cut in the reboot. Persistence is localStorage via `@randroids-dojo/vibekit` storage helpers.

All art and audio are generated at runtime in the browser (canvas 2D drawing, WebAudio synthesis). The repo ships no binary game assets.

### Build log

- 2026-07-07: reboot removed the API routes and Upstash usage; single static route remains. Files: `app/page.tsx`, `app/layout.tsx`. PR #172.
- 2026-07-07: mobile touch controls (closes F-025): dual vibekit sticks, FIRE/USE/MAP/pause buttons, tappable weapon slots, synthetic-mouse guard. Files: `src/game/touch.ts`, `src/components/FlatlineGame.tsx`, `app/globals.css`. PR #173.
