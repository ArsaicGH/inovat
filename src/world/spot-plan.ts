import type { RoomId } from '../types'
import { CHANDELIER_Y, EXHIBIT_SPOTS, ROOMS, ROTUNDA_APOTHEM, panelPosition, roomById, toWorld } from './layout'

// MUSEUM SPOTLIGHTS: like a real museum, each room is fairly dark and the exhibits are lit
// by warm spotlights from the ceiling. Five real spotlights follow the visitor from room
// to room (Museum.tsx; their number never changes, see Lighting), and this plan says
// where they hang and what they light in each part. Small ceiling fixtures are drawn at
// the same places (SpotFixtures.tsx).

export type Vec3 = [number, number, number]
export interface SpotAim {
  from: Vec3 // where the lamp hangs
  to: Vec3 // the point it lights
  strength?: number // share of the full brightness (boards on walls need less)
}

export const SPOT_COUNT = 5

function eraRoom(id: RoomId): SpotAim[] {
  const room = roomById(id)
  if (!room) return []
  const [cx, cz] = toWorld(room.frame, 0, (room.vFront + room.vBack) / 2)
  // One lamp per corner invention, hung a little towards the middle of the room so the
  // light falls on the front of the prototype; the fifth lights the overview board.
  const overview = EXHIBIT_SPOTS.find((spot) => spot.room === id && spot.kind === 'overview')
  // (Further from the wall and dimmer: close to a pale wall it made a glaring patch.)
  const [ox, oz] = toWorld(room.frame, 0, room.vBack - 3.2)
  const overviewAim: SpotAim[] = overview ? [{ from: [ox, room.height - 0.25, oz], to: [overview.x, 2.1, overview.z], strength: 0.4 }] : []
  return EXHIBIT_SPOTS.filter((spot) => spot.room === id && spot.kind === 'corner').map((spot): SpotAim => {
    const dx = cx - spot.x
    const dz = cz - spot.z
    const length = Math.hypot(dx, dz) || 1
    return {
      from: [spot.x + (dx / length) * 1.8, room.height - 0.25, spot.z + (dz / length) * 1.8],
      to: [spot.x, 1.1, spot.z],
    }
  }).concat(overviewAim)
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
    return [{ from: [spot.x + fx * 2, room.height - 0.25, spot.z + fz * 2] as Vec3, to: [spot.x, 1.65, spot.z] as Vec3, strength: 0.55 }]
  })
}

function quiz(): SpotAim[] {
  const room = roomById('quiz')
  if (!room) return []
  const aims: SpotAim[] = []
  // Two lamps on the big screen...
  for (const u of [-2.8, 2.8]) {
    const [tx, tz] = toWorld(room.frame, u, room.vBack - 0.2)
    const [fx, fz] = toWorld(room.frame, u, room.vBack - 2.6)
    aims.push({ from: [fx, room.height - 0.25, fz], to: [tx, 2.2, tz] })
  }
  // ...and two on the pedestal and its board.
  const info = EXHIBIT_SPOTS.find((s) => s.id === 'quiz-info')
  if (info) {
    const [px, pz] = panelPosition(info)
    const [cx, cz] = toWorld(room.frame, 0, (room.vFront + room.vBack) / 2)
    for (const [x, z, y] of [
      [info.x, info.z, 1.1],
      [px, pz, 1.55],
    ]) {
      const dx = cx - x
      const dz = cz - z
      const length = Math.hypot(dx, dz) || 1
      aims.push({ from: [x + (dx / length) * 1.8, room.height - 0.25, z + (dz / length) * 1.8], to: [x, y, z] })
    }
  }
  return aims
}

function rotunda(): SpotAim[] {
  // Wall-mounted lamps high above the four grand era portals, washing light down them,
  // and one from the dome onto the centrepiece.
  const portals = ROOMS.filter((room) => room.doorStyle === 'grand').map((room) => {
    const [tx, tz] = toWorld(room.frame, 0, ROTUNDA_APOTHEM - 0.1)
    const [fx, fz] = toWorld(room.frame, 0, ROTUNDA_APOTHEM - 1.2)
    return { from: [fx, 7.3, fz] as Vec3, to: [tx, 2.4, tz] as Vec3 }
  })
  // (Hung just under the chandelier, so its lamp is not floating in the air.)
  return [...portals, { from: [0, CHANDELIER_Y - 0.6, 0.8], to: [0, 1.6, 0] }]
}

export const SPOT_PLANS = new Map<RoomId, SpotAim[]>([
  ['rotunda', rotunda()],
  ['hall', hall()],
  ['ir1', eraRoom('ir1')],
  ['ir2', eraRoom('ir2')],
  ['ir3', eraRoom('ir3')],
  ['ir4', eraRoom('ir4')],
  ['quiz', quiz()],
])
