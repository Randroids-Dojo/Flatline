# Pickups

**Status:** done

Doom's item economy in cartoon clothes. Items that would do nothing (full hp, full armor, full ammo) stay on the floor.

- Cheese bit +10 hp, cheese wheel +25 hp, both capped at max hp.
- Padded vest: sets 100 armor at 1/3 absorb. Trench armor: 200 at 1/2.
- Ammo: box of bullets 50, shells 8, TNT bundle 3, ray cells 40.
- Cheddar: small coin 10, coin pile 100, scaled by the Street Smarts multiplier and doubled by Loaded Dice. Coins burst from dead enemies (2 to 20 by goon type, following the RL2 pacing of 20 to 50 gold per early kill).
- Vault key: one-slot key item.

Enemy kills also roll a luck-scaled supply drop (cheese or bullets, 18% base plus Rabbit's Charm).

### Build log

- 2026-07-07: pickup effects, drop rolls, and tests. Files: `src/game/pickups.ts`, `src/game/pickups.test.ts`. PR #pending.
