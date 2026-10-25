import { create } from 'zustand'

// The app is always in exactly one mode (PLAN.md section 3). Only in "exploring"
// is the mouse captured and walking allowed. More modes are added in later milestones.
export type Mode = 'start' | 'exploring' | 'paused'

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

interface MuseumState {
  mode: Mode
  setMode: (mode: Mode) => void
  mouseSensitivity: number
  setMouseSensitivity: (value: number) => void
  // True when a Vietnamese typing tool (Unikey/EVKey) seems to be eating our keys.
  typingToolWarning: boolean
  setTypingToolWarning: (show: boolean) => void
}

export const useMuseumStore = create<MuseumState>((set) => ({
  mode: 'start',
  setMode: (mode) => set({ mode }),
  mouseSensitivity: loadSensitivity(),
  setMouseSensitivity: (value) => {
    saveSensitivity(value)
    set({ mouseSensitivity: value })
  },
  typingToolWarning: false,
  setTypingToolWarning: (show) => set({ typingToolWarning: show }),
}))
