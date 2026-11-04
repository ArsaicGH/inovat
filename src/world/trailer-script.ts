import { START, TITLE_AT } from './ending-shots'
import { EXHIBIT_SPOTS, QUIZ_STAND, roomById, toWorld, type ExhibitSpot } from './layout'
import type { Vec3, Pose } from './ending-shots'
import type { RoomId } from '../types'

// THE TRAILER (30 seconds, for the team's presentation): opened with ?trailer in the address.
// Every cut falls on a beat of 150 beats a minute (0.4 s), so a soundtrack made to that
// tempo lands on the picture (see PRESENTATION.md for the music brief).
// Cut like a film trailer: a quiet opening, the four eras one by one, a fast montage of every
// invention, the Time Machine, then through the portal into a glimpse of the ending film, a
// beat of black, and the title on the music's climax. The camera flies through the real
// museum (TrailerCamera.tsx); for the ending glimpse it borrows the ending film itself,
// choosing exact moments of it. Gold titles, cinema bars, grain and flashes are drawn on top
// (TrailerScreen.tsx). Recorded by the team with a screen recorder.

export const TRAILER_LENGTH = 30 // the closing title appears here, on the music's climax, and stays
// The music (for now the ending film's, until the trailer's own track arrives) starts so that
// its climax lands on the closing title.
export const MUSIC_START = TITLE_AT - TRAILER_LENGTH

export const TRAILER = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('trailer')

// The trailer's clock (seconds since it began), kept by TrailerCamera from the music.
// paused: held with Space, for full-size screenshots of any moment.
export const trailerClock = { t: -1, paused: false }
// ?trailer&from=16 starts at that second (to check or record one part again).
export const TRAILER_FROM = Number(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('from') ?? 0) || 0

// ---------- Shots ----------
// museum: the camera moves through the museum from one pose to another.
// film: a moment of the ending film, from `at` seconds into it, played at `speed`.
// game: the camera holds while the Time Machine's window is open.
// reading: an exhibit's enlarged board is open (its text, sources and turning 3D model).
// black: nothing (the screen is black).
export type Segment =
  | { kind: 'museum'; duration: number; from: Pose; to: Pose; fov?: number; linear?: boolean }
  | { kind: 'film'; duration: number; at: number; speed?: number }
  | { kind: 'game'; duration: number; pose: Pose }
  | { kind: 'reading'; duration: number; exhibit: string; pose: Pose }
  | { kind: 'black'; duration: number }

const spot = (id: string) => EXHIBIT_SPOTS.find((s) => s.id === id) as ExhibitSpot

// Around an exhibit: `d` metres in front, `side` metres to its right, `y` up.
function near(s: ExhibitSpot, d: number, side: number, y: number): Vec3 {
  const front = [Math.sin(s.yaw), Math.cos(s.yaw)]
  const right = [Math.cos(s.yaw), -Math.sin(s.yaw)]
  return [s.x + front[0] * d + right[0] * side, y, s.z + front[1] * d + right[1] * side]
}

// A fast, close move across an exhibit for the montage (alternating sides).
function glimpse(id: string, k: number): Segment {
  const s = spot(id)
  const side = k % 2 === 0 ? 1 : -1
  const look: Vec3 = [s.x, 1.3, s.z]
  return { kind: 'museum', duration: 0.4, fov: 46, linear: true, from: [near(s, 2.7, 1.3 * side, 1.7), look], to: [near(s, 2.2, -0.3 * side, 1.55), look] }
}

// A room's own coordinates: across (u), from the museum's centre (v), up (y).
function inRoom(room: RoomId) {
  const r = roomById(room)!
  const at = (u: number, v: number, y: number): Vec3 => {
    const [x, z] = toWorld(r.frame, u, v)
    return [x, y, z]
  }
  return { r, at, mid: (r.vHall + r.vBack) / 2 }
}

// The intro hall: slowly towards the INOVAT sign on its back wall.
const hall = inRoom('hall')
const hallShot: Segment = {
  kind: 'museum',
  duration: 2.4,
  fov: 55,
  from: [hall.at(0, hall.r.vFront + 1.2, 1.5), hall.at(0, hall.r.vBack, 2.4)],
  to: [hall.at(0, hall.r.vFront + hall.r.depth * 0.45, 1.7), hall.at(0, hall.r.vBack, 2.7)],
}

// The rotunda: from its floor, rising and tilting up to the dome and its chandelier.
const rotundaShot: Segment = { kind: 'museum', duration: 2.4, fov: 62, from: [[6.5, 1.5, 6.5], [0, 2.6, 0]], to: [[3.6, 2.6, 3.6], [0, 8.5, 0]] }

// THE FOUR ERAS: each hall filmed with its own move, passing the other exhibits on the way
// to (or around) its headline exhibit.
// CMCN 1: from high above the doorway, a crane down over the hall to Watt's engine.
const r1 = inRoom('ir1')
const era1: Segment = {
  kind: 'museum',
  duration: 2.4,
  fov: 58,
  from: [r1.at(0, r1.r.vHall + 0.8, 4.4), r1.at(0, r1.mid, 0.6)],
  to: [r1.at(1.4, r1.mid - 2.6, 1.6), r1.at(0, r1.mid, 1.3)],
}
// CMCN 2: a sideways track across the hall, past the front exhibits and electric power.
const r2 = inRoom('ir2')
const era2: Segment = {
  kind: 'museum',
  duration: 2.4,
  fov: 52,
  linear: true,
  from: [r2.at(-6.5, r2.mid - 3.4, 1.7), r2.at(-2.2, r2.mid, 1.3)],
  to: [r2.at(6.5, r2.mid - 3.4, 1.7), r2.at(2.2, r2.mid, 1.3)],
}
// CMCN 3: a low dolly from the floor, rising towards the microprocessor.
const r3 = inRoom('ir3')
const era3: Segment = {
  kind: 'museum',
  duration: 2.4,
  fov: 55,
  from: [r3.at(-0.6, r3.r.vHall + 1.2, 0.45), r3.at(0, r3.mid, 1.4)],
  to: [r3.at(0.7, r3.mid - 2.3, 1.55), r3.at(0, r3.mid, 1.1)],
}
// CMCN 4: an orbit around artificial intelligence, with the hall turning behind it.
const ai = spot('ir4-3')
const orbitAt = (a: number, radius: number, y: number): Vec3 => [ai.x + Math.sin(ai.yaw + a) * radius, y, ai.z + Math.cos(ai.yaw + a) * radius]
const era4: Segment = {
  kind: 'museum',
  duration: 2.4,
  fov: 55,
  from: [orbitAt(-1.1, 4.2, 2.3), [ai.x, 1.7, ai.z]],
  to: [orbitAt(0.5, 3.3, 1.8), [ai.x, 1.6, ai.z]],
}

// The Game Room: along the clockwork panels, then the Time Machine's window opens.
const quiz = inRoom('quiz')
const standV = (quiz.r.vFront + quiz.r.vBack) / 2 - QUIZ_STAND.z // (the room's own z points back towards its door)
const wall = -quiz.r.width / 2
const gearsShot: Segment = {
  kind: 'museum',
  duration: 0.8,
  fov: 48,
  linear: true,
  from: [quiz.at(wall + 2.3, quiz.mid - 2.6, 2.2), quiz.at(wall, quiz.mid - 1.2, 2.5)],
  to: [quiz.at(wall + 2.0, quiz.mid + 0.2, 2.35), quiz.at(wall, quiz.mid + 1.2, 2.5)],
}
const consolePose: Pose = [quiz.at(-0.3, standV - 1.9, 1.75), quiz.at(0, standV, 1.05)]

// The enlarged board: the Rocket (its text, picture, sources and turning model).
const rocket = spot('ir1-4')
const rocketPose: Pose = [near(rocket, 3.0, 0.8, 1.6), [rocket.x, 1.2, rocket.z]]

// A quick montage at the drop: eight more inventions, one per beat.
const MONTAGE = ['ir1-3', 'ir1-5', 'ir2-1', 'ir2-5', 'ir3-3', 'ir3-5', 'ir4-1', 'ir4-6']

export const SEGMENTS: Segment[] = [
  // I. OPENING (0-6.4): a gold card on black, the intro hall, the rotunda.
  { kind: 'black', duration: 1.6 },
  hallShot,
  rotundaShot,
  // II. THE FOUR ERAS (6.4-16.0): one sweeping move through each hall.
  era1,
  era2,
  era3,
  era4,
  // III. THE DROP (16.0-22.8): eight inventions on the beat, then an exhibit opened up.
  ...MONTAGE.map((id, k) => glimpse(id, k)),
  { kind: 'reading', duration: 3.6, exhibit: 'ir1-4', pose: rocketPose },
  // IV. THE TIME MACHINE (22.8-25.6): the clockwork, then its window with all four cores lit.
  gearsShot,
  { kind: 'game', duration: 2.0, pose: consolePose },
  // V. THROUGH THE PORTAL (25.6-28.8): three moments of the ending film.
  { kind: 'film', duration: 0.8, at: START.rocket + 1.5, speed: 1.2 },
  { kind: 'film', duration: 1.2, at: START.grid + 1.0, speed: 1.4 },
  { kind: 'film', duration: 1.2, at: START.mind + 1.4, speed: 1.2 },
  // VI. A beat of black (28.8-30.0), then the title over the film's finale landscape, which
  // drifts for four seconds and then holds still.
  { kind: 'black', duration: 1.2 },
  { kind: 'film', duration: 4, at: START.timeline + 3.0, speed: 0.5 },
  { kind: 'film', duration: 600, at: START.timeline + 5.0, speed: 0 },
]

export const SEGMENT_START: number[] = []
SEGMENTS.reduce((t, segment) => (SEGMENT_START.push(t), t + segment.duration), 0)

// Which segment plays at trailer time t, and how far into it (seconds).
export function segmentAt(t: number): { segment: Segment; index: number; into: number } {
  let index = 0
  while (index < SEGMENTS.length - 1 && t >= SEGMENT_START[index + 1]) index++
  return { segment: SEGMENTS[index], index, into: t - SEGMENT_START[index] }
}

// ---------- Titles and flashes (TrailerScreen.tsx) ----------
// Each title is ui.trailer.titles[text] in the visitor's language: a small spaced line in gold
// (kicker) over a larger gold title. card: on black; lower: low on the picture; centre: over
// the montage; bar: in the lower cinema bar (over the enlarged board and the game window,
// which it must not cover); final: the closing title.
export interface TrailerTitle {
  text: number
  from: number
  to: number
  place: 'card' | 'lower' | 'centre' | 'bar' | 'final'
}
export const TITLES: TrailerTitle[] = [
  { text: 0, from: 0.15, to: 1.5, place: 'card' },
  { text: 1, from: 4.2, to: 6.3, place: 'lower' },
  { text: 2, from: 6.8, to: 8.7, place: 'lower' },
  { text: 3, from: 9.2, to: 11.1, place: 'lower' },
  { text: 4, from: 11.6, to: 13.5, place: 'lower' },
  { text: 5, from: 14.0, to: 15.9, place: 'lower' },
  { text: 6, from: 16.1, to: 19.1, place: 'centre' },
  { text: 7, from: 19.5, to: 22.7, place: 'bar' },
  { text: 8, from: 22.9, to: 25.5, place: 'bar' },
  { text: 9, from: 25.8, to: 28.7, place: 'lower' },
  { text: 10, from: TRAILER_LENGTH, to: Infinity, place: 'final' }, // (stays)
]

// Flashes of light over cuts: gold light leaks into each era, white through the portal.
export const FLASHES: { at: number; colour: string; length: number }[] = [
  { at: 6.4, colour: '#ffd9a0', length: 0.35 },
  { at: 8.8, colour: '#ffe9b8', length: 0.35 },
  { at: 11.2, colour: '#c8ffd8', length: 0.35 },
  { at: 13.6, colour: '#d8f8ff', length: 0.35 },
  { at: 16.0, colour: '#ffe2a8', length: 0.3 },
  { at: 19.2, colour: '#ffe2a8', length: 0.3 },
  { at: 22.8, colour: '#ffe2a8', length: 0.3 },
  { at: 25.6, colour: '#ffffff', length: 0.7 },
]
