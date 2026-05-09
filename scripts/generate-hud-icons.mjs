// HUD icon generator. 32x32 rubber-hose icons for HUD pills that do not
// already ship a sprite (health, score, time, kills, combo, wave). Each
// icon is built from primitive polygon points; a deterministic per-vertex
// "roughen" pass perturbs points by a seeded amount so straight lines
// turn into wobbly hand-drawn lines without any third-party dependency.
//
// Output: public/assets/hud/{name}.png. All icons run through
// finishAsset so they snap to the canonical palette (slice 2).

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { finishAsset } from './finish-asset.mjs'

const outputDir = 'public/assets/hud'
const ink = [9, 9, 9, 255]
const outline = [244, 241, 232, 255]
const teal = [80, 209, 192, 255]
const danger = [240, 90, 79, 255]
const gold = [255, 236, 160, 255]
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

writeFileSync(`${outputDir}/health.png`, renderAt(32, 32, drawHealth))
writeFileSync(`${outputDir}/score.png`, renderAt(32, 32, drawScore))
writeFileSync(`${outputDir}/time.png`, renderAt(32, 32, drawTime))
writeFileSync(`${outputDir}/kills.png`, renderAt(32, 32, drawKills))
writeFileSync(`${outputDir}/combo.png`, renderAt(32, 32, drawCombo))
writeFileSync(`${outputDir}/wave.png`, renderAt(32, 32, drawWave))

function renderAt(w, h, drawFn) {
  width = w
  height = h
  const pixels = new Uint8Array(width * height * 4)
  drawFn(pixels)
  finishAsset(pixels)
  return writePng(pixels)
}

// Roughen a polygon's vertices by a deterministic seeded perturbation.
// `amplitude` is the max pixel offset; using a tiny LCG keeps the output
// stable across runs without pulling in an RNG dependency.
function roughen(points, seed, amplitude) {
  let state = seed >>> 0
  const noise = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return (state / 0xffffffff) * 2 - 1
  }
  return points.map(([x, y]) => [x + noise() * amplitude, y + noise() * amplitude])
}

function drawHealth(pixels) {
  // Heart: two top lobes + bottom point. Built from a 14-vertex polygon
  // around the silhouette; inner danger fill plus an outline pass gives
  // the cartoon ink-edge feel.
  const cx = width / 2
  const cy = height / 2 + 1
  const pts = [
    [cx, cy + 11],
    [cx - 10, cy + 1],
    [cx - 13, cy - 4],
    [cx - 12, cy - 9],
    [cx - 8, cy - 12],
    [cx - 4, cy - 11],
    [cx - 1, cy - 7],
    [cx, cy - 5],
    [cx + 1, cy - 7],
    [cx + 4, cy - 11],
    [cx + 8, cy - 12],
    [cx + 12, cy - 9],
    [cx + 13, cy - 4],
    [cx + 10, cy + 1]
  ]
  const fill = roughen(pts, 0x1234, 0.6)
  const ringOuter = roughen(pts, 0x4321, 1.0)

  drawOutline(pixels, ringOuter, 1.5, ink)
  fillPolygon(pixels, fill, danger)
}

function drawScore(pixels) {
  // Five-pointed star: classic arcade-coin read.
  const cx = width / 2
  const cy = height / 2
  const pts = []

  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 === 0 ? 12 : 5
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r])
  }

  drawOutline(pixels, roughen(pts, 0xa1b2, 1.0), 1.5, ink)
  fillPolygon(pixels, roughen(pts, 0xc3d4, 0.5), gold)
}

function drawTime(pixels) {
  // Hourglass: two triangles meeting at center, with frame caps.
  const cx = width / 2
  const cy = height / 2
  const top = [
    [cx - 10, cy - 12],
    [cx + 10, cy - 12],
    [cx + 1, cy],
    [cx - 1, cy]
  ]
  const bottom = [
    [cx - 1, cy],
    [cx + 1, cy],
    [cx + 10, cy + 12],
    [cx - 10, cy + 12]
  ]
  const cap = (y) => [
    [cx - 12, y - 1],
    [cx + 12, y - 1],
    [cx + 12, y + 1],
    [cx - 12, y + 1]
  ]

  fillPolygon(pixels, roughen(top, 0x5678, 0.5), teal)
  fillPolygon(pixels, roughen(bottom, 0x6789, 0.5), teal)
  drawOutline(pixels, roughen(top, 0x789a, 1.0), 1, ink)
  drawOutline(pixels, roughen(bottom, 0x89ab, 1.0), 1, ink)
  fillPolygon(pixels, cap(cy - 12), ink)
  fillPolygon(pixels, cap(cy + 12), ink)
}

function drawKills(pixels) {
  // Skull: round head with two eye sockets and a jaw line. Reads as a
  // kill counter without needing typography.
  const cx = width / 2
  const cy = height / 2 - 1
  const head = []

  for (let i = 0; i < 16; i += 1) {
    const angle = (i * Math.PI * 2) / 16
    head.push([cx + Math.cos(angle) * 11, cy + Math.sin(angle) * 11])
  }

  drawOutline(pixels, roughen(head, 0xbcde, 0.6), 1.5, ink)
  fillPolygon(pixels, roughen(head, 0xdef0, 0.3), outline)

  // Eye sockets.
  fillEllipse(pixels, cx - 4, cy - 1, 2, 3, ink)
  fillEllipse(pixels, cx + 4, cy - 1, 2, 3, ink)

  // Jaw line bar.
  fillPolygon(pixels, [
    [cx - 6, cy + 6],
    [cx + 6, cy + 6],
    [cx + 6, cy + 7],
    [cx - 6, cy + 7]
  ], ink)
}

function drawCombo(pixels) {
  // Lightning bolt: two stacked Z-strokes for a streak read.
  const cx = width / 2
  const cy = height / 2
  const bolt = [
    [cx - 5, cy - 12],
    [cx + 4, cy - 12],
    [cx - 1, cy - 2],
    [cx + 6, cy - 2],
    [cx - 4, cy + 12],
    [cx, cy + 2],
    [cx - 6, cy + 2]
  ]

  drawOutline(pixels, roughen(bolt, 0xfeed, 0.8), 1.5, ink)
  fillPolygon(pixels, roughen(bolt, 0xface, 0.4), gold)
}

function drawWave(pixels) {
  // Stacked horizontal bars suggesting an oncoming wave / pressure.
  const cx = width / 2
  const cy = height / 2
  const bar = (y, w) => [
    [cx - w / 2, y - 1],
    [cx + w / 2, y - 1],
    [cx + w / 2, y + 1],
    [cx - w / 2, y + 1]
  ]

  drawOutline(pixels, roughen(bar(cy - 7, 16), 0xa11a, 0.8), 1, ink)
  drawOutline(pixels, roughen(bar(cy, 22), 0xb22b, 0.8), 1, ink)
  drawOutline(pixels, roughen(bar(cy + 7, 16), 0xc33c, 0.8), 1, ink)
  fillPolygon(pixels, roughen(bar(cy - 7, 16), 0xd44d, 0.4), teal)
  fillPolygon(pixels, roughen(bar(cy, 22), 0xe55e, 0.4), teal)
  fillPolygon(pixels, roughen(bar(cy + 7, 16), 0xf66f, 0.4), teal)
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
