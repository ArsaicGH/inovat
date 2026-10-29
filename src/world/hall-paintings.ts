import { CanvasTexture, SRGBColorSpace } from 'three'

// THE CENTRAL HALL'S SIX PANELS: deep red damask hangings, each with a gold emblem in the
// style of the dome above (dome-painting.ts): the four eras (gear, lightning, computer
// chip, network) and two for the museum itself (a laurel wreath, and four linked rings,
// one journey through four revolutions). Painted once in code; no text, no download.

const GOLD = '#c9a25a'
const GOLD_LIGHT = '#e8c77e'

type Draw = (c: CanvasRenderingContext2D, r: number) => void

const EMBLEMS: Draw[] = [
  // A gear (steam and machines).
  (c, r) => {
    c.beginPath()
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2
      const rr = i % 2 ? r * 0.78 : r
      c.lineTo(Math.cos(a - 0.12) * rr, Math.sin(a - 0.12) * rr)
      c.lineTo(Math.cos(a + 0.12) * rr, Math.sin(a + 0.12) * rr)
    }
    c.closePath()
    c.fill()
    c.globalCompositeOperation = 'destination-out'
    c.beginPath()
    c.arc(0, 0, r * 0.32, 0, Math.PI * 2)
    c.fill()
    c.globalCompositeOperation = 'source-over'
  },
  // A lightning bolt (electricity).
  (c, r) => {
    c.beginPath()
    for (const [x, y] of [[0.15, -1], [-0.45, 0.1], [-0.02, 0.1], [-0.2, 1], [0.45, -0.15], [0.03, -0.15], [0.25, -1]]) c.lineTo(x * r, y * r)
    c.closePath()
    c.fill()
  },
  // A microchip with its legs (computers).
  (c, r) => {
    const s = r * 0.62
    c.fillRect(-s, -s, s * 2, s * 2)
    for (let i = 0; i < 5; i++) {
      const p = -s + (i + 0.5) * ((s * 2) / 5) - r * 0.05
      c.fillRect(p, -r, r * 0.1, r * 0.3)
      c.fillRect(p, r * 0.7, r * 0.1, r * 0.3)
      c.fillRect(-r, p, r * 0.3, r * 0.1)
      c.fillRect(r * 0.7, p, r * 0.3, r * 0.1)
    }
    c.fillStyle = '#5c1f27'
    c.fillRect(-s * 0.55, -s * 0.55, s * 1.1, s * 1.1)
  },
  // A network of connected nodes (digital and connected).
  (c, r) => {
    const nodes = [[0, 0], [0, -0.85], [0.8, -0.3], [0.55, 0.7], [-0.55, 0.7], [-0.8, -0.3]].map(([x, y]) => [x * r, y * r])
    c.lineWidth = r * 0.07
    for (let i = 1; i < nodes.length; i++) {
      for (const j of [0, (i % 5) + 1]) {
        c.beginPath()
        c.moveTo(nodes[i][0], nodes[i][1])
        c.lineTo(nodes[j][0], nodes[j][1])
        c.stroke()
      }
    }
    nodes.forEach(([x, y], i) => {
      c.beginPath()
      c.arc(x, y, r * (i ? 0.13 : 0.2), 0, Math.PI * 2)
      c.fill()
    })
  },
  // A laurel wreath (the museum).
  (c, r) => {
    c.lineWidth = r * 0.05
    for (const side of [-1, 1]) {
      c.beginPath()
      c.arc(0, 0, r * 0.8, Math.PI / 2 + side * 0.25, Math.PI / 2 + side * 2.6, side < 0)
      c.stroke()
      for (let i = 0; i < 9; i++) {
        const a = Math.PI / 2 + side * (0.45 + i * 0.25)
        c.save()
        c.translate(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8)
        c.rotate(a + side * 0.6)
        c.beginPath()
        c.ellipse(0, 0, r * 0.2, r * 0.07, 0, 0, Math.PI * 2)
        c.fill()
        c.restore()
      }
    }
    c.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2
      const rr = i % 2 ? r * 0.16 : r * 0.38
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
    }
    c.closePath()
    c.fill()
  },
  // Four linked rings: one journey through four revolutions.
  (c, r) => {
    c.lineWidth = r * 0.08
    for (let i = 0; i < 4; i++) {
      c.beginPath()
      c.arc((i - 1.5) * r * 0.5, (i % 2 ? 0.18 : -0.18) * r, r * 0.32, 0, Math.PI * 2)
      c.stroke()
    }
  },
]

export function paintHallPanel(index: number, aspect: number): CanvasTexture {
  const w = 512
  const h = Math.round(w / aspect)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const c = canvas.getContext('2d')!
  // Deep red fabric, lighter in the middle, with a faint damask pattern of small diamonds.
  const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
  g.addColorStop(0, '#7a2a33')
  g.addColorStop(1, '#3e1218')
  c.fillStyle = g
  c.fillRect(0, 0, w, h)
  c.fillStyle = 'rgba(232, 199, 126, 0.07)'
  for (let y = 16; y < h; y += 32)
    for (let x = (y / 32) % 2 ? 16 : 0; x < w; x += 32) {
      c.beginPath()
      c.moveTo(x, y - 7)
      c.lineTo(x + 7, y)
      c.lineTo(x, y + 7)
      c.lineTo(x - 7, y)
      c.fill()
    }
  // A thin inner gold border with corner diamonds.
  const m = w * 0.06
  c.strokeStyle = GOLD
  c.lineWidth = 3
  c.strokeRect(m, m, w - 2 * m, h - 2 * m)
  c.lineWidth = 1.5
  c.strokeRect(m + 8, m + 8, w - 2 * m - 16, h - 2 * m - 16)
  c.fillStyle = GOLD_LIGHT
  for (const [x, y] of [[m, m], [w - m, m], [m, h - m], [w - m, h - m]]) {
    c.beginPath()
    c.moveTo(x, y - 9)
    c.lineTo(x + 9, y)
    c.lineTo(x, y + 9)
    c.lineTo(x - 9, y)
    c.fill()
  }
  // The emblem in a gold medallion ring, in the middle.
  const r = Math.min(w, h) * 0.24
  c.save()
  c.translate(w / 2, h / 2)
  c.strokeStyle = GOLD
  c.lineWidth = 4
  c.beginPath()
  c.arc(0, 0, r * 1.45, 0, Math.PI * 2)
  c.stroke()
  const fill = c.createLinearGradient(0, -r, 0, r)
  fill.addColorStop(0, '#f6e2a8')
  fill.addColorStop(0.5, GOLD)
  fill.addColorStop(1, '#a87a3a')
  c.fillStyle = fill
  c.strokeStyle = fill
  c.shadowColor = 'rgba(0, 0, 0, 0.45)'
  c.shadowBlur = 8
  c.shadowOffsetY = 3
  EMBLEMS[index % EMBLEMS.length](c, r)
  c.restore()
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
