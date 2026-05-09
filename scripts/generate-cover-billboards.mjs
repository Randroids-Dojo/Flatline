// Arena cover billboard generator. Produces hand-drawn PNGs for the
// REQ-021 cover types the GDD calls for: crate, partition, broken wall
// fragment, and hanging banner / prop. The pillar already exists in the
// arena renderer. Each billboard is built from primitive polygon points
// with the same deterministic seeded `roughen()` perturbation used in
// the HUD icon set, so straight edges turn wobbly without a third-party
// dep. All assets run through `finishAsset` for palette coherence.

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { finishAsset } from './finish-asset.mjs'

const outputDir = 'public/assets/cover'
const ink = [9, 9, 9, 255]
const teal = [80, 209, 192, 255]
const tealDark = [45, 116, 108, 255]
const danger = [240, 90, 79, 255]
const olive = [130, 126, 113, 255]
const brown = [92, 78, 64, 255]
const grayMid = [94, 94, 94, 255]
const grayLight = [168, 168, 168, 255]
const crcTable = new Uint32Array(256)

for (let index = 0; index < crcTable.length; index += 1) {
  let value = index

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }

  crcTable[index] = value >>> 0
}

let width = 0
let height = 0

mkdirSync(outputDir, { recursive: true })

writeFileSync(`${outputDir}/crate.png`, renderAt(96, 96, drawCrate))
writeFileSync(`${outputDir}/partition.png`, renderAt(64, 144, drawPartition))
writeFileSync(`${outputDir}/broken-wall.png`, renderAt(112, 96, drawBrokenWall))
writeFileSync(`${outputDir}/hanging-banner.png`, renderAt(96, 128, drawHangingBanner))

function renderAt(w, h, drawFn) {
  width = w
  height = h
  const pixels = new Uint8Array(width * height * 4)
  drawFn(pixels)
  finishAsset(pixels)
  return writePng(pixels)
}

// Stable per-vertex perturbation. Mirrors the helper in the HUD icon
// generator (deliberate copy: each generator stays self-contained so it
// can be re-run individually).
function roughen(points, seed, amplitude) {
  let state = seed >>> 0
  const noise = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return (state / 0xffffffff) * 2 - 1
  }
  return points.map(([x, y]) => [x + noise() * amplitude, y + noise() * amplitude])
}

function drawCrate(pixels) {
  // Wooden crate seen edge-on. Six-sided silhouette so the top edge
  // reads as a rim, three vertical plank lines for read.
  const cx = width / 2
  const cy = height / 2 + 4
  const halfW = 38
  const halfH = 32
  const body = [
    [cx - halfW, cy - halfH],
    [cx + halfW, cy - halfH],
    [cx + halfW + 2, cy + halfH],
    [cx - halfW - 2, cy + halfH]
  ]
  fillEllipse(pixels, cx, cy + halfH + 4, halfW + 2, 4, [0, 0, 0, 130])
  drawOutline(pixels, roughen(body, 0x4321, 1.2), 1.5, ink)
  fillPolygon(pixels, roughen(body, 0x6543, 0.6), brown)
  // Top rim (lighter line) and three plank seams.
  strokeLine(pixels, cx - halfW + 4, cy - halfH + 2, cx + halfW - 4, cy - halfH + 2, 1.2, olive)
  for (let i = 0; i < 3; i += 1) {
    const x = cx - halfW + 18 + i * 18
    strokeLine(pixels, x, cy - halfH + 4, x, cy + halfH - 4, 1, ink)
  }
  // Corner nails.
  fillEllipse(pixels, cx - halfW + 6, cy - halfH + 6, 1.5, 1.5, ink)
  fillEllipse(pixels, cx + halfW - 6, cy - halfH + 6, 1.5, 1.5, ink)
  fillEllipse(pixels, cx - halfW + 6, cy + halfH - 6, 1.5, 1.5, ink)
  fillEllipse(pixels, cx + halfW - 6, cy + halfH - 6, 1.5, 1.5, ink)
}

function drawPartition(pixels) {
  // Tall narrow broken-wall fragment that the player can hide behind.
  // Jagged top edge so it reads as crumbled rather than cut.
  const cx = width / 2
  const top = 12
  const bottom = height - 8
  const halfW = 22
  const slab = [
    [cx - halfW, bottom],
    [cx - halfW, top + 6],
    [cx - halfW + 4, top + 2],
    [cx - 6, top + 8],
    [cx - 2, top],
    [cx + 4, top + 4],
    [cx + 10, top - 2],
    [cx + halfW - 4, top + 4],
    [cx + halfW, top + 8],
    [cx + halfW, bottom]
  ]
  fillEllipse(pixels, cx, bottom + 2, halfW, 3, [0, 0, 0, 140])
  drawOutline(pixels, roughen(slab, 0x1357, 1.2), 1.5, ink)
  fillPolygon(pixels, roughen(slab, 0x9bdf, 0.7), grayMid)
  // Brick pattern: alternating offset stripes.
  for (let row = 0; row < 6; row += 1) {
    const y = top + 18 + row * 20
    if (y > bottom - 8) break
    const stagger = row % 2 === 0 ? 0 : 10
    strokeLine(pixels, cx - halfW + 4, y, cx + halfW - 4, y, 1, grayLight)
    strokeLine(pixels, cx - halfW + 4 + stagger, y - 8, cx - halfW + 4 + stagger, y, 1, grayLight)
    strokeLine(pixels, cx + 4 + stagger, y - 8, cx + 4 + stagger, y, 1, grayLight)
  }
}

function drawBrokenWall(pixels) {
  // Low broken stone chunk. Reads as half-height cover (player can shoot
  // over it but enemies can break line-of-sight against it).
  const cx = width / 2
  const baseY = height - 10
  const slab = [
    [cx - 50, baseY],
    [cx - 52, baseY - 32],
    [cx - 36, baseY - 44],
    [cx - 18, baseY - 38],
    [cx - 6, baseY - 50],
    [cx + 14, baseY - 46],
    [cx + 28, baseY - 54],
    [cx + 44, baseY - 36],
    [cx + 52, baseY - 30],
    [cx + 50, baseY]
  ]
  fillEllipse(pixels, cx, baseY + 4, 52, 4, [0, 0, 0, 140])
  drawOutline(pixels, roughen(slab, 0x2468, 1.4), 1.5, ink)
  fillPolygon(pixels, roughen(slab, 0xa0e1, 0.8), grayMid)
  // Cracks.
  strokeLine(pixels, cx - 16, baseY - 36, cx - 8, baseY - 12, 1, ink)
  strokeLine(pixels, cx + 18, baseY - 40, cx + 22, baseY - 8, 1, ink)
  // Top highlights.
  strokeLine(pixels, cx - 30, baseY - 40, cx + 36, baseY - 42, 1.2, grayLight)
}

function drawHangingBanner(pixels) {
  // Long narrow banner hanging from a horizontal pole near the top edge.
  // Reads as decor + occasional partial cover for tall enemies. Teal
  // ground + danger trim for "warning to all who pass" theatrical read.
  const cx = width / 2
  const ropeTop = 6
  const poleY = 12
  const bannerTop = poleY + 6
  const bannerBottom = height - 8
  const halfW = 26
  // Hanging rope from the ceiling.
  strokeLine(pixels, cx, ropeTop, cx, poleY, 1.5, ink)
  // Crossbar pole.
  fillPolygon(pixels, [
    [cx - halfW - 6, poleY - 2],
    [cx + halfW + 6, poleY - 2],
    [cx + halfW + 6, poleY + 2],
    [cx - halfW - 6, poleY + 2]
  ], brown)

  const banner = [
    [cx - halfW, bannerTop],
    [cx + halfW, bannerTop],
    [cx + halfW + 2, bannerBottom - 12],
    [cx + halfW - 4, bannerBottom],
    [cx + 6, bannerBottom - 6],
    [cx - 6, bannerBottom - 4],
    [cx - halfW + 4, bannerBottom],
    [cx - halfW - 2, bannerBottom - 12]
  ]
  drawOutline(pixels, roughen(banner, 0xbeef, 1.2), 1.5, ink)
  fillPolygon(pixels, roughen(banner, 0xcafe, 0.6), tealDark)
  // Trim band.
  strokeLine(pixels, cx - halfW + 2, bannerTop + 8, cx + halfW - 2, bannerTop + 8, 2, danger)
  strokeLine(pixels, cx - halfW + 2, bannerBottom - 18, cx + halfW - 2, bannerBottom - 18, 2, danger)
  // Center insignia: a teal star on the banner.
  const starPts = []
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 === 0 ? 9 : 4
    starPts.push([cx + Math.cos(angle) * r, (bannerTop + bannerBottom) / 2 + Math.sin(angle) * r])
  }
  drawOutline(pixels, roughen(starPts, 0xdead, 0.8), 1.2, ink)
  fillPolygon(pixels, roughen(starPts, 0xfade, 0.4), teal)
}

function drawOutline(pixels, points, radius, color) {
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index]
    const [x2, y2] = points[(index + 1) % points.length]
    strokeLine(pixels, x1, y1, x2, y2, radius, color)
  }
}

function setPixel(pixels, x, y, color) {
  const ix = Math.round(x)
  const iy = Math.round(y)

  if (ix < 0 || iy < 0 || ix >= width || iy >= height) {
    return
  }

  const offset = (iy * width + ix) * 4
  pixels[offset] = color[0]
  pixels[offset + 1] = color[1]
  pixels[offset + 2] = color[2]
  pixels[offset + 3] = color[3]
}

function fillEllipse(pixels, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry

      if (dx * dx + dy * dy <= 1) {
        setPixel(pixels, x, y, color)
      }
    }
  }
}

function fillPolygon(pixels, points, color) {
  const minY = Math.floor(Math.min(...points.map((point) => point[1])))
  const maxY = Math.ceil(Math.max(...points.map((point) => point[1])))

  for (let y = minY; y <= maxY; y += 1) {
    const intersections = []

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index]
      const next = points[(index + 1) % points.length]

      if ((current[1] <= y && next[1] > y) || (next[1] <= y && current[1] > y)) {
        intersections.push(current[0] + ((y - current[1]) / (next[1] - current[1])) * (next[0] - current[0]))
      }
    }

    intersections.sort((a, b) => a - b)

    for (let index = 0; index < intersections.length; index += 2) {
      for (let x = Math.ceil(intersections[index]); x <= Math.floor(intersections[index + 1] ?? intersections[index]); x += 1) {
        setPixel(pixels, x, y, color)
      }
    }
  }
}

function strokeLine(pixels, x1, y1, x2, y2, radius, color) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1)

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps
    fillEllipse(pixels, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, radius, radius, color)
  }
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, crc])
}

function writePng(pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height)

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1)
    raw[rowOffset] = 0
    raw.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), rowOffset + 1)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

function crc32(buffer) {
  let value = 0xffffffff

  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8)
  }

  return (value ^ 0xffffffff) >>> 0
}
