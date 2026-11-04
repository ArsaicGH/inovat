import type { Language } from './language'
import type { UiText } from './ui'

// TOUCH WORDING (phones and tablets): every interface text that mentions keys or the mouse
// has a touch version here, in both languages. On a touch device, useContent() returns the
// normal texts with these swapped in (see withTouch below), so the screens stay the same.
// When a key text in ui.ts changes, update its touch version here too. (The key list and
// the tutorial's "keys" step are not used on touch devices: no touch version.)

type Steps = UiText['tutorial']['steps']

interface TouchText {
  // Only steps whose text mentions keys or the mouse need a touch version.
  steps: { [K in keyof Steps]?: { title?: string; text: string; tip?: string } }
  pauseIntro: string
  pauseClickHint: string
  prompt: string
  quizPrompt: string
  quizIntro: string
  infoCloseHint: string
  mapCloseHint: string
  loadingTips: string[]
}

const vi: TouchText = {
  steps: {
    intro: {
      text: 'Hướng dẫn sẽ giới thiệu từng thao tác. Chạm vào màn hình để bắt đầu.',
      tip: 'Mẹo: xoay ngang thiết bị và đeo tai nghe để có trải nghiệm tốt nhất.',
    },
    look: { text: 'Kéo ngón tay ở nửa bên phải màn hình để xoay góc nhìn.' },
    move: { text: 'Đặt ngón cái xuống bất kỳ đâu ở nửa bên trái màn hình rồi kéo nhẹ để đi lại.' },
    sprint: { text: 'Kéo càng xa, đi càng nhanh: kéo thật xa để chạy, ví dụ khi băng qua sảnh trung tâm.' },
    interact: { text: 'Đến gần một bảng thông tin rồi chạm vào nó để phóng to.' },
    map: { text: 'Chạm nút bản đồ ở góc trên bên phải. Chọn một phòng để đi thẳng đến đó. Quý khách chỉ có thể dịch chuyển đến những phòng đã tham quan.' },
    pause: { text: 'Chạm nút tạm dừng ở góc trên bên phải. Menu tạm dừng chứa các cài đặt, ví dụ độ nhạy camera.' },
  },
  pauseIntro: 'Đây là menu tạm dừng với các cài đặt. Chạm Tiếp tục để quay lại tham quan.',
  pauseClickHint: 'Chạm vào khoảng trống hoặc chạm Tiếp tục',
  prompt: 'Chạm để xem',
  quizPrompt: 'Chạm để chọn',
  quizIntro: 'Câu hỏi và bốn đáp án sẽ hiện trên bảng này. Chạm vào đáp án quý khách chọn. Trả lời đúng ít nhất một nửa để mở cánh cửa phía sau.',
  infoCloseHint: 'Chạm vào khoảng trống để đóng',
  mapCloseHint: 'Chạm vào khoảng trống để đóng',
  // (No "turn sideways" tip: an upright phone is already asked to turn before loading shows.)
  loadingTips: ['Đeo tai nghe để có trải nghiệm tốt nhất'],
}

const en: TouchText = {
  steps: {
    intro: {
      text: 'This guide introduces the controls one at a time. Tap the screen to begin.',
      tip: 'Tip: turn your device sideways and wear headphones for the best experience.',
    },
    look: { text: 'Drag a finger on the right half of the screen to turn the camera.' },
    move: { text: 'Put your thumb down anywhere on the left half of the screen and drag a little to walk.' },
    sprint: { text: 'The further you drag, the faster you go: drag far to run, for example across the Central Hall.' },
    interact: { text: 'Walk up to an information board and tap it to enlarge it.' },
    map: { text: 'Tap the map button in the top-right corner. Pick a room to go straight there. You can only travel to rooms you have visited.' },
    pause: { text: 'Tap the pause button in the top-right corner. The pause menu holds the settings, such as camera sensitivity.' },
  },
  pauseIntro: 'This is the pause menu, where the settings are. Tap Continue to return to the museum.',
  pauseClickHint: 'Tap on blank space or tap Continue',
  prompt: 'Tap to view',
  quizPrompt: 'Tap to choose',
  quizIntro: 'The questions and their four answers appear on this panel. Tap the answer you choose. Get at least half right to open the door at the back.',
  infoCloseHint: 'Tap on blank space to close',
  mapCloseHint: 'Tap on blank space to close',
  loadingTips: ['Wear headphones for the best experience'],
}

const touchText: Record<Language, TouchText> = { vi, en }

// The normal interface texts with the touch versions swapped in.
export function withTouch(ui: UiText, language: Language): UiText {
  const t = touchText[language]
  const steps = Object.fromEntries(
    Object.entries(ui.tutorial.steps).map(([key, step]) => [key, { ...step, ...t.steps[key as keyof Steps] }]),
  ) as Steps
  return {
    ...ui,
    tutorial: { ...ui.tutorial, steps, pauseIntro: t.pauseIntro },
    pause: { ...ui.pause, clickHint: t.pauseClickHint },
    prompt: t.prompt,
    quiz: { ...ui.quiz, prompt: t.quizPrompt, intro: t.quizIntro },
    infoPanel: { ...ui.infoPanel, closeHint: t.infoCloseHint },
    map: { ...ui.map, closeHint: t.mapCloseHint },
    loading: { ...ui.loading, tips: t.loadingTips },
  }
}
