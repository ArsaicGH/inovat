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
  },
  // CMCN 1: steam age. Brick, wood, warm lamplight.
  ir1: {
    floor: { texture: 'wood-floor', colour: '#d9b892', tile: 2.5, roughness: 0.6 },
    bounce: '#5a3420',
    walls: { texture: 'bricks', colour: '#e9cdb6', tile: 2.5, roughness: 0.9 },
    ceiling: '#3b2a1e',
    sky: '#ffcf96',
    fill: 0.16,
    accent: { colour: '#ffa04d', intensity: 16, at: [-7.4, 2.6, 0] }, // the wall lanterns
  },
  // CMCN 2: electricity and mass production. Steel, concrete, early bulbs.
  ir2: {
    floor: { texture: 'concrete', colour: '#aaa69f', tile: 3, roughness: 0.75 },
    bounce: '#45423c',
    walls: { texture: 'metal-plates', colour: '#a2a9b0', tile: 2, roughness: 0.5, metalness: 0.5 },
    ceiling: '#24282d',
    sky: '#e9e1d2',
    fill: 0.12,
    accent: { colour: '#ffc977', intensity: 16, at: [0, 2.9, 0] }, // the hanging bulbs
  },
  // CMCN 3: computers. Beige panels, checkered floor, fluorescent light.
  ir3: {
    floor: { texture: 'tiles', colour: '#d6cfc2', tile: 1.6, roughness: 0.45 },
    walls: { painted: 'office-panels', colour: '#ffffff', tile: 1.2, roughness: 0.8 },
    bounce: '#544f45',
    ceiling: '#6a655a',
    ceilingSurface: { painted: 'ceiling-tiles', colour: '#d9d6cc', tile: 1.2, roughness: 0.9 },
    sky: '#f2f6ff',
    fill: 0.11,
    accent: { colour: '#e4efff', intensity: 17, at: [0, 4.4, 0] }, // the fluorescent panels
  },
  // CMCN 4: digital and smart technology. White gloss, glass, cyan light.
  ir4: {
    floor: { colour: '#a3acb3', tile: 1, roughness: 0.12, metalness: 0.2 },
    walls: { painted: 'tech-panels', colour: '#dfe6eb', tile: 1.5, roughness: 0.3 },
    bounce: '#3c4c55',
    ceiling: '#535b61',
    ceilingSurface: { painted: 'tech-ceiling', colour: '#c4ccd1', tile: 2.4, roughness: 0.5 },
    sky: '#d8f6ff',
    fill: 0.1,
    accent: { colour: '#5fe3f2', intensity: 22, at: [0, 5.2, 0] }, // the cyan light ring
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
  },
}
