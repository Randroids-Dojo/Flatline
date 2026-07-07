// Enemy, pickup, and projectile sprites, drawn as front-facing rubber-hose
// cartoon cels. Every animation frame is drawn twice with different boil
// seeds; the renderer alternates variants at ~10Hz for the hand-redrawn
// wobble.

import type { EnemyKind, PickupKind } from '@/game/dungeon'
import { hashString } from '@/game/rng'
import {
  GRAY_DARK,
  GRAY_LIGHT,
  GRAY_MID,
  INK,
  PAPER,
  boilEllipse,
  boilLine,
  deadEye,
  glove,
  inkSplat,
  inkStar,
  inkStyle,
  makeBoil,
  makeCanvas,
  noodle,
  pieEye,
  type Boil,
  type Ctx
} from './ink'

export const SPRITE_SIZE = 160

export type EnemyFrame = 'walkA' | 'walkB' | 'windup' | 'pain' | 'die1' | 'die2' | 'die3'

export const ENEMY_FRAMES: EnemyFrame[] = ['walkA', 'walkB', 'windup', 'pain', 'die1', 'die2', 'die3']

type CharacterSpec = {
  scale: number
  suit: string
  ears: 'rat' | 'shrew' | 'cat'
  hat: 'fedora' | 'bowler' | 'none'
  bulk: number
  weapon: 'revolver' | 'shotgun' | 'knife' | 'none' | 'cigar'
  tail: boolean
}

const SPECS: Record<EnemyKind, CharacterSpec> = {
  torpedo: { scale: 0.82, suit: GRAY_DARK, ears: 'rat', hat: 'fedora', bulk: 0.85, weapon: 'revolver', tail: true },
  capo: { scale: 0.88, suit: GRAY_MID, ears: 'rat', hat: 'bowler', bulk: 1.1, weapon: 'shotgun', tail: true },
  alleycat: { scale: 0.92, suit: GRAY_DARK, ears: 'shrew', hat: 'none', bulk: 0.75, weapon: 'knife', tail: true },
  bruiser: { scale: 1, suit: GRAY_MID, ears: 'rat', hat: 'none', bulk: 1.45, weapon: 'none', tail: true },
  fatcat: { scale: 1.1, suit: GRAY_DARK, ears: 'cat', hat: 'fedora', bulk: 1.6, weapon: 'cigar', tail: true }
}

type Pose = {
  legSwing: number
  armRaise: number
  flinch: boolean
  collapse: number // 0 standing .. 1 flat
  eyesDead: boolean
}

function poseForFrame(frame: EnemyFrame): Pose {
  switch (frame) {
    case 'walkA':
      return { legSwing: 1, armRaise: 0.15, flinch: false, collapse: 0, eyesDead: false }
    case 'walkB':
      return { legSwing: -1, armRaise: 0.15, flinch: false, collapse: 0, eyesDead: false }
    case 'windup':
      return { legSwing: 0.3, armRaise: 1, flinch: false, collapse: 0, eyesDead: false }
    case 'pain':
      return { legSwing: 0, armRaise: 0.4, flinch: true, collapse: 0, eyesDead: false }
    case 'die1':
      return { legSwing: 0, armRaise: 0.8, flinch: true, collapse: 0.25, eyesDead: true }
    case 'die2':
      return { legSwing: 0, armRaise: 0.3, flinch: true, collapse: 0.6, eyesDead: true }
    case 'die3':
      return { legSwing: 0, armRaise: 0, flinch: false, collapse: 1, eyesDead: true }
  }
}

function drawCharacter(ctx: Ctx, spec: CharacterSpec, pose: Pose, boil: Boil) {
  const S = SPRITE_SIZE
  const cx = S / 2
  const groundY = S - 10
  const squash = 1 - pose.collapse * 0.75
  const scale = spec.scale

  ctx.save()
  ctx.translate(cx, groundY)
  ctx.scale(scale, scale * squash)
  ctx.translate(0, pose.flinch ? 3 : 0)
  if (pose.flinch) {
    ctx.rotate(0.06)
  }

  const bodyW = 26 * spec.bulk
  const bodyH = 42
  const bodyY = -bodyH * 0.65
  const headR = 20
  const headY = bodyY - bodyH * 0.55 - headR * 0.4

  if (pose.collapse >= 1) {
    // Final frame: an ink puddle with feet sticking up.
    inkSplat(ctx, boil, 0, -6, 34)
    inkStyle(ctx, 4)
    boilEllipse(ctx, boil, -12, -18, 9, 5, INK, 1)
    boilEllipse(ctx, boil, 14, -16, 9, 5, INK, 1)
    ctx.restore()
    return
  }

  // Tail first, behind everything.
  if (spec.tail) {
    ctx.save()
    inkStyle(ctx, 4)
    ctx.beginPath()
    ctx.moveTo(bodyW * 0.5, bodyY + bodyH * 0.4)
    ctx.quadraticCurveTo(bodyW * 1.6 + boil(3), bodyY + 10 + boil(3), bodyW * 1.3 + boil(3), bodyY - 24 + boil(3))
    ctx.stroke()
    ctx.restore()
  }

  // Legs: noodles with big shoes.
  const legLift = pose.legSwing * 7
  inkStyle(ctx, 6)
  noodle(ctx, boil, -bodyW * 0.35, bodyY + bodyH * 0.42, -bodyW * 0.5, -14, -bodyW * 0.55 - legLift * 0.4, -4 - Math.max(0, legLift), 6)
  noodle(ctx, boil, bodyW * 0.35, bodyY + bodyH * 0.42, bodyW * 0.5, -14, bodyW * 0.55 + legLift * 0.4, -4 - Math.max(0, -legLift), 6)
  inkStyle(ctx, 3.5)
  boilEllipse(ctx, boil, -bodyW * 0.6 - legLift * 0.4, -3 - Math.max(0, legLift), 12, 6, INK, 1)
  boilEllipse(ctx, boil, bodyW * 0.6 + legLift * 0.4, -3 - Math.max(0, -legLift), 12, 6, INK, 1)

  // Body: pear-shaped suit.
  inkStyle(ctx, 4)
  boilEllipse(ctx, boil, 0, bodyY, bodyW, bodyH * 0.55, spec.suit, 1.4)
  // Shirt front + buttons.
  boilEllipse(ctx, boil, 0, bodyY + 4, bodyW * 0.45, bodyH * 0.4, PAPER, 1)
  ctx.fillStyle = INK
  for (let i = 0; i < 2; i++) {
    ctx.beginPath()
    ctx.arc(boil(1), bodyY - 2 + i * 12, 2.4, 0, Math.PI * 2)
    ctx.fill()
  }

  // Arms: one relaxed, one raised by armRaise (weapon arm).
  const raise = pose.armRaise
  noodle(ctx, boil, -bodyW * 0.8, bodyY - bodyH * 0.2, -bodyW * 1.5, bodyY + 10, -bodyW * 1.3, bodyY + 18 - raise * 6, 6)
  glove(ctx, boil, -bodyW * 1.3, bodyY + 18 - raise * 6, 7)
  const handX = bodyW * 1.35
  const handY = bodyY - raise * 34 + 14
  noodle(ctx, boil, bodyW * 0.8, bodyY - bodyH * 0.2, bodyW * 1.5, bodyY + 16 - raise * 40, handX, handY, 6)
  glove(ctx, boil, handX, handY, 7)

  // Weapon in the raised hand.
  ctx.save()
  inkStyle(ctx, 3.5)
  if (spec.weapon === 'revolver') {
    ctx.fillStyle = INK
    ctx.fillRect(handX - 2, handY - 12, 18, 7)
    ctx.fillRect(handX - 2, handY - 8, 6, 10)
  } else if (spec.weapon === 'shotgun') {
    ctx.fillStyle = INK
    ctx.fillRect(handX - 6, handY - 13, 30, 6)
    ctx.fillStyle = GRAY_DARK
    ctx.fillRect(handX - 12, handY - 9, 12, 6)
  } else if (spec.weapon === 'knife') {
    ctx.fillStyle = PAPER
    ctx.beginPath()
    ctx.moveTo(handX, handY - 8)
    ctx.lineTo(handX + 6, handY - 30)
    ctx.lineTo(handX + 12, handY - 8)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else if (spec.weapon === 'cigar') {
    ctx.fillStyle = GRAY_DARK
    ctx.fillRect(handX - 2, handY - 10, 14, 5)
    ctx.fillStyle = PAPER
    ctx.beginPath()
    ctx.arc(handX + 14, handY - 8, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // Head.
  inkStyle(ctx, 4)
  boilEllipse(ctx, boil, 0, headY, headR, headR * 0.95, PAPER, 1.4)
  // Ears.
  if (spec.ears === 'rat') {
    boilEllipse(ctx, boil, -headR * 0.8, headY - headR * 0.8, 9, 9, PAPER, 1)
    boilEllipse(ctx, boil, headR * 0.8, headY - headR * 0.8, 9, 9, PAPER, 1)
  } else if (spec.ears === 'cat') {
    ctx.save()
    ctx.fillStyle = PAPER
    inkStyle(ctx, 3.5)
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(side * headR * 0.4, headY - headR * 0.7)
      ctx.lineTo(side * headR * 1.1 + boil(1), headY - headR * 1.6 + boil(1))
      ctx.lineTo(side * headR * 1.05, headY - headR * 0.2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
    ctx.restore()
  } else {
    boilEllipse(ctx, boil, -headR * 0.9, headY - headR * 0.5, 6, 6, PAPER, 0.8)
    boilEllipse(ctx, boil, headR * 0.9, headY - headR * 0.5, 6, 6, PAPER, 0.8)
  }
  // Snout.
  const snout = spec.ears === 'shrew' ? 1.3 : 1
  boilEllipse(ctx, boil, 0, headY + headR * 0.45, headR * 0.55 * snout, headR * 0.35, PAPER, 1)
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.arc(0, headY + headR * 0.35, 3.4 * snout, 0, Math.PI * 2)
  ctx.fill()

  // Eyes.
  if (pose.eyesDead) {
    deadEye(ctx, boil, -headR * 0.42, headY - headR * 0.15, 5)
    deadEye(ctx, boil, headR * 0.42, headY - headR * 0.15, 5)
  } else {
    pieEye(ctx, boil, -headR * 0.42, headY - headR * 0.15, 4.6, pose.flinch ? 0 : 0.6)
    pieEye(ctx, boil, headR * 0.42, headY - headR * 0.15, 4.6, pose.flinch ? 0 : 0.6)
  }
  // Angry brows.
  inkStyle(ctx, 3.5)
  boilLine(ctx, boil, -headR * 0.75, headY - headR * 0.5, -headR * 0.15, headY - headR * 0.32, 0.8)
  boilLine(ctx, boil, headR * 0.15, headY - headR * 0.32, headR * 0.75, headY - headR * 0.5, 0.8)

  // Hat.
  if (spec.hat === 'fedora') {
    ctx.fillStyle = INK
    boilEllipse(ctx, boil, 0, headY - headR * 0.75, headR * 1.25, headR * 0.28, INK, 1)
    ctx.fillRect(-headR * 0.7, headY - headR * 1.7, headR * 1.4, headR)
    inkStyle(ctx, 3)
    ctx.strokeRect(-headR * 0.7, headY - headR * 1.7, headR * 1.4, headR)
    ctx.fillStyle = GRAY_MID
    ctx.fillRect(-headR * 0.7, headY - headR * 1, headR * 1.4, headR * 0.22)
  } else if (spec.hat === 'bowler') {
    boilEllipse(ctx, boil, 0, headY - headR * 0.72, headR * 1.15, headR * 0.24, INK, 1)
    boilEllipse(ctx, boil, 0, headY - headR * 1.05, headR * 0.75, headR * 0.55, INK, 1)
  }

  ctx.restore()
}

export type SpriteSheet = Record<EnemyFrame, HTMLCanvasElement[]>

export function drawEnemySprites(kind: EnemyKind): SpriteSheet {
  const spec = SPECS[kind]
  const sheet = {} as SpriteSheet
  for (const frame of ENEMY_FRAMES) {
    sheet[frame] = [0, 1].map((variant) => {
      const { canvas, ctx } = makeCanvas(SPRITE_SIZE, SPRITE_SIZE)
      const boil = makeBoil(hashString(`${kind}-${frame}-${variant}`))
      drawCharacter(ctx, spec, poseForFrame(frame), boil)
      return canvas
    })
  }
  return sheet
}

// --- Pickups ---

const PICKUP_SIZE = 96

function pickupCanvas(draw: (ctx: Ctx, boil: Boil) => void, seed: string): HTMLCanvasElement[] {
  return [0, 1].map((variant) => {
    const { canvas, ctx } = makeCanvas(PICKUP_SIZE, PICKUP_SIZE)
    const boil = makeBoil(hashString(`${seed}-${variant}`))
    ctx.save()
    ctx.translate(PICKUP_SIZE / 2, PICKUP_SIZE / 2)
    draw(ctx, boil)
    ctx.restore()
    return canvas
  })
}

function drawCoin(ctx: Ctx, boil: Boil) {
  inkStyle(ctx, 4)
  boilEllipse(ctx, boil, 0, 6, 22, 22, GRAY_LIGHT, 1.2)
  ctx.fillStyle = INK
  ctx.font = 'bold 26px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('$', 0, 16)
}

function drawCoinPile(ctx: Ctx, boil: Boil) {
  inkStyle(ctx, 3.5)
  boilEllipse(ctx, boil, -14, 18, 16, 15, GRAY_LIGHT, 1)
  boilEllipse(ctx, boil, 16, 16, 16, 15, GRAY_LIGHT, 1)
  boilEllipse(ctx, boil, 0, 0, 18, 17, GRAY_LIGHT, 1)
  ctx.fillStyle = INK
  ctx.font = 'bold 20px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('$', 0, 8)
}

function drawCheese(ctx: Ctx, boil: Boil, big: boolean) {
  inkStyle(ctx, 4)
  ctx.fillStyle = GRAY_LIGHT
  if (big) {
    // Cheese wheel with one wedge cut.
    boilEllipse(ctx, boil, 0, 8, 28, 18, GRAY_LIGHT, 1.4)
    boilLine(ctx, boil, 0, 8, 24, -4, 1)
    boilLine(ctx, boil, 0, 8, 8, -10, 1)
  } else {
    ctx.beginPath()
    ctx.moveTo(-24 + boil(), 22 + boil())
    ctx.lineTo(26 + boil(), 22 + boil())
    ctx.lineTo(20 + boil(), -16 + boil())
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  // Holes.
  ctx.fillStyle = GRAY_MID
  for (const [hx, hy, r] of [
    [6, 10, 4],
    [14, 2, 3],
    [-4, 16, 3]
  ]) {
    ctx.beginPath()
    ctx.arc(hx, hy, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawVest(ctx: Ctx, boil: Boil, heavy: boolean) {
  inkStyle(ctx, 4)
  ctx.fillStyle = heavy ? GRAY_DARK : GRAY_MID
  ctx.beginPath()
  ctx.moveTo(-20 + boil(), -20 + boil())
  ctx.lineTo(20 + boil(), -20 + boil())
  ctx.lineTo(24 + boil(), 24 + boil())
  ctx.lineTo(-24 + boil(), 24 + boil())
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  boilLine(ctx, boil, -10, -20, -10, 24, 1)
  boilLine(ctx, boil, 10, -20, 10, 24, 1)
  if (heavy) {
    ctx.fillStyle = GRAY_LIGHT
    ctx.beginPath()
    ctx.arc(0, 2, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

function drawAmmoBox(ctx: Ctx, boil: Boil, label: string) {
  inkStyle(ctx, 4)
  ctx.fillStyle = GRAY_MID
  ctx.fillRect(-24, -14, 48, 34)
  ctx.strokeRect(-24, -14, 48, 34)
  ctx.fillStyle = PAPER
  ctx.fillRect(-18, -8, 36, 16)
  ctx.fillStyle = INK
  ctx.font = 'bold 12px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, 0, 4)
  boilLine(ctx, boil, -24, 20, 24, 20, 1)
}

function drawKey(ctx: Ctx, boil: Boil) {
  inkStyle(ctx, 5)
  boilEllipse(ctx, boil, -10, -8, 12, 12, PAPER, 1)
  boilLine(ctx, boil, 0, 2, 20, 22, 1)
  boilLine(ctx, boil, 12, 14, 20, 8, 1)
  boilLine(ctx, boil, 16, 18, 24, 12, 1)
}

export function drawPickupSprites(): Record<PickupKind, HTMLCanvasElement[]> {
  return {
    coinSmall: pickupCanvas((ctx, boil) => drawCoin(ctx, boil), 'coin'),
    coinPile: pickupCanvas((ctx, boil) => drawCoinPile(ctx, boil), 'coinpile'),
    cheeseBit: pickupCanvas((ctx, boil) => drawCheese(ctx, boil, false), 'cheesebit'),
    cheeseWheel: pickupCanvas((ctx, boil) => drawCheese(ctx, boil, true), 'cheesewheel'),
    vest: pickupCanvas((ctx, boil) => drawVest(ctx, boil, false), 'vest'),
    trenchArmor: pickupCanvas((ctx, boil) => drawVest(ctx, boil, true), 'trench'),
    bullets: pickupCanvas((ctx, boil) => drawAmmoBox(ctx, boil, 'BULLETS'), 'bullets'),
    shells: pickupCanvas((ctx, boil) => drawAmmoBox(ctx, boil, 'SHELLS'), 'shells'),
    tnt: pickupCanvas((ctx, boil) => drawTntBundle(ctx, boil), 'tntammo'),
    cells: pickupCanvas((ctx, boil) => drawAmmoBox(ctx, boil, 'CELLS'), 'cells'),
    vaultKey: pickupCanvas((ctx, boil) => drawKey(ctx, boil), 'key')
  }
}

function drawTntBundle(ctx: Ctx, boil: Boil) {
  inkStyle(ctx, 3.5)
  ctx.fillStyle = GRAY_DARK
  for (const x of [-12, 0, 12]) {
    ctx.fillRect(x - 6, -18, 12, 40)
    ctx.strokeRect(x - 6, -18, 12, 40)
  }
  ctx.fillStyle = PAPER
  ctx.fillRect(-20, -4, 40, 12)
  ctx.strokeRect(-20, -4, 40, 12)
  ctx.fillStyle = INK
  ctx.font = 'bold 10px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('TNT', 0, 5)
  boilLine(ctx, boil, 0, -18, 8, -30, 0.8)
}

// Explosive crate: waist-high box marked TNT.
export function drawCrateSprites(): HTMLCanvasElement[] {
  return pickupCanvas((ctx, boil) => {
    inkStyle(ctx, 4)
    ctx.fillStyle = GRAY_MID
    ctx.fillRect(-30, -26, 60, 60)
    ctx.strokeRect(-30, -26, 60, 60)
    boilLine(ctx, boil, -30, -26, 30, 34, 1.4)
    boilLine(ctx, boil, 30, -26, -30, 34, 1.4)
    ctx.fillStyle = PAPER
    ctx.fillRect(-20, -6, 40, 18)
    ctx.strokeRect(-20, -6, 40, 18)
    ctx.fillStyle = INK
    ctx.font = 'bold 13px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText('TNT', 0, 7)
  }, 'crate')
}

// --- Projectiles and effects ---

export type ProjectileArt = 'knife' | 'ember' | 'ray' | 'tnt' | 'bigcheese'

export function drawProjectileSprites(): Record<ProjectileArt, HTMLCanvasElement[]> {
  const make = (seed: string, draw: (ctx: Ctx, boil: Boil) => void) =>
    [0, 1].map((variant) => {
      const { canvas, ctx } = makeCanvas(64, 64)
      const boil = makeBoil(hashString(`${seed}-${variant}`))
      ctx.save()
      ctx.translate(32, 32)
      draw(ctx, boil)
      ctx.restore()
      return canvas
    })
  return {
    knife: make('proj-knife', (ctx, boil) => {
      inkStyle(ctx, 3)
      ctx.fillStyle = PAPER
      ctx.beginPath()
      ctx.moveTo(-4 + boil(), 14 + boil())
      ctx.lineTo(0 + boil(), -18 + boil())
      ctx.lineTo(4 + boil(), 14 + boil())
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = INK
      ctx.fillRect(-6, 12, 12, 6)
    }),
    ember: make('proj-ember', (ctx, boil) => {
      inkStar(ctx, boil, 0, 0, 7, 18, 9, GRAY_LIGHT)
      ctx.fillStyle = INK
      ctx.beginPath()
      ctx.arc(0, 0, 6, 0, Math.PI * 2)
      ctx.fill()
    }),
    ray: make('proj-ray', (ctx, boil) => {
      inkStyle(ctx, 3)
      boilEllipse(ctx, boil, 0, 0, 14, 6, PAPER, 1)
      boilEllipse(ctx, boil, 0, 0, 7, 3, INK, 0.6)
    }),
    tnt: make('proj-tnt', (ctx, boil) => {
      inkStyle(ctx, 3)
      ctx.fillStyle = GRAY_DARK
      ctx.save()
      ctx.rotate(0.4)
      ctx.fillRect(-6, -16, 12, 32)
      ctx.strokeRect(-6, -16, 12, 32)
      ctx.restore()
      inkStar(ctx, boil, 10, -18, 5, 8, 4, PAPER)
    }),
    bigcheese: make('proj-bigcheese', (ctx, boil) => {
      inkStyle(ctx, 4)
      boilEllipse(ctx, boil, 0, 0, 24, 20, GRAY_LIGHT, 1.6)
      ctx.fillStyle = GRAY_MID
      for (const [hx, hy, r] of [
        [-8, -4, 5],
        [8, 6, 4],
        [4, -8, 3]
      ]) {
        ctx.beginPath()
        ctx.arc(hx, hy, r, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }
}

export function drawImpactStar(): HTMLCanvasElement[] {
  return [0, 1].map((variant) => {
    const { canvas, ctx } = makeCanvas(96, 96)
    const boil = makeBoil(hashString(`impact-${variant}`))
    inkStar(ctx, boil, 48, 48, 8, 40, 18, PAPER)
    return canvas
  })
}

export function drawExplosion(): HTMLCanvasElement[] {
  return [0, 1, 2].map((stage) => {
    const { canvas, ctx } = makeCanvas(160, 160)
    const boil = makeBoil(hashString(`boom-${stage}`))
    const r = 30 + stage * 24
    inkStar(ctx, boil, 80, 80, 9, r, r * 0.55, stage === 2 ? GRAY_MID : PAPER)
    ctx.fillStyle = INK
    ctx.font = 'bold 26px Georgia, serif'
    ctx.textAlign = 'center'
    if (stage < 2) {
      ctx.fillText('BAM!', 80, 88)
    }
    return canvas
  })
}

export function drawInkSplatSprites(): HTMLCanvasElement[] {
  return [0, 1, 2].map((variant) => {
    const { canvas, ctx } = makeCanvas(96, 96)
    const boil = makeBoil(hashString(`splat-${variant}`))
    inkSplat(ctx, boil, 48, 48, 26)
    return canvas
  })
}
