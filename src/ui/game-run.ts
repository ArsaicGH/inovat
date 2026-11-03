import { INVENTION_IDS, eraOf, type Era } from '../content/game'
import { MYSTERIES, TOWN, VISITORS } from '../content/game-cards'
import { WALL_GALLERY } from '../content/pictures'
import { useMuseumStore, type GameRun } from '../state/useMuseumStore'
import { releasePointer } from '../world/pointer-lock'
import { playEffect } from '../audio/sound'

// THE RULES OF THE TIME MACHINE GAME, apart from how it looks (TimeMachineGame.tsx): which
// cards are dealt, what the answers are, how points are scored. The core in progress lives in
// the store (gameRun), so the visitor can leave mid-game to look around the rooms and come back
// to exactly the same card.

// Points needed for one, two and three stars in each core, and the most possible.
export const STARS: [number, number, number][] = [
  [12, 15, 18],
  [14, 18, 22],
  [10, 13, 16],
  [14, 18, 22],
]
export const MAX_POINTS = [20, 24, 20, 24]
export const CARDS = [10, 12, 5, 12]

export function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// ---- What each card is ----
// Core I: an invention ('ir2-3'), sorted by era. (Photo cards, 'wall-ir2-3', are still understood.)
export const PHOTOS = (['ir1', 'ir2', 'ir3', 'ir4'] as const).flatMap((room) => {
  const g = WALL_GALLERY[room]
  return [...g.ante, ...g.eraWall, ...g.sides, ...g.doorway]
})
export const isPhoto = (id: string) => id.startsWith('wall-')
export const photoEra = (id: string) => Number(id[7]) as Era // 'wall-ir3-11' = era 3
// Core IV: a visitor's question, 'mill:2' = the third question of the mill owner.
export const visitorOf = (id: string) => VISITORS.find((v) => v.id === id.split(':')[0])!
export const questionOf = (id: string) => visitorOf(id).questions[Number(id.split(':')[1])]
export const townProblem = (id: string) => TOWN.find((p) => p.id === id)!
export const mystery = (id: string) => MYSTERIES.find((m) => m.id === id)!
const isEraMystery = (id: string) => /^ir\d$/.test(id)

// The era a card is about (for the hint "the answer is in room X").
export function cardEra(round: number, id: string): Era {
  if (round === 0) return isPhoto(id) ? photoEra(id) : eraOf(id)
  if (round === 1) return townProblem(id).era
  if (round === 2) return isEraMystery(id) ? (Number(id[2]) as Era) : eraOf(id)
  return visitorOf(id).era
}

// ---- Dealing ----
function deal(round: number): string[] {
  const eras = [1, 2, 3, 4] as Era[]
  if (round === 0) {
    // Two machines from each era, then two more of any era. (Only the inventions: the gallery
    // photos were once mixed in, but many show curiosities, not what an era is about.)
    const firsts = eras.flatMap((era) => shuffle(INVENTION_IDS.filter((id) => eraOf(id) === era)).slice(0, 2))
    const rest = shuffle(INVENTION_IDS.filter((id) => !firsts.includes(id))).slice(0, 2)
    return shuffle([...firsts, ...rest])
  }
  if (round === 1) return eras.flatMap((era) => shuffle(TOWN.filter((p) => p.era === era)).slice(0, 3).map((p) => p.id))
  if (round === 2) {
    // Five mysteries from at least three different eras.
    for (;;) {
      const picks = shuffle(MYSTERIES.map((m) => m.id)).slice(0, 5)
      if (new Set(picks.map((id) => cardEra(2, id))).size >= 3) return picks
    }
  }
  // Core IV: one of the two visitors of each era, three of their questions, oldest era first.
  return eras.flatMap((era) => {
    const visitor = shuffle(VISITORS.filter((v) => v.era === era))[0]
    return shuffle(visitor.questions.map((_, k) => `${visitor.id}:${k}`)).slice(0, 3)
  })
}

// The answers offered for a card, in the order shown, and the right one.
function optionsFor(round: number, id: string): string[] {
  if (round === 0) return ['1', '2', '3', '4']
  if (round === 1) return shuffle([...townProblem(id).options])
  if (round === 2) {
    if (isEraMystery(id)) return ['ir1', 'ir2', 'ir3', 'ir4']
    const others = shuffle(INVENTION_IDS.filter((other) => other !== id && eraOf(other) === eraOf(id))).slice(0, 3)
    return shuffle([id, ...others])
  }
  return shuffle(['0', '1', '2'])
}
export function answerOf(round: number, id: string): string {
  if (round === 0) return String(cardEra(0, id))
  if (round === 1) return townProblem(id).options[0]
  if (round === 2) return id
  return '0'
}

// ---- Scoring ----
// Cores I, II and IV: 2 points right first time, 1 after one wrong answer, then 0.
// Core III: 4 points with one clue; each further clue and each wrong guess costs one (a wrong
// guess also opens the next clue, so it is counted once).
export function cardPoints(run: GameRun): number {
  if (run.round === 2) return Math.max(0, 4 - Math.max(run.clues - 1, run.wrong.length))
  return Math.max(0, 2 - run.wrong.length)
}
export function starsFor(round: number, points: number) {
  return STARS[round].filter((need) => points >= need).length
}

// ---- Actions ----
const store = () => useMuseumStore.getState()
const run = () => store().gameRun!

export function startRun(round: number) {
  const deck = deal(round)
  store().setGameRun({
    round,
    deck,
    index: 0,
    options: optionsFor(round, deck[0]),
    wrong: [],
    clues: 1,
    solved: false,
    asking: false,
    points: 0,
    combo: 0,
    finished: false,
    away: false,
  })
}

export function choose(option: string) {
  const r = run()
  if (r.solved || r.asking || r.finished || r.wrong.includes(option)) return
  const id = r.deck[r.index]
  if (option === answerOf(r.round, id)) {
    playEffect('correct', 0.6)
    store().patchGameRun({ solved: true, points: r.points + cardPoints(r), combo: r.wrong.length === 0 ? r.combo + 1 : 0 })
  } else {
    playEffect('wrong', 0.6)
    store().patchGameRun({ wrong: [...r.wrong, option], asking: true, combo: 0 })
  }
}

// After a wrong answer: answer again (core III: with the next clue open).
export function tryAgain() {
  const r = run()
  store().patchGameRun({ asking: false, clues: r.round === 2 ? Math.min(4, r.clues + 1) : r.clues })
}

// Core III: open one more clue (it costs a point).
export function moreClue() {
  const r = run()
  if (r.clues < 4 && !r.solved) store().patchGameRun({ clues: r.clues + 1 })
}

// After a wrong answer: go and look around the rooms. The map opens; the game waits, and a
// button at the bottom of the screen brings the visitor back (returnToGame).
export function goBackToRooms() {
  const r = run()
  store().patchGameRun({ asking: false, away: true, clues: r.round === 2 ? Math.min(4, r.clues + 1) : r.clues })
  store().setMode('map')
}
export function returnToGame() {
  store().patchGameRun({ away: false })
  store().requestTeleport('quiz')
  store().openGame() // the mode changes first...
  releasePointer() // ...so releasing the mouse is not taken as a pause
}

// The next card, or the result once all are done (which lights the core if it is enough).
export function nextCard() {
  const r = run()
  if (!r.solved) return
  if (r.index + 1 < r.deck.length) {
    const index = r.index + 1
    store().patchGameRun({ index, options: optionsFor(r.round, r.deck[index]), wrong: [], clues: 1, solved: false, asking: false })
    return
  }
  store().patchGameRun({ finished: true })
  const stars = starsFor(r.round, r.points)
  if (stars > 0) {
    store().lightCore(r.round)
    store().setCoreStars(r.round, stars)
    playEffect('results', 0.6)
  } else playEffect('wrong', 0.5)
}
