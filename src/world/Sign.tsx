import { useEffect, useMemo, type Ref } from 'react'
import { CanvasTexture, SRGBColorSpace, type MeshStandardMaterial } from 'three'
import { paintFont, useFontsReady } from './fonts'

// A sign board with text, e.g. the room name above a door. The text is painted onto a
// picture (a "canvas texture") with the museum font (Be Vietnam Pro).

interface SignProps {
  title: string
  subtitle?: string
  width: number // metres
  height: number
  // Only the letters on a see-through background (laid over a blank sign to fade them in).
  textOnly?: boolean
  materialRef?: Ref<MeshStandardMaterial>
}

const PIXELS_PER_METRE = 256

export default function Sign({ title, subtitle, width, height, textOnly = false, materialRef }: SignProps) {
  const fontsReady = useFontsReady()
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * PIXELS_PER_METRE)
    canvas.height = Math.round(height * PIXELS_PER_METRE)
    const ctx = canvas.getContext('2d')
    if (ctx && !textOnly) {
      ctx.fillStyle = '#2b2620'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#c9a25a'
      ctx.lineWidth = canvas.height * 0.05
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, canvas.width - 2 * ctx.lineWidth, canvas.height - 2 * ctx.lineWidth)
    }
    if (ctx) {
      ctx.fillStyle = '#f3e7cf'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const font = paintFont(fontsReady)
      const titleSize = canvas.height * (subtitle ? 0.36 : 0.45)
      ctx.font = `600 ${titleSize}px ${font}`
      ctx.fillText(title, canvas.width / 2, canvas.height * (subtitle ? 0.4 : 0.52), canvas.width * 0.9)
      if (subtitle) {
        ctx.font = `400 ${canvas.height * 0.17}px ${font}`
        ctx.fillText(subtitle, canvas.width / 2, canvas.height * 0.73, canvas.width * 0.9)
      }
    }
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    return tex
  }, [title, subtitle, width, height, textOnly, fontsReady])

  // Free the picture's memory when the sign disappears.
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      {/* Slightly self-lit so the text stays readable in dim rooms. */}
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        emissive="#ffffff"
        emissiveMap={texture}
        emissiveIntensity={0.35}
        transparent={textOnly}
        opacity={textOnly ? 0 : 1}
      />
    </mesh>
  )
}
