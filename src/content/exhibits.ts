// Exhibit texts. PLACEHOLDERS ONLY until the group's content document is ready (PLAN.md
// Phase D). Real texts will replace these and must each cite a real source.

export interface ExhibitText {
  title: string
  summary: string // 1-2 sentences, shown when aiming at the exhibit
  body: string // full panel text
  placeholder: boolean // true until real, sourced content replaces it
}

const PLACEHOLDER_NOTE = '[CẦN KIỂM TRA]'

function placeholder(title: string, summary: string): ExhibitText {
  return {
    title,
    summary,
    body: `Nội dung đang được nhóm biên soạn và sẽ được bổ sung sau. ${PLACEHOLDER_NOTE}`,
    placeholder: true,
  }
}

const texts: Record<string, ExhibitText> = {
  // Introduction hall: one wall panel per section (PLAN.md section 1).
  'hall-intro': placeholder('Giới thiệu', `Lời giới thiệu về bảo tàng. ${PLACEHOLDER_NOTE}`),
  'hall-overview': placeholder(
    'Tổng quan',
    `Tổng quan về bốn cuộc Cách mạng Công nghiệp và lộ trình tham quan. ${PLACEHOLDER_NOTE}`,
  ),
  'hall-team': placeholder('Nhóm thực hiện', `Các thành viên và vai trò. ${PLACEHOLDER_NOTE}`),
  'hall-credits': placeholder('Ghi công', `Hình ảnh, mô hình và công cụ đã sử dụng. ${PLACEHOLDER_NOTE}`),
  'hall-sources': placeholder('Nguồn tham khảo', `Danh sách tài liệu tham khảo. ${PLACEHOLDER_NOTE}`),

  // Quiz room: the quiz itself arrives in M7.
  'quiz-info': placeholder('Phòng trò chơi', `Trò chơi câu hỏi sẽ được đặt tại đây. ${PLACEHOLDER_NOTE}`),
}

// Era rooms: 4 inventions each, one per corner (ids "ir1-1" ... "ir4-4").
for (let era = 1; era <= 4; era++) {
  for (let slot = 1; slot <= 4; slot++) {
    texts[`ir${era}-${slot}`] = placeholder(
      `Phát minh ${slot} – CMCN ${era}`,
      `Phát minh tiêu biểu số ${slot} của cuộc Cách mạng Công nghiệp lần thứ ${era}. ${PLACEHOLDER_NOTE}`,
    )
  }
}

export function getExhibitText(id: string): ExhibitText {
  return texts[id] ?? placeholder(id, PLACEHOLDER_NOTE)
}
