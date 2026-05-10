# Post-MVP: Meta-progression (Roguelike Upgrades Across Runs)

**Status:** partial

A persistent currency and a tier tree so the game compounds across runs. Every kill banks one credit; credits never expire and every purchase is permanent. The player feels stronger after every death.

Currency:

- 1 enemy killed in a non-practice run = 1 credit, banked on death.
- Credits accrue regardless of whether the run set a personal best, and regardless of accuracy or combo. The score formula already rewards skilled play; the meta-currency rewards persistence.
- Practice runs do not award credits (practice is for tuning, not progression).
- The wallet persists in `window.localStorage` under `flatline.upgradeWallet.v1` via `src/lib/upgradeWallet.ts`.
- Cross-device sync is out of scope here. A follow-up may mirror the leaderboard's Upstash path.

Tiers:

- Each upgradable stat has 5 tiers (`MAX_TIER = 5`). Tier 0 is the starting state.
- Costs follow a geometric ramp: `5, 10, 20, 40, 80` credits to reach tiers 1..5 respectively (`TIER_COSTS` in `src/game/upgradeTree.ts`). Total to fully max one stat: 155 credits.
- Once bought, a tier is permanent. There is no reset, prestige, or refund in v1.

Stats (full set, shipping over multiple slices):

1. **Max HP** (this slice): +10 HP per tier on top of the base 100, so a tier-5 player starts with 150 HP. Constants: `MAX_HP_BASE`, `MAX_HP_PER_TIER`. Effective value via `effectiveMaxHp(tiers)`.
2. **Starting ammo** (PR B): tier-driven boost to initial Boomstick / Inkblaster ammo at run start.
3. **Weapon damage** (PR B): multiplicative damage modifier applied to outgoing weapon damage.
4. **Move speed** (PR B): tier-driven boost to player movement speed.

UI:

- The Upgrades panel renders inline on the run-summary overlay, between the run summary block and the shared-submit panel. Visible only after a non-practice run ends.
- Shows current credit balance plus one row per stat with current tier, effective value, and a Buy button.
- Buying a tier writes the wallet through to localStorage immediately, so refreshing or starting a new run reads the latest state.
- The summary's "Kills" line annotates `+N credits` so the player sees the conversion before scrolling to the upgrades panel.

What this is NOT:

- No reset / prestige / ascension. Pure compounding.
- No mid-run upgrades. Spending only happens between runs on the death screen.
- No new weapons. The 3 existing weapons stay reachable through the same in-run pickup model.
- No consumables (one-shot per-run items). Stats are permanent tiers only.

### Build log

- 2026-05-10: Slice A shipped. Wallet (`src/lib/upgradeWallet.ts`), pure tier tree (`src/game/upgradeTree.ts`), and Max HP wiring into `startRun` / `finishRun` plus an inline `UpgradePanel` on the run-summary overlay (`src/components/FlatlineGame.tsx`). CSS in `app/globals.css`. Status stays `partial` because 3 of the 4 planned stats (starting ammo, weapon damage, move speed) ship in PR B. PR #151.
