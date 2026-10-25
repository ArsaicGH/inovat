import type { RoomId } from '../types'

// Room names shown on screen, on door signs and in the map (names from PLAN.md section 1).
export const roomNames: Record<RoomId, { name: string; short: string }> = {
  rotunda: { name: 'Sảnh trung tâm', short: 'Sảnh trung tâm' },
  hall: { name: 'Sảnh giới thiệu', short: 'Sảnh giới thiệu' },
  ir1: { name: 'Cách mạng Công nghiệp lần thứ nhất', short: 'CMCN 1' },
  ir2: { name: 'Cách mạng Công nghiệp lần thứ hai', short: 'CMCN 2' },
  ir3: { name: 'Cách mạng Công nghiệp lần thứ ba', short: 'CMCN 3' },
  ir4: { name: 'Cách mạng Công nghiệp lần thứ tư', short: 'CMCN 4' },
  quiz: { name: 'Phòng trò chơi', short: 'Phòng trò chơi' },
}
