import type { Language } from './language'
import type { UiText } from './ui'

// TOUCH WORDING (phones and tablets): every interface text that mentions keys or the mouse
// has a touch version here, in both languages. On a touch device, useContent() returns the
// normal texts with these swapped in (see withTouch below), so the screens stay the same.
// When a key text in ui.ts changes, update its touch version here too.

type Steps = UiText['tutorial']['steps']

interface TouchText {
  steps: { [K in keyof Steps]: { title?: string; text: string; tip?: string } }
  pauseIntro: string
  pauseClickHint: string
  prompt: string
  quizPrompt: string
  quizIntro: string
  infoCloseHint: string
  mapCloseHint: string
  keyList: UiText['keyList']
}

const vi: TouchText = {
  steps: {
    intro: {
      text: 'Hướng dẫn sẽ giới thiệu từng thao tác. Chạm vào màn hình để bắt đầu.',
      tip: 'Mẹo: xoay ngang thiết bị để có trải nghiệm tốt nhất.',
    },
    look: { text: 'Kéo ngón tay trên màn hình để xoay góc nhìn.' },
    move: { text: 'Dùng cần điều khiển ở góc dưới bên trái để đi lại.' },
    sprint: { text: 'Đẩy cần điều khiển hết cỡ để chạy nhanh hơn, ví dụ khi băng qua sảnh trung tâm.' },
    interact: { text: 'Đến gần một bảng thông tin rồi chạm vào nó để phóng to.' },
    map: { text: 'Chạm nút bản đồ ở góc trên bên phải. Chọn một phòng để đi thẳng đến đó. Bạn chỉ có thể dịch chuyển đến những phòng đã tham quan.' },
    pause: { text: 'Chạm nút tạm dừng ở góc trên bên phải. Menu tạm dừng chứa các cài đặt, ví dụ độ nhạy camera.' },
    keys: {
      title: 'Cách điều khiển',
      text: 'Chạm nút "?" ở góc trên bên phải bất cứ lúc nào để xem lại cách điều khiển. Đây là bước cuối của hướng dẫn.',
    },
  },
  pauseIntro: 'Đây là menu tạm dừng với các cài đặt. Chạm Tiếp tục để quay lại tham quan.',
  pauseClickHint: 'Chạm vào khoảng trống hoặc chạm Tiếp tục',
  prompt: 'Chạm để xem',
  quizPrompt: 'Chạm để chọn',
  quizIntro: 'Câu hỏi và bốn đáp án sẽ hiện trên bảng này. Chạm vào đáp án bạn chọn. Trả lời đúng ít nhất một nửa để mở cánh cửa phía sau.',
  infoCloseHint: 'Chạm vào khoảng trống để đóng',
  mapCloseHint: 'Chạm vào khoảng trống để đóng',
  keyList: {
    title: 'Cách điều khiển',
    hint: 'Chạm "?" để ẩn',
    keys: [
      { keys: 'Kéo ngón tay', action: 'Nhìn xung quanh' },
      { keys: 'Cần điều khiển', action: 'Di chuyển' },
      { keys: 'Đẩy hết cỡ', action: 'Chạy nhanh' },
      { keys: 'Chạm', action: 'Xem bảng thông tin, chọn đáp án' },
      { keys: 'Nút bản đồ', action: 'Mở bản đồ' },
      { keys: 'Nút tạm dừng', action: 'Tạm dừng và cài đặt' },
      { keys: 'Nút ?', action: 'Hiện / ẩn cách điều khiển' },
    ],
  },
}

const en: TouchText = {
  steps: {
    intro: {
      text: 'This guide introduces the controls one at a time. Tap the screen to begin.',
      tip: 'Tip: turn your device sideways for the best experience.',
    },
    look: { text: 'Drag a finger across the screen to turn the camera.' },
    move: { text: 'Use the joystick in the bottom-left corner to walk.' },
    sprint: { text: 'Push the joystick all the way to move faster, for example when crossing the Central Hall.' },
    interact: { text: 'Walk up to an information board and tap it to enlarge it.' },
    map: { text: 'Tap the map button in the top-right corner. Pick a room to go straight there. You can only travel to rooms you have visited.' },
    pause: { text: 'Tap the pause button in the top-right corner. The pause menu holds the settings, such as camera sensitivity.' },
    keys: {
      title: 'Controls',
      text: 'Tap the "?" button in the top-right corner at any time to see the controls again. This is the last step of the guide.',
    },
  },
  pauseIntro: 'This is the pause menu, where the settings are. Tap Continue to return to the museum.',
  pauseClickHint: 'Tap on blank space or tap Continue',
  prompt: 'Tap to view',
  quizPrompt: 'Tap to choose',
  quizIntro: 'The questions and their four answers appear on this panel. Tap the answer you choose. Get at least half right to open the door at the back.',
  infoCloseHint: 'Tap on blank space to close',
  mapCloseHint: 'Tap on blank space to close',
  keyList: {
    title: 'Controls',
    hint: 'Tap "?" to hide',
    keys: [
      { keys: 'Drag a finger', action: 'Look around' },
      { keys: 'Joystick', action: 'Walk' },
      { keys: 'Push all the way', action: 'Sprint' },
      { keys: 'Tap', action: 'View an information board, choose an answer' },
      { keys: 'Map button', action: 'Open the map' },
      { keys: 'Pause button', action: 'Pause and settings' },
      { keys: '? button', action: 'Show / hide the controls' },
    ],
  },
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
    keyList: t.keyList,
  }
}
