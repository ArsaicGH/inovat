import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { CanvasTexture, MeshBasicMaterial, SRGBColorSpace, type Group } from 'three'
import { useContent } from '../content/use-content'
import { gameText } from '../content/game'
import { useMuseumStore } from '../state/useMuseumStore'
import { addAimTarget, removeAimTarget } from './aim-targets'
import { drawWrappedText, paintFont, useFontsReady } from './fonts'
import { SharpText, recordText, type TextRun } from './sharp-text'
import { QUIZ_BOARD } from './layout'

// THE TIME MACHINE CONSOLE on the Game Room's platform: an ivory board in a gilded frame
// showing the game's title, what to do and the four power cores (lit as the visitor passes
// each round), with one button. Aiming at the button and pressing E (or clicking) opens the
// game itself (TimeMachineGame.tsx).
//
// Local coordinates: x across (0 = middle), y up, the board's back at z = 0. They are
// laid out at a large size and the parent (RoomDecor.tsx) scales the whole stand down.

const PX = 256 // canvas pixels per metre

const SCREEN = { y: 2.75, w: 10, h: 2.4 }
const BIG_BUTTON = { x: 0, y: 0.95, w: 3.6, h: 0.9 }
const ERA_COLOURS = ['#e0a050', '#ffd36a', '#6be08b', '#3fd0e0']

// THE BOARD: ivory, in a heavy gilded frame like a painting in a palace (gold moulding, a
// darker outer step, a raised bead and rosettes on the corners).
// (Its size lives in layout.ts as QUIZ_BOARD, because RoomDecor.tsx scales it.)
const DISPLAY = QUIZ_BOARD

// A gilded picture frame around a w x h opening, standing out from the wall.
const FRAME = 0.16 // width of the gold moulding
function GildedFrame({ w, h }: { w: number; h: number }) {
  const gold = <meshStandardMaterial color="#c9a25a" metalness={0.9} roughness={0.28} />
  const deep = <meshStandardMaterial color="#8a6a32" metalness={0.85} roughness={0.4} />
  const ow = w + 2 * FRAME
  const oh = h + 2 * FRAME
  // [x, y, length, horizontal?] for the four sides.
  const sides: [number, number, number, boolean][] = [
    [0, (h + FRAME) / 2, ow, true],
    [0, -(h + FRAME) / 2, ow, true],
    [-(w + FRAME) / 2, 0, h, false],
    [(w + FRAME) / 2, 0, h, false],
  ]
  return (
    <group position={[0, 0, 0.02]}>
      {sides.map(([x, y, len, across], i) => (
        <group key={i} position={[x, y, 0]}>
          {/* Main moulding, a darker outer step and a raised rounded bead. */}
          <mesh position={[0, 0, 0.1]} castShadow>
            <boxGeometry args={across ? [len, FRAME, 0.2] : [FRAME, len, 0.2]} />
            {gold}
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={across ? [len + 0.1, FRAME + 0.1, 0.1] : [FRAME + 0.1, len + 0.1, 0.1]} />
            {deep}
          </mesh>
          <mesh position={[0, 0, 0.2]} rotation={[0, 0, across ? Math.PI / 2 : 0]}>
            <cylinderGeometry args={[0.035, 0.035, len, 10]} />
            {gold}
          </mesh>
        </group>
      ))}
      {/* Rosettes on the corners. */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sy], i) => (
        <group key={i} position={[sx * (ow / 2 - FRAME / 2), sy * (oh / 2 - FRAME / 2), 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.15, 0.06, 20]} />
            {gold}
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.07, 14, 10]} />
            {gold}
          </mesh>
        </group>
      ))}
    </group>
  )
}

function ScreenHardware() {
  const outerW = DISPLAY.w + 2 * DISPLAY.bezel
  const outerH = DISPLAY.h + 2 * DISPLAY.bezel
  return (
    <group position={[0, DISPLAY.y, 0]}>
      <GildedFrame w={outerW} h={outerH} />
      {/* The board itself (ivory on all sides, so it also looks right from behind). */}
      <mesh position={[0, 0, DISPLAY.depth / 2]} castShadow>
        <boxGeometry args={[outerW, outerH, DISPLAY.depth]} />
        <meshStandardMaterial color="#e6ddcc" roughness={0.65} />
      </mesh>
    </group>
  )
}

type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number, font: string) => void

// A flat picture on the wall, repainted whenever `key` changes (state, language, aim...).
function Panel({ width, height, paint, paintKey, glow = 0.86 }: { width: number; height: number; paint: Paint; paintKey: string; glow?: number }) {
  const fontsReady = useFontsReady()
  // (Its letters are drawn sharp over it: sharp-text.tsx.)
  const { texture, runs, pixels } = useMemo(() => {
    const runs: TextRun[] = []
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * PX)
    canvas.height = Math.round(height * PX)
    const ctx = canvas.getContext('2d')
    if (ctx) recordText(ctx, runs)
    if (ctx) paint(ctx, canvas.width, canvas.height, paintFont(fontsReady))
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    return { texture: tex, runs, pixels: [canvas.width, canvas.height] as const }
    // paintKey describes everything the picture depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paintKey, width, height, fontsReady])
  useEffect(() => () => texture.dispose(), [texture])
  // Unlit so it reads like a lit screen in any lighting.
  const material = useMemo(() => new MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false }), [texture])
  useEffect(() => {
    material.color.setScalar(glow)
  }, [material, glow])
  useEffect(() => () => material.dispose(), [material])
  return (
    <group>
      <mesh material={material}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <SharpText runs={runs} pixels={pixels} face={[width, height]} z={0.002} shading={{ lit: false, glow }} />
    </group>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

// Ivory card with a gold border (the white-and-gold look of the hall and the rotunda).
const INK = '#2e261d' // main text
const GOLD_INK = '#9a7330' // titles and labels: a darker gold that reads on ivory
function paintGlass(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = h * 0.12
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, 'rgba(252, 248, 238, 0.98)')
  bg.addColorStop(1, 'rgba(240, 230, 210, 0.98)')
  roundRect(ctx, 2, 2, w - 4, h - 4, r)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.lineWidth = Math.max(3, h * 0.02)
  ctx.strokeStyle = '#c9a25a'
  ctx.stroke()
}

// A scratch canvas to try text sizes on without drawing them on the real picture.
let probe: CanvasRenderingContext2D | null = null

// Draw wrapped text, shrinking it until it fits the space (long questions or answers).
function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, size: number, weight: number, font: string, maxY: number) {
  probe ??= document.createElement('canvas').getContext('2d')
  let s = size
  for (; s > size * 0.45 && probe; s *= 0.9) {
    probe.font = `${weight} ${s}px ${font}`
    if (drawWrappedText(probe, text, x, y, maxWidth, s * 1.25, maxY) >= 0) break
  }
  ctx.font = `${weight} ${s}px ${font}`
  return drawWrappedText(ctx, text, x, y, maxWidth, s * 1.25, maxY)
}

// One tile on the wall that the crosshair can aim at.
function Target({ id, x, y, children }: { id: string; x: number; y: number; children: ReactNode }) {
  return (
    <group position={[x, y, 0.04]} userData={{ exhibitId: id }}>
      {children}
    </group>
  )
}

export default function QuizWall() {
  const { language } = useContent()
  const g = gameText[language]
  const group = useRef<Group>(null)
  const aimed = useMuseumStore((state) => state.aimedExhibitId)
  const cores = useMuseumStore((state) => state.gameCores)

  useEffect(() => {
    const wall = group.current
    if (!wall) return
    addAimTarget(wall)
    return () => removeAimTarget(wall)
  }, [])

  // ---- The big screen: title, what to do, and the four power cores ----
  const screenKey = `${language}|${cores}`
  const paintScreen: Paint = (ctx, w, h, font) => {
    paintGlass(ctx, w, h)
    const pad = h * 0.1
    ctx.textBaseline = 'top'
    ctx.textAlign = 'center'
    ctx.fillStyle = GOLD_INK
    ctx.font = `700 ${h * 0.16}px ${font}`
    ctx.fillText(g.title, w / 2, pad, w - 2 * pad)
    ctx.textAlign = 'left'
    ctx.fillStyle = INK
    fitText(ctx, cores >= 4 ? g.consoleDone : g.consoleIntro, pad * 2.4, pad + h * 0.24, w - 4.8 * pad, h * 0.085, 500, font, h * 0.62)
    // The four cores: dark until lit, then glowing in their era's colour.
    for (let i = 0; i < 4; i++) {
      const cx = w / 2 + (i - 1.5) * h * 0.34
      const cy = h * 0.8
      const lit = i < cores
      ctx.beginPath()
      ctx.arc(cx, cy, h * 0.1, 0, Math.PI * 2)
      ctx.fillStyle = lit ? ERA_COLOURS[i] : '#d8d0c0'
      ctx.shadowColor = ERA_COLOURS[i]
      ctx.shadowBlur = lit ? h * 0.08 : 0
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.lineWidth = h * 0.012
      ctx.strokeStyle = '#9a7330'
      ctx.stroke()
      ctx.fillStyle = lit ? '#2b2620' : '#9a9186'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `700 ${h * 0.07}px ${font}`
      ctx.fillText(['I', 'II', 'III', 'IV'][i], cx, cy + h * 0.005)
      ctx.textBaseline = 'top'
    }
  }

  // ---- Gold button ----
  const paintButton = (label: string, isAimed: boolean): Paint => (ctx, w, h, font) => {
    roundRect(ctx, 3, 3, w - 6, h - 6, h / 2 - 3)
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, isAimed ? '#fff0c2' : '#e8c77e')
    grad.addColorStop(1, isAimed ? '#d9a650' : '#b8893d')
    ctx.fillStyle = grad
    ctx.fill()
    ctx.fillStyle = '#2b2620'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${h * 0.34}px ${font}`
    ctx.fillText(label, w / 2, h / 2 + h * 0.02, w * 0.9)
  }

  // (Once all four cores are lit, the button stays to replay any core for more stars.)
  const label = cores === 0 ? g.consoleStart : cores < 4 ? g.consoleContinue : g.consoleReplay
  const isAimed = aimed === 'quiz-start'
  return (
    <group>
      <ScreenHardware />
      {/* Everything shown sits just in front of the display's glass. */}
      <group ref={group} position={[0, 0, DISPLAY.depth]}>
        <group position={[0, SCREEN.y, 0.03]}>
          <Panel width={SCREEN.w} height={SCREEN.h} paint={paintScreen} paintKey={screenKey} />
        </group>
        <Target id="quiz-start" x={BIG_BUTTON.x} y={BIG_BUTTON.y}>
          <Panel
            width={BIG_BUTTON.w}
            height={BIG_BUTTON.h}
            paint={paintButton(label, isAimed)}
            paintKey={`${label}|${isAimed}`}
            glow={isAimed ? 1 : 0.86}
          />
        </Target>
      </group>
    </group>
  )
}
