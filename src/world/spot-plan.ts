import type { RoomId } from '../types'
import { EXHIBIT_SPOTS, SPOTLIGHT_ID, panelOffset, roomById, toWorld } from './layout'
import { ROOM_THEMES } from './room-themes'

// MUSEUM SPOTLIGHTS: like a real museum, each room is fairly dark and the exhibits are lit
// by warm spotlights from the ceiling. Six real spotlights follow the visitor from room
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

// Six: CMCN 3 has five inventions and an overview board, CMCN 4 six inventions. (Every
// lamp costs a little drawing work for each pixel, so not more than the busiest room needs.)
export const SPOT_COUNT = 6

// The point halfway between an exhibit and its text board.
const mid = (spot: (typeof EXHIBIT_SPOTS)[number]): [number, number] => {
  const d = (spot.panelSide * panelOffset(spot.id)) / 2
  return [spot.x + Math.cos(spot.yaw) * d, spot.z - Math.sin(spot.yaw) * d]
}

function eraRoom(id: RoomId): SpotAim[] {
  const room = roomById(id)
  if (!room) return []
  // One lamp for each invention (aimed at it and its board), and one on the era number.
  // Taller rooms (CMCN 3 and 4) hang the lamps higher; light fades with the square of the
  // distance, so they shine brighter to light their exhibits just as well.
  const reach = ((room.height - 0.25) / 5.25) ** 2
  // (The overview board glows by itself; its lamp now lights the era number instead: a
  // soft wash down the middle of the back wall.)
  const [nx, nz] = toWorld(room.frame, 0, room.vBack - 0.05)
  const [wx, wz] = toWorld(room.frame, 0, room.vBack - 2.8)
  const overviewAim: SpotAim[] = [{ from: [wx, room.height - 0.25, wz], to: [nx, room.height / 2 + 0.2, nz], strength: 0.4 * reach }]
  const { primary } = ROOM_THEMES[id as Exclude<RoomId, 'rotunda'>].lighting
  return EXHIBIT_SPOTS.filter((spot) => spot.room === id && spot.kind === 'corner')
    // Like a real gallery (leader's reference photos): each lamp hangs in front of its
    // exhibit and shines down at an angle onto it, so the light falls on the face the
    // visitor sees and spreads into a soft pool on the floor around the plinth.
    // The lamp is turned about 30 degrees to one side (towards the exhibit's board): lit
    // from straight ahead an object looks flat, from the side its shape shows in light and
    // shade (the room's soft fill keeps the shadow side readable).
    .map((spot): SpotAim => ({
      // Centred between the exhibit and its board, so one pool of light covers both.
      from: [mid(spot)[0] + Math.sin(spot.yaw) * 2.8, room.height - 0.25, mid(spot)[1] + Math.cos(spot.yaw) * 2.8],
      to: [mid(spot)[0], 1.2, mid(spot)[1]],
      // A hierarchy, as in a curated gallery: AI, the spotlight exhibit, gets the strongest
      // light of the museum, each room's main exhibit (room-themes.ts) the next, the others
      // a little less, so not every exhibit shouts equally.
      strength: reach * (spot.id === SPOTLIGHT_ID ? 2.1 : spot.id === primary ? 1.8 : 1.45),
    }))
    .concat(overviewAim)
}

function hall(): SpotAim[] {
  const room = roomById('hall')
  if (!room) return []
  // One lamp in front of each of the five information boards, shining onto it.
  return ['hall-intro', 'hall-overview', 'hall-team', 'hall-credits'].flatMap((id) => {
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
  // ...and the strongest, on the quiz lectern: the centre of attention. A soft, wide beam
  // from a little in front, aimed at the foot of the stand, so it lights the platform and
  // the stand without glaring off the panel's face (straight above, it blinded the screen).
  const [cx, cz] = toWorld(room.frame, 0, v + 0.45)
  const [lx, lz] = toWorld(room.frame, 0, v - 1.6)
  aims.push({ from: [lx, room.height - 0.25, lz], to: [cx, 0, cz], strength: 0.55 })
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
// (The exhibit halls are kept dark, so the exhibits in their spotlights stand out like a
// stage: leader, "cinematic and dramatic".)
// (Now set per room in room-themes.ts, lighting.wash.)

function roomKey(id: RoomId): KeyAim[] {
  const room = roomById(id)
  if (!room) return []
  const depth = room.vBack - room.vFront
  // From the ceiling near the entrance towards the back of the room, so shadows fall away
  // from the visitor like stage lighting.
  const [fx, fz] = toWorld(room.frame, 0, room.vFront + depth * 0.3)
  const [tx, tz] = toWorld(room.frame, 0, room.vBack - depth * 0.25)
  // Only a faint wash: the room stays dim so the exhibit spotlights stand out.
  return [{ from: [fx, room.height - 0.15, fz], to: [tx, 0, tz], angle: 1.05, intensity: ROOM_THEMES[id as Exclude<RoomId, 'rotunda'>].lighting.wash }]
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
