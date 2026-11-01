import type { RoomId } from '../types'
import type { SurfaceName } from './textures'
import type { PaintedName } from './painted-surfaces'

// THE LOOK OF EACH ROOM (M6). Surfaces, light colour and brightness per room.
// Part of the style guide (README.md). The rotunda has its own look (Rotunda.tsx).

export interface SurfaceStyle {
  texture?: SurfaceName // leave out for a plain colour
  painted?: PaintedName // or a surface painted in code (painted-surfaces.ts)
  colour: string // tint (white = the texture's own colours)
  tile: number // metres covered by one copy of the texture
  roughness: number // 0 = mirror-like, 1 = matte
  metalness?: number
}

export interface RoomTheme {
  floor: SurfaceStyle
  walls: SurfaceStyle
  ceiling: string
  ceilingSurface?: SurfaceStyle // a patterned ceiling instead of the plain colour
  sky: string // colour of the soft "sky" fill light while in this room
  // Colour of the light bouncing up off the floor (the fill light's lower half): warm off
  // wood, grey off concrete... Real rooms are lit this way, and it ties each room together.
  bounce: string
  fill: number // how strong that fill light is (low = dark room, exhibits stand out)
  // A coloured light from the room's own lamps (lanterns, bulbs, panels, light strips),
  // so each room has its own light colour, not just white spotlights. Position in the
  // room's local coordinates (x across, y up, z towards the entrance), as in RoomDecor.
  accent: { colour: string; intensity: number; at: [number, number, number] }
  lighting: RoomLighting
}

// THE ROOM'S LIGHTING DESIGN, in one place (read by Lighting in Museum.tsx, spot-plan.ts
// and light-maps.ts). Layered like a real gallery: a soft general light so the whole room
// reads (fill, reflections, the hidden wall-washers and the light on the ceiling), the
// exhibit spotlights on top, strongest on the room's most important exhibit.
export interface RoomLighting {
  // Reflection light (scene.environment): how much shiny surfaces mirror, and an even
  // light on everything (low in the darker galleries).
  environment: number
  // Colour temperature of the exhibit spotlights and of the key light: warm amber in the
  // steam age, neutral in CMCN 3, cool daylight white in CMCN 4.
  spotColour: string
  keyColour: string
  // Strength of the key light's soft wash over the whole room (spot-plan.ts).
  wash: number
  // Hidden wall-washers (light-maps.ts): light colour, strength along the top of the walls,
  // metres between washers (0 = one continuous hidden slot under the ceiling), and a glow
  // along the foot of the walls (0 = none).
  wallWash: { colour: string; strength: number; rhythm: number; floor: number }
  // Light reaching the ceiling, brightest near the washed walls (0 = none).
  ceilingGlow: { colour: string; strength: number }
  // The room's most important exhibit: its spotlight is the strongest (spot-plan.ts).
  primary?: string
}

// Rooms without washers or a lit ceiling (the bright intro hall and Game Room).
const PLAIN: Pick<RoomLighting, 'wallWash' | 'ceilingGlow'> = {
  wallWash: { colour: '#ffffff', strength: 0, rhythm: 0, floor: 0 },
  ceilingGlow: { colour: '#ffffff', strength: 0.0 },
}

export const ROOM_THEMES: Record<Exclude<RoomId, 'rotunda'>, RoomTheme> = {
  // Welcoming lobby (finished in M6 step 3).
  hall: {
    floor: { texture: 'wood-floor', colour: '#ffffff', tile: 2.5, roughness: 0.55 },
    walls: { texture: 'plaster', colour: '#efe4cf', tile: 3, roughness: 0.85 },
    ceiling: '#e6dccb',
    sky: '#fff1dc',
    bounce: '#5a3e28',
    fill: 0.32,
    accent: { colour: '#ffd49a', intensity: 22, at: [0, 3.4, 0] }, // the two chandeliers
    lighting: { environment: 1, spotColour: '#ffe6c4', keyColour: '#ffe9cf', wash: 40, ...PLAIN },
  },
  // CMCN 1: steam age. Brick, wood, warm lamplight.
  ir1: {
    floor: { texture: 'wood-floor', colour: '#8c6a4c', tile: 2.5, roughness: 0.6 },
    bounce: '#5a3420',
    walls: { texture: 'bricks', colour: '#a6866a', tile: 2.5, roughness: 0.9 },
    ceiling: '#3b2a1e',
    // Timber boards overhead (a plain dark colour read as a black hole).
    ceilingSurface: { texture: 'wood-floor', colour: '#6e5640', tile: 2.5, roughness: 0.85 },
    sky: '#ffcf96',
    // (Dark like a real gallery, but not so dark that the paintings on the walls disappear:
    // brightened, leader 2026-11-01.)
    fill: 0.4,
    accent: { colour: '#ffa04d', intensity: 5, at: [-7.4, 2.6, 0] }, // the wall lanterns
    // Warm and low, like firelight: one continuous warm wash along the brick, the timber
    // ceiling glowing faintly; the Watt engine is the room's focus.
    lighting: {
      environment: 0.8,
      spotColour: '#ffd3a2',
      keyColour: '#ffc68c',
      wash: 9,
      wallWash: { colour: '#d9965a', strength: 5.2, rhythm: 0, floor: 0 },
      ceilingGlow: { colour: '#ffb47a', strength: 4 },
      primary: 'ir1-1',
    },
  },
  // CMCN 2: electricity and mass production. Steel, concrete, early bulbs.
  ir2: {
    // Polished concrete in a deep navy, a darker shade of the walls' blue (grey and beige
    // did not belong with them: leader).
    floor: { texture: 'concrete', colour: '#4f5f86', tile: 3, roughness: 0.5 },
    bounce: '#323f5c',
    // Dark navy steel plates (the central hall ceiling's CMCN 2 blue; bare metal read as black).
    walls: { texture: 'metal-plates', colour: '#5a78c4', tile: 2, roughness: 0.6, metalness: 0.15 },
    ceiling: '#24282d',
    // A concrete slab overhead, in a lighter, greyer blue.
    ceilingSurface: { texture: 'concrete', colour: '#6c7ba3', tile: 3, roughness: 0.9 },
    sky: '#e9e1d2',
    fill: 0.4,
    accent: { colour: '#ffc977', intensity: 5, at: [0, 2.9, 0] }, // the hanging bulbs
    // Neutral-warm and ordered: wall-washers in a regular row (the rhythm of a factory
    // hall), a little brighter than CMCN 1; electric power, in the middle, is the focus.
    lighting: {
      environment: 0.88,
      spotColour: '#ffe5c4',
      keyColour: '#ffead2',
      wash: 5,
      wallWash: { colour: '#d4e0ff', strength: 5, rhythm: 2.4, floor: 0 },
      ceilingGlow: { colour: '#e2e9ff', strength: 2.4 },
      primary: 'ir2-3',
    },
  },
  // CMCN 3: computers. Beige panels, checkered floor, fluorescent light.
  ir3: {
    // Polished concrete in a deep green, a darker shade of the walls (brown tiles and then grey
    // did not belong with them: leader). The same concrete pictures as CMCN 2's floor.
    floor: { texture: 'concrete', colour: '#45665a', tile: 3, roughness: 0.42 },
    // Deep teal-green panels (a calmer, cooler green than the bright one before: leader),
    // lit by a soft sea-green wash.
    walls: { painted: 'office-panels', colour: '#3a5f56', tile: 1.2, roughness: 0.7 },
    bounce: '#2f463e',
    ceiling: '#55706a',
    // Ceiling tiles in a soft, lighter green.
    ceilingSurface: { painted: 'ceiling-tiles', colour: '#5f8074', tile: 1.2, roughness: 0.9 },
    sky: '#eef6f4',
    fill: 0.34,
    accent: { colour: '#e4efff', intensity: 5, at: [0, 4.2, 0] }, // the fluorescent panels
    // Neutral white, clean and even: a precise continuous wash and a lit tile ceiling; the
    // microprocessor is the focus.
    lighting: {
      environment: 0.88,
      spotColour: '#fff3e6',
      keyColour: '#f3f6ff',
      wash: 3,
      wallWash: { colour: '#9ad8c3', strength: 3.7, rhythm: 0, floor: 0.9 },
      ceilingGlow: { colour: '#b4d6cb', strength: 2.9 },
      primary: 'ir3-1',
    },
  },
  // CMCN 4: digital and smart technology. White gloss, glass, cyan light.
  ir4: {
    floor: { colour: '#a3acb3', tile: 1, roughness: 0.12, metalness: 0.2 },
    walls: { painted: 'tech-panels', colour: '#dfe6eb', tile: 1.5, roughness: 0.3 },
    bounce: '#3c4c55',
    ceiling: '#535b61',
    ceilingSurface: { painted: 'tech-ceiling', colour: '#c4ccd1', tile: 2.4, roughness: 0.5 },
    sky: '#e2f1f6',
    fill: 0.3,
    // (Cyan only as an accent: at 22 it tinted the whole room.)
    accent: { colour: '#5fe3f2', intensity: 12, at: [0, 4.4, 0] }, // the cyan light ring
    // Cool daylight white, the brightest era room: a wash from above and a light line along
    // the foot of the walls; AI, in the middle, is the focus of the whole museum.
    lighting: {
      environment: 0.95,
      spotColour: '#f5f8ff',
      keyColour: '#eef6ff',
      wash: 7,
      wallWash: { colour: '#e9f5ff', strength: 3, rhythm: 0, floor: 0.9 },
      ceilingGlow: { colour: '#e6f4ff', strength: 2.4 },
      primary: 'ir4-3',
    },
  },
  // Game Room: a bright white-and-gold salon like the intro hall and the rotunda (white
  // marble, cream walls, gold), with a red carpet up to the quiz platform.
  quiz: {
    floor: { texture: 'marble', colour: '#f4efe6', tile: 3, roughness: 0.18 },
    bounce: '#5e5246',
    walls: { texture: 'plaster', colour: '#efe4cf', tile: 3, roughness: 0.85 },
    ceiling: '#e6dccb',
    sky: '#fff1dc',
    fill: 0.07, // much dimmer than the hall, so the spotlit quiz lectern is the centre of attention
    accent: { colour: '#ffd49a', intensity: 7, at: [0, 3.4, 0] }, // the wall sconces
    lighting: { environment: 1, spotColour: '#ffe6c4', keyColour: '#ffe9cf', wash: 6, ...PLAIN },
  },
}
