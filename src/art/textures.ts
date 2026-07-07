// Procedural environment textures: flat grayscale fills with hand-inked
// lines, in the cel-over-painted-background tradition. Each wall texture is
// baked in two shades (Doom lights north-south walls differently from
// east-west) plus door and floor/ceiling tiles.

import { hashString, mulberry32 } from '@/game/rng'
import { GRAY_DARK, GRAY_LIGHT, GRAY_MID, INK, PAPER, inkStyle, makeBoil, makeCanvas, boilLine, halftone, type Ctx } from './ink'

const SIZE = 256

export type WallTheme = 'brick' | 'panel' | 'stone'

export function themeForRing(ring: number): WallTheme {
  const themes: WallTheme[] = ['brick', 'panel', 'stone']
  return themes[ring % themes.length]
}

function base(ctx: Ctx, fill: string) {
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, SIZE, SIZE)
}

export function drawBrickWall(seed: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(SIZE, SIZE)
  const boil = makeBoil(seed)
  base(ctx, GRAY_LIGHT)
  inkStyle(ctx, 4)
  const rows = 6
  const rowH = SIZE / rows
  for (let r = 0; r <= rows; r++) {
    boilLine(ctx, boil, 0, r * rowH, SIZE, r * rowH, 1.8)
  }
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : SIZE / 6
    for (let c = 0; c < 3; c++) {
      const x = ((offset + (c * SIZE) / 3) % SIZE + SIZE) % SIZE
      boilLine(ctx, boil, x, r * rowH, x, (r + 1) * rowH, 1.8)
    }
    // A few bricks get halftone shading for wear.
    const rng = mulberry32(seed + r)
    if (rng() < 0.6) {
      const bx = Math.floor(rng() * 3) * (SIZE / 3)
      halftone(ctx, bx + 12, r * rowH + 8, SIZE / 3 - 24, rowH - 16, 9, 1.6, GRAY_MID)
    }
  }
  return canvas
}

export function drawPanelWall(seed: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(SIZE, SIZE)
  const boil = makeBoil(seed)
  base(ctx, GRAY_MID)
  // Wainscoting: lighter upper wallpaper with pinstripes, dark wood below.
  ctx.fillStyle = GRAY_LIGHT
  ctx.fillRect(0, 0, SIZE, SIZE * 0.62)
  inkStyle(ctx, 3)
  for (let x = 12; x < SIZE; x += 24) {
    boilLine(ctx, boil, x, 6, x, SIZE * 0.6, 1.2)
  }
  ctx.fillStyle = GRAY_DARK
  ctx.fillRect(0, SIZE * 0.62, SIZE, SIZE * 0.38)
  inkStyle(ctx, 5)
  boilLine(ctx, boil, 0, SIZE * 0.62, SIZE, SIZE * 0.62, 1.6)
  inkStyle(ctx, 3)
  for (let x = 0; x < SIZE; x += 64) {
    boilLine(ctx, boil, x + 8, SIZE * 0.66, x + 8, SIZE - 8, 1.4)
  }
  return canvas
}

export function drawStoneWall(seed: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(SIZE, SIZE)
  const boil = makeBoil(seed)
  base(ctx, GRAY_DARK)
  inkStyle(ctx, 4)
  const rng = mulberry32(seed)
  let y = 0
  while (y < SIZE) {
    const rowH = 40 + rng() * 30
    boilLine(ctx, boil, 0, y, SIZE, y, 2.2)
    let x = rng() * 40
    while (x < SIZE) {
      boilLine(ctx, boil, x, y, x, Math.min(SIZE, y + rowH), 2.2)
      x += 50 + rng() * 60
    }
    y += rowH
  }
  halftone(ctx, 0, 0, SIZE, SIZE, 14, 1.4, 'rgba(16,16,16,0.5)')
  return canvas
}

export function drawWall(theme: WallTheme, seed: number): HTMLCanvasElement {
  return theme === 'brick' ? drawBrickWall(seed) : theme === 'panel' ? drawPanelWall(seed) : drawStoneWall(seed)
}

export function drawFloor(seed: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(SIZE, SIZE)
  const boil = makeBoil(seed)
  base(ctx, GRAY_MID)
  // Checkerboard tiles, worn.
  const tiles = 4
  const t = SIZE / tiles
  for (let r = 0; r < tiles; r++) {
    for (let c = 0; c < tiles; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = GRAY_LIGHT
        ctx.fillRect(c * t, r * t, t, t)
      }
    }
  }
  inkStyle(ctx, 3)
  for (let i = 0; i <= tiles; i++) {
    boilLine(ctx, boil, 0, i * t, SIZE, i * t, 1.5)
    boilLine(ctx, boil, i * t, 0, i * t, SIZE, 1.5)
  }
  return canvas
}

export function drawCeiling(seed: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(SIZE, SIZE)
  const boil = makeBoil(seed)
  base(ctx, '#3a3833')
  inkStyle(ctx, 3)
  for (let x = 0; x < SIZE; x += 32) {
    boilLine(ctx, boil, x, 0, x, SIZE, 1.2)
  }
  halftone(ctx, 0, 0, SIZE, SIZE, 16, 1.2, 'rgba(16,16,16,0.6)')
  return canvas
}

export function drawDoor(locked: boolean, seed: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(SIZE, SIZE)
  const boil = makeBoil(seed)
  base(ctx, locked ? GRAY_DARK : GRAY_MID)
  inkStyle(ctx, 6)
  ctx.strokeRect(6, 6, SIZE - 12, SIZE - 12)
  inkStyle(ctx, 4)
  // Panel lines.
  boilLine(ctx, boil, 24, 24, SIZE - 24, 24, 1.5)
  boilLine(ctx, boil, 24, 24, 24, SIZE - 24, 1.5)
  boilLine(ctx, boil, SIZE - 24, 24, SIZE - 24, SIZE - 24, 1.5)
  boilLine(ctx, boil, 24, SIZE - 24, SIZE - 24, SIZE - 24, 1.5)
  if (locked) {
    // Vault wheel.
    ctx.save()
    inkStyle(ctx, 7)
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, 46, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4
      boilLine(
        ctx,
        boil,
        SIZE / 2 + Math.cos(a) * 14,
        SIZE / 2 + Math.sin(a) * 14,
        SIZE / 2 + Math.cos(a) * 62,
        SIZE / 2 + Math.sin(a) * 62,
        1.2
      )
    }
    ctx.restore()
  } else {
    // Push plate and handle.
    ctx.fillStyle = GRAY_LIGHT
    ctx.fillRect(SIZE / 2 - 30, SIZE / 2 - 8, 60, 16)
    inkStyle(ctx, 3)
    ctx.strokeRect(SIZE / 2 - 30, SIZE / 2 - 8, 60, 16)
  }
  return canvas
}

// The office door back at the start: EXIT sign styling in reverse. Drawn as
// a plain door with lettering.
export function drawOfficeDoor(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(SIZE, SIZE)
  const boil = makeBoil(hashString('office-door'))
  base(ctx, GRAY_MID)
  inkStyle(ctx, 6)
  ctx.strokeRect(6, 6, SIZE - 12, SIZE - 12)
  // Frosted glass pane with lettering.
  ctx.fillStyle = PAPER
  ctx.fillRect(36, 30, SIZE - 72, 110)
  inkStyle(ctx, 4)
  ctx.strokeRect(36, 30, SIZE - 72, 110)
  ctx.fillStyle = INK
  ctx.font = 'bold 30px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('FLATLINE', SIZE / 2, 72)
  ctx.font = 'bold 20px Georgia, serif'
  ctx.fillText('DETECTIVE', SIZE / 2, 100)
  ctx.fillText('AGENCY', SIZE / 2, 124)
  boilLine(ctx, boil, 36, 140, SIZE - 36, 140, 1)
  return canvas
}
