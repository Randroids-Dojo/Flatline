# Flatline: Game Design Document

**Tagline.** Drawn flat. Killed fast.

**One-sentence description.** Flatline is an endless single-room Doom-like shooter where hand-drawn flat enemies swarm you from every angle.

---

## 1. Vision

Flatline is a fast, arcade-style, single-room first-person shooter built for the web.

The player is trapped in one strange room. Enemies keep spawning. Weapons, ammo, health, and hazards cycle in. The room gradually mutates through lighting, props, doors, traps, fog, and enemy pressure. The goal is not to beat the game. The goal is to survive longer, score higher, and master the room.

The visual hook is a 3D world filled with flat, hand-drawn 2D animated enemies. Characters always face the player like cartoon cutouts, but swap between different hand-drawn angles so they feel like they belong in 3D space.

Think:

- Doom-style movement and shooting
- One-room survival arena
- Rubber-hose / hand-drawn billboard enemies
- Web-first, instant play
- Score chasing
- Strong mood, strong silhouettes, readable chaos

---

## 2. Design Pillars

### 2.1 Instant Violence, Instant Readability

The player should understand the game within 10 seconds:

1. Move.
2. Shoot.
3. Dodge.
4. Pick up ammo and health.
5. Survive.

No inventory screens. No long tutorial. No complex build crafting.

### 2.2 One Room, Many States

The game happens in one room, but that room should not feel static.

The room changes through:

- Spawn doors opening and closing
- Lights flickering
- Moving cover
- Hazards activating
- Enemy waves changing
- Floor symbols glowing
- Props breaking
- Music intensity rising
- Fog or smoke increasing
- Arena layout variants loading between runs

The room is the main character.

### 2.3 2D Characters in a 3D Space

Enemies are not full 3D models. They are animated 2D sprites placed in the 3D world.

The game uses billboard rendering:

- Each enemy is a flat plane.
- The plane rotates to face the camera.
- The shown sprite changes based on the player’s angle around the enemy.
- Animation frames advance like a flipbook.

This creates the classic cartoon-in-a-3D-shooter effect.

### 2.4 Fast Runs, Strong Replay

A good run should last 2 to 8 minutes for most players.

Replay hooks:

- Score
- Survival time
- Kill count
- Accuracy
- Combo chains
- Personal bests
- Daily arena seed
- Leaderboards
- Unlockable visual variants

---

## 3. Target Platform

### 3.1 Platform

Primary target:

- Desktop web browser

Secondary target:

- Mobile browser, later
- Gamepad support, later
- Installable PWA, later

### 3.2 Technical Base

Use a similar infrastructure shape to `Randroids-Dojo/VibeRacer`:

- Next.js app
- React UI shell
- Three.js renderer
- TypeScript
- Pure game loop logic where possible
- `requestAnimationFrame` render loop
- Vitest unit tests
- Playwright smoke tests
- Optional Upstash Redis for leaderboards and daily seeds

The core idea is to reuse the VibeRacer style of separating React lifecycle/UI, Three.js rendering, and pure game simulation.

---

## 4. Core Game Loop

1. Player opens `/` or `/arena/[slug]`.
2. Title screen appears.
3. Player starts a run.
4. Countdown: 3, 2, 1.
5. Player spawns in the arena.
6. Enemies spawn from doors, vents, holes, portals, or shadows.
7. Player kills enemies, dodges attacks, and collects pickups.
8. Difficulty ramps forever.
9. Player dies.
10. Run summary appears.
11. Score is submitted.
12. Player restarts instantly.

---

## 5. Game Modes

### 5.1 Main Mode: Endless Room

The player survives as long as possible in a single room.

The run ends when health reaches zero.

Scoring rewards:

- Kills
- Survival time
- Combos
- Accuracy
- Close-range kills
- Kill variety
- No-damage streaks
- Resource efficiency

### 5.2 Daily Room

A deterministic daily seed.

All players get the same:

- Room layout
- Spawn rules
- Wave order
- Pickup timing
- Hazard schedule

Leaderboard resets daily.

### 5.3 Practice Mode

No leaderboard submission.

Player can tune:

- Starting weapon
- Enemy types
- Spawn rate
- Infinite ammo
- Damage on/off
- Billboard debug overlays

---

## 6. Camera and Perspective

### 6.1 Camera

First-person camera.

Default:

- FOV: 75
- Height: 1.7 world units
- Mouse look
- No body visible in MVP
- Weapon sprite visible in foreground

### 6.2 Movement

Classic Doom-inspired movement, but with modern comfort.

Keyboard:

- WASD: move
- Mouse: aim
- Left click: fire
- Right click: alt fire, later
- Shift: dash, later
- Space: interact or quick shove, later
- R: reload, only if weapon requires reload
- Esc: pause

Movement feel:

- Fast acceleration
- Low friction
- No realistic inertia
- No crouch in MVP
- No jumping in MVP unless a later arena variant needs it

### 6.3 Billboard Perspective

Enemies are flat drawings standing in a 3D room.

The trick:

- The enemy is a flat rectangle.
- The rectangle always turns to face the player.
- The game picks the drawing that matches where the player is standing.

Example:

```text
Player in front of enemy  -> show front drawing
Player beside enemy       -> show side drawing
Player behind enemy       -> show back drawing
```

So the enemy is not really 3D. It is a stack of cartoon drawings pretending to be 3D.

---

## 7. Art Direction

### 7.1 Visual Style

A spooky cartoon shooter.

Possible directions:

- Black-and-white rubber hose horror
- Muted 1930s cartoon with selective accent colors
- Cardboard horror diorama
- Ink-and-paper nightmare
- Vintage animation meets Doom

Recommended MVP style:

- Mostly grayscale
- One accent color for interactables
- One danger color for damage and hazards
- Thick outlines
- Bouncy animation
- High contrast silhouettes

### 7.2 Why Mostly Grayscale

Grayscale makes the billboard characters feel more like old animation.

But readability needs help.

Use brightness, shape, movement, and contrast:

- Pickups bounce
- Doors pulse
- Enemies have strong silhouettes
- Hazards flash before activating
- Important objects are brighter
- Background clutter is darker
- Damage uses screen flash and audio

### 7.3 Character Art

Each enemy needs:

- Idle
- Walk
- Attack windup
- Attack release
- Hurt
- Death
- Optional special animation

Each animation needs multiple angles.

MVP angles:

- Front
- Front-left
- Left
- Back-left
- Back
- Back-right
- Right
- Front-right

Minimum MVP shortcut:

- 5 angles instead of 8
- Front
- Front-left
- Left/right mirrored
- Back-left/back-right mirrored
- Back

### 7.4 Animation Frame Budget

Do not overdraw early.

MVP target:

| Asset | Angles | Frames per anim | Animations | Approx frames |
| - | -: | -: | -: | -: |
| Grunt enemy | 8 | 6 to 10 | 5 | 240 to 400 |
| Fast enemy | 8 | 6 to 10 | 5 | 240 to 400 |
| Heavy enemy | 8 | 8 to 12 | 5 | 320 to 480 |
| Weapon | 1 | 4 to 12 | 4 | 16 to 48 |
| Pickups | 1 | 4 to 8 | 3 | 12 to 24 |

MVP should ship with 2 to 3 enemies, not 12.

The art cost grows quickly.

---

## 8. Enemy Billboard System

### 8.1 Runtime Entity Model

Each enemy has:

```ts
type Enemy = {
  id: string
  type: EnemyType
  position: Vector3Like
  velocity: Vector3Like
  radius: number
  health: number
  state: EnemyState
  facingAngle: number
  animation: AnimationName
  animationTimeMs: number
  attackCooldownMs: number
  targetId: 'player'
}
```

### 8.2 Rendering Model

Each enemy renders as:

- One Three.js plane
- Transparent texture material
- Sprite atlas frame selected per tick
- Billboard rotation facing the camera
- Angle bucket selected from player/enemy relative direction

### 8.3 Angle Selection

Calculate where the player is relative to the enemy.

Then choose a sprite angle.

Simple version:

```ts
const angleToPlayer = atan2(player.z - enemy.z, player.x - enemy.x)
const relativeAngle = normalizeAngle(angleToPlayer - enemy.facingAngle)
const bucket = angleToBucket(relativeAngle, 8)
```

Buckets:

| Bucket | Sprite |
| - | - |
| 0 | front |
| 1 | front-right |
| 2 | right |
| 3 | back-right |
| 4 | back |
| 5 | back-left |
| 6 | left |
| 7 | front-left |

### 8.4 Billboard Facing

The visible plane should face the camera.

But the selected drawing should depend on the enemy’s facing direction relative to the player.

That means:

- Plane rotation is camera-facing.
- Sprite angle is enemy-facing-aware.

This prevents the enemy from visually turning into a thin card.

### 8.5 Animation Atlas

Use sprite sheets.

Recommended structure:

```text
public/assets/enemies/grunt/grunt.atlas.json
public/assets/enemies/grunt/grunt.png
```

Atlas metadata:

```ts
type SpriteFrame = {
  x: number
  y: number
  w: number
  h: number
  durationMs: number
}

type AnimationClip = {
  name: string
  angle: 'front' | 'frontRight' | 'right' | 'backRight' | 'back' | 'backLeft' | 'left' | 'frontLeft'
  frames: SpriteFrame[]
  loop: boolean
}
```

---

## 9. Room Design

### 9.1 Arena Shape

MVP room:

- Rectangular room
- Pillars near center
- 4 enemy doors
- 4 corner pickup zones
- 1 center risk/reward pickup zone
- Raised stage or altar in center
- Wall decorations for orientation

### 9.2 Navigation

The player should always know where they are.

Use distinct landmarks:

- North wall: giant cracked clock
- East wall: furnace doors
- South wall: theater curtain
- West wall: pipe organ or control booth

In a one-room game, orientation matters.

If every wall looks the same, the player feels lost even though the room is small.

### 9.3 Cover

Cover should not stop the game.

Use partial cover:

- Pillars
- Broken walls
- Low crates
- Hanging props
- Moving partitions

Enemies should path around cover, not get stuck on it.

### 9.4 Hazards

Hazards activate as difficulty increases:

- Floor spikes
- Flame vents
- Swinging saw shadows
- Electric puddles
- Falling lights
- Ink pools
- Closing walls, later

Hazards must telegraph before damage.

Example:

1. Floor symbol glows.
2. Audio sting plays.
3. Half-second delay.
4. Hazard activates.

---

## 10. Weapons

### 10.1 MVP Weapons

#### Peashooter

Default pistol.

- Infinite ammo
- Low damage
- Perfect fallback weapon
- Fast firing
- Good accuracy

#### Boomstick

Shotgun equivalent.

- High close damage
- Wide spread
- Limited ammo
- Strong knockback
- Great against groups

#### Inkblaster

Projectile weapon.

- Slow moving projectile
- Splash damage
- Useful for area denial
- Risky up close

### 10.2 Weapon Presentation

Weapons are 2D foreground sprites, like classic shooters.

Each weapon needs:

- Idle frame
- Fire animation
- Cooldown animation
- Optional reload animation
- Pickup icon
- HUD icon

### 10.3 No Reloads in MVP

Unless reloads are core to the weapon fantasy, skip them.

Doom-like flow is stronger with:

- Fire rate
- Ammo type
- Weapon switching
- Pickup management

---

## 11. Enemies

### 11.1 Grunt

Basic enemy.

Behavior:

- Walks toward player
- Short melee swipe
- Dies quickly
- Teaches movement and shooting

Role:

- Pressure
- Combo fodder
- Screen population

### 11.2 Spitter

Ranged enemy.

Behavior:

- Keeps distance
- Fires slow projectile
- Has clear windup animation
- Low health

Role:

- Forces dodging
- Breaks circle-strafing comfort

### 11.3 Brute

Heavy enemy.

Behavior:

- Slow movement
- High health
- Big windup charge
- Stuns briefly after missing

Role:

- Area denial
- Forces positioning

### 11.4 Swarm

Small fast enemy.

Behavior:

- Low health
- Moves erratically
- Attacks in packs

Role:

- Panic
- Ammo tax
- Movement test

MVP should start with Grunt and Spitter. Add Brute next.

---

## 12. Difficulty Ramp

Difficulty increases by pressure budget.

Each second, the game has a target pressure score.

Enemy types cost pressure.

Example:

| Enemy | Pressure cost |
| - | -: |
| Grunt | 1 |
| Spitter | 2 |
| Swarm | 1 |
| Brute | 4 |

The spawn director tries to keep current pressure near the target.

Target pressure rises over time:

```text
0:00 to 1:00    mostly grunts
1:00 to 2:00    grunts + spitters
2:00 to 4:00    add brutes
4:00+           mixed waves, hazards, faster spawn cadence
```

### 12.1 Spawn Director Goals

The director should feel mean, not random.

It should avoid:

- Spawning enemies directly behind the player with no cue
- Spawning too many ranged enemies at once
- Starving the player of ammo
- Creating unwinnable body-blocks too early

It should encourage:

- Movement
- Weapon switching
- Risky pickup routes
- Last-second escapes

---

## 13. Pickups

### 13.1 Health

Small health:

- Restores 10
- Common

Large health:

- Restores 35
- Rare
- Usually in dangerous location

### 13.2 Ammo

Ammo types:

- Shells
- Ink cells
- Later: special ammo

### 13.3 Score Pickups

Optional.

Small floating tokens dropped by enemies.

They vanish quickly and reward aggressive play.

### 13.4 Pickup Readability

Because the art may be mostly grayscale:

- Pickups bounce
- Pickups glow
- Pickups use bright rim light
- Pickups make a subtle looping sound
- Pickup zones are visually consistent

---

## 14. Scoring

Score formula:

```text
score =
  killScore
+ survivalBonus
+ comboBonus
+ accuracyBonus
+ closeCallBonus
+ hazardKillBonus
```

### 14.1 Combo

Combo increases when killing enemies quickly.

Combo breaks when:

- Too much time passes
- Player takes damage
- Player misses too many shots, optional

### 14.2 End of Run Summary

Show:

- Final score
- Survival time
- Kills
- Accuracy
- Best combo
- Favorite weapon
- Damage taken
- Personal best comparison
- Leaderboard rank

---

## 15. HUD

### 15.1 In-Run HUD

Required:

- Health
- Ammo
- Current weapon
- Score
- Combo
- Survival timer
- Damage direction indicator
- Crosshair

Optional:

- Enemy pressure meter
- Wave intensity label
- Pickup indicators
- Personal best ghost marker

### 15.2 Visual Style

HUD should feel like an old cartoon title card mixed with a shooter HUD.

Examples:

- Wobbly text
- Ink splatter damage frame
- Rubber-hose icons
- Film grain
- Slight jitter, but not enough to hurt readability

---

## 16. Audio

### 16.1 Music

Adaptive loop.

Intensity layers:

1. Low tension
2. Combat
3. High pressure
4. Near death
5. Boss-like surge, later

### 16.2 Sound Effects

Required:

- Weapon fire
- Enemy hurt
- Enemy death
- Enemy attack windup
- Player damage
- Pickup
- Door spawn cue
- Hazard warning
- Combo increase
- Run end

### 16.3 Audio Readability

Audio should help replace color cues.

Examples:

- Spitter windup has a distinct whistle.
- Brute charge has a bassy inhale.
- Health pickup has a soft sparkle.
- Hazard has a countdown click.

---

## 17. Technical Architecture

### 17.1 Proposed Routes

```text
/
  Landing page

/arena
  Main playable arena

/arena/daily
  Daily challenge

/arena/practice
  Practice mode

/api/runs
  Submit score

/api/leaderboard
  Fetch leaderboard

/api/daily
  Fetch daily seed
```

### 17.2 Suggested Source Layout

```text
src/
  app/
    page.tsx
    arena/
      page.tsx
      daily/page.tsx
      practice/page.tsx
    api/
      runs/route.ts
      leaderboard/route.ts
      daily/route.ts

  components/
    Game.tsx
    FlatlineSession.tsx
    Hud.tsx
    PauseMenu.tsx
    RunSummary.tsx
    SettingsPane.tsx

  game/
    tick.ts
    state.ts
    input.ts
    collision.ts
    weapons.ts
    enemies.ts
    spawnDirector.ts
    pickups.ts
    scoring.ts
    arena.ts
    sceneBuilder.ts
    billboardRenderer.ts
    spriteAtlas.ts
    raycast.ts

  lib/
    settings.ts
    leaderboard.ts
    schemas.ts
    random.ts
    storage.ts

  assets/
    enemies/
    weapons/
    pickups/
    audio/
```

### 17.3 Game Loop

Follow the VibeRacer-style split:

- React owns lifecycle and UI.
- Three.js owns scene rendering.
- `tick()` owns pure game simulation.
- RAF loop coordinates input, tick, render, and HUD updates.

Proposed tick signature:

```ts
type TickResult = {
  state: GameState
  events: GameEvent[]
}

function tick(
  state: GameState,
  input: InputState,
  dtMs: number,
  nowMs: number,
  config: GameConfig
): TickResult
```

### 17.4 State Model

```ts
type GameState = {
  phase: 'countdown' | 'running' | 'dead' | 'paused'
  nowMs: number
  runStartMs: number
  rngSeed: string

  player: PlayerState
  enemies: Enemy[]
  projectiles: Projectile[]
  pickups: Pickup[]
  hazards: Hazard[]
  score: ScoreState
  director: DirectorState
  arena: ArenaState
}
```

### 17.5 Rendering

Three.js scene:

- Room geometry
- Floor
- Walls
- Doors
- Props
- Lights
- Fog
- Billboard enemy planes
- Projectile meshes or sprites
- Pickup sprites
- Weapon overlay rendered in React or Three.js overlay scene

### 17.6 Collision

MVP collision should be simple:

- Player is a circle/capsule on XZ plane.
- Enemies are circles.
- Walls are line segments or boxes.
- Projectiles are spheres/circles.
- No vertical gameplay in MVP.

This keeps it Doom-like and easier to tune.

### 17.7 Shooting

Use raycast for hitscan weapons.

For the pistol and shotgun:

- Cast ray from camera center.
- Check enemy hit circles or billboard bounds.
- Apply damage.
- Spawn impact effect.
- Trigger enemy hurt state.

For projectiles:

- Spawn projectile entity.
- Move each tick.
- Check collision against enemies and walls.
- Explode or despawn.

---

## 18. Billboard Rendering Details

### 18.1 Enemy Visual Component

Each enemy render object stores:

```ts
type EnemyRenderHandle = {
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  currentFrameKey: string
}
```

### 18.2 Per-Frame Render Update

Each RAF frame:

1. For each enemy, find current animation.
2. Calculate angle bucket.
3. Calculate frame index.
4. Update UVs or material map frame.
5. Rotate plane to face camera.
6. Scale plane based on enemy type.
7. Apply hurt flash or shadow.

### 18.3 Sprite Atlas Strategy

Preferred:

- One texture atlas per enemy type.
- Update UV coordinates instead of swapping texture objects.
- Keep material count low.
- Preload atlases before countdown.

Avoid:

- One image file per frame
- Creating materials during gameplay
- Allocating vectors in inner loops

### 18.4 Lighting Style

Use mostly unlit materials for characters.

Reason:

- Sprites already contain drawn lighting.
- Real 3D lighting can make them look muddy.
- Unlit keeps them readable.

But add fake depth:

- Blob shadow under enemies
- Distance fog
- Contact shadow circle
- Slight brightness falloff by distance
- Damage flash overlay

---

## 19. Arena Mutations

The room should change over time without becoming a new level.

Mutation examples:

### 19.1 Lighting Phase

- Normal
- Flicker
- Emergency lights
- Near-death pulse
- Darkness with enemy eyes

### 19.2 Door Phase

- More spawn doors unlock
- Doors jam open
- Doors burst with smoke
- Door lights signal enemy type

### 19.3 Hazard Phase

- Floor traps activate
- Center zone becomes dangerous
- Corners become pickup traps
- Wall vents fire projectiles

### 19.4 Cover Phase

- Pillars rise
- Props break
- Moving partitions shift routes

MVP only needs lighting and spawn doors.

---

## 20. MVP Scope

### 20.1 MVP Must Have

- One playable room
- First-person movement
- Mouse aiming
- Hitscan pistol
- Shotgun
- Health
- Ammo pickups
- 2 enemy types
- Enemy billboard renderer
- 8-direction animation support
- Spawn director
- Endless difficulty ramp
- Score
- Run summary
- Restart
- Basic leaderboard
- Basic settings
- Unit tests for tick, scoring, director, angle bucket selection
- Playwright smoke test for starting a run

### 20.2 MVP Can Fake

- Enemy art can start as placeholder hand-drawn silhouettes.
- Weapon art can be rough.
- Room can be one layout.
- Audio can use simple generated sounds.
- Death animations can be short.
- Leaderboard can be local first, server later.

### 20.3 Explicitly Out of Scope for MVP

- Multiplayer
- Full campaign
- Level editor
- Bosses
- Save files
- Character classes
- Complex inventory
- Real 3D enemy models
- Mobile-first controls
- Networked gameplay

---

## 21. Vertical Slice Plan

### Slice 1: Walk and Shoot

Goal: A player can move around a room and shoot.

Includes:

- Next.js page
- Three.js room
- First-person camera
- WASD + mouse input
- Crosshair
- Pistol raycast
- Debug target dummy

### Slice 2: First Billboard Enemy

Goal: A flat enemy stands in the room and faces the player.

Includes:

- Sprite atlas loader
- Billboard plane
- Angle bucket calculation
- Idle animation
- Hurt animation
- Death animation

### Slice 3: Enemy AI

Goal: Enemy chases and damages player.

Includes:

- Enemy movement
- Melee attack
- Health
- Player damage
- Death state

### Slice 4: Endless Spawn Director

Goal: Game becomes replayable.

Includes:

- Spawn doors
- Spawn budget
- Increasing pressure
- Score
- Run summary
- Restart

### Slice 5: Web Game Polish

Goal: Feels like a real browser game.

Includes:

- Title screen
- Pause
- Settings
- Audio
- Leaderboard
- Daily seed
- Playwright smoke tests

---

## 22. Testing Strategy

### 22.1 Unit Tests

Test pure logic:

- `tick()`
- Player movement
- Weapon fire
- Raycast hit detection
- Enemy state transitions
- Spawn director budget
- Pickup spawn rules
- Score calculation
- Billboard angle bucket selection
- Sprite animation frame selection
- Deterministic daily seed

### 22.2 Playwright Tests

Smoke tests:

- Page loads
- Player can start run
- HUD appears
- Pause opens
- Restart works
- Score summary appears after forced death
- Daily route loads same seed

### 22.3 Manual Test Checklist

- Can circle-strafe without nausea
- Enemies are readable at distance
- Damage direction is clear
- Pickups are noticeable
- Spawn cues are fair
- Player death feels earned
- Restart is instant
- No major frame drops with 25 enemies

---

## 23. Performance Budget

Target:

- 60 FPS desktop
- 30 FPS low-end browser minimum

Initial enemy cap:

- Soft cap: 25 active enemies
- Hard cap: 40 active enemies

Rendering rules:

- Use atlases
- Reuse materials
- Reuse geometry
- Avoid per-frame allocation
- Pool projectiles
- Pool pickup meshes
- Pool enemy render handles
- Throttle React HUD updates to 10 to 20 Hz

---

## 24. Data Model

### 24.1 Run Submission

```ts
type RunSubmission = {
  playerInitials: string
  score: number
  survivalMs: number
  kills: number
  accuracy: number
  bestCombo: number
  arenaSlug: string
  seed: string
  clientVersion: string
  createdAt: string
}
```

### 24.2 Leaderboard Entry

```ts
type LeaderboardEntry = {
  rank: number
  playerInitials: string
  score: number
  survivalMs: number
  kills: number
  accuracy: number
  bestCombo: number
  createdAt: string
}
```

### 24.3 Arena Config

```ts
type ArenaConfig = {
  slug: string
  name: string
  seed: string
  roomLayout: RoomLayout
  spawnDoors: SpawnDoorConfig[]
  pickupZones: PickupZoneConfig[]
  hazardSchedule: HazardConfig[]
  lightingPreset: LightingPreset
}
```

---

## 25. Visual Asset Pipeline

### 25.1 Recommended Process

1. Draw enemy concept.
2. Create turnaround sheet.
3. Pick 5 or 8 angles.
4. Animate front angle first.
5. Validate in game.
6. Animate remaining angles only after movement feels good.
7. Pack frames into atlas.
8. Add metadata JSON.
9. Test in billboard debug room.

### 25.2 Debug Views

Add dev toggles:

- Show enemy facing direction
- Show player-to-enemy angle bucket
- Freeze enemy animation
- Cycle sprite angle manually
- Show collision circles
- Show spawn director pressure
- Show active enemy states

These will save a lot of time.

---

## 26. Risks

### 26.1 Art Cost Explosion

Billboard animation gets expensive quickly.

Mitigation:

- Start with 2 enemies.
- Use 5 angles first.
- Mirror left/right where possible.
- Keep animation frame counts low.
- Validate gameplay before final art.

### 26.2 Readability Problems

Flat sprites can look confusing in 3D.

Mitigation:

- Strong silhouettes.
- Blob shadows.
- Consistent enemy scale.
- Clear windups.
- Distinct audio cues.
- Avoid overly noisy backgrounds.

### 26.3 Web Performance

Lots of animated transparent planes can get expensive.

Mitigation:

- Texture atlases.
- Object pooling.
- Hard active enemy cap.
- Avoid dynamic material creation.
- Keep room geometry simple.
- Use unlit sprite materials.

### 26.4 Controls Feel Bad

FPS controls need to feel good immediately.

Mitigation:

- Tune mouse sensitivity early.
- Support pointer lock.
- Keep acceleration simple.
- Avoid head bob in MVP.
- Add settings for sensitivity and FOV.

---

## 27. Open Questions

- Should the visual style be pure black-and-white or mostly grayscale with accent colors?
- Should the game use fake 2D weapon sprites or simple 3D weapon models?
- Should enemies use 5 angles for MVP or go straight to 8?
- Should there be reloads, or should weapons be classic Doom-style?
- Should the room be authored manually or generated from a seed?
- Should the first public version have server leaderboards or local PB only?

---

## 28. Recommended First Build

Build the smallest fun version:

1. One room.
2. One pistol.
3. One enemy.
4. One billboard sprite sheet.
5. One health value.
6. One score counter.
7. One endless spawn loop.
8. One restart button.

Do not start with the whole art pipeline.

First prove:

- Movement feels good.
- Shooting feels good.
- Billboard enemies look charming instead of broken.
- The single-room survival loop is fun for 3 minutes.

Once that works, expand the art.

---

## 29. Post-MVP Product Plan

The MVP proves that Flatline can boot, move, shoot, spawn enemies, score a run, and submit leaderboards. The next goal is to make it feel like a real arcade shooter rather than a technical prototype.

### 29.1 Immediate Feel Pass

Fix the verbs before adding breadth:

- WASD must always match the camera direction.
- Every shot needs readable feedback: muzzle flash, visible bolt or tracer, hit flash, miss feedback, and audio.
- The first enemy should be centered in the starting view so the player can shoot within the first second.
- Movement should feel fast but controllable around pillars.
- The player should understand enemy damage range without reading text.

Done when a fresh player can start a run, move, shoot, kill the first enemy, and understand what happened without instruction.

### 29.2 Weapon Set V1

The first real weapon set should include three clear roles:

- Peashooter: infinite ammo, precise hitscan fallback, visible tracer.
- Boomstick: limited ammo, short range burst, wide pellet spread, strong knockback.
- Inkblaster: slow projectile, splash damage, strong area denial, self-risk at close range.

Ammo pickups should matter only after the Boomstick and Inkblaster exist. Until then, the pistol remains infinite.

### 29.3 Enemy Roster V1

Add enemy types by combat job, not by art novelty:

- Grunt: current baseline chaser and melee attacker.
- Skitter: fast low-health pressure enemy that forces tracking and movement.
- Brute: slow high-health blocker that soaks damage and creates pathing pressure.

Each new enemy needs:

- Pure state tests.
- Distinct silhouette.
- Distinct speed and attack timing.
- Clear hurt and death feedback.
- Spawn director budget cost.

### 29.4 Room State V1

The room should change during a run without becoming a maze:

- Door states: closed, warning, open, cooling down.
- Lighting intensity tied to pressure.
- One moving cover element that cycles predictably.
- Breakable or reactive props for juice, not tactics at first.
- More visible landmarks on each wall.

The room must remain readable at high pressure. Add one state change at a time and smoke it in browser.

### 29.5 Hazard Set V1

Hazards should be simple, telegraphed, and score-relevant:

- Flame vent lane: line hazard from wall to center.
- Ink pool: circular floor hazard that slows and damages.
- Falling light: delayed impact marker with burst damage.

Hazard rules:

- Telegraph before damage.
- Never spawn directly under the player without warning.
- Scale frequency with director pressure.
- Reward kills or movement that happen near active hazards.

### 29.6 Scoring V2

Keep the scoreboard arcade-readable:

- Survival time remains baseline score.
- Kills remain primary score.
- Combo grows from quick consecutive kills.
- Close-range kills add risk bonus.
- Weapon variety adds small bonus.
- No-damage streak adds survival mastery bonus.
- Accuracy remains summary data and a small bonus, not the main score.

Leaderboard rows should eventually display score, time, kills, and accuracy.

### 29.7 Daily Room V2

Daily mode should become deterministic beyond the date string:

- Seeded spawn sequence.
- Seeded pickup schedule.
- Seeded hazard schedule.
- Fixed room state pattern.
- Daily leaderboard uses the same seed for everyone.

The daily route should show the seed and submit only to the daily board by default.

### 29.8 Practice Mode

Practice mode should not submit scores.

Required controls:

- Enemy type selection.
- Spawn rate selection.
- Damage on or off.
- Infinite ammo toggle.
- Billboard debug overlays.
- Room state freeze.

This mode is for tuning and art validation, not the default player experience.

### 29.9 Content Completion Target

The first version beyond MVP is ready when it has:

- 3 weapons.
- 3 enemy types.
- 3 hazard types.
- 1 room with changing states.
- Shared all-time and daily leaderboards.
- Practice mode.
- Production smoke checks after deploy.
- Enough browser-visible feedback that the game reads as intentional, not placeholder-only.
