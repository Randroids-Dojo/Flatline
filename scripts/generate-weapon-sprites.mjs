import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { finishAsset } from './finish-asset.mjs'

const outputDir = 'public/assets/weapons'
const weapons = [
  { id: 'peashooter', body: [130, 126, 113, 255], accent: [80, 209, 192, 255], barrel: 42, muzzle: 16 },
  { id: 'boomstick', body: [92, 78, 64, 255], accent: [240, 90, 79, 255], barrel: 82, muzzle: 26 },
  { id: 'inkblaster', body: [45, 116, 108, 255], accent: [80, 209, 192, 255], barrel: 58, muzzle: 22 }
]
const outline = [244, 241, 232, 255]
const dark = [9, 9, 9, 255]
const flash = [255, 236, 160, 255]
const glow = [240, 90, 79, 190]
const emberGlow = [240, 130, 70, 110]
const reloadFrameCount = 4
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

for (const weapon of weapons) {
  writeFileSync(`${outputDir}/${weapon.id}-idle.png`, renderAt(384, 256, (pixels) => drawWeapon(pixels, weapon, 'idle')))
  writeFileSync(`${outputDir}/${weapon.id}-fire.png`, renderAt(384, 256, (pixels) => drawWeapon(pixels, weapon, 'fire')))
  writeFileSync(`${outputDir}/${weapon.id}-cooldown.png`, renderAt(384, 256, (pixels) => drawWeapon(pixels, weapon, 'cooldown')))

  for (let frame = 0; frame < reloadFrameCount; frame += 1) {
    writeFileSync(
      `${outputDir}/${weapon.id}-reload-${frame}.png`,
      renderAt(384, 256, (pixels) => drawWeapon(pixels, weapon, 'reload', { reloadProgress: frame / (reloadFrameCount - 1) }))
    )
  }

  writeFileSync(`${outputDir}/${weapon.id}-pickup.png`, renderAt(64, 64, (pixels) => drawWeaponIcon(pixels, weapon, 'pickup')))
  writeFileSync(`${outputDir}/${weapon.id}-hud.png`, renderAt(32, 32, (pixels) => drawWeaponIcon(pixels, weapon, 'hud')))
}

function renderAt(w, h, drawFn) {
  width = w
  height = h
  const pixels = new Uint8Array(width * height * 4)
  drawFn(pixels)
  finishAsset(pixels)
  return writePng(pixels)
}

function drawWeapon(pixels, weapon, mode, opts = {}) {
  const cx = width / 2
  const baseY = height - 6
  // Cooldown nudges the gun a few pixels down + back from the recoil position
  // so it reads as "just fired" without the visible flash. Reload tilts the
  // whole rig from 0 to 90 deg around the grip so the player sees the gun
  // being broken open across the four frames.
  const recoilOffsetY = mode === 'cooldown' ? 6 : 0
  const reloadAngle = mode === 'reload' ? (opts.reloadProgress ?? 0) * (Math.PI / 2) : 0

  const tx = (x, y) => {
    if (reloadAngle === 0) return [x, y + recoilOffsetY]
    const dx = x - cx
    const dy = y - baseY
    const cos = Math.cos(reloadAngle)
    const sin = Math.sin(reloadAngle)
    return [cx + dx * cos - dy * sin, baseY + dx * sin + dy * cos + recoilOffsetY]
  }

  const bodyPoints = [
    [cx - 68, baseY],
    [cx - 60, baseY - 86],
    [cx - 36, baseY - 138],
    [cx + 36, baseY - 138],
    [cx + 60, baseY - 86],
    [cx + 68, baseY]
  ]
  const body = bodyPoints.map(([x, y]) => tx(x, y))
  const inner = bodyPoints
    .map(([x, y]) => [cx + (x - cx) * 0.82, baseY + (y - baseY) * 0.88])
    .map(([x, y]) => tx(x, y))

  const barrelLeft = cx - weapon.barrel / 2
  const barrelRight = cx + weapon.barrel / 2
  const [shadowX, shadowY] = tx(cx, baseY - 18)

  fillEllipse(pixels, shadowX, shadowY, 88, 20, [0, 0, 0, 150])
  fillPolygon(pixels, body, outline)
  fillPolygon(pixels, inner, weapon.body)
  fillPolygon(pixels, [
    tx(barrelLeft, baseY - 148),
    tx(barrelRight, baseY - 148),
    tx(barrelRight - 8, baseY - 70),
    tx(barrelLeft + 8, baseY - 70)
  ], dark)
  fillPolygon(pixels, [
    tx(barrelLeft + 8, baseY - 138),
    tx(barrelRight - 8, baseY - 138),
    tx(barrelRight - 15, baseY - 80),
    tx(barrelLeft + 15, baseY - 80)
  ], [20, 20, 20, 255])

  const [muzzleX, muzzleY] = tx(cx, baseY - 151)
  fillEllipse(pixels, muzzleX, muzzleY, weapon.muzzle, 10, outline)
  fillEllipse(pixels, muzzleX, muzzleY, weapon.muzzle - 7, 5, dark)

  const [accentX, accentY] = tx(cx, baseY - 54)
  fillEllipse(pixels, accentX, accentY, 18, 8, weapon.accent)

  if (weapon.id === 'boomstick') {
    const [a1x, a1y] = tx(cx - 34, baseY - 136)
    const [a2x, a2y] = tx(cx - 34, baseY - 74)
    const [b1x, b1y] = tx(cx + 34, baseY - 136)
    const [b2x, b2y] = tx(cx + 34, baseY - 74)
    strokeLine(pixels, a1x, a1y, a2x, a2y, 3, outline)
    strokeLine(pixels, b1x, b1y, b2x, b2y, 3, outline)
  }

  if (weapon.id === 'inkblaster') {
    const [t1x, t1y] = tx(cx - 40, baseY - 76)
    const [t2x, t2y] = tx(cx + 40, baseY - 76)
    fillEllipse(pixels, t1x, t1y, 16, 24, weapon.accent)
    fillEllipse(pixels, t2x, t2y, 16, 24, weapon.accent)
  }

  if (mode === 'fire') {
    fillEllipse(pixels, muzzleX, muzzleY - 22, weapon.muzzle + 34, weapon.muzzle + 20, glow)
    fillPolygon(pixels, [
      tx(cx, baseY - 210),
      tx(cx + 24, baseY - 168),
      tx(cx + 5, baseY - 172),
      tx(cx, baseY - 143),
      tx(cx - 7, baseY - 172),
      tx(cx - 25, baseY - 166)
    ], flash)
  } else if (mode === 'cooldown') {
    // Fading ember halo: smaller and dimmer than the fire glow, no spike.
    fillEllipse(pixels, muzzleX, muzzleY - 8, weapon.muzzle + 14, weapon.muzzle + 6, emberGlow)
  }
}

function drawWeaponIcon(pixels, weapon, mode) {
  // Pickup is 64x64; HUD is 32x32. Silhouette-only renders, scaled to fit
  // and centered on the canvas. Pickup gets a small tilt so it reads as
  // a collectible rather than a held weapon. The source weapon geometry
  // has its origin at the grip (sourceCx, sourceBaseY); the centroid for
  // centering sits roughly halfway up the body.
  const cx = width / 2
  const cy = height / 2
  const sourceCx = 192
  const sourceBaseY = 250
  const sourceCentroidY = sourceBaseY - 74 // middle of the body extent
  const sourceWidth = 136
  const sourceHeight = 148
  const scale = Math.min(width / sourceWidth, height / sourceHeight) * 0.85
  const tilt = mode === 'pickup' ? -Math.PI / 6 : 0
  const cos = Math.cos(tilt)
  const sin = Math.sin(tilt)

  const tx = (x, y) => {
    const dx = (x - sourceCx) * scale
    const dy = (y - sourceCentroidY) * scale
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
  }

  const bodyFill = mode === 'hud' ? weapon.accent : weapon.body
  const barrelFill = mode === 'hud' ? weapon.accent : dark
  const accentColor = weapon.accent
  const body = [
    tx(sourceCx - 68, sourceBaseY),
    tx(sourceCx - 60, sourceBaseY - 86),
    tx(sourceCx - 36, sourceBaseY - 138),
    tx(sourceCx + 36, sourceBaseY - 138),
    tx(sourceCx + 60, sourceBaseY - 86),
    tx(sourceCx + 68, sourceBaseY)
  ]
  const barrelLeft = sourceCx - weapon.barrel / 2
  const barrelRight = sourceCx + weapon.barrel / 2
  const barrel = [
    tx(barrelLeft, sourceBaseY - 148),
    tx(barrelRight, sourceBaseY - 148),
    tx(barrelRight - 8, sourceBaseY - 70),
    tx(barrelLeft + 8, sourceBaseY - 70)
  ]

  // Outline pass first so the silhouette reads against the HUD bg.
  if (mode === 'hud') {
    drawOutline(pixels, body, 1, outline)
  } else if (mode === 'pickup') {
    drawOutline(pixels, body, 1, outline)
  }
  fillPolygon(pixels, body, bodyFill)
  fillPolygon(pixels, barrel, barrelFill)

  if (mode === 'pickup') {
    // Accent dot reads as the weapon's "hot" element on the small icon.
    const [aX, aY] = tx(sourceCx, sourceBaseY - 54)
    fillEllipse(pixels, aX, aY, Math.max(2, 4 * scale), Math.max(1, 2 * scale), accentColor)
  }
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
