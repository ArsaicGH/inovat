import type { Language } from './language'

// THE TEAM, shown on the intro hall's team board in both languages.
export const TEAM: { name: string; role: Record<Language, string> }[] = [
  { name: 'Nguyễn Hoàng', role: { vi: 'Trưởng nhóm · Định hướng và thiết kế toàn bộ trải nghiệm: hình ảnh, âm thanh, giao diện và lối chơi', en: 'Team leader · Direction and design of the whole experience: visuals, sound, interface and gameplay' } },
  { name: 'Nguyễn Phúc Khánh Linh', role: { vi: 'Nghiên cứu và biên soạn nội dung', en: 'Content research and writing' } },
  { name: 'Đỗ Minh Hải', role: { vi: 'Thiết kế trò chơi; thiết kế bố cục phòng và hiện vật', en: 'Game design; room and exhibit layout' } },
  { name: 'Lê Khôi Nguyên', role: { vi: 'Góp ý và hoàn thiện', en: 'Feedback and polish' } },
  { name: 'Ngô Quang Anh', role: { vi: 'Góp ý và hoàn thiện', en: 'Feedback and polish' } },
]
