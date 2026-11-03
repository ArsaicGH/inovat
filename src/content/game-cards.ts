import type { Language } from './language'
import type { Era } from './game'

// THE CARDS OF THE TIME MACHINE REPAIR SHOP (TimeMachineGame.tsx), in both languages.
// Every card is built only from what the museum's own boards say (exhibits.ts, the rooms'
// overview boards and their "what it changed" walls), and names the board it comes from
// (`from`), so a visitor who goes back to the rooms knows where to look.
// Core I (Lost in time) needs no cards here: it uses the inventions (game.ts) and the
// era rooms' gallery photos (pictures.ts).
// Written by Claude from those texts: [CẦN KIỂM TRA] / [NEEDS CHECKING] by the content team.

type Both = Record<Language, string>

// ---- Core II: Grow the town ----
// One town, from 1760 to 2026. Each era it shows three problems (drawn from that era's pool);
// each is solved by one invention. The two wrong fixes are real inventions: one from the
// wrong time, one from the right time that does not solve this problem.
export type Spot = 'power' | 'making' | 'transport' | 'message' | 'home' | 'office'
export interface TownProblem {
  id: string
  era: Era // the era whose inventions solve it
  spot: Spot // where it shows in the town picture
  problem: Both
  options: [string, string, string] // invention ids: [right, wrong, wrong]
  fixed: Both // what changes once it is solved
}
export const TOWN_YEARS = [1760, 1840, 1920, 1990, 2026] // the town before each era, and after the last
export const TOWN: TownProblem[] = [
  // Era 1: the town of 1760
  {
    id: 't1-power',
    era: 1,
    spot: 'power',
    problem: { vi: 'Cối xay của thị trấn chỉ chạy được bên bờ sông, và đứng im mỗi khi nước cạn.', en: 'The town’s mill only works beside the river, and stands still whenever the water runs low.' },
    options: ['ir1-1', 'ir2-3', 'ir1-2'],
    fixed: { vi: 'Động cơ hơi nước đốt than quay máy ở bất cứ đâu: nhà máy rời bờ sông, ống khói mọc lên giữa thị trấn.', en: 'A coal-fired steam engine drives machines anywhere: the mill leaves the river and chimneys rise in town.' },
  },
  {
    id: 't1-making',
    era: 1,
    spot: 'making',
    problem: { vi: 'Cả làng kéo sợi bằng tay ở nhà: sợi làm ra chậm, ít và không đều.', en: 'The whole village spins thread by hand at home: slowly, little of it, and uneven.' },
    options: ['ir1-2', 'ir2-4', 'ir1-3'],
    fixed: { vi: 'Máy kéo sợi Water Frame làm sợi chắc với số lượng lớn; máy móc gom về một nhà máy chung.', en: 'The Water Frame spins strong thread in quantity; the machines gather in one mill.' },
  },
  {
    id: 't1-iron',
    era: 1,
    spot: 'making',
    problem: { vi: 'Thợ rèn cần thật nhiều sắt để làm máy móc, nhưng sắt luyện bằng than củi thì ít và đắt.', en: 'The smiths need far more iron for machines, but iron made with charcoal is scarce and dear.' },
    options: ['ir1-3', 'ir2-1', 'ir1-1'],
    fixed: { vi: 'Lò khuấy đốt than đá cho ra sắt rèn dẻo dai với số lượng lớn: sắt thành vật liệu của máy móc, cầu và đường ray.', en: 'The coal-fired puddling furnace makes tough wrought iron in quantity: iron becomes the stuff of machines, bridges and rails.' },
  },
  {
    id: 't1-transport',
    era: 1,
    spot: 'transport',
    problem: { vi: 'Than và hàng hóa đi bằng xe ngựa: chậm, chở được ít, và chợ ở xa thì hàng tới muộn.', en: 'Coal and goods go by horse and cart: slow, small loads, and distant markets get them late.' },
    options: ['ir1-4', 'ir2-2', 'ir1-5'],
    fixed: { vi: 'Đầu máy hơi nước kéo cả đoàn tàu trên đường ray, nối nơi sản xuất với thị trường.', en: 'Steam locomotives pull whole trains on rails, linking places of production with their markets.' },
  },
  {
    id: 't1-message',
    era: 1,
    spot: 'message',
    problem: { vi: 'Nhà ga ở đầu kia tuyến đường sắt cần biết đoàn tàu đã xuất phát, trước khi tàu tới nơi.', en: 'The station at the far end of the line needs to know a train has left, before the train arrives.' },
    options: ['ir1-5', 'ir2-5', 'ir1-4'],
    fixed: { vi: 'Điện báo gửi tin bằng dòng điện qua dây dẫn, gần như tức thì: tin tức đi nhanh hơn cả đoàn tàu.', en: 'The telegraph sends news as current along a wire, almost instantly: news now outruns the train.' },
  },
  // Era 2: the town of 1840
  {
    id: 't2-steel',
    era: 2,
    spot: 'office',
    problem: { vi: 'Thị trấn muốn xây cầu lớn và nhà cao tầng, nhưng thép làm chậm, ít và rất đắt.', en: 'The town wants great bridges and tall buildings, but steel is made slowly, in small amounts and at high cost.' },
    options: ['ir2-1', 'ir1-3', 'ir4-1'],
    fixed: { vi: 'Lò Bessemer thổi không khí qua gang nóng chảy, làm thép nhanh, nhiều và rẻ: cầu thép và nhà cao tầng mọc lên.', en: 'The Bessemer converter blows air through molten iron, making steel fast, plentiful and cheap: steel bridges and tall buildings rise.' },
  },
  {
    id: 't2-transport',
    era: 2,
    spot: 'transport',
    problem: { vi: 'Muốn đi nhanh thì phải theo đường ray; ngoài ra vẫn chỉ có xe ngựa. Người ta muốn một cỗ xe nhỏ gọn tự chạy.', en: 'To go fast you must follow the rails; otherwise there are only horses. People want a small vehicle that moves by itself.' },
    options: ['ir2-2', 'ir1-1', 'ir1-4'],
    fixed: { vi: 'Động cơ đốt trong đốt nhiên liệu ngay trong xi-lanh, đủ nhỏ để đặt lên một chiếc xe: ô tô ra đời.', en: 'The internal combustion engine burns fuel inside its cylinder, small enough for a carriage: the car is born.' },
  },
  {
    id: 't2-light',
    era: 2,
    spot: 'home',
    problem: { vi: 'Khi trời tối, đường phố chìm trong bóng tối và nhà máy phải nghỉ; cả xưởng lại quay theo một động cơ duy nhất.', en: 'At nightfall the streets go dark and the factory must stop; and the whole works turns on a single engine.' },
    options: ['ir2-3', 'ir1-1', 'ir2-5'],
    fixed: { vi: 'Đèn điện thắp sáng nhà cửa, phố xá và nhà máy; động cơ điện được đặt ở bất cứ máy nào cần.', en: 'Electric light fills homes, streets and factories; electric motors sit wherever a machine needs one.' },
  },
  {
    id: 't2-making',
    era: 2,
    spot: 'making',
    problem: { vi: 'Ô tô được lắp từng chiếc một, chậm và đắt: chỉ người giàu mới mua nổi.', en: 'Cars are built one at a time, slowly and expensively: only the rich can afford one.' },
    options: ['ir2-4', 'ir3-3', 'ir2-1'],
    fixed: { vi: 'Dây chuyền lắp ráp đưa xe qua từng công nhân, mỗi người một bước: xe làm nhanh và rẻ hơn hẳn.', en: 'The assembly line carries each car past the workers, one step each: cars are made far faster and cheaper.' },
  },
  {
    id: 't2-message',
    era: 2,
    spot: 'message',
    problem: { vi: 'Điện báo chỉ gửi được những tín hiệu phải dịch ra chữ; các thương nhân muốn trò chuyện trực tiếp với đối tác ở xa.', en: 'The telegraph only sends signals that must be turned into words; merchants want to talk directly to partners far away.' },
    options: ['ir2-5', 'ir3-5', 'ir1-5'],
    fixed: { vi: 'Điện thoại mang giọng nói đi xa; mạng lưới điện thoại nối các nhà, các công ty và các cơ quan.', en: 'The telephone carries the voice far away; telephone networks link homes, businesses and offices.' },
  },
  // Era 3: the town of 1920
  {
    id: 't3-chip',
    era: 3,
    spot: 'office',
    problem: { vi: 'Bộ xử lý của máy tính cần rất nhiều linh kiện; các kỹ sư muốn gói cả bộ xử lý vào một linh kiện thật nhỏ.', en: 'A computer’s processor needs a great many parts; engineers want to fit the whole processor into one tiny part.' },
    options: ['ir3-1', 'ir3-2', 'ir4-4'],
    fixed: { vi: 'Bộ vi xử lý đặt cả bộ xử lý trung tâm lên một con chip: thiết bị điện tử nhỏ và nhẹ dần.', en: 'The microprocessor puts a whole central processor on one chip: electronics grow smaller and lighter.' },
  },
  {
    id: 't3-pc',
    era: 3,
    spot: 'office',
    problem: { vi: 'Máy tính chỉ có ở các tổ chức lớn; nhân viên văn phòng và học sinh muốn có máy tính của riêng mình.', en: 'Only big organisations have computers; office workers and pupils want a computer of their own.' },
    options: ['ir3-2', 'ir4-4', 'ir3-4'],
    fixed: { vi: 'Máy tính cá nhân vào văn phòng, trường học và gia đình: soạn văn bản, tính toán, lưu dữ liệu.', en: 'The personal computer reaches offices, schools and homes: writing, calculating and storing data.' },
  },
  {
    id: 't3-robot',
    era: 3,
    spot: 'making',
    problem: { vi: 'Trong xưởng ô tô, công việc nâng vật nặng và lặp đi lặp lại vừa nặng nhọc vừa nguy hiểm cho công nhân.', en: 'In the car works, lifting heavy parts over and over is exhausting and dangerous for the workers.' },
    options: ['ir3-3', 'ir2-4', 'ir4-3'],
    fixed: { vi: 'Robot công nghiệp làm những động tác lập trình sẵn, lặp lại, và đưa công nhân tránh xa chỗ nguy hiểm.', en: 'Industrial robots carry out programmed, repeated movements and keep workers away from danger.' },
  },
  {
    id: 't3-plc',
    era: 3,
    spot: 'power',
    problem: { vi: 'Mỗi lần đổi quy trình sản xuất, kỹ sư lại phải đi dây lại toàn bộ tủ điều khiển.', en: 'Every time the process changes, engineers must rewire the whole control cabinet.' },
    options: ['ir3-3', 'ir2-3', 'ir4-2'],
    fixed: { vi: 'Bộ điều khiển lập trình (PLC) điều khiển máy bằng chương trình: đổi quy trình chỉ cần sửa chương trình.', en: 'The programmable logic controller (PLC) runs machines with a program: a new process just means editing it.' },
  },
  {
    id: 't3-network',
    era: 3,
    spot: 'message',
    problem: { vi: 'Máy tính ở những viện nghiên cứu cách xa nhau không thể trao đổi dữ liệu với nhau.', en: 'Computers at research sites far apart cannot exchange data with each other.' },
    options: ['ir3-4', 'ir2-5', 'ir4-4'],
    fixed: { vi: 'Mạng ARPANET nối máy tính ở các nơi để trao đổi dữ liệu, một nền móng của Internet.', en: 'ARPANET links computers in different places to exchange data, one of the foundations of the Internet.' },
  },
  {
    id: 't3-mobile',
    era: 3,
    spot: 'transport',
    problem: { vi: 'Chiếc điện thoại vẫn bị buộc vào sợi dây trên tường; người ta muốn gọi điện khi đang đi ngoài phố.', en: 'The telephone is still tied to a wire on the wall; people want to call while walking down the street.' },
    options: ['ir3-5', 'ir2-5', 'ir3-4'],
    fixed: { vi: 'Điện thoại di động cầm tay cho phép gọi điện ở bất cứ đâu.', en: 'The handheld mobile phone lets people call from anywhere.' },
  },
  {
    id: 't3-web',
    era: 3,
    spot: 'home',
    problem: { vi: 'Các nhà khoa học muốn chia sẻ tài liệu thành những trang liên kết với nhau, ai cũng mở được từ máy của mình.', en: 'Scientists want to share documents as pages linked to one another, which anyone can open on their own computer.' },
    options: ['ir3-5', 'ir3-4', 'ir4-3'],
    fixed: { vi: 'World Wide Web chia sẻ thông tin bằng các trang liên kết, chạy trên nền Internet.', en: 'The World Wide Web shares information as linked pages, running on the Internet.' },
  },
  // Era 4: the town of 1990
  {
    id: 't4-print',
    era: 4,
    spot: 'making',
    problem: { vi: 'Nhà thiết kế cần ngay mẫu thử của một chi tiết hình dạng phức tạp, từ bản vẽ trên máy tính.', en: 'A designer needs a prototype of a complex part right away, straight from a computer drawing.' },
    options: ['ir4-1', 'ir2-1', 'ir3-3'],
    fixed: { vi: 'Máy in 3D đắp vật liệu từng lớp theo mô hình số: mẫu thử có ngay, hình dạng phức tạp cũng được.', en: 'A 3D printer builds up material layer by layer from the digital model: a quick prototype, complex shape and all.' },
  },
  {
    id: 't4-predict',
    era: 4,
    spot: 'power',
    problem: { vi: 'Máy móc hỏng bất ngờ làm cả dây chuyền dừng lại; nhà máy muốn biết trước khi máy sắp hỏng.', en: 'Machines break down without warning and stop the whole line; the factory wants to know before a machine fails.' },
    options: ['ir4-2', 'ir3-3', 'ir2-4'],
    fixed: { vi: 'Cảm biến gửi dữ liệu liên tục; hệ thống phân tích và cảnh báo trước khi nguy cơ hỏng hóc tăng (bảo trì dự đoán).', en: 'Sensors send data all the time; the system analyses it and warns when a breakdown is becoming likely (predictive maintenance).' },
  },
  {
    id: 't4-twin',
    era: 4,
    spot: 'making',
    problem: { vi: 'Kỹ sư muốn thử bố trí lại dây chuyền, nhưng không thể dừng nhà máy thật để thử.', en: 'Engineers want to try rearranging the line, but cannot stop the real factory to try it.' },
    options: ['ir4-2', 'ir4-1', 'ir3-2'],
    fixed: { vi: 'Bản sao số phản chiếu trạng thái của dây chuyền thật: thử thay đổi trên đó trước khi làm thật.', en: 'A digital twin mirrors the real line: changes are tested on it before being made for real.' },
  },
  {
    id: 't4-inspect',
    era: 4,
    spot: 'office',
    problem: { vi: 'Mỗi giờ có hàng nghìn sản phẩm cần kiểm tra lỗi; mắt người mỏi dần và bỏ sót.', en: 'Thousands of products an hour must be checked for faults; human eyes tire and miss things.' },
    options: ['ir4-3', 'ir3-3', 'ir4-4'],
    fixed: { vi: 'AI học từ ảnh mẫu để nhận ra lỗi, nhanh và đều tay, dưới sự giám sát của con người.', en: 'AI learns from example images to spot faults quickly and consistently, with people overseeing it.' },
  },
  {
    id: 't4-cloud',
    era: 4,
    spot: 'home',
    problem: { vi: 'Một công ty nhỏ có dữ liệu từ hàng nghìn cảm biến, nhưng không đủ tiền mua và vận hành máy chủ riêng.', en: 'A small company has data from thousands of sensors, but cannot afford to buy and run its own servers.' },
    options: ['ir4-4', 'ir3-2', 'ir3-4'],
    fixed: { vi: 'Điện toán đám mây cho thuê sức tính toán và chỗ lưu trữ qua Internet, dùng bao nhiêu trả bấy nhiêu.', en: 'Cloud computing rents out computing power and storage over the Internet, paid for as it is used.' },
  },
  {
    id: 't4-cobot',
    era: 4,
    spot: 'transport',
    problem: { vi: 'Một xưởng nhỏ muốn có robot làm ngay cạnh công nhân để cùng đóng gói, không cần hàng rào chắn.', en: 'A small workshop wants a robot working right beside its staff, packing together, without a safety fence.' },
    options: ['ir4-5', 'ir3-3', 'ir2-4'],
    fixed: { vi: 'Robot cộng tác (cobot) có camera và cảm biến lực, được thiết kế để làm việc gần con người, sau khi đánh giá rủi ro.', en: 'A collaborative robot (cobot), with cameras and force sensors, is designed to work near people, after a risk assessment.' },
  },
  {
    id: 't4-gene',
    era: 4,
    spot: 'message',
    problem: { vi: 'Một gen lỗi gây bệnh; các nhà khoa học muốn sửa nó đúng tại vị trí của nó trên ADN.', en: 'A faulty gene causes a disease; scientists want to correct it at exactly its place in the DNA.' },
    options: ['ir4-6', 'ir4-3', 'ir4-1'],
    fixed: { vi: '"Chiếc kéo di truyền" CRISPR-Cas9 cắt ADN tại vị trí chọn trước, mở đường cho chỉnh sửa gen, dù vẫn cần quản lý chặt chẽ.', en: 'The “genetic scissors” CRISPR-Cas9 cut DNA at a chosen place, opening the way to gene editing, though it must be tightly regulated.' },
  },
  {
    id: 't4-vaccine',
    era: 4,
    spot: 'home',
    problem: { vi: 'Một đại dịch mới bùng phát; thế giới cần vắc-xin nhanh hơn bao giờ hết.', en: 'A new pandemic breaks out; the world needs a vaccine faster than ever before.' },
    options: ['ir4-6', 'ir4-4', 'ir4-5'],
    fixed: { vi: 'Vắc-xin mRNA được phát triển với tốc độ chưa từng có trong đại dịch COVID-19.', en: 'mRNA vaccines were developed at unprecedented speed during the COVID-19 pandemic.' },
  },
]

// ---- Core III: Who am I? ----
// A mystery (an invention, or one of the four revolutions) and four clues, from the big
// picture (its era, the problem it solved, what it changed) to one detail from its board.
// The other answers offered are from the same era, so the first clue alone never decides.
export interface Mystery {
  id: string // an invention id, or 'ir1'-'ir4' for a revolution
  clues: [Both, Both, Both, Both]
}
export const MYSTERIES: Mystery[] = [
  {
    id: 'ir1-1',
    clues: [
      { vi: 'Tôi ra đời trong thời đại của hơi nước và máy móc.', en: 'I was born in the age of steam and machines.' },
      { vi: 'Trước tôi, sản xuất dựa vào sức người, sức vật hoặc sức nước.', en: 'Before me, work relied on human or animal strength, or running water.' },
      { vi: 'Nhờ tôi, nhà máy, hầm mỏ và nhiều ngành khác được cơ giới hóa.', en: 'Thanks to me, factories, mines and many other industries were mechanised.' },
      { vi: 'Bí quyết của tôi là một bình ngưng tách riêng, đỡ phí nhiệt hơn hẳn.', en: 'My secret is a separate condenser, which wastes far less heat.' },
    ],
  },
  {
    id: 'ir1-2',
    clues: [
      { vi: 'Tôi thuộc thời mà sản xuất rời khỏi những ngôi nhà để vào nhà máy.', en: 'I belong to the time when work left people’s homes for the factory.' },
      { vi: 'Tôi làm một việc của ngành dệt mà trước kia người ta làm bằng tay ở nhà.', en: 'I do a textile job that people once did by hand at home.' },
      { vi: 'Vì tôi cần nguồn động lực và chỗ đặt máy, các xưởng gom lại thành nhà máy tập trung.', en: 'Because I needed a power source and room, workshops gathered into centralised mills.' },
      { vi: 'Tôi chạy bằng sức nước, như chính tên tôi; Richard Arkwright làm ra tôi.', en: 'I ran on water power, as my name says; Richard Arkwright made me.' },
    ],
  },
  {
    id: 'ir1-3',
    clues: [
      { vi: 'Tôi sinh ra khi than đá bắt đầu nuôi cả một nền công nghiệp.', en: 'I was born when coal began to feed a whole industry.' },
      { vi: 'Trước tôi, vật liệu tôi làm ra phụ thuộc vào than củi nên làm được rất ít.', en: 'Before me, the material I make depended on charcoal, so little could be made.' },
      { vi: 'Nhờ tôi, máy móc, cầu và đường ray có vật liệu rẻ và dồi dào hơn.', en: 'Thanks to me, machines, bridges and rails got a cheaper, more plentiful material.' },
      { vi: 'Công nhân khuấy gang nóng chảy trong lò của tôi để đốt cháy cacbon; Henry Cort được cấp bằng sáng chế cho tôi.', en: 'Workers stirred molten pig iron in my furnace to burn off the carbon; Henry Cort patented me.' },
    ],
  },
  {
    id: 'ir1-4',
    clues: [
      { vi: 'Tôi chạy bằng nguồn động lực của cuộc cách mạng đầu tiên.', en: 'I run on the power of the first revolution.' },
      { vi: 'Trước tôi, hàng hóa và con người đi chậm, bằng sức ngựa.', en: 'Before me, goods and people travelled slowly, at the speed of horses.' },
      { vi: 'Tôi giúp nối các trung tâm sản xuất với thị trường.', en: 'I helped link centres of production with their markets.' },
      { vi: 'Tôi nổi tiếng nhờ một cuộc thi ở Rainhill, nước Anh.', en: 'I became famous at a contest at Rainhill, England.' },
    ],
  },
  {
    id: 'ir1-5',
    clues: [
      { vi: 'Tôi xuất hiện khi đường sắt đang lan rộng.', en: 'I appeared while the railways were spreading.' },
      { vi: 'Trước tôi, tin tức chỉ đi nhanh bằng người, ngựa hay con tàu mang nó.', en: 'Before me, news travelled only as fast as whoever carried it.' },
      { vi: 'Nhờ tôi, lần đầu tiên tin tức đi nhanh hơn cả đoàn tàu nhanh nhất.', en: 'Thanks to me, news for the first time outran the fastest train.' },
      { vi: 'Tôi biến mỗi chữ cái thành những tín hiệu ngắn và dài.', en: 'I turn each letter into short and long signals.' },
    ],
  },
  {
    id: 'ir2-1',
    clues: [
      { vi: 'Tôi thuộc thời đại của sản xuất quy mô lớn.', en: 'I belong to the age of large-scale production.' },
      { vi: 'Trước tôi, vật liệu tôi làm ra được làm chậm, ít và rất đắt.', en: 'Before me, the material I make was produced slowly, in small amounts, at great cost.' },
      { vi: 'Nhờ tôi, đường ray, cầu, tàu thủy và nhà cao tầng mọc lên.', en: 'Thanks to me, rails, bridges, ships and tall buildings went up.' },
      { vi: 'Tôi thổi không khí qua gang nóng chảy trong một lò hình quả lê.', en: 'I blow air through molten pig iron in a pear-shaped vessel.' },
    ],
  },
  {
    id: 'ir2-2',
    clues: [
      { vi: 'Tôi lớn lên cùng các nhà máy cuối thế kỷ XIX.', en: 'I grew up with the factories of the late 19th century.' },
      { vi: 'Tôi nhỏ và nhẹ hơn động cơ hơi nước, vì không cần lò đốt và nồi hơi cồng kềnh.', en: 'I am smaller and lighter than a steam engine: no bulky firebox or boiler.' },
      { vi: 'Tôi đưa động lực lên xe tải, máy kéo, tàu thủy và sau này cả máy bay.', en: 'I brought power to lorries, tractors, ships and later aircraft.' },
      { vi: 'Tôi đốt nhiên liệu ngay trong xi-lanh; một chiếc xe ba bánh chạy xăng nổi tiếng dùng tôi.', en: 'I burn fuel inside my cylinder; a famous three-wheeled petrol car used me.' },
    ],
  },
  {
    id: 'ir2-3',
    clues: [
      { vi: 'Tôi là ngôi sao của cuộc cách mạng thứ hai.', en: 'I am the star of the second revolution.' },
      { vi: 'Trước tôi, đêm xuống là việc phải dừng, và cả xưởng quay theo một động cơ duy nhất.', en: 'Before me, work stopped at nightfall and a whole factory turned on one engine.' },
      { vi: 'Nhờ tôi, mỗi máy có thể có động cơ riêng, và thành phố sáng về đêm.', en: 'Thanks to me, each machine could have its own motor, and cities lit up at night.' },
      { vi: 'Đèn sợi đốt và động cơ xoay chiều là hai gương mặt của tôi.', en: 'The incandescent lamp and the AC motor are my two faces.' },
    ],
  },
  {
    id: 'ir2-4',
    clues: [
      { vi: 'Tôi ra đời khi điện và kỹ thuật cơ khí thay đổi nhà máy.', en: 'I was born when electricity and engineering transformed the factory.' },
      { vi: 'Trước tôi, mỗi sản phẩm được làm chậm, từng chiếc một.', en: 'Before me, each product was built slowly, one at a time.' },
      { vi: 'Tôi làm hàng hóa rẻ hơn, nhưng làm nhiều công việc trở nên đơn điệu và lặp lại.', en: 'I made goods cheaper, but made much work monotonous and repetitive.' },
      { vi: 'Sản phẩm đi qua từng người, mỗi người làm một bước; chiếc Model T là ngôi sao của tôi.', en: 'The product moves past each worker doing one step; the Model T was my star.' },
    ],
  },
  {
    id: 'ir2-5',
    clues: [
      { vi: 'Tôi thuộc thời đại của điện.', en: 'I belong to the age of electricity.' },
      { vi: 'Trước tôi, liên lạc từ xa chỉ là những tín hiệu phải dịch ra chữ.', en: 'Before me, long-distance messages were signals that had to be turned into words.' },
      { vi: 'Nhờ tôi, con người, doanh nghiệp và cơ quan liên hệ trực tiếp với nhau dễ dàng hơn nhiều.', en: 'Thanks to me, people, businesses and offices could reach each other directly, far more easily.' },
      { vi: 'Tôi mang giọng nói con người đi xa; tên tuổi tôi gắn với Alexander Graham Bell.', en: 'I carry the human voice far away; I am linked to Alexander Graham Bell.' },
    ],
  },
  {
    id: 'ir3-1',
    clues: [
      { vi: 'Tôi thuộc thời đại của điện tử và máy tính.', en: 'I belong to the age of electronics and computers.' },
      { vi: 'Trước tôi, một bộ xử lý cần rất nhiều linh kiện riêng lẻ.', en: 'Before me, a processor needed many separate parts.' },
      { vi: 'Nhờ tôi, thiết bị điện tử ngày càng nhỏ và nhẹ.', en: 'Thanks to me, electronics became ever smaller and lighter.' },
      { vi: 'Tôi gói cả bộ xử lý trung tâm vào một con chip; Intel làm ra tôi.', en: 'I pack a whole central processor onto one chip; Intel made me.' },
    ],
  },
  {
    id: 'ir3-2',
    clues: [
      { vi: 'Tôi ra đời trong nửa sau thế kỷ XX.', en: 'I was born in the second half of the 20th century.' },
      { vi: 'Trước tôi, máy tính thuộc về các tổ chức lớn chứ không phải từng người.', en: 'Before me, computers belonged to big organisations, not to individuals.' },
      { vi: 'Tôi giúp soạn văn bản, tính toán và lưu dữ liệu, và kéo theo cả ngành phần mềm.', en: 'I helped with writing, calculating and storing data, and boosted the software industry.' },
      { vi: 'Một hãng máy tính lớn của Mỹ giới thiệu tôi năm 1981, cho văn phòng, trường học và gia đình.', en: 'A big American computer company launched me in 1981, for offices, schools and homes.' },
    ],
  },
  {
    id: 'ir3-3',
    clues: [
      { vi: 'Tôi ra đời khi điện tử và lập trình bước vào nhà máy.', en: 'I was born when electronics and programming entered the factory.' },
      { vi: 'Trước tôi, con người làm việc nặng và nguy hiểm, và đổi quy trình nghĩa là đi dây lại.', en: 'Before me, people did heavy, dangerous work, and changing a process meant rewiring.' },
      { vi: 'Tôi gồm hai phần, hai trụ cột của nhà máy tự động.', en: 'I come in two parts, the two pillars of the automated factory.' },
      { vi: 'Một nửa của tôi bắt đầu làm việc trong nhà máy General Motors năm 1961.', en: 'Half of me went to work in a General Motors factory in 1961.' },
    ],
  },
  {
    id: 'ir3-4',
    clues: [
      { vi: 'Tôi ra đời khi các viện nghiên cứu đã có máy tính.', en: 'I was born when research sites already had computers.' },
      { vi: 'Trước tôi, máy tính ở những nơi khác nhau không trao đổi dữ liệu được với nhau.', en: 'Before me, computers in different places could not exchange data.' },
      { vi: 'Tôi là một trong những nền móng của Internet.', en: 'I am one of the foundations of the Internet.' },
      { vi: 'Một cơ quan nghiên cứu của Bộ Quốc phòng Hoa Kỳ đứng sau tôi.', en: 'A research agency of the US Department of Defense was behind me.' },
    ],
  },
  {
    id: 'ir3-5',
    clues: [
      { vi: 'Tôi thuộc thời đại của thông tin.', en: 'I belong to the information age.' },
      { vi: 'Trước tôi, cuộc gọi nào cũng cần một sợi dây, và tài liệu không nối được với nhau.', en: 'Before me, every call needed a wire, and documents were not linked to one another.' },
      { vi: 'Nhờ tôi, thông tin, mua bán và trò chuyện theo con người đi khắp nơi.', en: 'Thanks to me, information, shopping and conversation followed people everywhere.' },
      { vi: 'Martin Cooper và Tim Berners-Lee là hai cha đẻ của tôi.', en: 'Martin Cooper and Tim Berners-Lee are my two parents.' },
    ],
  },
  {
    id: 'ir4-1',
    clues: [
      { vi: 'Tôi thuộc cuộc cách mạng đang diễn ra hôm nay.', en: 'I belong to the revolution happening today.' },
      { vi: 'Tôi biến một mô hình số trên máy tính thành vật thật.', en: 'I turn a digital model on a computer into a real object.' },
      { vi: 'Tôi làm nhanh mẫu thử và những hình dạng phức tạp, nhưng tốc độ, vật liệu và chi phí vẫn giới hạn tôi.', en: 'I make quick prototypes and complex shapes, but speed, materials and cost still limit me.' },
      { vi: 'Tôi đắp vật liệu lên từng lớp một.', en: 'I build up material one layer at a time.' },
    ],
  },
  {
    id: 'ir4-2',
    clues: [
      { vi: 'Tôi thuộc cuộc cách mạng mà máy móc trao đổi thông tin với nhau.', en: 'I belong to the revolution in which machines share information with each other.' },
      { vi: 'Trước tôi, người ta chờ máy hỏng rồi mới sửa.', en: 'Before me, people waited for machines to break before fixing them.' },
      { vi: 'Tôi cảnh báo hỏng hóc từ trước, và để kỹ sư thử thay đổi trên một bản sao ảo.', en: 'I warn of breakdowns in advance, and let engineers try changes on a virtual copy.' },
      { vi: 'Cảm biến trên máy móc gửi dữ liệu cho tôi liên tục qua mạng.', en: 'Sensors on the machines send me data over the network all the time.' },
    ],
  },
  {
    id: 'ir4-3',
    clues: [
      { vi: 'Tôi phát triển vượt bậc trong cuộc cách mạng hiện nay.', en: 'I have leapt ahead in the present revolution.' },
      { vi: 'Thay vì chỉ làm theo quy tắc viết sẵn, tôi học từ rất nhiều dữ liệu.', en: 'Instead of only following rules written in advance, I learn from vast amounts of data.' },
      { vi: 'Tôi nhận dạng, dự đoán, quyết định và sáng tạo, nhưng vẫn có thể sai và cần con người giám sát.', en: 'I recognise, predict, decide and create, but I can still be wrong and need human oversight.' },
      { vi: 'ChatGPT đưa một dạng của tôi đến với hàng trăm triệu người.', en: 'ChatGPT brought one form of me to hundreds of millions of people.' },
    ],
  },
  {
    id: 'ir4-4',
    clues: [
      { vi: 'Tôi là một phần của cuộc cách mạng thứ tư, dù hiếm ai được tận mắt nhìn thấy tôi.', en: 'I am part of the fourth revolution, though few people ever see me with their own eyes.' },
      { vi: 'Trước tôi, mỗi doanh nghiệp phải tự mua và vận hành máy chủ.', en: 'Before me, every business had to buy and run its own servers.' },
      { vi: 'Người ta thuê tôi qua Internet, dùng bao nhiêu trả bấy nhiêu; AI được huấn luyện trong tôi.', en: 'People rent me over the Internet, paying for what they use; AI is trained inside me.' },
      { vi: 'Amazon Web Services mở đường cho tôi năm 2006.', en: 'Amazon Web Services opened the way for me in 2006.' },
    ],
  },
  {
    id: 'ir4-5',
    clues: [
      { vi: 'Tôi thuộc thời đại máy móc biết nhìn và cảm nhận.', en: 'I belong to the age of machines that can see and feel.' },
      { vi: 'Tổ tiên của tôi làm việc sau hàng rào và lặp lại đúng một chuỗi động tác.', en: 'My ancestors worked behind a fence, repeating exactly one sequence of moves.' },
      { vi: 'Với camera và cảm biến lực, tôi có thể làm việc ngay cạnh con người.', en: 'With cameras and force sensors, I can work right beside people.' },
      { vi: 'Một nhánh của gia đình tôi được gọi là "cobot".', en: 'One branch of my family is called the “cobot”.' },
    ],
  },
  {
    id: 'ir4-6',
    clues: [
      { vi: 'Tôi là một phần của cuộc cách mạng đang diễn ra hôm nay.', en: 'I am part of the revolution happening today.' },
      { vi: 'Máy tính giúp tôi đọc một khối dữ liệu khổng lồ bên trong mỗi con người.', en: 'Computers help me read a huge mass of data inside every person.' },
      { vi: 'Tôi mở ra những cách chữa bệnh mới, nhưng đặt ra câu hỏi lớn về đạo đức và an toàn.', en: 'I open new ways to treat disease, but raise big questions of ethics and safety.' },
      { vi: '"Chiếc kéo di truyền" CRISPR-Cas9 và vắc-xin mRNA là thành tựu của tôi.', en: 'The “genetic scissors” CRISPR-Cas9 and mRNA vaccines are my achievements.' },
    ],
  },
  {
    id: 'ir1',
    clues: [
      { vi: 'Tôi bắt đầu ở nước Anh.', en: 'I began in Britain.' },
      { vi: 'Trước tôi, sản xuất dựa chủ yếu vào sức người và công cụ thủ công.', en: 'Before me, production relied mainly on human strength and hand tools.' },
      { vi: 'Tôi mang đến nhà máy và đường sắt, nhưng cũng cả ô nhiễm và điều kiện lao động khắc nghiệt.', en: 'I brought factories and railways, but also pollution and harsh working conditions.' },
      { vi: 'Nguồn động lực của tôi là hơi nước.', en: 'My power was steam.' },
    ],
  },
  {
    id: 'ir2',
    clues: [
      { vi: 'Tôi diễn ra từ cuối thế kỷ XIX đến đầu thế kỷ XX.', en: 'I took place from the late 19th to the early 20th century.' },
      { vi: 'Tôi đưa nhà máy lên quy mô sản xuất lớn hơn bao giờ hết.', en: 'I took factories to a larger scale than ever.' },
      { vi: 'Tôi làm nhiều công việc trở nên lặp lại và đòi hỏi tổ chức lao động chặt chẽ.', en: 'I made much work repetitive and demanded tightly organised labour.' },
      { vi: 'Động cơ điện, dây chuyền lắp ráp và điện thoại là gương mặt của tôi.', en: 'The electric motor, the assembly line and the telephone are my faces.' },
    ],
  },
  {
    id: 'ir3',
    clues: [
      { vi: 'Tôi diễn ra trong nửa sau thế kỷ XX.', en: 'I took place in the second half of the 20th century.' },
      { vi: 'Ở thời tôi, máy tính xử lý dữ liệu và robot làm thay việc lặp lại.', en: 'In my time, computers processed data and robots took over repetitive tasks.' },
      { vi: 'Tôi làm thay đổi công việc và kỹ năng mà người lao động cần.', en: 'I changed the jobs and skills that workers need.' },
      { vi: 'Điện tử, máy tính và công nghệ thông tin là nền móng của tôi.', en: 'Electronics, computers and information technology are my foundations.' },
    ],
  },
  {
    id: 'ir4',
    clues: [
      { vi: 'Tôi bắt đầu từ đầu thế kỷ XXI và vẫn đang diễn ra.', en: 'I began in the early 21st century and am still going on.' },
      { vi: 'Ở thời tôi, máy móc không chỉ tự làm việc mà còn thu thập dữ liệu và học từ nó.', en: 'In my time, machines not only work on their own, but collect data and learn from it.' },
      { vi: 'Tôi đặt ra thách thức về bảo mật, năng lượng, việc làm, kỹ năng và đạo đức.', en: 'I bring challenges in security, energy, jobs, skills and ethics.' },
      { vi: 'Trí tuệ nhân tạo, Internet vạn vật và dữ liệu là gương mặt của tôi.', en: 'Artificial intelligence, the Internet of Things and data are my faces.' },
    ],
  },
]

// ---- Core IV: Visitors from the past ----
// Two possible visitors from each era (one is chosen each game); each asks for advice three
// times, from a pool of four or five questions. The first reply is the right one: it fits
// what their era could do, needed next, or cost. The others are from the wrong time, or
// misunderstand the era.
export type Look = 'tophat' | 'cap' | 'tie' | 'hoodie'
export interface Visitor {
  id: string
  era: Era
  look: Look
  who: Both
  hello: Both
  questions: VisitorQuestion[]
}
export interface VisitorQuestion {
  ask: Both
  replies: [Both, Both, Both] // [right, wrong, wrong]
  why: Both
  from: string // exhibit id
}
export const VISITORS: Visitor[] = [
  {
    id: 'mill',
    era: 1,
    look: 'tophat',
    who: { vi: 'Chủ một xưởng kéo sợi, năm 1785', en: 'A spinning-mill owner, 1785' },
    hello: { vi: 'Chào bạn! Nghe nói bạn đến từ tương lai. Tôi đang cần lời khuyên cho xưởng của mình.', en: 'Hello! They say you come from the future. I need some advice for my mill.' },
    questions: [
      {
        ask: { vi: 'Xưởng của tôi phải đặt cạnh sông để quay máy. Mùa khô nước cạn, máy dừng cả. Tôi nên làm gì?', en: 'My mill has to sit by the river to turn its machines. In the dry season the water drops and everything stops. What should I do?' },
        replies: [
          { vi: 'Dùng động cơ hơi nước cải tiến, đốt than để quay máy.', en: 'Use an improved steam engine, burning coal to drive the machines.' },
          { vi: 'Gắn một động cơ điện riêng cho từng máy.', en: 'Fit each machine with its own electric motor.' },
          { vi: 'Đợi mùa mưa rồi làm bù cho đủ.', en: 'Wait for the rains and catch up then.' },
        ],
        why: { vi: 'Động cơ hơi nước của Watt cho động lực ở bất cứ đâu có than. Động cơ điện chỉ đến ở cuộc cách mạng thứ hai.', en: 'Watt’s steam engine gave power wherever there was coal. Electric motors only came with the second revolution.' },
        from: 'ir1-1',
      },
      {
        ask: { vi: 'Tôi muốn làm ra nhiều sợi hơn hẳn. Nên tổ chức việc sản xuất thế nào?', en: 'I want to make far more thread. How should I organise the work?' },
        replies: [
          { vi: 'Gom máy kéo sợi vào một nhà máy chung, dùng chung một nguồn động lực.', en: 'Gather spinning machines in one mill, sharing one power source.' },
          { vi: 'Để mỗi gia đình kéo sợi tại nhà như trước.', en: 'Let each family keep spinning at home as before.' },
          { vi: 'Đặt các máy dọc một dây chuyền di động, mỗi người một bước.', en: 'Line the machines along a moving line, one step per worker.' },
        ],
        why: { vi: 'Máy Water Frame cần nguồn động lực và chỗ đặt máy, nên các xưởng gom lại thành nhà máy tập trung. Dây chuyền di động thuộc cuộc cách mạng thứ hai.', en: 'The Water Frame needed power and room, so workshops gathered into centralised mills. The moving line belongs to the second revolution.' },
        from: 'ir1-2',
      },
      {
        ask: { vi: 'Công nhân của tôi làm việc rất nhiều giờ, xưởng thì ngột ngạt khói than. Thời của bạn nhìn lại chuyện này thế nào?', en: 'My workers labour very long hours, and the mill is choked with coal smoke. How does your time look back on this?' },
        replies: [
          { vi: 'Đó là mặt trái của thời đại: điều kiện lao động khắc nghiệt và ô nhiễm.', en: 'It is the dark side of the age: harsh working conditions and pollution.' },
          { vi: 'Không sao cả, nhà máy thời nào cũng sạch và an toàn như vậy.', en: 'It is fine: factories have always been this clean and safe.' },
          { vi: 'Chẳng bao lâu nữa robot sẽ làm thay hết mọi việc.', en: 'Robots will soon do all of the work instead.' },
        ],
        why: { vi: 'Cuộc cách mạng thứ nhất mang lại nhà máy và năng suất, nhưng cũng cả điều kiện lao động khắc nghiệt, ô nhiễm và đô thị phình to.', en: 'The first revolution brought factories and productivity, but also harsh working conditions, pollution and swelling cities.' },
        from: 'ir1-overview',
      },
      {
        ask: { vi: 'Người dân đổ về thành phố ngày càng đông. Vì sao vậy?', en: 'More and more people are crowding into the towns. Why?' },
        replies: [
          { vi: 'Vì việc làm tập trung ở các nhà máy, nên đô thị phát triển nhanh.', en: 'Because work is gathering in the factories, so towns grow fast.' },
          { vi: 'Vì thành phố có đèn điện thắp sáng suốt đêm.', en: 'Because the towns have electric light all night.' },
          { vi: 'Vì ai cũng có thể làm việc từ xa qua Internet.', en: 'Because everyone can work from afar over the Internet.' },
        ],
        why: { vi: 'Nhà máy kéo người lao động về thành phố: đô thị phát triển nhanh chóng là một hệ quả của cuộc cách mạng thứ nhất.', en: 'Factories drew workers into the towns: fast-growing cities were one result of the first revolution.' },
        from: 'ir1-overview',
      },
    ],
  },
  {
    id: 'rail',
    era: 1,
    look: 'tophat',
    who: { vi: 'Một kỹ sư đường sắt, năm 1835', en: 'A railway engineer, 1835' },
    hello: { vi: 'Rất vui được gặp bạn! Tôi đang xây một tuyến đường mới và có vài câu muốn hỏi.', en: 'Delighted to meet you! I am building a new line and have a few questions.' },
    questions: [
      {
        ask: { vi: 'Than từ mỏ tới nhà máy vẫn đi bằng xe ngựa, chậm và chở ít. Tôi nên xây gì?', en: 'Coal still goes from the mine to the mills by horse and cart, slowly and in small loads. What should I build?' },
        replies: [
          { vi: 'Một tuyến đường sắt với đầu máy hơi nước.', en: 'A railway with steam locomotives.' },
          { vi: 'Một đường lớn cho ô tô chạy xăng.', en: 'A wide road for petrol cars.' },
          { vi: 'Một đường dây điện báo từ mỏ tới nhà máy.', en: 'A telegraph line from the mine to the mills.' },
        ],
        why: { vi: 'Đầu máy hơi nước như Rocket kéo đoàn tàu chở nhiều hàng, nhanh hơn xe ngựa. Ô tô chỉ ra đời ở cuộc cách mạng thứ hai; điện báo chở tin, không chở than.', en: 'Steam locomotives such as Rocket pulled heavy trains, faster than horses. Cars only came with the second revolution; the telegraph carries news, not coal.' },
        from: 'ir1-4',
      },
      {
        ask: { vi: 'Đường ray và cầu cần rất nhiều sắt. Tôi lấy đâu ra đủ sắt?', en: 'Rails and bridges need a great deal of iron. Where will I get enough?' },
        replies: [
          { vi: 'Từ lò khuấy đốt than đá, rồi cán thành thanh.', en: 'From coal-fired puddling furnaces, then rolled into bars.' },
          { vi: 'Từ lò thổi Bessemer, rẻ và nhanh.', en: 'From Bessemer converters, cheap and fast.' },
          { vi: 'Từ lò luyện dùng than củi, như xưa nay vẫn làm.', en: 'From charcoal furnaces, as it has always been done.' },
        ],
        why: { vi: 'Lò khuấy của Henry Cort cho ra sắt rèn với số lượng lớn bằng than đá. Than củi giới hạn sản lượng; lò Bessemer thuộc cuộc cách mạng thứ hai.', en: 'Henry Cort’s puddling furnace made wrought iron in quantity with coal. Charcoal limited output; the Bessemer converter belongs to the second revolution.' },
        from: 'ir1-3',
      },
      {
        ask: { vi: 'Làm sao báo cho ga sau rằng đoàn tàu đã chạy, để hai tàu không đâm nhau?', en: 'How can I tell the next station that a train has left, so two trains never collide?' },
        replies: [
          { vi: 'Kéo một đường dây điện báo dọc đường ray.', en: 'Run a telegraph line along the track.' },
          { vi: 'Gọi điện thoại cho trưởng ga.', en: 'Telephone the stationmaster.' },
          { vi: 'Cử người cưỡi ngựa phóng thật nhanh tới ga sau.', en: 'Send a rider to gallop to the next station.' },
        ],
        why: { vi: 'Điện báo của Cooke và Wheatstone được dùng dọc đường sắt, giúp điều phối tàu an toàn hơn. Ngựa chậm hơn tàu; điện thoại ra đời sau đó nhiều năm.', en: 'Cooke and Wheatstone’s telegraph was used along railways, helping to run trains more safely. A horse is slower than the train; the telephone came many years later.' },
        from: 'ir1-5',
      },
      {
        ask: { vi: 'Bạn nghĩ đường sắt sẽ thay đổi điều gì?', en: 'What do you think the railways will change?' },
        replies: [
          { vi: 'Hàng hóa và con người đi nhanh hơn; nơi sản xuất nối liền với thị trường.', en: 'Goods and people will travel faster; places of production will be linked to markets.' },
          { vi: 'Người ta sẽ ít đi lại hơn trước.', en: 'People will travel less than before.' },
          { vi: 'Mọi nhà máy sẽ được tự động hóa bằng robot.', en: 'Every factory will be automated with robots.' },
        ],
        why: { vi: 'Đường sắt giúp người và hàng hóa đi nhanh hơn, nối các trung tâm sản xuất với thị trường, thúc đẩy thương mại và công nghiệp.', en: 'Railways let people and goods move faster and linked centres of production with their markets, boosting trade and industry.' },
        from: 'ir1-4',
      },
    ],
  },
  {
    id: 'foreman',
    era: 2,
    look: 'cap',
    who: { vi: 'Quản đốc một nhà máy ô tô, năm 1910', en: 'A car-factory foreman, 1910' },
    hello: { vi: 'Chào bạn! Nhà máy của tôi đang bận rộn lắm, nhưng tôi muốn nghe ý kiến của người đến từ tương lai.', en: 'Hello! My factory is very busy, but I would like the opinion of someone from the future.' },
    questions: [
      {
        ask: { vi: 'Cả xưởng tôi quay theo một động cơ hơi nước với những dây curoa dài. Có cách nào tốt hơn không?', en: 'My whole works turns on one steam engine with long belts. Is there a better way?' },
        replies: [
          { vi: 'Gắn động cơ điện cho từng máy, đặt máy ở nơi cần.', en: 'Give each machine an electric motor and place machines where they are needed.' },
          { vi: 'Mua một động cơ hơi nước to hơn nữa.', en: 'Buy an even bigger steam engine.' },
          { vi: 'Điều khiển máy móc bằng bộ điều khiển lập trình (PLC).', en: 'Control the machines with programmable controllers (PLCs).' },
        ],
        why: { vi: 'Với động cơ điện, nhà máy không còn phụ thuộc vào một động cơ hơi nước duy nhất. PLC chỉ xuất hiện từ cuối thập niên 1960.', en: 'With electric motors, a factory no longer depended on a single steam engine. PLCs only appeared from the late 1960s.' },
        from: 'ir2-3',
      },
      {
        ask: { vi: 'Chúng tôi lắp ô tô từng chiếc một, quá chậm và quá đắt. Làm sao nhanh hơn?', en: 'We build cars one at a time, far too slowly and expensively. How can we go faster?' },
        replies: [
          { vi: 'Cho xe di chuyển qua các công nhân, mỗi người làm một bước.', en: 'Move the cars past the workers, each doing one step.' },
          { vi: 'Để robot công nghiệp lắp hết.', en: 'Let industrial robots assemble everything.' },
          { vi: 'Thuê những người thợ giỏi làm trọn cả chiếc xe.', en: 'Hire master craftsmen to build each whole car.' },
        ],
        why: { vi: 'Dây chuyền lắp ráp di động của Ford làm chiếc Model T nhanh và rẻ hơn hẳn. Robot công nghiệp đầu tiên chỉ vào nhà máy năm 1961.', en: 'Ford’s moving assembly line made the Model T far faster and cheaper. The first industrial robot only went to work in 1961.' },
        from: 'ir2-4',
      },
      {
        ask: { vi: 'Dây chuyền chạy tốt, nhưng công nhân than phiền. Họ khó chịu vì điều gì?', en: 'The line runs well, but the workers complain. What troubles them?' },
        replies: [
          { vi: 'Công việc lặp lại, đơn điệu và bị tổ chức rất chặt chẽ.', en: 'The work is repetitive, monotonous and very tightly organised.' },
          { vi: 'Họ phải học cách làm việc cùng AI.', en: 'They have to learn to work with AI.' },
          { vi: 'Máy móc đã làm hết việc nên họ không còn gì để làm.', en: 'The machines do everything, so they have nothing left to do.' },
        ],
        why: { vi: 'Sản xuất hàng loạt làm hàng hóa rẻ hơn, nhưng làm nhiều công việc đơn điệu, lặp lại và cần tổ chức lao động chặt chẽ.', en: 'Mass production made goods cheaper, but made much work monotonous and repetitive, and demanded tightly organised labour.' },
        from: 'ir2-overview',
      },
      {
        ask: { vi: 'Tôi cần bàn ngay hôm nay với nhà cung cấp thép ở thành phố khác. Làm cách nào?', en: 'I must talk today with our steel supplier in another city. How?' },
        replies: [
          { vi: 'Gọi điện thoại cho họ.', en: 'Telephone them.' },
          { vi: 'Gửi cho họ một thư điện tử.', en: 'Send them an email.' },
          { vi: 'Gửi một lá thư theo chuyến tàu sáng mai.', en: 'Send a letter on tomorrow morning’s train.' },
        ],
        why: { vi: 'Điện thoại giúp các doanh nghiệp liên hệ trực tiếp bằng giọng nói. Thư theo tàu thì chậm; mạng máy tính chỉ đến ở cuộc cách mạng thứ ba.', en: 'The telephone let businesses talk directly by voice. A letter by train is slow; computer networks only came with the third revolution.' },
        from: 'ir2-5',
      },
    ],
  },
  {
    id: 'mayor',
    era: 2,
    look: 'tophat',
    who: { vi: 'Thị trưởng một thành phố, năm 1890', en: 'A city mayor, 1890' },
    hello: { vi: 'Xin chào! Thành phố của tôi đang lớn rất nhanh. Bạn giúp tôi vài ý kiến nhé?', en: 'Good day! My city is growing very fast. Could you give me some advice?' },
    questions: [
      {
        ask: { vi: 'Đêm xuống là phố xá chìm trong bóng tối. Thành phố nên làm gì?', en: 'At night the streets fall into darkness. What should the city do?' },
        replies: [
          { vi: 'Lắp đèn điện sợi đốt và xây mạng lưới cấp điện.', en: 'Install incandescent electric lamps and build a power network.' },
          { vi: 'Phát thêm nến cho mọi nhà.', en: 'Hand out more candles to every home.' },
          { vi: 'Lắp đèn thông minh nối mạng Internet.', en: 'Install smart lamps connected to the Internet.' },
        ],
        why: { vi: 'Đèn sợi đốt giúp con người làm việc và sinh hoạt sau khi trời tối, và thúc đẩy xây dựng mạng lưới cấp điện. Internet chỉ đến rất lâu sau.', en: 'The incandescent lamp let people work and live after dark, and drove the building of power networks. The Internet came much later.' },
        from: 'ir2-3',
      },
      {
        ask: { vi: 'Chúng tôi muốn xây những cây cầu lớn và tòa nhà cao hơn bao giờ hết. Cần vật liệu gì?', en: 'We want to build bigger bridges and taller buildings than ever. What material do we need?' },
        replies: [
          { vi: 'Thép giá rẻ làm bằng phương pháp Bessemer.', en: 'Cheap steel made by the Bessemer process.' },
          { vi: 'Gỗ thật dày.', en: 'Very thick timber.' },
          { vi: 'In cả tòa nhà bằng máy in 3D bê tông.', en: 'Print the whole building with a concrete 3D printer.' },
        ],
        why: { vi: 'Thép rẻ từ lò Bessemer thúc đẩy xây dựng đường sắt, cầu, tàu thủy và nhà cao tầng. In 3D thuộc cuộc cách mạng thứ tư.', en: 'Cheap Bessemer steel drove the building of railways, bridges, ships and tall buildings. 3D printing belongs to the fourth revolution.' },
        from: 'ir2-1',
      },
      {
        ask: { vi: 'Toà thị chính nhận rất nhiều điện báo; phải chờ người dịch mã rất lâu. Có cách nào nhanh hơn?', en: 'City hall receives piles of telegrams; decoding them takes ages. Is there a faster way?' },
        replies: [
          { vi: 'Lắp tổng đài và máy điện thoại để nói chuyện trực tiếp.', en: 'Install a switchboard and telephones to talk directly.' },
          { vi: 'Phát cho mỗi nhân viên một điện thoại di động.', en: 'Give every clerk a mobile phone.' },
          { vi: 'Tuyển thêm người cưỡi ngựa đưa thư.', en: 'Hire more riders to carry letters.' },
        ],
        why: { vi: 'Điện thoại mang giọng nói đi xa, giúp các cơ quan trao đổi trực tiếp; mạng lưới điện thoại dần mở rộng. Điện thoại di động thuộc cuộc cách mạng thứ ba.', en: 'The telephone carried the voice far away, letting offices talk directly, and telephone networks spread. Mobile phones belong to the third revolution.' },
        from: 'ir2-5',
      },
      {
        ask: { vi: 'Nhà máy trong thành phố muốn sản xuất nhiều và rẻ hơn. Đâu là chìa khóa của thời đại này?', en: 'The city’s factories want to produce more, and more cheaply. What is the key of this age?' },
        replies: [
          { vi: 'Điện năng và sản xuất hàng loạt.', en: 'Electric power and mass production.' },
          { vi: 'Dữ liệu và trí tuệ nhân tạo.', en: 'Data and artificial intelligence.' },
          { vi: 'Sức nước và làm thủ công tại nhà.', en: 'Water power and handwork at home.' },
        ],
        why: { vi: 'Cuộc cách mạng thứ hai dựa trên điện năng, kỹ thuật cơ khí và tiến bộ khoa học, đưa nhà máy lên quy mô sản xuất lớn.', en: 'The second revolution rested on electricity, engineering and science, taking factories to large-scale production.' },
        from: 'ir2-overview',
      },
    ],
  },
  {
    id: 'office',
    era: 3,
    look: 'tie',
    who: { vi: 'Một nhân viên văn phòng, năm 1985', en: 'An office worker, 1985' },
    hello: { vi: 'Ồ, chào bạn! Văn phòng chúng tôi vừa có nhiều thứ mới lạ. Bạn giải thích giúp tôi nhé?', en: 'Oh, hello! Our office has just got lots of new things. Could you explain a few?' },
    questions: [
      {
        ask: { vi: 'Ngày trước tôi phải chờ đến lượt dùng chiếc máy tính lớn của cả công ty. Giờ có gì thay đổi?', en: 'I used to wait my turn for the company’s one big computer. What has changed now?' },
        replies: [
          { vi: 'Máy tính cá nhân: mỗi người một chiếc trên bàn làm việc.', en: 'The personal computer: one on every desk.' },
          { vi: 'Thuê máy chủ trên điện toán đám mây.', en: 'Renting servers in the cloud.' },
          { vi: 'Một máy đánh chữ chạy bằng điện cho mỗi người.', en: 'An electric typewriter for everyone.' },
        ],
        why: { vi: 'Máy tính cá nhân như IBM 5150 đưa máy tính đến từng văn phòng, trường học và người dùng. Điện toán đám mây chỉ mở đường từ năm 2006.', en: 'Personal computers like the IBM 5150 brought computers to offices, schools and individuals. Cloud computing only began in 2006.' },
        from: 'ir3-2',
      },
      {
        ask: { vi: 'Vì sao máy tính bây giờ lại nhỏ gọn được như vậy?', en: 'Why can computers be so small now?' },
        replies: [
          { vi: 'Nhờ bộ vi xử lý: cả bộ xử lý nằm trên một con chip.', en: 'Thanks to the microprocessor: a whole processor on one chip.' },
          { vi: 'Nhờ chúng chạy bằng động cơ điện nhỏ hơn.', en: 'Because they run on smaller electric motors.' },
          { vi: 'Nhờ AI tự thiết kế lại chúng.', en: 'Because AI redesigned them.' },
        ],
        why: { vi: 'Bộ vi xử lý như Intel 4004 gói chức năng của bộ xử lý trung tâm vào một linh kiện nhỏ, mở đường cho thiết bị điện tử ngày càng nhỏ.', en: 'Microprocessors such as the Intel 4004 put the functions of a central processor into one small part, opening the way to ever smaller electronics.' },
        from: 'ir3-1',
      },
      {
        ask: { vi: 'Máy tính vào văn phòng rồi. Tôi có nên lo cho công việc của mình không?', en: 'Computers have come to the office. Should I worry about my job?' },
        replies: [
          { vi: 'Công việc sẽ thay đổi: bạn cần học kỹ năng mới để dùng máy tính.', en: 'Your work will change: you will need new skills to use computers.' },
          { vi: 'Không, mọi việc sẽ y như cũ.', en: 'No, everything will stay exactly the same.' },
          { vi: 'Năm sau robot hình người sẽ ngồi vào bàn của bạn.', en: 'Next year a humanoid robot will take your desk.' },
        ],
        why: { vi: 'Cuộc cách mạng thứ ba tăng độ chính xác và năng suất, nhưng cũng thay đổi công việc và kỹ năng mà người lao động cần.', en: 'The third revolution raised accuracy and productivity, but also changed the jobs and skills that workers need.' },
        from: 'ir3-overview',
      },
      {
        ask: { vi: 'Tôi cần gửi số liệu cho đồng nghiệp ở một viện nghiên cứu xa. Máy tính có giúp được không?', en: 'I need to send figures to a colleague at a distant research centre. Can computers help?' },
        replies: [
          { vi: 'Có: mạng máy tính nối các nơi để trao đổi dữ liệu, như ARPANET đã mở đường.', en: 'Yes: computer networks link places to exchange data, as ARPANET pioneered.' },
          { vi: 'Không: máy tính ở hai nơi không bao giờ nói chuyện được với nhau.', en: 'No: computers in two places can never talk to each other.' },
          { vi: 'Có: nhờ AI tạo sinh tự gửi giúp bạn.', en: 'Yes: generative AI will send it for you.' },
        ],
        why: { vi: 'ARPANET cho máy tính ở các nơi khác nhau trao đổi dữ liệu, chuẩn bị nền móng cho mạng máy tính hiện đại. AI tạo sinh chỉ phổ biến từ năm 2022.', en: 'ARPANET let computers in different places exchange data, preparing the ground for modern networks. Generative AI only spread from 2022.' },
        from: 'ir3-4',
      },
    ],
  },
  {
    id: 'engineer',
    era: 3,
    look: 'tie',
    who: { vi: 'Kỹ sư một nhà máy ô tô, năm 1970', en: 'A car-plant engineer, 1970' },
    hello: { vi: 'Chào bạn! Nhà máy của tôi đang tự động hóa. Tôi muốn hỏi ý kiến bạn vài việc.', en: 'Hi! My plant is automating. I would like your view on a few things.' },
    questions: [
      {
        ask: { vi: 'Nâng và hàn những tấm thân xe nặng là việc nặng nhọc và nguy hiểm cho công nhân. Nên làm gì?', en: 'Lifting and welding heavy body panels is exhausting and dangerous for the workers. What should we do?' },
        replies: [
          { vi: 'Dùng robot công nghiệp làm các động tác lặp lại đã lập trình.', en: 'Use industrial robots to repeat programmed movements.' },
          { vi: 'Dùng robot cộng tác có camera, làm ngay cạnh công nhân.', en: 'Use camera-equipped collaborative robots beside the workers.' },
          { vi: 'Thêm một ca làm đêm dưới ánh đèn điện.', en: 'Add a night shift under electric light.' },
        ],
        why: { vi: 'Robot Unimate làm việc lặp lại, mang vác nặng và đưa công nhân tránh xa chỗ nguy hiểm. Robot cộng tác có camera thuộc cuộc cách mạng thứ tư.', en: 'The Unimate robot did repetitive, heavy work and kept workers away from danger. Camera-equipped cobots belong to the fourth revolution.' },
        from: 'ir3-3',
      },
      {
        ask: { vi: 'Mỗi lần đổi mẫu xe, chúng tôi phải đi dây lại tủ điều khiển, mất hàng tuần. Có cách nào không?', en: 'Every new car model means rewiring the control cabinets, which takes weeks. Is there a way out?' },
        replies: [
          { vi: 'Dùng bộ điều khiển lập trình (PLC): chỉ cần sửa chương trình.', en: 'Use a programmable logic controller (PLC): just edit the program.' },
          { vi: 'Thử trước trên bản sao số của nhà máy.', en: 'Test it first on a digital twin of the plant.' },
          { vi: 'Thuê thêm thật nhiều thợ điện.', en: 'Hire many more electricians.' },
        ],
        why: { vi: 'PLC thay các hệ thống điều khiển đi dây cứng: khi quy trình đổi, kỹ sư sửa chương trình thay vì đi dây lại. Bản sao số thuộc cuộc cách mạng thứ tư.', en: 'The PLC replaced hard-wired control: when a process changed, engineers edited a program instead of rewiring. Digital twins belong to the fourth revolution.' },
        from: 'ir3-3',
      },
      {
        ask: { vi: 'Robot của chúng tôi có thể đứng làm việc ngay cạnh công nhân không?', en: 'Can our robot work right beside the workers?' },
        replies: [
          { vi: 'Không: nó lặp lại đúng một chuỗi động tác và phải làm việc sau hàng rào.', en: 'No: it repeats one exact sequence of moves and must work behind a fence.' },
          { vi: 'Có: nó nhìn thấy người bằng camera và tự tránh.', en: 'Yes: it sees people with cameras and moves around them.' },
          { vi: 'Có: robot nào cũng an toàn tuyệt đối.', en: 'Yes: every robot is perfectly safe.' },
        ],
        why: { vi: 'Robot công nghiệp đầu tiên làm việc sau hàng rào và lặp lại đúng một chuỗi động tác. Robot nhìn và cảm nhận được để làm cạnh người là robot tiên tiến ngày nay.', en: 'The first industrial robot worked behind a fence, repeating one exact sequence. Robots that see and feel enough to work beside people are today’s advanced robots.' },
        from: 'ir4-5',
      },
      {
        ask: { vi: 'Sếp tôi hỏi: robot và PLC rốt cuộc quan trọng ở điểm nào?', en: 'My boss asks: what exactly makes robots and PLCs so important?' },
        replies: [
          { vi: 'Chúng là hai trụ cột của nhà máy tự động hóa.', en: 'They are the two pillars of the automated factory.' },
          { vi: 'Chúng giúp nhà máy chạy bằng hơi nước hiệu quả hơn.', en: 'They make steam-powered factories more efficient.' },
          { vi: 'Chúng tự học từ dữ liệu giống như AI.', en: 'They learn from data on their own, like AI.' },
        ],
        why: { vi: 'Điện tử và lập trình bắt đầu tự động hóa nhà máy: robot và PLC là hai trụ cột của nhà máy tự động. Chúng làm theo chương trình chứ không tự học.', en: 'Electronics and programming began to automate the factory: robots and PLCs are its two pillars. They follow programs; they do not learn by themselves.' },
        from: 'ir3-3',
      },
    ],
  },
  {
    id: 'student',
    era: 4,
    look: 'hoodie',
    who: { vi: 'Một học sinh, năm 2026', en: 'A school student, 2026' },
    hello: { vi: 'Chào bạn! Em đang làm bài tập về công nghệ, cho em hỏi vài câu nhé.', en: 'Hi! I’m doing a project on technology. Can I ask you a few things?' },
    questions: [
      {
        ask: { vi: 'Em hay dùng AI để học. AI có bao giờ sai không ạ?', en: 'I often use AI to study. Is AI ever wrong?' },
        replies: [
          { vi: 'Có: AI vẫn có thể sai và thừa hưởng thiên kiến từ dữ liệu, nên cần con người kiểm tra.', en: 'Yes: AI can still be wrong and inherit bias from its data, so people must check it.' },
          { vi: 'Không: AI học từ rất nhiều dữ liệu nên luôn đúng.', en: 'No: AI learns from so much data that it is always right.' },
          { vi: 'Không: AI chỉ làm đúng theo quy tắc viết sẵn nên không thể sai.', en: 'No: AI only follows rules written in advance, so it cannot be wrong.' },
        ],
        why: { vi: 'AI hiện đại học từ dữ liệu thay vì chỉ theo quy tắc viết sẵn; nó vẫn có thể sai, thừa hưởng thiên kiến và cần con người giám sát.', en: 'Modern AI learns from data rather than only following written rules; it can still be wrong, inherit bias and needs human oversight.' },
        from: 'ir4-3',
      },
      {
        ask: { vi: 'Sau này em muốn làm trong nhà máy. Em cần chuẩn bị gì?', en: 'Later I want to work in a factory. What should I prepare?' },
        replies: [
          { vi: 'Kỹ năng mới để làm việc cùng robot, dữ liệu và AI.', en: 'New skills to work alongside robots, data and AI.' },
          { vi: 'Chỉ cần thật khỏe để làm việc nặng.', en: 'Just be strong enough for heavy work.' },
          { vi: 'Không cần học gì, máy móc sẽ làm hết.', en: 'Nothing: machines will do everything.' },
        ],
        why: { vi: 'Cuộc cách mạng thứ tư đặt ra thách thức về việc làm và kỹ năng của người lao động; làm việc cùng robot đòi hỏi kỹ năng mới.', en: 'The fourth revolution brings challenges for jobs and workers’ skills; working with robots needs new skills.' },
        from: 'ir4-overview',
      },
      {
        ask: { vi: 'Vì sao các trung tâm dữ liệu AI lại khiến người ta lo về môi trường?', en: 'Why do AI data centres worry people about the environment?' },
        replies: [
          { vi: 'Vì chúng dùng rất nhiều điện năng.', en: 'Because they use a great deal of electricity.' },
          { vi: 'Vì chúng thải khói than như nhà máy thời hơi nước.', en: 'Because they belch coal smoke like steam-age mills.' },
          { vi: 'Chẳng có gì phải lo, AI không cần năng lượng.', en: 'There is nothing to worry about: AI needs no energy.' },
        ],
        why: { vi: 'AI dùng rất nhiều điện; đám mây tiết kiệm chi phí nhưng đặt ra thách thức về năng lượng.', en: 'AI uses a lot of electricity; the cloud saves costs but raises energy challenges.' },
        from: 'ir4-4',
      },
      {
        ask: { vi: 'Chiếc điện thoại thông minh của em là sự kết hợp của những gì?', en: 'What came together to make my smartphone?' },
        replies: [
          { vi: 'Điện thoại di động và World Wide Web.', en: 'The mobile phone and the World Wide Web.' },
          { vi: 'Điện báo và máy hát.', en: 'The telegraph and the phonograph.' },
          { vi: 'Robot công nghiệp và máy in 3D.', en: 'The industrial robot and the 3D printer.' },
        ],
        why: { vi: 'Khi điện thoại di động gặp Web trong chiếc điện thoại thông minh, thông tin, mua bán và trò chuyện theo con người đi khắp nơi.', en: 'When the mobile phone and the Web met in the smartphone, information, shopping and conversation followed people everywhere.' },
        from: 'ir3-5',
      },
      {
        ask: { vi: 'Chỉnh sửa gen nghe thật tuyệt. Có điều gì cần thận trọng không ạ?', en: 'Gene editing sounds amazing. Is there anything to be careful about?' },
        replies: [
          { vi: 'Có: nó đặt ra câu hỏi nghiêm túc về đạo đức và an toàn, nên phải được quản lý chặt chẽ.', en: 'Yes: it raises serious ethical and safety questions, so it must be tightly regulated.' },
          { vi: 'Không: sửa gen người hoàn toàn không có rủi ro.', en: 'No: editing human genes carries no risk at all.' },
          { vi: 'Không cần lo, vì chỉ robot mới làm được việc đó.', en: 'No need to worry, only robots can do it.' },
        ],
        why: { vi: 'Chỉnh sửa gen đặt ra những câu hỏi nghiêm túc về đạo đức và an toàn, nhất là khi dùng trên con người, nên cần được quản lý cẩn thận.', en: 'Gene editing raises serious ethical and safety questions, above all when used on people, so it must be carefully regulated.' },
        from: 'ir4-6',
      },
    ],
  },
  {
    id: 'director',
    era: 4,
    look: 'hoodie',
    who: { vi: 'Giám đốc một nhà máy thông minh, năm 2026', en: 'A smart-factory director, 2026' },
    hello: { vi: 'Chào bạn! Nhà máy của tôi kết nối đủ thứ, nhưng tôi vẫn muốn nghe một góc nhìn khác.', en: 'Hello! My factory has everything connected, but I would still like another view.' },
    questions: [
      {
        ask: { vi: 'Máy hỏng bất ngờ làm cả dây chuyền dừng. Làm sao tránh được?', en: 'Sudden breakdowns stop the whole line. How can I avoid them?' },
        replies: [
          { vi: 'Dùng dữ liệu từ cảm biến để dự báo hỏng hóc trước khi xảy ra.', en: 'Use sensor data to predict breakdowns before they happen.' },
          { vi: 'Cứ chờ máy hỏng rồi sửa thật nhanh.', en: 'Wait for machines to break, then fix them fast.' },
          { vi: 'Mua thêm một động cơ hơi nước dự phòng.', en: 'Buy a spare steam engine.' },
        ],
        why: { vi: 'Bảo trì dự đoán phân tích dữ liệu cảm biến để cảnh báo khi nguy cơ hỏng hóc tăng, thay vì chờ máy dừng.', en: 'Predictive maintenance analyses sensor data to warn when a breakdown is becoming likely, instead of waiting for the machine to stop.' },
        from: 'ir4-2',
      },
      {
        ask: { vi: 'Tôi muốn thử bố trí lại dây chuyền mà không phải dừng sản xuất.', en: 'I want to try rearranging the line without stopping production.' },
        replies: [
          { vi: 'Thử trước trên bản sao số của dây chuyền.', en: 'Try it first on a digital twin of the line.' },
          { vi: 'Dừng nhà máy một tháng để thử.', en: 'Shut the factory for a month to test it.' },
          { vi: 'Đi dây lại tủ điều khiển rồi xem sao.', en: 'Rewire the control cabinets and see.' },
        ],
        why: { vi: 'Bản sao số phản chiếu trạng thái của dây chuyền thật, để kỹ sư thử thay đổi trước khi làm thật.', en: 'A digital twin mirrors the real line, so engineers can test changes before making them for real.' },
        from: 'ir4-2',
      },
      {
        ask: { vi: 'Nhà máy kết nối mạng hết rồi. Có rủi ro gì tôi cần biết không?', en: 'Everything in the factory is networked now. Are there risks I should know?' },
        replies: [
          { vi: 'Có: phải bảo vệ khỏi các mối đe dọa an ninh mạng, và dự báo vẫn có thể sai.', en: 'Yes: you must guard against cyber threats, and predictions can still be wrong.' },
          { vi: 'Không có rủi ro nào cả.', en: 'There are no risks at all.' },
          { vi: 'Rủi ro duy nhất là thiếu than.', en: 'The only risk is running out of coal.' },
        ],
        why: { vi: 'Dự báo vẫn có sai số, mô hình chỉ tốt bằng dữ liệu của nó, và hệ thống kết nối phải được bảo vệ khỏi tấn công mạng.', en: 'Predictions still have errors, a model is only as good as its data, and connected systems must be protected from cyber attacks.' },
        from: 'ir4-2',
      },
      {
        ask: { vi: 'Tôi muốn đặt robot ngay cạnh công nhân để cùng đóng gói. Có được không?', en: 'I want robots right beside the workers, packing together. Is that possible?' },
        replies: [
          { vi: 'Được, với robot cộng tác, sau khi đánh giá rủi ro và có biện pháp an toàn.', en: 'Yes, with collaborative robots, after a risk assessment and with safeguards.' },
          { vi: 'Được, cứ đặt robot kiểu cũ cạnh người là xong.', en: 'Yes, just put an old-style robot next to people.' },
          { vi: 'Không bao giờ: robot nào cũng phải ở sau hàng rào.', en: 'Never: every robot must stay behind a fence.' },
        ],
        why: { vi: 'Cobot được thiết kế để làm việc gần con người, nhưng vẫn cần đánh giá rủi ro và biện pháp bảo vệ phù hợp.', en: 'Cobots are designed to work near people, but still need a risk assessment and proper safeguards.' },
        from: 'ir4-5',
      },
      {
        ask: { vi: 'Dữ liệu từ hàng nghìn cảm biến quá lớn so với máy tính của công ty. Tôi nên làm gì?', en: 'Data from thousands of sensors is too much for the company’s computers. What should I do?' },
        replies: [
          { vi: 'Lưu trữ và phân tích trên điện toán đám mây.', en: 'Store and analyse it in the cloud.' },
          { vi: 'Mua thêm vài chiếc máy tính cá nhân.', en: 'Buy a few more personal computers.' },
          { vi: 'In dữ liệu ra giấy để cất giữ.', en: 'Print the data out on paper and file it.' },
        ],
        why: { vi: 'Dữ liệu lớn quá sức một máy tính thông thường; đám mây cung cấp chỗ lưu trữ và sức tính để phân tích nó.', en: 'Big data is too large for an ordinary computer; the cloud provides the storage and power to analyse it.' },
        from: 'ir4-4',
      },
    ],
  },
]
