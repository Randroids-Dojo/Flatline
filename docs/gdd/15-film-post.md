# Film post pass

**Status:** done

Three presets copied from the reference game's option structure, selectable on the title screen and pause menu, persisted in localStorage:

- Studio Cut: light grain, minimal diffusion.
- Director's Cut (default): grain plus UI diffusion glow.
- Vintage Cut: heavy grain, diffusion, and wear.

Implementation: a 2D overlay canvas above the WebGL view redraws at about 12Hz with tiled animated noise, one-frame vertical scratches, dust flecks, and a radial vignette; the render root gets a CSS grayscale/contrast/blur filter approximating projection diffusion. The overlay uses overlay blending so grain modulates the scene rather than sitting on it.

Motion QA rule 10 coverage: e2e asserts the overlay pixels actually change over time and that Vintage draws denser wear than Studio.

### Build log

- 2026-07-07: grain, scratches, vignette, presets, and motion tests. Files: `src/art/film.ts`, `tests/film-motion.spec.ts`. PR #172.
