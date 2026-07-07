# Screen flow

**Status:** done

Title (New Case / The Office / film preset / mute) -> playing -> death card (FLATLINED with run summary) -> office (Case Board / Armory / Fence / Hit the Streets) -> playing. Escape or losing pointer lock pauses with Resume, Call It a Night (ends the run), film, and mute controls.

E2e test hooks: `flatline:force-death`, `flatline:grant-cheddar`, and `flatline:spawn-goons` custom window events drive deterministic flows.

### Build log

- 2026-07-07: all screens and the pause path. Files: `src/components/FlatlineGame.tsx`, `src/components/OfficeScreen.tsx`. PR #pending.
