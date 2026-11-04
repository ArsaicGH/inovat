import { TITLE_AT } from './ending-shots'
import { EXHIBIT_SPOTS, QUIZ_STAND, ROTUNDA_SPAWN, roomById, toWorld, type ExhibitSpot } from './layout'
import type { Vec3, Pose } from './ending-shots'

// THE TRAILER (30 seconds, for the team's presentation): opened with ?trailer in the address.
// A scripted camera flies through the real museum (TrailerCamera.tsx) while captions show
// (TrailerScreen.tsx) and the ending film's music plays. The music starts 30 s before its
// climax (TITLE_AT, where the ending film shows its closing title), so the trailer's closing
// card lands on the same beat. Recorded by the team with a screen recorder.

export const TRAILER_LENGTH = 30 // the closing card appears here
export const TRAILER_HOLD = 6 // and stays this long, as the music rings out
export const MUSIC_START = TITLE_AT - TRAILER_LENGTH

export const TRAILER = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('trailer')

// The trailer's clock (seconds since it began), advanced by TrailerCamera from the music.
// paused: held with Space, so the team can take full-size screenshots of any shot.
export const trailerClock = { t: -1, paused: false }

export interface TrailerShot {
  caption: number // index into ui.trailer.captions (-1: none)
  duration: number
  from: Pose
  to: Pose
  fov?: number
}

const spot = (id: string) => EXHIBIT_SPOTS.find((s) => s.id === id) as ExhibitSpot

// A slow push in towards an exhibit: from `far` metres in front of it (and `side` to its
// right) to `near`, looking at it at `lookY` metres up.
function pushIn(id: string, far: number, near: number, side: number, fromY: number, toY: number, lookY = 1.2): Pick<TrailerShot, 'from' | 'to'> {
  const s = spot(id)
  const front = [Math.sin(s.yaw), Math.cos(s.yaw)]
  const right = [Math.cos(s.yaw), -Math.sin(s.yaw)]
  const place = (d: number, sd: number, y: number): Vec3 => [s.x + front[0] * d + right[0] * sd, y, s.z + front[1] * d + right[1] * sd]
  const look: Vec3 = [s.x, lookY, s.z]
  return { from: [place(far, side, fromY), look], to: [place(near, side * 0.4, toY), look] }
}

// Half a turn around an exhibit at `radius` metres.
function orbit(id: string, radius: number, y: number, a0: number, a1: number, lookY = 1.1): Pick<TrailerShot, 'from' | 'to'> {
  const s = spot(id)
  const at = (a: number): Vec3 => [s.x + Math.sin(s.yaw + a) * radius, y, s.z + Math.cos(s.yaw + a) * radius]
  const look: Vec3 = [s.x, lookY, s.z]
  return { from: [at(a0), look], to: [at(a1), look] }
}

// The rotunda: from its entrance side, the camera rises and tilts up to the dome.
const [rx, rz] = ROTUNDA_SPAWN
const rotunda: Pick<TrailerShot, 'from' | 'to'> = {
  from: [[rx * 0.95, 1.6, rz * 0.95], [0, 2.4, 0]],
  to: [[rx * 0.55, 2.4, rz * 0.55], [0, 7.5, 0]],
}

// The Game Room: towards the Time Machine console on its platform, past the clockwork panels.
const quiz = roomById('quiz')!
const centreV = (quiz.vFront + quiz.vBack) / 2
const standV = centreV - QUIZ_STAND.z // (the room's local z points back towards its door)
const quizAt = (u: number, v: number, y: number): Vec3 => {
  const [x, z] = toWorld(quiz.frame, u, v)
  return [x, y, z]
}
const gameRoom: Pick<TrailerShot, 'from' | 'to'> = {
  from: [quizAt(-1.6, standV - 5.5, 2.3), quizAt(0, standV, 1.2)],
  to: [quizAt(-0.35, standV - 1.9, 1.75), quizAt(0, standV, 1.05)],
}

// A board up close: CMCN 2's telephone board (white enamel, navy border), sliding along it.
function board(id: string): Pick<TrailerShot, 'from' | 'to'> {
  const s = spot(id)
  const front = [Math.sin(s.yaw), Math.cos(s.yaw)]
  const right = [Math.cos(s.yaw), -Math.sin(s.yaw)]
  const d = s.panelSide * 2.3 // where the board stands beside the plinth (layout.ts PANEL_OFFSET)
  const bx = s.x + right[0] * d
  const bz = s.z + right[1] * d
  const at = (dist: number, slide: number, y: number): Vec3 => [bx + front[0] * dist + right[0] * slide, y, bz + front[1] * dist + right[1] * slide]
  return { from: [at(3.4, -1.0, 1.9), [bx, 1.7, bz]], to: [at(2.7, 0.5, 1.7), [bx, 1.55, bz]] }
}

// In order; each caption is ui.trailer.captions[n] in the visitor's language.
export const TRAILER_SHOTS: TrailerShot[] = [
  { caption: 0, duration: 3.4, ...rotunda, fov: 66 },
  { caption: 1, duration: 3.2, ...pushIn('ir1-1', 7.5, 3.6, 1.6, 2.4, 1.7, 1.4) },
  { caption: 2, duration: 3.2, ...pushIn('ir2-3', 7, 3.4, -1.6, 2.6, 1.7, 1.3) },
  { caption: 3, duration: 3.2, ...pushIn('ir3-1', 6.5, 3.2, 1.4, 2.2, 1.6, 1.1) },
  { caption: 4, duration: 3.6, ...pushIn('ir4-3', 8, 3.8, -1.2, 3.0, 1.9, 1.6) },
  { caption: 5, duration: 3.2, ...orbit('ir1-4', 4.2, 1.5, -0.9, 0.6, 1.0), fov: 55 },
  { caption: 6, duration: 3.0, ...board('ir2-5'), fov: 55 },
  { caption: 7, duration: 3.0, ...gameRoom, fov: 60 },
  // Back in the rotunda, drawing away from the dome: the whole journey in one view.
  { caption: 8, duration: 3.2, from: rotunda.to, to: rotunda.from, fov: 70 },
  // (The last 1.0 s: the picture fades to black for the closing card.)
]
// The shots fill 28.0 s; the fade to the closing card fills the rest of the 30.
export const SHOTS_END = TRAILER_SHOTS.reduce((sum, shot) => sum + shot.duration, 0)

// Which shot is playing at trailer time t, and how far into it (0-1).
export function shotAt(t: number): { shot: TrailerShot; index: number; progress: number } {
  let start = 0
  for (let index = 0; index < TRAILER_SHOTS.length; index++) {
    const shot = TRAILER_SHOTS[index]
    if (t < start + shot.duration || index === TRAILER_SHOTS.length - 1) {
      return { shot, index, progress: Math.min(1, Math.max(0, (t - start) / shot.duration)) }
    }
    start += shot.duration
  }
  return { shot: TRAILER_SHOTS[0], index: 0, progress: 0 }
}
