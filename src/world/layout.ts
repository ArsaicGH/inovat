import type { RoomId } from '../types'
import type { Box } from './collision'

// MUSEUM FLOOR PLAN, seen from above, in metres. x = left/right, z = up/down on the map
// (-z is "north", towards the quiz room).
//
// A 12-sided rotunda sits in the middle, with flat sides facing north and south. Every
// other side has a door (6 doors, 6 blank walls). Behind each door a short passage leads
// to one room. Walls, collision boxes, exhibit spots, doors and spawn points are ALL
// calculated here, so what you see always matches what you bump into.
//
// Each room is first described in its own local directions, then turned into place:
//   u = sideways (along the rotunda side), v = outwards from the rotunda centre.

export const WALL_THICKNESS = 0.2
const T = WALL_THICKNESS

export const ROTUNDA_SIDES = 12
export const ROTUNDA_APOTHEM = 12 // centre to the middle of each side: 24 m across (leader's choice)
export const ROTUNDA_RADIUS = ROTUNDA_APOTHEM / Math.cos(Math.PI / ROTUNDA_SIDES) // centre to each corner
const SIDE_LENGTH = 2 * ROTUNDA_APOTHEM * Math.tan(Math.PI / ROTUNDA_SIDES) // about 6.4 m
export const ROTUNDA_HEIGHT = 8

const DOOR_WIDTH = 2.4
// Rooms start this far from the centre. Closer, and neighbouring rooms would overlap.
const ROOM_START = 15
const CORNER_INSET = 2.4 // how far corner exhibits stand from the walls
const PANEL_OFFSET = 1.3 // text panel distance from the centre of its pedestal

export type DoorStyle = 'grand' | 'plain'
const DOOR_HEIGHT: Record<DoorStyle, number> = { grand: 3.6, plain: 3 }

// side: which rotunda side the room is on, counted clockwise from north (0 = north).
const ROOM_SPECS: { id: RoomId; side: number; width: number; depth: number; doorStyle: DoorStyle }[] = [
  { id: 'hall', side: 6, width: 12, depth: 10, doorStyle: 'plain' }, // south: start
  { id: 'ir1', side: 8, width: 14, depth: 14, doorStyle: 'grand' }, // south-west
  { id: 'ir2', side: 10, width: 14, depth: 14, doorStyle: 'grand' }, // north-west
  { id: 'ir3', side: 2, width: 14, depth: 14, doorStyle: 'grand' }, // north-east
  { id: 'ir4', side: 4, width: 14, depth: 14, doorStyle: 'grand' }, // south-east
  { id: 'quiz', side: 0, width: 12, depth: 10, doorStyle: 'plain' }, // north: end
]
const ROOM_HEIGHT = 4.5

// A collision box. cos/sin are stored so they are not recalculated every frame.
// (Kept here, not in collision.ts, so this file only borrows TYPES from other files and a
// plain Node test script can load it.)
function makeBox(cx: number, cz: number, hx: number, hz: number, angle = 0): Box {
  return { cx, cz, hx, hz, angle, cos: Math.cos(angle), sin: Math.sin(angle) }
}

// ---------- Directions ----------

// The local directions of one rotunda side: n points outwards, t along the side.
export interface Frame {
  nx: number
  nz: number
  tx: number
  tz: number
  angle: number // mesh rotation.y that lines up a mesh's x axis with t
}

function frameOfSide(side: number): Frame {
  const phi = (side * 2 * Math.PI) / ROTUNDA_SIDES
  return { nx: Math.sin(phi), nz: -Math.cos(phi), tx: Math.cos(phi), tz: Math.sin(phi), angle: -phi }
}

export function toWorld(f: Frame, u: number, v: number): [number, number] {
  return [u * f.tx + v * f.nx, u * f.tz + v * f.nz]
}

export function toLocal(f: Frame, x: number, z: number): [number, number] {
  return [x * f.tx + z * f.tz, x * f.nx + z * f.nz]
}

// Rotation that turns an object's front (+z) towards direction (dx, dz).
function faceTowards(dx: number, dz: number): number {
  return Math.atan2(dx, dz)
}

// Camera yaw (0 = looking towards -z) that looks in direction (dx, dz).
function lookTowards(dx: number, dz: number): number {
  return Math.atan2(-dx, -dz)
}

// ---------- Rooms ----------

export interface RoomLayout {
  id: RoomId
  frame: Frame
  width: number
  depth: number
  height: number
  vFront: number // local v of the room's front (door) wall's inner face
  vBack: number // local v of the back wall's inner face
  doorStyle: DoorStyle
  doorHeight: number
  spawn: [number, number] // world x, z
  spawnYaw: number
}

export const ROOMS: RoomLayout[] = ROOM_SPECS.map((spec) => {
  const frame = frameOfSide(spec.side)
  const vFront = ROOM_START + T
  const vBack = vFront + spec.depth
  // Start the visit at the back of the hall looking towards the rotunda;
  // everywhere else arrive just inside the entrance, looking into the room.
  const isStart = spec.id === 'hall'
  const spawnV = isStart ? vBack - 2 : vFront + 1.5
  const look = isStart ? -1 : 1
  return {
    ...spec,
    frame,
    height: ROOM_HEIGHT,
    vFront,
    vBack,
    doorHeight: DOOR_HEIGHT[spec.doorStyle],
    spawn: toWorld(frame, 0, spawnV),
    spawnYaw: lookTowards(look * frame.nx, look * frame.nz),
  }
})

export function roomById(id: RoomId): RoomLayout | undefined {
  return ROOMS.find((room) => room.id === id)
}

// Arriving in the rotunda (from the map): just inside the hall's door, facing the centre.
const hallFrame = frameOfSide(6)
export const ROTUNDA_SPAWN: [number, number] = toWorld(hallFrame, 0, ROTUNDA_APOTHEM - 2.5)
export const ROTUNDA_SPAWN_YAW = lookTowards(-hallFrame.nx, -hallFrame.nz)

export function spawnOf(id: RoomId): { x: number; z: number; yaw: number } {
  const room = roomById(id)
  if (!room) return { x: ROTUNDA_SPAWN[0], z: ROTUNDA_SPAWN[1], yaw: ROTUNDA_SPAWN_YAW }
  return { x: room.spawn[0], z: room.spawn[1], yaw: room.spawnYaw }
}

// Which room (or room's passage) contains this point. `inside` is false in a passage.
export function regionAt(x: number, z: number): { room: RoomId; inside: boolean } | undefined {
  for (const room of ROOMS) {
    const [u, v] = toLocal(room.frame, x, z)
    if (Math.abs(u) <= room.width / 2 && v >= room.vFront && v <= room.vBack) return { room: room.id, inside: true }
    if (Math.abs(u) <= DOOR_WIDTH / 2 && v >= ROTUNDA_APOTHEM && v < room.vFront) return { room: room.id, inside: false }
  }
  // Inside the 12-sided rotunda: within the apothem in every side's direction.
  for (let side = 0; side < ROTUNDA_SIDES; side++) {
    const [, v] = toLocal(frameOfSide(side), x, z)
    if (v > ROTUNDA_APOTHEM) return undefined
  }
  return { room: 'rotunda', inside: true }
}

// ---------- Walls ----------

// A wall block. `solid` blocks walking; beams above doorways are only visual.
// `group` says which part of the museum it belongs to (used to hide unseen rooms).
export interface WallPiece extends Box {
  minY: number
  maxY: number
  solid: boolean
  group: RoomId
}

// A box given by its local u/v range, turned into place.
function localBox(f: Frame, u0: number, u1: number, v0: number, v1: number): Box {
  const [cx, cz] = toWorld(f, (u0 + u1) / 2, (v0 + v1) / 2)
  // The box's own x axis runs along t (sideways) and its z axis along n (outwards).
  return makeBox(cx, cz, (u1 - u0) / 2, (v1 - v0) / 2, f.angle)
}

function piece(group: RoomId, box: Box, minY: number, maxY: number, solid = true): WallPiece {
  return { ...box, minY, maxY, solid, group }
}

function buildWalls(): WallPiece[] {
  const pieces: WallPiece[] = []
  const halfSide = SIDE_LENGTH / 2
  const halfDoor = DOOR_WIDTH / 2
  const a = ROTUNDA_APOTHEM

  // Rotunda: 12 sides; door sides get two wall pieces and a beam above the door.
  for (let side = 0; side < ROTUNDA_SIDES; side++) {
    const f = frameOfSide(side)
    const room = ROOMS.find((r) => r.frame.angle === f.angle)
    if (room) {
      pieces.push(piece('rotunda', localBox(f, -halfSide, -halfDoor, a, a + T), 0, ROTUNDA_HEIGHT))
      pieces.push(piece('rotunda', localBox(f, halfDoor, halfSide, a, a + T), 0, ROTUNDA_HEIGHT))
      pieces.push(piece('rotunda', localBox(f, -halfDoor, halfDoor, a, a + T), room.doorHeight, ROTUNDA_HEIGHT, false))
    } else {
      pieces.push(piece('rotunda', localBox(f, -halfSide, halfSide, a, a + T), 0, ROTUNDA_HEIGHT))
    }
  }

  // Each room: passage walls, front wall with an opening, side walls, back wall.
  // Blocks touch but never overlap, which prevents flickering surfaces (z-fighting).
  for (const room of ROOMS) {
    const f = room.frame
    const halfW = room.width / 2
    const front = ROOM_START
    const h = room.height
    const ph = room.doorHeight // the passage is as tall as its door
    pieces.push(piece(room.id, localBox(f, -halfDoor - T, -halfDoor, a + T, front), 0, ph))
    pieces.push(piece(room.id, localBox(f, halfDoor, halfDoor + T, a + T, front), 0, ph))
    pieces.push(piece(room.id, localBox(f, -halfW - T, -halfDoor, front, front + T), 0, h))
    pieces.push(piece(room.id, localBox(f, halfDoor, halfW + T, front, front + T), 0, h))
    pieces.push(piece(room.id, localBox(f, -halfDoor, halfDoor, front, front + T), ph, h, false))
    pieces.push(piece(room.id, localBox(f, -halfW - T, -halfW, room.vFront, room.vBack), 0, h))
    pieces.push(piece(room.id, localBox(f, halfW, halfW + T, room.vFront, room.vBack), 0, h))
    pieces.push(piece(room.id, localBox(f, -halfW - T, halfW + T, room.vBack, room.vBack + T), 0, h))
  }
  return pieces
}

export const WALL_PIECES = buildWalls()

// Floors and ceilings of passages and rooms (the rotunda has its own 12-sided ones).
export interface Surface {
  group: RoomId
  box: Box // only the centre, size and angle are used
  ceilingHeight: number
}

export const SURFACES: Surface[] = ROOMS.flatMap((room) => [
  {
    group: room.id,
    box: localBox(room.frame, -DOOR_WIDTH / 2, DOOR_WIDTH / 2, ROTUNDA_APOTHEM, room.vFront),
    ceilingHeight: room.doorHeight,
  },
  {
    group: room.id,
    box: localBox(room.frame, -room.width / 2, room.width / 2, room.vFront, room.vBack),
    ceilingHeight: room.height,
  },
])

// The 12 rotunda corners, where pillars stand.
export const PILLARS: [number, number][] = Array.from({ length: ROTUNDA_SIDES }, (_, i) => {
  const theta = ((i + 0.5) * 2 * Math.PI) / ROTUNDA_SIDES
  return [ROTUNDA_RADIUS * Math.sin(theta), -ROTUNDA_RADIUS * Math.cos(theta)]
})
export const PILLAR_RADIUS = 0.4

// ---------- Doors ----------

export interface DoorLayout {
  room: RoomId // the room behind the door
  style: DoorStyle
  width: number
  height: number
  frame: Frame
  centre: [number, number] // middle of the doorway (world x, z)
  blocker: Box // collision box while the door is closed
}

export const DOORS: DoorLayout[] = ROOMS.map((room) => ({
  room: room.id,
  style: room.doorStyle,
  width: DOOR_WIDTH,
  height: room.doorHeight,
  frame: room.frame,
  centre: toWorld(room.frame, 0, ROTUNDA_APOTHEM + T / 2),
  blocker: localBox(room.frame, -DOOR_WIDTH / 2, DOOR_WIDTH / 2, ROTUNDA_APOTHEM, ROTUNDA_APOTHEM + T),
}))

// ---------- Exhibits ----------

// corner = era-room invention (pedestal + prototype + text panel beside it)
// wall   = intro-hall information panel on a wall
// centre = a pedestal in the middle of a room (quiz room sign for now)
export type SpotKind = 'corner' | 'wall' | 'centre'

export interface ExhibitSpot {
  id: string // matches the text id in src/content/exhibits.ts
  room: RoomId
  kind: SpotKind
  number: number // 1-4 for corners (used to vary the placeholder shape)
  x: number
  z: number
  yaw: number // rotation so the exhibit's front faces the visitor
  panelSide: 1 | -1 // which side of the pedestal the text panel stands on
}

function buildSpots(): ExhibitSpot[] {
  const spots: ExhibitSpot[] = []

  for (const room of ROOMS) {
    const f = room.frame
    const at = (u: number, v: number) => toWorld(f, u, v)

    if (room.id === 'hall') {
      // Information panels on the two side walls, 1 cm off the wall surface.
      const wallU = room.width / 2 - 0.01
      const panels: [string, number, number][] = [
        ['hall-intro', -1, room.vBack - 3],
        ['hall-overview', -1, room.vFront + 3.5],
        ['hall-team', 1, room.vBack - 2.5],
        ['hall-credits', 1, room.vFront + 5],
        ['hall-sources', 1, room.vFront + 2.5],
      ]
      for (const [id, sideU, v] of panels) {
        const [x, z] = at(sideU * wallU, v)
        // Face into the room: towards -sideU along t.
        spots.push({ id, room: room.id, kind: 'wall', number: 0, x, z, yaw: faceTowards(-sideU * f.tx, -sideU * f.tz), panelSide: 1 })
      }
    } else if (room.id === 'quiz') {
      const [x, z] = at(0, (room.vFront + room.vBack) / 2)
      spots.push({ id: 'quiz-info', room: room.id, kind: 'centre', number: 0, x, z, yaw: faceTowards(-f.nx, -f.nz), panelSide: 1 })
    } else {
      // Four corners, numbered in walking order: front-left, back-left, back-right, front-right
      // (as seen when entering the room).
      const centreV = (room.vFront + room.vBack) / 2
      const corners: [number, number][] = [[-1, 1], [-1, -1], [1, -1], [1, 1]]
      corners.forEach(([su, sv], i) => {
        const u = su * (room.width / 2 - CORNER_INSET)
        const v = sv > 0 ? room.vFront + CORNER_INSET : room.vBack - CORNER_INSET
        const [x, z] = at(u, v)
        const [cx, cz] = at(0, centreV)
        const yaw = faceTowards(cx - x, cz - z)
        // Put the text panel on the side towards the nearer side wall, away from the walkway:
        // the panel moves along the exhibit's local x axis, (cos yaw, -sin yaw).
        const sideways = Math.cos(yaw) * f.tx - Math.sin(yaw) * f.tz
        const panelSide = u * sideways >= 0 ? 1 : -1
        spots.push({ id: `${room.id}-${i + 1}`, room: room.id, kind: 'corner', number: i + 1, x, z, yaw, panelSide })
      })
    }
  }
  return spots
}

export const EXHIBIT_SPOTS = buildSpots()

// Where a spot's text panel stands (beside the pedestal, along the exhibit's local x axis).
export function panelPosition(spot: ExhibitSpot): [number, number] {
  const d = spot.panelSide * PANEL_OFFSET
  return [spot.x + Math.cos(spot.yaw) * d, spot.z - Math.sin(spot.yaw) * d]
}

// ---------- Collision ----------

// Everything fixed that the player bumps into: solid walls, pillars, pedestals and
// panel stands. (Closed doors are added separately, because they open and close.)
export const COLLISION_BOXES: Box[] = [
  ...WALL_PIECES.filter((p) => p.solid),
  ...PILLARS.map(([x, z]) => makeBox(x, z, PILLAR_RADIUS, PILLAR_RADIUS)),
  ...EXHIBIT_SPOTS.filter((spot) => spot.kind !== 'wall').flatMap((spot) => {
    const [px, pz] = panelPosition(spot)
    return [makeBox(spot.x, spot.z, 0.6, 0.6, spot.yaw), makeBox(px, pz, 0.35, 0.35, spot.yaw)]
  }),
]
