import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const width = 384
const height = 256
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
const crcTable = new Uint32Array(256)

for (let index = 0; index < crcTable.length; index += 1) {
  let value = index

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }

  crcTable[index] = value >>> 0
}

mkdirSync(outputDir, { recursive: true })

for (const weapon of weapons) {
  writeFileSync(`${outputDir}/${weapon.id}-idle.png`, createWeaponPng(weapon, false))
  writeFileSync(`${outputDir}/${weapon.id}-fire.png`, createWeaponPng(weapon, true))
}

function createWeaponPng(weapon, firing) {
  const pixels = new Uint8Array(width * height * 4)

  drawWeapon(pixels, weapon, firing)
  return writePng(pixels)
}

function drawWeapon(pixels, weapon, firing) {
  const cx = width / 2
  const baseY = height - 6
  const body = [
    [cx - 68, baseY],
    [cx - 60, baseY - 86],
    [cx - 36, baseY - 138],
    [cx + 36, baseY - 138],
    [cx + 60, baseY - 86],
    [cx + 68, baseY]
  ]
  const inner = body.map(([x, y]) => [cx + (x - cx) * 0.82, baseY + (y - baseY) * 0.88])
  const barrelLeft = cx - weapon.barrel / 2
  const barrelRight = cx + weapon.barrel / 2

  fillEllipse(pixels, cx, baseY - 18, 88, 20, [0, 0, 0, 150])
  fillPolygon(pixels, body, outline)
  fillPolygon(pixels, inner, weapon.body)
  fillPolygon(pixels, [
    [barrelLeft, baseY - 148],
    [barrelRight, baseY - 148],
    [barrelRight - 8, baseY - 70],
    [barrelLeft + 8, baseY - 70]
  ], dark)
  fillPolygon(pixels, [
    [barrelLeft + 8, baseY - 138],
    [barrelRight - 8, baseY - 138],
    [barrelRight - 15, baseY - 80],
    [barrelLeft + 15, baseY - 80]
  ], [20, 20, 20, 255])
  fillEllipse(pixels, cx, baseY - 151, weapon.muzzle, 10, outline)
  fillEllipse(pixels, cx, baseY - 151, weapon.muzzle - 7, 5, dark)
  fillEllipse(pixels, cx, baseY - 54, 18, 8, weapon.accent)

  if (weapon.id === 'boomstick') {
    strokeLine(pixels, cx - 34, baseY - 136, cx - 34, baseY - 74, 3, outline)
    strokeLine(pixels, cx + 34, baseY - 136, cx + 34, baseY - 74, 3, outline)
  }

  if (weapon.id === 'inkblaster') {
    fillEllipse(pixels, cx - 40, baseY - 76, 16, 24, weapon.accent)
    fillEllipse(pixels, cx + 40, baseY - 76, 16, 24, weapon.accent)
  }

  if (firing) {
    fillEllipse(pixels, cx, baseY - 173, weapon.muzzle + 34, weapon.muzzle + 20, glow)
    fillPolygon(pixels, [
      [cx, baseY - 210],
      [cx + 24, baseY - 168],
      [cx + 5, baseY - 172],
      [cx, baseY - 143],
      [cx - 7, baseY - 172],
      [cx - 25, baseY - 166]
    ], flash)
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
