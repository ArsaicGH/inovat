import type { RoomId } from '../types'

// MUSEUM STYLE GUIDE (colours used by the 3D world). See README.md "Style guide".
// One accent colour per room, used for prototypes, trims and light; neutrals are shared.

export const ROOM_ACCENT: Record<RoomId, string> = {
  rotunda: '#c9a25a', // gold
  hall: '#c98a3c', // warm amber
  ir1: '#b5763a', // copper and brass: steam age
  ir2: '#8f9aa6', // steel: electricity and mass production
  ir3: '#d9c7a0', // beige plastic: computers
  ir4: '#3fd0e0', // cyan light: digital and smart technology
  quiz: '#e05a8a', // playful pink
}

// Text board sizes in metres (width, height, including the wooden frame). The on-screen
// enlargement (InfoPanel.tsx) uses the same proportions, so it looks like the same board.
export const BOARD_SIZE = {
  wall: [2.2, 1.5],
  stand: [1.4, 1.9],
} as const
export const BOARD_FRAME = 0.06

export const GOLD = '#c9a25a'
export const DARK_WOOD = '#4a3423'
export const PAPER = '#f2ece0'
export const INK = '#2b2620'
