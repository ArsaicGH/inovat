import type { Language } from './language'

// Exhibit texts, in both languages. PLACEHOLDERS ONLY until the group's content document
// is ready (PLAN.md Phase D). Real texts will replace these, in BOTH languages at once,
// and must each cite a real source.

export interface ExhibitText {
  title: string
  summary: string // 1-2 sentences, shown when aiming at the exhibit
  body: string // full panel text
  placeholder: boolean // true until real, sourced content replaces it
}

// Marks text that still has to be written or checked.
const NOTE: Record<Language, string> = { vi: '[CẦN KIỂM TRA]', en: '[NEEDS CHECKING]' }
const BODY: Record<Language, string> = {
  vi: 'Nội dung đang được nhóm biên soạn và sẽ được bổ sung sau.',
  en: 'This content is being written by the team and will be added later.',
}

function placeholder(lang: Language, title: string, summary: string): ExhibitText {
  return { title, summary: `${summary} ${NOTE[lang]}`, body: `${BODY[lang]} ${NOTE[lang]}`, placeholder: true }
}

// "lần thứ nhất" / "First": ordinal words for the four revolutions.
const ORDINAL: Record<Language, string[]> = {
  vi: ['nhất', 'hai', 'ba', 'tư'],
  en: ['First', 'Second', 'Third', 'Fourth'],
}

function buildTexts(lang: Language): Record<string, ExhibitText> {
  const vi = lang === 'vi'
  const p = (title: string, summary: string) => placeholder(lang, title, summary)
  const texts: Record<string, ExhibitText> = {
    // Introduction hall: one wall panel per section (PLAN.md section 1).
    'hall-intro': vi ? p('Giới thiệu', 'Lời giới thiệu về bảo tàng.') : p('Introduction', 'An introduction to the museum.'),
    'hall-overview': vi
      ? p('Tổng quan', 'Tổng quan về bốn cuộc Cách mạng Công nghiệp và lộ trình tham quan.')
      : p('Overview', 'An overview of the four Industrial Revolutions and the route through the museum.'),
    'hall-team': vi ? p('Nhóm thực hiện', 'Các thành viên và vai trò.') : p('Our Team', 'The team members and their roles.'),
    'hall-credits': vi
      ? p('Ghi công', 'Hình ảnh, mô hình và công cụ đã sử dụng.')
      : p('Credits', 'The images, models and tools we used.'),
    'hall-sources': vi ? p('Nguồn tham khảo', 'Danh sách tài liệu tham khảo.') : p('References', 'The list of references.'),

    // Quiz room: the quiz itself arrives in M7.
    'quiz-info': vi
      ? p('Phòng trò chơi', 'Trò chơi câu hỏi sẽ được đặt tại đây.')
      : p('Game Room', 'The quiz game will take place here.'),
  }

  // Era rooms: an overview board on the back wall ("ir1-overview" ...) and 4 inventions,
  // one per corner ("ir1-1" ... "ir4-4").
  for (let era = 1; era <= 4; era++) {
    const ordinal = ORDINAL[lang][era - 1]
    texts[`ir${era}-overview`] = vi
      ? p(`Tổng quan CMCN ${era}`, `Tổng quan về cuộc Cách mạng Công nghiệp lần thứ ${ordinal}: thời gian, bối cảnh và ý nghĩa.`)
      : p(`IR ${era} Overview`, `An overview of the ${ordinal} Industrial Revolution: when it happened, its background and why it matters.`)
    for (let slot = 1; slot <= 4; slot++) {
      texts[`ir${era}-${slot}`] = vi
        ? p(`Phát minh ${slot} – CMCN ${era}`, `Phát minh tiêu biểu số ${slot} của cuộc Cách mạng Công nghiệp lần thứ ${ordinal}.`)
        : p(`Invention ${slot} – IR ${era}`, `Key invention no. ${slot} of the ${ordinal} Industrial Revolution.`)
    }
  }
  return texts
}

const TEXTS: Record<Language, Record<string, ExhibitText>> = { vi: buildTexts('vi'), en: buildTexts('en') }

export function getExhibitText(id: string, lang: Language): ExhibitText {
  return TEXTS[lang][id] ?? placeholder(lang, id, '')
}
