import { Suspense, lazy, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useContent } from '../content/use-content'
import { CHALLENGES, INVENTION_IDS, MAKERS, eraOf, gameText, gameTouchText, type Era } from '../content/game'
import { useMuseumStore } from '../state/useMuseumStore'
import { resumeWalking } from '../world/pointer-lock'
import { playEffect } from '../audio/sound'
import { IS_TOUCH } from './touch'

// THE TIME MACHINE GAME (opened from the Game Room's lectern): four short rounds, each
// relighting one power core; all four open the portal (quizPassed). A round can be retried
// at once (new cards each time), and every wrong answer names the room to look again in.

const ModelViewer = lazy(() => import('../world/ModelViewer'))
const ERA_COLOURS = ['#e0a050', '#ffd36a', '#6be08b', '#3fd0e0']
const NUMERALS = ['I', 'II', 'III', 'IV']
const NEED = [6, 4, 3, 4] // right answers needed in each round

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function useGame() {
  const content = useContent()
  const text = useMemo(() => ({ ...gameText[content.language], ...(IS_TOUCH ? gameTouchText[content.language] : {}) }), [content.language])
  const room = (id: string) => content.roomNames[`ir${eraOf(id)}` as 'ir1'].name
  const title = (id: string) => content.exhibit(id).title
  return { ...content, g: text, room, title }
}

type Finish = (score: number) => void

// ---- Round 1: sort inventions into their revolution ----
function TimelineRound({ onFinish }: { onFinish: Finish }) {
  const { g, title } = useGame()
  const cards = useMemo(() => shuffle(INVENTION_IDS).slice(0, 8), [])
  const [chosen, setChosen] = useState<Record<string, Era>>({})
  const [checked, setChecked] = useState(false)
  const complete = cards.every((id) => chosen[id])
  function check() {
    setChecked(true)
    onFinish(cards.filter((id) => chosen[id] === eraOf(id)).length)
  }
  return (
    <>
      <div className="game-cards">
        {cards.map((id) => {
          const right = chosen[id] === eraOf(id)
          return (
            <div key={id} className={`game-card${checked ? (right ? ' is-right' : ' is-wrong') : ''}`}>
              <span className="game-card-title">{title(id)}</span>
              <div className="game-eras">
                {NUMERALS.map((numeral, i) => {
                  const era = (i + 1) as Era
                  const isAnswer = checked && era === eraOf(id)
                  return (
                    <button
                      key={numeral}
                      disabled={checked}
                      className={`game-era${chosen[id] === era ? ' is-chosen' : ''}${isAnswer ? ' is-answer' : ''}`}
                      style={{ '--era': ERA_COLOURS[i] } as React.CSSProperties}
                      onClick={() => setChosen((previous) => ({ ...previous, [id]: era }))}
                    >
                      {numeral}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {!checked && (
        <button className="game-primary" disabled={!complete} onClick={check}>
          {g.check}
        </button>
      )}
    </>
  )
}

// ---- Round 2: connect people and companies to their inventions ----
function WireRound({ onFinish }: { onFinish: Finish }) {
  const { g, language, title } = useGame()
  const pairs = useMemo(() => shuffle(MAKERS).slice(0, 5), [])
  const right = useMemo(() => shuffle(pairs.map((p) => p.id)), [pairs])
  const [picked, setPicked] = useState<string | null>(null) // a left box (its invention id)
  const [links, setLinks] = useState<Record<string, string>>({}) // left id -> right id
  const [checked, setChecked] = useState(false)
  const order = Object.keys(links)
  const colourOf = (left: string) => ERA_COLOURS[order.indexOf(left) % 4]
  function link(target: string) {
    if (!picked || checked) return
    // (A box already linked is unlinked first: each box has one partner.)
    setLinks((previous) => {
      const next = Object.fromEntries(Object.entries(previous).filter(([l, r]) => l !== picked && r !== target))
      next[picked] = target
      return next
    })
    setPicked(null)
    playEffect('select', 0.4)
  }
  function check() {
    setChecked(true)
    onFinish(pairs.filter((p) => links[p.id] === p.id).length)
  }
  return (
    <>
      <div className="game-wire">
        <div className="game-wire-column">
          {pairs.map((p) => {
            const linked = links[p.id]
            return (
              <button
                key={p.id}
                disabled={checked}
                className={`game-wire-box${picked === p.id ? ' is-picked' : ''}${checked ? (linked === p.id ? ' is-right' : ' is-wrong') : ''}`}
                style={linked ? ({ '--link': colourOf(p.id) } as React.CSSProperties) : undefined}
                onClick={() => setPicked(p.id)}
              >
                {linked && <i className="game-wire-dot" />}
                {p.who[language]}
                {checked && linked !== p.id && <small>→ {title(p.id)}</small>}
              </button>
            )
          })}
        </div>
        <div className="game-wire-column">
          {right.map((id) => {
            const from = Object.keys(links).find((l) => links[l] === id)
            return (
              <button
                key={id}
                disabled={checked || !picked}
                className="game-wire-box"
                style={from ? ({ '--link': colourOf(from) } as React.CSSProperties) : undefined}
                onClick={() => link(id)}
              >
                {from && <i className="game-wire-dot" />}
                {title(id)}
              </button>
            )
          })}
        </div>
      </div>
      {!checked && (
        <button className="game-primary" disabled={Object.keys(links).length < pairs.length} onClick={check}>
          {g.check}
        </button>
      )}
    </>
  )
}

// ---- Rounds 3 and 4: one question at a time, four choices ----
interface Question {
  answer: string
  options: string[]
  prompt: ReactNode
  why?: string
  visual?: (revealed: boolean) => ReactNode
}
function ChoiceRound({ questions, onFinish }: { questions: Question[]; onFinish: Finish }) {
  const { g, room, title } = useGame()
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const q = questions[index]
  const last = index === questions.length - 1
  function choose(id: string) {
    if (picked) return
    setPicked(id)
    const right = id === q.answer
    playEffect(right ? 'correct' : 'wrong', 0.6)
    const total = score + (right ? 1 : 0)
    setScore(total)
    if (last) onFinish(total)
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(event.code)
      const pad = ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'].indexOf(event.code)
      const i = Math.max(n, pad)
      if (i >= 0 && q.options[i]) choose(q.options[i])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <div className="game-choice">
      {q.visual && <div className="game-visual">{q.visual(Boolean(picked))}</div>}
      <div className="game-choice-main">
        <p className="game-progress">
          {index + 1}/{questions.length}
        </p>
        <div className="game-prompt">{q.prompt}</div>
        <div className="game-options">
          {q.options.map((id, i) => {
            const state = picked ? (id === q.answer ? ' is-right' : id === picked ? ' is-wrong' : ' is-dim') : ''
            return (
              <button key={id} className={`game-option${state}`} disabled={Boolean(picked)} onClick={() => choose(id)}>
                <b>{i + 1}</b>
                {title(id)}
              </button>
            )
          })}
        </div>
        {picked && (
          <div className={`game-feedback ${picked === q.answer ? 'is-right' : 'is-wrong'}`}>
            {q.why && <p>{q.why}</p>}
            {picked !== q.answer && <p className="game-review">{g.review.replace('{room}', room(q.answer))}</p>}
            {!last && (
              <button
                className="game-primary"
                onClick={() => {
                  setIndex(index + 1)
                  setPicked(null)
                }}
              >
                →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MysteryRound({ onFinish }: { onFinish: Finish }) {
  const { g, room, exhibit } = useGame()
  const questions = useMemo<Question[]>(
    () =>
      shuffle(INVENTION_IDS)
        .slice(0, 4)
        .map((answer) => ({
          answer,
          options: shuffle([answer, ...shuffle(INVENTION_IDS.filter((id) => id !== answer)).slice(0, 3)]),
          prompt: (
            <>
              <p>{g.clueEra.replace('{room}', room(answer))}</p>
              <p className="game-clue">{exhibit(answer).facts.find((f) => f.includes(':') && !/^(Nhân vật|Person|People|Pioneer|Công ty|Company)/.test(f))}</p>
            </>
          ),
          visual: (revealed: boolean) => (
            <Suspense fallback={null}>
              <ModelViewer id={answer} silhouette={!revealed} />
            </Suspense>
          ),
        })),
    // (New machines on every attempt; the texts follow the language.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  return <ChoiceRound questions={questions} onFinish={onFinish} />
}

function FactoryRound({ onFinish }: { onFinish: Finish }) {
  const { language } = useGame()
  const questions = useMemo<Question[]>(
    () =>
      shuffle(CHALLENGES)
        .slice(0, 5)
        .map((c) => ({
        answer: c.answer,
        options: shuffle(c.options),
        prompt: <p>{c.situation[language]}</p>,
        why: c.why[language],
      })),
    [language],
  )
  return <ChoiceRound questions={questions} onFinish={onFinish} />
}

const ROUNDS = [TimelineRound, WireRound, MysteryRound, FactoryRound]
const TOTALS = [8, 5, 4, 5]

export default function TimeMachineGame() {
  const { g } = useGame()
  const cores = useMuseumStore((state) => state.gameCores)
  const lightCore = useMuseumStore((state) => state.lightCore)
  const [round, setRound] = useState(Math.min(cores, 3))
  const [attempt, setAttempt] = useState(0)
  const [score, setScore] = useState<number | null>(null)
  const done = cores >= 4 && score === null

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.code === 'Escape') useMuseumStore.getState().setMode('paused')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function finish(result: number) {
    setScore(result)
    if (result >= NEED[round]) {
      lightCore(round)
      playEffect('results', 0.6)
    } else playEffect('wrong', 0.5)
  }
  const passed = score !== null && score >= NEED[round]
  const Round = ROUNDS[round]

  return (
    <div className="overlay game-overlay">
      <div className="game-panel">
        <header className="game-header">
          <div>
            <h2>{g.title}</h2>
            {!done && (
              <p className="game-round">
                {g.roundOf.replace('{n}', String(round + 1))} · <strong>{g.rounds[round].name}</strong>
              </p>
            )}
          </div>
          <div className="game-cores" aria-label={g.cores}>
            {ERA_COLOURS.map((colour, i) => (
              <i key={colour} className={i < cores ? 'is-lit' : ''} style={{ '--era': colour } as React.CSSProperties} />
            ))}
          </div>
          <button className="game-close" onClick={() => void resumeWalking()}>
            {g.close}
          </button>
        </header>

        {done ? (
          <div className="game-done">
            <h3>{g.doneTitle}</h3>
            <p>{g.doneText}</p>
            <button className="game-primary" onClick={() => void resumeWalking()}>
              {g.finish}
            </button>
          </div>
        ) : (
          <>
            <p className="game-task">{g.rounds[round].task}</p>
            <div className="game-body">
              <Round key={`${round}-${attempt}`} onFinish={finish} />
            </div>
            {score !== null && (
              <footer className={`game-result ${passed ? 'is-right' : 'is-wrong'}`}>
                <span>
                  <strong>{passed ? g.passed : g.failed}</strong> {g.score.replace('{score}', String(score)).replace('{total}', String(TOTALS[round])).replace('{need}', String(NEED[round]))}
                </span>
                {passed ? (
                  <button
                    className="game-primary"
                    onClick={() => {
                      setScore(null)
                      if (round < 3) setRound(round + 1)
                    }}
                  >
                    {round < 3 ? g.next : g.finish}
                  </button>
                ) : (
                  <button
                    className="game-primary"
                    onClick={() => {
                      setScore(null)
                      setAttempt(attempt + 1)
                    }}
                  >
                    {g.retry}
                  </button>
                )}
              </footer>
            )}
          </>
        )}
      </div>
    </div>
  )
}
