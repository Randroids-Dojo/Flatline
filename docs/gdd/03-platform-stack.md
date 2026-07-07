# Platform and stack

**Status:** done

Desktop web first: pointer lock mouse look, WASD, keyboard weapon slots. Mobile gets a readable title screen but no touch controls in v1 (followup F-025).

Stack (fixed by AGENTS.md rule 3): Next.js (app router, static page), Three.js (WebGL renderer), Vercel (hosting and deploys). Upstash Redis is in the approved stack but currently unused; the leaderboard was cut in the reboot. Persistence is localStorage via `@randroids-dojo/vibekit` storage helpers.

All art and audio are generated at runtime in the browser (canvas 2D drawing, WebAudio synthesis). The repo ships no binary game assets.

### Build log

- 2026-07-07: reboot removed the API routes and Upstash usage; single static route remains. Files: `app/page.tsx`, `app/layout.tsx`. PR #172.
