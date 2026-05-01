import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const cell = 192
const columns = 8
const rows = 10
const width = cell * columns
const height = cell * rows
const angles = ['front', 'frontRight', 'right', 'backRight', 'back', 'backLeft', 'left', 'frontLeft']
const pixels = new Uint8Array(width * height * 4)

for (let index = 3; index < pixels.length; index += 4) {
  pixels[index] = 0
}

const ink = [18, 18, 18, 255]
const outline = [244, 241, 232, 255]
const teal = [80, 209, 192, 255]
const danger = [240, 90, 79, 255]
const shadow = [5, 5, 5, 190]
const gray = [55, 55, 52, 255]

function setPixel(x, y, color) {
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

function fillEllipse(cx, cy, rx, ry, color) {
  const minX = Math.floor(cx - rx)
  const maxX = Math.ceil(cx + rx)
  const minY = Math.floor(cy - ry)
  const maxY = Math.ceil(cy + ry)

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry

      if (dx * dx + dy * dy <= 1) {
        setPixel(x, y, color)
      }
    }
  }
}

function fillPolygon(points, color) {
  const minY = Math.floor(Math.min(...points.map((point) => point[1])))
  const maxY = Math.ceil(Math.max(...points.map((point) => point[1])))

  for (let y = minY; y <= maxY; y += 1) {
    const intersections = []

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index]
      const next = points[(index + 1) % points.length]

      if ((current[1] <= y && next[1] > y) || (next[1] <= y && current[1] > y)) {
        const x = current[0] + ((y - current[1]) / (next[1] - current[1])) * (next[0] - current[0])
        intersections.push(x)
      }
    }

    intersections.sort((a, b) => a - b)

    for (let index = 0; index < intersections.length; index += 2) {
      const start = Math.ceil(intersections[index])
      const end = Math.floor(intersections[index + 1] ?? intersections[index])

      for (let x = start; x <= end; x += 1) {
        setPixel(x, y, color)
      }
    }
  }
}

function strokeLine(x1, y1, x2, y2, radius, color) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1)

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps
    fillEllipse(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, radius, radius, color)
  }
}

function drawMouth(cx, cy, widthScale, smile, color) {
  const startX = cx - 18 * widthScale
  const endX = cx + 18 * widthScale
  let previous = null

  for (let step = 0; step <= 24; step += 1) {
    const t = step / 24
    const x = startX + (endX - startX) * t
    const y = cy + Math.sin(t * Math.PI) * smile

    if (previous) {
      strokeLine(previous[0], previous[1], x, y, 2.4, color)
    }

    previous = [x, y]
  }
}

function bodyPoints(cx, cy, facing, frame, state) {
  const squash = state === 'death' ? 0.35 : 1
  const bob = state === 'idle' ? Math.sin(frame * Math.PI * 0.5) * 4 : 0
  const lean = state === 'hurt' ? (frame === 0 ? -7 : 7) : Math.sin(frame * 1.7 + facing) * 3
  const side = Math.abs(Math.sin(facing))
  const back = Math.cos(facing) < -0.45
  const halfWidth = 34 - side * 8
  const topY = cy - 58 * squash + bob
  const bottomY = cy + 58 * squash + bob
  const shoulderY = cy - 34 * squash + bob
  const hipY = cy + 42 * squash + bob

  if (state === 'death') {
    return [
      [cx - 58, cy + 24],
      [cx - 42, cy - 2],
      [cx + 50, cy + 0],
      [cx + 63, cy + 27],
      [cx + 42, cy + 47],
      [cx - 49, cy + 48]
    ]
  }

  return [
    [cx - halfWidth + lean, shoulderY],
    [cx - halfWidth * 0.62 + lean * 0.4, topY],
    [cx + halfWidth * 0.62 + lean * 0.4, topY + (back ? 4 : 0)],
    [cx + halfWidth + lean, shoulderY],
    [cx + halfWidth * 0.82, hipY],
    [cx + halfWidth * 0.58, bottomY],
    [cx - halfWidth * 0.58, bottomY],
    [cx - halfWidth * 0.82, hipY]
  ]
}

function drawGrunt(col, row, angleIndex, frame, state) {
  const originX = col * cell
  const originY = row * cell
  const cx = originX + cell / 2
  const cy = originY + cell / 2
  const facing = (angleIndex / angles.length) * Math.PI * 2
  const side = Math.abs(Math.sin(facing))
  const back = Math.cos(facing) < -0.45
  const hurt = state === 'hurt'
  const dead = state === 'death'
  const body = bodyPoints(cx, cy, facing, frame, state)

  fillEllipse(cx, cy + 59, dead ? 54 : 38, dead ? 11 : 9, shadow)
  fillPolygon(expandPoints(body, cx, cy, 1.16), outline)
  fillPolygon(body, hurt ? [48, 30, 30, 255] : ink)
  fillPolygon(expandPoints(body, cx, cy, 0.78), dead ? gray : [27, 27, 26, 255])

  if (!dead) {
    const haloY = cy - 72 + Math.sin(frame + angleIndex) * 3
    fillEllipse(cx, haloY, 23 - side * 6, 7, teal)
    fillEllipse(cx, haloY, 17 - side * 5, 4, [15, 15, 15, 255])
  }

  if (back && !hurt) {
    strokeLine(cx - 20, cy - 29, cx + 20, cy - 34, 3.5, outline)
    strokeLine(cx - 22, cy - 5, cx + 22, cy - 5, 3.5, outline)
    return
  }

  if (dead) {
    fillEllipse(cx - 18, cy + 14, 5, 5, danger)
    fillEllipse(cx + 20, cy + 14, 5, 5, danger)
    strokeLine(cx - 18, cy + 30, cx + 18, cy + 25, 2.4, outline)
    return
  }

  const eyeSpread = 17 - side * 8
  const eyeY = cy - 29 + (hurt ? -2 : 0)
  const eyeColor = hurt ? danger : teal
  fillEllipse(cx - eyeSpread, eyeY, hurt ? 7 : 6, hurt ? 5 : 6, eyeColor)
  fillEllipse(cx + eyeSpread, eyeY + side * 2, hurt ? 7 : 6, hurt ? 5 : 6, eyeColor)
  drawMouth(cx, cy - 2, 1 - side * 0.35, hurt ? -5 : 9, outline)
}

function expandPoints(points, cx, cy, scale) {
  return points.map(([x, y]) => [cx + (x - cx) * scale, cy + (y - cy) * scale])
}

for (let angleIndex = 0; angleIndex < angles.length; angleIndex += 1) {
  for (let frame = 0; frame < 4; frame += 1) {
    drawGrunt(angleIndex, frame, angleIndex, frame, 'idle')
  }

  for (let frame = 0; frame < 2; frame += 1) {
    drawGrunt(angleIndex, 4 + frame, angleIndex, frame, 'hurt')
  }

  for (let frame = 0; frame < 4; frame += 1) {
    drawGrunt(angleIndex, 6 + frame, angleIndex, frame, 'death')
  }
}

const atlas = {
  image: 'grunt.png',
  imageWidth: width,
  imageHeight: height,
  clips: []
}

for (const [angleIndex, angle] of angles.entries()) {
  atlas.clips.push({
    name: 'idle',
    angle,
    loop: true,
    frames: [0, 1, 2, 3].map((row) => frame(angleIndex, row, 125))
  })
}

for (const [angleIndex, angle] of angles.entries()) {
  atlas.clips.push({
    name: 'hurt',
    angle,
    loop: false,
    frames: [4, 5].map((row) => frame(angleIndex, row, 85))
  })
}

for (const [angleIndex, angle] of angles.entries()) {
  atlas.clips.push({
    name: 'death',
    angle,
    loop: false,
    frames: [6, 7, 8, 9].map((row) => frame(angleIndex, row, 110))
  })
}

function frame(column, row, durationMs) {
  return {
    x: column * cell,
    y: row * cell,
    w: cell,
    h: cell,
    durationMs
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

function writePng() {
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
  header[10] = 0
  header[11] = 0
  header[12] = 0

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

const crcTable = new Uint32Array(256)

for (let index = 0; index < crcTable.length; index += 1) {
  let value = index

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }

  crcTable[index] = value >>> 0
}

function crc32(buffer) {
  let value = 0xffffffff

  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8)
  }

  return (value ^ 0xffffffff) >>> 0
}

writeFileSync('public/assets/enemies/grunt/grunt.png', writePng())
writeFileSync('public/assets/enemies/grunt/grunt.atlas.json', `${JSON.stringify(atlas, null, 2)}\n`)
