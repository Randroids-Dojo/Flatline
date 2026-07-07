// Shared ink-drawing primitives for the rubber-hose look: thick wobbly
// outlines, flat grayscale fills, and per-frame jitter ("line boil"). Every
// draw call takes a boil seed; drawing the same art with a different seed
// produces the hand-redrawn wobble of 1930s cels when frames alternate.

import { mulberry32 } from '@/game/rng'

export const INK = '#101010'
export const PAPER = '#e8e4da'
export const GRAY_LIGHT = '#c9c4b8'
export const GRAY_MID = '#8f8a80'
export const GRAY_DARK = '#4a4741'

export type Ctx = CanvasRenderingContext2D

export function makeCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('2d context unavailable')
  }
  return { canvas, ctx }
}

export type Boil = (amount?: number) => number

// A deterministic jitter source for one drawing pass.
export function makeBoil(seed: number): Boil {
  const rng = mulberry32(seed)
  return (amount = 1.5) => (rng() - 0.5) * 2 * amount
}

export function inkStyle(ctx: Ctx, width = 4) {
  ctx.strokeStyle = INK
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

// Wobbly line: subdivided with per-vertex jitter.
export function boilLine(ctx: Ctx, boil: Boil, x0: number, y0: number, x1: number, y1: number, wobble = 1.2) {
  const segments = Math.max(2, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 14))
  ctx.beginPath()
  ctx.moveTo(x0 + boil(wobble), y0 + boil(wobble))
  for (let i = 1; i <= segments; i++) {
    const t = i / segments
    ctx.lineTo(x0 + (x1 - x0) * t + boil(wobble), y0 + (y1 - y0) * t + boil(wobble))
  }
  ctx.stroke()
}

// Wobbly ellipse outline with optional fill.
export function boilEllipse(
  ctx: Ctx,
  boil: Boil,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string | null,
  wobble = 1.2,
  rotation = 0
) {
  const steps = 18
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const px = Math.cos(a) * rx + boil(wobble)
    const py = Math.sin(a) * ry + boil(wobble)
    const rxp = px * Math.cos(rotation) - py * Math.sin(rotation)
    const ryp = px * Math.sin(rotation) + py * Math.cos(rotation)
    if (i === 0) {
      ctx.moveTo(cx + rxp, cy + ryp)
    } else {
      ctx.lineTo(cx + rxp, cy + ryp)
    }
  }
  ctx.closePath()
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  ctx.stroke()
}

// Noodle limb: a thick curved stroke through a control point.
export function noodle(
  ctx: Ctx,
  boil: Boil,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  width: number
) {
  ctx.save()
  inkStyle(ctx, width)
  ctx.beginPath()
  ctx.moveTo(x0 + boil(), y0 + boil())
  ctx.quadraticCurveTo(cx + boil(2), cy + boil(2), x1 + boil(), y1 + boil())
  ctx.stroke()
  ctx.restore()
}

// Four-finger cartoon glove.
export function glove(ctx: Ctx, boil: Boil, x: number, y: number, r: number) {
  ctx.save()
  inkStyle(ctx, 3)
  boilEllipse(ctx, boil, x, y, r, r * 0.9, '#f4f1e8', 1)
  for (let i = 0; i < 3; i++) {
    const a = -0.7 + i * 0.7
    boilEllipse(ctx, boil, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.35, r * 0.3, '#f4f1e8', 0.6)
  }
  ctx.restore()
}

// Pie-cut eye: black pupil with a wedge of white taken out.
export function pieEye(ctx: Ctx, boil: Boil, x: number, y: number, r: number, look = 0) {
  ctx.save()
  ctx.fillStyle = PAPER
  ctx.beginPath()
  ctx.ellipse(x, y, r * 1.5, r * 1.7, 0, 0, Math.PI * 2)
  ctx.fill()
  inkStyle(ctx, 3)
  ctx.stroke()
  ctx.fillStyle = INK
  ctx.beginPath()
  const px = x + look * r * 0.5 + boil(0.5)
  const py = y + boil(0.5)
  ctx.moveTo(px, py)
  ctx.arc(px, py, r, Math.PI * 0.15, Math.PI * 1.85)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// X eye for knocked-out characters.
export function deadEye(ctx: Ctx, boil: Boil, x: number, y: number, r: number) {
  ctx.save()
  inkStyle(ctx, 3.5)
  boilLine(ctx, boil, x - r, y - r, x + r, y + r, 0.8)
  boilLine(ctx, boil, x + r, y - r, x - r, y + r, 0.8)
  ctx.restore()
}

// Halftone dot shading inside a rectangle, classic print texture.
export function halftone(ctx: Ctx, x: number, y: number, w: number, h: number, spacing: number, radius: number, color = GRAY_MID) {
  ctx.save()
  ctx.fillStyle = color
  for (let py = y; py < y + h; py += spacing) {
    const offset = (Math.floor((py - y) / spacing) % 2) * spacing * 0.5
    for (let px = x + offset; px < x + w; px += spacing) {
      ctx.beginPath()
      ctx.arc(px, py, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

// Ink star burst for muzzle flashes and impacts.
export function inkStar(ctx: Ctx, boil: Boil, x: number, y: number, points: number, rOuter: number, rInner: number, fill = PAPER) {
  ctx.save()
  inkStyle(ctx, 3)
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const r = (i % 2 === 0 ? rOuter : rInner) + boil(2)
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

// Ink splat: irregular blob used for damage feedback and death puddles.
export function inkSplat(ctx: Ctx, boil: Boil, x: number, y: number, r: number) {
  ctx.save()
  ctx.fillStyle = INK
  ctx.beginPath()
  const lobes = 9
  for (let i = 0; i <= lobes; i++) {
    const a = (i / lobes) * Math.PI * 2
    const rr = r * (0.6 + Math.abs(boil(0.5)) * 1.4)
    const px = x + Math.cos(a) * rr
    const py = y + Math.sin(a) * rr * 0.7
    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.quadraticCurveTo(
        x + Math.cos(a - Math.PI / lobes) * rr * 1.3,
        y + Math.sin(a - Math.PI / lobes) * rr,
        px,
        py
      )
    }
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
