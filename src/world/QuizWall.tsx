import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { CanvasTexture, MeshBasicMaterial, SRGBColorSpace, type Group } from 'three'
import { useContent } from '../content/use-content'
import { QUIZ_QUESTIONS } from '../content/quiz'
import { useMuseumStore } from '../state/useMuseumStore'
import { resultLevel, scoreQuiz } from '../state/quiz-score'
import { addAimTarget, removeAimTarget } from './aim-targets'
import { drawWrappedText, paintFont, useFontsReady } from './fonts'
import { QUIZ_COLOURS } from './style'

// THE QUIZ ON THE GAME ROOM'S BACK WALL. Everything is painted onto pictures (canvas
// textures) on the wall: a big screen with the question, four answer tiles, a feedback
// line and a button. Tiles and buttons carry `userData.exhibitId` ("quiz-answer-2",
// "quiz-next"...), so the crosshair can aim at them and E or a click chooses them
// (Interaction.tsx). The visitor keeps walking the whole time; nothing pops up.
//
// Local coordinates of the back wall: x across (0 = middle), y up, and the wall's
// surface is at z = 0 (the parent places this group on the wall). The pictures sit on
// the giant screen's glass (ScreenHardware below).

const LETTERS = ['A', 'B', 'C', 'D']
const PX = 256 // canvas pixels per metre

const SCREEN = { y: 3.22, w: 10, h: 1.46 }
const ANSWER = { y: 1.8, w: 2.3, h: 1.02, xs: [-3.6, -1.2, 1.2, 3.6] }
const FEEDBACK = { x: -1.25, y: 0.86, w: 7.5, h: 0.62 }
const SMALL_BUTTON = { x: 3.6, y: 0.86, w: 2.3, h: 0.62 }
const BIG_BUTTON = { x: 0, y: 1.8, w: 3.2, h: 0.9 }

// THE SCREEN ITSELF: a giant wall-mounted display, almost as wide as the wall (12 m), in
// a dark metal case with a thin gold trim, a soft coloured glow behind it on the wall
// (like a TV's backlight) and a small power light. Its glass is dark and glossy.
const DISPLAY = { y: 2.24, w: 11.2, h: 3.56, bezel: 0.1, depth: 0.16 }

function ScreenHardware() {
  const outerW = DISPLAY.w + 2 * DISPLAY.bezel
  const outerH = DISPLAY.h + 2 * DISPLAY.bezel
  const gold = <meshStandardMaterial color="#c9a25a" metalness={0.9} roughness={0.3} />
  return (
    <group position={[0, DISPLAY.y, 0]}>
      {/* Backlight glow on the wall around the screen (self-lit, so the bloom softens it). */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[outerW + 0.35, outerH + 0.3]} />
        <meshBasicMaterial color="#7a4fd8" transparent opacity={0.35} toneMapped={false} />
      </mesh>
      {/* Case. */}
      <mesh position={[0, 0, DISPLAY.depth / 2]} castShadow>
        <boxGeometry args={[outerW, outerH, DISPLAY.depth]} />
        <meshStandardMaterial color="#17151c" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Thin gold trim around the glass. */}
      {[
        [0, DISPLAY.h / 2 + 0.012, DISPLAY.w + 0.05, 0.024],
        [0, -DISPLAY.h / 2 - 0.012, DISPLAY.w + 0.05, 0.024],
        [-DISPLAY.w / 2 - 0.012, 0, 0.024, DISPLAY.h],
        [DISPLAY.w / 2 + 0.012, 0, 0.024, DISPLAY.h],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, DISPLAY.depth + 0.004]}>
          <boxGeometry args={[w, h, 0.008]} />
          {gold}
        </mesh>
      ))}
      {/* The glass: very dark, glossy, faintly lit from inside. */}
      <mesh position={[0, 0, DISPLAY.depth + 0.002]}>
        <planeGeometry args={[DISPLAY.w, DISPLAY.h]} />
        <meshStandardMaterial color="#0b0912" emissive="#1c1430" emissiveIntensity={0.6} metalness={0.4} roughness={0.12} />
      </mesh>
      {/* Power light on the bottom edge. */}
      <mesh position={[DISPLAY.w / 2 - 0.25, -outerH / 2 + DISPLAY.bezel / 2, DISPLAY.depth + 0.003]}>
        <circleGeometry args={[0.018, 12]} />
        <meshBasicMaterial color="#5dff9a" toneMapped={false} />
      </mesh>
    </group>
  )
}

type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number, font: string) => void

// A flat picture on the wall, repainted whenever `key` changes (state, language, aim...).
function Panel({ width, height, paint, paintKey, glow = 1 }: { width: number; height: number; paint: Paint; paintKey: string; glow?: number }) {
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

// Dark glass screen with a gold frame (the look of the title screen and the map).
function paintGlass(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = h * 0.12
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, 'rgba(34, 26, 46, 0.95)')
  bg.addColorStop(1, 'rgba(18, 14, 26, 0.95)')
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
  const screenKey = `${language}|${stage}|${index}|${score}`
  const paintScreen: Paint = (ctx, w, h, font) => {
    paintGlass(ctx, w, h)
    const pad = h * 0.14
    ctx.textBaseline = 'top'
    if (stage === 'idle') {
      ctx.textAlign = 'center'
      ctx.fillStyle = '#e8c77e'
      ctx.font = `700 ${h * 0.26}px ${font}`
      ctx.fillText(ui.quiz.title, w / 2, pad, w - 2 * pad)
      ctx.textAlign = 'left'
      ctx.fillStyle = '#efe6d6'
      fitText(ctx, ui.quiz.intro, pad * 2, pad + h * 0.36, w - 4 * pad, h * 0.13, 400, font, h - pad * 0.6)
    } else if (stage === 'question') {
      ctx.textAlign = 'left'
      ctx.fillStyle = '#c9a25a'
      ctx.font = `600 ${h * 0.11}px ${font}`
      ctx.fillText(ui.quiz.progress.replace('{n}', String(index + 1)).replace('{total}', String(total)).toUpperCase(), pad, pad * 0.8)
      // Gold progress bar along the top.
      ctx.fillStyle = 'rgba(201, 162, 90, 0.2)'
      ctx.fillRect(w * 0.3, pad * 0.95, w * 0.62, h * 0.025)
      ctx.fillStyle = '#e8c77e'
      ctx.fillRect(w * 0.3, pad * 0.95, w * 0.62 * ((index + (answered ? 1 : 0)) / total), h * 0.025)
      ctx.fillStyle = '#ffffff'
      fitText(ctx, text.question, pad, pad + h * 0.2, w - 2 * pad, h * 0.17, 600, font, h - pad * 0.6)
    } else {
      ctx.textAlign = 'center'
      ctx.fillStyle = '#e8c77e'
      ctx.font = `700 ${h * 0.2}px ${font}`
      ctx.fillText(ui.quiz.resultsTitle, w / 2, pad * 0.7, w - 2 * pad)
      ctx.font = `700 ${h * 0.3}px ${font}`
      ctx.fillText(`${score}/${total}`, w / 2, pad * 0.7 + h * 0.24)
      ctx.fillStyle = '#efe6d6'
      ctx.font = `400 ${h * 0.11}px ${font}`
      ctx.fillText(ui.quiz.levels[resultLevel(score, total)], w / 2, h * 0.76, w - 2 * pad)
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
    ctx.fillStyle = right ? 'rgba(30, 90, 58, 0.95)' : wrong ? 'rgba(110, 36, 36, 0.95)' : isAimed ? 'rgba(60, 46, 30, 0.97)' : 'rgba(26, 20, 34, 0.95)'
    ctx.fill()
    ctx.lineWidth = isAimed || right || wrong ? h * 0.05 : h * 0.025
    ctx.strokeStyle = right ? '#4fd18b' : wrong ? '#e0605a' : isAimed ? '#f1d898' : colour
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
    ctx.fillStyle = '#f5efe4'
    fitText(ctx, text.options[i], h * 0.78, h * 0.22, w - h * 0.95, h * 0.2, 500, font, h * 0.9)
    ctx.globalAlpha = 1
  }

  // ---- Feedback line after answering ----
  const paintFeedback: Paint = (ctx, w, h, font) => {
    const right = chosen === question.answer
    roundRect(ctx, 2, 2, w - 4, h - 4, h * 0.2)
    ctx.fillStyle = right ? 'rgba(20, 60, 40, 0.92)' : 'rgba(70, 24, 24, 0.92)'
    ctx.fill()
    ctx.fillStyle = right ? '#4fd18b' : '#e0605a'
    ctx.fillRect(2, h * 0.15, h * 0.06, h * 0.7)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = right ? '#8ef0b5' : '#f6a19b'
    ctx.font = `700 ${h * 0.26}px ${font}`
    const label = right ? ui.quiz.correct : ui.quiz.wrong
    ctx.fillText(label, h * 0.3, h * 0.12)
    ctx.fillStyle = '#efe6d6'
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
              glow={aimed === button.id ? 1.15 : 1}
            />
          </Target>
        )}
      </group>
    </group>
  )
}
