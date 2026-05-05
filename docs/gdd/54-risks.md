# Risks and Mitigations

**Status:** done

## Art cost explosion

Billboard animation gets expensive quickly.

Mitigation:

- Start with 2 enemies.
- Use 5 angles first.
- Mirror left/right where possible.
- Keep animation frame counts low.
- Validate gameplay before final art.

## Readability problems

Flat sprites can look confusing in 3D.

Mitigation:

- Strong silhouettes.
- Blob shadows.
- Consistent enemy scale.
- Clear windups.
- Distinct audio cues.
- Avoid overly noisy backgrounds.

## Web performance

Lots of animated transparent planes can get expensive.

Mitigation:

- Texture atlases.
- Object pooling.
- Hard active enemy cap.
- Avoid dynamic material creation.
- Keep room geometry simple.
- Use unlit sprite materials.

## Controls feel bad

FPS controls need to feel good immediately.

Mitigation:

- Tune mouse sensitivity early.
- Support pointer lock.
- Keep acceleration simple.
- Avoid head bob in MVP.
- Add settings for sensitivity and FOV.

### Build log

- 2026-05-03: Split out of `GDD.md`. Risk register; status `done` because the risks are documented and the listed mitigations are either applied (atlases, unlit materials, pointer lock) or queued in the post-MVP files. Re-evaluate when a new risk surfaces in `docs/FUN_FACTOR_AUDIT.md`.
