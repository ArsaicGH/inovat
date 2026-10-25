// Simple 2D collision, seen from above: walls are rectangles on the floor (x/z) that may
// be ROTATED (the rooms around the rotunda sit at angles), and the player is a circle.
// The rectangles themselves come from the floor plan in layout.ts.

export interface Box {
  cx: number // centre
  cz: number
  hx: number // half size along the box's own x and z axes
  hz: number
  angle: number // rotation around the vertical axis (same as a mesh's rotation.y)
  cos: number // cos/sin of angle (see makeBox in layout.ts)
  sin: number
}

// Player "body" radius in metres. Keeps the camera from getting too close to walls.
export const PLAYER_RADIUS = 0.3

function circleHitsBox(x: number, z: number, radius: number, box: Box): boolean {
  // Turn the point into the box's own directions, so the box becomes a plain rectangle.
  const dx = x - box.cx
  const dz = z - box.cz
  const lx = dx * box.cos - dz * box.sin
  const lz = dx * box.sin + dz * box.cos
  // Then: find the point of the rectangle closest to the circle's centre and measure.
  const nearX = Math.max(-box.hx, Math.min(lx, box.hx))
  const nearZ = Math.max(-box.hz, Math.min(lz, box.hz))
  const ex = lx - nearX
  const ez = lz - nearZ
  return ex * ex + ez * ez < radius * radius
}

// `walls` is a list of lists (e.g. fixed walls + currently closed doors).
function hitsAnyWall(x: number, z: number, walls: Box[][]): boolean {
  for (const list of walls) {
    for (const box of list) if (circleHitsBox(x, z, PLAYER_RADIUS, box)) return true
  }
  return false
}

// Try to move by (dx, dz). We test each direction separately: if only one direction
// is blocked, the player slides along the wall; if both are blocked (a corner),
// the player stops. This is what prevents slipping through corners diagonally.
export function moveWithCollision(
  x: number,
  z: number,
  dx: number,
  dz: number,
  walls: Box[][],
): { x: number; z: number } {
  let newX = x
  let newZ = z
  if (!hitsAnyWall(x + dx, z, walls)) newX = x + dx
  if (!hitsAnyWall(newX, z + dz, walls)) newZ = z + dz
  return { x: newX, z: newZ }
}

// True if a circle of the player's size standing at (x, z) touches any box.
export function isBlocked(x: number, z: number, walls: Box[][]): boolean {
  return hitsAnyWall(x, z, walls)
}
