// First-person weapon viewmodels: gloved hands and cartoon hardware drawn
// on transparent canvases, displayed at the bottom of the screen with
// Doom's bob formula. Fire frames get the spiky ink-star muzzle flash.

import { hashString } from '@/game/rng'
import type { WeaponId } from '@/game/weapons'
import { GRAY_DARK, GRAY_LIGHT, GRAY_MID, INK, PAPER, boilEllipse, glove, inkStar, inkStyle, makeBoil, makeCanvas, noodle, type Boil, type Ctx } from './ink'

export const VIEW_W = 420
export const VIEW_H = 300

export type ViewFrame = 'idle' | 'fire'

function fist(ctx: Ctx, boil: Boil, x: number, y: number, r: number) {
  inkStyle(ctx, 5)
  boilEllipse(ctx, boil, x, y, r, r * 0.85, '#f4f1e8', 1.4)
  inkStyle(ctx, 3)
  for (let i = 0; i < 3; i++) {
    boilEllipse(ctx, boil, x - r * 0.5 + i * r * 0.5, y - r * 0.55, r * 0.24, r * 0.2, '#f4f1e8', 0.6)
  }
}

function drawPaws(ctx: Ctx, boil: Boil, fire: boolean) {
  const cx = VIEW_W / 2
  if (fire) {
    noodle(ctx, boil, cx + 150, VIEW_H + 40, cx + 90, VIEW_H - 60, cx + 10, VIEW_H - 150, 22)
    fist(ctx, boil, cx + 10, VIEW_H - 150, 44)
    inkStar(ctx, boil, cx + 10, VIEW_H - 190, 6, 26, 12)
  } else {
    noodle(ctx, boil, cx - 190, VIEW_H + 40, cx - 150, VIEW_H - 30, cx - 110, VIEW_H - 80, 22)
    fist(ctx, boil, cx - 110, VIEW_H - 80, 38)
    noodle(ctx, boil, cx + 190, VIEW_H + 40, cx + 150, VIEW_H - 30, cx + 110, VIEW_H - 80, 22)
    fist(ctx, boil, cx + 110, VIEW_H - 80, 38)
  }
}

function drawSnub(ctx: Ctx, boil: Boil, fire: boolean) {
  const cx = VIEW_W / 2 + 40
  const y = VIEW_H - (fire ? 18 : 0)
  ctx.save()
  ctx.translate(cx, y)
  ctx.rotate(-0.18)
  // Arm from the bottom edge into the glove.
  noodle(ctx, boil, 90, 90, 40, 30, 4, -34, 24)
  // Revolver: barrel, frame, cylinder, grip. Drawn dark against the scene.
  inkStyle(ctx, 4)
  ctx.fillStyle = GRAY_DARK
  // Grip.
  ctx.save()
  ctx.rotate(0.35)
  ctx.fillRect(-10, -66, 22, 34)
  ctx.strokeRect(-10, -66, 22, 34)
  ctx.restore()
  // Frame and barrel pointing up-screen.
  ctx.fillStyle = INK
  ctx.fillRect(-11, -132, 24, 66)
  ctx.strokeRect(-11, -132, 24, 66)
  // Cylinder bulge.
  boilEllipse(ctx, boil, 1, -78, 20, 17, GRAY_MID, 1)
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.arc(1, -78, 5, 0, Math.PI * 2)
  ctx.fill()
  // Front sight.
  ctx.fillRect(-3, -140, 8, 9)
  // Glove wrapped around the grip.
  glove(ctx, boil, 2, -30, 26)
  if (fire) {
    inkStar(ctx, boil, 1, -168, 7, 38, 16)
  }
  ctx.restore()
}

function drawScattergun(ctx: Ctx, boil: Boil, fire: boolean) {
  const cx = VIEW_W / 2
  const y = VIEW_H - (fire ? 20 : 0)
  inkStyle(ctx, 4)
  // Long barrel angled to screen center.
  ctx.fillStyle = GRAY_DARK
  ctx.save()
  ctx.translate(cx + 40, y)
  ctx.rotate(-0.5)
  ctx.fillRect(-20, -190, 26, 160)
  ctx.strokeRect(-20, -190, 26, 160)
  ctx.fillStyle = GRAY_MID
  ctx.fillRect(-24, -50, 34, 60)
  ctx.strokeRect(-24, -50, 34, 60)
  ctx.restore()
  glove(ctx, boil, cx + 6, y - 60, 24)
  glove(ctx, boil, cx + 58, y - 16, 26)
  if (fire) {
    inkStar(ctx, boil, cx - 52, y - 208, 8, 44, 20)
  }
}

function drawChatter(ctx: Ctx, boil: Boil, fire: boolean) {
  const cx = VIEW_W / 2
  const y = VIEW_H - (fire ? 12 : 0)
  inkStyle(ctx, 4)
  ctx.save()
  ctx.translate(cx + 30, y)
  ctx.rotate(-0.35)
  // Barrel.
  ctx.fillStyle = GRAY_DARK
  ctx.fillRect(-14, -170, 20, 120)
  ctx.strokeRect(-14, -170, 20, 120)
  // Body.
  ctx.fillStyle = GRAY_MID
  ctx.fillRect(-22, -60, 40, 54)
  ctx.strokeRect(-22, -60, 40, 54)
  // Drum magazine.
  boilEllipse(ctx, boil, -2, 16, 30, 30, GRAY_DARK, 1.2)
  boilEllipse(ctx, boil, -2, 16, 10, 10, GRAY_MID, 0.8)
  ctx.restore()
  glove(ctx, boil, cx + 12, y - 88, 24)
  glove(ctx, boil, cx + 46, y - 20, 26)
  if (fire) {
    inkStar(ctx, boil, cx - 26, y - 196, 7, 38, 16)
  }
}

function drawLobber(ctx: Ctx, boil: Boil, fire: boolean) {
  const cx = VIEW_W / 2
  if (fire) {
    // Arm mid-throw, stick leaving the top of the frame.
    noodle(ctx, boil, cx + 170, VIEW_H + 40, cx + 90, VIEW_H - 120, cx + 20, VIEW_H - 200, 22)
    glove(ctx, boil, cx + 20, VIEW_H - 200, 30)
    inkStar(ctx, boil, cx + 20, VIEW_H - 240, 5, 18, 8)
  } else {
    noodle(ctx, boil, cx + 170, VIEW_H + 40, cx + 110, VIEW_H - 40, cx + 60, VIEW_H - 90, 22)
    glove(ctx, boil, cx + 60, VIEW_H - 90, 30)
    // TNT stick with fuse.
    ctx.save()
    inkStyle(ctx, 4)
    ctx.translate(cx + 60, VIEW_H - 120)
    ctx.rotate(0.3)
    ctx.fillStyle = GRAY_DARK
    ctx.fillRect(-12, -40, 24, 62)
    ctx.strokeRect(-12, -40, 24, 62)
    ctx.fillStyle = PAPER
    ctx.fillRect(-12, -14, 24, 12)
    ctx.restore()
    inkStar(ctx, boil, cx + 78, VIEW_H - 168, 5, 12, 6)
  }
}

function drawRaygun(ctx: Ctx, boil: Boil, fire: boolean) {
  const cx = VIEW_W / 2 + 50
  const y = VIEW_H - 60 - (fire ? 16 : 0)
  inkStyle(ctx, 4)
  // Bulbous ray gun with fins.
  boilEllipse(ctx, boil, cx, y - 40, 34, 26, GRAY_LIGHT, 1.2)
  ctx.fillStyle = GRAY_DARK
  ctx.fillRect(cx - 10, y - 92, 20, 34)
  ctx.strokeRect(cx - 10, y - 92, 20, 34)
  boilEllipse(ctx, boil, cx, y - 96, 16, 8, GRAY_MID, 1)
  // Fins.
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(cx + side * 30, y - 44)
    ctx.lineTo(cx + side * 52, y - 58)
    ctx.lineTo(cx + side * 30, y - 26)
    ctx.closePath()
    ctx.fillStyle = GRAY_MID
    ctx.fill()
    ctx.stroke()
  }
  glove(ctx, boil, cx, y + 8, 26)
  noodle(ctx, boil, cx + 60, VIEW_H + 30, cx + 34, y + 42, cx + 8, y + 20, 20)
  if (fire) {
    inkStar(ctx, boil, cx, y - 118, 9, 30, 14)
  }
}

function drawBigCheese(ctx: Ctx, boil: Boil, fire: boolean) {
  const cx = VIEW_W / 2
  const y = VIEW_H - (fire ? 24 : 0)
  inkStyle(ctx, 5)
  // A comically large cheese-shaped cannon held with both hands.
  boilEllipse(ctx, boil, cx, y - 60, 80, 54, GRAY_LIGHT, 1.8)
  ctx.fillStyle = GRAY_MID
  for (const [hx, hy, r] of [
    [cx - 30, y - 76, 12],
    [cx + 26, y - 48, 10],
    [cx + 6, y - 90, 8]
  ]) {
    ctx.beginPath()
    ctx.arc(hx, hy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  // Muzzle.
  boilEllipse(ctx, boil, cx, y - 118, 30, 14, INK, 1.2)
  glove(ctx, boil, cx - 74, y - 30, 28)
  glove(ctx, boil, cx + 74, y - 30, 28)
  if (fire) {
    inkStar(ctx, boil, cx, y - 150, 10, 52, 24)
  }
}

const DRAWERS: Record<WeaponId, (ctx: Ctx, boil: Boil, fire: boolean) => void> = {
  paws: drawPaws,
  snub: drawSnub,
  scattergun: drawScattergun,
  chatter: drawChatter,
  lobber: drawLobber,
  raygun: drawRaygun,
  bigcheese: drawBigCheese
}

export type ViewmodelSet = Record<ViewFrame, HTMLCanvasElement[]>

export function drawViewmodel(weapon: WeaponId): ViewmodelSet {
  const set = {} as ViewmodelSet
  for (const frame of ['idle', 'fire'] as ViewFrame[]) {
    set[frame] = [0, 1].map((variant) => {
      const { canvas, ctx } = makeCanvas(VIEW_W, VIEW_H)
      const boil = makeBoil(hashString(`vm-${weapon}-${frame}-${variant}`))
      DRAWERS[weapon](ctx, boil, frame === 'fire')
      return canvas
    })
  }
  return set
}
