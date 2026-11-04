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
  stand: [1.4, 2.2], // (taller than it was, to fit the exhibit's picture under the text)
  overview: [2.4, 1.75], // the overview board in each era room's entrance room (with its picture beside the text)
} as const

// TEXT BOARD STYLES: each era room dresses its boards like the room itself. The same
// colours paint the 3D board (PanelBoard.tsx) and its on-screen enlargement (InfoPanel.tsx).
// classic  = wooden frame, cream paper (hall, rotunda, quiz room)
// screen   = CMCN 1-3: a dark board with glowing letters and a thin glowing edge, in the
//            era's colour (amber, electric blue, green; leader: room 3's look is the best,
//            the other rooms take it in their own colours), with the era's own stand
// hologram = CMCN 4: floating glass with glowing cyan text
// (brass and enamel: the earlier CMCN 1 and 2 boards, kept for their stands.)
export type BoardLook = 'classic' | 'brass' | 'enamel' | 'screen' | 'hologram'

export interface BoardTheme {
  look: BoardLook
  paper: string // board background
  title: string // title text
  ink: string // summary and main text
  muted: string // source line
  rule: string // short line under the title, borders
  frame: string // frame / case colour
  glow?: string // the glow's colour as "r, g, b" (the screen and hologram looks)
  tint?: string // how a photo is tinted on the board in the room, to match the era's colours
  stand?: BoardLook // the stand's style, if not the board's own
}

const CLASSIC: BoardTheme = {
  look: 'classic',
  paper: '#f2ece0',
  title: '#2b2620',
  ink: '#3a332b',
  muted: '#6b6152',
  rule: '#b08a4a',
  frame: '#4a3423',
}

export const BOARD_THEMES: Record<RoomId, BoardTheme> = {
  rotunda: CLASSIC,
  hall: CLASSIC,
  quiz: CLASSIC,
  // Amber on a dark bronze board, on the brass stand (photos in amber, like old sepia prints).
  ir1: { look: 'screen', stand: 'brass', paper: '#1a120a', title: '#ffc978', ink: '#e09a3e', muted: '#a8743c', rule: '#e0a050', frame: '#21170d', glow: '224, 160, 80', tint: 'grayscale(1) sepia(1) saturate(1.7) brightness(0.9)' },
  // Electric blue on a dark navy board, on the steel posts (leader: room 2 is blue).
  ir2: { look: 'screen', stand: 'enamel', paper: '#0b1424', title: '#bcd8ff', ink: '#6fa3ea', muted: '#5577a8', rule: '#4f86d1', frame: '#111a29', glow: '79, 134, 209', tint: 'grayscale(1) sepia(1) hue-rotate(180deg) saturate(2.2) brightness(0.9)' },
  // A dark screen with a thin neon-green edge, like the enlarged board (leader: no beige case).
  ir3: { look: 'screen', paper: '#0e1a12', title: '#a8ffbf', ink: '#6be08b', muted: '#3f9a5c', rule: '#6be08b', frame: '#151d18', glow: '107, 224, 139', tint: 'grayscale(1) sepia(1) hue-rotate(75deg) saturate(2.4) brightness(0.85)' },
  // (Nearly opaque: see-through glass made the text hard to read; a little more so again, leader.)
  ir4: { look: 'hologram', paper: 'rgba(6, 34, 46, 0.97)', title: '#e6fdff', ink: '#aef3ff', muted: '#6fd3e6', rule: '#3fd0e0', frame: '#3fd0e0', glow: '63, 208, 224', tint: 'grayscale(1) sepia(1) hue-rotate(150deg) saturate(2.2) brightness(0.75)' },
}
export const BOARD_FRAME = 0.06

// The four quiz-show colours (A, B, C, D): the Game Room's tiles, bulbs and stage lights,
// and the answer buttons of the quiz screen.
export const QUIZ_COLOURS = ['#e05a8a', '#3f8ff5', '#f5b13f', '#3fc47f']

export const GOLD = '#c9a25a'
export const DARK_WOOD = '#4a3423'
export const PAPER = '#f2ece0'
export const INK = '#2b2620'
