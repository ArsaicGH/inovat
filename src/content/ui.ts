// Interface text (buttons, screens). All visible text lives in src/content/.
export const ui = {
  start: {
    button: 'Bắt đầu tham quan',
    controlsTitle: 'Cách điều khiển',
    controls: [
      'W A S D: di chuyển',
      'Chuột / touchpad / phím mũi tên: nhìn xung quanh',
      'Esc: tạm dừng',
    ],
    keyboardTip:
      'Nếu đang bật bộ gõ tiếng Việt (Unikey, EVKey,...), hãy chuyển sang chế độ gõ tiếng Anh khi tham quan.',
  },
  pause: {
    title: 'Tạm dừng',
    resume: 'Tiếp tục',
  },
  sensitivity: {
    label: 'Độ nhạy camera',
  },
  // Shown while walking when Unikey/EVKey (Vietnamese mode) seems to be eating keys.
  typingToolWarning:
    'Có vẻ bộ gõ tiếng Việt (Unikey/EVKey) đang bật nên một số phím không hoạt động. Hãy chuyển sang chế độ gõ tiếng Anh.',
  // Shown when the browser refuses to capture the mouse.
  lockRefused:
    'Trình duyệt chưa cho phép điều khiển chuột. Hãy đợi một giây rồi nhấp lại. Nếu vẫn không được, hãy mở trang trực tiếp trong một thẻ Chrome hoặc Edge.',
}
