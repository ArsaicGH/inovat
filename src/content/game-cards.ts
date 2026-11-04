import type { Language } from './language'
import type { Era } from './game'

// THE CARDS OF THE TIME MACHINE REPAIR SHOP (TimeMachineGame.tsx), in both languages.
// Every card is built only from what the museum's own boards say (exhibits.ts, the rooms'
// overview boards and their "what it changed" walls), and names the board it comes from
// (`from`), so a visitor who goes back to the rooms knows where to look.
// Core I (Lost in time) needs no cards here: it uses the inventions (game.ts) and the
// era rooms' gallery photos (pictures.ts).

type Both = Record<Language, string>

// ---- Core II: Grow the town ----
// One town, from 1760 to 2026. Each era it shows three problems (drawn from that era's pool);
// each is solved by one invention. The two wrong fixes are real inventions of the same era,
// as close in field as possible, that do not solve this problem (so the era alone does not
// give the answer away).
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
    options: ['ir1-1', 'ir1-2', 'ir1-4'],
    fixed: { vi: 'Động cơ hơi nước đốt than quay máy ở bất cứ đâu: nhà máy rời bờ sông, ống khói mọc lên giữa thị trấn.', en: 'A coal-fired steam engine drives machines anywhere: the mill leaves the river and chimneys rise in town.' },
  },
  {
    id: 't1-making',
    era: 1,
    spot: 'making',
    problem: { vi: 'Cả làng kéo sợi bằng tay ở nhà: sợi làm ra chậm, ít và không đều.', en: 'The whole village spins thread by hand at home: slowly, little of it, and uneven.' },
    options: ['ir1-2', 'ir1-1', 'ir1-3'],
    fixed: { vi: 'Máy kéo sợi Water Frame làm sợi chắc với số lượng lớn; máy móc gom về một nhà máy chung.', en: 'The Water Frame spins strong thread in quantity; the machines gather in one mill.' },
  },
  {
    id: 't1-iron',
    era: 1,
    spot: 'making',
    problem: { vi: 'Thợ rèn cần thật nhiều sắt để làm máy móc, nhưng sắt luyện bằng than củi thì ít và đắt.', en: 'The smiths need far more iron for machines, but iron made with charcoal is scarce and dear.' },
    options: ['ir1-3', 'ir1-1', 'ir1-4'],
    fixed: { vi: 'Lò khuấy đốt than đá cho ra sắt rèn dẻo dai với số lượng lớn: sắt thành vật liệu của máy móc, cầu và đường ray.', en: 'The coal-fired puddling furnace makes tough wrought iron in quantity: iron becomes the stuff of machines, bridges and rails.' },
  },
  {
    id: 't1-transport',
    era: 1,
    spot: 'transport',
    problem: { vi: 'Than và hàng hóa đi bằng xe ngựa: chậm, chở được ít, và chợ ở xa thì hàng tới muộn.', en: 'Coal and goods go by horse and cart: slow, small loads, and distant markets get them late.' },
    options: ['ir1-4', 'ir1-1', 'ir1-5'],
    fixed: { vi: 'Đầu máy hơi nước kéo cả đoàn tàu trên đường ray, nối nơi sản xuất với thị trường.', en: 'Steam locomotives pull whole trains on rails, linking places of production with their markets.' },
  },
  {
    id: 't1-message',
    era: 1,
    spot: 'message',
    problem: { vi: 'Nhà ga ở đầu kia tuyến đường sắt cần biết đoàn tàu đã xuất phát, trước khi tàu tới nơi.', en: 'The station at the far end of the line needs to know a train has left, before the train arrives.' },
    options: ['ir1-5', 'ir1-4', 'ir1-1'],
    fixed: { vi: 'Điện báo gửi tin bằng dòng điện qua dây dẫn, gần như tức thì: tin tức đi nhanh hơn cả đoàn tàu.', en: 'The telegraph sends news as current along a wire, almost instantly: news now outruns the train.' },
  },
  // Era 2: the town of 1840
  {
    id: 't2-steel',
    era: 2,
    spot: 'office',
    problem: { vi: 'Thị trấn muốn xây cầu lớn và nhà cao tầng, nhưng thép làm chậm, ít và rất đắt.', en: 'The town wants great bridges and tall buildings, but steel is made slowly, in small amounts and at high cost.' },
    options: ['ir2-1', 'ir2-2', 'ir2-4'],
    fixed: { vi: 'Lò Bessemer thổi không khí qua gang nóng chảy, làm thép nhanh, nhiều và rẻ: cầu thép và nhà cao tầng mọc lên.', en: 'The Bessemer converter blows air through molten iron, making steel fast, plentiful and cheap: steel bridges and tall buildings rise.' },
  },
  {
    id: 't2-transport',
    era: 2,
    spot: 'transport',
    problem: { vi: 'Muốn đi nhanh thì phải theo đường ray; ngoài ra vẫn chỉ có xe ngựa. Người ta muốn một cỗ xe nhỏ gọn tự chạy.', en: 'To go fast you must follow the rails; otherwise there are only horses. People want a small vehicle that moves by itself.' },
    options: ['ir2-2', 'ir2-3', 'ir2-4'],
    fixed: { vi: 'Động cơ đốt trong đốt nhiên liệu ngay trong xi-lanh, đủ nhỏ để đặt lên một chiếc xe: ô tô ra đời.', en: 'The internal combustion engine burns fuel inside its cylinder, small enough for a carriage: the car is born.' },
  },
  {
    id: 't2-light',
    era: 2,
    spot: 'home',
    problem: { vi: 'Khi trời tối, đường phố chìm trong bóng tối và nhà máy phải nghỉ; cả xưởng lại quay theo một động cơ duy nhất.', en: 'At nightfall the streets go dark and the factory must stop; and the whole works turns on a single engine.' },
    options: ['ir2-3', 'ir2-2', 'ir2-5'],
    fixed: { vi: 'Đèn điện thắp sáng nhà cửa, phố xá và nhà máy; động cơ điện được đặt ở bất cứ máy nào cần.', en: 'Electric light fills homes, streets and factories; electric motors sit wherever a machine needs one.' },
  },
  {
    id: 't2-making',
    era: 2,
    spot: 'making',
    problem: { vi: 'Ô tô được lắp từng chiếc một, chậm và đắt: chỉ người giàu mới mua nổi.', en: 'Cars are built one at a time, slowly and expensively: only the rich can afford one.' },
    options: ['ir2-4', 'ir2-2', 'ir2-3'],
    fixed: { vi: 'Dây chuyền lắp ráp đưa xe qua từng công nhân, mỗi người một bước: xe làm nhanh và rẻ hơn hẳn.', en: 'The assembly line carries each car past the workers, one step each: cars are made far faster and cheaper.' },
  },
  {
    id: 't2-message',
    era: 2,
    spot: 'message',
    problem: { vi: 'Điện báo chỉ gửi được những tín hiệu phải dịch ra chữ; các thương nhân muốn trò chuyện trực tiếp với đối tác ở xa.', en: 'The telegraph only sends signals that must be turned into words; merchants want to talk directly to partners far away.' },
    options: ['ir2-5', 'ir2-3', 'ir2-2'],
    fixed: { vi: 'Điện thoại mang giọng nói đi xa; mạng lưới điện thoại nối các nhà, các công ty và các cơ quan.', en: 'The telephone carries the voice far away; telephone networks link homes, businesses and offices.' },
  },
  // Era 3: the town of 1920
  {
    id: 't3-chip',
    era: 3,
    spot: 'office',
    problem: { vi: 'Bộ xử lý của máy tính cần rất nhiều linh kiện; các kỹ sư muốn gói cả bộ xử lý vào một linh kiện thật nhỏ.', en: 'A computer’s processor needs a great many parts; engineers want to fit the whole processor into one tiny part.' },
    options: ['ir3-1', 'ir3-2', 'ir3-3'],
    fixed: { vi: 'Bộ vi xử lý đặt cả bộ xử lý trung tâm lên một con chip: thiết bị điện tử nhỏ và nhẹ dần.', en: 'The microprocessor puts a whole central processor on one chip: electronics grow smaller and lighter.' },
  },
  {
    id: 't3-pc',
    era: 3,
    spot: 'office',
    problem: { vi: 'Máy tính chỉ có ở các tổ chức lớn; nhân viên văn phòng và học sinh muốn có máy tính của riêng mình.', en: 'Only big organisations have computers; office workers and pupils want a computer of their own.' },
    options: ['ir3-2', 'ir3-1', 'ir3-4'],
    fixed: { vi: 'Máy tính cá nhân vào văn phòng, trường học và gia đình: soạn văn bản, tính toán, lưu dữ liệu.', en: 'The personal computer reaches offices, schools and homes: writing, calculating and storing data.' },
  },
  {
    id: 't3-robot',
    era: 3,
    spot: 'making',
    problem: { vi: 'Trong xưởng ô tô, công việc nâng vật nặng và lặp đi lặp lại vừa nặng nhọc vừa nguy hiểm cho công nhân.', en: 'In the car works, lifting heavy parts over and over is exhausting and dangerous for the workers.' },
    options: ['ir3-3', 'ir3-1', 'ir3-2'],
    fixed: { vi: 'Robot công nghiệp làm những động tác lập trình sẵn, lặp lại, và đưa công nhân tránh xa chỗ nguy hiểm.', en: 'Industrial robots carry out programmed, repeated movements and keep workers away from danger.' },
  },
  {
    id: 't3-plc',
    era: 3,
    spot: 'power',
    problem: { vi: 'Mỗi lần đổi quy trình sản xuất, kỹ sư lại phải đi dây lại toàn bộ tủ điều khiển.', en: 'Every time the process changes, engineers must rewire the whole control cabinet.' },
    options: ['ir3-3', 'ir3-1', 'ir3-2'],
    fixed: { vi: 'Bộ điều khiển lập trình (PLC) điều khiển máy bằng chương trình: đổi quy trình chỉ cần sửa chương trình.', en: 'The programmable logic controller (PLC) runs machines with a program: a new process just means editing it.' },
  },
  {
    id: 't3-network',
    era: 3,
    spot: 'message',
    problem: { vi: 'Máy tính ở những viện nghiên cứu cách xa nhau không thể trao đổi dữ liệu với nhau.', en: 'Computers at research sites far apart cannot exchange data with each other.' },
    options: ['ir3-4', 'ir3-5', 'ir3-2'],
    fixed: { vi: 'Mạng ARPANET nối máy tính ở các nơi để trao đổi dữ liệu, một nền móng của Internet.', en: 'ARPANET links computers in different places to exchange data, one of the foundations of the Internet.' },
  },
  {
    id: 't3-mobile',
    era: 3,
    spot: 'transport',
    problem: { vi: 'Chiếc điện thoại vẫn bị buộc vào sợi dây trên tường; người ta muốn gọi điện khi đang đi ngoài phố.', en: 'The telephone is still tied to a wire on the wall; people want to call while walking down the street.' },
    options: ['ir3-5', 'ir3-4', 'ir3-1'],
    fixed: { vi: 'Điện thoại di động cầm tay cho phép gọi điện ở bất cứ đâu.', en: 'The handheld mobile phone lets people call from anywhere.' },
  },
  {
    id: 't3-web',
    era: 3,
    spot: 'home',
    problem: { vi: 'Các nhà khoa học muốn chia sẻ tài liệu thành những trang liên kết với nhau, ai cũng mở được từ máy của mình.', en: 'Scientists want to share documents as pages linked to one another, which anyone can open on their own computer.' },
    options: ['ir3-5', 'ir3-4', 'ir3-2'],
    fixed: { vi: 'World Wide Web chia sẻ thông tin bằng các trang liên kết, chạy trên nền Internet.', en: 'The World Wide Web shares information as linked pages, running on the Internet.' },
  },
  // Era 4: the town of 1990
  {
    id: 't4-print',
    era: 4,
    spot: 'making',
    problem: { vi: 'Nhà thiết kế cần ngay mẫu thử của một chi tiết hình dạng phức tạp, từ bản vẽ trên máy tính.', en: 'A designer needs a prototype of a complex part right away, straight from a computer drawing.' },
    options: ['ir4-1', 'ir4-5', 'ir4-2'],
    fixed: { vi: 'Máy in 3D đắp vật liệu từng lớp theo mô hình số: mẫu thử có ngay, hình dạng phức tạp cũng được.', en: 'A 3D printer builds up material layer by layer from the digital model: a quick prototype, complex shape and all.' },
  },
  {
    id: 't4-predict',
    era: 4,
    spot: 'power',
    problem: { vi: 'Máy móc hỏng bất ngờ làm cả dây chuyền dừng lại; nhà máy muốn biết trước khi máy sắp hỏng.', en: 'Machines break down without warning and stop the whole line; the factory wants to know before a machine fails.' },
    options: ['ir4-2', 'ir4-3', 'ir4-4'],
    fixed: { vi: 'Cảm biến gửi dữ liệu liên tục; hệ thống phân tích và cảnh báo trước khi nguy cơ hỏng hóc tăng (bảo trì dự đoán).', en: 'Sensors send data all the time; the system analyses it and warns when a breakdown is becoming likely (predictive maintenance).' },
  },
  {
    id: 't4-twin',
    era: 4,
    spot: 'making',
    problem: { vi: 'Kỹ sư muốn thử bố trí lại dây chuyền, nhưng không thể dừng nhà máy thật để thử.', en: 'Engineers want to try rearranging the line, but cannot stop the real factory to try it.' },
    options: ['ir4-2', 'ir4-4', 'ir4-3'],
    fixed: { vi: 'Bản sao số phản chiếu trạng thái của dây chuyền thật: thử thay đổi trên đó trước khi làm thật.', en: 'A digital twin mirrors the real line: changes are tested on it before being made for real.' },
  },
  {
    id: 't4-inspect',
    era: 4,
    spot: 'office',
    problem: { vi: 'Mỗi giờ có hàng nghìn sản phẩm cần kiểm tra lỗi; mắt người mỏi dần và bỏ sót.', en: 'Thousands of products an hour must be checked for faults; human eyes tire and miss things.' },
    options: ['ir4-3', 'ir4-2', 'ir4-5'],
    fixed: { vi: 'AI học từ ảnh mẫu để nhận ra lỗi, nhanh và đều tay, dưới sự giám sát của con người.', en: 'AI learns from example images to spot faults quickly and consistently, with people overseeing it.' },
  },
  {
    id: 't4-cloud',
    era: 4,
    spot: 'home',
    problem: { vi: 'Một công ty nhỏ có dữ liệu từ hàng nghìn cảm biến, nhưng không đủ tiền mua và vận hành máy chủ riêng.', en: 'A small company has data from thousands of sensors, but cannot afford to buy and run its own servers.' },
    options: ['ir4-4', 'ir4-2', 'ir4-3'],
    fixed: { vi: 'Điện toán đám mây cho thuê sức tính toán và chỗ lưu trữ qua Internet, dùng bao nhiêu trả bấy nhiêu.', en: 'Cloud computing rents out computing power and storage over the Internet, paid for as it is used.' },
  },
  {
    id: 't4-cobot',
    era: 4,
    spot: 'transport',
    problem: { vi: 'Một xưởng nhỏ muốn có robot làm ngay cạnh công nhân để cùng đóng gói, không cần hàng rào chắn.', en: 'A small workshop wants a robot working right beside its staff, packing together, without a safety fence.' },
    options: ['ir4-5', 'ir4-3', 'ir4-2'],
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
    options: ['ir4-6', 'ir4-4', 'ir4-1'],
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
      { vi: 'Lĩnh vực của tôi: cơ khí và năng lượng.', en: 'My field: mechanical engineering and energy.' },
      { vi: 'Trước tôi, sản xuất dựa vào sức người, sức vật hoặc sức nước.', en: 'Before me, work relied on human or animal strength, or running water.' },
      { vi: 'Nhờ tôi, nhà máy, hầm mỏ và nhiều ngành khác được cơ giới hóa.', en: 'Thanks to me, factories, mines and many other industries were mechanised.' },
      { vi: 'Bí quyết của tôi là một bình ngưng tách riêng, đỡ phí nhiệt hơn hẳn.', en: 'My secret is a separate condenser, which wastes far less heat.' },
    ],
  },
  {
    id: 'ir1-2',
    clues: [
      { vi: 'Lĩnh vực của tôi: công nghiệp dệt.', en: 'My field: the textile industry.' },
      { vi: 'Tôi làm một việc của ngành dệt mà trước kia người ta làm bằng tay ở nhà.', en: 'I do a textile job that people once did by hand at home.' },
      { vi: 'Vì tôi cần nguồn động lực và chỗ đặt máy, các xưởng gom lại thành nhà máy tập trung.', en: 'Because I needed a power source and room, workshops gathered into centralised mills.' },
      { vi: 'Tôi chạy bằng sức nước, như chính tên tôi; Richard Arkwright làm ra tôi.', en: 'I ran on water power, as my name says; Richard Arkwright made me.' },
    ],
  },
  {
    id: 'ir1-3',
    clues: [
      { vi: 'Lĩnh vực của tôi: luyện kim.', en: 'My field: metallurgy.' },
      { vi: 'Trước tôi, vật liệu tôi làm ra phụ thuộc vào than củi nên làm được rất ít.', en: 'Before me, the material I make depended on charcoal, so little could be made.' },
      { vi: 'Nhờ tôi, máy móc, cầu và đường ray có vật liệu rẻ và dồi dào hơn.', en: 'Thanks to me, machines, bridges and rails got a cheaper, more plentiful material.' },
      { vi: 'Công nhân khuấy gang nóng chảy trong lò của tôi để đốt cháy cacbon; Henry Cort được cấp bằng sáng chế cho tôi.', en: 'Workers stirred molten pig iron in my furnace to burn off the carbon; Henry Cort patented me.' },
    ],
  },
  {
    id: 'ir1-4',
    clues: [
      { vi: 'Lĩnh vực của tôi: giao thông vận tải.', en: 'My field: transport.' },
      { vi: 'Trước tôi, hàng hóa và con người đi chậm, bằng sức ngựa.', en: 'Before me, goods and people travelled slowly, at the speed of horses.' },
      { vi: 'Tôi giúp nối các trung tâm sản xuất với thị trường.', en: 'I helped link centres of production with their markets.' },
      { vi: 'Tôi nổi tiếng nhờ một cuộc thi ở Rainhill, nước Anh.', en: 'I became famous at a contest at Rainhill, England.' },
    ],
  },
  {
    id: 'ir1-5',
    clues: [
      { vi: 'Lĩnh vực của tôi: thông tin liên lạc.', en: 'My field: communication.' },
      { vi: 'Trước tôi, tin tức chỉ đi nhanh bằng người, ngựa hay con tàu mang nó.', en: 'Before me, news travelled only as fast as whoever carried it.' },
      { vi: 'Nhờ tôi, lần đầu tiên tin tức đi nhanh hơn cả đoàn tàu nhanh nhất.', en: 'Thanks to me, news for the first time outran the fastest train.' },
      { vi: 'Tôi biến mỗi chữ cái thành những tín hiệu ngắn và dài.', en: 'I turn each letter into short and long signals.' },
    ],
  },
  {
    id: 'ir2-1',
    clues: [
      { vi: 'Lĩnh vực của tôi: luyện kim.', en: 'My field: metallurgy.' },
      { vi: 'Trước tôi, vật liệu tôi làm ra được làm chậm, ít và rất đắt.', en: 'Before me, the material I make was produced slowly, in small amounts, at great cost.' },
      { vi: 'Nhờ tôi, đường ray, cầu, tàu thủy và nhà cao tầng mọc lên.', en: 'Thanks to me, rails, bridges, ships and tall buildings went up.' },
      { vi: 'Tôi thổi không khí qua gang nóng chảy trong một lò hình quả lê.', en: 'I blow air through molten pig iron in a pear-shaped vessel.' },
    ],
  },
  {
    id: 'ir2-2',
    clues: [
      { vi: 'Lĩnh vực của tôi: động lực, tức là làm ra sức kéo cho máy móc và xe cộ.', en: 'My field: engines, the power that drives machines and vehicles.' },
      { vi: 'Tôi nhỏ và nhẹ hơn động cơ hơi nước, vì không cần lò đốt và nồi hơi cồng kềnh.', en: 'I am smaller and lighter than a steam engine: no bulky firebox or boiler.' },
      { vi: 'Tôi đưa động lực lên xe tải, máy kéo, tàu thủy và sau này cả máy bay.', en: 'I brought power to lorries, tractors, ships and later aircraft.' },
      { vi: 'Tôi đốt nhiên liệu ngay trong xi-lanh; một chiếc xe ba bánh chạy xăng nổi tiếng dùng tôi.', en: 'I burn fuel inside my cylinder; a famous three-wheeled petrol car used me.' },
    ],
  },
  {
    id: 'ir2-3',
    clues: [
      { vi: 'Lĩnh vực của tôi: điện.', en: 'My field: electricity.' },
      { vi: 'Trước tôi, đêm xuống là việc phải dừng, và cả xưởng quay theo một động cơ duy nhất.', en: 'Before me, work stopped at nightfall and a whole factory turned on one engine.' },
      { vi: 'Nhờ tôi, mỗi máy có thể có động cơ riêng, và thành phố sáng về đêm.', en: 'Thanks to me, each machine could have its own motor, and cities lit up at night.' },
      { vi: 'Đèn sợi đốt và động cơ xoay chiều là hai gương mặt của tôi.', en: 'The incandescent lamp and the AC motor are my two faces.' },
    ],
  },
  {
    id: 'ir2-4',
    clues: [
      { vi: 'Lĩnh vực của tôi: tổ chức sản xuất công nghiệp.', en: 'My field: organising industrial production.' },
      { vi: 'Trước tôi, mỗi sản phẩm được làm chậm, từng chiếc một.', en: 'Before me, each product was built slowly, one at a time.' },
      { vi: 'Tôi làm hàng hóa rẻ hơn, nhưng làm nhiều công việc trở nên đơn điệu và lặp lại.', en: 'I made goods cheaper, but made much work monotonous and repetitive.' },
      { vi: 'Sản phẩm đi qua từng người, mỗi người làm một bước; chiếc Model T là ngôi sao của tôi.', en: 'The product moves past each worker doing one step; the Model T was my star.' },
    ],
  },
  {
    id: 'ir2-5',
    clues: [
      { vi: 'Lĩnh vực của tôi: viễn thông.', en: 'My field: telecommunications.' },
      { vi: 'Trước tôi, liên lạc từ xa chỉ là những tín hiệu phải dịch ra chữ.', en: 'Before me, long-distance messages were signals that had to be turned into words.' },
      { vi: 'Nhờ tôi, con người, doanh nghiệp và cơ quan liên hệ trực tiếp với nhau dễ dàng hơn nhiều.', en: 'Thanks to me, people, businesses and offices could reach each other directly, far more easily.' },
      { vi: 'Tôi mang giọng nói con người đi xa; tên tuổi tôi gắn với Alexander Graham Bell.', en: 'I carry the human voice far away; I am linked to Alexander Graham Bell.' },
    ],
  },
  {
    id: 'ir3-1',
    clues: [
      { vi: 'Tôi là một linh kiện nhỏ, không phải một cỗ máy hoàn chỉnh.', en: 'I am a tiny component, not a complete machine.' },
      { vi: 'Trước tôi, một bộ xử lý cần rất nhiều linh kiện riêng lẻ.', en: 'Before me, a processor needed many separate parts.' },
      { vi: 'Nhờ tôi, thiết bị điện tử ngày càng nhỏ và nhẹ.', en: 'Thanks to me, electronics became ever smaller and lighter.' },
      { vi: 'Tôi gói cả bộ xử lý trung tâm vào một con chip; Intel làm ra tôi.', en: 'I pack a whole central processor onto one chip; Intel made me.' },
    ],
  },
  {
    id: 'ir3-2',
    clues: [
      { vi: 'Tôi là một chiếc máy hoàn chỉnh, đặt vừa trên bàn làm việc.', en: 'I am a complete machine that fits on a desk.' },
      { vi: 'Trước tôi, máy tính thuộc về các tổ chức lớn chứ không phải từng người.', en: 'Before me, computers belonged to big organisations, not to individuals.' },
      { vi: 'Tôi giúp soạn văn bản, tính toán và lưu dữ liệu, và kéo theo cả ngành phần mềm.', en: 'I helped with writing, calculating and storing data, and boosted the software industry.' },
      { vi: 'Một hãng máy tính lớn của Mỹ giới thiệu tôi năm 1981, cho văn phòng, trường học và gia đình.', en: 'A big American computer company launched me in 1981, for offices, schools and homes.' },
    ],
  },
  {
    id: 'ir3-3',
    clues: [
      { vi: 'Tôi làm việc trong nhà máy, trên dây chuyền sản xuất.', en: 'I work in factories, on the production line.' },
      { vi: 'Trước tôi, con người làm việc nặng và nguy hiểm, và đổi quy trình nghĩa là đi dây lại.', en: 'Before me, people did heavy, dangerous work, and changing a process meant rewiring.' },
      { vi: 'Tôi gồm hai phần, hai trụ cột của nhà máy tự động.', en: 'I come in two parts, the two pillars of the automated factory.' },
      { vi: 'Một nửa của tôi bắt đầu làm việc trong nhà máy General Motors năm 1961.', en: 'Half of me went to work in a General Motors factory in 1961.' },
    ],
  },
  {
    id: 'ir3-4',
    clues: [
      { vi: 'Tôi không phải một cỗ máy, mà là mối nối giữa nhiều máy tính.', en: 'I am not a machine but a link between many computers.' },
      { vi: 'Trước tôi, máy tính ở những nơi khác nhau không trao đổi dữ liệu được với nhau.', en: 'Before me, computers in different places could not exchange data.' },
      { vi: 'Tôi là một trong những nền móng của Internet.', en: 'I am one of the foundations of the Internet.' },
      { vi: 'Một cơ quan nghiên cứu của Bộ Quốc phòng Hoa Kỳ đứng sau tôi.', en: 'A research agency of the US Department of Defense was behind me.' },
    ],
  },
  {
    id: 'ir3-5',
    clues: [
      { vi: 'Tôi gồm hai phát minh: một thứ cầm trên tay, một thứ đọc trên màn hình.', en: 'I am two inventions: one you hold in your hand, one you read on a screen.' },
      { vi: 'Trước tôi, cuộc gọi nào cũng cần một sợi dây, và tài liệu không nối được với nhau.', en: 'Before me, every call needed a wire, and documents were not linked to one another.' },
      { vi: 'Nhờ tôi, thông tin, mua bán và trò chuyện theo con người đi khắp nơi.', en: 'Thanks to me, information, shopping and conversation followed people everywhere.' },
      { vi: 'Martin Cooper và Tim Berners-Lee là hai cha đẻ của tôi.', en: 'Martin Cooper and Tim Berners-Lee are my two parents.' },
    ],
  },
  {
    id: 'ir4-1',
    clues: [
      { vi: 'Lĩnh vực của tôi: chế tạo đồ vật, nhưng không cắt gọt hay đúc khuôn.', en: 'My field: making objects, but without cutting or moulding them.' },
      { vi: 'Tôi biến một mô hình số trên máy tính thành vật thật.', en: 'I turn a digital model on a computer into a real object.' },
      { vi: 'Tôi làm nhanh mẫu thử và những hình dạng phức tạp, nhưng tốc độ, vật liệu và chi phí vẫn giới hạn tôi.', en: 'I make quick prototypes and complex shapes, but speed, materials and cost still limit me.' },
      { vi: 'Tôi đắp vật liệu lên từng lớp một.', en: 'I build up material one layer at a time.' },
    ],
  },
  {
    id: 'ir4-2',
    clues: [
      { vi: 'Lĩnh vực của tôi: cảm biến, mạng và tự động hóa trong nhà máy.', en: 'My field: sensors, networks and automation in the factory.' },
      { vi: 'Trước tôi, người ta chờ máy hỏng rồi mới sửa.', en: 'Before me, people waited for machines to break before fixing them.' },
      { vi: 'Tôi cảnh báo hỏng hóc từ trước, và để kỹ sư thử thay đổi trên một bản sao ảo.', en: 'I warn of breakdowns in advance, and let engineers try changes on a virtual copy.' },
      { vi: 'Cảm biến trên máy móc gửi dữ liệu cho tôi liên tục qua mạng.', en: 'Sensors on the machines send me data over the network all the time.' },
    ],
  },
  {
    id: 'ir4-3',
    clues: [
      { vi: 'Lĩnh vực của tôi: khoa học máy tính.', en: 'My field: computer science.' },
      { vi: 'Thay vì chỉ làm theo quy tắc viết sẵn, tôi học từ rất nhiều dữ liệu.', en: 'Instead of only following rules written in advance, I learn from vast amounts of data.' },
      { vi: 'Tôi nhận dạng, dự đoán, quyết định và sáng tạo, nhưng vẫn có thể sai và cần con người giám sát.', en: 'I recognise, predict, decide and create, but I can still be wrong and need human oversight.' },
      { vi: 'ChatGPT đưa một dạng của tôi đến với hàng trăm triệu người.', en: 'ChatGPT brought one form of me to hundreds of millions of people.' },
    ],
  },
  {
    id: 'ir4-4',
    clues: [
      { vi: 'Lĩnh vực của tôi: trung tâm dữ liệu và mạng Internet.', en: 'My field: data centres and the Internet.' },
      { vi: 'Trước tôi, mỗi doanh nghiệp phải tự mua và vận hành máy chủ.', en: 'Before me, every business had to buy and run its own servers.' },
      { vi: 'Người ta thuê tôi qua Internet, dùng bao nhiêu trả bấy nhiêu; AI được huấn luyện trong tôi.', en: 'People rent me over the Internet, paying for what they use; AI is trained inside me.' },
      { vi: 'Amazon Web Services mở đường cho tôi năm 2006.', en: 'Amazon Web Services opened the way for me in 2006.' },
    ],
  },
  {
    id: 'ir4-5',
    clues: [
      { vi: 'Lĩnh vực của tôi: những cỗ máy cử động trong sản xuất thông minh.', en: 'My field: machines that move, in smart manufacturing.' },
      { vi: 'Tổ tiên của tôi làm việc sau hàng rào và lặp lại đúng một chuỗi động tác.', en: 'My ancestors worked behind a fence, repeating exactly one sequence of moves.' },
      { vi: 'Với camera và cảm biến lực, tôi có thể làm việc ngay cạnh con người.', en: 'With cameras and force sensors, I can work right beside people.' },
      { vi: 'Một nhánh của gia đình tôi được gọi là "cobot".', en: 'One branch of my family is called the “cobot”.' },
    ],
  },
  {
    id: 'ir4-6',
    clues: [
      { vi: 'Lĩnh vực của tôi: sinh học, y học và nông nghiệp.', en: 'My field: biology, medicine and agriculture.' },
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
// Two possible visitors from each era (one is chosen each game); each asks two questions,
// from a pool of three to five, about where the changes of their own time will lead and what
// they will cost (not which invention solves a problem: that is core II). The first reply
// is the right one; the others belong to another time, or misjudge the era.
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
        ask: { vi: 'Công nhân của tôi làm việc rất nhiều giờ, xưởng thì ngột ngạt khói than. Thời của bạn nhìn lại chuyện này thế nào?', en: 'My workers labour very long hours, and the mill is choked with coal smoke. How does your time look back on this?' },
        replies: [
          { vi: 'Đó là mặt tối của thời đại: lao động khắc nghiệt và ô nhiễm.', en: 'It is the dark side of the age: harsh work and polluted towns.' },
          { vi: 'Chỉ là tạm thời: khói sẽ tan khi các nhà máy lớn hơn.', en: 'It is a short phase: the smoke will clear as mills grow larger.' },
          { vi: 'Ít ai bận tâm: làm việc ở nhà còn vất vả và bẩn hơn.', en: 'Few will mind: working at home was harder and dirtier still.' },
        ],
        why: { vi: 'Cuộc cách mạng thứ nhất mang lại nhà máy và năng suất, nhưng cũng cả điều kiện lao động khắc nghiệt, ô nhiễm và đô thị phình to.', en: 'The first revolution brought factories and productivity, but also harsh working conditions, pollution and swelling cities.' },
        from: 'ir1-overview',
      },
      {
        ask: { vi: 'Người dân đổ về thành phố ngày càng đông. Vì sao vậy?', en: 'More and more people are crowding into the towns. Why?' },
        replies: [
          { vi: 'Việc làm dồn về nhà máy, nên người ta kéo đến tìm việc.', en: 'Work is gathering in the factories, so people come to find it.' },
          { vi: 'Nông trại cần thêm người, và thị trấn cung cấp nhân công.', en: 'Farms need more hands, and the towns supply the farm labour.' },
          { vi: 'Đường sắt đã tới mọi làng, nên người ta lên phố du ngoạn.', en: 'Railways reach every village, so people visit towns for fun.' },
        ],
        why: { vi: 'Nhà máy kéo người lao động về thành phố: đô thị phát triển nhanh chóng là một hệ quả của cuộc cách mạng thứ nhất.', en: 'Factories drew workers into the towns: fast-growing cities were one result of the first revolution.' },
        from: 'ir1-overview',
      },
      {
        ask: { vi: 'Tôi vừa lắp một động cơ hơi nước kiểu mới của ông Watt. Nó sẽ thay đổi điều gì?', en: 'I have just installed one of Mr Watt’s new steam engines. What will it change?' },
        replies: [
          { vi: 'Xưởng có thể rời bờ sông, và nhiều ngành nữa sẽ dùng máy móc.', en: 'My mill can leave the river, and many more trades will use machines.' },
          { vi: 'Mỗi máy trong xưởng sẽ sớm có một động cơ nhỏ riêng.', en: 'Each machine in the mill will soon get its own small motor.' },
          { vi: 'Xưởng vẫn cần dòng sông, chỉ là máy chạy nhanh hơn một chút.', en: 'The mill still needs the river, but its machines run a bit faster.' },
        ],
        why: { vi: 'Động cơ của Watt tiết kiệm nhiên liệu hơn, được dùng rộng rãi trong nhà máy và hầm mỏ, đưa sản xuất từ sức người, sức vật và sức nước sang máy móc. Động cơ điện riêng cho từng máy chỉ đến ở cuộc cách mạng thứ hai.', en: 'Watt’s engine used less fuel and spread through factories and mines, moving production from human, animal and water power to machines. A motor for every machine only came with the second revolution.' },
        from: 'ir1-1',
      },
      {
        ask: { vi: 'Máy Water Frame của tôi giờ đã quay trong một nhà máy lớn. Những người kéo sợi tại nhà rồi sẽ ra sao?', en: 'My Water Frames now spin together in one big mill. What will become of people spinning at home?' },
        replies: [
          { vi: 'Kéo sợi tay tại nhà sẽ dần nhường chỗ cho làm việc trong nhà máy.', en: 'Spinning by hand at home will slowly give way to work in mills.' },
          { vi: 'Mỗi gia đình sẽ có một máy Water Frame nhỏ để kéo sợi tại nhà.', en: 'Each family will get a small Water Frame to spin at home.' },
          { vi: 'Họ sẽ đứng vào dây chuyền di động, mỗi người làm một bước.', en: 'They will join a moving line, each doing one step of the work.' },
        ],
        why: { vi: 'Water Frame cần nguồn động lực và chỗ đặt máy, nên các xưởng gom lại thành nhà máy, dần thay thế việc làm thủ công tại nhà. Dây chuyền di động thuộc cuộc cách mạng thứ hai.', en: 'The Water Frame needed power and room, so workshops gathered into factories, slowly replacing hand work at home. The moving line belongs to the second revolution.' },
        from: 'ir1-2',
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
        ask: { vi: 'Bạn nghĩ đường sắt sẽ thay đổi điều gì?', en: 'What do you think the railways will change?' },
        replies: [
          { vi: 'Hàng hóa và con người đi nhanh hơn, nối nhà máy với thị trường.', en: 'Goods and people will move faster, linking factories to markets.' },
          { vi: 'Đường sắt chủ yếu chở khách; hàng hóa vẫn đi đường kênh.', en: 'Railways will mostly carry passengers; goods will stay on canals.' },
          { vi: 'Thị trấn sẽ thu nhỏ, vì người ta sống xa nơi làm việc.', en: 'Towns will shrink, as people can now live far from their work.' },
        ],
        why: { vi: 'Đường sắt giúp người và hàng hóa đi nhanh hơn, nối các trung tâm sản xuất với thị trường, thúc đẩy thương mại và công nghiệp.', en: 'Railways let people and goods move faster and linked centres of production with their markets, boosting trade and industry.' },
        from: 'ir1-4',
      },
      {
        ask: { vi: 'Lò luyện của ông Cort giờ làm ra sắt rèn với số lượng lớn. Thứ sắt ấy sẽ được dùng vào việc gì?', en: 'Mr Cort’s puddling furnaces now make wrought iron in quantity. What will that iron become?' },
        replies: [
          { vi: 'Vật liệu chính của máy móc, cầu và đường ray.', en: 'The main material of machines, bridges and rails.' },
          { vi: 'Thép giá rẻ cho nhà cao tầng và những con tàu lớn.', en: 'Cheap steel for tall buildings and great ships.' },
          { vi: 'Chủ yếu là dụng cụ và đinh, vì ray vẫn làm bằng gỗ.', en: 'Mostly tools and nails, as rails are still made of wood.' },
        ],
        why: { vi: 'Lò luyện đốt than giúp làm sắt rèn nhiều và rẻ hơn, nên sắt thành vật liệu chính của cuộc cách mạng thứ nhất. Thép rẻ cho nhà cao tầng chỉ đến với phương pháp Bessemer ở cuộc cách mạng thứ hai.', en: 'Coal-fired puddling made wrought iron cheaper and more plentiful, so iron became the main material of the first revolution. Cheap steel for tall buildings only came with the Bessemer process in the second.' },
        from: 'ir1-3',
      },
      {
        ask: { vi: 'Dây điện báo giờ đã chạy dọc tuyến đường sắt của tôi. Ngoài đường sắt, nó sẽ thay đổi điều gì?', en: 'Telegraph wires now run along my line. Beyond the railway, what will they change?' },
        replies: [
          { vi: 'Tin tức đi nhanh hơn tàu, phục vụ báo chí và thương mại.', en: 'News will outrun trains, serving newspapers and trade.' },
          { vi: 'Mọi người sẽ trò chuyện bằng giọng nói giữa các thành phố.', en: 'People will talk by voice from one city to another.' },
          { vi: 'Nó sẽ chỉ dùng cho đường sắt, quá đắt với mọi người khác.', en: 'It will stay a railway tool, too costly for anyone else.' },
        ],
        why: { vi: 'Điện báo gửi tin gần như tức thì và phục vụ đường sắt, báo chí và thương mại. Truyền giọng nói đi xa là việc của điện thoại, ở cuộc cách mạng thứ hai.', en: 'The telegraph sent messages almost instantly and served railways, newspapers and trade. Carrying the voice far away was the telephone’s work, in the second revolution.' },
        from: 'ir1-5',
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
        ask: { vi: 'Dây chuyền chạy tốt, nhưng công nhân than phiền. Họ khó chịu vì điều gì?', en: 'The line runs well, but the workers complain. What troubles them?' },
        replies: [
          { vi: 'Công việc lặp lại, đơn điệu và bị tổ chức rất chặt chẽ.', en: 'The work is repetitive, monotonous and tightly organised.' },
          { vi: 'Họ phải học lập trình cho những cỗ máy mình dùng.', en: 'They must now learn to program the machines they use.' },
          { vi: 'Đèn điện mới bắt họ làm việc thâu đêm suốt sáng.', en: 'The new electric lights keep them working through the night.' },
        ],
        why: { vi: 'Sản xuất hàng loạt làm hàng hóa rẻ hơn, nhưng làm nhiều công việc đơn điệu, lặp lại và cần tổ chức lao động chặt chẽ.', en: 'Mass production made goods cheaper, but made much work monotonous and repetitive, and demanded tightly organised labour.' },
        from: 'ir2-overview',
      },
      {
        ask: { vi: 'Chúng tôi vừa bắt đầu lắp xe Model T trên một dây chuyền di động. Sản lượng của chúng tôi sẽ ra sao?', en: 'We have just started building the Model T on a moving line. What will happen to our output?' },
        replies: [
          { vi: 'Sản lượng tăng và thời gian lắp ráp giảm.', en: 'Output will rise and assembly time will fall.' },
          { vi: 'Sản lượng tăng, nhưng mỗi chiếc xe sẽ đắt hơn.', en: 'Output will rise, but each car will cost more.' },
          { vi: 'Máy móc sẽ tự học từ dữ liệu để sắp xếp dây chuyền.', en: 'The machines will learn from data to plan the line.' },
        ],
        why: { vi: 'Dây chuyền di động của Ford làm tăng sản lượng, giảm thời gian lắp ráp và trở thành biểu tượng của sản xuất hàng loạt. Máy học từ dữ liệu thuộc cuộc cách mạng thứ tư.', en: 'Ford’s moving line raised output, cut assembly time and became the symbol of mass production. Machines that learn from data belong to the fourth revolution.' },
        from: 'ir2-4',
      },
      {
        ask: { vi: 'Xưởng của tôi đã thay một động cơ hơi nước bằng các động cơ điện. Bên trong nhà máy sẽ thay đổi thế nào?', en: 'My works has swapped its one steam engine for electric motors. What will change inside the factory?' },
        replies: [
          { vi: 'Động cơ đặt được ở bất cứ đâu, nên cách bố trí xưởng thay đổi.', en: 'Motors can go wherever needed, so the layout can change.' },
          { vi: 'Các máy vẫn phải nối dây curoa về một động cơ trung tâm.', en: 'Machines must still be belted to one central motor.' },
          { vi: 'Robot sẽ làm thay việc hàn trên dây chuyền.', en: 'Robots will take over the welding on the line.' },
        ],
        why: { vi: 'Động cơ điện xoay chiều biến điện năng thành chuyển động, nên nhà máy không còn phụ thuộc vào một động cơ hơi nước duy nhất. Robot hàn chỉ đến ở cuộc cách mạng thứ ba.', en: 'The AC motor turns electricity into motion, so a factory no longer depends on one steam engine. Welding robots only came with the third revolution.' },
        from: 'ir2-3',
      },
      {
        ask: { vi: 'Loại động cơ chạy xăng như của ông Benz đang ngày càng phổ biến. Rồi nó sẽ được dùng ở đâu?', en: 'Petrol engines like Mr Benz’s are catching on. Where will they end up?' },
        replies: [
          { vi: 'Trong ô tô, xe tải, máy kéo, tàu thủy và sau này là máy bay.', en: 'In cars, lorries, tractors, ships and later aircraft.' },
          { vi: 'Chủ yếu trong nhà máy, để quay máy thay cho hơi nước.', en: 'Mainly in factories, driving machines in place of steam.' },
          { vi: 'Chủ yếu trong đầu máy, để kéo tàu chạy trên đường ray.', en: 'Mainly in locomotives, pulling trains along the rails.' },
        ],
        why: { vi: 'Động cơ đốt trong đốt nhiên liệu ngay trong xi-lanh nên nhỏ và nhẹ hơn động cơ hơi nước, đưa động lực đến ô tô, xe tải, máy kéo, tàu thủy và sau này là máy bay.', en: 'An internal combustion engine burns its fuel inside the cylinder, so it is smaller and lighter than a steam engine, bringing power to cars, lorries, tractors, ships and later aircraft.' },
        from: 'ir2-2',
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
        ask: { vi: 'Nhà máy trong thành phố muốn sản xuất nhiều và rẻ hơn. Đâu là chìa khóa của thời đại này?', en: 'The city’s factories want to produce more, and more cheaply. What is the key of this age?' },
        replies: [
          { vi: 'Điện năng và sản xuất hàng loạt.', en: 'Electric power and mass production.' },
          { vi: 'Hơi nước và những tuyến đường sắt đầu tiên.', en: 'Steam power and the first railways.' },
          { vi: 'Máy tính và điều khiển bằng chương trình.', en: 'Computers and programmable control.' },
        ],
        why: { vi: 'Cuộc cách mạng thứ hai dựa trên điện năng, kỹ thuật cơ khí và tiến bộ khoa học, đưa nhà máy lên quy mô sản xuất lớn.', en: 'The second revolution rested on electricity, engineering and science, taking factories to large-scale production.' },
        from: 'ir2-overview',
      },
      {
        ask: { vi: 'Thành phố đang lắp đèn điện cho đường phố và nhà dân. Điều đó sẽ thay đổi gì?', en: 'The city is putting electric lamps in its streets and homes. What will that change?' },
        replies: [
          { vi: 'Con người làm việc được khi trời tối, và lưới điện sẽ lan rộng.', en: 'People can work after dark, and power networks will spread.' },
          { vi: 'Đèn chỉ thắp sáng những khu nhà giàu suốt cả thế kỷ.', en: 'The lamps will light only the rich districts for a century.' },
          { vi: 'Đèn sẽ học thói quen của người dân để tự bật tắt.', en: 'The lamps will learn people’s habits and switch themselves.' },
        ],
        why: { vi: 'Đèn sợi đốt giúp con người làm việc và sinh hoạt sau khi trời tối, và thúc đẩy việc xây dựng mạng lưới cấp điện. Thiết bị tự học thói quen thuộc cuộc cách mạng thứ tư.', en: 'The incandescent lamp let people work and live after dark, and drove the building of power networks. Devices that learn habits belong to the fourth revolution.' },
        from: 'ir2-3',
      },
      {
        ask: { vi: 'Thép Bessemer giá rẻ đang về thành phố với số lượng lớn. Chúng ta sẽ xây được gì?', en: 'Cheap Bessemer steel is arriving in quantity. What will it let us build?' },
        replies: [
          { vi: 'Đường sắt, cầu, tàu thủy và nhà cao tầng.', en: 'Railways, bridges, ships and tall buildings.' },
          { vi: 'Chủ yếu là dụng cụ và ray, vì thép vẫn còn đắt.', en: 'Mainly tools and rails, as steel is still costly.' },
          { vi: 'Linh kiện in từng lớp từ mô hình trên máy tính.', en: 'Parts printed layer by layer from computer models.' },
        ],
        why: { vi: 'Phương pháp Bessemer làm ra thép nhanh, nhiều và rẻ, thúc đẩy xây dựng đường sắt, cầu, tàu thủy, máy móc và nhà cao tầng. In 3D thuộc cuộc cách mạng thứ tư.', en: 'The Bessemer process made steel quickly, plentifully and cheaply, driving the building of railways, bridges, ships, machines and tall buildings. 3D printing belongs to the fourth revolution.' },
        from: 'ir2-1',
      },
      {
        ask: { vi: 'Các công ty trong thành phố đang lắp điện thoại. Điều đó sẽ mang lại gì?', en: 'Businesses in the city are installing telephones. What will that bring?' },
        replies: [
          { vi: 'Con người và doanh nghiệp nói chuyện trực tiếp, trao đổi nhanh hơn.', en: 'People and businesses can talk directly and share news faster.' },
          { vi: 'Tin nhắn vẫn được gửi bằng các tín hiệu ngắn và dài.', en: 'Messages will still be sent as short and long signals.' },
          { vi: 'Mỗi người dân sẽ sớm mang một chiếc điện thoại trong túi.', en: 'Every citizen will soon carry a telephone in their pocket.' },
        ],
        why: { vi: 'Điện thoại giúp con người, doanh nghiệp và cơ quan liên lạc trực tiếp dễ dàng hơn, đặt nền móng cho viễn thông hiện đại. Điện thoại di động cầm tay chỉ ra đời năm 1973.', en: 'The telephone made direct contact between people, businesses and institutions far easier, laying the foundations of modern telecommunications. The handheld mobile phone only came in 1973.' },
        from: 'ir2-5',
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
        ask: { vi: 'Vì sao máy tính bây giờ lại nhỏ gọn được như vậy?', en: 'Why can computers be so small now?' },
        replies: [
          { vi: 'Nhờ bộ vi xử lý: cả bộ xử lý trên một con chip.', en: 'The microprocessor puts a whole processor on one chip.' },
          { vi: 'Nhờ mạng máy tính, các bộ phận được đặt ở nơi khác.', en: 'Networks let the computer keep its parts somewhere else.' },
          { vi: 'Thép rẻ hơn và động cơ nhỏ hơn làm vỏ máy nhẹ đi.', en: 'Cheaper steel and smaller motors made the cases lighter.' },
        ],
        why: { vi: 'Bộ vi xử lý như Intel 4004 gói chức năng của bộ xử lý trung tâm vào một linh kiện nhỏ, mở đường cho thiết bị điện tử ngày càng nhỏ.', en: 'Microprocessors such as the Intel 4004 put the functions of a central processor into one small part, opening the way to ever smaller electronics.' },
        from: 'ir3-1',
      },
      {
        ask: { vi: 'Máy tính vào văn phòng rồi. Tôi có nên lo cho công việc của mình không?', en: 'Computers have come to the office. Should I worry about my job?' },
        replies: [
          { vi: 'Công việc sẽ thay đổi: bạn cần những kỹ năng mới.', en: 'Your work will change: you will need new skills.' },
          { vi: 'Việc của bạn vẫn an toàn: máy tính chỉ giúp làm tính.', en: 'Your job is safe: computers only help with sums.' },
          { vi: 'Robot sẽ sớm thay thế mọi bàn làm việc văn phòng.', en: 'Robots will soon take over every office desk.' },
        ],
        why: { vi: 'Cuộc cách mạng thứ ba tăng độ chính xác và năng suất, nhưng cũng thay đổi công việc và kỹ năng mà người lao động cần.', en: 'The third revolution raised accuracy and productivity, but also changed the jobs and skills that workers need.' },
        from: 'ir3-overview',
      },
      {
        ask: { vi: 'Công ty vừa đặt máy tính cá nhân IBM lên bàn của mỗi người. Chúng sẽ thay đổi công việc thế nào?', en: 'The company has just put an IBM personal computer on every desk. How will they change our work?' },
        replies: [
          { vi: 'Việc viết, tính toán và lưu trữ dữ liệu dễ dàng hơn.', en: 'Writing, calculating and storing data get easier.' },
          { vi: 'Chúng chủ yếu sẽ thay thế điện thoại của công ty.', en: 'They will mainly replace the company’s telephones.' },
          { vi: 'Chúng sẽ tự viết báo cáo cho ta nhờ AI tạo sinh.', en: 'They will write our reports for us with generative AI.' },
        ],
        why: { vi: 'Máy tính cá nhân giúp việc viết, tính toán, lưu trữ dữ liệu và quản lý công việc hiệu quả hơn, và thúc đẩy ngành phần mềm. AI tạo sinh chỉ phổ biến từ năm 2022.', en: 'Personal computers made writing, calculating, storing data and managing work more efficient, and boosted the software industry. Generative AI only spread from 2022.' },
        from: 'ir3-2',
      },
      {
        ask: { vi: 'Những mạng như ARPANET đã nối máy tính của các trung tâm nghiên cứu. Rồi chúng sẽ dẫn tới đâu?', en: 'Networks like ARPANET now link the computers of research centres. Where might they lead?' },
        replies: [
          { vi: 'Tới Internet: chia sẻ dữ liệu bất kể khoảng cách.', en: 'Towards the Internet: sharing data across any distance.' },
          { vi: 'Nó sẽ mãi là mạng riêng chỉ dành cho quân đội.', en: 'It will stay a private network for the military only.' },
          { vi: 'Tới một loại điện báo nhanh hơn để gửi tin đánh máy.', en: 'Towards a faster telegraph for sending typed messages.' },
        ],
        why: { vi: 'ARPANET cho máy tính ở những nơi khác nhau trao đổi dữ liệu, và là một trong những nền móng quan trọng của Internet.', en: 'ARPANET let computers in different places exchange data, and is one of the key foundations of the Internet.' },
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
        ask: { vi: 'Robot của chúng tôi có thể đứng làm việc ngay cạnh công nhân không?', en: 'Can our robot work right beside the workers?' },
        replies: [
          { vi: 'Không: nó lặp lại một chuỗi động tác và phải làm sau hàng rào.', en: 'No: it repeats one fixed sequence and works behind a fence.' },
          { vi: 'Được: camera giúp nó nhìn thấy người và tránh họ.', en: 'Yes: its cameras let it see people and move around them.' },
          { vi: 'Được, nếu công nhân đứng ở phía bên kia dây chuyền.', en: 'Yes, if the workers stay on the far side of the line.' },
        ],
        why: { vi: 'Robot công nghiệp đầu tiên làm việc sau hàng rào và lặp lại đúng một chuỗi động tác. Robot nhìn và cảm nhận được để làm cạnh người là robot tiên tiến ngày nay.', en: 'The first industrial robot worked behind a fence, repeating one exact sequence. Robots that see and feel enough to work beside people are today’s advanced robots.' },
        from: 'ir4-5',
      },
      {
        ask: { vi: 'Sếp tôi hỏi: robot và PLC rốt cuộc quan trọng ở điểm nào?', en: 'My boss asks: what exactly makes robots and PLCs so important?' },
        replies: [
          { vi: 'Chúng là hai trụ cột của nhà máy tự động hóa.', en: 'They are the two pillars of the automated factory.' },
          { vi: 'Chúng giúp một động cơ hơi nước chạy cả xưởng.', en: 'They let one steam engine drive the whole works.' },
          { vi: 'Chúng tự học từ dữ liệu, giống như AI.', en: 'They learn from data on their own, like AI does.' },
        ],
        why: { vi: 'Điện tử và lập trình bắt đầu tự động hóa nhà máy: robot và PLC là hai trụ cột của nhà máy tự động. Chúng làm theo chương trình chứ không tự học.', en: 'Electronics and programming began to automate the factory: robots and PLCs are its two pillars. They follow programs; they do not learn by themselves.' },
        from: 'ir3-3',
      },
      {
        ask: { vi: 'Robot Unimate vừa nhận việc hàn trên dây chuyền của chúng tôi. Điều đó có ý nghĩa gì với công nhân?', en: 'A Unimate robot has just taken over welding on our line. What does it mean for my workers?' },
        replies: [
          { vi: 'Bớt việc nặng và nguy hiểm, nhưng kỹ năng của họ phải thay đổi.', en: 'Less heavy, dangerous work, but their skills must change.' },
          { vi: 'Robot sẽ làm ngay cạnh họ, cùng chia nhau từng mối hàn.', en: 'The robot will work beside them, sharing each weld.' },
          { vi: 'Việc của họ giữ nguyên; robot chỉ làm vào ban đêm.', en: 'Their jobs stay the same; the robot only works at night.' },
        ],
        why: { vi: 'Unimate làm những việc lặp lại với vật liệu nặng và giúp công nhân tránh một số điều kiện nguy hiểm; công nghệ của cuộc cách mạng thứ ba cũng thay đổi công việc và kỹ năng người lao động cần.', en: 'Unimate took on repetitive work with heavy materials and kept workers away from some dangerous conditions; the third revolution’s technology also changed the jobs and skills workers needed.' },
        from: 'ir3-3',
      },
      {
        ask: { vi: 'Chúng tôi đã thay tủ điều khiển đi dây cứng bằng PLC. Điều đó sẽ thay đổi gì?', en: 'We have replaced our hard-wired control cabinets with PLCs. What will that change?' },
        replies: [
          { vi: 'Đổi quy trình chỉ cần sửa chương trình, không phải đi dây lại.', en: 'A new process means editing a program, not rewiring.' },
          { vi: 'Máy móc sẽ bắt đầu tự học quy trình mới.', en: 'The machines will start learning new processes themselves.' },
          { vi: 'Mỗi mẫu xe mới sẽ cần một tủ điều khiển mới.', en: 'Each new car model will need a new control cabinet.' },
        ],
        why: { vi: 'PLC điều khiển máy móc bằng một chương trình có thể thay đổi, nên khi quy trình đổi, kỹ sư sửa chương trình thay vì đi dây lại.', en: 'A PLC controls machines with a program that can be changed, so when a process changes, engineers edit the program instead of rewiring.' },
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
          { vi: 'Có: AI có thể sai hoặc thiên lệch, nên hãy kiểm tra lại.', en: 'Yes: it can be wrong or biased, so check what it says.' },
          { vi: 'Hiếm khi: có đủ dữ liệu thì câu trả lời luôn được kiểm chứng.', en: 'Rarely: with enough data, its answers are always checked.' },
          { vi: 'Không: AI làm theo quy tắc viết sẵn nên không thể sai.', en: 'No: it follows rules written in advance, so it cannot err.' },
        ],
        why: { vi: 'AI hiện đại học từ dữ liệu thay vì chỉ theo quy tắc viết sẵn; nó vẫn có thể sai, thừa hưởng thiên kiến và cần con người giám sát.', en: 'Modern AI learns from data rather than only following written rules; it can still be wrong, inherit bias and needs human oversight.' },
        from: 'ir4-3',
      },
      {
        ask: { vi: 'Sau này em muốn làm trong nhà máy. Em cần chuẩn bị gì?', en: 'Later I want to work in a factory. What should I prepare?' },
        replies: [
          { vi: 'Kỹ năng làm việc cùng robot, dữ liệu và AI.', en: 'Skills to work alongside robots, data and AI.' },
          { vi: 'Sức khỏe và sức bền cho những ca dài trên dây chuyền.', en: 'Strength and stamina for long shifts on the line.' },
          { vi: 'Kỹ năng đi dây lại tủ điều khiển bằng tay.', en: 'Skill at rewiring control cabinets by hand.' },
        ],
        why: { vi: 'Cuộc cách mạng thứ tư đặt ra thách thức về việc làm và kỹ năng của người lao động; làm việc cùng robot đòi hỏi kỹ năng mới.', en: 'The fourth revolution brings challenges for jobs and workers’ skills; working with robots needs new skills.' },
        from: 'ir4-overview',
      },
      {
        ask: { vi: 'Vì sao các trung tâm dữ liệu AI lại khiến người ta lo về môi trường?', en: 'Why do AI data centres worry people about the environment?' },
        replies: [
          { vi: 'Chúng tiêu tốn rất nhiều điện năng.', en: 'They use a great deal of electricity.' },
          { vi: 'Chúng thải khói than ra không khí.', en: 'They fill the air with coal smoke.' },
          { vi: 'Sóng vô tuyến của chúng gây hại cho cây cối quanh đó.', en: 'Their radio signals harm the plants around them.' },
        ],
        why: { vi: 'AI dùng rất nhiều điện; đám mây tiết kiệm chi phí nhưng đặt ra thách thức về năng lượng.', en: 'AI uses a lot of electricity; the cloud saves costs but raises energy challenges.' },
        from: 'ir4-4',
      },
      {
        ask: { vi: 'Chỉnh sửa gen nghe thật tuyệt. Có điều gì cần thận trọng không ạ?', en: 'Gene editing sounds amazing. Is there anything to be careful about?' },
        replies: [
          { vi: 'Có: nó đặt ra câu hỏi về đạo đức và an toàn, nên cần được quản lý.', en: 'Yes: it raises ethical and safety questions, so it is regulated.' },
          { vi: 'Chỉ có chi phí: khi rẻ đi, ai cũng có thể dùng.', en: 'Only the cost: once cheap, anyone can use it.' },
          { vi: 'Chỉ với cây trồng; trên người thì đã hoàn toàn an toàn.', en: 'Only on plants; on people it is already fully safe.' },
        ],
        why: { vi: 'Chỉnh sửa gen đặt ra những câu hỏi nghiêm túc về đạo đức và an toàn, nhất là khi dùng trên con người, nên cần được quản lý cẩn thận.', en: 'Gene editing raises serious ethical and safety questions, above all when used on people, so it must be carefully regulated.' },
        from: 'ir4-6',
      },
      {
        ask: { vi: 'Ông bà tôi bảo đời sống trước khi có điện thoại thông minh rất khác. Nó đã thay đổi điều gì?', en: 'My grandparents say life before smartphones was very different. What did they change?' },
        replies: [
          { vi: 'Thông tin, mua sắm và trò chuyện theo bạn đi khắp nơi.', en: 'Information, shopping and chat now go with you everywhere.' },
          { vi: 'Gọi điện rẻ hơn, nhưng điện thoại vẫn nằm trong nhà.', en: 'Calls got cheaper, but phones still stayed at home.' },
          { vi: 'Mọi người thôi dùng máy tính và Internet.', en: 'People stopped using computers and the Internet.' },
        ],
        why: { vi: 'Điện thoại di động giải phóng chiếc điện thoại khỏi sợi dây; khi nó gặp World Wide Web trong chiếc điện thoại thông minh, thông tin, mua bán và trò chuyện theo con người đi khắp nơi.', en: 'The mobile phone freed the telephone from its wire; when it met the World Wide Web in the smartphone, information, shopping and conversation followed people everywhere.' },
        from: 'ir3-5',
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
        ask: { vi: 'Nhà máy kết nối mạng hết rồi. Có rủi ro gì tôi cần biết không?', en: 'Everything in the factory is networked now. Are there risks I should know?' },
        replies: [
          { vi: 'Có: tấn công mạng, và những dự báo có thể sai.', en: 'Yes: cyber attacks, and predictions that can be wrong.' },
          { vi: 'Chỉ có mất điện: bản thân dữ liệu không thể bị tấn công.', en: 'Only power cuts: the data itself cannot be attacked.' },
          { vi: 'Chỉ là máy móc sẽ hao mòn nhanh hơn khi nối mạng.', en: 'Only that machines wear out faster once online.' },
        ],
        why: { vi: 'Dự báo vẫn có sai số, mô hình chỉ tốt bằng dữ liệu của nó, và hệ thống kết nối phải được bảo vệ khỏi tấn công mạng.', en: 'Predictions still have errors, a model is only as good as its data, and connected systems must be protected from cyber attacks.' },
        from: 'ir4-2',
      },
      {
        ask: { vi: 'Tôi muốn đặt robot ngay cạnh công nhân để cùng đóng gói. Có được không?', en: 'I want robots right beside the workers, packing together. Is that possible?' },
        replies: [
          { vi: 'Được, với cobot, sau khi đánh giá rủi ro và có biện pháp an toàn.', en: 'Yes, with cobots, after a risk assessment and safeguards.' },
          { vi: 'Được, robot công nghiệp nào cũng làm được nếu chạy chậm.', en: 'Yes, any industrial robot can, if it moves slowly.' },
          { vi: 'Không: robot nào cũng phải làm sau hàng rào.', en: 'No: every robot must still work behind a fence.' },
        ],
        why: { vi: 'Cobot được thiết kế để làm việc gần con người, nhưng vẫn cần đánh giá rủi ro và biện pháp bảo vệ phù hợp.', en: 'Cobots are designed to work near people, but still need a risk assessment and proper safeguards.' },
        from: 'ir4-5',
      },
      {
        ask: { vi: 'Chúng tôi đã lắp cảm biến dự báo hỏng hóc. Tôi có thể tin hoàn toàn vào chúng không?', en: 'We have fitted sensors that predict breakdowns. Can I trust them completely?' },
        replies: [
          { vi: 'Không: dự báo vẫn có thể sai, nên con người vẫn phải kiểm tra.', en: 'No: predictions can be wrong, so people still check.' },
          { vi: 'Có, sau khi chúng đã thu thập dữ liệu được một năm.', en: 'Yes, once they have collected a year of data.' },
          { vi: 'Có, miễn là mỗi máy đều có cảm biến riêng.', en: 'Yes, as long as each machine has its own sensor.' },
        ],
        why: { vi: 'Bảo trì dự đoán cảnh báo trước khi máy hỏng, nhưng dự báo vẫn có thể sai.', en: 'Predictive maintenance warns before a machine breaks down, but predictions can still be wrong.' },
        from: 'ir4-2',
      },
      {
        ask: { vi: 'Chúng tôi đang chuyển toàn bộ dữ liệu lên đám mây. Tôi cần cân nhắc những gì?', en: 'We are moving all our data to the cloud. What should I weigh up?' },
        replies: [
          { vi: 'Tiết kiệm chi phí ban đầu, nhưng có rủi ro về năng lượng, bảo mật và mạng.', en: 'Lower upfront cost, but energy, security and network risks.' },
          { vi: 'Chi phí ban đầu cao hơn, vì phải tự mua máy chủ.', en: 'Higher upfront cost, as we must buy the servers.' },
          { vi: 'Không rủi ro: nhà cung cấp lo toàn bộ bảo mật cho ta.', en: 'No risks: the provider handles all security for us.' },
        ],
        why: { vi: 'Đám mây giúp doanh nghiệp không phải tự mua và vận hành máy chủ, tiết kiệm chi phí ban đầu, nhưng đặt ra thách thức về năng lượng, bảo mật dữ liệu và sự phụ thuộc vào kết nối mạng.', en: 'The cloud spares businesses from buying and running their own servers and saves upfront costs, but raises challenges of energy, data security and dependence on the network.' },
        from: 'ir4-4',
      },
      {
        ask: { vi: 'Chúng tôi đang thử in 3D linh kiện thay thế. Liệu nó có thay được mọi máy móc của chúng tôi?', en: 'We are trying 3D printing for spare parts. Will it replace all our machines?' },
        replies: [
          { vi: 'Chưa: tốc độ, vật liệu và chi phí vẫn giới hạn nó.', en: 'Not yet: speed, materials and cost still limit it.' },
          { vi: 'Có: nó đã hơn cách làm truyền thống với mọi chi tiết.', en: 'Yes: it now beats traditional methods for every part.' },
          { vi: 'Không: nó chỉ làm được mẫu thử, không làm chi tiết thật.', en: 'No: it can only make prototypes, never real parts.' },
        ],
        why: { vi: 'In 3D làm được hình dạng phức tạp, mẫu thử nhanh và linh kiện theo yêu cầu, nhưng tốc độ, vật liệu và chi phí vẫn quyết định khi nào nó hơn cách làm truyền thống.', en: '3D printing makes complex shapes, quick prototypes and parts to order, but speed, materials and cost still decide when it beats traditional methods.' },
        from: 'ir4-1',
      },
    ],
  },
]
