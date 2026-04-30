import type { BillboardAngle } from './billboard'

export type AnimationName = 'idle' | 'hurt' | 'death'

export type SpriteFrame = {
  x: number
  y: number
  w: number
  h: number
  durationMs: number
}

export type AnimationClip = {
  name: AnimationName
  angle: BillboardAngle
  frames: SpriteFrame[]
  loop: boolean
}

export type SpriteAtlas = {
  image: string
  imageWidth: number
  imageHeight: number
  clips: AnimationClip[]
}

export type UvTransform = {
  repeatX: number
  repeatY: number
  offsetX: number
  offsetY: number
}

export function selectAnimationClip(
  atlas: SpriteAtlas,
  animationName: AnimationName,
  angle: BillboardAngle
): AnimationClip {
  const clip = atlas.clips.find((candidate) => candidate.name === animationName && candidate.angle === angle)

  if (!clip) {
    throw new Error(`Missing sprite clip ${animationName}:${angle}`)
  }

  return clip
}

export function selectSpriteFrame(clip: AnimationClip, timeMs: number): SpriteFrame {
  const duration = clip.frames.reduce((sum, frame) => sum + frame.durationMs, 0)
  const localTime = clip.loop ? positiveModulo(timeMs, duration) : Math.min(timeMs, Math.max(duration - 1, 0))
  let cursor = 0

  for (const frame of clip.frames) {
    cursor += frame.durationMs

    if (localTime < cursor) {
      return frame
    }
  }

  return clip.frames[clip.frames.length - 1]
}

export function frameToUvTransform(frame: SpriteFrame, imageWidth: number, imageHeight: number): UvTransform {
  return {
    repeatX: frame.w / imageWidth,
    repeatY: frame.h / imageHeight,
    offsetX: frame.x / imageWidth,
    offsetY: 1 - (frame.y + frame.h) / imageHeight
  }
}

function positiveModulo(value: number, divisor: number): number {
  if (divisor <= 0) {
    return 0
  }

  return ((value % divisor) + divisor) % divisor
}
