import { useEffect, useMemo } from 'react'
import { CanvasTexture, MeshBasicMaterial, SRGBColorSpace } from 'three'
import type { RoomId } from '../types'
import { paintFont, useFontsReady } from './fonts'

// THE ERA NUMBER on each era room's back wall: a huge 1, 2, 3 or 4 with no background,
// only the number itself, decorated in the style of its revolution (painted on a
// see-through picture, so only the number shows on the wall).
// 1 = cast brass numeral with an engraved line and rivets       (steam and machines)
// 2 = cream enamel numeral in a red rim, lined with light bulbs  (electricity)
// 3 = glowing green pixel numeral with scan lines                (computers)
// 4 = glowing cyan outline numeral with circuit traces inside    (digital)

const SIZE = 3.4 // metres (square)
const PIXELS = 768 // sharp enough at this size, at a quarter of the memory of 1024 x 1024

type EraRoom = Extract<RoomId, 'ir1' | 'ir2' | 'ir3' | 'ir4'>

// 5 x 7 pixel shape of the number 3 (CMCN 3's computer screen).
const PIXEL_THREE = ['11110', '00001', '00001', '01110', '00001', '00001', '11110']

// Small dots along the inside of the numeral's outline: rivets (1) or light bulbs (2).
// Drawn by testing points of a grid against the numeral's own pixels, so they follow
// any font.
function dotsInside(ctx: CanvasRenderingContext2D, s: number, step: number, inset: number, draw: (x: number, y: number) => void) {
  const data = ctx.getImageData(0, 0, s, s).data
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < s && y < s && data[(Math.round(y) * s + Math.round(x)) * 4 + 3] > 128
  for (let y = step / 2; y < s; y += step) {
    for (let x = step / 2; x < s; x += step) {
      // Inside the numeral, and near its edge (some point a little further out is empty).
      if (!solid(x, y)) continue
      const nearEdge = !solid(x + inset, y) || !solid(x - inset, y) || !solid(x, y + inset) || !solid(x, y - inset)
      const tooClose = !solid(x + inset * 0.5, y) || !solid(x - inset * 0.5, y) || !solid(x, y + inset * 0.5) || !solid(x, y - inset * 0.5)
      if (nearEdge && !tooClose) draw(x, y)
    }
  }
}

function paint(ctx: CanvasRenderingContext2D, era: EraRoom, font: string) {
  const s = PIXELS
  const c = s / 2
  const y = c + s * 0.04 // the font's numbers sit a little high
  ctx.clearRect(0, 0, s, s)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (era === 'ir1') {
    // Cast brass: a dark iron edge, a brass gradient, an engraved inner line and rivets.
    ctx.font = `800 ${s * 0.95}px ${font}`
    ctx.fillStyle = '#000'
    ctx.fillText('1', c, y)
    ctx.globalCompositeOperation = 'source-in' // keep everything below inside the numeral
    const brass = ctx.createLinearGradient(0, s * 0.1, s * 0.3, s * 0.9)
    brass.addColorStop(0, '#fbe3a6')
    brass.addColorStop(0.45, '#b8843d')
    brass.addColorStop(0.55, '#8a5f28')
    brass.addColorStop(1, '#e9c47c')
    ctx.fillStyle = brass
    ctx.fillRect(0, 0, s, s)
    ctx.globalCompositeOperation = 'source-over'
    ctx.lineWidth = s * 0.018
    ctx.strokeStyle = '#2a1f15'
    ctx.strokeText('1', c, y)
    dotsInside(ctx, s, s * 0.06, s * 0.045, (x, py) => {
      ctx.fillStyle = '#5b3d1c'
      ctx.beginPath()
      ctx.arc(x, py, s * 0.011, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffe7b0'
      ctx.beginPath()
      ctx.arc(x - s * 0.003, py - s * 0.003, s * 0.005, 0, Math.PI * 2)
      ctx.fill()
    })
  } else if (era === 'ir2') {
    // A theatre-marquee number: cream enamel in a thick red rim, lined with warm bulbs.
    ctx.font = `800 ${s * 0.95}px ${font}`
    ctx.lineJoin = 'round'
    ctx.lineWidth = s * 0.05
    ctx.strokeStyle = '#b23a2a'
    ctx.strokeText('2', c, y)
    ctx.fillStyle = '#f4ecd6'
    ctx.fillText('2', c, y)
    dotsInside(ctx, s, s * 0.055, s * 0.05, (x, py) => {
      ctx.fillStyle = '#ffd36a'
      ctx.shadowColor = '#ffb030'
      ctx.shadowBlur = s * 0.015
      ctx.beginPath()
      ctx.arc(x, py, s * 0.014, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })
  } else if (era === 'ir3') {
    // Big green pixels with a soft glow and old-monitor scan lines (no screen around it).
    const px = s * 0.13
    const left = c - (5 * px) / 2
    const top = c - (7 * px) / 2
    ctx.fillStyle = '#6be08b'
    ctx.shadowColor = '#6be08b'
    ctx.shadowBlur = s * 0.04
    PIXEL_THREE.forEach((row, py) =>
      [...row].forEach((on, x) => {
        if (on === '1') ctx.fillRect(left + x * px + 3, top + py * px + 3, px - 6, px - 6)
      }),
    )
    ctx.shadowBlur = 0
    ctx.globalCompositeOperation = 'source-atop' // scan lines only on the pixels
    ctx.fillStyle = 'rgba(0, 40, 10, 0.35)'
    for (let line = 0; line < s; line += 6) ctx.fillRect(0, line, s, 2)
    ctx.globalCompositeOperation = 'source-over'
  } else {
    // A glowing cyan outline with faint circuit traces running inside the numeral.
    ctx.font = `800 ${s * 0.95}px ${font}`
    ctx.fillStyle = 'rgba(63, 208, 224, 0.16)'
    ctx.fillText('4', c, y)
    ctx.globalCompositeOperation = 'source-atop'
    ctx.strokeStyle = 'rgba(191, 246, 255, 0.55)'
    ctx.lineWidth = s * 0.006
    for (let i = 0; i < 9; i++) {
      const ty = s * (0.12 + i * 0.09)
      ctx.beginPath()
      ctx.moveTo(0, ty)
      ctx.lineTo(s * (0.3 + (i % 3) * 0.12), ty)
      ctx.lineTo(s * (0.38 + (i % 3) * 0.12), ty + s * 0.05)
      ctx.lineTo(s, ty + s * 0.05)
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.shadowColor = '#3fd0e0'
    ctx.shadowBlur = s * 0.03
    ctx.lineWidth = s * 0.016
    ctx.strokeStyle = '#bff6ff'
    ctx.strokeText('4', c, y)
    ctx.shadowBlur = 0
  }
}

export default function EraNumeral({ era }: { era: EraRoom }) {
  const fontsReady = useFontsReady()
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = PIXELS
    const ctx = canvas.getContext('2d')
    if (ctx) paint(ctx, era, paintFont(fontsReady))
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    return tex
  }, [era, fontsReady])
  useEffect(() => () => texture.dispose(), [texture])

  // Unlit, so the colours stay as painted, and brighter than white so the bloom makes the
  // number glow (CMCN 4's most, CMCN 1's brass least).
  const material = useMemo(() => {
    const m = new MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false })
    m.color.setScalar(era === 'ir4' ? 2 : era === 'ir1' ? 1.1 : 1.4)
    return m
  }, [texture, era])
  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh material={material}>
      <planeGeometry args={[SIZE, SIZE]} />
    </mesh>
  )
}
