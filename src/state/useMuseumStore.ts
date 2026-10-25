import { create } from 'zustand'
import { ERA_ROOMS, type RoomId } from '../types'
import { LANGUAGES, type Language } from '../content/language'
import { QUIZ_QUESTIONS } from '../content/quiz'

// The app is always in exactly one mode (PLAN.md section 3). Only in "exploring"
// is the mouse captured and walking allowed. (The quiz is played while exploring: it is
// shown on the Game Room's back wall, see QuizWall.tsx.)
export type Mode = 'start' | 'exploring' | 'paused' | 'reading' | 'map'

// Mouse/touchpad sensitivity is a multiplier: 1 = default speed.
export const SENSITIVITY_MIN = 0.2
export const SENSITIVITY_MAX = 3
const SENSITIVITY_STORAGE_KEY = 'innova-mouse-sensitivity'

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
// earlier visit: rooms visited, tutorial step, position. Kept in sessionStorage, which
// belongs to this tab only, so a new visit in a new tab starts fresh.
const PROGRESS_STORAGE_KEY = 'innova-progress'

export interface Pose {
  x: number
  z: number
  yaw: number
}

interface SavedProgress {
  visitedRooms: RoomId[]
  tutorial: TutorialStep | null
  pose: Pose
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

export function saveProgress(pose: Pose) {
  const { visitedRooms, tutorial } = useMuseumStore.getState()
  try {
    sessionStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ visitedRooms, tutorial, pose }))
  } catch {
    // ignore: storage blocked, progress is simply not kept
  }
}

const savedProgress = loadProgress()
export const hasSavedProgress = savedProgress !== null

// Language of every text in the game, remembered in this browser (Vietnamese by default).
const LANGUAGE_STORAGE_KEY = 'innova-language'

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

export type QuizStage = 'idle' | 'question' | 'results'

// SOUND SETTINGS (M8b): volumes (0-1), remembered in this browser. Only the main volume
// has a slider (0 = silent); effects and ambience keep their default balance.
export interface Volumes {
  master: number
  effects: number
  ambience: number
}
const SOUND_STORAGE_KEY = 'innova-sound'
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

// GUIDED TUTORIAL (optional, chosen on the start screen). Each step unlocks one more control:
// intro (everything frozen) -> look -> move -> sprint -> interact -> map -> pause -> keys -> done.
export type TutorialStep = 'intro' | 'look' | 'move' | 'sprint' | 'interact' | 'map' | 'pause' | 'keys' | 'done'
export const TUTORIAL_STEPS: TutorialStep[] = ['intro', 'look', 'move', 'sprint', 'interact', 'map', 'pause', 'keys', 'done']
export type Control = 'look' | 'move' | 'sprint' | 'interact' | 'map' | 'keys'

// May this control be used now? Always, unless the tutorial has not reached it yet.
export function canUse(tutorial: TutorialStep | null, control: Control): boolean {
  return tutorial === null || TUTORIAL_STEPS.indexOf(tutorial) >= TUTORIAL_STEPS.indexOf(control)
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
  // Automatic graphics level (Museum.tsx AdaptiveResolution): 2 = everything, 1 = no
  // ambient occlusion, 0 = also shadows only redrawn when the key light moves.
  graphicsLevel: 0 | 1 | 2
  lowerGraphics: () => void
  setWarmedUp: () => void
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

  // Is the mouse captured? (Walking also works without it, keyboard only, e.g. after
  // resuming with Esc, which browsers do not accept for capturing the mouse.)
  mouseCaptured: boolean
  setMouseCaptured: (captured: boolean) => void

  // The key list (Space) is showing.
  showKeyList: boolean
  toggleKeyList: () => void

  // QUIZ on the Game Room's back wall. Stage: idle (start button), question, results.
  // quizAnswers[i] = option chosen for question i (0-3), or null. An answer locks once chosen.
  quizStage: QuizStage
  quizIndex: number
  quizAnswers: (number | null)[]
  startQuiz: () => void
  answerQuiz: (choice: number) => void
  nextQuizQuestion: () => void // to the next question, or to the results after the last
}

export const useMuseumStore = create<MuseumState>((set) => ({
  mode: 'start',
  setMode: (mode) => set({ mode }),
  partsPrepared: 0,
  markPartPrepared: () => set((state) => ({ partsPrepared: state.partsPrepared + 1 })),
  warmedUp: false,
  graphicsLevel: 2,
  lowerGraphics: () => set((state) => ({ graphicsLevel: Math.max(0, state.graphicsLevel - 1) as 0 | 1 | 2 })),
  setWarmedUp: () => set({ warmedUp: true }),
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

  visitedRooms: [],
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

  quizStage: 'idle',
  quizIndex: 0,
  quizAnswers: [],
  startQuiz: () => set({ quizStage: 'question', quizIndex: 0, quizAnswers: QUIZ_QUESTIONS.map(() => null) }),
  answerQuiz: (choice) =>
    set((state) => {
      if (state.quizStage !== 'question' || state.quizAnswers[state.quizIndex] !== null) return state // locked
      const quizAnswers = [...state.quizAnswers]
      quizAnswers[state.quizIndex] = choice
      return { quizAnswers }
    }),
  nextQuizQuestion: () =>
    set((state) => {
      if (state.quizStage !== 'question' || state.quizAnswers[state.quizIndex] === null) return state // answer first
      const next = state.quizIndex + 1
      return next < QUIZ_QUESTIONS.length ? { quizIndex: next } : { quizStage: 'results' }
    }),

  continueSavedVisit: () =>
    set((state) => {
      if (!savedProgress) return state
      return {
        visitedRooms: savedProgress.visitedRooms,
        tutorial: savedProgress.tutorial,
        teleport: { roomId: state.teleport.roomId, pose: savedProgress.pose, count: state.teleport.count + 1 },
      }
    }),
}))

// How many era rooms have been visited, and whether the quiz room is open.
export function eraRoomsVisited(visited: RoomId[]): number {
  return ERA_ROOMS.filter((room) => visited.includes(room)).length
}

export function isQuizUnlocked(visited: RoomId[]): boolean {
  return eraRoomsVisited(visited) === ERA_ROOMS.length
}
