// Interface text (buttons, screens). All visible text lives in src/content/.
export const ui = {
  start: {
    button: 'Bắt đầu tham quan',
    controlsTitle: 'Cách điều khiển',
    controls: [
      'W A S D: di chuyển',
      'Chuột / touchpad / phím mũi tên: nhìn xung quanh',
      'E / nhấp chuột: xem hiện vật',
      'M: bản đồ',
      'Esc: tạm dừng',
    ],
    keyboardTip:
      'Nếu đang bật bộ gõ tiếng Việt (Unikey, EVKey,...), hãy chuyển sang chế độ gõ tiếng Anh khi tham quan.',
  },
  pause: {
    title: 'Tạm dừng',
    resume: 'Tiếp tục',
    map: 'Bản đồ',
  },
  sensitivity: {
    label: 'Độ nhạy camera',
  },
  // Shown under the crosshair when an exhibit is within reach.
  prompt: 'Nhấn E để xem',
  infoPanel: {
    imagePlaceholder: 'Hình minh họa (sẽ bổ sung)',
    sourcesLabel: 'Nguồn',
    sourcesPlaceholder: 'Chưa có nguồn. [CẦN KIỂM TRA]',
    close: 'Đóng',
    closeHint: 'Nhấn E hoặc Esc để đóng',
  },
  map: {
    title: 'Bản đồ bảo tàng',
    hint: 'Chọn một phòng để đi đến đó.',
    youAreHere: 'Bạn đang ở đây',
    locked: 'Đang khóa',
    visited: 'Đã tham quan',
    close: 'Đóng',
    closeHint: 'Nhấn M hoặc Esc để đóng',
  },
  // Shown near the locked quiz-room door; {count} = era rooms visited so far.
  quizLocked: 'Phòng trò chơi đang khóa. Hãy tham quan cả 4 phòng trưng bày trước ({count}/4).',
  // Shown while walking when Unikey/EVKey (Vietnamese mode) seems to be eating keys.
  typingToolWarning:
    'Có vẻ bộ gõ tiếng Việt (Unikey/EVKey) đang bật nên một số phím không hoạt động. Hãy chuyển sang chế độ gõ tiếng Anh.',
  // Shown when the browser refuses to capture the mouse.
  lockRefused:
    'Trình duyệt chưa cho phép điều khiển chuột. Hãy đợi một giây rồi nhấp lại. Nếu vẫn không được, hãy mở trang trực tiếp trong một thẻ Chrome hoặc Edge.',
}
