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
// brass    = CMCN 1: aged parchment in a riveted brass frame, cast-iron stand
// enamel   = CMCN 2: white enamel factory sign with a navy border, steel frame and posts
// screen   = CMCN 3: green-on-black computer screen in a beige plastic case
// hologram = CMCN 4: see-through floating glass with glowing cyan text
export type BoardLook = 'classic' | 'brass' | 'enamel' | 'screen' | 'hologram'

export interface BoardTheme {
  look: BoardLook
  paper: string // board background
  title: string // title text
  ink: string // summary and main text
  muted: string // source line
  rule: string // short line under the title, borders
  frame: string // frame / case colour
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
  ir1: { look: 'brass', paper: '#e8d9b5', title: '#3b2414', ink: '#4a3220', muted: '#7a5c3a', rule: '#8a5a2b', frame: '#a87a3a' },
  // White enamel with a navy border, the room's electric blue (leader: room 2 is blue).
  ir2: { look: 'enamel', paper: '#f1eee6', title: '#1d3557', ink: '#22303f', muted: '#4f6378', rule: '#2f5d8a', frame: '#1d3557' },
  ir3: { look: 'screen', paper: '#0e1a12', title: '#a8ffbf', ink: '#6be08b', muted: '#3f9a5c', rule: '#6be08b', frame: '#d9cdb0' },
  ir4: { look: 'hologram', paper: 'rgba(6, 34, 46, 0.93)' /* nearly opaque: see-through glass made the text hard to read (leader) */, title: '#e6fdff', ink: '#aef3ff', muted: '#6fd3e6', rule: '#3fd0e0', frame: '#3fd0e0' },
}
export const BOARD_FRAME = 0.06

// The four quiz-show colours (A, B, C, D): the Game Room's tiles, bulbs and stage lights,
// and the answer buttons of the quiz screen.
export const QUIZ_COLOURS = ['#e05a8a', '#3f8ff5', '#f5b13f', '#3fc47f']

export const GOLD = '#c9a25a'
export const DARK_WOOD = '#4a3423'
export const PAPER = '#f2ece0'
export const INK = '#2b2620'
