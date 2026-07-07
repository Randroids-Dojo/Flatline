// The status-bar mugshot: our mouse detective, reacting like Doomguy.
// Five health tiers get progressively more battered; expressions cover
// idle glances, pain, the new-weapon grin, and lights-out.

import { hashString } from '@/game/rng'
import { GRAY_MID, INK, PAPER, boilEllipse, boilLine, deadEye, inkStyle, makeBoil, makeCanvas, pieEye } from './ink'

export const MUG_SIZE = 96

export type MugExpression = 'idle' | 'pain' | 'grin' | 'dead'

// tier 0 = healthy .. 4 = nearly flat; matches Doom's 80/60/40/20 bands.
export function mugTierForHp(hp: number, maxHp: number): number {
  const pct = (hp / Math.max(1, maxHp)) * 100
  if (pct >= 80) return 0
  if (pct >= 60) return 1
  if (pct >= 40) return 2
  if (pct >= 20) return 3
  return 4
}

export function drawMugshot(tier: number, expression: MugExpression, look: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(MUG_SIZE, MUG_SIZE)
  const boil = makeBoil(hashString(`mug-${tier}-${expression}-${look}`))
  const cx = MUG_SIZE / 2
  const cy = MUG_SIZE / 2 + 8

  ctx.save()
  if (expression === 'pain') {
    ctx.translate(0, 2)
  }

  // Head with round mouse ears.
  inkStyle(ctx, 4)
  boilEllipse(ctx, boil, cx - 24, cy - 26, 13, 13, PAPER, 1)
  boilEllipse(ctx, boil, cx + 24, cy - 26, 13, 13, PAPER, 1)
  boilEllipse(ctx, boil, cx, cy, 30, 28, PAPER, 1.2)

  // Snout and nose.
  boilEllipse(ctx, boil, cx, cy + 12, 16, 10, PAPER, 1)
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.arc(cx, cy + 8, 4, 0, Math.PI * 2)
  ctx.fill()

  // Whiskers, progressively bent by tier.
  inkStyle(ctx, 2)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const droop = tier * 2 + i * 3
      boilLine(ctx, boil, cx + side * 12, cy + 10 + i * 4, cx + side * 34, cy + 6 + i * 5 + droop, 1)
    }
  }

  // Eyes.
  if (expression === 'dead') {
    deadEye(ctx, boil, cx - 11, cy - 8, 5)
    deadEye(ctx, boil, cx + 11, cy - 8, 5)
  } else if (expression === 'pain') {
    inkStyle(ctx, 3.5)
    boilLine(ctx, boil, cx - 16, cy - 10, cx - 5, cy - 6, 0.8)
    boilLine(ctx, boil, cx + 5, cy - 6, cx + 16, cy - 10, 0.8)
  } else {
    pieEye(ctx, boil, cx - 11, cy - 8, 4.4, look)
    pieEye(ctx, boil, cx + 11, cy - 8, 4.4, look)
  }

  // Brows get angrier when hurt.
  if (expression !== 'dead') {
    inkStyle(ctx, 3.5)
    const angle = Math.min(4, tier + (expression === 'pain' ? 2 : 0))
    boilLine(ctx, boil, cx - 18, cy - 18, cx - 4, cy - 16 + angle, 0.8)
    boilLine(ctx, boil, cx + 4, cy - 16 + angle, cx + 18, cy - 18, 0.8)
  }

  // Mouth.
  inkStyle(ctx, 3)
  if (expression === 'grin') {
    ctx.beginPath()
    ctx.arc(cx, cy + 16, 10, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
  } else if (expression === 'pain') {
    boilEllipse(ctx, boil, cx, cy + 20, 6, 4, INK, 0.8)
  } else if (expression === 'dead') {
    boilLine(ctx, boil, cx - 8, cy + 20, cx + 8, cy + 20, 1)
  } else {
    const grim = tier * 1.5
    boilLine(ctx, boil, cx - 8, cy + 19 + grim, cx + 8, cy + 19, 1)
  }

  // Battle damage per tier: bandage, black eye, loose ear stitches.
  if (tier >= 2) {
    ctx.fillStyle = PAPER
    ctx.fillRect(cx - 30, cy - 24, 16, 10)
    inkStyle(ctx, 2.5)
    ctx.strokeRect(cx - 30, cy - 24, 16, 10)
    boilLine(ctx, boil, cx - 26, cy - 24, cx - 26, cy - 14, 0.6)
  }
  if (tier >= 3) {
    ctx.fillStyle = GRAY_MID
    ctx.beginPath()
    ctx.arc(cx + 11, cy - 8, 8, 0, Math.PI * 2)
    ctx.fill()
    if (expression !== 'dead') {
      pieEye(ctx, boil, cx + 11, cy - 8, 3.6, look)
    }
  }
  if (tier >= 4 && expression !== 'dead') {
    // Dazed stars.
    inkStyle(ctx, 2)
    boilEllipse(ctx, boil, cx - 26, cy - 38, 5, 5, PAPER, 0.8)
    boilEllipse(ctx, boil, cx + 28, cy - 40, 4, 4, PAPER, 0.8)
  }

  // Fedora.
  ctx.fillStyle = INK
  boilEllipse(ctx, boil, cx, cy - 26, 34, 8, INK, 1)
  ctx.fillRect(cx - 20, cy - 52, 40, 26)
  inkStyle(ctx, 3)
  ctx.strokeRect(cx - 20, cy - 52, 40, 26)
  ctx.fillStyle = GRAY_MID
  ctx.fillRect(cx - 20, cy - 34, 40, 7)

  ctx.restore()
  return canvas
}
