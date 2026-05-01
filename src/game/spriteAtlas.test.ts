import { describe, expect, it } from 'vitest'
import gruntAtlas from '../../public/assets/enemies/grunt/grunt.atlas.json'
import { frameToUvTransform, selectAnimationClip, selectSpriteFrame, validateSpriteAtlas } from './spriteAtlas'
import type { SpriteAtlas } from './spriteAtlas'

const atlas: SpriteAtlas = {
  image: 'test.svg',
  imageWidth: 256,
  imageHeight: 128,
  clips: [
    {
      name: 'idle',
      angle: 'front',
      loop: true,
      frames: [
        { x: 0, y: 0, w: 64, h: 64, durationMs: 100 },
        { x: 64, y: 0, w: 64, h: 64, durationMs: 100 }
      ]
    },
    {
      name: 'death',
      angle: 'front',
      loop: false,
      frames: [
        { x: 128, y: 64, w: 64, h: 64, durationMs: 150 },
        { x: 192, y: 64, w: 64, h: 64, durationMs: 150 }
      ]
    }
  ]
}

describe('sprite atlas selection', () => {
  it('selects a clip by animation and angle', () => {
    expect(selectAnimationClip(atlas, 'idle', 'front').frames).toHaveLength(2)
  })

  it('loops frames for looping clips', () => {
    const clip = selectAnimationClip(atlas, 'idle', 'front')

    expect(selectSpriteFrame(clip, 50).x).toBe(0)
    expect(selectSpriteFrame(clip, 150).x).toBe(64)
    expect(selectSpriteFrame(clip, 250).x).toBe(0)
  })

  it('holds the final frame for non-looping clips', () => {
    const clip = selectAnimationClip(atlas, 'death', 'front')

    expect(selectSpriteFrame(clip, 999).x).toBe(192)
  })

  it('converts frame rectangles to texture UV transforms', () => {
    expect(frameToUvTransform({ x: 64, y: 64, w: 64, h: 64, durationMs: 100 }, 256, 128)).toEqual({
      repeatX: 0.25,
      repeatY: 0.5,
      offsetX: 0.25,
      offsetY: 0
    })
  })

  it('validates the committed grunt atlas contract', () => {
    expect(validateSpriteAtlas(gruntAtlas as SpriteAtlas)).toEqual([])
  })

  it('reports missing clips and invalid frame rectangles', () => {
    const brokenAtlas: SpriteAtlas = {
      image: 'broken.png',
      imageWidth: 128,
      imageHeight: 128,
      clips: [
        {
          name: 'idle',
          angle: 'front',
          loop: true,
          frames: [{ x: 96, y: 0, w: 64, h: 64, durationMs: 0 }]
        }
      ]
    }

    expect(validateSpriteAtlas(brokenAtlas)).toEqual(
      expect.arrayContaining([
        { path: 'clips.idle.frontRight', message: 'required clip is missing' },
        { path: 'clips.hurt.front', message: 'required clip is missing' },
        { path: 'clips.0.frames.0', message: 'frame duration must be positive' },
        { path: 'clips.0.frames.0', message: 'frame rectangle must fit inside image bounds' }
      ])
    )
  })
})
