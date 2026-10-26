import { CanvasTexture } from 'three'

// SURFACES PAINTED IN CODE (canvas pictures), for looks no downloaded texture has: the
// 80s/90s computer room (CMCN 3) and the digital room (CMCN 4). Each is painted once,
// the first time it is needed, and then shared (repeated() copies it per surface). The
// same picture also serves as a bump map, so dark seams read as real grooves.
// One painted picture covers `tile` metres (set in room-themes.ts).

export type PaintedName = 'office-panels' | 'ceiling-tiles' | 'tech-panels' | 'tech-ceiling'

const SIZE = 512

// Fine random speckle, like vinyl or mineral fibre. `seed` keeps it the same every time.
function speckle(ctx: CanvasRenderingContext2D, count: number, dark: string, light: string, seed: number) {
  let s = seed
  const random = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = random() < 0.5 ? dark : light
    const r = 0.6 + random() * 1.4
    ctx.fillRect(random() * SIZE, random() * SIZE, r, r)
  }
}

const PAINTERS: Record<PaintedName, (ctx: CanvasRenderingContext2D) => void> = {
  // CMCN 3 walls: beige vinyl wall panels of an 80s/90s office or computer room. Each
  // picture is one 1.2 m panel: a fabric-like weave and darker grooves at the panel joins.
  'office-panels': (ctx) => {
    ctx.fillStyle = '#d8ccb0'
    ctx.fillRect(0, 0, SIZE, SIZE)
    // Weave: faint horizontal and vertical threads.
    for (let i = 0; i < SIZE; i += 3) {
      ctx.fillStyle = i % 6 === 0 ? 'rgba(120, 100, 70, 0.05)' : 'rgba(255, 250, 235, 0.05)'
      ctx.fillRect(0, i, SIZE, 1)
      ctx.fillRect(i, 0, 1, SIZE)
    }
    speckle(ctx, 9000, 'rgba(110, 92, 60, 0.18)', 'rgba(255, 248, 228, 0.25)', 7)
    // Panel joins at the left and right edges (they meet the next panel's join).
    ctx.fillStyle = '#8f8064'
    ctx.fillRect(0, 0, 5, SIZE)
    ctx.fillRect(SIZE - 5, 0, 5, SIZE)
    ctx.fillStyle = 'rgba(255, 250, 235, 0.5)'
    ctx.fillRect(5, 0, 2, SIZE)
  },
  // CMCN 3 ceiling: a suspended ceiling of 60 cm mineral-fibre tiles in a metal grid, the
  // classic office ceiling. Each picture is 2 x 2 tiles, with pinholes and fissures.
  'ceiling-tiles': (ctx) => {
    ctx.fillStyle = '#e9e6dd'
    ctx.fillRect(0, 0, SIZE, SIZE)
    speckle(ctx, 14000, 'rgba(90, 86, 76, 0.35)', 'rgba(255, 255, 250, 0.4)', 11)
    // Short worm-like fissures.
    let s = 3
    const random = () => {
      s = (s * 16807) % 2147483647
      return s / 2147483647
    }
    ctx.strokeStyle = 'rgba(120, 114, 100, 0.35)'
    ctx.lineWidth = 1.2
    for (let i = 0; i < 260; i++) {
      const x = random() * SIZE
      const y = random() * SIZE
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + (random() - 0.5) * 14, y + (random() - 0.5) * 14, x + (random() - 0.5) * 18, y + (random() - 0.5) * 18)
      ctx.stroke()
    }
    // The grid: off-white metal T-bars with a dark shadow line.
    const half = SIZE / 2
    for (const p of [0, half]) {
      ctx.fillStyle = '#8a877e'
      ctx.fillRect(p, 0, 3, SIZE)
      ctx.fillRect(0, p, SIZE, 3)
      ctx.fillStyle = '#f6f4ee'
      ctx.fillRect(p + 3, 0, 7, SIZE)
      ctx.fillRect(0, p + 3, SIZE, 7)
    }
  },
  // CMCN 4 walls: smooth white composite panels with fine seams, rows of tiny perforations
  // and faint circuit-like traces, a clean, high-tech surface.
  'tech-panels': (ctx) => {
    ctx.fillStyle = '#e7ecef'
    ctx.fillRect(0, 0, SIZE, SIZE)
    const shade = ctx.createLinearGradient(0, 0, SIZE, SIZE)
    shade.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
    shade.addColorStop(1, 'rgba(180, 196, 206, 0.25)')
    ctx.fillStyle = shade
    ctx.fillRect(0, 0, SIZE, SIZE)
    // Circuit traces: lines with right-angle and 45-degree turns ending in small pads.
    ctx.strokeStyle = 'rgba(120, 170, 190, 0.35)'
    ctx.fillStyle = 'rgba(120, 170, 190, 0.45)'
    ctx.lineWidth = 2
    const traces: [number, number][][] = [
      [[40, 60], [180, 60], [220, 100], [220, 200]],
      [[300, 40], [300, 140], [380, 220], [470, 220]],
      [[60, 300], [160, 300], [200, 340], [200, 460]],
      [[330, 330], [450, 330], [450, 420]],
      [[100, 140], [100, 230], [140, 270]],
    ]
    for (const trace of traces) {
      ctx.beginPath()
      trace.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
      ctx.stroke()
      for (const [x, y] of [trace[0], trace[trace.length - 1]]) {
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // A strip of perforations near the bottom of each panel.
    ctx.fillStyle = 'rgba(70, 90, 100, 0.45)'
    for (let x = 40; x < SIZE - 30; x += 14) {
      for (const y of [SIZE - 60, SIZE - 46]) {
        ctx.beginPath()
        ctx.arc(x, y, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // Seams between panels (all four edges, so neighbouring panels share them).
    ctx.fillStyle = '#9aa7b0'
    ctx.fillRect(0, 0, SIZE, 3)
    ctx.fillRect(0, 0, 3, SIZE)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillRect(3, 3, SIZE, 2)
    ctx.fillRect(3, 3, 2, SIZE)
  },
  // CMCN 4 ceiling: square white panels in a slim dark grid, with a narrow light slot
  // across every other panel (the slots look lit; the real light comes from the room).
  'tech-ceiling': (ctx) => {
    ctx.fillStyle = '#d9dfe3'
    ctx.fillRect(0, 0, SIZE, SIZE)
    const half = SIZE / 2
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const x = i * half
        const y = j * half
        const g = ctx.createRadialGradient(x + half / 2, y + half / 2, 10, x + half / 2, y + half / 2, half * 0.7)
        g.addColorStop(0, '#eef2f4')
        g.addColorStop(1, '#cfd6db')
        ctx.fillStyle = g
        ctx.fillRect(x, y, half, half)
        if ((i + j) % 2 === 0) {
          ctx.fillStyle = '#f4fdff'
          ctx.fillRect(x + half * 0.15, y + half * 0.46, half * 0.7, half * 0.08)
          ctx.fillStyle = 'rgba(95, 227, 242, 0.55)'
          ctx.fillRect(x + half * 0.15, y + half * 0.46, half * 0.7, 2)
          ctx.fillRect(x + half * 0.15, y + half * 0.54 - 2, half * 0.7, 2)
        }
      }
    }
    ctx.fillStyle = '#5c6870'
    for (const p of [0, half]) {
      ctx.fillRect(p, 0, 4, SIZE)
      ctx.fillRect(0, p, SIZE, 4)
    }
  },
}

const cache = new Map<PaintedName, CanvasTexture>()

// The shared painted picture (copy it with repeated() before changing its repeat).
export function paintedTexture(name: PaintedName): CanvasTexture {
  let texture = cache.get(name)
  if (!texture) {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (ctx) PAINTERS[name](ctx)
    texture = new CanvasTexture(canvas)
    cache.set(name, texture)
  }
  return texture
}
