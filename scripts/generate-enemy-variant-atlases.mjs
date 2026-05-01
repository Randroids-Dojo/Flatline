import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const cell = 192
const columns = 8
const rows = 10
const width = cell * columns
const height = cell * rows
const angles = ['front', 'frontRight', 'right', 'backRight', 'back', 'backLeft', 'left', 'frontLeft']

const colors = {
  ink: [18, 18, 18, 255],
  dark: [28, 28, 26, 255],
  outline: [244, 241, 232, 255],
  teal: [80, 209, 192, 255],
  tealDark: [23, 96, 90, 255],
  danger: [240, 90, 79, 255],
  bruteRed: [90, 36, 32, 255],
  shadow: [5, 5, 5, 190],
  gray: [58, 56, 52, 255]
}

const variants = [
  {
    type: 'skitter',
    draw: drawSkitter,
    durations: { idle: 105, hurt: 75, death: 95 }
  },
  {
    type: 'brute',
    draw: drawBrute,
    durations: { idle: 145, hurt: 110, death: 135 }
  }
]

function generateAtlases() {
  for (const variant of variants) {
    const pixels = new Uint8Array(width * height * 4)

    for (let index = 3; index < pixels.length; index += 4) {
      pixels[index] = 0
    }

    const draw = createDrawingContext(pixels)

    for (let angleIndex = 0; angleIndex < angles.length; angleIndex += 1) {
      for (let frame = 0; frame < 4; frame += 1) {
        variant.draw(draw, angleIndex, frame, 'idle')
      }

      for (let frame = 0; frame < 2; frame += 1) {
        variant.draw(draw, angleIndex, frame, 'hurt')
      }

      for (let frame = 0; frame < 4; frame += 1) {
        variant.draw(draw, angleIndex, frame, 'death')
      }
    }

    const atlas = createAtlas(variant.type, variant.durations)
    const directory = `public/assets/enemies/${variant.type}`
    mkdirSync(directory, { recursive: true })
    writeFileSync(`${directory}/${variant.type}.png`, writePng(pixels))
    writeFileSync(`${directory}/${variant.type}.atlas.json`, `${JSON.stringify(atlas, null, 2)}\n`)
  }
}

function drawSkitter(draw, angleIndex, frame, state) {
  const originX = angleIndex * cell
  const row = state === 'idle' ? frame : state === 'hurt' ? 4 + frame : 6 + frame
  const originY = row * cell
  const cx = originX + cell / 2
  const cy = originY + cell / 2
  const facing = (angleIndex / angles.length) * Math.PI * 2
  const side = Math.abs(Math.sin(facing))
  const back = Math.cos(facing) < -0.45
  const bob = state === 'idle' ? Math.sin(frame * Math.PI * 0.5) * 5 : 0
  const hurtLean = state === 'hurt' ? (frame === 0 ? -9 : 9) : 0
  const dead = state === 'death'
  const hurt = state === 'hurt'
  const bodyY = cy + 7 + bob
  const shellWidth = dead ? 55 : 45 - side * 11
  const shellHeight = dead ? 20 : 28

  draw.fillEllipse(cx, cy + 55, dead ? 58 : 42, dead ? 9 : 7, colors.shadow)

  if (dead) {
    draw.strokeLine(cx - 56, cy + 34, cx + 50, cy + 29, 4, colors.outline)
    draw.strokeLine(cx - 42, cy + 12, cx - 68, cy + 1, 3, colors.teal)
    draw.strokeLine(cx + 41, cy + 12, cx + 68, cy + 2, 3, colors.teal)
    draw.fillEllipse(cx, cy + 26, shellWidth, shellHeight, colors.outline)
    draw.fillEllipse(cx, cy + 26, shellWidth - 8, shellHeight - 6, colors.dark)
    draw.fillEllipse(cx - 14, cy + 22, 4, 4, colors.danger)
    draw.fillEllipse(cx + 18, cy + 22, 4, 4, colors.danger)
    return
  }

  const legs = [
    [-45, 14, -72, 28],
    [-34, 4, -66, -5],
    [-18, -9, -48, -31],
    [45, 14, 72, 28],
    [34, 4, 66, -5],
    [18, -9, 48, -31]
  ]

  for (const [x1, y1, x2, y2] of legs) {
    const sideLean = side * Math.sign(x1) * 8
    draw.strokeLine(cx + x1 + hurtLean, bodyY + y1, cx + x2 + sideLean, bodyY + y2 + bob * 0.4, 3.2, colors.outline)
    draw.strokeLine(cx + x1 + hurtLean, bodyY + y1, cx + x2 + sideLean, bodyY + y2 + bob * 0.4, 1.7, colors.tealDark)
  }

  const shell = [
    [cx - shellWidth + hurtLean, bodyY + 8],
    [cx - shellWidth * 0.6 + hurtLean, bodyY - shellHeight],
    [cx + shellWidth * 0.65 + hurtLean, bodyY - shellHeight + side * 6],
    [cx + shellWidth + hurtLean, bodyY + 8],
    [cx + shellWidth * 0.55, bodyY + shellHeight],
    [cx - shellWidth * 0.55, bodyY + shellHeight]
  ]
  draw.fillPolygon(expandPoints(shell, cx, bodyY, 1.14), colors.outline)
  draw.fillPolygon(shell, hurt ? colors.danger : colors.ink)
  draw.fillEllipse(cx + hurtLean, bodyY + 3, shellWidth * 0.62, shellHeight * 0.56, hurt ? colors.bruteRed : colors.dark)

  if (back && !hurt) {
    draw.strokeLine(cx - 25, bodyY - 4, cx + 25, bodyY - 8, 3, colors.outline)
    return
  }

  const eyeSpread = 18 - side * 11
  draw.fillEllipse(cx - eyeSpread + hurtLean, bodyY - 10, hurt ? 8 : 6, hurt ? 5 : 6, hurt ? colors.danger : colors.teal)
  draw.fillEllipse(cx + eyeSpread + hurtLean, bodyY - 9 + side * 2, hurt ? 8 : 6, hurt ? 5 : 6, hurt ? colors.danger : colors.teal)
  draw.strokeLine(cx - 16 + hurtLean, bodyY + 11, cx + 16 + hurtLean, bodyY + 10, 2.3, colors.outline)
}

function drawBrute(draw, angleIndex, frame, state) {
  const originX = angleIndex * cell
  const row = state === 'idle' ? frame : state === 'hurt' ? 4 + frame : 6 + frame
  const originY = row * cell
  const cx = originX + cell / 2
  const cy = originY + cell / 2
  const facing = (angleIndex / angles.length) * Math.PI * 2
  const side = Math.abs(Math.sin(facing))
  const back = Math.cos(facing) < -0.45
  const bob = state === 'idle' ? Math.sin(frame * Math.PI * 0.5) * 3 : 0
  const lean = state === 'hurt' ? (frame === 0 ? -8 : 8) : Math.sin(frame + facing) * 2
  const dead = state === 'death'
  const hurt = state === 'hurt'

  draw.fillEllipse(cx, cy + 62, dead ? 68 : 51, dead ? 12 : 10, colors.shadow)

  if (dead) {
    const slab = [
      [cx - 65, cy + 20],
      [cx - 45, cy - 12],
      [cx + 57, cy - 7],
      [cx + 72, cy + 24],
      [cx + 48, cy + 51],
      [cx - 54, cy + 48]
    ]
    draw.fillPolygon(expandPoints(slab, cx, cy, 1.1), colors.outline)
    draw.fillPolygon(slab, colors.bruteRed)
    draw.fillEllipse(cx - 24, cy + 16, 6, 5, colors.danger)
    draw.fillEllipse(cx + 25, cy + 17, 6, 5, colors.danger)
    draw.strokeLine(cx - 24, cy + 35, cx + 30, cy + 32, 3, colors.outline)
    return
  }

  const shoulderY = cy - 35 + bob
  const hipY = cy + 48 + bob
  const topY = cy - 60 + bob
  const halfWidth = 53 - side * 13
  const headWidth = 37 - side * 10
  const body = [
    [cx - halfWidth + lean, shoulderY],
    [cx - headWidth + lean * 0.5, topY],
    [cx + headWidth + lean * 0.5, topY + side * 5],
    [cx + halfWidth + lean, shoulderY],
    [cx + halfWidth * 0.88, hipY],
    [cx + halfWidth * 0.54, hipY + 20],
    [cx - halfWidth * 0.54, hipY + 20],
    [cx - halfWidth * 0.88, hipY]
  ]

  draw.fillPolygon(expandPoints(body, cx, cy, 1.13), colors.outline)
  draw.fillPolygon(body, hurt ? colors.bruteRed : colors.ink)
  draw.fillPolygon(expandPoints(body, cx, cy, 0.8), hurt ? [45, 22, 20, 255] : colors.gray)
  draw.strokeLine(cx - halfWidth * 0.72, shoulderY + 4, cx - halfWidth * 0.48, hipY - 4, 5, colors.outline)
  draw.strokeLine(cx + halfWidth * 0.72, shoulderY + 4, cx + halfWidth * 0.48, hipY - 4, 5, colors.outline)

  if (back && !hurt) {
    draw.strokeLine(cx - 31, cy - 34 + bob, cx + 31, cy - 38 + bob, 4, colors.outline)
    draw.strokeLine(cx - 41, cy + 2 + bob, cx + 41, cy - 2 + bob, 4, colors.tealDark)
    return
  }

  const eyeSpread = 20 - side * 10
  const eyeColor = hurt ? colors.danger : colors.teal
  draw.fillEllipse(cx - eyeSpread + lean, cy - 32 + bob, hurt ? 8 : 6, hurt ? 5 : 6, eyeColor)
  draw.fillEllipse(cx + eyeSpread + lean, cy - 31 + bob + side * 2, hurt ? 8 : 6, hurt ? 5 : 6, eyeColor)
  draw.strokeLine(cx - 28 + lean, cy - 7 + bob, cx + 28 + lean, cy - 10 + bob, 3.4, colors.outline)
  draw.strokeLine(cx - 30 + lean, cy + 7 + bob, cx + 30 + lean, cy + 5 + bob, 2.4, colors.tealDark)
}

function createDrawingContext(pixels) {
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

  return { fillEllipse, fillPolygon, strokeLine }
}

function expandPoints(points, cx, cy, scale) {
  return points.map(([x, y]) => [cx + (x - cx) * scale, cy + (y - cy) * scale])
}

function createAtlas(type, durations) {
  const atlas = {
    image: `${type}.png`,
    imageWidth: width,
    imageHeight: height,
    clips: []
  }

  for (const [angleIndex, angle] of angles.entries()) {
    atlas.clips.push({
      name: 'idle',
      angle,
      loop: true,
      frames: [0, 1, 2, 3].map((row) => frame(angleIndex, row, durations.idle))
    })
  }

  for (const [angleIndex, angle] of angles.entries()) {
    atlas.clips.push({
      name: 'hurt',
      angle,
      loop: false,
      frames: [4, 5].map((row) => frame(angleIndex, row, durations.hurt))
    })
  }

  for (const [angleIndex, angle] of angles.entries()) {
    atlas.clips.push({
      name: 'death',
      angle,
      loop: false,
      frames: [6, 7, 8, 9].map((row) => frame(angleIndex, row, durations.death))
    })
  }

  return atlas
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

generateAtlases()
