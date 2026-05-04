# Asset Pipeline

**Status:** done

## Recommended process

1. Draw enemy concept.
2. Create turnaround sheet.
3. Pick 5 or 8 angles.
4. Animate front angle first.
5. Validate in game.
6. Animate remaining angles only after movement feels good.
7. Pack frames into atlas.
8. Add metadata JSON.
9. Test in billboard debug room.

## Debug views

Add dev toggles:

- Show enemy facing direction
- Show player-to-enemy angle bucket
- Freeze enemy animation
- Cycle sprite angle manually
- Show collision circles
- Show spawn director pressure
- Show active enemy states

These will save a lot of time.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: pipeline doc at `docs/ART_PIPELINE.md`; generators at `scripts/generate-grunt-atlas.mjs`, `scripts/generate-enemy-variant-atlases.mjs`, `scripts/generate-weapon-sprites.mjs`. Debug toggles partly available via Practice mode (`docs/gdd/08-mode-practice.md`); a fuller debug overlay is part of post-MVP polish.
