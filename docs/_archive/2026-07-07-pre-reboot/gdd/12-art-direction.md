# Art Direction

**Status:** partial

A spooky cartoon shooter.

Possible directions considered:

- Black-and-white rubber hose horror
- Muted 1930s cartoon with selective accent colors
- Cardboard horror diorama
- Ink-and-paper nightmare
- Vintage animation meets Doom

Chosen MVP style (decided in Q-001):

- Mostly grayscale
- Teal accent color for interactables
- Red danger color for damage and hazards
- Thick outlines
- Bouncy animation
- High contrast silhouettes

## Why mostly grayscale

Grayscale makes the billboard characters feel more like old animation. But readability needs help.

Use brightness, shape, movement, and contrast:

- Pickups bounce
- Doors pulse
- Enemies have strong silhouettes
- Hazards flash before activating
- Important objects are brighter
- Background clutter is darker
- Damage uses screen flash and audio

### Build log

- 2026-05-03: Split out of `GDD.md`. Decision recorded as Q-001. Pre-spiral implementation lays the grayscale-plus-accents palette inside `src/components/FlatlineGame.tsx` and the placeholder enemy / weapon sprites under `public/assets/`. Final hand-drawn pass still pending; status remains `partial` until the readability pillar is verified in playtest (PLAYTEST.md "Variety and surprise" + "Audio and feel").
