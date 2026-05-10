# Post-MVP: Meta-progression (Roguelike Upgrades Across Runs)

**Status:** done

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

- 2026-05-10: Slice B shipped. Tree extended with `startingAmmo`, `weaponDamage`, and `moveSpeed`, each at 5 tiers on the same geometric `5/10/20/40/80` cost ramp. Per-tier effects: `+1` to both Boomstick and Inkblaster max ammo; `+10%` weapon damage; `+4%` move speed. New helpers in `src/game/upgradeTree.ts`: `effectiveMaxAmmoBonus`, `effectiveDamageMultiplier`, `effectiveMoveSpeedMultiplier`, plus `UPGRADE_STAT_IDS` so the UI can data-drive its row list. `src/game/weapons.ts` extended `createWeaponAmmo` and `collectWeaponAmmo` with optional `maxAmmoBonus` arg (default 0, preserves all existing callers and tests). `src/components/FlatlineGame.tsx` threads the bonus into run-start ammo init, the supply pickup `wantsSupply` check, the supply pickup refill, both weapon damage application sites (hitscan and inkblaster splash), and the per-frame movement multiplier. `UpgradePanel` refactored into a config-driven row list; CSS already covers the row layout. `src/lib/upgradeWallet.ts` schema extended with the three new fields, with a one-way migrator that fills missing fields with 0 so existing v1 wallets (Max HP only) keep their tier on first read. Status flips `partial` to `done`. PR #pending.
- 2026-05-10: Slice A shipped. Wallet (`src/lib/upgradeWallet.ts`), pure tier tree (`src/game/upgradeTree.ts`), and Max HP wiring into `startRun` / `finishRun` plus an inline `UpgradePanel` on the run-summary overlay (`src/components/FlatlineGame.tsx`). CSS in `app/globals.css`. Status stays `partial` because 3 of the 4 planned stats (starting ammo, weapon damage, move speed) ship in PR B. PR #151.
