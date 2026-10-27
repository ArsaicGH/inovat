import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// THE ROTUNDA DOME, painted as one picture (a canvas texture wrapped round the dome).
// It keeps the hall's classical look (cream ribs, recessed coffers, gold) everywhere, and
// the section of the dome above each era room's door is painted in that era's mood:
// muted era colours in the coffers, small gilded emblems instead of gold rosettes, and one
// larger gilded medallion straight above the door. Gilded ribs mark where sections meet.
// Looking up anywhere in the hall shows which revolution waits behind which door.
//
// The dome has 36 columns of coffers (6 per door, so sections line up with the doors) and
// 7 rows, the top row next to the oculus. Painted once at start: no cost per frame.

const COLUMNS = 36
const ROWS = 7
const CELL_W = 48 // canvas pixels per coffer column (the picture is 1728 x 512)
const HEIGHT = 512
const ROW_H = HEIGHT / ROWS

type Section = 'classic' | 'ir1' | 'ir2' | 'ir3' | 'ir4'

// Which section the dome is in, at an angle measured clockwise from north (the
// CMCN 3 door is north, then CMCN 4, the Game Room, the intro hall, CMCN 1, CMCN 2 every 60 degrees).
const SECTIONS: Section[] = ['ir3', 'ir4', 'classic', 'classic', 'ir1', 'ir2']

interface Style {
  shades: [number, number, number][] // coffer colours from the outer step to the deepest
}
const RIB = '#e8dcc3' // the cream ribs between coffers (the same everywhere)
const GOLD = '#c9a25a'
const STYLES: Record<Section, Style> = {
  // The hall's own classical coffers.
  classic: { shades: [[220, 208, 180], [198, 186, 158], [176, 164, 136], [154, 142, 114]] },
  // Steam: warm sepia and copper.
  ir1: { shades: [[214, 186, 150], [190, 154, 112], [164, 122, 82], [138, 96, 60]] },
  // Electricity: deep enamel navy.
  ir2: { shades: [[150, 160, 176], [96, 112, 138], [62, 78, 106], [42, 56, 82]] },
  // Computers: dark screen green.
  ir3: { shades: [[150, 172, 152], [92, 128, 104], [58, 96, 74], [36, 70, 52]] },
  // Digital: dark slate teal.
  ir4: { shades: [[148, 172, 180], [90, 124, 136], [56, 92, 106], [34, 66, 80]] },
}

const rgb = ([r, g, b]: [number, number, number]) => `rgb(${r}, ${g}, ${b})`

// The angle (clockwise from north) that a column of the picture faces. The dome's picture
// runs the other way round (three.js sphere: x = -cos, z = sin of the picture angle).
function columnAngle(column: number): number {
  const u = (column + 0.5) / COLUMNS
  return (((0.75 - u) * 360) % 360 + 360) % 360
}

function sectionOf(column: number): Section {
  return SECTIONS[Math.round(columnAngle(column) / 60) % 6]
}

// ---- Small gilded emblems (one per coffer) ----
function emblem(ctx: CanvasRenderingContext2D, section: Section, x: number, y: number, s: number) {
  ctx.fillStyle = GOLD
  ctx.strokeStyle = GOLD
  ctx.lineWidth = Math.max(1.5, s * 0.12)
  if (section === 'classic') {
    ctx.beginPath()
    ctx.arc(x, y, s * 0.35, 0, Math.PI * 2)
    ctx.fill()
  } else if (section === 'ir1') {
    // A cog: a ring with teeth.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.fillRect(x + Math.cos(a) * s * 0.55 - s * 0.1, y + Math.sin(a) * s * 0.55 - s * 0.1, s * 0.2, s * 0.2)
    }
    ctx.beginPath()
    ctx.arc(x, y, s * 0.42, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, s * 0.12, 0, Math.PI * 2)
    ctx.fill()
  } else if (section === 'ir2') {
    // A lightning bolt.
    ctx.beginPath()
    ctx.moveTo(x + s * 0.15, y - s * 0.6)
    ctx.lineTo(x - s * 0.3, y + s * 0.08)
    ctx.lineTo(x, y + s * 0.08)
    ctx.lineTo(x - s * 0.15, y + s * 0.6)
    ctx.lineTo(x + s * 0.3, y - s * 0.08)
    ctx.lineTo(x, y - s * 0.08)
    ctx.closePath()
    ctx.fill()
  } else if (section === 'ir3') {
    // A little pixel motif (a 3 x 3 chequer, like an early screen).
    const p = s * 0.28
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if ((i + j) % 2 === 0) ctx.fillRect(x - p * 1.5 + i * p, y - p * 1.5 + j * p, p * 0.85, p * 0.85)
      }
    }
  } else {
    // A hexagon with a dot: a network node.
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6
      const px = x + Math.cos(a) * s * 0.5
      const py = y + Math.sin(a) * s * 0.5
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, s * 0.12, 0, Math.PI * 2)
    ctx.fill()
  }
}

// One coffer: nested recessed steps in the section's colours, with its emblem.
function coffer(ctx: CanvasRenderingContext2D, section: Section, x: number, y: number) {
  const shades = STYLES[section].shades
  for (let i = 0; i < 4; i++) {
    const insetX = CELL_W * (0.11 + i * 0.07)
    const insetY = ROW_H * (0.11 + i * 0.07)
    ctx.fillStyle = rgb(shades[i])
    ctx.fillRect(x + insetX, y + insetY, CELL_W - 2 * insetX, ROW_H - 2 * insetY)
  }
  emblem(ctx, section, x + CELL_W / 2, y + ROW_H / 2, Math.min(CELL_W, ROW_H) * 0.26)
}

// The big gilded medallion above an era door: a gold ring, a disc of the era's colour and
// a large emblem, spanning a few coffers in the lower, larger rows.
function medallion(ctx: CanvasRenderingContext2D, section: Section, x: number, y: number) {
  const r = ROW_H * 0.95
  const shades = STYLES[section].shades
  ctx.fillStyle = RIB
  ctx.beginPath()
  ctx.arc(x, y, r * 1.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = rgb(shades[3])
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = GOLD
  ctx.lineWidth = r * 0.1
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = r * 0.03
  ctx.beginPath()
  ctx.arc(x, y, r * 0.84, 0, Math.PI * 2)
  ctx.stroke()
  // Small gold beads round the rim, like the hall's gilding.
  ctx.fillStyle = GOLD
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(x + Math.cos(a) * r * 1.06, y + Math.sin(a) * r * 1.06, r * 0.035, 0, Math.PI * 2)
    ctx.fill()
  }
  emblem(ctx, section, x, y, r * 0.95)
}

export function paintDome(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = COLUMNS * CELL_W
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = RIB
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let c = 0; c < COLUMNS; c++) {
      for (let r = 0; r < ROWS; r++) coffer(ctx, sectionOf(c), c * CELL_W, r * ROW_H)
    }
    // Gilded ribs where sections meet (every 6 columns; the sections line up with them).
    ctx.fillStyle = GOLD
    for (let c = 0; c <= COLUMNS; c += 6) {
      const x = c * CELL_W
      ctx.fillRect(x - 3, 0, 6, HEIGHT)
    }
    // A medallion above each era door, in the middle of its section, in the lower rows
    // (row 4-5 of 0-6, counted from the oculus).
    for (let c = 0; c < COLUMNS; c += 6) {
      const section = sectionOf(c + 3)
      if (section !== 'classic') medallion(ctx, section, (c + 3) * CELL_W, ROW_H * 5)
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.anisotropy = 8
  return texture
}

// THE CROWN of the dome: a closed, painted ceiling disc where the oculus was (the hall is
// lit by the chandelier, not a skylight). A classical rosette in the hall's cream and gold:
// gilded rings, a sunburst of rays, twelve petals (one per wall) and a gold boss in the
// middle where the chandelier's chain hangs from. Painted once at start.
export function paintCrown(): CanvasTexture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const c = size / 2
    const ring = (r: number, width: number, colour: string) => {
      ctx.strokeStyle = colour
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.arc(c, c, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    const disc = (x: number, y: number, r: number, colour: string) => {
      ctx.fillStyle = colour
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // Cream ground, a little deeper towards the middle, like a shallow recessed bowl.
    const ground = ctx.createRadialGradient(c, c, 0, c, c, c)
    ground.addColorStop(0, 'rgb(206, 192, 162)')
    ground.addColorStop(1, 'rgb(228, 216, 190)')
    ctx.fillStyle = ground
    ctx.fillRect(0, 0, size, size)
    // Sunburst: 48 thin gold rays between the outer bands and the petals.
    ctx.fillStyle = GOLD
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2
      const w = 0.018
      ctx.beginPath()
      ctx.moveTo(c + Math.cos(a - w) * c * 0.78, c + Math.sin(a - w) * c * 0.78)
      ctx.lineTo(c + Math.cos(a) * c * 0.42, c + Math.sin(a) * c * 0.42)
      ctx.lineTo(c + Math.cos(a + w) * c * 0.78, c + Math.sin(a + w) * c * 0.78)
      ctx.closePath()
      ctx.fill()
    }
    // Outer bands: a gold rim, a row of beads and a thin inner line.
    ring(c * 0.96, c * 0.06, GOLD)
    ring(c * 0.9, c * 0.012, GOLD)
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2
      disc(c + Math.cos(a) * c * 0.85, c + Math.sin(a) * c * 0.85, c * 0.014, GOLD)
    }
    ring(c * 0.8, c * 0.01, GOLD)
    // Twelve petals: cream leaves outlined in gold, pointing out to the twelve walls.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      ctx.save()
      ctx.translate(c, c)
      ctx.rotate(a)
      ctx.beginPath()
      ctx.moveTo(c * 0.16, 0)
      ctx.quadraticCurveTo(c * 0.3, -c * 0.1, c * 0.42, 0)
      ctx.quadraticCurveTo(c * 0.3, c * 0.1, c * 0.16, 0)
      ctx.fillStyle = RIB
      ctx.fill()
      ctx.strokeStyle = GOLD
      ctx.lineWidth = c * 0.012
      ctx.stroke()
      ctx.restore()
    }
    ring(c * 0.44, c * 0.02, GOLD)
    // The boss: gold rings and a gold centre.
    disc(c, c, c * 0.16, RIB)
    ring(c * 0.15, c * 0.02, GOLD)
    disc(c, c, c * 0.1, GOLD)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}
