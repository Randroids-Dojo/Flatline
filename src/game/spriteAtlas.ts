import { billboardAngles, type BillboardAngle } from './billboard'

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

export type AtlasValidationIssue = {
  path: string
  message: string
}

export type AtlasValidationOptions = {
  requiredAnimations?: AnimationName[]
  requiredAngles?: BillboardAngle[]
}

export function validateSpriteAtlas(
  atlas: SpriteAtlas,
  options: AtlasValidationOptions = {}
): AtlasValidationIssue[] {
  const issues: AtlasValidationIssue[] = []
  const requiredAnimations = options.requiredAnimations ?? ['idle', 'hurt', 'death']
  const requiredAngles = options.requiredAngles ?? [...billboardAngles]

  if (atlas.imageWidth <= 0 || atlas.imageHeight <= 0) {
    issues.push({ path: 'image', message: 'image dimensions must be positive' })
  }

  for (const animationName of requiredAnimations) {
    for (const angle of requiredAngles) {
      const clip = atlas.clips.find((candidate) => candidate.name === animationName && candidate.angle === angle)

      if (!clip) {
        issues.push({ path: `clips.${animationName}.${angle}`, message: 'required clip is missing' })
        continue
      }

      if (clip.frames.length === 0) {
        issues.push({ path: `clips.${animationName}.${angle}.frames`, message: 'clip must have at least one frame' })
      }
    }
  }

  atlas.clips.forEach((clip, clipIndex) => {
    clip.frames.forEach((frame, frameIndex) => {
      const path = `clips.${clipIndex}.frames.${frameIndex}`

      if (frame.w <= 0 || frame.h <= 0) {
        issues.push({ path, message: 'frame dimensions must be positive' })
      }

      if (frame.durationMs <= 0) {
        issues.push({ path, message: 'frame duration must be positive' })
      }

      if (frame.x < 0 || frame.y < 0 || frame.x + frame.w > atlas.imageWidth || frame.y + frame.h > atlas.imageHeight) {
        issues.push({ path, message: 'frame rectangle must fit inside image bounds' })
      }
    })
  })

  return issues
}

export function assertValidSpriteAtlas(atlas: SpriteAtlas, options: AtlasValidationOptions = {}) {
  const issues = validateSpriteAtlas(atlas, options)

  if (issues.length > 0) {
    throw new Error(`Invalid sprite atlas: ${issues.map((issue) => `${issue.path} ${issue.message}`).join('; ')}`)
  }
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
