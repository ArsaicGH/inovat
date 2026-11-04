import { DEV_MODE } from '../dev-mode'
import { create } from 'zustand'
import { roomById, toWorld } from '../world/layout'
import { ERA_ROOMS, type RoomId } from '../types'
import { LANGUAGES, type Language } from '../content/language'
import { IS_TOUCH } from '../ui/touch'

// The app is always in exactly one mode (PLAN.md section 3). Only in "exploring"
// is the mouse captured and walking allowed. (The quiz is played while exploring: it is
// shown on the Game Room's back wall, see QuizWall.tsx.)
// One core of the Time Machine game in progress (TimeMachineGame.tsx): the cards dealt, the
// card being answered and what has happened on it so far.
export interface GameRun {
  round: number // 0-3
  deck: string[] // card ids, in the order they are played
  index: number // the card being answered
  options: string[] // its answers, in the order shown
  wrong: string[] // answers already tried on it, wrongly
  clues: number // core III: clues open on it
  solved: boolean // answered right (its explanation is showing)
  points: number // scored so far
  combo: number // core I: right first time in a row
  finished: boolean // every card done (the result is showing)
}

export type Mode = 'start' | 'exploring' | 'paused' | 'reading' | 'map' | 'ending' | 'game' | 'trailer'

// Mouse/touchpad sensitivity is a multiplier: 1 = default speed.
export const SENSITIVITY_MIN = 0.2
export const SENSITIVITY_MAX = 3
const SENSITIVITY_STORAGE_KEY = 'inovat-mouse-sensitivity'

// Remember the visitor's choice in this browser. Storage can be blocked
// (private windows, strict settings), so failures just fall back to the default.
function loadSensitivity(): number {
  try {
    const saved = Number(localStorage.getItem(SENSITIVITY_STORAGE_KEY))
    if (saved >= SENSITIVITY_MIN && saved <= SENSITIVITY_MAX) return saved
  } catch {
    // ignore
  }
  return 1
}

function saveSensitivity(value: number) {
  try {
    localStorage.setItem(SENSITIVITY_STORAGE_KEY, String(value))
  } catch {
    // ignore
  }
}

// PROGRESS SAVING. If the page reloads (the browser put the tab to sleep, the connection
// to the development server dropped, F5...), the title screen offers to continue the
// earlier visit: rooms visited, tutorial step, position, and the Time Machine game's lit
// cores (so a finished game keeps the portal open). Kept in sessionStorage, which
// belongs to this tab only, so a new visit in a new tab starts fresh.
// Development build only: every room counts as visited, so the map can reach all of them
// (the portal is open too, see quizPassed) for testing.
const DEV_VISITED: RoomId[] = DEV_MODE ? ['hall', 'rotunda', 'ir1', 'ir2', 'ir3', 'ir4', 'quiz'] : []
const PROGRESS_STORAGE_KEY = 'inovat-progress'

export interface Pose {
  x: number
  z: number
  yaw: number
}

interface SavedProgress {
  visitedRooms: RoomId[]
  tutorial: TutorialStep | null
  pose: Pose
  gameCores?: number
  quizPassed?: boolean
  finished?: boolean // the ending was seen: continuing opens the map
}

function loadProgress(): SavedProgress | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PROGRESS_STORAGE_KEY) ?? 'null') as SavedProgress | null
    if (saved && Array.isArray(saved.visitedRooms) && typeof saved.pose?.x === 'number') return saved
  } catch {
    // ignore: start a new visit
  }
  return null
}

export function saveProgress(pose: Pose, finished = false) {
  const { visitedRooms, tutorial, gameCores, quizPassed } = useMuseumStore.getState()
  try {
    sessionStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ visitedRooms, tutorial, pose, gameCores, quizPassed, finished }))
  } catch {
    // ignore: storage blocked, progress is simply not kept
  }
}

// (Read again each time: after "Back to the title screen" the visit just left can be continued.)
export const hasSavedProgress = () => loadProgress() !== null

// Language of every text in the game, remembered in this browser (Vietnamese by default).
const LANGUAGE_STORAGE_KEY = 'inovat-language'

function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
    if (saved && LANGUAGES.includes(saved)) return saved
  } catch {
    // ignore
  }
  return 'vi'
}

function saveLanguage(value: Language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value)
  } catch {
    // ignore
  }
}


// SOUND SETTINGS (M8b): volumes (0-1), remembered in this browser. Only the main volume
// has a slider (0 = silent); effects and ambience keep their default balance.
export interface Volumes {
  master: number
  effects: number
  ambience: number
}
const SOUND_STORAGE_KEY = 'inovat-sound'
const DEFAULT_SOUND = { on: true, volumes: { master: 0.8, effects: 0.8, ambience: 0.7 } }

function loadSound(): { on: boolean; volumes: Volumes } {
  try {
    const saved = JSON.parse(localStorage.getItem(SOUND_STORAGE_KEY) ?? 'null') as { on: boolean; volumes: Volumes } | null
    if (saved && typeof saved.on === 'boolean' && typeof saved.volumes?.master === 'number') return saved
  } catch {
    // ignore
  }
  return DEFAULT_SOUND
}

function saveSound(on: boolean, volumes: Volumes) {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify({ on, volumes }))
  } catch {
    // ignore
  }
}

const savedSound = loadSound()

// GRAPHICS LEVEL (pause menu): 0 = very low ... 3 = high, 4 = ultra. What each level
// changes is in Museum.tsx (GRAPHICS_LEVELS). "Automatic" uses the level measured during
// loading (AdaptiveQuality); otherwise the visitor's own choice. Remembered in this browser.
export type GraphicsLevel = 0 | 1 | 2 | 3 | 4
export const GRAPHICS_LEVEL_MIN: GraphicsLevel = 1
export const GRAPHICS_LEVEL_MAX: GraphicsLevel = 3
const GRAPHICS_STORAGE_KEY = 'inovat-graphics'

function loadGraphics(): { auto: boolean; level: GraphicsLevel } {
  try {
    const saved = JSON.parse(localStorage.getItem(GRAPHICS_STORAGE_KEY) ?? 'null') as { auto: boolean; level: number } | null
    if (saved && typeof saved.auto === 'boolean' && Number.isInteger(saved.level) && saved.level >= 0 && saved.level <= GRAPHICS_LEVEL_MAX)
      return { auto: saved.auto, level: saved.level as GraphicsLevel }
  } catch {
    // ignore
  }
  return { auto: true, level: 3 }
}

function saveGraphics(auto: boolean, level: GraphicsLevel) {
  try {
    localStorage.setItem(GRAPHICS_STORAGE_KEY, JSON.stringify({ auto, level }))
  } catch {
    // ignore
  }
}

const savedGraphics = loadGraphics()

// The level actually drawn. Until the measurement during loading is done, always the
// automatic one (it starts at "high", the level the measurement is made at).
// Only low (1), medium (2) and high (3) are offered (leader): "very low" and "ultra" are
// no longer used, so older saved choices are brought into that range.
function drawnLevel(state: { graphicsAuto: boolean; qualityChosen: boolean; autoGraphics: GraphicsLevel; graphicsChoice: GraphicsLevel }) {
  const level = state.graphicsAuto || !state.qualityChosen ? state.autoGraphics : state.graphicsChoice
  return Math.min(GRAPHICS_LEVEL_MAX, Math.max(GRAPHICS_LEVEL_MIN, level)) as GraphicsLevel
}

// GUIDED TUTORIAL (optional, chosen on the start screen). Each step unlocks one more control:
// intro (everything frozen) -> look -> move -> sprint -> interact -> map -> pause -> keys -> enjoy
// (a goodbye card that closes by itself) -> done.
export type TutorialStep = 'intro' | 'look' | 'move' | 'sprint' | 'interact' | 'map' | 'pause' | 'keys' | 'enjoy' | 'done'
// Phones and tablets skip "keys": their controls are on screen, so they have no key list.
export const TUTORIAL_STEPS: TutorialStep[] = (['intro', 'look', 'move', 'sprint', 'interact', 'map', 'pause', 'keys', 'enjoy', 'done'] as TutorialStep[]).filter(
  (step) => !(IS_TOUCH && step === 'keys'),
)
export type Control = 'look' | 'move' | 'sprint' | 'interact' | 'map' | 'keys'

// May this control be used now? Always, unless the tutorial has not reached it yet.
// (Development build: always, so every part of the game can be reached for testing; the
// tutorial cards still show and advance.)
export function canUse(tutorial: TutorialStep | null, control: Control): boolean {
  return DEV_MODE || tutorial === null || TUTORIAL_STEPS.indexOf(tutorial) >= TUTORIAL_STEPS.indexOf(control)
}

interface MuseumState {
  mode: Mode
  setMode: (mode: Mode) => void
  // LOADING. Each part of the museum (rotunda + 6 rooms) counts itself once its pictures
  // are loaded and sent to the graphics card and its drawing code is built. worldReady =
  // everything is done (the loading screen then gives way to the title screen).
  partsPrepared: number
  markPartPrepared: () => void
  warmedUp: boolean // the whole museum has been drawn once off-screen (Museum.tsx WarmUp)
  // GRAPHICS (see GraphicsLevel above). graphicsLevel = the level drawn now.
  graphicsLevel: GraphicsLevel
  graphicsAuto: boolean // "Automatic" is on in the pause menu
  graphicsChoice: GraphicsLevel // the visitor's own level, used when automatic is off
  autoGraphics: GraphicsLevel // the level measured during loading (Museum.tsx AdaptiveQuality)
  setAutoGraphics: (level: GraphicsLevel) => void
  setGraphicsChoice: (level: GraphicsLevel) => void // also turns automatic off
  setGraphicsAuto: (on: boolean) => void
  qualityChosen: boolean // the quality was measured and set during loading (Museum.tsx)
  setQualityChosen: () => void
  setWarmedUp: () => void
  // The ending film's world is built and prepared ahead (EndingScene.tsx); the loading screen
  // waits for it, so building it never freezes the title screen or the visit.
  endingPrepared: boolean
  setEndingPrepared: () => void
  worldReady: boolean
  setWorldReady: () => void
  // Called when the mouse is captured: back to walking, any open panel is closed.
  startExploring: () => void

  mouseSensitivity: number
  language: Language
  setLanguage: (value: Language) => void
  volumes: Volumes
  setVolume: (which: keyof Volumes, value: number) => void
  setMouseSensitivity: (value: number) => void

  // True when a Vietnamese typing tool (Unikey/EVKey) seems to be eating our keys.
  typingToolWarning: boolean
  setTypingToolWarning: (show: boolean) => void

  // Exhibit under the crosshair (within reach), and the one whose panel is open.
  aimedExhibitId: string | null
  setAimedExhibit: (id: string | null) => void
  openExhibitId: string | null
  openExhibit: (id: string) => void

  // Room the visitor is standing in (shown on screen and highlighted in the map).
  currentRoom: RoomId
  setCurrentRoom: (room: RoomId) => void

  // Era rooms entered so far. All four unlock the quiz room.
  visitedRooms: RoomId[]
  markVisited: (room: RoomId) => void
  // True while standing near the (still locked) quiz-room door, to show why it stays shut.
  nearLockedDoor: boolean
  setNearLockedDoor: (near: boolean) => void

  // Current tutorial step, or null when there is no tutorial (declined or finished).
  tutorial: TutorialStep | null
  setTutorial: (step: TutorialStep | null) => void
  // Go to the next step, but only if we are still on `from` (so repeated events are harmless).
  advanceTutorial: (from: TutorialStep) => void

  // Map teleport: `count` goes up on every request, so the player knows a new one arrived.
  // pose: stand exactly there instead of at the room's arrival point.
  teleport: { roomId: RoomId; count: number; pose?: Pose }
  requestTeleport: (roomId: RoomId, pose?: Pose) => void

  // Title screen "continue": bring back the visit saved before the reload.
  continueSavedVisit: () => void
  // Back to the title screen from the pause menu, ready for a new visit (or to continue).
  backToTitle: () => void
  // After the ending: the visit is saved as completed (every room, all cores, the portal
  // open), standing in front of the portal, and the title screen shows.
  finishVisit: () => void
  // Set when a completed visit is continued: the map opens, to invite another tour.
  mapOnContinue: boolean

  // Is the mouse captured? (Walking also works without it, keyboard only, e.g. after
  // resuming with Esc, which browsers do not accept for capturing the mouse.)
  mouseCaptured: boolean
  setMouseCaptured: (captured: boolean) => void

  // The key list (Space) is showing.
  showKeyList: boolean
  toggleKeyList: () => void

  // THE TIME MACHINE GAME (TimeMachineGame.tsx), opened from the Game Room's lectern.
  // gameCores = power cores lit so far (0-4, one per round, in order).
  gameCores: number
  openGame: () => void
  lightCore: (round: number) => void
  // The best stars earned on each core (0 = not yet). Kept for this visit only.
  coreStars: number[]
  setCoreStars: (round: number, stars: number) => void
  // The core being played, saved here (not in the game window) so the visitor can leave to
  // look around the rooms and come back to exactly where they were. null = none in progress.
  gameRun: GameRun | null
  setGameRun: (run: GameRun | null) => void
  patchGameRun: (change: Partial<GameRun>) => void
  // The visitor left the game to look around the rooms (a button brings them back).
  awayFromGame: boolean
  setAwayFromGame: (away: boolean) => void
  quizPassed: boolean // all four cores lit: the portal door in the back wall opens

  // THE ENDING (EndingScene.tsx, EndingScreen.tsx), after walking into the open portal.
  // endingRun goes up on every start, so the flight starts again from the beginning;
  // endingStage: 0 = before the film, 1-4 = that era's act, 5 = the finale, 6 = the closing title.
  endingRun: number
  endingStage: number
  startEnding: () => void
  setEndingStage: (stage: number) => void
}

export const useMuseumStore = create<MuseumState>((set, get) => ({
  mode: 'start',
  setMode: (mode) => set({ mode }),
  partsPrepared: 0,
  markPartPrepared: () => set((state) => ({ partsPrepared: state.partsPrepared + 1 })),
  warmedUp: false,
  graphicsLevel: 3,
  graphicsAuto: savedGraphics.auto,
  graphicsChoice: savedGraphics.level,
  autoGraphics: 3,
  setAutoGraphics: (level) =>
    set((state) => ({ autoGraphics: level, graphicsLevel: drawnLevel({ ...state, autoGraphics: level }) })),
  setGraphicsChoice: (level) => {
    saveGraphics(false, level)
    set((state) => ({ graphicsAuto: false, graphicsChoice: level, graphicsLevel: drawnLevel({ ...state, graphicsAuto: false, graphicsChoice: level }) }))
  },
  setGraphicsAuto: (on) =>
    set((state) => {
      saveGraphics(on, state.graphicsChoice)
      return { graphicsAuto: on, graphicsLevel: drawnLevel({ ...state, graphicsAuto: on }) }
    }),
  qualityChosen: false,
  setQualityChosen: () => set((state) => ({ qualityChosen: true, graphicsLevel: drawnLevel({ ...state, qualityChosen: true }) })),
  setWarmedUp: () => set({ warmedUp: true }),
  endingPrepared: false,
  setEndingPrepared: () => set({ endingPrepared: true }),
  worldReady: false,
  setWorldReady: () => set({ worldReady: true }),
  // A finished tutorial ends when the visitor resumes from the pause menu.
  startExploring: () =>
    set((state) => ({ mode: 'exploring', openExhibitId: null, tutorial: state.tutorial === 'done' ? null : state.tutorial })),

  mouseSensitivity: loadSensitivity(),
  volumes: savedSound.volumes,
  setVolume: (which, value) =>
    set((state) => {
      const volumes = { ...state.volumes, [which]: value }
      saveSound(true, volumes)
      return { volumes }
    }),
  language: loadLanguage(),
  setLanguage: (value) => {
    saveLanguage(value)
    set({ language: value })
  },
  setMouseSensitivity: (value) => {
    saveSensitivity(value)
    set({ mouseSensitivity: value })
  },

  typingToolWarning: false,
  setTypingToolWarning: (show) => set({ typingToolWarning: show }),

  aimedExhibitId: null,
  setAimedExhibit: (id) => set({ aimedExhibitId: id }),
  openExhibitId: null,
  openExhibit: (id) => set({ mode: 'reading', openExhibitId: id, aimedExhibitId: null }),

  currentRoom: 'hall',
  setCurrentRoom: (room) => set({ currentRoom: room }),

  visitedRooms: DEV_VISITED,
  markVisited: (room) =>
    set((state) => (state.visitedRooms.includes(room) ? state : { visitedRooms: [...state.visitedRooms, room] })),
  nearLockedDoor: false,
  setNearLockedDoor: (near) => set({ nearLockedDoor: near }),

  tutorial: null,
  setTutorial: (step) => set({ tutorial: step }),
  advanceTutorial: (from) =>
    set((state) => {
      if (state.tutorial !== from) return state
      return { tutorial: TUTORIAL_STEPS[TUTORIAL_STEPS.indexOf(from) + 1] ?? null }
    }),

  teleport: { roomId: 'hall', count: 0 },
  requestTeleport: (roomId, pose) => set((state) => ({ teleport: { roomId, pose, count: state.teleport.count + 1 } })),

  mouseCaptured: false,
  setMouseCaptured: (captured) => set({ mouseCaptured: captured }),

  showKeyList: false,
  toggleKeyList: () => set((state) => ({ showKeyList: !state.showKeyList })),

  gameCores: 0,
  openGame: () => set({ mode: 'game', aimedExhibitId: null, showKeyList: false }),
  lightCore: (round) =>
    set((state) => {
      const gameCores = Math.max(state.gameCores, round + 1)
      return { gameCores, quizPassed: state.quizPassed || gameCores >= 4 }
    }),
  coreStars: [0, 0, 0, 0],
  setCoreStars: (round, stars) =>
    set((state) => ({ coreStars: state.coreStars.map((s, i) => (i === round ? Math.max(s, stars) : s)) })),
  gameRun: null,
  setGameRun: (run) => set({ gameRun: run }),
  awayFromGame: false,
  setAwayFromGame: (away) => set({ awayFromGame: away }),
  patchGameRun: (change) => set((state) => (state.gameRun ? { gameRun: { ...state.gameRun, ...change } } : state)),
  // (Local test build only: the portal starts open, to try the ending. Never on the live site.)
  quizPassed: DEV_MODE,

  endingRun: 0,
  endingStage: 0,
  startEnding: () => set((state) => ({ mode: 'ending', endingRun: state.endingRun + 1, endingStage: 0, aimedExhibitId: null, showKeyList: false })),
  setEndingStage: (stage) => set({ endingStage: stage }),

  continueSavedVisit: () =>
    set((state) => {
      const savedProgress = loadProgress()
      if (!savedProgress) return state
      const gameCores = Math.max(state.gameCores, savedProgress.gameCores ?? 0)
      return {
        // (Development build: every room stays visited, whatever the saved visit says.)
        visitedRooms: [...new Set([...DEV_VISITED, ...savedProgress.visitedRooms])],
        tutorial: savedProgress.tutorial,
        gameCores,
        quizPassed: state.quizPassed || savedProgress.quizPassed === true || gameCores >= 4,
        mapOnContinue: savedProgress.finished === true,
        teleport: { roomId: state.teleport.roomId, pose: savedProgress.pose, count: state.teleport.count + 1 },
      }
    }),
  // A fresh visit from the hall: no rooms visited, no cores lit, portal closed (open in the
  // development build). The visit just left stays saved, so "Continue" can bring it back.
  mapOnContinue: false,
  finishVisit: () => {
    set({ visitedRooms: ['hall', 'rotunda', 'ir1', 'ir2', 'ir3', 'ir4', 'quiz'], gameCores: 4, quizPassed: true, tutorial: null })
    // A few steps in front of the portal, facing it.
    const room = roomById('quiz')
    if (room) {
      const [x, z] = toWorld(room.frame, 0, room.vBack - 3.5)
      const [dx, dz] = toWorld(room.frame, 0, room.vBack)
      saveProgress({ x, z, yaw: Math.atan2(-(dx - x), -(dz - z)) }, true)
    }
    get().backToTitle()
  },
  backToTitle: () =>
    set((state) => ({
      mode: 'start',
      visitedRooms: DEV_VISITED,
      tutorial: null,
      gameCores: 0,
      coreStars: [0, 0, 0, 0],
      gameRun: null,
      awayFromGame: false,
      quizPassed: DEV_MODE,
      aimedExhibitId: null,
      showKeyList: false,
      teleport: { roomId: 'hall', pose: undefined, count: state.teleport.count + 1 },
    })),
}))

// How many era rooms have been visited, and whether the quiz room is open.
export function eraRoomsVisited(visited: RoomId[]): number {
  return ERA_ROOMS.filter((room) => visited.includes(room)).length
}

export function isQuizUnlocked(visited: RoomId[]): boolean {
  return eraRoomsVisited(visited) === ERA_ROOMS.length
}
