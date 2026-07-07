# Persistence

**Status:** done

localStorage via the vibekit storage wrapper with zod validation.

- `flatline.meta.v2`: the meta state (cheddar, node ranks, weapons unlocked, weapon tiers, pending relics, best ring, totals, rent paid), zod-parsed on load; invalid or missing data falls back to a fresh state.
- `flatline.film.v1`: film preset enum.

Run state is never persisted; refreshing mid-run is a death without the summary (earnings are lost). Acceptable for v1, logged as Q-033.

### Build log

- 2026-07-07: schema and load/save flow. Files: `src/game/meta.ts` (metaSchema), `src/components/FlatlineGame.tsx`, `src/lib/storage.ts`. PR #pending.
