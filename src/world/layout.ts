import { ERA_ROOMS, INVENTIONS, type RoomId } from '../types'
import type { Box } from './collision'

// MUSEUM FLOOR PLAN, seen from above, in metres. x = left/right, z = up/down on the map
// (-z is "north", towards CMCN 3).
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
export const ROTUNDA_APOTHEM = 12 // centre to the middle of each side: 24 m across (leader's choice, more immersive than 18 m)
export const ROTUNDA_RADIUS = ROTUNDA_APOTHEM / Math.cos(Math.PI / ROTUNDA_SIDES) // centre to each corner
export const SIDE_LENGTH = 2 * ROTUNDA_APOTHEM * Math.tan(Math.PI / ROTUNDA_SIDES) // about 6.4 m
export const ROTUNDA_HEIGHT = 8
export const CHANDELIER_Y = 9.4 // height of the chandelier in the rotunda

export const DOOR_WIDTH = 2.4
// Rooms start at least this far from the centre; beyond the rotunda wall this leaves a
// passage. A room must start further out the wider it is: rooms are 60 degrees apart, so
// a room whose half-width is more than tan(30°) = 0.577 times its start distance would
// overlap its neighbour. roomStart() gives the distance, with a little room to spare.
const ROOM_START = 17
function roomStart(width: number): number {
  return Math.max(ROOM_START, Math.ceil((width / 2 / Math.tan(Math.PI / 6) + 0.6) * 10) / 10)
}
const CORNER_INSET = 4.2 // how far corner exhibits stand from the walls (nearer the middle)
const PANEL_OFFSET = 2.3 // text panel distance from the centre of its plinth

// THE SPOTLIGHT EXHIBIT: artificial intelligence, the centre of attention today, stands on a
// larger plinth (scaled up) in the middle of CMCN 4's back wall.
export const SPOTLIGHT_ID = 'ir4-3'
export const SPOTLIGHT_SCALE = 1.4
export const panelOffset = (id: string) => (id === SPOTLIGHT_ID ? 2.9 : PANEL_OFFSET)

// THE ENTRANCE ROOM of each era room (leader's plan): a small room just inside the door
// with the introduction (overview board, hanging era sculpture, floor medallion), opening
// through a doorway into the hall that holds only the exhibits.
export const ANTE_DEPTH = 7
export const ANTE_WIDTH = 11
const INNER_DOOR = 4.2 // width of the doorway from the entrance room into the hall

export type DoorStyle = 'grand' | 'plain'
const DOOR_HEIGHT: Record<DoorStyle, number> = { grand: 3.6, plain: 3 }

// side: which rotunda side the room is on, counted clockwise from north (0 = north).
// The visit goes round the rotunda clockwise, in order (leader): intro hall, CMCN 1 to 4,
// and the Game Room last, right next to the intro hall. The map shows the way round with a
// gold arrow (MapMenu.tsx).
// Era rooms are large and tall, to match the 24 m rotunda (leader: spacious, comfortable),
// and each era is bigger than the one before, as the revolutions grew in scale (leader):
// more room for more inventions (INVENTIONS in types.ts), not more crowding.
const ROOM_SPECS: { id: RoomId; side: number; width: number; depth: number; height: number; doorStyle: DoorStyle }[] = [
  { id: 'hall', side: 6, width: 12, depth: 10, height: 4.5, doorStyle: 'plain' }, // south: start
  // (Era rooms: the depth includes the entrance room, ANTE below. CMCN 4 is the largest, for
  // its futuristic atmosphere and its AI spotlight exhibit: leader.)
  { id: 'ir1', side: 8, width: 18, depth: 18 + ANTE_DEPTH + T, height: 5.5, doorStyle: 'grand' }, // south-west
  { id: 'ir2', side: 10, width: 20, depth: 20 + ANTE_DEPTH + T, height: 5.5, doorStyle: 'grand' }, // north-west
  { id: 'ir3', side: 0, width: 18, depth: 18 + ANTE_DEPTH + T, height: 5.5, doorStyle: 'grand' }, // north
  { id: 'ir4', side: 2, width: 22, depth: 22 + ANTE_DEPTH + T, height: 7, doorStyle: 'grand' }, // north-east
  { id: 'quiz', side: 4, width: 12, depth: 10, height: 4.5, doorStyle: 'plain' }, // south-east: end
]

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

export function frameOfSide(side: number): Frame {
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
  vHall: number // era rooms: local v where the exhibit hall starts (after the entrance room)
  doorStyle: DoorStyle
  doorHeight: number
  spawn: [number, number] // world x, z
  spawnYaw: number
}

export const ROOMS: RoomLayout[] = ROOM_SPECS.map((spec) => {
  const frame = frameOfSide(spec.side)
  const vFront = roomStart(spec.width) + T
  const vBack = vFront + spec.depth
  const vHall = ERA_ROOMS.includes(spec.id) ? vFront + ANTE_DEPTH + T : vFront
  // Arrive just inside the entrance, looking into the room. The visit starts a little
  // further in, facing the INOVAT sign on the hall's back wall.
  const spawnV = spec.id === 'hall' ? vFront + 3 : vFront + 1.5
  return {
    ...spec,
    frame,
    vFront,
    vBack,
    vHall,
    doorHeight: DOOR_HEIGHT[spec.doorStyle],
    spawn: toWorld(frame, 0, spawnV),
    spawnYaw: lookTowards(frame.nx, frame.nz),
  }
})

// The museum is drawn in parts: the rotunda, each room, and the doors (Museum.tsx). The
// loading screen waits for all of them to be prepared for the graphics card.
export const PART_COUNT = ROOMS.length + 2

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
    const front = room.vFront - T
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
    if (room.vHall > room.vFront) {
      // The entrance room: its two side walls, and the wall between it and the hall with a
      // doorway in the middle (and a beam above the doorway).
      const halfA = ANTE_WIDTH / 2
      const halfI = INNER_DOOR / 2
      const wall = room.vHall - T
      pieces.push(piece(room.id, localBox(f, -halfA - T, -halfA, room.vFront, wall), 0, h))
      pieces.push(piece(room.id, localBox(f, halfA, halfA + T, room.vFront, wall), 0, h))
      pieces.push(piece(room.id, localBox(f, -halfW, -halfI, wall, room.vHall), 0, h))
      pieces.push(piece(room.id, localBox(f, halfI, halfW, wall, room.vHall), 0, h))
      pieces.push(piece(room.id, localBox(f, -halfI, halfI, wall, room.vHall), room.doorHeight, h, false))
    }
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
// overview = an era's overview board on a stand in the middle of its room
export type SpotKind = 'corner' | 'wall' | 'centre' | 'overview'

export interface ExhibitSpot {
  id: string // matches the text id in src/content/exhibits.ts
  room: RoomId
  kind: SpotKind
  number: number // 1-6 for inventions (used to vary the placeholder shape)
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
        ['hall-team', 1, room.vBack - 3],
        ['hall-credits', 1, room.vFront + 3.5],
      ]
      for (const [id, sideU, v] of panels) {
        const [x, z] = at(sideU * wallU, v)
        // Face into the room: towards -sideU along t.
        spots.push({ id, room: room.id, kind: 'wall', number: 0, x, z, yaw: faceTowards(-sideU * f.tx, -sideU * f.tz), panelSide: 1 })
      }
    } else if (room.id === 'quiz') {
      // No boards here for now: the back wall is the quiz screen (QuizWall.tsx) and the
      // side walls carry decoration (RoomDecor.tsx). (The 'quiz-info' text stays in
      // exhibits.ts, ready if a board comes back.)
    } else {
      // Overview board on a stand in the middle of the room, under the hanging era
      // sculpture, facing the entrance (leader's choice).
      const [ox, oz] = at(0, room.vFront + ANTE_DEPTH / 2)
      spots.push({ id: `${room.id}-overview`, room: room.id, kind: 'overview', number: 0, x: ox, z: oz, yaw: faceTowards(-f.nx, -f.nz), panelSide: 1 })

      // The inventions (INVENTIONS in types.ts: 4, 5, 4 and 5), numbered in walking order as
      // seen when entering: the four corners, plus (with five) the room's headline exhibit in
      // the middle of the hall. sv: 1 = front, 0 = middle, -1 = back.
      const centreV = (room.vHall + room.vBack) / 2
      const places: Record<number, [number, number][]> = {
        4: [[-1, 1], [-1, -1], [1, -1], [1, 1]],
        5: [[-1, 1], [-1, -1], [0, 0], [1, -1], [1, 1]],
      }
      places[INVENTIONS[room.id] ?? 4].forEach(([su, sv], i) => {
        const u = su * (room.width / 2 - CORNER_INSET)
        const v = sv > 0 ? room.vHall + CORNER_INSET : sv < 0 ? room.vBack - CORNER_INSET : centreV
        const [x, z] = at(u, v)
        const [cx, cz] = at(0, centreV)
        const yaw = su === 0 && sv === 0 ? faceTowards(-f.nx, -f.nz) : faceTowards(cx - x, cz - z)
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
  if (spot.kind === 'overview') return [spot.x, spot.z] // the board is the whole exhibit
  const d = spot.panelSide * panelOffset(spot.id)
  return [spot.x + Math.cos(spot.yaw) * d, spot.z - Math.sin(spot.yaw) * d]
}

// ---------- Room decorations that stand on the floor ----------

// Potted plants in the four corners of the intro hall (drawn in RoomDecor.tsx). Local
// coordinates as in RoomDecor: x across the room, z towards the entrance.
export const HALL_PLANTS: [number, number][] = [
  [-5.3, -4.3],
  [5.3, -4.3],
  [-5.3, 4.3],
  [5.3, 4.3],
]

function hallPlantBoxes(): Box[] {
  const hall = roomById('hall')
  if (!hall) return []
  const centreV = (hall.vFront + hall.vBack) / 2
  return HALL_PLANTS.map(([x, z]) => {
    const [wx, wz] = toWorld(hall.frame, x, centreV - z)
    return makeBox(wx, wz, 0.4, 0.4, hall.frame.angle)
  })
}

// THE GAME ROOM'S QUIZ PLATFORM: a low round dais in the middle of the room with the
// quiz lectern on it (a screen on a plinth, RoomDecor.tsx). Distances in the room's own
// coordinates: z from the middle of the room towards the entrance (negative = towards
// the back wall). `width` is the lectern's screen width.
// THE PORTAL in the Game Room's back wall (PortalDoor.tsx, 2.2 m wide): standing in its
// doorway (as close to the wall as the player's body allows) starts the ending.
export function inPortal(x: number, z: number): boolean {
  const room = roomById('quiz')
  if (!room) return false
  const [u, v] = toLocal(room.frame, x, z)
  return Math.abs(u) < 1.0 && v > room.vBack - 0.45
}

export const QUIZ_PLATFORM = { radius: 1.5, height: 0.12, z: 0 }
export const QUIZ_STAND = { z: -0.45, width: 1.25 }
// The quiz screen as laid out in QuizWall.tsx (drawn large, then scaled to QUIZ_STAND.width).
export const QUIZ_BOARD = { y: 2.24, w: 11.2, h: 3.56, bezel: 0.1, depth: 0.16 }

function quizStandBox(): Box[] {
  const room = roomById('quiz')
  if (!room) return []
  const [x, z] = toWorld(room.frame, 0, (room.vFront + room.vBack) / 2 - QUIZ_STAND.z)
  return [makeBox(x, z, QUIZ_STAND.width / 2 + 0.05, 0.35, room.frame.angle)]
}

// The desk of old computers along CMCN 3's back wall (RoomDecor.tsx), local x 0,
// z = 0.7 m in front of the back wall, 4.4 x 0.9 m.
function ir3DeskBox(): Box[] {
  const room = roomById('ir3')
  if (!room) return []
  const [x, z] = toWorld(room.frame, 0, room.vBack - 0.7)
  return [makeBox(x, z, 2.2, 0.45, room.frame.angle)]
}

// ---------- Collision ----------

// Everything fixed that the player bumps into: solid walls, pillars, pedestals and
// panel stands. (Closed doors are added separately, because they open and close.)
export const COLLISION_BOXES: Box[] = [
  ...WALL_PIECES.filter((p) => p.solid),
  // Column bases are about 1 m wide (Rotunda.tsx).
  ...PILLARS.map(([x, z]) => makeBox(x, z, 0.55, 0.55)),
  ...ir3DeskBox(),
  ...quizStandBox(),
  // The centrepiece in the middle of the rotunda (Centrepiece.tsx), about 3.4 m across.
  makeBox(0, 0, 1.75, 1.75, Math.PI / 4),
  ...EXHIBIT_SPOTS.filter((spot) => spot.kind === 'corner' || spot.kind === 'centre').flatMap((spot) => {
    const [px, pz] = panelPosition(spot)
    const plinth = 1.2 * (spot.id === SPOTLIGHT_ID ? SPOTLIGHT_SCALE : 1)
    return [makeBox(spot.x, spot.z, plinth, plinth, spot.yaw), makeBox(px, pz, 0.75, 0.25, spot.yaw)]
  }),
  // The overview boards in the middle of the era rooms (2.4 m wide).
  ...EXHIBIT_SPOTS.filter((spot) => spot.kind === 'overview').map((spot) => makeBox(spot.x, spot.z, 1.25, 0.25, spot.yaw)),
  ...hallPlantBoxes(),
]
