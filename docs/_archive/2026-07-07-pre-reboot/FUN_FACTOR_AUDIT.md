# Fun Factor Gap Audit

> **Backlog generator.** Run this audit when `docs/GDD_COVERAGE.json` is ≥80% `done`. Re-run after every major system lands. This is the source of the P0 / P1 polish work that prevents the loop from terminating before the product is good. Each gap identified here becomes a `Q-NNN` open question or an `F-NNN` followup.
>
> This doc exists because the Flatline failure mode is: every coverage row is `done`, every test passes, every checkbox is green, but the product is not actually fun. Coverage rows say a *system* exists. They cannot say the system *delivers experience*. This audit asks the questions coverage cannot.

## How to run an audit

1. Set today's date as the audit header (`## Audit YYYY-MM-DD`).
2. Walk each prompt below. Write a one-sentence answer for each. Be honest. "Yes" answers do not generate work; gaps do.
3. For each gap, decide: is this a question (`Q-NNN`) or a followup (`F-NNN`)?
4. Add the entry. Reference the audit date in the entry's Context line.
5. Save the audit. Do not delete previous audits; let the file grow.

Append-only. Earlier audits are preserved.

## Prompts

### The first session

- Does the first 90 seconds make the player want to keep playing?
- What is the first specific moment that surprises a new user (positive or negative)?
- Where does a new user get stuck or confused?

### The core action

- Does the core action feel good at every skill level (novice, mid, expert)?
- Is there meaningful skill expression? Can two players visibly perform differently at the same task?
- Does the core action have texture (light cues, weight, follow-through), or does it feel binary?

### Variety

- Do the variations within the system feel distinct, or do they feel like recolors?
- If the player picks a "different" option (track / character / mode / layout), do they have a different experience?
- Is there a surprise still waiting for a player who has played for an hour?

### Difficulty arc

- Where is the difficulty too high (frustration without learning)?
- Where is the difficulty too low (boredom)?
- Is there a clear "I want to keep going to get better" pull?

### Stickiness

- What brings a player back the next day?
- What makes a player tell a friend about this?
- What is the smallest change that would meaningfully improve retention?

### Polish you have been postponing

- List up to five "we know this needs work" items you have been quietly avoiding. Be specific.
- For each, name the smallest slice that would meaningfully address it.

## Audit log

### Audit 2026-05-07 (ten-round mass-appeal replay read)

Trigger: dev directive "Do ten rounds of gameplay analysis and research then enhance what we have for mass appeal and replay value." The local build already has the prior Doom-feel pass: dash, hitstop, knockback, spitter, waves, rage, score token, adaptive music, score floaters, and best-score readout. This pass asked what the smallest next hook is for a broader audience and returning players.

Research anchors used: current GDD pillars, release playtest checklist, prior fun audit, current daily mode implementation, Doom combat analysis around push-forward combat and combat chess, arcade replay loops built around short runs and score chasing, and roguelite daily challenge patterns where a fixed seed lets players compare one fair variant.

Follow-up pass after local daily twists were already present in the worktree:

Round 1. The daily twist gives today's run a reason, but it does not tell a returning player that yesterday mattered.

Round 2. A personal streak is easier to understand than account XP, unlock currencies, or a cosmetic shop.

Round 3. The streak should be local-only for now because the shared daily leaderboard already owns public competition.

Round 4. Recording on run completion is more honest than recording when the page loads.

Round 5. Same-day retries should increase total daily runs but not inflate the streak length.

Round 6. UTC date keys match existing daily seed and shared leaderboard date behavior, keeping the daily reset consistent.

Round 7. Showing best streak and total daily runs gives both casual and returning players a small progress read without affecting score fairness.

Round 8. The start panel already contains the daily schedule, so the streak belongs there rather than in a modal or post-run gate.

Round 9. Implementation fit is low-risk: a pure localStorage helper plus one React state update after daily `finishRun`.

Round 10. Slice picked: local daily streak return hook. It improves replay value without adding combat rules, progression economy, or account requirements.

Round 1. First 30 seconds: the game already says move, shoot, survive. The start panel can better sell today's reason to play.

Round 2. Mass appeal: avoid adding build crafting or inventory. A clear one-line modifier is easier to understand than a progression tree.

Round 3. Replay hook: daily seed and daily leaderboard exist, but the daily run can still feel like a shuffled version of the same arena.

Round 4. Fair competition: deterministic modifiers preserve leaderboard comparability because all daily players get the same rule.

Round 5. Skill expression: small scoring and pressure changes reward different tactics without replacing aim, movement, and target priority.

Round 6. Surprise: rotating named modifiers create a pre-run "what is today?" moment for returning players.

Round 7. Risk: too many modifier axes would make the score board hard to trust. Keep the first set to cadence, supplies, and kill-score multiplier.

Round 8. UI: the daily panel already previews spawn and hazard shape, so it is the right place to show the twist without adding a modal.

Round 9. Implementation fit: `src/game/dailyArena.ts` already owns deterministic date-seed tuning, and `recordKill` already accepts a multiplier, so this lands with low architectural risk.

Round 10. Slice picked: daily twist modifiers. This improves replay value immediately, creates a daily return signal, and stays inside the GDD pillars.

### Audit 2026-05-05 (find-the-fun, Doom feel)

Trigger: dev directive "Find the fun. What makes Doom fun. Expand the game closer to Doom." Coverage is 43/65 done (66%), below the formal ≥80% gate, but the qualitative read of the build is far enough along (3 weapons, 3 enemies, 3 hazards, scoring V2, audio cues, HUD treatment, door state machine, arena landmarks) that fun-factor work now compounds with the polish in flight rather than gating it.

Doom anchor pieces (1993 + 2016) used as the comparison frame:

- Movement is a weapon: high base speed, low friction, strafe-running, one momentum tool (sprint/dash).
- Shotgun is the iconic verb: chunky one-shots at point-blank with a visible shove on the enemy and a felt impulse on the player.
- Threat layering: melee chaff, ranged threats, tanky bruisers, occasional elites. The player has to choose targets.
- Infighting: enemies can damage each other through crossfire. Player engineers kills via positioning.
- Power moments: berserk, quad damage, invulnerability. Brief "holy shit" windows.
- Glory loop: rewarding aggressive close-range play with resources (health, ammo, score).
- Encounter rhythm: surges, lulls, peaks, with audio cueing the rhythm shift.
- Adaptive music intensity: ambient drones to thrash as pressure rises.

#### The first session

- Does the first 90 seconds make the player want to keep playing? Mostly. Spawn into one room, see a sprite enemy, shoot it, see a hand-drawn billboard die. The hook is visible. The pull is weaker than Doom because there is no first-shotgun-blast moment yet.
- What is the first specific moment that surprises a new user? Probably the cartoon-title-card HUD wobble plus the muzzle flash. Negative surprise: combat resolves on a chase-shoot loop with no player movement modifier (no sprint, no dash, no slide), so the verb feels narrower than Doom.
- Where does a new user get stuck or confused? Multiple weapons cycle but the boomstick is not yet *the* iconic verb because hits do not visibly shove enemies and the player camera does not feel the recoil weight. Threat shape is repetitive (three melee enemies; no ranged) so the player learns one routine.

Gaps: F-006 (movement weapon), F-007 (boomstick weight), F-008 (ranged threat).

#### The core action

- Does the core action feel good at every skill level? Mid-tier players probably enjoy it. Novices have no readable practice ramp into the boomstick fantasy because it is not yet visually weighty. Expert players have no skill-expression headroom because there is no movement tool that separates good play from slow play.
- Is there meaningful skill expression? Aim and target prioritization, accuracy bonus, weapon-variety bonus. Not enough.
- Does the core action have texture? Mostly yes (recoil, muzzle flash, hurt flash, audio stings). The missing texture is at the contact moment: no hitstop, no enemy knockback, no camera kick.

Gaps: F-009 (hitstop on confirmed hit), F-010 (enemy knockback), F-006 (movement weapon).

#### Variety

- Do the variations within the system feel distinct? Three weapons read distinct (single shot, spread, energy). Three enemies read distinct (chaff, fast 1HP, tanky melee). All three enemy archetypes are melee. The roster is one axis short of Doom's threat triangle.
- If the player picks a different option, do they have a different experience? Weapon swap matters. Enemy spawn variation does not present meaningfully different encounters because every enemy approaches and swings at melee range.
- Is there a surprise still waiting for a player who has played for an hour? Not enough. There is no power pickup, no rare event, no environmental shift the player has not seen by minute three.

Gaps: F-008 (ranged enemy / Spitter), F-011 (power pickup / berserk), F-012 (score token / quad), F-013 (infighting), F-014 (encounter wave choreography).

#### Difficulty arc

- Where is difficulty too high? Brutes can corner the player against a pillar; the player has no movement tool to evade the windup. With three melee enemies on screen and no ranged threat to break formation, escape options are thin.
- Where is difficulty too low? Early run (first 60s) at one pressure target with all-grunt spawns is forgiving; with no movement weapon and no infighting puzzles to solve, the optimal play is "stand back, shoot." That feels static.
- Is there a clear "I want to keep going to get better" pull? Score and combo provide some pull. The pull would compound once power moments and skill-expressive movement land.

Gaps: F-006 (movement weapon), F-008 (ranged threat), F-014 (encounter wave choreography), F-013 (infighting).

#### Stickiness

- What brings a player back the next day? Daily seed mode plus leaderboards exist (REQ-007 done). The stickiness shape is correct.
- What makes a player tell a friend? Right now: hand-drawn billboard art and the cartoon-title-card HUD. After fun-factor work: "I made a brute walk into a hazard while a spitter shot another brute" stories.
- Smallest change that meaningfully improves retention? F-009 hitstop and F-010 knockback. They cost little, transform every shot, and apply to every existing weapon and enemy.

#### Polish you have been postponing

1. Boomstick does not feel like a Doom shotgun. Damage 1 per pellet, six pellets, 760ms cooldown is numerically right; visually and audibly it lacks the shove. Slice: F-007 (camera FOV punch + extra screen impulse on boomstick fire) plus F-010 (enemy knockback on hit).
2. Movement has no expressive verb. No sprint, no dash, no slide. Constant 6.8 m/s across the run. Slice: F-006 sprint or dash (Q-006 picks the form).
3. No ranged enemy. Spitter is not_started in REQ-031. Slice: F-008 first cut of ranged threat.
4. No power moment. No berserk, no quad, no invuln. Slice: F-011 berserk-style rage pickup (Q-007 picks the buff stack).
5. Music does not crescendo with pressure. REQ-040 partial. Slice: F-015 adaptive music layer that fades a thrash stem in as `activePressure / pressureTarget` climbs past 0.7.

#### Net read

The systems are mostly there. The fun is not yet there because the *moment of contact* is too quiet, the *threat shape* is too uniform, and the *power fantasy* has no peaks. Two slices fix the contact moment: hitstop and knockback. One slice fixes the threat shape: spitter. Two slices fix the peaks: berserk and adaptive music. Five slices, all PR-sized, all decoupled, all measurable, take Flatline from "complete on paper" to "fun on first contact." That is the Doom move: layer texture, layer threat, layer power.

### Audit 2026-05-03 (initial)

(populate when first run, after at least one full system has landed and coverage is non-trivial)

### Earlier audits

(append previous audits below this line as they age out, newest above oldest)
