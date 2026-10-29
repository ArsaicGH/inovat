import { Color, Vector3 } from 'three'

// THE ENDING FILM'S SCRIPT, played by EndingScene.tsx: every shot in order, where the
// camera moves, how the shot is lit, and how the film passes into the next shot. Times are
// in seconds.
//
// The four eras are four film sets standing side by side (ending-sets.tsx), far away from
// the museum. Positions in a shot are in its set's own coordinates: x across, y up, z
// towards the front of the set (the camera mostly looks towards -z).

export type Vec3 = [number, number, number]
export type Pose = [Vec3, Vec3] // where the camera is, the point it looks at

// Where the film is built: beyond the camera's view distance from the museum, so none of
// the museum is drawn meanwhile.
export const ORIGIN: Vec3 = [1000, 0, 0]
// Where each era's set stands (x), oldest first.
export const SET_X = [-66, -22, 22, 66]

// The film's clock (seconds), advanced by EndingScene; the sets move their machines by it.
export const film = { t: 0 }

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const mix3 = (a: Vec3, b: Vec3, w: number): Vec3 => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w]
export const mixPose = (a: Pose, b: Pose, w: number): Pose => [mix3(a[0], b[0], w), mix3(a[1], b[1], w)]

// ---------- Places and motions the script and the sets share ----------

export const RAIL_Z = 12 // the railway in front of the mill (CMCN 1 set)
export const RAIL_TOP = 0.32
export const ROAD_Z = 6 // the street (CMCN 2 set)

// Seconds since a shot began (negative before it).
export const since = (id: string) => film.t - START[id]

// The locomotive along its track, s seconds into its shot: it creeps out of the steam, then
// gathers speed.
export function locoX(s: number) {
  const c = Math.min(Math.max(s, 0), 8)
  return -24 + 1.2 * c + 0.55 * c * c
}
// The motor car coming down the street towards the camera.
export const carX = (s: number) => 15 - 4.6 * Math.min(Math.max(s, 0), 5.2)
// The fire under the boiler: lit a second into the film, then flickering.
export const fireLevel = () => smooth(0.8, 2.6, since('workshop')) * (0.8 + 0.2 * Math.sin(film.t * 13.1) * Math.sin(film.t * 7.7 + 1))
// The welding robots strike their arcs in bursts.
export const welding = (phase: number) => Math.sin(film.t * 2.2 + phase) > 0.15
// Street lamps (5) and factory lamps (5) switching on one after another.
export const streetLamp = (i: number) => smooth(0.8 + i * 0.55, 1.05 + i * 0.55, since('street'))
export const streetWindows = (i: number) => smooth(2.8 + i * 0.3, 3.4 + i * 0.3, since('street'))
export const lineLamp = (i: number) => smooth(0.4 + i * 0.45, 0.6 + i * 0.45, since('line'))
// The 3D printer's progress (0-1): a third done when first seen, finished by the end of its shot.
export const printed = () => 0.3 + 0.7 * smooth(0, 4.6, since('printer'))

// ---------- Lighting ----------
// The museum's own lights are lent to the film and placed by each shot (Lighting in
// Museum.tsx), instead of adding lights: a change in the number of lights would make the
// graphics card rebuild every material in the museum.

export interface StageLight {
  from: Vec3 | (() => Vec3)
  to: Vec3 | (() => Vec3)
  colour: string
  lux: number // brightness where it lands (the lamp's power follows from its distance)
  angle?: number // half-width of the beam (radians)
  gate?: () => number // 0-1: a lamp switching on, a flickering fire...
}
export interface Rig {
  key: StageLight // the one light that casts shadows
  spots: StageLight[] // up to six more
  sky: string // the soft fill light's colour from above...
  ground: string // ...and from below
  fill: number
  environment: number // reflections
  background: string // the colour of the distance (sky and haze)
  haze: [number, number] // where the haze begins and where it hides everything (metres)
}

const L = (from: StageLight['from'], to: StageLight['to'], colour: string, lux: number, angle = 0.6, gate?: () => number): StageLight => ({ from, to, colour, lux, angle, gate })

const STREET_LAMPS = [-12, -6, 0, 6, 12].map((x, i) => L([x, 4.3, 3.7], [x, 0, 5.2], '#ffcf88', 6, 0.8, () => streetLamp(i)))
const MOON = L([10, 28, 34], [0, 0, 6], '#8fa4d0', 0.35, 0.8)

export const RIGS = {
  // CMCN 1 indoors: dark, warm firelight, cold daylight through the mill windows.
  workshop: {
    key: L([-2, 7.5, -10], [-2, 0, -19], '#ffbf86', 1.0, 0.95),
    spots: [
      L([-6, 0.9, -19.3], [-5.2, 2.2, -15.5], '#ff7424', 9, 1.2, fireLevel), // the fire
      L([-1, 6.8, -16], [1.4, 2.6, -21], '#ffc890', 5, 0.5), // the engine
      L([-22, 9.5, -14], [-6, 0, -11], '#a9bddc', 2.2, 0.35), // daylight through the windows
      L([-22, 9.5, -5], [-4, 0, -3], '#a9bddc', 2.2, 0.35),
      L([-22, 9.5, 3], [-4, 0, 3], '#a9bddc', 2, 0.35),
      L([0, 6.5, -2], [0, 1, -6], '#ffcf9a', 2, 0.7), // an oil lamp over the mill floor
    ],
    sky: '#6b5a4a',
    ground: '#2a1d14',
    fill: 0.16,
    environment: 0.25,
    background: '#1a120c',
    haze: [6, 46],
  },
  // CMCN 1 outdoors: a low sun behind the smoke, the locomotive against it.
  railway: {
    key: L([-40, 16, 46], [0, 0, 12], '#ffb47a', 3.2, 0.7),
    spots: [
      L(() => [locoX(since('loco')) + 2, 6, 3], () => [locoX(since('loco')) + 0.5, 1.5, RAIL_Z], '#ffd6a8', 4, 0.5),
    ],
    sky: '#9a8a80',
    ground: '#3a2c22',
    fill: 0.4,
    environment: 0.35,
    background: '#4b3a2f',
    haze: [10, 95],
  },
  // CMCN 2: the dynamo hall, the street at night, the assembly line.
  dynamo: {
    key: L([-4, 9, -1], [-8, 0, -10], '#ffe2b8', 2.2, 0.75),
    spots: [
      L([-10, 6, -6.5], [-10, 1.4, -10], '#ffd59a', 6, 0.42),
      L([-5.5, 6, -6.5], [-5.5, 1.4, -10], '#ffd59a', 5, 0.42),
      L([-7.75, 5, -12], [-7.75, 1.9, -16.8], '#ffe6c4', 3, 0.5),
    ],
    sky: '#cfc4b2',
    ground: '#3a342c',
    fill: 0.16,
    environment: 0.4,
    background: '#12151c',
    haze: [12, 60],
  },
  street: {
    key: MOON,
    spots: STREET_LAMPS,
    sky: '#34405e',
    ground: '#16161a',
    fill: 0.14,
    environment: 0.2,
    background: '#0c1020',
    haze: [14, 70],
  },
  line: {
    key: L([9, 10, 3], [9, 0, -10], '#ffe4bf', 2.6, 0.8, () => 0.25 + 0.75 * lineLamp(4)),
    spots: [-17, -13.5, -10, -6.5, -3].map((z, i) => L([9, 4.4, z], [9, 0.6, z], '#ffd9a0', 7, 0.6, () => lineLamp(i))),
    sky: '#d8cfc0',
    ground: '#3a332a',
    fill: 0.18,
    environment: 0.35,
    background: '#16171b',
    haze: [14, 64],
  },
  car: {
    key: MOON,
    spots: [
      ...STREET_LAMPS,
      // The car's headlamps, shining down the street at the camera.
      L(() => [carX(since('car')) - 1.8, 1.0, ROAD_Z], () => [carX(since('car')) - 9, 0.7, ROAD_Z + 0.5], '#fff0d0', 6, 0.45),
    ],
    sky: '#34405e',
    ground: '#16161a',
    fill: 0.14,
    environment: 0.2,
    background: '#0c1020',
    haze: [14, 70],
  },
  // CMCN 3: cool, even light of computer rooms and robot cells.
  mainframe: {
    key: L([-8, 8, 1], [-8, 0, -10], '#eef2ff', 2.6, 0.8),
    spots: [
      L([-6, 3.6, -2.2], [-6, 0.9, -5.2], '#f2f4ff', 3, 0.5),
      L([-8, 4.6, -7], [-8, 1, -12.5], '#e8eeff', 3, 0.6),
      L([-11, 4.6, -7], [-11, 1, -9], '#e8eeff', 2.4, 0.6),
    ],
    sky: '#dde4ef',
    ground: '#383b40',
    fill: 0.3,
    environment: 0.5,
    background: '#0c1015',
    haze: [10, 52],
  },
  robots: {
    key: L([8, 9.5, -1.5], [8, 0, -10], '#f0f3ff', 3, 0.8),
    spots: [
      L([8, 2.6, -8.2], [8, 1.0, -10], '#ff9a40', 4, 1.0, () => (welding(0) || welding(3.1) ? 0.7 + 0.3 * Math.sin(film.t * 41) : 0.05)),
      L([3, 3.6, -3], [3, 1, -5], '#e9eeff', 2.4, 0.5),
      L([12, 6, -6], [8, 1.2, -10], '#cfe0ff', 2.2, 0.5),
    ],
    sky: '#dfe5ee',
    ground: '#3a3c40',
    fill: 0.26,
    environment: 0.5,
    background: '#0e1216',
    haze: [12, 56],
  },
  office: {
    key: L([-8, 7, 13], [-8, 0, 6], '#f6f1e6', 2.4, 0.8),
    spots: [L([-8, 22, 34], [-8, 9, 24], '#a9b9d8', 1.6, 0.5), L([-2.5, 3.2, 7.5], [-2.5, 1, 10.5], '#e8eeff', 2, 0.6)],
    sky: '#9aa6bd',
    ground: '#2a2c30',
    fill: 0.22,
    environment: 0.45,
    background: '#0b0f17',
    haze: [14, 78],
  },
  // The microprocessor, like a macro photograph: one raking light, a cool rim.
  chip: {
    key: L([8, 5.5, 12], [8, 0.5, 7], '#e9eef8', 2.4, 0.55),
    spots: [L([14, 1.8, 2.5], [8, 0.6, 7], '#56dff0', 1.4, 0.5), L([2, 2.5, 4], [8, 0.6, 7], '#ffd9a8', 0.8, 0.5)],
    sky: '#2a3440',
    ground: '#0a0c10',
    fill: 0.06,
    environment: 0.7,
    background: '#04070b',
    haze: [5, 26],
  },
  // CMCN 4: bright neutral daylight, cyan only on the technology.
  smart: {
    key: L([-24, 18, -32], [-2, 0, -8], '#fff7ec', 4, 0.75),
    spots: [
      L([-12, 7, -9], [-12, 1, -10], '#f4f8ff', 4, 0.4),
      L([-9, 7, -9], [-9, 1, -10], '#f4f8ff', 4, 0.4),
      L([-6, 7, -9], [-6, 1, -10], '#f4f8ff', 4, 0.4),
      L([-2, 6.5, -13.5], [-2, 3.6, -18.8], '#eef6ff', 1.2, 0.6),
      L([6, 6, -2.5], [6, 0.9, -4], '#f6f8ff', 5, 0.45),
      L([-6, 6, -1], [-6, 1.1, -3], '#f6f8ff', 4.5, 0.55),
    ],
    sky: '#eef4f8',
    ground: '#7a8088',
    fill: 0.62,
    environment: 1,
    background: '#b8c6cf',
    haze: [26, 120],
  },
  outside: {
    key: L([50, 70, 110], [0, 0, 20], '#fff2dc', 4, 0.75),
    spots: [L([-6, 6, -1], [-6, 1.1, -3], '#f6f8ff', 4.5, 0.55)],
    sky: '#c3d8ea',
    ground: '#5a604e',
    fill: 0.85,
    environment: 1,
    background: '#a6bed1',
    haze: [40, 260],
  },
  // The finale: all four sets in a row at dusk, each in its era's light.
  timeline: {
    key: L([0, 90, 70], [0, 0, -6], '#fff0dc', 1.6, 1.0),
    spots: SET_X.map((x, i) => L([x, 30, 26], [x, 0, -8], ['#ffb46e', '#ffd9a8', '#f2f4ff', '#e2f4ff'][i], 3.2, 0.55)),
    sky: '#56648a',
    ground: '#1a1a22',
    fill: 0.32,
    environment: 0.4,
    background: '#121826',
    haze: [90, 340],
  },
} satisfies Record<string, Rig>

// ---------- The shots ----------

export interface Shot {
  id: string
  act: number // 1-4: the eras; 5: the finale
  set: number // whose set the camera is in (0-3); -1 = the whole row
  duration: number
  rig: keyof typeof RIGS
  from?: Pose // the camera glides from here...
  to?: Pose // ...to here
  path?: (s: number) => Pose // or follows a moving subject
  fov?: number
  into?: 'dip' | 'flash' // how the film passes INTO this shot: through black, or a flash of light
  veil?: string // the flash's colour
}

// The locomotive: watched as it comes out of the steam, then tracked alongside, then close
// on its driving wheel.
function locoPath(s: number): Pose {
  const x = locoX(s)
  const watch: Pose = [[-8, 1.5, 5.6], [x + 1.5, 2.0, RAIL_Z]]
  const track: Pose = [[x + 3.6, 1.7, 7.0], [x + 0.4, 1.8, RAIL_Z]]
  const wheel: Pose = [[x + 1.4, RAIL_TOP + 0.8, RAIL_Z - 1.9], [x + 1.4, RAIL_TOP + 0.78, RAIL_Z - 0.7]]
  return mixPose(mixPose(watch, track, smooth(2.6, 3.6, s)), wheel, smooth(5.2, 6.2, s))
}
// The motor car: a low camera at the end of the street.
const carPath = (s: number): Pose => [[-13 + s * 0.15, 0.8, ROAD_Z + 0.7], [carX(s) - 1.6, 1.0, ROAD_Z + 0.2]]

export const SHOTS: Shot[] = [
  // ACT I, STEAM. In near darkness a fire is lit under a boiler...
  { id: 'workshop', act: 1, set: 0, duration: 2.5, rig: 'workshop', from: [[-3.4, 1.55, -12.6], [-6, 1.1, -19.7]], to: [[-4.8, 1.3, -16.4], [-6, 0.9, -19.7]] },
  // ...its steam drives the engine: piston, beam, flywheel, gears...
  { id: 'engine', act: 1, set: 0, duration: 1.5, rig: 'workshop', from: [[-3.4, 4.6, -16.6], [-1.1, 3.8, -21]], to: [[3.6, 2.5, -16.6], [3.9, 2.2, -20.3]] },
  // ...whose power turns a whole mill of spinning frames...
  // ...and a locomotive comes out of the steam, gathering speed, to its turning wheel.
  { id: 'loco', act: 1, set: 0, duration: 6.5, rig: 'railway', path: locoPath, fov: 50 },
  // ACT II, ELECTRICITY. The wheel becomes a dynamo's rotor; the camera pulls back...
  { id: 'dynamo', act: 2, set: 1, duration: 2, rig: 'dynamo', into: 'dip', from: [[-10, 1.5, -8.0], [-10, 1.5, -10]], to: [[-5.2, 3.3, 1], [-8, 1.3, -10]] },
  // ...the current runs out along the wires: one street lamp, then another, then the city...
  { id: 'street', act: 2, set: 1, duration: 3, rig: 'street', from: [[-15, 1.7, 2.4], [-6, 2.4, 8]], to: [[-6.5, 2.6, 1.8], [9, 3.2, 11]] },
  // ...a factory lights up over an assembly line...
  { id: 'line', act: 2, set: 1, duration: 2.5, rig: 'line', from: [[6.4, 2.5, 1.5], [9, 1.2, -6]], to: [[6.6, 2.0, -9.5], [9, 1.0, -17]] },
  // ...and a car drives out into the street, its headlamps filling the frame.
  { id: 'car', act: 2, set: 1, duration: 3, rig: 'car', path: carPath, fov: 40 },
  // ACT III, DIGITAL. The headlamp's glow becomes a computer screen...
  { id: 'mainframe', act: 3, set: 2, duration: 2.5, rig: 'mainframe', into: 'flash', veil: '#fff3dc', from: [[-6, 1.0, -5.0], [-6, 1.0, -5.4]], to: [[-2.6, 2.7, 0.8], [-8, 1.1, -10]] },
  // ...a programmer's code drives welding robots...
  { id: 'robots', act: 3, set: 2, duration: 3, rig: 'robots', from: [[2.4, 1.75, -2.4], [7, 1.5, -10]], to: [[11.8, 2.7, -4.8], [8, 1.2, -10]] },
  // ...computers reach offices, linked by cables and towers...
  { id: 'office', act: 3, set: 2, duration: 2, rig: 'office', from: [[-13, 1.6, 0.4], [-8, 1.0, 6]], to: [[-6.5, 4.2, 1.5], [-8, 10, 24]] },
  // ...and all of it runs on a microprocessor, which fills the frame.
  { id: 'chip', act: 3, set: 2, duration: 2.5, rig: 'chip', from: [[3.4, 1.5, 11.2], [8, 0.6, 7]], to: [[8, 1.08, 7.3], [8, 0.62, 7]] },
  // ACT IV, CONNECTED. Out of the circuit, a smart factory...
  { id: 'smart', act: 4, set: 3, duration: 2.5, rig: 'smart', into: 'flash', veil: '#dcfaff', from: [[4, 3.4, 1.5], [-6, 1, -10]], to: [[-13, 2.3, -2.5], [-4, 1.2, -12]] },
  // ...a 3D printer building an object layer by layer...
  { id: 'printer', act: 4, set: 3, duration: 2.5, rig: 'smart', from: [[7.7, 1.55, -2.3], [6, 1.0, -4]], to: [[6.85, 1.25, -2.9], [6, 0.98, -4]] },
  // ...an engineer watching a machine and its digital twin...
  { id: 'twin', act: 4, set: 3, duration: 2, rig: 'smart', from: [[-3.4, 1.75, 0.6], [-6, 1.3, -3]], to: [[-8.8, 1.9, 0.4], [-6, 1.3, -3]] },
  // ...and the camera rises over the connected world outside: energy, transport, data.
  { id: 'rise', act: 4, set: 3, duration: 3.5, rig: 'outside', from: [[-2, 2.2, -14], [-2, 1.8, 0]], to: [[-4, 26, -12], [6, 2, 42]] },
  // FINALE. Echoes of each era's motion: piston, motor, robot arm, cobot...
  { id: 'echo1', act: 5, set: 0, duration: 1.6, rig: 'workshop', into: 'dip', from: [[-2.0, 3.5, -19.4], [-1.1, 3.3, -21]], to: [[-1.7, 3.6, -19.8], [-1.1, 3.3, -21]] },
  { id: 'echo2', act: 5, set: 1, duration: 1.6, rig: 'line', from: [[11.4, 1.1, -16.8], [10.8, 0.6, -18.85]], to: [[11.2, 1.0, -17.3], [10.8, 0.6, -18.85]] },
  { id: 'echo3', act: 5, set: 2, duration: 1.6, rig: 'robots', from: [[9.6, 2.4, -6.4], [8, 1.4, -9]], to: [[9.3, 2.3, -6.7], [8, 1.4, -9]] },
  { id: 'echo4', act: 5, set: 3, duration: 1.6, rig: 'smart', from: [[-7.6, 1.75, -8.3], [-9, 1.25, -10]], to: [[-7.9, 1.65, -8.6], [-9, 1.25, -10]] },
  // ...then the camera pulls far back: the four eras side by side, one timeline.
  { id: 'timeline', act: 5, set: -1, duration: 11, rig: 'timeline', into: 'dip', from: [[66, 14, 12], [66, 2, -8]], to: [[0, 58, 112], [0, 3, -12]] },
  { id: 'hold', act: 5, set: -1, duration: 600, rig: 'timeline', from: [[0, 58, 112], [0, 3, -12]], to: [[0, 40, 70], [0, 3, -12]] },
]

// Which shot is playing at film time t, and whose set it is in.
export function shotIndexAt(t: number) {
  let i = 0
  while (i < SHOTS.length - 1 && t >= START[SHOTS[i + 1].id]) i++
  return i
}
export const filmSet = () => SHOTS[shotIndexAt(film.t)].set

// When each shot begins.
export const START: Record<string, number> = {}
SHOTS.reduce((t, shot) => {
  START[shot.id] = t
  return t + shot.duration
}, 0)
// The closing title appears as the last shot settles (EndingScreen.tsx); "Skip" jumps here.
export const TITLE_AT = START.timeline + 6.5

// ---------- What the film asks of the museum's lights this frame ----------
// (EndingScene writes it, Lighting in Museum.tsx obeys while `active`.)
export interface PlacedLight {
  from: Vector3
  to: Vector3
  colour: Color
  intensity: number
  angle: number
}
export const borrowedLights = {
  active: false,
  key: null as PlacedLight | null,
  spots: [] as PlacedLight[],
  sky: new Color(),
  ground: new Color(),
  fill: 0,
  environment: 1,
}

// The film's veil, a screen-wide layer for its dips to black and flashes of light
// (EndingScreen.tsx draws it, EndingScene sets its colour and opacity every frame).
export const filmVeil = { element: null as HTMLDivElement | null }
