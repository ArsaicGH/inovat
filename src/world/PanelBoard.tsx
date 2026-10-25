import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { getExhibitText } from '../content/exhibits'
import { ui } from '../content/ui'
import { BOARD_FRAME } from './style'
import { drawWrappedText, paintFont, useFontsReady } from './fonts'

// A text board in the 3D world that is readable as you walk past: title, summary, full
// text and source, painted onto a picture (canvas texture). Pressing E enlarges it on screen.

const PIXELS_PER_METRE = 512 // sharp enough to read from a couple of metres away
const FRAME = BOARD_FRAME // wooden frame width (metres)
const DEPTH = 0.06

interface PanelBoardProps {
  exhibitId: string
  width: number // metres, including the frame
  height: number
  aimed: boolean
}

export default function PanelBoard({ exhibitId, width, height, aimed }: PanelBoardProps) {
  const fontsReady = useFontsReady()
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy())
  const faceWidth = width - 2 * FRAME
  const faceHeight = height - 2 * FRAME

  const texture = useMemo(() => {
    const text = getExhibitText(exhibitId)
    const font = paintFont(fontsReady) // repainted once the museum font has loaded
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(faceWidth * PIXELS_PER_METRE)
    canvas.height = Math.round(faceHeight * PIXELS_PER_METRE)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const w = canvas.width
      const h = canvas.height
      const pad = w * 0.08
      const maxWidth = w - 2 * pad
      const bottom = h - pad
      const unit = w / 18 // base text size, scales with the board

      ctx.fillStyle = '#f2ece0' // cream "paper"
      ctx.fillRect(0, 0, w, h)
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'

      let y = pad
      ctx.fillStyle = '#2b2620'
      ctx.font = `700 ${unit * 1.5}px ${font}`
      y = drawWrappedText(ctx, text.title, pad, y, maxWidth, unit * 1.8, bottom)

      ctx.fillStyle = '#b08a4a'
      ctx.fillRect(pad, y + unit * 0.3, maxWidth * 0.3, unit * 0.12)
      y += unit * 1.1

      // Summary, then body, then source. If something does not fit, end with a hint.
      const parts: [string, string, string][] = [
        [text.summary, `600 ${unit}px ${font}`, '#3a332b'],
        [text.body, `400 ${unit * 0.9}px ${font}`, '#3a332b'],
        [`${ui.infoPanel.sourcesLabel}: ${ui.infoPanel.sourcesPlaceholder}`, `400 ${unit * 0.75}px ${font}`, '#6b6152'],
      ]
      for (const [content, partFont, colour] of parts) {
        if (y < 0) break
        ctx.font = partFont
        ctx.fillStyle = colour
        const next = drawWrappedText(ctx, content, pad, y, maxWidth, unit * 1.35, bottom - unit * 1.4)
        if (next < 0) {
          ctx.font = `600 ${unit * 0.8}px ${font}`
          ctx.fillStyle = '#8a6a2e'
          ctx.fillText(ui.panelMore, pad, bottom - unit * 1.1)
          y = -1
          break
        }
        y = next + unit * 0.6
      }
    }
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = maxAnisotropy // stays sharp when seen at an angle
    return tex
  }, [exhibitId, faceWidth, faceHeight, maxAnisotropy, fontsReady])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group>
      {/* Wooden frame; glows faintly while aimed at. */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, DEPTH]} />
        <meshStandardMaterial color="#4a3423" roughness={0.6} emissive="#c98a3c" emissiveIntensity={aimed ? 0.5 : 0} />
      </mesh>
      {/* Paper face, 3 mm in front of the frame (no shared surface, so no flicker). */}
      <mesh position={[0, 0, DEPTH / 2 + 0.003]}>
        <planeGeometry args={[faceWidth, faceHeight]} />
        <meshStandardMaterial map={texture} roughness={0.9} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.18} />
      </mesh>
    </group>
  )
}
