import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { finishAsset } from './finish-asset.mjs'

const cell = 192
const columns = 8
const rows = 18
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
    durations: { idle: 105, walk: 80, windup: 130, release: 70, hurt: 75, death: 95 }
  },
  {
    type: 'brute',
    draw: drawBrute,
    durations: { idle: 145, walk: 130, windup: 310, release: 120, hurt: 110, death: 135 }
  },
  {
    type: 'spitter',
    draw: drawSpitter,
    durations: { idle: 130, walk: 110, windup: 360, release: 100, hurt: 95, death: 120 }
  }
]

function generateAtlases() {
  for (const variant of variants) {
    const pixels = new Uint8Array(width * height * 4)

    for (let index = 3; index < pixels.length; index += 4) {
      pixels[index] = 0
    }

    const draw = createDrawingContext(pixels)

    // Row layout per angle column:
    //   rows 0..3   idle    (4 frames)
    //   rows 4..7   walk    (4 frames)
    //   rows 8..9   windup  (2 frames)
    //   rows 10..11 release (2 frames)
    //   rows 12..13 hurt    (2 frames)
    //   rows 14..17 death   (4 frames)
    for (let angleIndex = 0; angleIndex < angles.length; angleIndex += 1) {
      for (let frame = 0; frame < 4; frame += 1) {
        variant.draw(draw, angleIndex, frame, 'idle')
      }

      for (let frame = 0; frame < 4; frame += 1) {
        variant.draw(draw, angleIndex, frame, 'walk')
      }

      for (let frame = 0; frame < 2; frame += 1) {
        variant.draw(draw, angleIndex, frame, 'attackWindup')
      }

      for (let frame = 0; frame < 2; frame += 1) {
        variant.draw(draw, angleIndex, frame, 'attackRelease')
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
    finishAsset(pixels)
    writeFileSync(`${directory}/${variant.type}.png`, writePng(pixels))
    writeFileSync(`${directory}/${variant.type}.atlas.json`, `${JSON.stringify(atlas, null, 2)}\n`)
  }
}

function rowForState(state, frame) {
  if (state === 'idle') return frame
  if (state === 'walk') return 4 + frame
  if (state === 'attackWindup') return 8 + frame
  if (state === 'attackRelease') return 10 + frame
  if (state === 'hurt') return 12 + frame
  return 14 + frame
}

function drawSkitter(draw, angleIndex, frame, state) {
  const originX = angleIndex * cell
  const row = rowForState(state, frame)
  const originY = row * cell
  const cx = originX + cell / 2
  const cy = originY + cell / 2
  const facing = (angleIndex / angles.length) * Math.PI * 2
  const side = Math.abs(Math.sin(facing))
  const back = Math.cos(facing) < -0.45
  const walk = state === 'walk'
  const windup = state === 'attackWindup'
  const release = state === 'attackRelease'
  const idleBob = state === 'idle' ? Math.sin(frame * Math.PI * 0.5) * 5 : 0
  // Walk: alternating bob + side-skitter sway across 4 frames.
  const walkBob = walk ? Math.abs(Math.sin(frame * Math.PI * 0.5)) * 4 - 1 : 0
  // Windup crouch: shell drops on frame 0, drops further on frame 1.
  const windupBob = windup ? (frame === 0 ? 6 : 10) : 0
  // Release spring: shell launches up + forward.
  const releaseBob = release ? (frame === 0 ? -8 : -2) : 0
  const bob = idleBob + walkBob + windupBob + releaseBob
  const hurtLean = state === 'hurt' ? (frame === 0 ? -9 : 9) : 0
  const walkLean = walk ? Math.sin(frame * Math.PI * 0.5) * 5 : 0
  const releaseLean = release ? (frame === 0 ? 8 : 4) : 0
  const dead = state === 'death'
  const hurt = state === 'hurt'
  const bodyY = cy + 7 + bob
  const shellWidth = dead ? 55 : 45 - side * 11
  const shellHeight = dead ? 20 : windup ? 32 : 28

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

  // Per-leg gait offset: walk frames stagger inner/outer legs in a
  // 4-step skitter cycle. Release flings legs back; windup pulls them in.
  const legOffsets = walk
    ? [
        Math.sin(frame * Math.PI * 0.5) * 8,
        Math.sin(frame * Math.PI * 0.5 + Math.PI / 3) * 6,
        Math.sin(frame * Math.PI * 0.5 + (Math.PI * 2) / 3) * 5,
        Math.sin(frame * Math.PI * 0.5 + Math.PI) * 8,
        Math.sin(frame * Math.PI * 0.5 + (Math.PI * 4) / 3) * 6,
        Math.sin(frame * Math.PI * 0.5 + (Math.PI * 5) / 3) * 5
      ]
    : [0, 0, 0, 0, 0, 0]

  const legs = [
    [-45, 14, -72, 28],
    [-34, 4, -66, -5],
    [-18, -9, -48, -31],
    [45, 14, 72, 28],
    [34, 4, 66, -5],
    [18, -9, 48, -31]
  ]

  for (let li = 0; li < legs.length; li += 1) {
    const [x1, y1, x2, y2] = legs[li]
    const sideLean = side * Math.sign(x1) * 8
    const tip = legOffsets[li]
    // Windup tucks legs in; release extends them outward + forward.
    const tuck = windup ? -10 : release ? 14 : 0
    const tipX = cx + x2 + sideLean + tip + Math.sign(x1) * tuck * 0.4
    const tipY = bodyY + y2 + bob * 0.4 + tip * 0.3 + (release ? -4 : 0)
    draw.strokeLine(cx + x1 + hurtLean + walkLean + releaseLean, bodyY + y1, tipX, tipY, 3.2, colors.outline)
    draw.strokeLine(cx + x1 + hurtLean + walkLean + releaseLean, bodyY + y1, tipX, tipY, 1.7, colors.tealDark)
  }

  const shellLean = hurtLean + walkLean + releaseLean
  const shell = [
    [cx - shellWidth + shellLean, bodyY + 8],
    [cx - shellWidth * 0.6 + shellLean, bodyY - shellHeight],
    [cx + shellWidth * 0.65 + shellLean, bodyY - shellHeight + side * 6],
    [cx + shellWidth + shellLean, bodyY + 8],
    [cx + shellWidth * 0.55, bodyY + shellHeight],
    [cx - shellWidth * 0.55, bodyY + shellHeight]
  ]
  draw.fillPolygon(expandPoints(shell, cx, bodyY, 1.14), colors.outline)
  draw.fillPolygon(shell, hurt ? colors.danger : colors.ink)
  draw.fillEllipse(cx + shellLean, bodyY + 3, shellWidth * 0.62, shellHeight * 0.56, hurt ? colors.bruteRed : colors.dark)

  if (back && !hurt) {
    draw.strokeLine(cx - 25, bodyY - 4, cx + 25, bodyY - 8, 3, colors.outline)
    return
  }

  // Windup eye-flash: oversize teal eyes on frame 1 telegraph the leap.
  const eyeSpread = 18 - side * 11
  const baseEyeColor = hurt ? colors.danger : colors.teal
  const windupEyeBoost = windup ? (frame === 0 ? 1 : 2) : 0
  const eyeRx = (hurt ? 8 : 6) + windupEyeBoost
  const eyeRy = (hurt ? 5 : 6) + windupEyeBoost
  draw.fillEllipse(cx - eyeSpread + shellLean, bodyY - 10, eyeRx, eyeRy, baseEyeColor)
  draw.fillEllipse(cx + eyeSpread + shellLean, bodyY - 9 + side * 2, eyeRx, eyeRy, baseEyeColor)
  draw.strokeLine(cx - 16 + shellLean, bodyY + 11, cx + 16 + shellLean, bodyY + 10, 2.3, colors.outline)
}

function drawBrute(draw, angleIndex, frame, state) {
  const originX = angleIndex * cell
  const row = rowForState(state, frame)
  const originY = row * cell
  const cx = originX + cell / 2
  const cy = originY + cell / 2
  const facing = (angleIndex / angles.length) * Math.PI * 2
  const side = Math.abs(Math.sin(facing))
  const back = Math.cos(facing) < -0.45
  const walk = state === 'walk'
  const windup = state === 'attackWindup'
  const release = state === 'attackRelease'
  const idleBob = state === 'idle' ? Math.sin(frame * Math.PI * 0.5) * 3 : 0
  // Heavy step: the brute's walk uses a deeper cycle, slower cadence.
  const walkBob = walk ? Math.abs(Math.sin(frame * Math.PI * 0.5)) * 5 - 1 : 0
  const windupBob = windup ? (frame === 0 ? 2 : 4) : 0
  const releaseBob = release ? (frame === 0 ? -3 : 1) : 0
  const bob = idleBob + walkBob + windupBob + releaseBob
  let lean
  if (state === 'hurt') {
    lean = frame === 0 ? -8 : 8
  } else if (windup) {
    lean = frame === 0 ? -6 : -10
  } else if (release) {
    lean = frame === 0 ? 11 : 6
  } else if (walk) {
    // Shoulder sway: the brute leans into the planted foot.
    lean = Math.sin(frame * Math.PI * 0.5) * 5
  } else {
    lean = Math.sin(frame + facing) * 2
  }
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

  // Walk: paint visible boots offset by stride so the planted vs.
  // trailing foot reads even from front. 4-step cycle.
  if (walk) {
    const stride = Math.sin(frame * Math.PI * 0.5) * 12
    draw.fillEllipse(cx - 18 - stride, hipY + 22, 12, 5, colors.outline)
    draw.fillEllipse(cx - 18 - stride, hipY + 22, 9, 3, colors.ink)
    draw.fillEllipse(cx + 18 + stride, hipY + 22, 12, 5, colors.outline)
    draw.fillEllipse(cx + 18 + stride, hipY + 22, 9, 3, colors.ink)
  }

  draw.fillPolygon(expandPoints(body, cx, cy, 1.13), colors.outline)
  draw.fillPolygon(body, hurt ? colors.bruteRed : colors.ink)
  draw.fillPolygon(expandPoints(body, cx, cy, 0.8), hurt ? [45, 22, 20, 255] : windup ? [70, 24, 22, 255] : colors.gray)
  draw.strokeLine(cx - halfWidth * 0.72, shoulderY + 4, cx - halfWidth * 0.48, hipY - 4, 5, colors.outline)
  draw.strokeLine(cx + halfWidth * 0.72, shoulderY + 4, cx + halfWidth * 0.48, hipY - 4, 5, colors.outline)

  // Windup: arms cocked back, hammer-fist pulled rear of body. Frame 0
  // is mid-pull; frame 1 is peak telegraph. Danger-red glove tip.
  if (windup) {
    const pull = frame === 0 ? 22 : 36
    draw.strokeLine(cx + halfWidth * 0.5, shoulderY + 6, cx + halfWidth * 0.5 - pull, shoulderY - 8, 7, colors.outline)
    draw.fillEllipse(cx + halfWidth * 0.5 - pull, shoulderY - 8, 11, 10, colors.outline)
    draw.fillEllipse(cx + halfWidth * 0.5 - pull, shoulderY - 8, 8, 7, colors.danger)
  }

  // Release: hammer-fist swung forward. Frame 0 is full extension;
  // frame 1 settles back. Faint blur-streak behind the fist on frame 0.
  if (release) {
    const reach = frame === 0 ? 38 : 22
    draw.strokeLine(cx + halfWidth * 0.5, shoulderY + 6, cx + halfWidth * 0.5 + reach, shoulderY + 12, 7, colors.outline)
    draw.fillEllipse(cx + halfWidth * 0.5 + reach, shoulderY + 12, 12, 11, colors.outline)
    draw.fillEllipse(cx + halfWidth * 0.5 + reach, shoulderY + 12, 9, 8, colors.bruteRed)
    if (frame === 0) {
      draw.strokeLine(cx + halfWidth * 0.5 - 10, shoulderY + 12, cx + halfWidth * 0.5 + reach * 0.5, shoulderY + 12, 2, colors.gray)
      draw.strokeLine(cx + halfWidth * 0.5 - 4, shoulderY + 16, cx + halfWidth * 0.5 + reach * 0.6, shoulderY + 16, 1.5, colors.tealDark)
    }
  }

  if (back && !hurt) {
    draw.strokeLine(cx - 31, cy - 34 + bob, cx + 31, cy - 38 + bob, 4, colors.outline)
    draw.strokeLine(cx - 41, cy + 2 + bob, cx + 41, cy - 2 + bob, 4, colors.tealDark)
    return
  }

  const eyeSpread = 20 - side * 10
  const eyeColor = hurt || windup ? colors.danger : colors.teal
  const eyeRx = hurt || windup ? 8 : 6
  const eyeRy = hurt || windup ? 5 : 6
  draw.fillEllipse(cx - eyeSpread + lean, cy - 32 + bob, eyeRx, eyeRy, eyeColor)
  draw.fillEllipse(cx + eyeSpread + lean, cy - 31 + bob + side * 2, eyeRx, eyeRy, eyeColor)
  draw.strokeLine(cx - 28 + lean, cy - 7 + bob, cx + 28 + lean, cy - 10 + bob, 3.4, colors.outline)
  draw.strokeLine(cx - 30 + lean, cy + 7 + bob, cx + 30 + lean, cy + 5 + bob, 2.4, colors.tealDark)
}

// The spitter is the ranged enemy. Tall lanky silhouette so it reads
// distinct from the brute (stocky) and skitter (low + spider-like). The
// belly carries a teal "projectile sac" that pulses on idle and bursts
// out on attack-windup; the windup tint comes from `spitterCharge.ts`
// at runtime, this atlas only covers idle / hurt / death so the pulse
// here is just frame-to-frame size jitter on the sac.
function drawSpitter(draw, angleIndex, frame, state) {
  const originX = angleIndex * cell
  const row = rowForState(state, frame)
  const originY = row * cell
  const cx = originX + cell / 2
  const cy = originY + cell / 2
  const facing = (angleIndex / angles.length) * Math.PI * 2
  const side = Math.abs(Math.sin(facing))
  const back = Math.cos(facing) < -0.45
  const walk = state === 'walk'
  const windup = state === 'attackWindup'
  const release = state === 'attackRelease'
  const idleSway = state === 'idle' ? Math.sin(frame * Math.PI * 0.5) * 4 : 0
  const walkSway = walk ? Math.sin(frame * Math.PI * 0.5) * 6 : 0
  const sway = idleSway + walkSway
  // Sac pulse: idle wobble + windup swell + release contraction.
  const idleSacPulse = state === 'idle' ? Math.sin(frame * Math.PI * 0.5 + Math.PI / 3) * 2 : 0
  const windupSacPulse = windup ? (frame === 0 ? 4 : 6) : 0
  const releaseSacPulse = release ? (frame === 0 ? -3 : -1) : 0
  const sacPulse = idleSacPulse + windupSacPulse + releaseSacPulse
  const hurtLean = state === 'hurt' ? (frame === 0 ? -10 : 10) : 0
  const dead = state === 'death'
  const hurt = state === 'hurt'

  // Olive-grayed body color; the canonical palette's `gray` reads as a
  // muted vegetal tone against the teal sac and the cream outline.
  const bodyTint = hurt ? colors.bruteRed : colors.gray

  draw.fillEllipse(cx, cy + 64, dead ? 56 : 38, dead ? 9 : 7, colors.shadow)

  if (dead) {
    // Spitter collapses into a puddle with the sac splat.
    draw.fillEllipse(cx, cy + 50, 64, 14, colors.outline)
    draw.fillEllipse(cx, cy + 50, 56, 10, colors.gray)
    draw.fillEllipse(cx - 22, cy + 48, 14, 6, colors.tealDark)
    draw.fillEllipse(cx + 26, cy + 50, 12, 5, colors.tealDark)
    draw.strokeLine(cx - 30, cy + 50, cx - 60, cy + 30, 3, colors.outline)
    draw.strokeLine(cx + 30, cy + 50, cx + 60, cy + 32, 3, colors.outline)
    return
  }

  // Two stalk legs. Walk: alternating splay/converge across 4 frames so
  // the bandy-legged stride reads through the silhouette.
  const baseSpread = 18 + side * 4
  const walkLegPhase = walk ? Math.sin(frame * Math.PI * 0.5) * 6 : 0
  const legSpread = baseSpread + walkLegPhase
  const legBase = walk ? cy + 60 + Math.cos(frame * Math.PI * 0.5) * 3 : cy + 60
  draw.strokeLine(cx - legSpread + hurtLean, cy - 4, cx - legSpread - 8 - walkLegPhase, legBase, 4, colors.outline)
  draw.strokeLine(cx - legSpread + hurtLean, cy - 4, cx - legSpread - 8 - walkLegPhase, legBase, 2, colors.gray)
  draw.strokeLine(cx + legSpread + hurtLean, cy - 4, cx + legSpread + 8 + walkLegPhase, legBase, 4, colors.outline)
  draw.strokeLine(cx + legSpread + hurtLean, cy - 4, cx + legSpread + 8 + walkLegPhase, legBase, 2, colors.gray)

  // Tall narrow torso (teardrop shape).
  const torsoTop = cy - 48 + sway
  const torsoBottom = cy + 24
  const torso = [
    [cx - 22 + hurtLean, torsoBottom],
    [cx - 26 + hurtLean, cy - 4 + sway],
    [cx - 18 + hurtLean, torsoTop + 6],
    [cx - 8 + hurtLean, torsoTop],
    [cx + 8 + hurtLean, torsoTop],
    [cx + 18 + hurtLean, torsoTop + 6],
    [cx + 26 + hurtLean, cy - 4 + sway],
    [cx + 22 + hurtLean, torsoBottom]
  ]
  draw.fillPolygon(expandPoints(torso, cx, cy, 1.13), colors.outline)
  draw.fillPolygon(torso, bodyTint)

  // Belly sac: a teal pulsing pouch where projectiles charge.
  const sacRx = (back ? 12 : 18) + sacPulse
  const sacRy = 14 + sacPulse * 0.5
  const sacY = cy + 6 + sway
  draw.fillEllipse(cx + hurtLean, sacY, sacRx + 2, sacRy + 2, colors.outline)
  draw.fillEllipse(cx + hurtLean, sacY, sacRx, sacRy, colors.tealDark)
  draw.fillEllipse(cx - 4 + hurtLean, sacY - 2, sacRx * 0.4, sacRy * 0.4, colors.teal)

  if (back && !hurt) {
    // Backside view: spine ridge + sac shows as a dim shadow only.
    draw.strokeLine(cx - 6, torsoTop + 8, cx - 6, cy + 10 + sway, 2, colors.tealDark)
    draw.strokeLine(cx + 6, torsoTop + 8, cx + 6, cy + 10 + sway, 2, colors.tealDark)
    return
  }

  // Single eye on a stalk above the head. Windup extends the stalk
  // upward + forward to track the player's face; release pulls back
  // toward the body as the projectile launches.
  const stalkExtend = windup ? (frame === 0 ? 6 : 12) : release ? -3 : 0
  const eyeX = cx + hurtLean - side * 4
  const eyeY = torsoTop - 8 - stalkExtend
  draw.strokeLine(cx + hurtLean, torsoTop, eyeX, eyeY + 2, 3, colors.outline)
  draw.fillEllipse(eyeX, eyeY, hurt ? 9 : 7, hurt ? 6 : 7, colors.outline)
  draw.fillEllipse(eyeX, eyeY, hurt ? 6 : 4, hurt ? 4 : 4, hurt ? colors.danger : windup ? colors.danger : colors.ink)
  // Mouth slit. Release frame 0: opens wide for the projectile spawn.
  if (release) {
    const open = frame === 0 ? 6 : 3
    draw.fillEllipse(cx + hurtLean, cy - 18 + sway, 12, open, colors.ink)
    if (frame === 0) {
      draw.fillEllipse(cx + hurtLean, cy - 18 + sway, 6, 3, colors.teal)
    }
  } else {
    draw.strokeLine(cx - 9 + hurtLean, cy - 18 + sway, cx + 9 + hurtLean, cy - 18 + sway, 1.5, colors.ink)
  }
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
      name: 'walk',
      angle,
      loop: true,
      frames: [4, 5, 6, 7].map((row) => frame(angleIndex, row, durations.walk))
    })
  }

  for (const [angleIndex, angle] of angles.entries()) {
    atlas.clips.push({
      name: 'attackWindup',
      angle,
      loop: false,
      frames: [8, 9].map((row) => frame(angleIndex, row, durations.windup))
    })
  }

  for (const [angleIndex, angle] of angles.entries()) {
    atlas.clips.push({
      name: 'attack',
      angle,
      loop: false,
      frames: [10, 11].map((row) => frame(angleIndex, row, durations.release))
    })
  }

  for (const [angleIndex, angle] of angles.entries()) {
    atlas.clips.push({
      name: 'hurt',
      angle,
      loop: false,
      frames: [12, 13].map((row) => frame(angleIndex, row, durations.hurt))
    })
  }

  for (const [angleIndex, angle] of angles.entries()) {
    atlas.clips.push({
      name: 'death',
      angle,
      loop: false,
      frames: [14, 15, 16, 17].map((row) => frame(angleIndex, row, durations.death))
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
