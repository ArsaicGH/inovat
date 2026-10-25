import { create } from 'zustand'
import { ERA_ROOMS, type RoomId } from '../types'

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

// GUIDED TUTORIAL (optional, chosen on the start screen). Each step unlocks one more control:
// intro (everything frozen) -> look -> move -> interact -> map -> pause -> done.
export type TutorialStep = 'intro' | 'look' | 'move' | 'interact' | 'map' | 'pause' | 'done'
export const TUTORIAL_STEPS: TutorialStep[] = ['intro', 'look', 'move', 'interact', 'map', 'pause', 'done']
export type Control = 'look' | 'move' | 'interact' | 'map'

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
  teleport: { roomId: RoomId; count: number }
  requestTeleport: (roomId: RoomId) => void
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
  requestTeleport: (roomId) => set((state) => ({ teleport: { roomId, count: state.teleport.count + 1 } })),
}))

// How many era rooms have been visited, and whether the quiz room is open.
export function eraRoomsVisited(visited: RoomId[]): number {
  return ERA_ROOMS.filter((room) => visited.includes(room)).length
}

export function isQuizUnlocked(visited: RoomId[]): boolean {
  return eraRoomsVisited(visited) === ERA_ROOMS.length
}
