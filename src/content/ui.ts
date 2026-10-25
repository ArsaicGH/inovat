// Interface text (buttons, screens). All visible text lives in src/content/.
export const ui = {
  start: {
    button: 'Bắt đầu',
    // Under "Bắt đầu" when this tab still holds an earlier visit (e.g. after a reload).
    continue: 'Tiếp tục hành trình trước',
    tutorialQuestion: 'Bạn có muốn xem hướng dẫn điều khiển không?',
    tutorialYes: 'Có, hướng dẫn tôi',
    tutorialNo: 'Không, vào tham quan',
  },
  // Guided tutorial (chosen on the start screen). {n} = step number, {total} = number of steps.
  tutorial: {
    progress: 'Hướng dẫn {n}/{total}',
    steps: {
      intro: {
        title: 'Chào mừng đến INNOVA',
        text: 'Hướng dẫn sẽ giới thiệu từng thao tác. Nhấn phím cách (Space) để bắt đầu.',
        tip: 'Mẹo: nhấn F11 để chơi toàn màn hình, cho trải nghiệm tốt nhất.',
      },
      look: {
        title: 'Nhìn xung quanh',
        text: 'Di chuyển chuột hoặc touchpad, hoặc dùng các phím mũi tên, để xoay góc nhìn.',
      },
      move: {
        title: 'Di chuyển',
        text: 'Dùng W A S D để đi lại. Nếu đang bật bộ gõ tiếng Việt (Unikey, EVKey,...), hãy chuyển sang chế độ gõ tiếng Anh.',
      },
      sprint: {
        title: 'Chạy nhanh',
        text: 'Giữ phím Shift trong khi đi để chạy nhanh hơn, ví dụ khi băng qua sảnh trung tâm.',
      },
      interact: {
        title: 'Xem hiện vật',
        text: 'Đến gần một bảng thông tin trên tường, nhắm vào nó rồi nhấn E hoặc nhấp chuột để phóng to. Nhấn E hoặc Esc để đóng.',
      },
      map: {
        title: 'Bản đồ',
        text: 'Nhấn M để mở bản đồ bảo tàng. Chọn một phòng để đi thẳng đến đó.',
      },
      pause: {
        title: 'Tạm dừng',
        text: 'Nhấn Esc để tạm dừng. Menu tạm dừng chứa các cài đặt, ví dụ độ nhạy camera.',
      },
      keys: {
        title: 'Danh sách phím',
        text: 'Nhấn phím cách (Space) bất cứ lúc nào để hiện hoặc ẩn danh sách tất cả các phím. Đây là bước cuối của hướng dẫn.',
      },
    },
    // Shown in the pause menu during the tutorial's "pause" step.
    pauseIntro: 'Đây là menu tạm dừng với các cài đặt. Nhấn Esc hoặc Tiếp tục để quay lại tham quan.',
  },
  pause: {
    title: 'Tạm dừng',
    resume: 'Tiếp tục',
    resumeHint: 'Nhấn Esc để tiếp tục',
    map: 'Bản đồ',
  },
  // While walking without the mouse captured (e.g. after resuming with Esc).
  clickToLook: 'Nhấp chuột để dùng chuột xoay góc nhìn',
  // KEY LIST: shown with Space while walking. Keep it complete: every new key goes here
  // (see CLAUDE.md).
  keyList: {
    title: 'Danh sách phím',
    hint: 'Nhấn Space để ẩn',
    keys: [
      { keys: 'W A S D', action: 'Di chuyển' },
      { keys: 'Shift', action: 'Chạy nhanh (giữ khi đi)' },
      { keys: 'Chuột / touchpad / phím mũi tên', action: 'Nhìn xung quanh' },
      { keys: 'E / nhấp chuột', action: 'Xem bảng thông tin (E để đóng)' },
      { keys: 'M', action: 'Mở / đóng bản đồ' },
      { keys: 'Esc', action: 'Tạm dừng / tiếp tục' },
      { keys: 'Space', action: 'Hiện / ẩn danh sách phím' },
    ],
  },
  sensitivity: {
    label: 'Độ nhạy camera',
  },
  // Text painted on decorations in the 3D world.
  decor: {
    // Quiz room: answer tiles like a TV quiz show, and question marks on the side walls.
    quizAnswers: ['A', 'B', 'C', 'D'],
    quizMark: '?',
  },
  // Shown at the bottom of a 3D text board when the full text does not fit on it.
  panelMore: '…',
  // Shown under the crosshair when an exhibit is within reach.
  prompt: 'Nhấn E để xem',
  infoPanel: {
    imagePlaceholder: 'Hình minh họa (sẽ bổ sung)',
    sourcesLabel: 'Nguồn',
    sourcesPlaceholder: 'Chưa có nguồn. [CẦN KIỂM TRA]',
    close: 'Đóng',
    closeHint: 'Nhấn E để đóng',
  },
  map: {
    title: 'Bản đồ bảo tàng',
    hint: 'Chọn một phòng để đi đến đó.',
    youAreHere: 'Bạn đang ở đây',
    locked: 'Đang khóa',
    visited: 'Đã tham quan',
    close: 'Đóng',
    closeHint: 'Nhấn M để đóng',
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
