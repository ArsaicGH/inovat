import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { useContent } from '../content/use-content'
import { gameText, gameTouchText, type Era } from '../content/game'
import { PICTURES } from '../content/pictures'
import { useMuseumStore, type GameRun } from '../state/useMuseumStore'
import { resumeWalking } from '../world/pointer-lock'
import { useScrollFades } from './scroll-fades'
import { IS_TOUCH } from './touch'
import {
  MAX_POINTS,
  STARS,
  cardEra,
  cardPoints,
  choose,
  goBackToRooms,
  PER_ERA,
  isPhoto,
  moreClue,
  mystery,
  nextCard,
  questionOf,
  startRun,
  starsFor,
  townProblem,
  visitorOf,
} from './game-run'
import { TOWN_YEARS } from '../content/game-cards'
import Town, { townStages } from './game-town'
import VisitorFigure, { SceneBackdrop } from './game-visitor'
import { assetUrl } from '../asset-url'

// THE TIME MACHINE REPAIR SHOP (opened from the Game Room's lectern). The first screen is the
// workshop with the four power cores; each core is a different challenge:
//   I   Lost in time: send each machine or picture through its era's door.
//   II  The growing town: solve each era's problems so the town grows from 1760 to 2026.
//   III Who am I?: guess a mystery from clues, the sooner the better.
//   IV  Visitors from the past: give four visitors advice that fits their time.
// Cores are lit in order; all four open the portal (quizPassed). A wrong answer asks whether to
// go back to the rooms (the map opens; a button brings the visitor back to this very card) or
// to answer again. The rules and the saved progress are in game-run.ts.

const ModelViewer = lazy(() => import('../world/ModelViewer'))
const ERA_COLOURS = ['#e0a050', '#ffd36a', '#6be08b', '#3fd0e0']
const NUMERALS = ['I', 'II', 'III', 'IV']
const eraColour = (era: Era) => ({ '--era': ERA_COLOURS[era - 1] }) as CSSProperties
const pickOf = <T,>(list: T[], seed: number) => list[seed % list.length]

function useGame() {
  const content = useContent()
  const text = useMemo(() => ({ ...gameText[content.language], ...(IS_TOUCH ? gameTouchText[content.language] : {}) }), [content.language])
  const roomName = (era: Era) => content.roomNames[`ir${era}` as 'ir1'].name
  const roomShort = (era: Era) => content.roomNames[`ir${era}` as 'ir1'].short
  const title = (id: string) => content.exhibit(id).title
  return { ...content, g: text, roomName, roomShort, title }
}

function useRun(): GameRun {
  return useMuseumStore((state) => state.gameRun)!
}

// Number keys choose (1-4 on the top row or the keypad); Enter goes on to the next card.
function useKeys(count: number, onNumber: (i: number) => void) {
  const handler = useRef(onNumber)
  handler.current = onNumber
  useEffect(() => {
    function listen(event: KeyboardEvent) {
      const top = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(event.code)
      const pad = ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'].indexOf(event.code)
      const i = Math.max(top, pad)
      if (i >= 0 && i < count) handler.current(i)
      if (event.code === 'Enter' || event.code === 'NumpadEnter') nextCard()
    }
    window.addEventListener('keydown', listen)
    return () => window.removeEventListener('keydown', listen)
  }, [count])
}

function Stars({ n }: { n: number }) {
  return (
    <span className="game-stars" aria-label={`${n}/3`}>
      {'★'.repeat(n)}
      <i>{'★'.repeat(3 - n)}</i>
    </span>
  )
}

// The bar above every card: where we are, and the points so far.
function CardBar({ label, extra }: { label: ReactNode; extra?: ReactNode }) {
  const { g } = useGame()
  const run = useRun()
  return (
    <div className="game-bar">
      <span>{label}</span>
      {extra}
      <strong>{g.points.replace('{n}', String(run.points))}</strong>
    </div>
  )
}

// A wrong answer: crossed out, with a hint at which room to look in. Nothing blocks the other
// answers; the way back to the rooms is always at the bottom of the game. (No answer is given
// away: the hint only names the room, and not at all where the room would be the answer.)
function WrongNote({ hintEra }: { hintEra?: Era }) {
  const { g, roomName } = useGame()
  return (
    <p className="game-wrong-note">
      <strong>{g.wrongTitle}</strong> {g.wrongTryOther}
      {hintEra && <span className="game-review"> {g.wrongHint.replace('{room}', roomName(hintEra))}</span>}
    </p>
  )
}

// After a right answer: what it means, and on to the next card.
function RightNote({ children }: { children: ReactNode }) {
  return (
    <div className="game-feedback is-right">
      <p>{children}</p>
      <button className="game-primary" onClick={nextCard} aria-label="→">
        →
      </button>
    </div>
  )
}

// ---- Core I: Lost in time ----
function LostRound() {
  const { g, title, roomShort, language } = useGame()
  const run = useRun()
  const id = run.deck[run.index]
  const era = cardEra(0, id)
  useKeys(4, (i) => choose(String(i + 1)))
  // A right answer moves on by itself after a moment (or at once with →).
  useEffect(() => {
    if (!run.solved) return
    const timer = window.setTimeout(nextCard, 1600)
    return () => window.clearTimeout(timer)
  }, [run.solved, run.index])
  const picture = isPhoto(id) ? PICTURES[id] : null
  return (
    <div className="lost">
      <CardBar
        label={g.cardOf.replace('{n}', String(run.index + 1)).replace('{total}', String(run.deck.length))}
        extra={run.combo >= 2 && <strong className="game-combo">{g.combo.replace('{n}', String(run.combo))}</strong>}
      />
      <div className={`lost-stage${run.solved ? ' is-in' : run.wrong.length ? ' is-out' : ''}`}>
        <div key={id} className={`lost-object${picture ? ' is-photo' : ''}`}>
          {picture ? (
            <img src={assetUrl(picture.file ?? '')} alt="" draggable={false} />
          ) : (
            <Suspense fallback={null}>
              <ModelViewer id={id} />
            </Suspense>
          )}
        </div>
        {/* A machine shows its name at once; a picture's caption only once it is sorted
            (its dates would give the answer away). */}
        {!picture && <p className="lost-title">{title(id)}</p>}
        {picture && run.solved && <p className="lost-title">{picture.caption[language]}</p>}
      </div>
      {run.wrong.length > 0 && !run.solved && <WrongNote />}
      {run.solved && <RightNote>{g.rightDoor}</RightNote>}
      <div className="lost-doors">
        {([1, 2, 3, 4] as Era[]).map((door) => {
          const tried = run.wrong.includes(String(door))
          const state = run.solved && door === era ? ' is-answer' : tried ? ' is-wrong-door' : ''
          return (
            <button key={door} className={`lost-door${state}`} style={eraColour(door)} disabled={run.solved || tried} onClick={() => choose(String(door))}>
              <b>{NUMERALS[door - 1]}</b>
              <small>{roomShort(door)}</small>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---- Core II: The growing town ----
function TownRound() {
  const { g, language, title } = useGame()
  const run = useRun()
  const problem = townProblem(run.deck[run.index])
  const eraIndex = Math.floor(run.index / PER_ERA)
  const step = run.index % PER_ERA
  const eraDone = run.solved && step === PER_ERA - 1
  useKeys(3, (i) => run.options[i] && choose(run.options[i]))
  const stages = townStages(run)
  return (
    <div className="town-round">
      <CardBar label={<>{g.townIn.replace('{year}', String(TOWN_YEARS[eraDone ? eraIndex + 1 : eraIndex]))} · {g.problemOf.replace('{n}', String(step + 1)).replace('{total}', String(PER_ERA))}</>} />
      <Town stages={stages} era={eraDone ? eraIndex + 1 : eraIndex} current={run.solved ? null : problem.spot} pending={run.deck.slice(run.index + 1, (eraIndex + 1) * PER_ERA).map((id) => townProblem(id).spot)} />
      <p className="town-problem">{problem.problem[language]}</p>
      <div className="town-options">
        {run.options.map((option, i) => {
          const tried = run.wrong.includes(option)
          const state = run.solved ? (option === problem.options[0] ? ' is-right' : ' is-dim') : tried ? ' is-wrong' : ''
          return (
            <button key={option} className={`game-option${state}`} disabled={run.solved || tried} onClick={() => choose(option)}>
              <b>{i + 1}</b>
              {title(option)}
            </button>
          )
        })}
      </div>
      {run.wrong.length > 0 && !run.solved && <WrongNote hintEra={problem.era} />}
      {run.solved && (
        <RightNote>
          {problem.fixed[language]}
          {eraDone && <strong className="town-jump"> {g.eraJump}</strong>}
        </RightNote>
      )}
    </div>
  )
}

// ---- Core III: Who am I? ----
function MysteryRound() {
  const { g, language, title, roomName } = useGame()
  const run = useRun()
  const id = run.deck[run.index]
  const m = mystery(id)
  const isEra = /^ir\d$/.test(id)
  const label = (option: string) => (/^ir\d$/.test(option) ? roomName(Number(option[2]) as Era) : title(option))
  useKeys(4, (i) => run.options[i] && choose(run.options[i]))
  return (
    <div className="mystery">
      <CardBar
        label={
          <>
            {g.mysteryOf.replace('{n}', String(run.index + 1)).replace('{total}', String(run.deck.length))}
            {isEra && ` · ${g.era}`}
          </>
        }
        extra={!run.solved && <span key={cardPoints(run)} className="mystery-worth">{g.worth.replace('{n}', String(cardPoints(run)))}</span>}
      />
      <div className="mystery-body">
        <ol className="mystery-clues">
          {m.clues.map((clue, k) =>
            k < run.clues || run.solved ? (
              <li key={k} className="mystery-clue">
                <small>{g.clue.replace('{n}', String(k + 1))}</small>
                {clue[language]}
              </li>
            ) : (
              <li key={k} className="mystery-clue is-hidden">
                {k === run.clues ? (
                  <button className="game-hint" onClick={moreClue}>
                    {g.moreClue} (−1)
                  </button>
                ) : (
                  <small>{g.clue.replace('{n}', String(k + 1))}</small>
                )}
              </li>
            ),
          )}
        </ol>
        <div className="mystery-options">
          {run.options.map((option, i) => {
            const tried = run.wrong.includes(option)
            const state = run.solved ? (option === id ? ' is-right' : ' is-dim') : tried ? ' is-wrong' : ''
            return (
              <button key={option} className={`game-option${state}`} disabled={run.solved || tried} onClick={() => choose(option)}>
                <b>{i + 1}</b>
                {label(option)}
              </button>
            )
          })}
        </div>
      </div>
      {run.wrong.length > 0 && !run.solved && <WrongNote hintEra={isEra ? undefined : cardEra(2, id)} />}
      {run.solved && <RightNote>{g.solved.replace('{n}', String(Math.max(0, 4 - Math.max(run.clues - 1, run.wrong.length))))}</RightNote>}
    </div>
  )
}

// ---- Core IV: Visitors from the past ----
function VisitorRound() {
  const { g, language } = useGame()
  const run = useRun()
  const qid = run.deck[run.index]
  const visitor = visitorOf(qid)
  const question = questionOf(qid)
  const visitorNumber = Math.floor(run.index / PER_ERA)
  const step = run.index % PER_ERA
  const puzzled = run.wrong.length > 0 && !run.solved
  useKeys(3, (i) => run.options[i] && choose(run.options[i]))
  // What the visitor says: hello and the question, then their reaction.
  const speech = run.solved ? (
    `${pickOf(g.happy, visitorNumber + step)} ${step === PER_ERA - 1 ? g.goodbye : ''}`
  ) : puzzled ? (
    <>
      <strong>{pickOf(g.puzzled, run.index + run.wrong.length)}</strong> {question.ask[language]}
    </>
  ) : (
    `${step === 0 && run.wrong.length === 0 ? `${visitor.hello[language]} ` : ''}${question.ask[language]}`
  )
  return (
    <div className="visitor-round">
      <CardBar label={<>{g.visitorOf.replace('{n}', String(visitorNumber + 1))} · <strong>{visitor.who[language]}</strong> · {g.adviceOf.replace('{n}', String(step + 1)).replace('{total}', String(PER_ERA))}</>} />
      <div className="visitor-scene">
        <SceneBackdrop era={visitor.era} />
        <VisitorFigure look={visitor.look} mood={run.solved ? 'happy' : puzzled ? 'puzzled' : 'asking'} key={visitor.id} />
        <div className="visitor-speech">{speech}</div>
      </div>
      <div className="visitor-replies">
        {run.options.map((option, i) => {
          const tried = run.wrong.includes(option)
          const state = run.solved ? (option === '0' ? ' is-right' : ' is-dim') : tried ? ' is-wrong' : ''
          return (
            <button key={option} className={`game-option${state}`} disabled={run.solved || tried} onClick={() => choose(option)}>
              <b>{i + 1}</b>
              {question.replies[Number(option)][language]}
            </button>
          )
        })}
      </div>
      {run.wrong.length > 0 && !run.solved && <WrongNote hintEra={visitor.era} />}
      {run.solved && <RightNote>{question.why[language]}</RightNote>}
    </div>
  )
}

// ---- The result of a core ----
function Result({ onDone }: { onDone: () => void }) {
  const { g } = useGame()
  const run = useRun()
  const stars = starsFor(run.round, run.points)
  return (
    <div className={`game-result ${stars > 0 ? 'is-right' : 'is-wrong'}`}>
      <span>
        <strong>{stars > 0 ? g.passed.replace('{n}', NUMERALS[run.round]) : g.failed}</strong>{' '}
        {g.score.replace('{score}', String(run.points)).replace('{total}', String(MAX_POINTS[run.round])).replace('{need}', String(STARS[run.round][0]))}{' '}
        {stars > 0 && <Stars n={stars} />}
      </span>
      <span className="game-result-buttons">
        {stars > 0 ? (
          <button className="game-primary" onClick={onDone}>
            {g.next}
          </button>
        ) : (
          <button className="game-primary" onClick={() => startRun(run.round)}>
            {g.retry}
          </button>
        )}
      </span>
    </div>
  )
}

// ---- The workshop: the four cores, their stars, and what to repair next ----
function Workshop({ onPlay }: { onPlay: () => void }) {
  const { g } = useGame()
  const cores = useMuseumStore((state) => state.gameCores)
  const stars = useMuseumStore((state) => state.coreStars)
  const run = useMuseumStore((state) => state.gameRun)
  // A core left half-way carries on where it was; any other starts afresh.
  const play = (round: number) => {
    if (!(run && run.round === round && !run.finished)) startRun(round)
    onPlay()
  }
  const inProgress = (round: number) => run?.round === round && !run.finished
  return (
    <div className="workshop">
      <p className="game-task">{g.hubIntro}</p>
      <p className="workshop-help">
        <button className="game-close workshop-help-button" onClick={goBackToRooms}>
          {g.goBack}
        </button>{' '}
        {g.goBackHelp}
      </p>
      <div className="workshop-cores">
        {g.rounds.map((round, i) => {
          const lit = i < cores
          const next = i === cores
          return (
            <div key={i} className={`workshop-core${lit ? ' is-lit' : next ? ' is-next' : ' is-locked'}`} style={eraColour((i + 1) as Era)}>
              <span className="workshop-orb">{NUMERALS[i]}</span>
              <strong>{round.name}</strong>
              {lit && <Stars n={stars[i]} />}
              {inProgress(i) ? (
                <button className="game-primary" onClick={() => play(i)}>
                  {g.resume.replace('{n}', NUMERALS[i])}
                </button>
              ) : lit ? (
                <button className="game-close" onClick={() => play(i)}>
                  {g.replay}
                </button>
              ) : next ? (
                <button className="game-primary" onClick={() => play(i)}>
                  {g.repair.replace('{n}', NUMERALS[i])}
                </button>
              ) : (
                <small>{g.locked}</small>
              )}
            </div>
          )
        })}
      </div>
      {cores >= 4 && (
        <div className="game-done">
          <h3>{g.doneTitle}</h3>
          <p>{g.doneText}</p>
          <button className="game-primary" onClick={() => void resumeWalking()}>
            {g.finish}
          </button>
        </div>
      )}
    </div>
  )
}

const ROUNDS = [LostRound, TownRound, MysteryRound, VisitorRound]

export default function TimeMachineGame() {
  const { g } = useGame()
  const cores = useMuseumStore((state) => state.gameCores)
  const run = useMuseumStore((state) => state.gameRun)
  // The workshop shows when no core is being played, or when the visitor steps back to it
  // (the core in progress stays saved).
  const [atWorkshop, setAtWorkshop] = useState(false)
  const playing = run && !atWorkshop ? run : null
  const scroll = useScrollFades<HTMLDivElement>(`${playing?.round}-${playing?.index}-${playing?.finished}`)

  useEffect(() => {
    // Back from the rooms (by the button, or by walking up to the lectern): carry on.
    useMuseumStore.getState().setAwayFromGame(false)
    function onKey(event: KeyboardEvent) {
      if (event.code === 'Escape') useMuseumStore.getState().setMode('paused')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const panel = useRef<HTMLDivElement>(null)
  useFitToScreen(panel)

  const Round = playing && !playing.finished ? ROUNDS[playing.round] : null
  function toWorkshop() {
    // A finished core is done with; one in progress waits.
    if (run?.finished) useMuseumStore.getState().setGameRun(null)
    setAtWorkshop(true)
  }
  return (
    <div className="overlay game-overlay">
      <div ref={panel} className="game-panel">
        <header className="game-header">
          <div>
            <h2>{g.title}</h2>
            {playing && (
              <p className="game-round">
                {g.roundOf.replace('{n}', String(playing.round + 1))} · <strong>{g.rounds[playing.round].name}</strong>
              </p>
            )}
          </div>
          <div className="game-cores" aria-label={g.cores}>
            {ERA_COLOURS.map((colour, i) => (
              <i key={colour} className={i < cores ? 'is-lit' : ''} style={{ '--era': colour } as CSSProperties} />
            ))}
          </div>
          {playing && (
            <button className="game-close" onClick={toWorkshop}>
              {g.back}
            </button>
          )}
          <button className="game-close" onClick={() => void resumeWalking()}>
            {g.close}
          </button>
        </header>

        {/* The round scrolls between the header and the result bar, which stay in view. */}
        <div ref={scroll} className="game-scroll scroll-fade">
          {!playing && <Workshop onPlay={() => setAtWorkshop(false)} />}
          {playing && (
            <>
              <p className="game-task">{g.rounds[playing.round].task}</p>
              <div className="game-body">{Round && <Round />}</div>
            </>
          )}
        </div>
        {playing?.finished && <Result onDone={toWorkshop} />}
        {/* Always there during a core: look around the rooms, and come back to the same card. */}
        {playing && !playing.finished && (
          <footer className="game-footer">
            <button className="game-close" onClick={goBackToRooms}>
              {g.goBack}
            </button>
            <span>{g.goBackNote}</span>
          </footer>
        )}
      </div>
    </div>
  )
}

// FITTING THE WINDOW TO THE SCREEN: the game measures how tall its content is at its natural
// size, then scales the whole window (CSS zoom) so it fits the browser window without
// scrolling, a little larger on big screens. It follows the screen's real size, not the
// system's display scaling (a laptop at 150 % otherwise got a cramped, scrolling game).
const PANEL_WIDTH = 1040 // the window's natural width (CSS pixels)
const MARGIN = 32
const ZOOM_MIN = 0.6
const ZOOM_MAX = 1.15
function useFitToScreen(panel: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const element = panel.current
    if (!element) return
    let zoom = 1
    const apply = (z: number) => {
      element.style.zoom = String(z)
      element.style.width = `${Math.min(PANEL_WIDTH, (window.innerWidth - MARGIN) / z)}px`
      element.style.maxHeight = `${(window.innerHeight - MARGIN) / z}px`
    }
    const fit = () => {
      // (In the trailer, the window also leaves room for its cinema bars.)
      const spare = document.documentElement.classList.contains('trailer-on') ? window.innerHeight * 0.12 : MARGIN
      // Twice: the height depends on the width, which depends on the zoom.
      for (let pass = 0; pass < 2; pass++) {
        apply(zoom)
        element.classList.add('is-measuring')
        const natural = element.getBoundingClientRect().height / zoom
        element.classList.remove('is-measuring')
        const byHeight = (window.innerHeight - spare) / natural
        const byWidth = (window.innerWidth - MARGIN) / PANEL_WIDTH
        // (Larger only where the screen is wider than the window; a narrow screen keeps the
        // natural size, the window itself getting narrower.)
        const widest = byWidth > 1 ? Math.min(ZOOM_MAX, byWidth) : 1
        zoom = Math.max(ZOOM_MIN, Math.min(byHeight, widest))
      }
      apply(zoom)
    }
    let pending = 0
    const later = () => {
      cancelAnimationFrame(pending)
      pending = requestAnimationFrame(fit)
    }
    fit()
    window.addEventListener('resize', later)
    // (The content changes with every card: measured again, a frame later.)
    const watcher = new MutationObserver(later)
    watcher.observe(element, { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(pending)
      window.removeEventListener('resize', later)
      watcher.disconnect()
    }
  }, [panel])
}
