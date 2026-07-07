# Core loop

**Status:** done

Minute to minute: sweep rooms, kill goons, grab coins and supplies, push one ring further out, find vault keys, crack vaults.

Run to run: die, watch the summary (blocks out, kills, cheddar, time), return to the office, spend on the Case Board / Armory / Fence, hit the streets. Starting a run takes all unbanked cheddar as rent, so spending before leaving is the correct move.

Session to session: permanent board ranks and weapon tiers persist in localStorage. Best ring is the score.

### Build log

- 2026-07-07: full loop shipped. Files: `src/components/FlatlineGame.tsx`, `src/components/OfficeScreen.tsx`, `src/game/meta.ts`. PR #172.
