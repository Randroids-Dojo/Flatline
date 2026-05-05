import { describe, expect, it } from 'vitest'
import {
  CURTAIN_DOOR_HALF_GAP_M,
  CURTAIN_HEIGHT_M,
  CURTAIN_PANEL_COUNT,
  CURTAIN_PANEL_DEPTH_M,
  CURTAIN_SIDE_WIDTH_M,
  ORGAN_DOOR_OFFSET_M,
  ORGAN_PIPE_COUNT_PER_SIDE,
  ORGAN_PIPE_HEIGHTS_M,
  ORGAN_PIPE_RADIUS_M,
  ORGAN_PIPE_SPACING_M,
  arenaLandmarks,
  landmarkForWall,
  type LandmarkWall
} from './arenaLandmarks'

describe('arenaLandmarks', () => {
  it('covers all four cardinal walls exactly once', () => {
    const walls = arenaLandmarks.map((l) => l.wall).sort()
    expect(walls).toEqual(['east', 'north', 'south', 'west'])
  })

  it('lists each named landmark from the GDD spec', () => {
    const names = arenaLandmarks.map((l) => l.name).sort()
    expect(names).toEqual(['clock', 'curtain', 'furnace', 'organ'])
  })

  it('anchors every landmark on or just inside the wall plane', () => {
    for (const landmark of arenaLandmarks) {
      const onWallSurface =
        Math.abs(Math.abs(landmark.position.x) - 9.78) < 0.01 ||
        Math.abs(Math.abs(landmark.position.z) - 9.78) < 0.01
      expect(onWallSurface).toBe(true)
    }
  })

  it('keeps each landmark inside the room footprint', () => {
    for (const landmark of arenaLandmarks) {
      expect(Math.abs(landmark.position.x)).toBeLessThanOrEqual(10)
      expect(Math.abs(landmark.position.z)).toBeLessThanOrEqual(10)
      expect(landmark.position.y).toBeGreaterThan(0)
      expect(landmark.position.y).toBeLessThan(4.2)
    }
  })

  it('uses one of the three known palettes per landmark', () => {
    for (const landmark of arenaLandmarks) {
      expect(['accent', 'danger', 'wall']).toContain(landmark.palette)
    }
  })

  it('places the south curtain on the south wall and the west organ on the west wall', () => {
    const curtain = landmarkForWall('south')
    const organ = landmarkForWall('west')
    expect(curtain?.name).toBe('curtain')
    expect(organ?.name).toBe('organ')
    expect(curtain?.position.z).toBeLessThan(0)
    expect(organ?.position.x).toBeLessThan(0)
  })
})

describe('landmarkForWall', () => {
  it('returns the assigned landmark for each cardinal wall', () => {
    const walls: LandmarkWall[] = ['north', 'east', 'south', 'west']
    for (const wall of walls) {
      expect(landmarkForWall(wall)).toBeDefined()
    }
  })
})

describe('curtain configuration', () => {
  it('uses at least two panels per side so the drapery reads as folds', () => {
    expect(CURTAIN_PANEL_COUNT).toBeGreaterThanOrEqual(2)
  })

  it('clears the south door panel half-width', () => {
    // The south door panel is 2.25 m wide, so its half-width is 1.125 m.
    expect(CURTAIN_DOOR_HALF_GAP_M).toBeGreaterThan(1.125)
  })

  it('keeps the curtain footprint inside the wall', () => {
    const farEdge = CURTAIN_DOOR_HALF_GAP_M + CURTAIN_SIDE_WIDTH_M
    expect(farEdge).toBeLessThan(10)
    expect(CURTAIN_SIDE_WIDTH_M).toBeGreaterThan(0)
  })

  it('keeps the curtain shorter than the wall ceiling height', () => {
    expect(CURTAIN_HEIGHT_M).toBeGreaterThan(0)
    expect(CURTAIN_HEIGHT_M).toBeLessThan(4.2)
  })

  it('uses thin panels so the curtain reads as fabric not foam', () => {
    expect(CURTAIN_PANEL_DEPTH_M).toBeGreaterThan(0)
    expect(CURTAIN_PANEL_DEPTH_M).toBeLessThan(0.2)
  })
})

describe('organ configuration', () => {
  it('declares one height per pipe on each side', () => {
    expect(ORGAN_PIPE_HEIGHTS_M).toHaveLength(ORGAN_PIPE_COUNT_PER_SIDE)
  })

  it('keeps every pipe inside the room ceiling', () => {
    for (const height of ORGAN_PIPE_HEIGHTS_M) {
      expect(height).toBeGreaterThan(0)
      expect(height).toBeLessThan(4.2)
    }
  })

  it('steps from short to tall so the silhouette frames the door', () => {
    const heights = ORGAN_PIPE_HEIGHTS_M
    for (let i = 1; i < heights.length; i += 1) {
      expect(heights[i]).toBeGreaterThanOrEqual(heights[i - 1])
    }
  })

  it('clears the west door panel half-width', () => {
    // The west door panel is 2.25 m wide, so its half-width is 1.125 m.
    expect(ORGAN_DOOR_OFFSET_M).toBeGreaterThan(1.125)
  })

  it('keeps pipe spacing positive and pipe radius positive', () => {
    expect(ORGAN_PIPE_SPACING_M).toBeGreaterThan(0)
    expect(ORGAN_PIPE_RADIUS_M).toBeGreaterThan(0)
    expect(ORGAN_PIPE_RADIUS_M * 2).toBeLessThan(ORGAN_PIPE_SPACING_M + 0.01)
  })
})
