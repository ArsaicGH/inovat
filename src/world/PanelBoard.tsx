import { useEffect, useMemo } from 'react'
import { useContent } from '../content/use-content'
import { useThree } from '@react-three/fiber'
import { CanvasTexture, DoubleSide, MeshBasicMaterial, SRGBColorSpace } from 'three'
import { BOARD_FRAME, type BoardTheme } from './style'
import { drawWrappedText, paintFont, useFontsReady } from './fonts'

// A text board in the 3D world that is readable as you walk past: title, summary, full
// text and source, painted onto a picture (canvas texture). Pressing E enlarges it on screen.
// Its look (frame, paper, colours) follows the room's board theme (style.ts).

const PIXELS_PER_METRE = 512 // sharp enough to read from a couple of metres away
const FRAME = BOARD_FRAME // frame width (metres)

interface PanelBoardProps {
  exhibitId: string
  width: number // metres, including the frame
  height: number
  aimed: boolean
  theme: BoardTheme
}

// The background of the paper, before the text.
function paintPaper(ctx: CanvasRenderingContext2D, theme: BoardTheme, w: number, h: number) {
  const { look } = theme
  if (look === 'hologram') {
    // See-through glass: faint tint, a thin glowing border and corner brackets.
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = theme.paper
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = theme.rule
    ctx.lineWidth = w * 0.006
    ctx.strokeRect(w * 0.02, w * 0.02, w - w * 0.04, h - w * 0.04)
    const c = w * 0.09
    ctx.lineWidth = w * 0.014
    for (const [x, y, dx, dy] of [
      [w * 0.035, w * 0.035, 1, 1],
      [w - w * 0.035, w * 0.035, -1, 1],
      [w * 0.035, h - w * 0.035, 1, -1],
      [w - w * 0.035, h - w * 0.035, -1, -1],
    ]) {
      ctx.beginPath()
      ctx.moveTo(x, y + dy * c)
      ctx.lineTo(x, y)
      ctx.lineTo(x + dx * c, y)
      ctx.stroke()
    }
    return
  }
  ctx.fillStyle = theme.paper
  ctx.fillRect(0, 0, w, h)
  if (look === 'brass') {
    // Aged parchment: darker towards the edges, with a thin double border.
    const age = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
    age.addColorStop(0, 'rgba(110, 70, 30, 0)')
    age.addColorStop(1, 'rgba(110, 70, 30, 0.38)')
    ctx.fillStyle = age
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = theme.rule
    ctx.lineWidth = w * 0.006
    ctx.strokeRect(w * 0.03, w * 0.03, w - w * 0.06, h - w * 0.06)
    ctx.strokeRect(w * 0.045, w * 0.045, w - w * 0.09, h - w * 0.09)
  } else if (look === 'enamel') {
    // Enamel factory sign: a wide navy border band.
    ctx.strokeStyle = theme.title
    ctx.lineWidth = w * 0.025
    ctx.strokeRect(w * 0.03, w * 0.03, w - w * 0.06, h - w * 0.06)
  } else if (look === 'screen') {
    // Old monitor: a faint glow in the middle.
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
    glow.addColorStop(0, 'rgba(60, 140, 80, 0.18)')
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
  }
}

export default function PanelBoard({ exhibitId, width, height, aimed, theme }: PanelBoardProps) {
  const { ui, exhibit } = useContent()
  const fontsReady = useFontsReady()
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy())
  const { look } = theme
  const faceWidth = width - 2 * FRAME
  const faceHeight = height - 2 * FRAME

  const texture = useMemo(() => {
    const text = exhibit(exhibitId)
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
      // Base text size: scales with the board, but no larger than on the invention boards
      // (about 7 cm), so the big wall boards fit their text instead of a few huge lines.
      const unit = Math.min(w / 18, PIXELS_PER_METRE * 0.071)

      paintPaper(ctx, theme, w, h)
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'


      let y = pad
      ctx.fillStyle = theme.title
      ctx.font = `700 ${unit * 1.5}px ${font}`
      y = drawWrappedText(ctx, text.title, pad, y, maxWidth, unit * 1.8, bottom)

      ctx.fillStyle = theme.rule
      ctx.fillRect(pad, y + unit * 0.3, maxWidth * 0.3, unit * 0.12)
      y += unit * 1.1

      // Facts (person, year...), the short text, then the sources (the long text is on the
      // enlarged board). If something does not fit, end with "…".
      const sources = text.sources.length
        ? text.sources.map((source) => source.name).filter((name, i, all) => all.indexOf(name) === i).join('; ')
        : text.placeholder
          ? ui.infoPanel.sourcesPlaceholder
          : ''
      // (Only who and when here; the field is on the enlarged board, to leave room for the text.)
      const facts = text.facts.slice(0, 2)
      const parts: [string, string, string, number][] = [
        ...facts.map((fact): [string, string, string, number] => [fact, `500 ${unit * 0.72}px ${font}`, theme.muted, 1.15]),
        // (Line breaks in the text start new lines: the team board, one member per line.)
        ...text.summary.split('\n').map((line): [string, string, string, number] => [line, `500 ${unit * 0.92}px ${font}`, theme.ink, 1.3]),
        ...(sources ? [[`${ui.infoPanel.sourcesLabel}: ${sources}`, `400 ${unit * 0.72}px ${font}`, theme.muted, 1.2] as [string, string, string, number]] : []),
      ]
      for (const [index, [content, partFont, colour, spacing]] of parts.entries()) {
        if (y < 0) break
        ctx.font = partFont
        ctx.fillStyle = colour
        const next = drawWrappedText(ctx, content, pad, y, maxWidth, unit * spacing, bottom - unit * 1.4)
        if (next < 0) {
          ctx.font = `600 ${unit * 0.8}px ${font}`
          ctx.fillStyle = theme.rule
          ctx.fillText(ui.panelMore, pad, bottom - unit * 1.1)
          y = -1
          break
        }
        // The facts sit close together, with a full gap after the last one.
        y = next + (index < facts.length - 1 ? unit * 0.15 : unit * 0.6)
      }

      if (look === 'screen') {
        // Scan lines over everything, like an old monitor.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
        for (let line = 0; line < h; line += 4) ctx.fillRect(0, line, w, 1.5)
      }
    }
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = maxAnisotropy // stays sharp when seen at an angle
    return tex
  }, [exhibitId, faceWidth, faceHeight, maxAnisotropy, fontsReady, theme, look, ui, exhibit])

  useEffect(() => () => texture.dispose(), [texture])

  // Hologram glass: unlit and brighter than white where the text is, so the bloom makes
  // the letters glow; the faint tint stays below the glow threshold.
  const glass = useMemo(() => {
    if (look !== 'hologram') return null
    return new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: DoubleSide, toneMapped: false })
  }, [look, texture])
  useEffect(() => {
    // (Restrained: a brighter glow made the letters bleed and harder to read.)
    if (glass) glass.color.setScalar(aimed ? 1.7 : 1.3)
  }, [glass, aimed])
  useEffect(() => () => glass?.dispose(), [glass])

  if (glass) {
    const edge = <meshStandardMaterial color={theme.rule} emissive={theme.rule} emissiveIntensity={aimed ? 2.6 : 1.4} toneMapped={false} />
    return (
      <group>
        <mesh material={glass}>
          <planeGeometry args={[width, height]} />
        </mesh>
        {/* Thin glowing edges along the top and bottom. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, (s * height) / 2, 0]}>
            <boxGeometry args={[width, 0.015, 0.015]} />
            {edge}
          </mesh>
        ))}
      </group>
    )
  }

  const depth = look === 'screen' ? 0.14 : 0.06 // the computer case is deeper
  const frameMaterial = {
    classic: { roughness: 0.6, metalness: 0 },
    brass: { roughness: 0.35, metalness: 0.85 },
    enamel: { roughness: 0.4, metalness: 0.75 },
    screen: { roughness: 0.6, metalness: 0 },
    hologram: { roughness: 0.2, metalness: 0 }, // not used: the hologram has no frame
  }[look]
  // Rivets (brass) or bolts (enamel) in the frame's corners.
  const rivets = look === 'brass' || look === 'enamel'
  return (
    <group>
      {/* Frame; glows faintly while aimed at. */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={theme.frame} {...frameMaterial} emissive={theme.rule} emissiveIntensity={aimed ? 0.5 : 0} />
      </mesh>
      {rivets &&
        [-1, 1].flatMap((sx) =>
          [-1, 1].map((sy) => (
            <mesh key={`${sx}${sy}`} position={[(sx * (width - FRAME)) / 2, (sy * (height - FRAME)) / 2, depth / 2]}>
              <sphereGeometry args={[0.018, 10, 8]} />
              <meshStandardMaterial color={look === 'brass' ? '#e0b56a' : '#c9ced4'} metalness={0.9} roughness={0.3} />
            </mesh>
          )),
        )}
      {/* Paper face, 3 mm in front of the frame (no shared surface, so no flicker). The
          screen is lit from inside, so it glows more. */}
      <mesh position={[0, 0, depth / 2 + 0.003]}>
        <planeGeometry args={[faceWidth, faceHeight]} />
        <meshStandardMaterial
          map={texture}
          roughness={look === 'screen' ? 0.3 : 0.9}
          emissive="#ffffff"
          emissiveMap={texture}
          // Slightly self-lit so text stays readable in the dim rooms without a strong spotlight.
          emissiveIntensity={look === 'screen' ? 0.9 : 0.28}
        />
      </mesh>
    </group>
  )
}
