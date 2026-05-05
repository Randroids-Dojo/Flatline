/**
 * Per-wall landmark configuration for the single arena room. The MVP room is
 * one cube and every wall reads the same; landmarks give the player a
 * persistent orientation cue without a minimap. See
 * `docs/gdd/20-arena-landmarks.md` for the spec.
 *
 * Each landmark is data-only. The component composes Three.js meshes from the
 * config so positions, sizes, and accent vs danger palette assignments stay
 * verifiable in unit tests rather than buried in scene-construction code.
 *
 * Coordinate convention matches the rest of the codebase: +x is east, -x is
 * west, +z is north, -z is south. The room is 20x20 with walls at +-10. The
 * landmark surface anchors at 9.78 so it sits just inside the wall plane and
 * does not z-fight with the wall mesh.
 */

export type LandmarkWall = 'north' | 'east' | 'south' | 'west'

export type LandmarkPalette = 'accent' | 'danger' | 'wall'

export type ArenaLandmark = {
  /** Cardinal wall the landmark decorates. */
  wall: LandmarkWall
  /** Semantic name carried in build logs and PROGRESS_LOG entries. */
  name: 'clock' | 'furnace' | 'curtain' | 'organ'
  /** Anchor position in world meters. y is the floor-relative center. */
  position: { x: number; y: number; z: number }
  /**
   * Color palette key. `accent` and `danger` reuse the existing room
   * materials (teal accent, red danger). `wall` reuses the matte wall
   * material so the landmark reads as part of the room shell.
   */
  palette: LandmarkPalette
}

const WALL_OFFSET = 9.78

/**
 * Static landmark roster. Order is fixed (north, east, south, west) so the
 * caller iterates predictably and tests can assert the four-entry contract.
 *
 * - North: cracked clock face (existing).
 * - East: furnace doors (existing).
 * - South: theater curtain (new in this slice).
 * - West: pipe organ pipes (new in this slice).
 */
export const arenaLandmarks: readonly ArenaLandmark[] = [
  {
    wall: 'north',
    name: 'clock',
    position: { x: 0, y: 2.4, z: WALL_OFFSET },
    palette: 'accent'
  },
  {
    wall: 'east',
    name: 'furnace',
    position: { x: WALL_OFFSET, y: 1, z: 0 },
    palette: 'danger'
  },
  {
    wall: 'south',
    name: 'curtain',
    position: { x: 0, y: 1.6, z: -WALL_OFFSET },
    palette: 'danger'
  },
  {
    wall: 'west',
    name: 'organ',
    position: { x: -WALL_OFFSET, y: 1.4, z: 0 },
    palette: 'accent'
  }
]

/**
 * Theater curtain panel column count per side. The curtain is rendered as
 * two stacks of vertical fold panels flanking the south door, so this is
 * the count on each side; total panel count is `CURTAIN_PANEL_COUNT * 2`.
 * Three columns per side reads as drapery without the panels disappearing
 * at the door cutout.
 */
export const CURTAIN_PANEL_COUNT = 3

/** Curtain footprint along the wall (x axis), per side, not including the door gap. */
export const CURTAIN_SIDE_WIDTH_M = 3.2

/**
 * Horizontal gap left around the south door so the door panel still reads.
 * The south door spans x = -1.125 to +1.125; a 1.5 m half-gap on each side
 * means the inner curtain panel starts at x = +-1.5, clearing the door.
 */
export const CURTAIN_DOOR_HALF_GAP_M = 1.5

/** Curtain panel height. Shorter than the wall so the door panel still reads. */
export const CURTAIN_HEIGHT_M = 2.2

/** Curtain panel thickness. Thin enough to feel like fabric, not foam. */
export const CURTAIN_PANEL_DEPTH_M = 0.07

/**
 * Pipe organ pipe count per side. Pipes flank the west door so they do not
 * occlude it; total pipe count is `ORGAN_PIPE_COUNT_PER_SIDE * 2`. Three
 * pipes per side reads as a stepped chevron without crowding the door.
 */
export const ORGAN_PIPE_COUNT_PER_SIDE = 3

/**
 * Pipe organ pipe heights, in meters, for one side. Heights step from short
 * (closest to the door) to tall (closest to the wall corner) so the silhouette
 * reads as a chevron pointed away from the door, matching real pipe-organ
 * layouts. The opposite side mirrors this list.
 */
export const ORGAN_PIPE_HEIGHTS_M: readonly number[] = [1.2, 1.8, 2.4]

/** Pipe organ pipe radius in meters. */
export const ORGAN_PIPE_RADIUS_M = 0.18

/** Spacing between adjacent organ pipes along the wall (z axis on the west wall). */
export const ORGAN_PIPE_SPACING_M = 0.55

/**
 * Distance from the door center to the first organ pipe on either side.
 * The west door spans z = -1.125 to +1.125; an offset of 1.55 keeps the
 * first pipe outside the door panel.
 */
export const ORGAN_DOOR_OFFSET_M = 1.55

/**
 * Returns the landmark entry for a given wall, or `undefined` if the wall is
 * not assigned a landmark in this slice. Used by tests to keep the per-wall
 * lookup contract explicit.
 */
export function landmarkForWall(wall: LandmarkWall): ArenaLandmark | undefined {
  return arenaLandmarks.find((l) => l.wall === wall)
}
