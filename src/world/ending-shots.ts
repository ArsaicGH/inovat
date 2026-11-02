import { Color, Vector3 } from 'three'

// THE ENDING FILM'S SCRIPT, played by EndingScene.tsx: every shot in order, where the
// camera moves, how the shot is lit, and how the film passes into the next shot. Times are
// in seconds.
//
// THE STORY (acts I-IV, in ending-acts.tsx): one spark handed from era to era, a coal ember,
// an electric arc, a bit of light on a chip, a neuron firing, and with it the changing place
// of people beside their machines: the stoker who feeds the engine, the worker paced by the
// line, the programmer who instructs the computer, the person who works beside a robot and
// faces a machine that learns. Then the finale (ending-sets.tsx): four columns, one per era.
//
// Each act is filmed in its own set, standing side by side far away from the museum.
// Positions in a shot are in its set's own coordinates: x across, y up, z towards the front
// of the set (the camera mostly looks towards -z). Each scene of a set is only drawn during
// its own shots, so the scenes of one set may share the same ground.

export type Vec3 = [number, number, number]
export type Pose = [Vec3, Vec3] // where the camera is, the point it looks at

// Where the film is built: beyond the camera's view distance from the museum, so none of
// the museum is drawn meanwhile.
export const ORIGIN: Vec3 = [1000, 0, 0]
// Where each era's set stands (x), oldest first.
export const SET_X = [-66, -22, 22, 66]

// The film's clock (seconds), advanced by EndingScene; the sets move their machines by it.
// ready: everything is prepared and the film is playing (until then every scene is drawn,
// behind the black, so the graphics card prepares all of them before the first shot).
// running: the film is playing (it is also built ahead of time, hidden, while the visitor is
// in the Game Room: EndingScene.tsx; nothing in it moves until it runs).
export const film = { t: 0, ready: false, running: false }

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const mix3 = (a: Vec3, b: Vec3, w: number): Vec3 => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w]
export const mixPose = (a: Pose, b: Pose, w: number): Pose => [mix3(a[0], b[0], w), mix3(a[1], b[1], w)]

// Seconds since a shot began (negative before it).
export const since = (id: string) => film.t - START[id]

// ---------- Motions the script and the sets share ----------

// The fire in the boiler: it catches in the first second, then flickers.
export const fireLevel = () => (0.35 + 0.65 * smooth(0, 1.2, since('ember'))) * (0.82 + 0.18 * Math.sin(film.t * 13.1) * Math.sin(film.t * 7.7 + 1))
// The Rocket racing along its track towards the camera.
export const rocketX = (s: number) => -46 + 15.5 * Math.min(Math.max(s, 0), 4)
// The dynamo's lamps lighting one after another (7 of them), as the machine runs up.
export const lampLevel = (i: number) => smooth(0.9 + i * 0.2, 1.2 + i * 0.2, since('dynamo'))
// The electric light spreading through the city from its power station (metres).
export const gridRadius = () => 4 + 36 * Math.max(0, since('grid'))
// The cars on the assembly line move towards the camera (metres per second).
export const LINE_SPEED = 1.7
// The neural network: pulses run faster once it "wakes" during its shot.
export const mindLevel = () => 0.35 + 0.65 * smooth(0.3, 2.2, since('mind'))

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

export const RIGS = {
  // ---- ACT I, STEAM: firelight and soot, daylight only through high windows ----
  // The boiler's mouth: the fire is the light, as in Wright of Derby's forge paintings.
  ember: {
    key: L([0, 0.9, -0.7], [-0.6, 1.0, 3.2], '#ff8a3a', 2.4, 1.05, fireLevel),
    spots: [
      L([0.6, 3.6, 1.8], [0.75, 2.2, 0], '#ffc890', 2.2, 0.35), // over the gauge
      L([-6, 4.5, -2], [-1, 1.6, 0.6], '#7f93bd', 0.9, 0.5), // cold window light from the side
      L([3.5, 4.5, -1], [0.5, 2.7, -2.5], '#ffb070', 1.1, 0.6), // along the top of the boiler
      L([0, 0.7, -0.3], [0, 0.1, 2.4], '#ff6a20', 2.4, 0.9, fireLevel), // the fire on the floor
    ],
    sky: '#3a2a1e',
    ground: '#120a06',
    fill: 0.07,
    environment: 0.25,
    background: '#0a0605',
    haze: [5, 24],
  },
  // The engine house: shafts of daylight through arched windows, warm lamplight.
  engine: {
    key: L([-3.5, 9, -7], [0.5, 0, 1.5], '#d3dcef', 2.4, 0.5),
    spots: [
      L([5.5, 5.5, 5], [0.3, 1.8, 0], '#ffc58a', 2.8, 0.55), // an oil lamp at the front
      L([4.5, 7, -5], [0, 2.8, 0], '#9fb4d8', 1.4, 0.5), // a cold rim from behind
      L([4.5, 9, -7], [3, 0, 1.5], '#d3dcef', 1.4, 0.4), // the second window's shaft
      L([0, 0.6, 5], [0, 1.4, 0], '#ffb070', 0.7, 0.8), // warm light bounced off the floor
    ],
    sky: '#5a4a3c',
    ground: '#1a120c',
    fill: 0.13,
    environment: 0.35,
    background: '#100b08',
    haze: [9, 42],
  },
  // Out on the line at sunset: the sun low behind the smoke of the mill towns.
  rocket: {
    key: L([-70, 16, -45], [0, 0, 0], '#ffaa66', 3.4, 0.45),
    spots: [
      L([25, 22, 34], [0, 2, 0], '#8fa2c8', 0.7, 0.7), // the evening sky in front
      L(() => [rocketX(since('rocket')) + 0.5, 0.6, 1.4], () => [rocketX(since('rocket')) + 0.5, 0, 3.4], '#ff7a30', 2, 0.8), // the firebox glow on the ballast
    ],
    sky: '#e0b48c',
    ground: '#4a3a28',
    fill: 0.42,
    environment: 0.5,
    background: '#d79b66',
    haze: [60, 340],
  },
  // ---- ACT II, ELECTRICITY: warm electric light against the blue night ----
  dynamo: {
    key: L([2.5, 7, 5.5], [0, 1.4, 0], '#ffe4bc', 2.4, 0.6, () => 0.35 + 0.65 * lampLevel(6)),
    spots: [
      L([0, 3.3, -1.6], [0, 0.4, 0.5], '#ffd590', 3.2, 0.9, () => lampLevel(3)), // the lamps overhead
      L([0.55, 1.5, 1.6], [0, 1.7, 0.6], '#bcd8ff', 1.4, 0.8, () => (Math.sin(film.t * 37) > 0.2 ? 1 : 0.25)), // the arc at the brushes
      L([0, 5.5, -7], [0, 1.6, 0], '#6f84a8', 1.6, 0.5), // night through the windows behind
      L([-5, 3, 3], [0, 1.4, 0], '#ffcf98', 0.8, 0.6),
    ],
    sky: '#7e7a72',
    ground: '#262320',
    fill: 0.1,
    environment: 0.45,
    background: '#0a0d16',
    haze: [10, 46],
  },
  // The city at night, seen from high above, as electric light spreads through it.
  grid: {
    key: L([70, 130, 90], [0, 0, 0], '#7f95c8', 0.45, 0.6),
    spots: [L([0, 14, 0], [0, 0, 0], '#ffd8a0', 6, 1.1, () => smooth(0, 0.6, since('grid')))],
    sky: '#2a3450',
    ground: '#0c0c10',
    fill: 0.1,
    environment: 0.2,
    background: '#050812',
    haze: [70, 280],
  },
  // The assembly line: one lamp after another down a long hall.
  line: {
    key: L([0, 9, -6], [0, 0, -14], '#ffe0b0', 2.2, 0.85),
    spots: [2, -2, -6, -10, -14].map((z) => L([0, 4.1, z], [0, 0.5, z], '#ffd59a', 5, 0.75)),
    sky: '#cfc4b2',
    ground: '#2e2a24',
    fill: 0.16,
    environment: 0.35,
    background: '#13151a',
    haze: [16, 72],
  },
  // ---- ACT III, DIGITAL: cool, precise light; a dark world lit by its screens ----
  chip: {
    key: L([3, 2.2, 2.6], [0, 0.05, 0], '#eef2ff', 2.4, 0.5),
    spots: [L([-2.6, 0.9, -2.2], [0, 0.1, 0], '#56dff0', 1.8, 0.5), L([-2, 2.6, 2.2], [0, 0, 0], '#ffcf9a', 0.8, 0.5)],
    sky: '#26303c',
    ground: '#06080b',
    fill: 0.05,
    environment: 0.85,
    background: '#030508',
    haze: [3, 16],
  },
  // Inside the chip: its circuits as a city, signals racing along the streets.
  die: {
    key: L([12, 14, 12], [0, 0, 0], '#cfe4ff', 1.3, 0.7),
    spots: [L([-12, 7, -10], [0, 0, -2], '#56dff0', 1.3, 0.6), L([14, 5, -16], [4, 0, -8], '#7dff9a', 1.0, 0.6)],
    sky: '#16202c',
    ground: '#020304',
    fill: 0.05,
    environment: 0.7,
    background: '#020406',
    haze: [10, 52],
  },
  // A computer room: the programmer lit by fluorescent tubes and the green screen.
  terminal: {
    key: L([0.4, 3.4, 1.2], [0, 1.0, -0.4], '#eef4ff', 2.2, 0.85),
    spots: [
      L([-3.5, 3.2, -2.5], [-2, 1, -4.5], '#c9d6ea', 1.4, 0.6), // the computer cabinets
      L([0, 1.25, -0.3], [0, 1.6, 0.6], '#6bff9a', 0.9, 1.0), // the screen's glow on the face
      L([3, 3, -3], [2.5, 1, -4.5], '#c9d6ea', 1.1, 0.6),
    ],
    sky: '#c7d0dc',
    ground: '#202328',
    fill: 0.1,
    environment: 0.45,
    background: '#05070a',
    haze: [7, 32],
  },
  // The network: links of light spreading over the globe.
  net: {
    key: L([11, 10, 12], [0, 0, 0], '#9fd6ff', 1.0, 0.6),
    spots: [L([-9, 4, -12], [0, 0, 0], '#56dff0', 1.6, 0.55)],
    sky: '#1a2840',
    ground: '#020306',
    fill: 0.07,
    environment: 0.5,
    background: '#02040a',
    haze: [30, 150],
  },
  // ---- ACT IV, CONNECTED: bright, clean daylight; cyan only on the technology ----
  cobots: {
    key: L([-12, 10, 8], [0, 0, -2], '#fff6ea', 3.6, 0.7),
    spots: [
      ...[-4.5, -1.5, 1.5, 4.5].map((x) => L([x, 5, -0.5], [x, 1, -2], '#f4f8ff', 3, 0.45)),
      L([0, 3, 2.5], [0, 1.4, -2.5], '#56dff0', 0.8, 0.6),
    ],
    sky: '#eef4f8',
    ground: '#7a8088',
    fill: 0.6,
    environment: 1,
    background: '#c6d4dc',
    haze: [22, 90],
  },
  printer: {
    key: L([3, 5, 4], [0.6, 1.2, 0], '#fff6ea', 3, 0.6),
    spots: [L([-3, 3, -3], [0.7, 1.3, 0], '#cfe0ff', 1.6, 0.5), L([1.7, 1.0, 0.8], [1.7, 1.7, 0], '#56dff0', 0.7, 0.8)],
    sky: '#eef4f8',
    ground: '#7a8088',
    fill: 0.55,
    environment: 1,
    background: '#d2dbe0',
    haze: [10, 50],
  },
  // A person facing a vast network of artificial neurons.
  mind: {
    key: L([0, 6.5, -11], [0, 0, 4], '#8fe8ff', 1.5, 0.7, mindLevel),
    spots: [L([0, 3, 7], [0, 0, 4], '#bfefff', 0.7, 0.5), L([5, 8, -4], [0, 4, -8], '#56dff0', 1.0, 0.7, mindLevel)],
    sky: '#14202e',
    ground: '#020304',
    fill: 0.05,
    environment: 0.6,
    background: '#020309',
    haze: [18, 95],
  },
  // The finale: all four sets in a row at dusk, each in its era's light.
  timeline: {
    key: L([0, 270, 90], [0, 218, 0], '#fff0dc', 2.2, 0.6),
    spots: [-30, -10, 10, 30].map((x, i) => L([x, 262, 40], [x, 216, 0], ['#ffc890', '#ffe2c0', '#f2f4ff', '#e6f4ff'][i], 5, 0.42)),
    sky: '#56648a',
    ground: '#1a1a22',
    fill: 0.32,
    environment: 0.4,
    background: '#06070b',
    haze: [70, 300],
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

// The Rocket: watched from beside the line as it races past, the camera turning with it.
function rocketPath(s: number): Pose {
  const x = rocketX(s)
  return [[9.5 - s * 0.5, 1.15, 6.2], [x + 2.2, 2.0, 0]]
}
// The network: the camera circles the globe.
function netPath(s: number): Pose {
  const a = 0.95 - 0.32 * s
  const r = 23 - 1.6 * s
  return [[Math.sin(a) * r, 3.2 - 0.3 * s, Math.cos(a) * r], [0, 0.3, 0]]
}
// The printed vase and its digital twin: half a turn around them.
function printerPath(s: number): Pose {
  const a = 0.85 - 0.45 * s
  return [[1.0 + Math.sin(a) * 2.6, 1.5 - 0.05 * s, Math.cos(a) * 2.6], [1.0, 1.15, 0]]
}
// The finale (FinaleLands in ending-sets.tsx, 200 m up): close on CMCN 1's column, up along
// it, then a long pull-back until all four columns fill the screen.
const FINAL: Pose = [[0, 220, 37], [0, 220, 0]]
function landsPath(s: number): Pose {
  const close: Pose = [[-34, 203, 9], [-30, 203.5, 0]]
  const up: Pose = [[-27, 224, 14], [-30, 222, 0]]
  return mixPose(mixPose(close, up, smooth(0, 5, s)), FINAL, smooth(4, 11, s))
}

// (Acts I-IV and the echoes last 47.9 s together: the music is cut so that its climax lands
// on the closing title, TITLE_AT below. Change a duration, change another to match.)
export const SHOTS: Shot[] = [
  // ACT I, STEAM. In the dark, the mouth of a boiler: the coal catches; the camera draws back
  // over the riveted boiler front and the stoker who feeds it...
  { id: 'ember', act: 1, set: 0, duration: 3.2, rig: 'ember', fov: 40, from: [[0.02, 0.88, 1.5], [0, 0.6, -0.6]], to: [[1.35, 1.55, 4.3], [-0.15, 0.95, 0]] },
  // ...its steam drives Watt's engine, beam rocking and flywheel turning in the shafts of light...
  { id: 'engine', act: 1, set: 0, duration: 3.8, rig: 'engine', from: [[7.4, 1.1, 7.8], [0.6, 1.3, 0]], to: [[4.8, 7.2, 7.6], [-0.4, 3.4, 0]] },
  // ...and out in the open the Rocket races through the evening, smoke streaming behind it.
  { id: 'rocket', act: 1, set: 0, duration: 3.5, rig: 'rocket', path: rocketPath, fov: 42 },
  // ACT II, ELECTRICITY. The ember becomes an electric arc: a dynamo running up, its lamps lighting...
  { id: 'dynamo', act: 2, set: 1, duration: 3.3, rig: 'dynamo', into: 'flash', veil: '#ffe2b0', from: [[0.35, 1.75, 2.3], [0, 1.6, 0]], to: [[3.9, 2.7, 7.4], [0, 2.0, 0]] },
  // ...the light spreads through a whole city at night...
  { id: 'grid', act: 2, set: 1, duration: 3.9, rig: 'grid', fov: 50, from: [[-24, 74, 100], [0, 0, 4]], to: [[8, 40, 52], [0, 0, -8]] },
  // ...and down a long hall, cars come off the assembly line, one after another, headlamps lit.
  { id: 'line', act: 2, set: 1, duration: 3.3, rig: 'line', from: [[1.7, 1.6, 8.5], [0, 1.0, -24]], to: [[1.35, 1.25, 4.6], [0, 1.0, -24]] },
  // ACT III, DIGITAL. The headlamp's glow becomes light on a microprocessor...
  { id: 'chip', act: 3, set: 2, duration: 1.6, rig: 'chip', into: 'flash', veil: '#fff3dc', fov: 38, from: [[2.1, 1.6, 2.5], [0, 0.3, 0]], to: [[0.32, 1.0, 0.5], [0, 0.38, -0.12]] },
  // ...and the camera dives into it: a city of circuits with signals racing through it...
  { id: 'die', act: 3, set: 2, duration: 2.0, rig: 'die', into: 'flash', veil: '#c8ffe0', fov: 55, from: [[-8, 3.6, 12], [0, -1.6, -2]], to: [[5, 1.9, -3], [14, -1.2, -12]] },
  // ...a programmer's code appears on a screen...
  { id: 'terminal', act: 3, set: 2, duration: 3.2, rig: 'terminal', from: [[1.1, 1.95, 2.1], [0, 1.25, -0.6]], to: [[0.3, 1.74, 0.66], [0, 1.27, -0.6]] },
  // ...and links of light join computers all over the globe.
  { id: 'net', act: 3, set: 2, duration: 3.2, rig: 'net', path: netPath, fov: 45 },
  // ACT IV, CONNECTED. Out of the light, a bright factory where people and robots work side by side...
  { id: 'cobots', act: 4, set: 3, duration: 3.4, rig: 'cobots', into: 'flash', veil: '#dcfaff', from: [[-7.5, 2.1, 6], [-1, 1.1, -2]], to: [[2.8, 1.7, 2.6], [4.5, 1.1, -3]] },
  // ...a 3D printer builds a vase that already exists, complete, as its digital twin...
  { id: 'printer', act: 4, set: 3, duration: 3.3, rig: 'printer', path: printerPath, fov: 40 },
  // ...and a person stands before an artificial neural network that recognises pictures:
  // close on its columns of neurons first, then back to show the picture going in and the
  // answer lighting up.
  { id: 'mind', act: 4, set: 3, duration: 3.8, rig: 'mind', fov: 50, from: [[0.3, 4.6, -2.6], [0, 4.4, -8]], to: [[0.5, 2.2, 10.5], [0, 3.8, -8]] },
  // FINALE. Echoes of each era's motion, faster and faster: flywheel, line, signals, neurons...
  { id: 'echo1', act: 5, set: 0, duration: 1.6, rig: 'engine', into: 'dip', from: [[5.6, 3.0, 5.6], [0.4, 2.8, 0]], to: [[4.8, 3.2, 4.8], [0.4, 2.9, 0]] },
  { id: 'echo2', act: 5, set: 1, duration: 1.6, rig: 'line', from: [[2.2, 1.3, 1.0], [0, 1.0, -6]], to: [[1.9, 1.2, -0.2], [0, 1.0, -7]] },
  { id: 'echo3', act: 5, set: 2, duration: 1.6, rig: 'die', from: [[2, 2.2, 6], [8, 0, -6]], to: [[6, 1.6, 1], [14, 0, -10]], fov: 55 },
  { id: 'echo4', act: 5, set: 3, duration: 1.6, rig: 'mind', from: [[2.6, 5.8, 1.5], [0, 4.4, -9]], to: [[1.4, 5.2, -0.5], [0, 4.4, -10]], fov: 50 },
  // ...then the time machine flies home past all four eras.
  { id: 'timeline', act: 5, set: -1, duration: 12, rig: 'timeline', into: 'dip', path: landsPath, fov: 62 },
  { id: 'hold', act: 5, set: -1, duration: 600, rig: 'timeline', from: FINAL, to: FINAL, fov: 62 },
]

// Which shot is playing at film time t, and whose set it is in.
export function shotIndexAt(t: number) {
  let i = 0
  while (i < SHOTS.length - 1 && t >= START[SHOTS[i + 1].id]) i++
  return i
}
export const filmSet = () => SHOTS[shotIndexAt(film.t)].set
export const shotId = () => SHOTS[shotIndexAt(film.t)].id

// When each shot begins.
export const START: Record<string, number> = {}
SHOTS.reduce((t, shot) => {
  START[shot.id] = t
  return t + shot.duration
}, 0)
// The closing title appears as the last shot settles (EndingScreen.tsx); "Skip" jumps here.
export const TITLE_AT = START.timeline + 10

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
