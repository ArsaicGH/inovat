import type { Language } from './language'
import { credits } from './credits'
import { AUDIO_ENABLED } from '../features'

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
    // Real, not a placeholder: listed from credits.ts, so it is always complete.
    'hall-credits': {
      title: vi ? 'Ghi công' : 'Credits',
      summary: vi
        ? 'Phông chữ, vật liệu và mô hình dùng trong bảo tàng, cùng tác giả và giấy phép.'
        : 'The font, textures and models used in the museum, with their authors and licences.',
      body: credits
        // (Sound credits only while sound is switched on, see src/features.ts.)
        .filter((c) => AUDIO_ENABLED || !c.files.every((file) => file.startsWith('sounds/')))
        .map((c) => `${c.item[lang]} - ${c.author} (${c.licence[lang]})`).join('; ') + '.',
      placeholder: false,
    },
    'hall-sources': vi ? p('Nguồn tham khảo', 'Danh sách tài liệu tham khảo.') : p('References', 'The list of references.'),

    // Game Room: the board beside the quiz.
    'quiz-info': vi
      ? p('Trò chơi câu hỏi', 'Câu hỏi về bốn cuộc Cách mạng Công nghiệp hiện trên bức tường cuối phòng. Nhắm vào đáp án bạn chọn rồi nhấn E.')
      : p('The Quiz', 'Questions about the four Industrial Revolutions appear on the back wall. Aim at the answer you choose and press E.'),
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
        ? p(`Phát minh ${slot} - CMCN ${era}`, `Phát minh tiêu biểu số ${slot} của cuộc Cách mạng Công nghiệp lần thứ ${ordinal}.`)
        : p(`Invention ${slot} - IR ${era}`, `Key invention no. ${slot} of the ${ordinal} Industrial Revolution.`)
    }
  }
  return texts
}

const TEXTS: Record<Language, Record<string, ExhibitText>> = { vi: buildTexts('vi'), en: buildTexts('en') }

export function getExhibitText(id: string, lang: Language): ExhibitText {
  return TEXTS[lang][id] ?? placeholder(lang, id, '')
}
