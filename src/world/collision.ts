// Simple 2D collision, seen from above: walls are rectangles on the floor (x/z),
// the player is a circle. This is enough for a museum with straight walls.

export interface WallBox {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

// Player "body" radius in metres. Keeps the camera from getting too close to walls.
export const PLAYER_RADIUS = 0.3

const WALL_THICKNESS = 0.2

// The four outer walls of a room centred on (0, 0), as collision boxes.
// Room.tsx draws these same boxes, so what you see is exactly what you bump into.
export function buildRoomWalls(width: number, depth: number): WallBox[] {
  const halfW = width / 2
  const halfD = depth / 2
  const t = WALL_THICKNESS
  return [
    { minX: -halfW - t, maxX: halfW + t, minZ: -halfD - t, maxZ: -halfD }, // back
    { minX: -halfW - t, maxX: halfW + t, minZ: halfD, maxZ: halfD + t }, // front
    { minX: -halfW - t, maxX: -halfW, minZ: -halfD, maxZ: halfD }, // left
    { minX: halfW, maxX: halfW + t, minZ: -halfD, maxZ: halfD }, // right
  ]
}

function circleHitsBox(x: number, z: number, radius: number, box: WallBox): boolean {
  // Find the point of the box closest to the circle's centre, then measure the distance.
  const closestX = Math.max(box.minX, Math.min(x, box.maxX))
  const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ))
  const dx = x - closestX
  const dz = z - closestZ
  return dx * dx + dz * dz < radius * radius
}

function hitsAnyWall(x: number, z: number, walls: WallBox[]): boolean {
  return walls.some((box) => circleHitsBox(x, z, PLAYER_RADIUS, box))
}

// Try to move by (dx, dz). We test each direction separately: if only one direction
// is blocked, the player slides along the wall; if both are blocked (a corner),
// the player stops. This is what prevents slipping through corners diagonally.
export function moveWithCollision(
  x: number,
  z: number,
  dx: number,
  dz: number,
  walls: WallBox[],
): { x: number; z: number } {
  let newX = x
  let newZ = z
  if (!hitsAnyWall(x + dx, z, walls)) newX = x + dx
  if (!hitsAnyWall(newX, z + dz, walls)) newZ = z + dz
  return { x: newX, z: newZ }
}
