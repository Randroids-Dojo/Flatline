// Canonical Flatline art palette. Every generator script imports this
// and pipes its RGBA buffer through `scripts/finish-asset.mjs::finishAsset`
// before write so all sprites land on the same color set.
//
// Eyeballing the existing weapon and enemy outputs, the colors that read
// as on-style are: cream outline, near-black ink, four grayscale stops
// (from "shadow" to "highlight"), teal interactable + a darker teal for
// shading, danger red + a deeper red for shading, two muted browns for
// the boomstick / peashooter body, the warm muzzle-flash gold, and a
// vegetable green for the spitter tint. Twelve entries keeps the pass
// fast (linear scan per pixel) while absorbing the existing variants.

export const palette = [
  [9, 9, 9],        // ink (near-black)
  [34, 34, 34],     // gray-1 (deep)
  [94, 94, 94],     // gray-2 (mid)
  [168, 168, 168],  // gray-3 (light)
  [244, 241, 232],  // outline cream (highlight)
  [80, 209, 192],   // teal interactable
  [45, 116, 108],   // teal dark (inkblaster body)
  [240, 90, 79],    // danger red
  [162, 58, 50],    // danger dark
  [130, 126, 113],  // olive (peashooter body)
  [92, 78, 64],     // brown (boomstick body)
  [255, 236, 160]   // muzzle gold
]

export function snapToPalette(r, g, b) {
  let bestDist = Number.POSITIVE_INFINITY
  let best = palette[0]

  for (let i = 0; i < palette.length; i += 1) {
    const entry = palette[i]
    const dr = r - entry[0]
    const dg = g - entry[1]
    const db = b - entry[2]
    const dist = dr * dr + dg * dg + db * db

    if (dist < bestDist) {
      bestDist = dist
      best = entry
    }
  }

  return best
}
