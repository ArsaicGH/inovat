import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { CanvasTexture, MeshBasicMaterial, SRGBColorSpace, type Group } from 'three'
import { useContent } from '../content/use-content'
import { QUIZ_QUESTIONS } from '../content/quiz'
import { useMuseumStore } from '../state/useMuseumStore'
import { resultLevel, scoreQuiz } from '../state/quiz-score'
import { addAimTarget, removeAimTarget } from './aim-targets'
import { drawWrappedText, paintFont, useFontsReady } from './fonts'
import { QUIZ_COLOURS } from './style'
import { QUIZ_BOARD } from './layout'

// THE QUIZ STAND on the Game Room's platform. Everything is painted onto pictures (canvas
// textures) on an ivory board in a gilded frame: the question, four answer tiles, a
// feedback line and a button. Tiles and buttons carry `userData.exhibitId` ("quiz-answer-2",
// "quiz-next"...), so the crosshair can aim at them and E or a click chooses them
// (Interaction.tsx). The visitor keeps walking the whole time; nothing pops up.
//
// Local coordinates: x across (0 = middle), y up, the board's back at z = 0. They are
// laid out at a large size and the parent (RoomDecor.tsx) scales the whole stand down.

const LETTERS = ['A', 'B', 'C', 'D']
const PX = 256 // canvas pixels per metre

const SCREEN = { y: 3.22, w: 10, h: 1.46 }
const ANSWER = { y: 1.8, w: 2.3, h: 1.02, xs: [-3.6, -1.2, 1.2, 3.6] }
const FEEDBACK = { x: -1.25, y: 0.86, w: 7.5, h: 0.62 }
const SMALL_BUTTON = { x: 3.6, y: 0.86, w: 2.3, h: 0.62 }
const BIG_BUTTON = { x: 0, y: 1.8, w: 3.2, h: 0.9 }

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
        <meshStandardMaterial color="#f3ecdf" roughness={0.45} />
      </mesh>
    </group>
  )
}

type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number, font: string) => void

// A flat picture on the wall, repainted whenever `key` changes (state, language, aim...).
function Panel({ width, height, paint, paintKey, glow = 0.86 }: { width: number; height: number; paint: Paint; paintKey: string; glow?: number }) {
  const fontsReady = useFontsReady()
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * PX)
    canvas.height = Math.round(height * PX)
    const ctx = canvas.getContext('2d')
    if (ctx) paint(ctx, canvas.width, canvas.height, paintFont(fontsReady))
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    return tex
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
    <mesh material={material}>
      <planeGeometry args={[width, height]} />
    </mesh>
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
  const { ui, language } = useContent()
  const group = useRef<Group>(null)
  const stage = useMuseumStore((state) => state.quizStage)
  const index = useMuseumStore((state) => state.quizIndex)
  const answers = useMuseumStore((state) => state.quizAnswers)
  const aimed = useMuseumStore((state) => state.aimedExhibitId)
  const passed = useMuseumStore((state) => state.quizPassed)

  useEffect(() => {
    const wall = group.current
    if (!wall) return
    addAimTarget(wall)
    return () => removeAimTarget(wall)
  }, [])

  const total = QUIZ_QUESTIONS.length
  const question = QUIZ_QUESTIONS[index]
  const text = question.text[language]
  const chosen = stage === 'question' ? (answers[index] ?? null) : null
  const answered = chosen !== null
  const score = scoreQuiz(QUIZ_QUESTIONS, answers)

  // ---- The big screen: intro, question or results ----
  const screenKey = `${language}|${stage}|${index}|${score}|${passed}`
  const paintScreen: Paint = (ctx, w, h, font) => {
    paintGlass(ctx, w, h)
    const pad = h * 0.14
    ctx.textBaseline = 'top'
    if (stage === 'idle') {
      ctx.textAlign = 'center'
      ctx.fillStyle = GOLD_INK
      ctx.font = `700 ${h * 0.26}px ${font}`
      ctx.fillText(ui.quiz.title, w / 2, pad, w - 2 * pad)
      ctx.textAlign = 'left'
      ctx.fillStyle = INK
      fitText(ctx, ui.quiz.intro, pad * 2, pad + h * 0.36, w - 4 * pad, h * 0.13, 400, font, h - pad * 0.6)
    } else if (stage === 'question') {
      ctx.textAlign = 'left'
      ctx.fillStyle = GOLD_INK
      ctx.font = `600 ${h * 0.11}px ${font}`
      ctx.fillText(ui.quiz.progress.replace('{n}', String(index + 1)).replace('{total}', String(total)).toUpperCase(), pad, pad * 0.8)
      // Gold progress bar along the top.
      ctx.fillStyle = 'rgba(201, 162, 90, 0.2)'
      ctx.fillRect(w * 0.3, pad * 0.95, w * 0.62, h * 0.025)
      ctx.fillStyle = '#c9a25a'
      ctx.fillRect(w * 0.3, pad * 0.95, w * 0.62 * ((index + (answered ? 1 : 0)) / total), h * 0.025)
      ctx.fillStyle = INK
      fitText(ctx, text.question, pad, pad + h * 0.2, w - 2 * pad, h * 0.17, 600, font, h - pad * 0.6)
    } else {
      ctx.textAlign = 'center'
      const level = resultLevel(score, total)
      ctx.fillStyle = GOLD_INK
      ctx.font = `700 ${h * 0.18}px ${font}`
      ctx.fillText(ui.quiz.resultsTitle, w / 2, pad * 0.6, w - 2 * pad)
      ctx.font = `700 ${h * 0.28}px ${font}`
      ctx.fillText(`${score}/${total}`, w / 2, pad * 0.6 + h * 0.2)
      ctx.fillStyle = INK
      ctx.font = `400 ${h * 0.1}px ${font}`
      ctx.fillText(ui.quiz.levels[level], w / 2, h * 0.68, w - 2 * pad)
      ctx.fillStyle = GOLD_INK
      ctx.font = `600 ${h * 0.09}px ${font}`
      ctx.fillText(passed ? ui.quiz.doorOpen : ui.quiz.doorLocked, w / 2, h * 0.81, w - 2 * pad)
    }
  }

  // ---- One answer tile ----
  const paintAnswer = (i: number): Paint => (ctx, w, h, font) => {
    const colour = QUIZ_COLOURS[i]
    const isAimed = aimed === `quiz-answer-${i}` && !answered
    const right = answered && i === question.answer
    const wrong = answered && i === chosen
    ctx.globalAlpha = answered && !right && !wrong ? 0.4 : 1
    const r = h * 0.16
    roundRect(ctx, 3, 3, w - 6, h - 6, r)
    ctx.fillStyle = right ? 'rgba(214, 240, 220, 0.98)' : wrong ? 'rgba(246, 216, 212, 0.98)' : isAimed ? 'rgba(248, 232, 190, 0.98)' : 'rgba(252, 248, 238, 0.98)'
    ctx.fill()
    ctx.lineWidth = isAimed || right || wrong ? h * 0.05 : h * 0.025
    ctx.strokeStyle = right ? '#2f9a5c' : wrong ? '#c2453f' : isAimed ? '#b8893d' : colour
    ctx.stroke()
    // Letter badge in the A-D colour.
    const cx = h * 0.42
    ctx.beginPath()
    ctx.arc(cx, h / 2, h * 0.24, 0, Math.PI * 2)
    ctx.fillStyle = colour
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${h * 0.26}px ${font}`
    ctx.fillText(LETTERS[i], cx, h / 2 + h * 0.01)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = INK
    fitText(ctx, text.options[i], h * 0.78, h * 0.22, w - h * 0.95, h * 0.2, 500, font, h * 0.9)
    ctx.globalAlpha = 1
  }

  // ---- Feedback line after answering ----
  const paintFeedback: Paint = (ctx, w, h, font) => {
    const right = chosen === question.answer
    roundRect(ctx, 2, 2, w - 4, h - 4, h * 0.2)
    ctx.fillStyle = right ? 'rgba(220, 242, 226, 0.97)' : 'rgba(248, 222, 218, 0.97)'
    ctx.fill()
    ctx.fillStyle = right ? '#2f9a5c' : '#c2453f'
    ctx.fillRect(2, h * 0.15, h * 0.06, h * 0.7)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = right ? '#23794a' : '#a8332e'
    ctx.font = `700 ${h * 0.26}px ${font}`
    const label = right ? ui.quiz.correct : ui.quiz.wrong
    ctx.fillText(label, h * 0.3, h * 0.12)
    ctx.fillStyle = INK
    fitText(ctx, text.explanation, h * 0.3, h * 0.48, w - h * 0.5, h * 0.17, 400, font, h * 0.96)
  }

  // ---- Gold button ----
  const paintButton = (label: string, isAimed: boolean): Paint => (ctx, w, h, font) => {
    roundRect(ctx, 3, 3, w - 6, h - 6, h / 2 - 3)
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, isAimed ? '#fff0c2' : '#e8c77e')
    g.addColorStop(1, isAimed ? '#d9a650' : '#b8893d')
    ctx.fillStyle = g
    ctx.fill()
    ctx.fillStyle = '#2b2620'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${h * 0.36}px ${font}`
    ctx.fillText(label, w / 2, h / 2 + h * 0.02, w * 0.9)
  }

  const button =
    stage === 'idle'
      ? { id: 'quiz-start', label: ui.quiz.start, at: BIG_BUTTON }
      : stage === 'results'
        ? { id: 'quiz-retry', label: ui.quiz.retry, at: BIG_BUTTON }
        : answered
          ? // [E]: pressing E anywhere in the room also goes on (Interaction.tsx).
            { id: 'quiz-next', label: `${index === total - 1 ? ui.quiz.finish : ui.quiz.next}  [E]`, at: SMALL_BUTTON }
          : null

  return (
    <group>
      <ScreenHardware />
      {/* Everything shown sits just in front of the display's glass. */}
      <group ref={group} position={[0, 0, DISPLAY.depth]}>
        <group position={[0, SCREEN.y, 0.03]}>
          <Panel width={SCREEN.w} height={SCREEN.h} paint={paintScreen} paintKey={screenKey} />
        </group>

        {stage === 'question' &&
          ANSWER.xs.map((x, i) => (
            <Target key={i} id={`quiz-answer-${i}`} x={x} y={ANSWER.y}>
              <Panel
                width={ANSWER.w}
                height={ANSWER.h}
                paint={paintAnswer(i)}
                paintKey={`${language}|${index}|${chosen}|${aimed === `quiz-answer-${i}`}`}
              />
            </Target>
          ))}

        {stage === 'question' && answered && (
          <group position={[FEEDBACK.x, FEEDBACK.y, 0.04]}>
            <Panel width={FEEDBACK.w} height={FEEDBACK.h} paint={paintFeedback} paintKey={`${language}|${index}|${chosen}`} />
          </group>
        )}

        {button && (
          <Target id={button.id} x={button.at.x} y={button.at.y}>
            <Panel
              width={button.at.w}
              height={button.at.h}
              paint={paintButton(button.label, aimed === button.id)}
              paintKey={`${button.label}|${aimed === button.id}`}
              glow={aimed === button.id ? 1 : 0.86}
            />
          </Target>
        )}
      </group>
    </group>
  )
}
