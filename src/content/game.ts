import type { Language } from './language'

// THE TIME MACHINE GAME in the Game Room (TimeMachineGame.tsx), in both languages: the
// "repair shop", four rounds that each play differently and relight one core of the broken
// time machine; all four open the portal. The rounds' cards are in game-cards.ts. Every answer
// comes from the exhibit texts (exhibits.ts and their sources), and a wrong answer points to
// where the visitor can read about it.
// (MAKERS and CHALLENGES are from the first version of the game, kept as material for cards;
// the original game is saved in git under the tag minigame-v1.)

type Both = Record<Language, string>
export type Era = 1 | 2 | 3 | 4

// Which era room each invention is in (from its id: ir2-3 = CMCN 2).
export const eraOf = (id: string) => Number(id[2]) as Era
export const INVENTION_IDS = [
  'ir1-1', 'ir1-2', 'ir1-3', 'ir1-4', 'ir1-5',
  'ir2-1', 'ir2-2', 'ir2-3', 'ir2-4', 'ir2-5',
  'ir3-1', 'ir3-2', 'ir3-3', 'ir3-4', 'ir3-5',
  'ir4-1', 'ir4-2', 'ir4-3', 'ir4-4', 'ir4-5', 'ir4-6',
]

// Round 2: who is behind each invention (as on the exhibit boards).
export const MAKERS: { id: string; who: Both }[] = [
  { id: 'ir1-1', who: { vi: 'James Watt', en: 'James Watt' } },
  { id: 'ir1-2', who: { vi: 'Richard Arkwright', en: 'Richard Arkwright' } },
  { id: 'ir1-3', who: { vi: 'Henry Cort', en: 'Henry Cort' } },
  { id: 'ir1-4', who: { vi: 'Robert Stephenson', en: 'Robert Stephenson' } },
  { id: 'ir1-5', who: { vi: 'Samuel Morse và Alfred Vail', en: 'Samuel Morse and Alfred Vail' } },
  { id: 'ir2-1', who: { vi: 'Henry Bessemer', en: 'Henry Bessemer' } },
  { id: 'ir2-2', who: { vi: 'Nikolaus Otto và Karl Benz', en: 'Nikolaus Otto and Karl Benz' } },
  { id: 'ir2-3', who: { vi: 'Thomas Edison và Nikola Tesla', en: 'Thomas Edison and Nikola Tesla' } },
  { id: 'ir2-4', who: { vi: 'Công ty Ford Motor', en: 'Ford Motor Company' } },
  { id: 'ir2-5', who: { vi: 'Alexander Graham Bell', en: 'Alexander Graham Bell' } },
  { id: 'ir3-1', who: { vi: 'Intel', en: 'Intel' } },
  { id: 'ir3-2', who: { vi: 'IBM', en: 'IBM' } },
  { id: 'ir3-3', who: { vi: 'George Devol và Joseph Engelberger', en: 'George Devol and Joseph Engelberger' } },
  { id: 'ir3-4', who: { vi: 'ARPA (Bộ Quốc phòng Hoa Kỳ)', en: 'ARPA (US Department of Defense)' } },
  { id: 'ir3-5', who: { vi: 'Martin Cooper và Tim Berners-Lee', en: 'Martin Cooper and Tim Berners-Lee' } },
  { id: 'ir4-1', who: { vi: 'Chuck Hull', en: 'Chuck Hull' } },
  { id: 'ir4-3', who: { vi: 'John McCarthy và Alan Turing', en: 'John McCarthy and Alan Turing' } },
  { id: 'ir4-6', who: { vi: 'Emmanuelle Charpentier và Jennifer Doudna', en: 'Emmanuelle Charpentier and Jennifer Doudna' } },
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
      vi: 'Năm 1845, một công ty đường sắt muốn báo cho ga sau biết đoàn tàu đã xuất phát, trước khi tàu tới nơi. Phát minh nào giúp họ?',
      en: 'In 1845 a railway company wants to tell the next station that a train has left, before the train arrives. Which invention helps it?',
    },
    answer: 'ir1-5',
    options: ['ir1-5', 'ir1-4', 'ir2-5', 'ir1-1'],
    why: {
      vi: 'Điện báo gửi tin nhắn bằng dòng điện qua dây dẫn, gần như tức thì, nhanh hơn bất kỳ đoàn tàu nào. Điện thoại chỉ ra đời hơn ba mươi năm sau.',
      en: 'The telegraph sent messages as electric current along a wire, almost instantly, faster than any train. The telephone came more than thirty years later.',
    },
  },
  {
    situation: {
      vi: 'Năm 1990, các nhà khoa học ở nhiều nước muốn chia sẻ tài liệu bằng những trang liên kết với nhau, ai cũng mở được từ máy tính của mình. Họ cần gì?',
      en: 'In 1990, scientists in many countries want to share documents as pages linked to one another, which anyone can open on their own computer. What do they need?',
    },
    answer: 'ir3-5',
    options: ['ir3-5', 'ir3-4', 'ir3-2', 'ir2-5'],
    why: {
      vi: 'World Wide Web, do Tim Berners-Lee đề xuất tại CERN năm 1989, chia sẻ thông tin bằng các trang liên kết, chạy trên nền Internet.',
      en: 'The World Wide Web, proposed by Tim Berners-Lee at CERN in 1989, shares information as linked pages, running on the Internet.',
    },
  },
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
    answer: 'ir4-2',
    options: ['ir4-2', 'ir4-1', 'ir3-3', 'ir2-3'],
    why: {
      vi: 'Trong nhà máy kết nối, bản sao số là mô hình ảo của máy móc hoặc dây chuyền thật, dùng để thử nghiệm và dự đoán trước khi thay đổi ngoài thực tế.',
      en: 'In a connected factory, a digital twin is a virtual model of a real machine or production line, used to test and predict before changing the real thing.',
    },
  },
  {
    situation: {
      vi: 'Một công ty khởi nghiệp cần lưu trữ và phân tích dữ liệu từ hàng nghìn cảm biến, nhưng không đủ tiền mua và vận hành máy chủ riêng. Họ nên dùng gì?',
      en: 'A start-up needs to store and analyse data from thousands of sensors, but cannot afford to buy and run its own servers. What should it use?',
    },
    answer: 'ir4-4',
    options: ['ir4-4', 'ir3-2', 'ir4-1', 'ir2-5'],
    why: {
      vi: 'Điện toán đám mây cho thuê sức mạnh tính toán và chỗ lưu trữ qua Internet, dùng bao nhiêu trả bấy nhiêu, nên không cần tự mua máy chủ.',
      en: 'Cloud computing rents out computing power and storage over the Internet, paid for as it is used, so there is no need to buy servers.',
    },
  },
  {
    situation: {
      vi: 'Các nhà khoa học muốn sửa một đoạn gen gây bệnh tại đúng vị trí của nó trên ADN. Công cụ nào giúp họ?',
      en: 'Scientists want to correct a faulty gene at exactly its place in the DNA. Which tool helps them?',
    },
    answer: 'ir4-6',
    options: ['ir4-6', 'ir4-3', 'ir3-1', 'ir1-3'],
    why: {
      vi: '"Chiếc kéo di truyền" CRISPR-Cas9 có thể được điều khiển để cắt ADN tại một vị trí chọn trước, mở đường cho việc chỉnh sửa gen.',
      en: 'The “genetic scissors” CRISPR-Cas9 can be controlled to cut DNA at a chosen place, opening the way to editing genes.',
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
  // (More situations so that each new attempt draws a different set. Written by Claude from
  // the exhibits' own texts: [CẦN KIỂM TRA] / [NEEDS CHECKING] by the content team.)
  {
    situation: {
      vi: 'Một xưởng dệt muốn kéo sợi bông chắc và đều bằng máy, chạy bằng sức nước thay cho tay người. Phát minh nào phù hợp?',
      en: 'A textile workshop wants to spin strong, even cotton thread by machine, driven by water power instead of hands. Which invention fits?',
    },
    answer: 'ir1-2',
    options: ['ir1-2', 'ir2-4', 'ir3-1', 'ir4-1'],
    why: {
      vi: 'Máy kéo sợi Water Frame chạy bằng sức nước, kéo được sợi bông chắc, mở đường cho các nhà máy dệt.',
      en: 'The water frame, driven by water power, spun strong cotton thread and opened the way to textile mills.',
    },
  },
  {
    situation: {
      vi: 'Các xưởng rèn cần rất nhiều sắt rèn tốt hơn để làm máy móc, nhưng cách làm cũ chậm và tốn kém. Phát minh nào giúp họ?',
      en: 'Forges need far more good wrought iron for machines, but the old methods are slow and costly. Which invention helps them?',
    },
    answer: 'ir1-3',
    options: ['ir1-3', 'ir2-5', 'ir3-2', 'ir4-2'],
    why: {
      vi: 'Luyện sắt bằng lò khuấy (puddling) biến gang thành sắt rèn với số lượng lớn hơn, dùng than đá làm nhiên liệu.',
      en: 'Puddling turned pig iron into wrought iron in larger quantities, using coal as fuel.',
    },
  },
  {
    situation: {
      vi: 'Một nhà máy muốn có nguồn động lực mạnh và ổn định, không phụ thuộc vào dòng sông hay sức gió. Họ nên dùng gì?',
      en: 'A factory wants a strong, steady source of power that does not depend on a river or the wind. What should it use?',
    },
    answer: 'ir1-1',
    options: ['ir1-1', 'ir1-2', 'ir3-3', 'ir4-4'],
    why: {
      vi: 'Động cơ hơi nước của James Watt cho phép đặt nhà máy ở bất cứ đâu có than, không cần gần sông.',
      en: 'James Watt’s steam engine let factories be built wherever there was coal, not only beside rivers.',
    },
  },
  {
    situation: {
      vi: 'Ngành đường sắt cần một lượng lớn thép rẻ và bền để làm đường ray. Quy trình nào giúp sản xuất thép hàng loạt?',
      en: 'The railways need large amounts of cheap, strong steel for rails. Which process made mass-produced steel possible?',
    },
    answer: 'ir2-1',
    options: ['ir2-1', 'ir1-3', 'ir3-1', 'ir4-5'],
    why: {
      vi: 'Quy trình Bessemer thổi không khí qua gang nóng chảy để luyện thép nhanh và rẻ hơn nhiều so với trước.',
      en: 'The Bessemer process blew air through molten iron to make steel far faster and more cheaply than before.',
    },
  },
  {
    situation: {
      vi: 'Cuối thế kỷ XIX, một thương nhân muốn nói chuyện trực tiếp bằng giọng nói với đối tác ở thành phố khác. Phát minh nào giúp ông?',
      en: 'In the late 19th century a merchant wants to speak directly, by voice, with a partner in another city. Which invention helps him?',
    },
    answer: 'ir2-5',
    options: ['ir2-5', 'ir3-4', 'ir1-4', 'ir4-3'],
    why: {
      vi: 'Điện thoại truyền giọng nói qua dây điện, cho phép trò chuyện tức thì ở khoảng cách xa.',
      en: 'The telephone carried the voice along wires, allowing instant conversation over long distances.',
    },
  },
  {
    situation: {
      vi: 'Một nhà máy muốn làm việc cả ban đêm và chạy từng máy bằng động cơ riêng thay cho dây curoa chung. Họ cần gì?',
      en: 'A factory wants to work at night too, and run each machine with its own motor instead of shared belts. What does it need?',
    },
    answer: 'ir2-3',
    options: ['ir2-3', 'ir1-1', 'ir3-2', 'ir4-1'],
    why: {
      vi: 'Điện năng mang đến đèn điện để thắp sáng và động cơ điện để chạy từng máy riêng lẻ.',
      en: 'Electric power brought electric light for the night and electric motors to drive each machine on its own.',
    },
  },
  {
    situation: {
      vi: 'Một hãng máy tính bỏ túi muốn đặt toàn bộ bộ xử lý của máy lên một con chip nhỏ duy nhất. Phát minh nào làm được điều đó?',
      en: 'A calculator maker wants to put the whole processor of its machine onto one small chip. Which invention made that possible?',
    },
    answer: 'ir3-1',
    options: ['ir3-1', 'ir3-2', 'ir2-3', 'ir4-4'],
    why: {
      vi: 'Bộ vi xử lý như Intel 4004 gom bộ xử lý trung tâm vào một con chip duy nhất.',
      en: 'A microprocessor such as the Intel 4004 put the central processing unit onto a single chip.',
    },
  },
  {
    situation: {
      vi: 'Một nhân viên văn phòng muốn có máy tính riêng trên bàn làm việc để soạn văn bản và tính bảng số liệu. Phát minh nào phù hợp?',
      en: 'An office worker wants a computer of their own on the desk, to write documents and work on spreadsheets. Which invention fits?',
    },
    answer: 'ir3-2',
    options: ['ir3-2', 'ir3-1', 'ir2-5', 'ir4-3'],
    why: {
      vi: 'Máy tính cá nhân như IBM 5150 đưa máy tính đến từng bàn làm việc trong văn phòng.',
      en: 'Personal computers such as the IBM 5150 brought computers to individual office desks.',
    },
  },
  {
    situation: {
      vi: 'Các nhà nghiên cứu ở những trường đại học cách xa nhau muốn kết nối máy tính để trao đổi dữ liệu. Phát minh nào giúp họ?',
      en: 'Researchers at universities far apart want to connect their computers to exchange data. Which invention helps them?',
    },
    answer: 'ir3-4',
    options: ['ir3-4', 'ir2-5', 'ir3-1', 'ir4-2'],
    why: {
      vi: 'Mạng ARPANET kết nối máy tính ở các cơ sở nghiên cứu, một nền tảng quan trọng của Internet.',
      en: 'ARPANET connected computers at research sites, an important foundation of the Internet.',
    },
  },
  {
    situation: {
      vi: 'Một nhà máy muốn tự động phát hiện sản phẩm lỗi trong hàng nghìn bức ảnh chụp mỗi ngày. Công nghệ nào phù hợp nhất?',
      en: 'A factory wants to spot faulty products automatically in thousands of photos taken every day. Which technology fits best?',
    },
    answer: 'ir4-3',
    options: ['ir4-3', 'ir4-4', 'ir3-3', 'ir2-4'],
    why: {
      vi: 'Trí tuệ nhân tạo có thể học cách nhận ra lỗi trong ảnh, xử lý khối lượng lớn nhanh hơn con người.',
      en: 'Artificial intelligence can learn to recognise defects in images, handling large volumes faster than people.',
    },
  },
]

const vi = {
  title: 'Cỗ máy thời gian',
  // On the lectern's screen in the room.
  consoleIntro:
    'Cỗ máy thời gian đã hỏng: lịch sử bị xáo trộn và bốn lõi năng lượng đã tắt. Sửa từng lõi trong xưởng để mở cánh cổng phía sau.',
  consoleStart: 'Khởi động',
  consoleContinue: 'Tiếp tục sửa chữa',
  consoleDone: 'Cỗ máy đã hoạt động! Cánh cổng phía sau đã mở.',
  close: 'Đóng',
  cores: 'Lõi năng lượng',
  roundOf: 'Lõi {n}/4',
  // The workshop (the game's first screen).
  hubIntro: 'Mỗi lõi năng lượng là một thử thách khác nhau về bốn cuộc cách mạng. Thắp sáng cả bốn lõi để mở cánh cổng. Một sao là đủ để qua; ba sao dành cho người muốn chinh phục.',
  repair: 'Sửa lõi {n}',
  resume: 'Tiếp tục lõi {n}',
  replay: 'Chơi lại',
  locked: 'Chưa mở',
  back: 'Về xưởng',
  next: 'Tiếp tục',
  retry: 'Thử lại với thẻ mới',
  finish: 'Hoàn tất',
  passed: 'Lõi {n} đã sáng!',
  failed: 'Chưa đủ điểm để thắp sáng lõi. Hãy xem lại các phòng và thử lần nữa.',
  score: '{score}/{total} điểm (cần {need})',
  points: 'Điểm: {n}',
  placeholder: '[CẦN KIỂM TRA]',
  // A wrong answer (crossed out; the visitor chooses again).
  wrongTitle: 'Chưa đúng.',
  wrongTryOther: 'Hãy chọn lại.',
  wrongHint: 'Gợi ý: câu trả lời nằm ở {room}.',
  // The way back to the rooms, always at the bottom of the game during a core.
  goBack: 'Quay lại các phòng',
  goBackNote: 'Xem lại các phòng bất cứ lúc nào; tiến độ của bạn được giữ nguyên.',
  goBackHelp:
    'Nút này mở bản đồ để bạn xem lại bất kỳ phòng nào, cả khi đang chơi (nó luôn nằm ở cuối khung trò chơi); tiến độ được giữ nguyên. Để trở lại đúng câu đang làm, nhấn phím R trên máy tính, hoặc bấm nút "Quay lại phòng trò chơi" ở cuối màn hình trên điện thoại và máy tính bảng.',
  // While away in the rooms (a button at the bottom of the screen).
  returnToGame: 'Quay lại phòng trò chơi',
  returnKey: 'R',
  rounds: [
    {
      name: 'Lạc giữa thời gian',
      task: 'Các cỗ máy đã rơi ra khỏi dòng thời gian. Đưa mỗi cỗ máy về đúng cánh cửa của cuộc cách mạng của nó. (Phím 1-4 cũng chọn được.)',
    },
    {
      name: 'Thị trấn lớn lên',
      task: 'Một thị trấn đi qua bốn cuộc cách mạng. Mỗi thời kỳ có hai vấn đề: chọn phát minh giải quyết từng vấn đề để thị trấn bước sang thời kỳ tiếp theo. (Phím 1-3 cũng chọn được.)',
    },
    {
      name: 'Tôi là ai?',
      task: 'Đoán điều bí ẩn từ các gợi ý. Đoán càng sớm, càng nhiều điểm; cần thì mở thêm gợi ý. (Phím 1-4 cũng chọn được.)',
    },
    {
      name: 'Những vị khách từ quá khứ',
      task: 'Bốn vị khách bước ra từ cỗ máy thời gian, mỗi người từ một thời kỳ. Hãy cho họ lời khuyên đúng với thời đại của họ. (Phím 1-3 cũng chọn được.)',
    },
  ],
  // Core I
  cardOf: 'Thẻ {n}/{total}',
  combo: 'Chuỗi ×{n}',
  rightDoor: 'Đúng chỗ!',
  // Core II
  townIn: 'Thị trấn năm {year}',
  problemOf: 'Vấn đề {n}/{total} của thời kỳ này',
  eraJump: 'Thị trấn bước sang thời kỳ mới!',
  // Core III
  mysteryOf: 'Bí ẩn {n}/{total}',
  clue: 'Gợi ý {n}',
  moreClue: 'Mở gợi ý tiếp',
  worth: 'Đoán ngay: {n} điểm',
  solved: 'Chính xác! +{n} điểm',
  era: 'Một cuộc cách mạng',
  // Core IV
  visitorOf: 'Vị khách {n}/4',
  adviceOf: 'Lời khuyên {n}/{total}',
  happy: ['Tuyệt quá, cảm ơn bạn!', 'À, ra là vậy! Tôi hiểu rồi.', 'Hay lắm, tôi sẽ làm theo!'],
  puzzled: ['Hả? Tôi chưa nghe đến thứ đó bao giờ...', 'Hừm, nghe không ổn lắm...', 'Bạn chắc chứ? Tôi thấy lạ quá.'],
  goodbye: 'Tạm biệt và cảm ơn nhé!',
  doneTitle: 'Cỗ máy thời gian đã hoạt động!',
  doneText: 'Cả bốn lõi năng lượng đã sáng. Cánh cổng phía sau Phòng trò chơi đã mở: hãy bước vào để du hành xuyên thời gian.',
}

const en: typeof vi = {
  title: 'The Time Machine',
  consoleIntro:
    'The time machine is broken: history is scrambled and its four power cores have gone dark. Repair each core in the workshop to open the portal at the back.',
  consoleStart: 'Start',
  consoleContinue: 'Continue the repair',
  consoleDone: 'The machine is running! The portal at the back is open.',
  close: 'Close',
  cores: 'Power cores',
  roundOf: 'Core {n}/4',
  hubIntro: 'Each power core is a different challenge about the four revolutions. Light all four to open the portal. One star is enough to pass; three are for those who want to master it.',
  repair: 'Repair core {n}',
  resume: 'Continue core {n}',
  replay: 'Replay',
  locked: 'Locked',
  back: 'Back to the workshop',
  next: 'Continue',
  retry: 'Try again with new cards',
  finish: 'Finish',
  passed: 'Core {n} is lit!',
  failed: 'Not enough points to light the core yet. Look around the rooms again and have another go.',
  score: '{score}/{total} points (need {need})',
  points: 'Points: {n}',
  placeholder: '[NEEDS CHECKING]',
  wrongTitle: 'Not quite.',
  wrongTryOther: 'Choose again.',
  wrongHint: 'Hint: the answer is in {room}.',
  goBack: 'Back to the rooms',
  goBackNote: 'Look around the rooms at any time; your progress is kept.',
  goBackHelp:
    'This button opens the map so you can look around any room again, even mid-challenge (it is always at the bottom of the game); your progress is kept. To come back to the same question, press R on a computer, or tap the “Back to the Game Room” button at the bottom of the screen on a phone or tablet.',
  returnToGame: 'Back to the Game Room',
  returnKey: 'R',
  rounds: [
    {
      name: 'Lost in time',
      task: 'Machines have fallen out of the timeline. Send each one through the door of its own revolution. (Keys 1-4 also choose.)',
    },
    {
      name: 'The growing town',
      task: 'A town lives through four revolutions. Each era brings two problems: choose the invention that solves each one, and the town moves on to the next era. (Keys 1-3 also choose.)',
    },
    {
      name: 'Who am I?',
      task: 'Guess the mystery from its clues. The sooner you guess, the more points you score; open another clue when you need one. (Keys 1-4 also choose.)',
    },
    {
      name: 'Visitors from the past',
      task: 'Four visitors step out of the time machine, each from a different era. Give them advice that fits their time. (Keys 1-3 also choose.)',
    },
  ],
  cardOf: 'Card {n}/{total}',
  combo: 'Combo ×{n}',
  rightDoor: 'Right door!',
  townIn: 'The town in {year}',
  problemOf: 'Problem {n}/{total} of this era',
  eraJump: 'The town moves into a new era!',
  mysteryOf: 'Mystery {n}/{total}',
  clue: 'Clue {n}',
  moreClue: 'Open the next clue',
  worth: 'Guess now: {n} points',
  solved: 'Correct! +{n} points',
  era: 'A revolution',
  visitorOf: 'Visitor {n}/4',
  adviceOf: 'Advice {n}/{total}',
  happy: ['Wonderful, thank you!', 'Ah, so that’s how it is! I see.', 'Splendid, I’ll do just that!'],
  puzzled: ['What? I’ve never heard of such a thing...', 'Hmm, that doesn’t sound right...', 'Are you sure? That seems odd to me.'],
  goodbye: 'Goodbye, and thank you!',
  doneTitle: 'The time machine is running!',
  doneText: 'All four power cores are lit. The portal at the back of the Game Room is open: step through it to travel through time.',
}

export type GameText = typeof vi
export const gameText: Record<Language, GameText> = { vi, en }

// Touch screens: the same texts without the keys.
const noKeys = (text: string) => text.replace(/ \((Phím|Keys) [^)]*\)/, '')
export const gameTouchText: Record<Language, Partial<GameText>> = {
  vi: {
    rounds: vi.rounds.map((r) => ({ ...r, task: noKeys(r.task) })),
  },
  en: {
    rounds: en.rounds.map((r) => ({ ...r, task: noKeys(r.task) })),
  },
}
