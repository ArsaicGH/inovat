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
  light: { colour: string; intensity: number } // the roaming room light
  sky: string // colour of the soft "sky" fill light while in this room
}

export const ROOM_THEMES: Record<Exclude<RoomId, 'rotunda'>, RoomTheme> = {
  // Welcoming lobby (finished in M6 step 3).
  hall: {
    floor: { texture: 'wood-floor', colour: '#ffffff', tile: 2.5, roughness: 0.55 },
    walls: { texture: 'plaster', colour: '#efe4cf', tile: 3, roughness: 0.85 },
    ceiling: '#e6dccb',
    light: { colour: '#ffd7a0', intensity: 32 },
    sky: '#fff1dc',
  },
  // CMCN 1: steam age. Brick, wood, warm lamplight.
  ir1: {
    floor: { texture: 'wood-floor', colour: '#d9b892', tile: 2.5, roughness: 0.6 },
    walls: { texture: 'bricks', colour: '#e9cdb6', tile: 2.5, roughness: 0.9 },
    ceiling: '#3b2a1e',
    light: { colour: '#ffad5c', intensity: 38 },
    sky: '#ffcf96',
  },
  // CMCN 2: electricity and mass production. Steel, concrete, early bulbs.
  ir2: {
    floor: { texture: 'concrete', colour: '#c4c1bb', tile: 3, roughness: 0.75 },
    walls: { texture: 'metal-plates', colour: '#c9ced4', tile: 2, roughness: 0.5, metalness: 0.5 },
    ceiling: '#2c3036',
    light: { colour: '#ffdca6', intensity: 36 },
    sky: '#e9e1d2',
  },
  // CMCN 3: computers. Beige panels, checkered floor, fluorescent light.
  ir3: {
    floor: { texture: 'tiles', colour: '#ffffff', tile: 1.6, roughness: 0.45 },
    walls: { colour: '#d8ccb0', tile: 1, roughness: 0.75 },
    ceiling: '#c9c4b6',
    light: { colour: '#eef6ff', intensity: 26 },
    sky: '#f2f6ff',
  },
  // CMCN 4: digital and smart technology. White gloss, glass, cyan light.
  ir4: {
    floor: { colour: '#e6ecf0', tile: 1, roughness: 0.12, metalness: 0.2 },
    walls: { colour: '#f3f6f9', tile: 1, roughness: 0.3 },
    ceiling: '#cfd6dc',
    light: { colour: '#bff3ff', intensity: 26 },
    sky: '#d8f6ff',
  },
  // Quiz room (finished in M6 step 3).
  quiz: {
    floor: { texture: 'tiles', colour: '#ffd9e6', tile: 1.6, roughness: 0.5 },
    walls: { colour: '#3a2f4a', tile: 1, roughness: 0.7 },
    ceiling: '#2a2236',
    light: { colour: '#ffb8d4', intensity: 34 },
    sky: '#ffd6e8',
  },
}
