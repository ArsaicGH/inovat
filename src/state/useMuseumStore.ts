import { create } from 'zustand'
import { ERA_ROOMS, type RoomId } from '../types'
import { LANGUAGES, type Language } from '../content/language'

// The app is always in exactly one mode (PLAN.md section 3). Only in "exploring"
// is the mouse captured and walking allowed. "quiz" and "results" come with M7.
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
  // True once the museum has loaded and drawn its first frames (the black cover then fades).
  worldReady: boolean
  setWorldReady: () => void
  // Called when the mouse is captured: back to walking, any open panel is closed.
  startExploring: () => void

  mouseSensitivity: number
  language: Language
  setLanguage: (value: Language) => void
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
}

export const useMuseumStore = create<MuseumState>((set) => ({
  mode: 'start',
  setMode: (mode) => set({ mode }),
  worldReady: false,
  setWorldReady: () => set({ worldReady: true }),
  // A finished tutorial ends when the visitor resumes from the pause menu.
  startExploring: () =>
    set((state) => ({ mode: 'exploring', openExhibitId: null, tutorial: state.tutorial === 'done' ? null : state.tutorial })),

  mouseSensitivity: loadSensitivity(),
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
