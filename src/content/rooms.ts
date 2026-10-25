import type { RoomId } from '../types'
import type { Language } from './language'

// Room names shown on screen, on door signs and in the map (names from PLAN.md section 1).
type RoomNames = Record<RoomId, { name: string; short: string }>

const vi: RoomNames = {
  rotunda: { name: 'Sảnh trung tâm', short: 'Sảnh trung tâm' },
  hall: { name: 'Sảnh giới thiệu', short: 'Sảnh giới thiệu' },
  ir1: { name: 'Cách mạng Công nghiệp lần thứ nhất', short: 'CMCN 1' },
  ir2: { name: 'Cách mạng Công nghiệp lần thứ hai', short: 'CMCN 2' },
  ir3: { name: 'Cách mạng Công nghiệp lần thứ ba', short: 'CMCN 3' },
  ir4: { name: 'Cách mạng Công nghiệp lần thứ tư', short: 'CMCN 4' },
  quiz: { name: 'Phòng trò chơi', short: 'Phòng trò chơi' },
}

const en: RoomNames = {
  rotunda: { name: 'Central Hall', short: 'Central Hall' },
  hall: { name: 'Introduction Hall', short: 'Introduction Hall' },
  ir1: { name: 'First Industrial Revolution', short: 'IR 1' },
  ir2: { name: 'Second Industrial Revolution', short: 'IR 2' },
  ir3: { name: 'Third Industrial Revolution', short: 'IR 3' },
  ir4: { name: 'Fourth Industrial Revolution', short: 'IR 4' },
  quiz: { name: 'Game Room', short: 'Game Room' },
}

export const roomNamesText: Record<Language, RoomNames> = { vi, en }
