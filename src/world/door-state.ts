import type { RoomId } from '../types'
import type { Box } from './collision'
import { DOORS } from './layout'

// How far each door is open: 0 = shut, 1 = fully open. Doors.tsx animates these values;
// the player's collision and the "hide unseen rooms" logic read them.
export const doorOpen = new Map<RoomId, number>(DOORS.map((door) => [door.room, 0]))

// A door blocks walking until it is almost fully open.
const PASSABLE_FROM = 0.85

// Collision boxes of the doors that are currently closed. The same array is reused every
// frame (no new garbage for the browser to clean up).
const blockers: Box[] = []
export function closedDoorBlockers(): Box[] {
  blockers.length = 0
  for (const door of DOORS) {
    if ((doorOpen.get(door.room) ?? 0) < PASSABLE_FROM) blockers.push(door.blocker)
  }
  return blockers
}

// Is a part of the museum worth drawing, seen from room `here`? Rooms hide behind closed
// doors: a room is drawn while you are in it (or its passage) or while its door is open;
// the rotunda while you are in it or the door of the room you are in is open.
export function isPartVisible(part: RoomId, here: RoomId): boolean {
  const isOpen = (room: RoomId) => (doorOpen.get(room) ?? 0) > 0
  return part === 'rotunda' ? here === 'rotunda' || isOpen(here) : here === part || isOpen(part)
}
