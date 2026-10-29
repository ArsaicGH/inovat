import { CanvasTexture, SRGBColorSpace, type Texture } from 'three'
import type { RoomId } from '../types'
import { ROOM_THEMES } from './room-themes'

// BAKED ARCHITECTURAL LIGHT ("light maps"): the soft light that a real gallery's hidden
// wall-washers put on its walls, and that bounces up onto its ceiling, painted ONCE into
// small pictures instead of computed by more lamps (every real lamp costs work for every
// pixel, and the number of lamps never changes, see Lighting in Museum.tsx). A light map
// adds light to a surface without lighting anything else, so the walls and ceiling read
// as a room while the exhibits keep their spotlights. Each room's pattern follows its era
// (room-themes.ts, lighting): one continuous warm slot of light in CMCN 1, a regular row of
// washers in CMCN 2, an even precise wash in CMCN 3, a light line at the foot of the walls
// in CMCN 4.

type Era = Exclude<RoomId, 'rotunda'>

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// Paint a picture pixel by pixel: `value` gives the brightness (0-1) at (u across, v up).
function paint(width: number, height: number, colour: string, value: (u: number, v: number) => number): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(width, height)
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16))
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const k = Math.min(1, Math.max(0, value((x + 0.5) / width, 1 - (y + 0.5) / height)))
      const i = (y * width + x) * 4
      image.data[i] = r * k
      image.data[i + 1] = g * k
      image.data[i + 2] = b * k
      image.data[i + 3] = 255
    }
  ctx.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

const walls = new Map<Era, Texture>()
const ceilings = new Map<Era, Texture>()

// The light on one wall (u along the wall, v from the floor up). With a rhythm, the picture
// holds ONE washer's cone of light; Walls.tsx repeats it along each wall.
export function wallWashMap(room: Era): Texture {
  const cached = walls.get(room)
  if (cached) return cached
  const { colour, rhythm, floor } = ROOM_THEMES[room].lighting.wallWash
  const texture = paint(rhythm > 0 ? 64 : 16, 128, colour, (u, v) => {
    const down = 1 - v // 0 under the ceiling, 1 at the floor
    let light: number
    if (rhythm > 0) {
      // A cone of light from a washer near the ceiling, widening as it falls, with a soft
      // edge (the "scallop" of real gallery walls), and a little light between the cones.
      const across = Math.abs(u - 0.5) * 2
      const width = 0.35 + down * 0.9
      const cone = 1 - smooth(width - 0.3, width + 0.15, across)
      light = (0.18 + 0.82 * cone) * Math.exp(-down * 1.5)
    } else {
      // One continuous hidden slot: brightest under the ceiling, fading down the wall, a
      // little darker into the corners.
      light = (0.12 + 0.88 * Math.exp(-down * 2.2)) * (0.78 + 0.22 * Math.sin(Math.PI * u))
    }
    // A light line hidden in the skirting: a glow along the foot of the wall.
    return light + floor * Math.exp(-v * 14)
  })
  walls.set(room, texture)
  return texture
}

// The light on a ceiling (one picture across each ceiling area): light bouncing up from the
// washed walls, so it is brightest along the edges and softer in the middle. The ceiling's
// own material shows through, instead of a black void overhead.
export function ceilingGlowMap(room: Era): Texture {
  const cached = ceilings.get(room)
  if (cached) return cached
  const { colour } = ROOM_THEMES[room].lighting.ceilingGlow
  const texture = paint(64, 64, colour, (u, v) => {
    const fromEdge = Math.min(u, 1 - u, v, 1 - v) * 2 // 0 at an edge, 1 in the middle
    return 0.3 + 0.7 * Math.exp(-fromEdge * 4.5)
  })
  ceilings.set(room, texture)
  return texture
}
