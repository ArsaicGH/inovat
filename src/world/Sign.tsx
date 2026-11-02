import { useEffect, useMemo, type Ref } from 'react'
import { CanvasTexture, SRGBColorSpace, type MeshStandardMaterial } from 'three'
import { paintFont, useFontsReady } from './fonts'
import { SharpText, recordText, type TextRun } from './sharp-text'

// A sign board with text, e.g. the room name above a door. The board is painted onto a
// picture (a "canvas texture"); its letters, in the museum font (Be Vietnam Pro), are drawn
// sharp over it (sharp-text.tsx). (The fading letters of the intro hall's title, textOnly,
// stay painted: they fade in with their picture.)

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
// How the sharp letters are lit, like the sign below.
const SIGN_TEXT = { lit: true, glow: 0.35, roughness: 1 }

export default function Sign({ title, subtitle, width, height, textOnly = false, materialRef }: SignProps) {
  const fontsReady = useFontsReady()
  const { texture, runs, pixels } = useMemo(() => {
    const runs: TextRun[] = []
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * PIXELS_PER_METRE)
    canvas.height = Math.round(height * PIXELS_PER_METRE)
    const ctx = canvas.getContext('2d')
    if (ctx && !textOnly) recordText(ctx, runs)
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
    return { texture: tex, runs, pixels: [canvas.width, canvas.height] as const }
  }, [title, subtitle, width, height, textOnly, fontsReady])

  // Free the picture's memory when the sign disappears.
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group>
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
      {runs.length > 0 && <SharpText runs={runs} pixels={pixels} face={[width, height]} z={0.002} shading={SIGN_TEXT} />}
    </group>
  )
}
