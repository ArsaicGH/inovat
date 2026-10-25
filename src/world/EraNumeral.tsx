import { useEffect, useMemo } from 'react'
import { CanvasTexture, MeshBasicMaterial, SRGBColorSpace } from 'three'
import type { RoomId } from '../types'
import { paintFont, useFontsReady } from './fonts'

// THE ERA NUMBER above each era room's overview board: a huge 1, 2, 3 or 4, decorated in
// the style of its revolution (painted on a see-through picture, so only the decoration
// shows on the wall).
// 1 = brass numeral on an iron cogwheel        (steam and machines)
// 2 = white numeral on a navy enamel badge ringed with light bulbs (electricity)
// 3 = green pixel numeral on an old computer screen   (computers)
// 4 = glowing cyan outline numeral in a circuit ring  (digital)

const SIZE = 1.6 // metres (square)
const PIXELS = 512

type EraRoom = Extract<RoomId, 'ir1' | 'ir2' | 'ir3' | 'ir4'>

// 5 x 7 pixel shape of the number 3 (CMCN 3's computer screen).
const PIXEL_THREE = ['11110', '00001', '00001', '01110', '00001', '00001', '11110']

function paintGear(ctx: CanvasRenderingContext2D, c: number, r: number) {
  ctx.fillStyle = '#2f2823'
  for (let i = 0; i < 14; i++) {
    ctx.save()
    ctx.translate(c, c)
    ctx.rotate((i / 14) * Math.PI * 2)
    ctx.fillRect(-r * 0.12, -r * 1.12, r * 0.24, r * 0.3)
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(c, c, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#a87a3a'
  ctx.lineWidth = r * 0.05
  ctx.beginPath()
  ctx.arc(c, c, r * 0.86, 0, Math.PI * 2)
  ctx.stroke()
  // Rivets around the rim.
  ctx.fillStyle = '#d9ad66'
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(c + Math.cos(a) * r * 0.93, c + Math.sin(a) * r * 0.93, r * 0.025, 0, Math.PI * 2)
    ctx.fill()
  }
}

function paint(ctx: CanvasRenderingContext2D, era: EraRoom, font: string) {
  const s = PIXELS
  const c = s / 2
  ctx.clearRect(0, 0, s, s)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (era === 'ir1') {
    paintGear(ctx, c, s * 0.4)
    const brass = ctx.createLinearGradient(0, s * 0.2, 0, s * 0.8)
    brass.addColorStop(0, '#f6d999')
    brass.addColorStop(0.5, '#b8843d')
    brass.addColorStop(1, '#e9c47c')
    ctx.font = `700 ${s * 0.55}px ${font}`
    ctx.lineWidth = s * 0.02
    ctx.strokeStyle = '#1e1813'
    ctx.strokeText('1', c, c + s * 0.03)
    ctx.fillStyle = brass
    ctx.fillText('1', c, c + s * 0.03)
  } else if (era === 'ir2') {
    // Navy enamel badge with a red ring and a ring of light bulbs.
    ctx.fillStyle = '#b23a2a'
    ctx.beginPath()
    ctx.arc(c, c, s * 0.42, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1d2b3a'
    ctx.beginPath()
    ctx.arc(c, c, s * 0.37, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffe2a0'
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(c + Math.cos(a) * s * 0.395, c + Math.sin(a) * s * 0.395, s * 0.014, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.font = `700 ${s * 0.5}px ${font}`
    ctx.fillStyle = '#f4f2ea'
    ctx.fillText('2', c, c + s * 0.03)
    // Small lightning bolt under the numeral.
    ctx.fillStyle = '#f5b13f'
    ctx.beginPath()
    const b = s * 0.06
    ctx.moveTo(c + b * 0.3, c + s * 0.22)
    ctx.lineTo(c - b * 0.6, c + s * 0.3)
    ctx.lineTo(c, c + s * 0.3)
    ctx.lineTo(c - b * 0.3, c + s * 0.38)
    ctx.lineTo(c + b * 0.6, c + s * 0.29)
    ctx.lineTo(c, c + s * 0.29)
    ctx.closePath()
    ctx.fill()
  } else if (era === 'ir3') {
    // Beige monitor case with a dark screen and a green pixel "3".
    ctx.fillStyle = '#d9cdb0'
    ctx.beginPath()
    ctx.roundRect(s * 0.1, s * 0.1, s * 0.8, s * 0.74, s * 0.05)
    ctx.fill()
    ctx.fillStyle = '#0e1a12'
    ctx.beginPath()
    ctx.roundRect(s * 0.17, s * 0.16, s * 0.66, s * 0.56, s * 0.03)
    ctx.fill()
    const px = s * 0.06
    const left = c - (5 * px) / 2
    const top = s * 0.44 - (7 * px) / 2
    ctx.fillStyle = '#6be08b'
    ctx.shadowColor = '#6be08b'
    ctx.shadowBlur = s * 0.03
    PIXEL_THREE.forEach((row, y) =>
      [...row].forEach((on, x) => {
        if (on === '1') ctx.fillRect(left + x * px + 1, top + y * px + 1, px - 2, px - 2)
      }),
    )
    ctx.shadowBlur = 0
    // Scan lines and the case's little stand.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    for (let y = s * 0.16; y < s * 0.72; y += 4) ctx.fillRect(s * 0.17, y, s * 0.66, 1.5)
    ctx.fillStyle = '#b9ad90'
    ctx.fillRect(s * 0.4, s * 0.84, s * 0.2, s * 0.05)
  } else {
    // Glowing outline "4" inside a ring with circuit lines.
    ctx.strokeStyle = '#3fd0e0'
    ctx.lineWidth = s * 0.012
    ctx.beginPath()
    ctx.arc(c, c, s * 0.4, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8
      const x1 = c + Math.cos(a) * s * 0.4
      const y1 = c + Math.sin(a) * s * 0.4
      const x2 = c + Math.cos(a) * s * 0.47
      const y2 = c + Math.sin(a) * s * 0.47
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x2, y2, s * 0.012, 0, Math.PI * 2)
      ctx.fillStyle = '#bff6ff'
      ctx.fill()
    }
    ctx.font = `700 ${s * 0.56}px ${font}`
    ctx.lineWidth = s * 0.014
    ctx.strokeStyle = '#bff6ff'
    ctx.strokeText('4', c, c + s * 0.03)
    ctx.fillStyle = 'rgba(63, 208, 224, 0.18)'
    ctx.fillText('4', c, c + s * 0.03)
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

  // Unlit, so the colours stay as painted; CMCN 4's (and CMCN 3's screen) are brighter
  // than white so the bloom makes them glow.
  const material = useMemo(() => {
    const m = new MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false })
    m.color.setScalar(era === 'ir4' ? 2 : era === 'ir3' ? 1.3 : 0.95)
    return m
  }, [texture, era])
  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh material={material}>
      <planeGeometry args={[SIZE, SIZE]} />
    </mesh>
  )
}
