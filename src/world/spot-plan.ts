import type { RoomId } from '../types'
import { EXHIBIT_SPOTS, roomById, toWorld } from './layout'

// MUSEUM SPOTLIGHTS: like a real museum, each room is fairly dark and the exhibits are lit
// by warm spotlights from the ceiling. Five real spotlights follow the visitor from room
// to room (Museum.tsx; their number never changes, see Lighting), and this plan says
// where they hang and what they light in each room. (The rotunda is lit by its
// chandelier and has no spotlights.) Small ceiling fixtures are drawn at
// the same places (SpotFixtures.tsx).

export type Vec3 = [number, number, number]
export interface SpotAim {
  from: Vec3 // where the lamp hangs
  to: Vec3 // the point it lights
  strength?: number // share of the full brightness (boards on walls need less)
  narrow?: boolean // a tight beam on one object (exhibits) instead of a wider one (boards)
}

export const SPOT_COUNT = 5

function eraRoom(id: RoomId): SpotAim[] {
  const room = roomById(id)
  if (!room) return []
  // One lamp straight above each corner invention, shining down, so the pool of light is
  // centred on the exhibit; the fifth lights the overview board.
  const overview = EXHIBIT_SPOTS.find((spot) => spot.room === id && spot.kind === 'overview')
  // (Further from the wall and dimmer: close to a pale wall it made a glaring patch.)
  const [ox, oz] = toWorld(room.frame, 0, room.vBack - 3.2)
  const overviewAim: SpotAim[] = overview ? [{ from: [ox, room.height - 0.25, oz], to: [overview.x, 2.1, overview.z], strength: 0.21 }] : []
  return EXHIBIT_SPOTS.filter((spot) => spot.room === id && spot.kind === 'corner')
    .map((spot): SpotAim => ({ from: [spot.x, room.height - 0.25, spot.z], to: [spot.x, 0, spot.z], narrow: true }))
    .concat(overviewAim)
}

function hall(): SpotAim[] {
  const room = roomById('hall')
  if (!room) return []
  // One lamp in front of each of the five information boards, shining onto it.
  return ['hall-intro', 'hall-overview', 'hall-team', 'hall-credits', 'hall-sources'].flatMap((id) => {
    const spot = EXHIBIT_SPOTS.find((s) => s.id === id)
    if (!spot) return []
    const fx = Math.sin(spot.yaw) // the direction the board faces
    const fz = Math.cos(spot.yaw)
    return [{ from: [spot.x + fx * 2, room.height - 0.25, spot.z + fz * 2] as Vec3, to: [spot.x, 1.65, spot.z] as Vec3, strength: 0.29 }]
  })
}

function quiz(): SpotAim[] {
  const room = roomById('quiz')
  if (!room) return []
  const aims: SpotAim[] = []
  const v = (room.vFront + room.vBack) / 2
  // Two faint lamps on the portal door in the back wall, just enough to pick it out (at a
  // third of their old strength: brighter, they competed with the lectern. Leader.)...
  for (const u of [-1.4, 1.4]) {
    const [tx, tz] = toWorld(room.frame, u * 0.5, room.vBack - 0.1)
    const [fx, fz] = toWorld(room.frame, u, room.vBack - 2.2)
    aims.push({ from: [fx, room.height - 0.25, fz], to: [tx, 1.7, tz], strength: 0.05 })
  }
  // ...one on the middle panel of each side wall...
  for (const side of [-1, 1]) {
    const [tx, tz] = toWorld(room.frame, side * (room.width / 2 - 0.05), v)
    const [fx, fz] = toWorld(room.frame, side * (room.width / 2 - 2.2), v)
    aims.push({ from: [fx, room.height - 0.25, fz], to: [tx, 2.3, tz], strength: 0.2 })
  }
  // ...and by far the strongest, a tight beam on the quiz lectern: the centre of attention.
  const [cx, cz] = toWorld(room.frame, 0, v + 0.45)
  aims.push({ from: [cx, room.height - 0.25, cz], to: [cx, 0.9, cz], narrow: true, strength: 1.1 })
  return aims
}

export const SPOT_PLANS = new Map<RoomId, SpotAim[]>([
  ['hall', hall()],
  ['ir1', eraRoom('ir1')],
  ['ir2', eraRoom('ir2')],
  ['ir3', eraRoom('ir3')],
  ['ir4', eraRoom('ir4')],
  ['quiz', quiz()],
])

// KEY LIGHT: one large, soft spotlight per area, from high above, that gives the area its
// main light and is the ONLY light that casts shadows (CLAUDE.md allows one). It moves to
// the area you are in, so its shadows are sharp and local (Museum.tsx, Lighting).
export interface KeyAim extends SpotAim {
  angle: number // half-width of the light cone (radians)
  intensity: number
}

// How strong each room's wash is: the darker the room, the more the exhibits stand out.
// (The intro hall is a bright, welcoming lobby; only the era rooms are dim.)
const WASH: Partial<Record<RoomId, number>> = { hall: 40, ir1: 12, ir2: 9, ir3: 7, ir4: 7, quiz: 6 }

function roomKey(id: RoomId): KeyAim[] {
  const room = roomById(id)
  if (!room) return []
  const depth = room.vBack - room.vFront
  // From the ceiling near the entrance towards the back of the room, so shadows fall away
  // from the visitor like stage lighting.
  const [fx, fz] = toWorld(room.frame, 0, room.vFront + depth * 0.3)
  const [tx, tz] = toWorld(room.frame, 0, room.vBack - depth * 0.25)
  // Only a faint wash: the room stays dim so the exhibit spotlights stand out.
  return [{ from: [fx, room.height - 0.15, fz], to: [tx, 0, tz], angle: 1.05, intensity: WASH[id] ?? 10 }]
}

export const KEY_PLANS = new Map<RoomId, KeyAim>(
  [
    // Rotunda: a soft-edged spotlight from the dome onto the centrepiece (not so bright that
    // it washes it out). The hall around stays welcoming: the chandelier and an even fill
    // light it (see Lighting in Museum.tsx), so only the light from above was toned down.
    ['rotunda', { from: [0, 11.8, 1.2], to: [0, 0.8, 0], angle: 0.36, intensity: 210 } as KeyAim],
    ...(['hall', 'ir1', 'ir2', 'ir3', 'ir4', 'quiz'] as RoomId[]).flatMap((id) => roomKey(id).map((key) => [id, key] as [RoomId, KeyAim])),
  ],
)
