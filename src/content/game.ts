import type { Language } from './language'

// THE TIME MACHINE GAME in the Game Room (TimeMachineGame.tsx), in both languages.
// Four short rounds, each relighting one core of the broken time machine; all four open the
// portal. Every answer comes from the exhibit texts (exhibits.ts and their sources), and
// a wrong answer always points to the room where the visitor can read about it.

type Both = Record<Language, string>
export type Era = 1 | 2 | 3 | 4

// Which era room each invention is in (from its id: ir2-3 = CMCN 2).
export const eraOf = (id: string) => Number(id[2]) as Era
export const INVENTION_IDS = [
  'ir1-1', 'ir1-2', 'ir1-3', 'ir1-4',
  'ir2-1', 'ir2-2', 'ir2-3', 'ir2-4', 'ir2-5',
  'ir3-1', 'ir3-2', 'ir3-3', 'ir3-4',
  'ir4-1', 'ir4-2', 'ir4-3', 'ir4-4', 'ir4-5',
]

// Round 2: who is behind each invention (as on the exhibit boards).
export const MAKERS: { id: string; who: Both }[] = [
  { id: 'ir1-1', who: { vi: 'James Watt', en: 'James Watt' } },
  { id: 'ir1-2', who: { vi: 'Richard Arkwright', en: 'Richard Arkwright' } },
  { id: 'ir1-3', who: { vi: 'Henry Cort', en: 'Henry Cort' } },
  { id: 'ir1-4', who: { vi: 'Robert Stephenson', en: 'Robert Stephenson' } },
  { id: 'ir2-1', who: { vi: 'Henry Bessemer', en: 'Henry Bessemer' } },
  { id: 'ir2-2', who: { vi: 'Nikolaus Otto và Karl Benz', en: 'Nikolaus Otto and Karl Benz' } },
  { id: 'ir2-3', who: { vi: 'Thomas Edison và Nikola Tesla', en: 'Thomas Edison and Nikola Tesla' } },
  { id: 'ir2-4', who: { vi: 'Công ty Ford Motor', en: 'Ford Motor Company' } },
  { id: 'ir2-5', who: { vi: 'Alexander Graham Bell', en: 'Alexander Graham Bell' } },
  { id: 'ir3-1', who: { vi: 'Intel', en: 'Intel' } },
  { id: 'ir3-2', who: { vi: 'IBM', en: 'IBM' } },
  { id: 'ir3-3', who: { vi: 'George Devol và Joseph Engelberger', en: 'George Devol and Joseph Engelberger' } },
  { id: 'ir4-1', who: { vi: 'Chuck Hull', en: 'Chuck Hull' } },
  { id: 'ir4-3', who: { vi: 'John McCarthy và Alan Turing', en: 'John McCarthy and Alan Turing' } },
]

// Round 4: real situations; the answer is the invention that solves them.
export interface Challenge {
  situation: Both
  answer: string // invention id
  options: string[] // invention ids, the answer among them
  why: Both
}
export const CHALLENGES: Challenge[] = [
  {
    situation: {
      vi: 'Năm 1830, một nhà buôn muốn chở than và hàng hóa giữa hai thành phố nhanh hơn xe ngựa. Phát minh nào giúp ông?',
      en: 'In 1830 a merchant wants to carry coal and goods between two cities faster than horse carts. Which invention helps him?',
    },
    answer: 'ir1-4',
    options: ['ir1-4', 'ir1-2', 'ir2-5', 'ir3-2'],
    why: {
      vi: 'Đầu máy hơi nước như Rocket kéo đoàn tàu trên đường sắt, chở hàng nhanh và nhiều hơn xe ngựa.',
      en: 'Steam locomotives like the Rocket pulled trains on rails, carrying more goods, faster than horse carts.',
    },
  },
  {
    situation: {
      vi: 'Năm 1913, một hãng xe muốn lắp ráp ô tô nhanh hơn và rẻ hơn rất nhiều. Họ nên tổ chức nhà máy thế nào?',
      en: 'In 1913 a carmaker wants to build cars much faster and cheaper. How should it organise the factory?',
    },
    answer: 'ir2-4',
    options: ['ir2-4', 'ir1-3', 'ir3-4', 'ir4-4'],
    why: {
      vi: 'Dây chuyền lắp ráp di chuyển sản phẩm qua từng công nhân, mỗi người làm một bước, giúp giảm mạnh thời gian lắp ráp.',
      en: 'The moving assembly line carried the product past each worker doing one step, greatly cutting assembly time.',
    },
  },
  {
    situation: {
      vi: 'Một công ty muốn thử nghiệm thay đổi dây chuyền trên bản sao ảo trước, mà không phải dừng nhà máy thật. Họ cần gì?',
      en: 'A company wants to test changes to its production line on a virtual copy first, without stopping the real factory. What does it need?',
    },
    answer: 'ir4-4',
    options: ['ir4-4', 'ir4-1', 'ir3-3', 'ir2-3'],
    why: {
      vi: 'Bản sao số là mô hình ảo của máy móc hoặc nhà máy thật, dùng để thử nghiệm và dự đoán trước khi thay đổi ngoài thực tế.',
      en: 'A digital twin is a virtual model of a real machine or factory, used to test and predict before changing the real thing.',
    },
  },
  {
    situation: {
      vi: 'Một xưởng nhỏ muốn robot làm việc ngay cạnh công nhân để cùng lắp ráp, an toàn và dễ lập trình. Nên chọn gì?',
      en: 'A small workshop wants a robot that works right beside its staff, safely and easy to program. What should it choose?',
    },
    answer: 'ir4-5',
    options: ['ir4-5', 'ir3-3', 'ir1-1', 'ir2-2'],
    why: {
      vi: 'Robot cộng tác (cobot) được thiết kế để làm việc cùng con người, khác với robot công nghiệp truyền thống thường đặt trong khu vực rào chắn.',
      en: 'Collaborative robots (cobots) are designed to work alongside people, unlike traditional industrial robots, which usually work behind safety barriers.',
    },
  },
  {
    situation: {
      vi: 'Một nhà máy muốn camera tự phát hiện vết nứt trên hàng nghìn sản phẩm mỗi giờ, nhờ học từ ảnh mẫu. Công nghệ nào làm được?',
      en: 'A factory wants cameras to spot cracks on thousands of products an hour, by learning from example photos. Which technology can do it?',
    },
    answer: 'ir4-3',
    options: ['ir4-3', 'ir4-4', 'ir3-1', 'ir2-5'],
    why: {
      vi: 'AI học từ dữ liệu (ở đây là ảnh mẫu) để nhận dạng lỗi, nhanh và nhất quán, nhưng vẫn cần con người giám sát.',
      en: 'AI learns from data (here, example photos) to recognise defects quickly and consistently, though people still need to oversee it.',
    },
  },
  {
    situation: {
      vi: 'Năm 1790, một chủ xưởng muốn xây nhà máy ở thành phố, xa sông suối. Nguồn động lực nào giúp ông?',
      en: 'In 1790 a mill owner wants to build a factory in a town, far from any river. Which power source helps him?',
    },
    answer: 'ir1-1',
    options: ['ir1-1', 'ir1-2', 'ir2-3', 'ir3-3'],
    why: {
      vi: 'Động cơ hơi nước của Watt cung cấp động lực ở bất cứ đâu có than, nên nhà máy không còn phải đặt cạnh dòng nước như Water Frame.',
      en: 'Watt’s steam engine provided power wherever there was coal, so factories no longer had to stand beside running water like the Water Frame.',
    },
  },
  {
    situation: {
      vi: 'Năm 1860, một công ty đường sắt cần thật nhiều thép giá rẻ để làm đường ray. Phát minh nào đáp ứng được?',
      en: 'In 1860 a railway company needs a great deal of cheap steel for its rails. Which invention can supply it?',
    },
    answer: 'ir2-1',
    options: ['ir1-3', 'ir2-1', 'ir2-4', 'ir4-1'],
    why: {
      vi: 'Lò chuyển Bessemer thổi không khí qua gang nóng chảy, tạo ra thép nhanh, nhiều và rẻ. Lò khuấy của Cort chỉ cho ra sắt rèn.',
      en: 'The Bessemer converter blew air through molten pig iron, making steel quickly, in quantity and cheaply. Cort’s puddling furnace only made wrought iron.',
    },
  },
  {
    situation: {
      vi: 'Một nhà máy ô tô cuối thập niên 1960 muốn thay đổi quy trình mà không phải đi dây lại toàn bộ hệ thống điều khiển. Họ cần gì?',
      en: 'In the late 1960s a car factory wants to change its process without rewiring its whole control system. What does it need?',
    },
    answer: 'ir3-3',
    options: ['ir2-3', 'ir2-5', 'ir3-3', 'ir1-1'],
    why: {
      vi: 'PLC điều khiển máy móc bằng chương trình: đổi quy trình chỉ cần sửa chương trình thay vì đi dây lại.',
      en: 'A PLC controls machines with a program: changing the process means editing the program instead of rewiring.',
    },
  },
  {
    situation: {
      vi: 'Một nhà máy ngày nay muốn biết trước khi nào động cơ sắp hỏng để bảo trì kịp lúc. Công nghệ nào giúp họ?',
      en: 'A factory today wants to know in advance when a motor is about to fail, so it can be serviced in time. Which technology helps?',
    },
    answer: 'ir4-2',
    options: ['ir4-1', 'ir4-2', 'ir2-4', 'ir1-4'],
    why: {
      vi: 'Cảm biến IIoT thu thập dữ liệu liên tục, và bảo trì dự đoán dùng dữ liệu đó để báo khi nguy cơ hỏng hóc tăng lên.',
      en: 'IIoT sensors collect data continuously, and predictive maintenance uses that data to warn when the risk of failure is rising.',
    },
  },
  {
    situation: {
      vi: 'Một nhà thiết kế cần ngay một mẫu thử của chi tiết có hình dạng phức tạp, từ bản vẽ trên máy tính. Nên dùng gì?',
      en: 'A designer needs a prototype of a complex part, straight from a computer drawing. What should she use?',
    },
    answer: 'ir4-1',
    options: ['ir2-1', 'ir3-2', 'ir4-1', 'ir1-2'],
    why: {
      vi: 'In 3D tạo vật thể từ mô hình số bằng cách đắp từng lớp vật liệu, rất hợp để làm nhanh mẫu thử có hình dạng phức tạp.',
      en: '3D printing builds objects layer by layer from a digital model, ideal for quick prototypes with complex shapes.',
    },
  },
]

const vi = {
  title: 'Cỗ máy thời gian',
  // On the lectern's screen in the room.
  consoleIntro:
    'Cỗ máy thời gian đã hỏng: bốn lõi năng lượng của nó đã tắt. Vượt qua bốn thử thách để thắp sáng từng lõi và mở cánh cổng phía sau.',
  consoleStart: 'Khởi động',
  consoleContinue: 'Tiếp tục sửa chữa',
  consoleDone: 'Cỗ máy đã hoạt động! Cánh cổng phía sau đã mở.',
  close: 'Đóng',
  cores: 'Lõi năng lượng',
  roundOf: 'Thử thách {n}/4',
  check: 'Kiểm tra',
  next: 'Thử thách tiếp theo',
  retry: 'Thử lại',
  finish: 'Hoàn tất',
  passed: 'Lõi năng lượng đã sáng!',
  failed: 'Chưa đủ để thắp sáng lõi. Hãy xem lại và thử lần nữa.',
  score: 'Đúng {score}/{total} (cần {need})',
  review: 'Xem lại: {room}',
  rounds: [
    {
      name: 'Dòng thời gian',
      task: 'Mỗi phát minh thuộc cuộc Cách mạng Công nghiệp nào? Chọn I, II, III hoặc IV cho từng thẻ rồi bấm Kiểm tra.',
    },
    {
      name: 'Nối dây',
      task: 'Nối mỗi người hoặc tổ chức với phát minh của họ: chọn một ô bên trái, rồi một ô bên phải.',
    },
    {
      name: 'Cỗ máy bí ẩn',
      task: 'Chỉ còn lại cái bóng của một cỗ máy. Dựa vào hình dáng và gợi ý, đó là phát minh nào? (Phím 1-4 cũng chọn được.)',
    },
    {
      name: 'Thử thách nhà máy',
      task: 'Mỗi tình huống cần một phát minh. Chọn phát minh phù hợp nhất. (Phím 1-4 cũng chọn được.)',
    },
  ],
  clueEra: 'Thời kỳ: {room}',
  doneTitle: 'Cỗ máy thời gian đã hoạt động!',
  doneText: 'Cả bốn lõi năng lượng đã sáng. Cánh cổng phía sau Phòng trò chơi đã mở: hãy bước vào để du hành xuyên thời gian.',
}

const en: typeof vi = {
  title: 'The Time Machine',
  consoleIntro:
    'The time machine is broken: its four power cores have gone dark. Pass four challenges to relight each core and open the portal at the back.',
  consoleStart: 'Start',
  consoleContinue: 'Continue the repair',
  consoleDone: 'The machine is running! The portal at the back is open.',
  close: 'Close',
  cores: 'Power cores',
  roundOf: 'Challenge {n}/4',
  check: 'Check',
  next: 'Next challenge',
  retry: 'Try again',
  finish: 'Finish',
  passed: 'The power core is lit!',
  failed: 'Not enough to light the core yet. Look back and try again.',
  score: '{score}/{total} right (need {need})',
  review: 'Look again: {room}',
  rounds: [
    {
      name: 'Timeline',
      task: 'Which Industrial Revolution does each invention belong to? Choose I, II, III or IV for every card, then press Check.',
    },
    {
      name: 'Wire it up',
      task: 'Connect each person or company to their invention: choose a box on the left, then one on the right.',
    },
    {
      name: 'Mystery machine',
      task: 'Only the shadow of a machine is left. From its shape and the clue, which invention is it? (Keys 1-4 also choose.)',
    },
    {
      name: 'Factory challenge',
      task: 'Each situation needs one invention. Choose the one that fits best. (Keys 1-4 also choose.)',
    },
  ],
  clueEra: 'Era: {room}',
  doneTitle: 'The time machine is running!',
  doneText: 'All four power cores are lit. The portal at the back of the Game Room is open: step through it to travel through time.',
}

export type GameText = typeof vi
export const gameText: Record<Language, GameText> = { vi, en }

// Touch screens: the same texts without the keys.
export const gameTouchText: Record<Language, Partial<GameText>> = {
  vi: {
    rounds: vi.rounds.map((r) => ({ ...r, task: r.task.replace(' (Phím 1-4 cũng chọn được.)', '') })),
  },
  en: {
    rounds: en.rounds.map((r) => ({ ...r, task: r.task.replace(' (Keys 1-4 also choose.)', '') })),
  },
}
