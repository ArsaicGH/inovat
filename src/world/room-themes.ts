import type { RoomId } from '../types'
import type { SurfaceName } from './textures'

// THE LOOK OF EACH ROOM (M6). Surfaces, light colour and brightness per room.
// Part of the style guide (README.md). The rotunda has its own look (Rotunda.tsx).

export interface SurfaceStyle {
  texture?: SurfaceName // leave out for a plain colour
  colour: string // tint (white = the texture's own colours)
  tile: number // metres covered by one copy of the texture
  roughness: number // 0 = mirror-like, 1 = matte
  metalness?: number
}

export interface RoomTheme {
  floor: SurfaceStyle
  walls: SurfaceStyle
  ceiling: string
  sky: string // colour of the soft "sky" fill light while in this room
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
    fill: 0.32,
    accent: { colour: '#ffd49a', intensity: 22, at: [0, 3.4, 0] }, // the two chandeliers
  },
  // CMCN 1: steam age. Brick, wood, warm lamplight.
  ir1: {
    floor: { texture: 'wood-floor', colour: '#d9b892', tile: 2.5, roughness: 0.6 },
    walls: { texture: 'bricks', colour: '#e9cdb6', tile: 2.5, roughness: 0.9 },
    ceiling: '#3b2a1e',
    sky: '#ffcf96',
    fill: 0.13,
    accent: { colour: '#ffa04d', intensity: 16, at: [-7.4, 2.6, 0] }, // the wall lanterns
  },
  // CMCN 2: electricity and mass production. Steel, concrete, early bulbs.
  ir2: {
    floor: { texture: 'concrete', colour: '#aaa69f', tile: 3, roughness: 0.75 },
    walls: { texture: 'metal-plates', colour: '#a2a9b0', tile: 2, roughness: 0.5, metalness: 0.5 },
    ceiling: '#24282d',
    sky: '#e9e1d2',
    fill: 0.09,
    accent: { colour: '#ffc977', intensity: 16, at: [0, 2.9, 0] }, // the hanging bulbs
  },
  // CMCN 3: computers. Beige panels, checkered floor, fluorescent light.
  ir3: {
    floor: { texture: 'tiles', colour: '#d6cfc2', tile: 1.6, roughness: 0.45 },
    walls: { colour: '#b4a88c', tile: 1, roughness: 0.75 },
    ceiling: '#6a655a',
    sky: '#f2f6ff',
    fill: 0.08,
    accent: { colour: '#e4efff', intensity: 13, at: [0, 3.9, 0] }, // the fluorescent panels
  },
  // CMCN 4: digital and smart technology. White gloss, glass, cyan light.
  ir4: {
    floor: { colour: '#a3acb3', tile: 1, roughness: 0.12, metalness: 0.2 },
    walls: { colour: '#c3ccd4', tile: 1, roughness: 0.3 },
    ceiling: '#535b61',
    sky: '#d8f6ff',
    fill: 0.08,
    accent: { colour: '#5fe3f2', intensity: 14, at: [0, 3.9, 0] }, // the cyan light ring
  },
  // Quiz room (finished in M6 step 3).
  quiz: {
    floor: { texture: 'tiles', colour: '#ffd9e6', tile: 1.6, roughness: 0.5 },
    walls: { colour: '#3a2f4a', tile: 1, roughness: 0.7 },
    ceiling: '#2a2236',
    sky: '#ffd6e8',
    fill: 0.1,
    accent: { colour: '#ff8fc0', intensity: 10, at: [0, 3.6, -3] }, // the show bulbs
  },
}
