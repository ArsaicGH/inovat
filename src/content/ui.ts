import type { Language } from './language'

// Interface text (buttons, screens), in both languages. All visible text lives in
// src/content/. When you change one language, change the other in the same edit.
const vi = {
  start: {
    button: 'Bắt đầu',
    // Under "Bắt đầu" when this tab still holds an earlier visit (e.g. after a reload).
    continue: 'Tiếp tục hành trình trước',
    // (Instead of the plain start button, when an earlier visit can be continued.)
    newJourney: 'Bắt đầu hành trình mới',
    tutorialQuestion: 'Quý khách có muốn xem hướng dẫn điều khiển không?',
    tutorialYes: 'Có, hướng dẫn tôi',
    tutorialNo: 'Không, vào tham quan',
  },
  // The loading screen at the start: what is happening, in general terms, and how much has
  // downloaded. {loaded}/{total} = megabytes. Then two tips under a gold ornament.
  loading: {
    steps: {
      download: 'Đang tải hiện vật và hình ảnh',
      rooms: 'Đang dựng các phòng trưng bày',
      lights: 'Đang thắp đèn khắp bảo tàng',
      ready: 'Bảo tàng đã sẵn sàng',
    },
    downloaded: 'Đã tải {loaded} / {total} MB',
    // Only on the first visit in this browser.
    firstVisit: 'Lần đầu tải lâu hơn một chút; những lần sau sẽ nhanh hơn.',
    tips: ['Nhấn F11 để chơi toàn màn hình', 'Đeo tai nghe để có trải nghiệm tốt nhất'],
  },
  // Guided tutorial (chosen on the start screen). {n} = step number, {total} = number of steps.
  tutorial: {
    progress: 'Hướng dẫn {n}/{total}',
    steps: {
      intro: {
        title: 'Chào mừng đến INOVAT',
        text: 'Hướng dẫn sẽ giới thiệu từng thao tác. Nhấn phím cách (Space) để bắt đầu.',
        tip: 'Mẹo: nhấn F11 để chơi toàn màn hình, và đeo tai nghe để có trải nghiệm tốt nhất.',
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
        text: 'Đến gần một bảng thông tin, nhắm vào nó rồi nhấn E hoặc nhấp chuột để phóng to.',
      },
      map: {
        title: 'Bản đồ',
        text: 'Nhấn Q để mở bản đồ bảo tàng. Chọn một phòng để đi thẳng đến đó. Quý khách chỉ có thể dịch chuyển đến những phòng đã tham quan.',
      },
      pause: {
        title: 'Tạm dừng',
        text: 'Nhấn Esc để tạm dừng. Menu tạm dừng chứa các cài đặt, ví dụ độ nhạy camera.',
      },
      keys: {
        title: 'Danh sách phím',
        text: 'Nhấn phím cách (Space) bất cứ lúc nào để hiện hoặc ẩn danh sách tất cả các phím.',
      },
      // Last card: closes by itself after a few seconds (TutorialCard.tsx).
      enjoy: {
        title: 'Sẵn sàng rồi!',
        text: 'Chúc quý khách tham quan bảo tàng vui vẻ!',
      },
    },
    // Shown in the pause menu during the tutorial's "pause" step.
    pauseIntro: 'Đây là menu tạm dừng với các cài đặt. Nhấn Tiếp tục để quay lại tham quan.',
  },
  pause: {
    title: 'Tạm dừng',
    resume: 'Tiếp tục',
    toTitle: 'Về màn hình chính',
    clickHint: 'Nhấp vào khoảng trống hoặc nhấn Tiếp tục',
  },
  // The title screen's settings (the gear beside the volume and language).
  settings: {
    title: 'Cài đặt',
    open: 'Mở cài đặt',
    close: 'Đóng',
  },
  // While walking without the mouse captured (e.g. after resuming with Esc).
  clickToLook: 'Nhấp chuột để dùng chuột xoay góc nhìn',
  // KEY LIST: shown with Space while walking, in the order the tutorial teaches them.
  // Keep it complete: every new key goes here (see CLAUDE.md).
  keyList: {
    title: 'Danh sách phím',
    hint: 'Nhấn Space để ẩn',
    keys: [
      { keys: 'Chuột / touchpad / phím mũi tên', action: 'Nhìn xung quanh' },
      { keys: 'W A S D', action: 'Di chuyển' },
      { keys: 'Shift', action: 'Chạy nhanh (giữ khi đi)' },
      { keys: 'E / nhấp chuột', action: 'Xem bảng thông tin (E để đóng)' },
      { keys: 'Q', action: 'Mở / đóng bản đồ' },
      { keys: 'Esc', action: 'Tạm dừng' },
      { keys: 'Space', action: 'Hiện / ẩn danh sách phím' },
    ],
  },
  sensitivity: {
    label: 'Độ nhạy camera',
  },
  language: {
    label: 'Ngôn ngữ',
  },
  sound: {
    volume: 'Âm lượng',
  },
  // Graphics setting in the pause menu (levels from lowest to highest).
  graphics: {
    label: 'Đồ họa',
    auto: 'Tự động',
    levels: ['Rất thấp', 'Thấp', 'Trung bình', 'Cao', 'Tối đa'],
    // What each level is for (shown under the slider).
    hints: [
      'Nhanh nhất, hình ảnh đơn giản nhất',
      'Cho máy văn phòng, máy cấu hình thấp: hình kém nét hơn, bóng đổ đứng yên',
      'Cho máy tầm trung: hình nét vừa, không có bóng mềm ở các góc',
      'Hình ảnh đầy đủ như thiết kế của bảo tàng',
      'Tối đa: mọi đèn chiếu đều đổ bóng',
    ],
  },
  // Text painted on decorations in the 3D world (the same in both languages).
  decor: {
    // Quiz room: question marks on the side walls.
    quizMark: '?',
  },
  // Shown at the bottom of a 3D text board when the full text does not fit on it.
  panelMore: '…',
  // Shown under the crosshair when an exhibit is within reach.
  prompt: 'Nhấn E để xem',
  infoPanel: {
    sourcesLabel: 'Nguồn',
    sourcesPlaceholder: 'Chưa có nguồn.',
    close: 'Đóng',
    closeHint: 'Nhấp vào khoảng trống hoặc nhấn E để đóng',
    // Under each picture (content/pictures.ts): who made it and its licence, or for the
    // museum's own diagrams, who drew them.
    pictureCredit: 'Ảnh',
    diagramCredit: 'Sơ đồ do nhóm INOVAT vẽ',
  },
  map: {
    title: 'Bản đồ bảo tàng',
    hint: 'Chọn một phòng để đi đến đó.',
    youAreHere: 'Quý khách đang ở đây',
    locked: 'Đang khóa',
    notVisited: 'Chưa tham quan',
    close: 'Đóng',
    closeHint: 'Nhấp vào khoảng trống hoặc nhấn Q để đóng',
  },
  // Shown near the locked quiz-room door; {count} = era rooms visited so far.
  quizLocked: 'Phòng trò chơi đang khóa. Hãy tham quan cả 4 phòng trưng bày trước ({count}/4).',
  // Shown while walking when Unikey/EVKey (Vietnamese mode) seems to be eating keys.
  typingToolWarning:
    'Có vẻ bộ gõ tiếng Việt (Unikey/EVKey) đang bật nên một số phím không hoạt động. Hãy chuyển sang chế độ gõ tiếng Anh.',
  // Shown when the browser refuses to capture the mouse.
  lockRefused:
    'Trình duyệt chưa cho phép điều khiển chuột. Hãy đợi một giây rồi nhấp lại. Nếu vẫn không được, hãy mở trang trực tiếp trong một thẻ Chrome hoặc Edge.',
  // QUIZ on the Game Room's back wall. {n} = question number, {total} = number of questions,
  // {score} = right answers, {letter} = A-D.
  quiz: {
    prompt: 'Nhấn E để chọn',
    title: 'Trò chơi câu hỏi',
    intro: 'Câu hỏi và bốn đáp án sẽ hiện trên bảng này. Nhắm vào đáp án quý khách chọn rồi nhấn E hoặc nhấp chuột, hoặc nhấn phím 1, 2, 3, 4 để chọn A, B, C, D. Trả lời đúng ít nhất một nửa để mở cánh cửa phía sau.',
    doorOpen: 'Cánh cửa phía sau đã mở.',
    doorLocked: 'Cần đúng ít nhất một nửa để mở cánh cửa phía sau.',
    progress: 'Câu {n}/{total}',
    answerLabel: 'Đáp án {letter}',
    correct: 'Chính xác!',
    wrong: 'Chưa đúng.',
    start: 'Bắt đầu',
    next: 'Câu tiếp theo',
    finish: 'Xem kết quả',
    retry: 'Chơi lại',
    resultsTitle: 'Kết quả',
    score: 'Quý khách trả lời đúng {score}/{total} câu',
    levels: {
      great: 'Xuất sắc! Quý khách đã nắm rất vững bốn cuộc Cách mạng Công nghiệp.',
      good: 'Khá lắm! Hãy xem lại vài phòng trưng bày để đạt điểm tuyệt đối.',
      retry: 'Đừng nản lòng! Hãy tham quan lại các phòng trưng bày rồi thử lần nữa.',
    },
  },
  // THE ENDING after the portal: a film through the four eras, the closing title, then a
  // thank-you panel.
  ending: {
    journey: 'Hành trình xuyên thời gian',
    brand: 'INOVAT',
    tagline: 'Bốn cuộc cách mạng. Một hành trình.',
    // One line for each era as the flight passes it (written to set the mood).
    moods: [
      'Tiếng máy hơi nước vang lên, khói than phủ kín bầu trời: lần đầu tiên, máy móc gánh vác sức lao động của con người.',
      'Ánh đèn điện thắp sáng màn đêm, những dây chuyền không ngừng chuyển động: thế giới bước vào kỷ nguyên sản xuất hàng loạt.',
      'Những con chip nhỏ bé mở ra thế giới số: máy tính, rô-bốt và mạng lưới nối liền con người khắp hành tinh.',
      'Máy móc biết học hỏi, vạn vật được kết nối: và câu chuyện ấy vẫn đang được viết tiếp, bởi chính chúng ta.',
    ],
    skip: 'Bỏ qua',
    // The program typed on the computer screen in the film's third act (an old BASIC program
    // that counts the four revolutions).
    screen: ['] LIST', '10 REM *** INOVAT ***', '20 FOR I = 1 TO 4', '30 PRINT "CMCN "; I', '40 NEXT I', '] RUN', 'CMCN 1', 'CMCN 2', 'CMCN 3', 'CMCN 4', ']'],
    title: 'Cảm ơn Quý khách đã tham quan!',
    text: 'Quý khách vừa đi qua bốn cuộc Cách mạng Công nghiệp: từ hơi nước và máy móc cơ khí, đến điện năng, máy tính, rô-bốt và trí tuệ nhân tạo. Câu chuyện ấy vẫn đang được viết tiếp, và thế hệ hôm nay sẽ góp phần tạo nên chương tiếp theo.',
    replay: 'Xem lại hành trình',
    toTitle: 'Về màn hình chính',
  },
  // On-screen buttons on phones and tablets (names read out by screen readers), and the
  // note asking to turn the device sideways.
  touch: {
    map: 'Bản đồ',
    pause: 'Tạm dừng',
    joystick: 'Cần điều khiển (nửa trái màn hình)',
    rotate: 'Hãy xoay ngang thiết bị để tham quan bảo tàng.',
  },
  // Shown instead of the museum on phones and tablets.
  device: {
    title: 'Vui lòng dùng máy tính',
    text: 'INOVAT là bảo tàng 3D điều khiển bằng bàn phím và chuột hoặc touchpad, nên hiện chỉ chơi được trên máy tính. Hãy mở trang này trên máy tính để bàn hoặc máy tính xách tay.',
  },
}

export type UiText = typeof vi

const en: UiText = {
  start: {
    button: 'Start',
    continue: 'Continue previous visit',
    newJourney: 'Start a new journey',
    tutorialQuestion: 'Would you like a quick guide to the controls?',
    tutorialYes: 'Yes, show me',
    tutorialNo: 'No, start exploring',
  },
  loading: {
    steps: {
      download: 'Loading the exhibits and pictures',
      rooms: 'Setting up the exhibition rooms',
      lights: 'Turning on the lights',
      ready: 'The museum is ready',
    },
    downloaded: '{loaded} / {total} MB downloaded',
    firstVisit: 'The first visit takes a little longer; later visits load faster.',
    tips: ['Press F11 to play in full screen', 'Wear headphones for the best experience'],
  },
  tutorial: {
    progress: 'Tutorial {n}/{total}',
    steps: {
      intro: {
        title: 'Welcome to INOVAT',
        text: 'This guide introduces the controls one at a time. Press Space to begin.',
        tip: 'Tip: press F11 to use full screen, and wear headphones for the best experience.',
      },
      look: {
        title: 'Look around',
        text: 'Move your mouse or touchpad, or use the arrow keys, to turn the camera.',
      },
      move: {
        title: 'Walk',
        text: 'Use W A S D to walk. If a Vietnamese typing tool (Unikey, EVKey...) is on, switch it to English mode.',
      },
      sprint: {
        title: 'Sprint',
        text: 'Hold Shift while walking to move faster, for example when crossing the Central Hall.',
      },
      interact: {
        title: 'View exhibits',
        text: 'Walk up to an information board, aim at it and press E or click to enlarge it.',
      },
      map: {
        title: 'Map',
        text: 'Press Q to open the museum map. Pick a room to go straight there. You can only travel to rooms you have visited.',
      },
      pause: {
        title: 'Pause',
        text: 'Press Esc to pause. The pause menu holds the settings, such as camera sensitivity.',
      },
      keys: {
        title: 'Key list',
        text: 'Press Space at any time to show or hide a list of all the keys.',
      },
      enjoy: {
        title: 'All set!',
        text: 'Have fun exploring the museum!',
      },
    },
    pauseIntro: 'This is the pause menu, where the settings are. Click Continue to return to the museum.',
  },
  pause: {
    title: 'Paused',
    resume: 'Continue',
    toTitle: 'Back to the title screen',
    clickHint: 'Click on blank space or press Continue',
  },
  settings: {
    title: 'Settings',
    open: 'Open settings',
    close: 'Close',
  },
  clickToLook: 'Click to look around with the mouse',
  keyList: {
    title: 'Key list',
    hint: 'Press Space to hide',
    keys: [
      { keys: 'Mouse / touchpad / arrow keys', action: 'Look around' },
      { keys: 'W A S D', action: 'Walk' },
      { keys: 'Shift', action: 'Sprint (hold while walking)' },
      { keys: 'E / click', action: 'View an information board (E to close)' },
      { keys: 'Q', action: 'Open / close the map' },
      { keys: 'Esc', action: 'Pause' },
      { keys: 'Space', action: 'Show / hide this list' },
    ],
  },
  sensitivity: {
    label: 'Camera sensitivity',
  },
  language: {
    label: 'Language',
  },
  sound: {
    volume: 'Volume',
  },
  graphics: {
    label: 'Graphics',
    auto: 'Automatic',
    levels: ['Very low', 'Low', 'Medium', 'High', 'Ultra'],
    hints: [
      'Fastest, simplest picture',
      'For office and budget laptops: a softer picture, shadows that stay still',
      'For mid-range computers: a slightly softer picture, no soft shadows in corners',
      'The full picture, as the museum was designed',
      'Maximum: every spotlight casts shadows',
    ],
  },
  decor: {
    quizMark: '?',
  },
  panelMore: '…',
  prompt: 'Press E to view',
  infoPanel: {
    sourcesLabel: 'Sources',
    sourcesPlaceholder: 'No sources yet.',
    close: 'Close',
    closeHint: 'Click on blank space or press E to close',
    pictureCredit: 'Picture',
    diagramCredit: 'Diagram drawn by the INOVAT team',
  },
  map: {
    title: 'Museum map',
    hint: 'Pick a room to go there.',
    youAreHere: 'You are here',
    locked: 'Locked',
    notVisited: 'Not visited yet',
    close: 'Close',
    closeHint: 'Click on blank space or press Q to close',
  },
  quizLocked: 'The Game Room is locked. Visit all 4 exhibition rooms first ({count}/4).',
  typingToolWarning:
    'A Vietnamese typing tool (Unikey/EVKey) seems to be on, so some keys do not work. Please switch it to English mode.',
  lockRefused:
    'The browser has not allowed mouse control yet. Wait a second and click again. If it still does not work, open the page directly in a Chrome or Edge tab.',
  quiz: {
    prompt: 'Press E to choose',
    title: 'The Quiz',
    intro: 'The questions and their four answers appear on this panel. Aim at the answer you choose, then press E or click, or press 1, 2, 3 or 4 to choose A, B, C or D. Get at least half right to open the door at the back.',
    doorOpen: 'The door at the back is now open.',
    doorLocked: 'Get at least half right to open the door at the back.',
    progress: 'Question {n}/{total}',
    answerLabel: 'Answer {letter}',
    correct: 'Correct!',
    wrong: 'Not quite.',
    start: 'Start',
    next: 'Next question',
    finish: 'See results',
    retry: 'Play again',
    resultsTitle: 'Results',
    score: 'You got {score} out of {total} right',
    levels: {
      great: 'Excellent! You really know the four Industrial Revolutions.',
      good: 'Well done! Revisit a few exhibition rooms to get a perfect score.',
      retry: "Don't give up! Walk through the exhibition rooms again and have another go.",
    },
  },
  ending: {
    journey: 'A journey through time',
    brand: 'INOVAT',
    tagline: 'Four revolutions. One journey.',
    moods: [
      'The roar of steam engines, skies dark with coal smoke: for the first time, machines took on the labour of human hands.',
      'Electric light pushed back the night and assembly lines never stopped moving: the world entered the age of mass production.',
      'Tiny chips opened a digital world: computers, robots and networks linking people across the planet.',
      'Machines that learn, everything connected: and the story is still being written, by all of us.',
    ],
    skip: 'Skip',
    screen: ['] LIST', '10 REM *** INOVAT ***', '20 FOR I = 1 TO 4', '30 PRINT "IR "; I', '40 NEXT I', '] RUN', 'IR 1', 'IR 2', 'IR 3', 'IR 4', ']'],
    title: 'Thank you for visiting!',
    text: 'You have just travelled through four Industrial Revolutions: from steam and mechanical machinery to electricity, computers, robots and artificial intelligence. That story is still being written, and today’s generation will help shape its next chapter.',
    replay: 'Replay the journey',
    toTitle: 'Back to the title screen',
  },
  touch: {
    map: 'Map',
    pause: 'Pause',
    joystick: 'Thumbstick (left half of the screen)',
    rotate: 'Please turn your device sideways to visit the museum.',
  },
  device: {
    title: 'Please use a computer',
    text: 'INOVAT is a 3D museum controlled with a keyboard and a mouse or touchpad, so for now it can only be played on a computer. Please open this page on a desktop or laptop.',
  },
}

export const uiText: Record<Language, UiText> = { vi, en }
