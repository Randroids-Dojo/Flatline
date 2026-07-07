// Circle-vs-grid collision with wall sliding, Doom style: blocked axes are
// dropped independently so hugging a wall never stops lateral movement.

import { CELL_M } from './dungeon'
import type { Vec2 } from './types'

export type SolidAt = (gx: number, gz: number) => boolean

export function circleFits(solidAt: SolidAt, x: number, z: number, radius: number): boolean {
  const minGx = Math.floor((x - radius) / CELL_M)
  const maxGx = Math.floor((x + radius) / CELL_M)
  const minGz = Math.floor((z - radius) / CELL_M)
  const maxGz = Math.floor((z + radius) / CELL_M)
  for (let gz = minGz; gz <= maxGz; gz++) {
    for (let gx = minGx; gx <= maxGx; gx++) {
      if (!solidAt(gx, gz)) {
        continue
      }
      // Closest point on the cell to the circle center.
      const cx = Math.max(gx * CELL_M, Math.min(x, (gx + 1) * CELL_M))
      const cz = Math.max(gz * CELL_M, Math.min(z, (gz + 1) * CELL_M))
      if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < radius * radius) {
        return false
      }
    }
  }
  return true
}

// Attempt the full move, then each axis independently. Returns the final
// position (never inside a wall as long as the start position is valid).
export function moveWithSliding(
  solidAt: SolidAt,
  position: Vec2,
  dx: number,
  dz: number,
  radius: number
): Vec2 {
  // Sub-step long moves so fast frames cannot tunnel through a wall cell.
  const distance = Math.hypot(dx, dz)
  const steps = Math.max(1, Math.ceil(distance / (CELL_M * 0.4)))
  let x = position.x
  let z = position.z
  const stepX = dx / steps
  const stepZ = dz / steps
  for (let i = 0; i < steps; i++) {
    if (circleFits(solidAt, x + stepX, z + stepZ, radius)) {
      x += stepX
      z += stepZ
    } else if (circleFits(solidAt, x + stepX, z, radius)) {
      x += stepX
    } else if (circleFits(solidAt, x, z + stepZ, radius)) {
      z += stepZ
    } else {
      break
    }
  }
  return { x, z }
}
