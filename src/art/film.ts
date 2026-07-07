// The film-degradation post pass: animated grain, dust flecks, vertical
// scratches, and a vignette, drawn onto a 2D overlay canvas above the WebGL
// view. Three presets mirror the reference game's Studio / Director's /
// Vintage cuts; grain and diffusion are continuous so the presets are just
// named points.

import { mulberry32 } from '@/game/rng'

export type FilmPreset = 'studio' | 'directors' | 'vintage'

export type FilmSettings = {
  grain: number // 0..1
  diffusion: number // 0..1, applied as CSS glow on the render root
  scratches: number // 0..1
}

export const FILM_PRESETS: Record<FilmPreset, FilmSettings> = {
  studio: { grain: 0.06, diffusion: 0.08, scratches: 0.15 },
  directors: { grain: 0.16, diffusion: 0.35, scratches: 0.45 },
  vintage: { grain: 0.3, diffusion: 0.6, scratches: 0.9 }
}

const GRAIN_TILE = 160
const GRAIN_TILES = 5

export function makeGrainTiles(): HTMLCanvasElement[] {
  const tiles: HTMLCanvasElement[] = []
  for (let t = 0; t < GRAIN_TILES; t++) {
    const canvas = document.createElement('canvas')
    canvas.width = GRAIN_TILE
    canvas.height = GRAIN_TILE
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      continue
    }
    const image = ctx.createImageData(GRAIN_TILE, GRAIN_TILE)
    const rng = mulberry32(1000 + t)
    for (let i = 0; i < image.data.length; i += 4) {
      const v = Math.floor(rng() * 255)
      image.data[i] = v
      image.data[i + 1] = v
      image.data[i + 2] = v
      // Sparse alpha: most pixels transparent, some specks.
      image.data[i + 3] = rng() < 0.35 ? Math.floor(rng() * 160) : 0
    }
    ctx.putImageData(image, 0, 0)
    tiles.push(canvas)
  }
  return tiles
}

export type FilmFrameState = {
  tiles: HTMLCanvasElement[]
  frame: number
}

// Draw one frame of film wear. Call at ~12Hz for authentic flicker.
export function drawFilmFrame(
  ctx: CanvasRenderingContext2D,
  state: FilmFrameState,
  width: number,
  height: number,
  settings: FilmSettings
) {
  ctx.clearRect(0, 0, width, height)
  state.frame++
  const rng = mulberry32(state.frame * 7919)

  // Grain: tile a random noise tile with random offset.
  if (settings.grain > 0 && state.tiles.length > 0) {
    const tile = state.tiles[state.frame % state.tiles.length]
    ctx.save()
    ctx.globalAlpha = settings.grain
    const ox = -Math.floor(rng() * GRAIN_TILE)
    const oy = -Math.floor(rng() * GRAIN_TILE)
    for (let y = oy; y < height; y += GRAIN_TILE) {
      for (let x = ox; x < width; x += GRAIN_TILE) {
        ctx.drawImage(tile, x, y)
      }
    }
    ctx.restore()
  }

  // Occasional vertical scratch that lives for one frame.
  if (rng() < settings.scratches * 0.4) {
    ctx.save()
    ctx.globalAlpha = 0.25 + rng() * 0.3
    ctx.strokeStyle = rng() < 0.5 ? '#f4f1e8' : '#101010'
    ctx.lineWidth = 1 + rng()
    const x = rng() * width
    ctx.beginPath()
    ctx.moveTo(x + rng() * 4, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
    ctx.restore()
  }

  // Dust flecks.
  if (settings.scratches > 0) {
    ctx.save()
    ctx.fillStyle = '#f4f1e8'
    const count = Math.floor(settings.scratches * 5 * rng())
    for (let i = 0; i < count; i++) {
      ctx.globalAlpha = 0.2 + rng() * 0.4
      ctx.beginPath()
      ctx.arc(rng() * width, rng() * height, 0.6 + rng() * 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  // Vignette.
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.45,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75
  )
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

// CSS filter string for the render root, approximating projection diffusion.
export function diffusionFilter(settings: FilmSettings): string {
  const contrast = 1 + settings.diffusion * 0.12
  const brightness = 1 + settings.diffusion * 0.08
  const blur = settings.diffusion * 0.6
  return `grayscale(1) contrast(${contrast.toFixed(3)}) brightness(${brightness.toFixed(3)}) blur(${blur.toFixed(2)}px)`
}
