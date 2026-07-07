# Meta progression

**Status:** done

Rogue Legacy 2's structure, re-themed. All purchases use cheddar at the office between runs.

**Case Board** (the manor tree): a 5x4 grid of nodes joined by string. Fog of war: a node is visible only when purchased or adjacent to a purchase, hidden nodes show face-down photos. Sixteen nodes: hp (two nodes, deeper one bigger), damage (two), speed, start armor, cheddar gain, max ammo, drop luck, fire rate, automap range, the Gun Locker (opens the Armory), The Fence (opens relics), and the Floor Safe plus Offshore Account (rent banking). Rank cost grows about 60% per rank; past 30 total ranks a labor-cost inflation adds 10 per rank purchased anywhere (the RL2 rule).

**Armory**: unlock Scattergun 300, Chatter Gun 650, TNT Lobber 1200, Ray-O-Matic 2000, Big Cheese 4000; three +20% damage tiers per weapon priced as growing multiples of the unlock price.

**The rent (Charon rule)**: starting a run takes 100% of unspent cheddar. Floor Safe ranks bank 10% each (up to 60%), Offshore Account extends to 100%. Rent paid is tracked for flavor.

Death always banks the run's earnings first: `endRun` adds cheddar, kills, and best ring; `beginRun` applies rent and consumes relics.

Pacing anchors from RL2 research: early runs earn roughly 150 to 600; first-row node ranks cost 80 to 200, so every death affords at least one purchase.

### Build log

- 2026-07-07: board, armory, rent, run lifecycle, schema, tests. Files: `src/game/meta.ts`, `src/game/meta.test.ts`, `src/components/OfficeScreen.tsx`. PR #pending.
