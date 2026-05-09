// Final post-processing pass for every generator script. Snaps each
// opaque pixel's RGB to the nearest entry in the canonical palette so
// drift between generators (slightly different weapon greens, slightly
// different enemy outlines, etc.) collapses to one shared color set.
// Alpha is preserved unchanged; transparent pixels stay transparent.
//
// Mutates the buffer in place and returns it.

import { snapToPalette } from './art-palette.mjs'

export function finishAsset(rgba) {
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3]

    // Skip fully transparent pixels (alpha 0). Partially transparent
    // pixels still get color-snapped because they often carry the same
    // shadow-tinted RGB used in opaque areas.
    if (a === 0) continue

    const snapped = snapToPalette(rgba[i], rgba[i + 1], rgba[i + 2])
    rgba[i] = snapped[0]
    rgba[i + 1] = snapped[1]
    rgba[i + 2] = snapped[2]
  }

  return rgba
}
