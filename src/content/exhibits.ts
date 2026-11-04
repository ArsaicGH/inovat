import type { Language } from './language'
import { credits } from './credits'
import { TEAM } from './team'
import { AUDIO_ENABLED } from '../features'

// Exhibit texts, in both languages, from CONTENT.md (the group's content document, with
// English versions and sources). Each invention has a short text (on its board in the room)
// and a long text (shown when the board is enlarged).

export interface Source {
  name: string // the publisher, shown on the board in the room
  title: string // the page or book, shown with a link on the enlarged board
  url: string
}

export interface ExhibitText {
  title: string
  facts: string[] // "Nhân vật: James Watt", "Năm: 1769": small lines under the title
  summary: string // on the board in the room
  body: string // on the enlarged board
  sources: Source[]
  placeholder: boolean // true while the text still has to be written or checked
}

type Both = Record<Language, string>

// Shown only if an exhibit id has no text at all (a mistake in the code, never in the game).
const NOTE: Both = { vi: '', en: '' }

// The labels of the small lines under each title.
const LABEL = {
  person: { vi: 'Nhân vật', en: 'Person' },
  people: { vi: 'Nhân vật', en: 'People' },
  pioneer: { vi: 'Nhân vật tiêu biểu', en: 'Pioneer' },
  company: { vi: 'Công ty', en: 'Company' },
  organisation: { vi: 'Tổ chức', en: 'Organisation' },
  developedBy: { vi: 'Phát triển bởi', en: 'Developed by' },
  year: { vi: 'Năm', en: 'Year' },
  time: { vi: 'Thời gian', en: 'Time' },
  period: { vi: 'Thời kỳ', en: 'Period' },
  field: { vi: 'Lĩnh vực', en: 'Field' },
} satisfies Record<string, Both>

interface Entry {
  title: Both
  facts: [keyof typeof LABEL, Both][]
  short?: Both // the board in the room (left out: the long text, as much as fits)
  long: Both // the enlarged board
  sources: Source[]
  placeholder?: boolean
}

// Sources used by more than one text.
const BRITANNICA_IR: Source = {
  name: 'Britannica',
  title: 'Industrial Revolution',
  url: 'https://www.britannica.com/event/Industrial-Revolution',
}
const BRITANNICA_TECH: Source = {
  name: 'Britannica',
  title: 'The Industrial Revolution (1750-1900)',
  url: 'https://www.britannica.com/technology/history-of-technology/The-Industrial-Revolution-1750-1900',
}
const WEF: Source = {
  name: 'World Economic Forum (Klaus Schwab)',
  title: 'The Fourth Industrial Revolution: what it means and how to respond (2016)',
  url: 'https://www.weforum.org/agenda/2016/01/the-fourth-industrial-revolution-what-it-means-and-how-to-respond/',
}

// The same words in both languages (names, years).
const same = (text: string): Both => ({ vi: text, en: text })

const ENTRIES: Record<string, Entry> = {
  // ---------- Introduction hall ----------
  'hall-intro': {
    title: { vi: 'Lời chào mừng', en: 'Welcome' },
    facts: [],
    // (The board in the room shows the first two sentences; the enlarged board the whole text.)
    short: {
      vi: 'Chào mừng quý khách đến với Bảo tàng số về bốn cuộc Cách mạng Công nghiệp nơi lưu giữ và giới thiệu những dấu mốc quan trọng trong lịch sử phát triển công nghiệp của nhân loại. Thông qua bốn không gian trưng bày, quý khách sẽ được khám phá những phát minh tiêu biểu, từ động cơ hơi nước và máy móc cơ khí, đến điện năng, máy tính, rô-bốt và trí tuệ nhân tạo.',
      en: 'Welcome to the digital museum of the four Industrial Revolutions, which preserves and presents the key milestones in the history of human industry. Across four exhibition spaces, you will discover landmark inventions, from the steam engine and mechanical machinery to electricity, computers, robots and artificial intelligence.',
    },
    long: {
      vi: 'Chào mừng quý khách đến với Bảo tàng số về bốn cuộc Cách mạng Công nghiệp nơi lưu giữ và giới thiệu những dấu mốc quan trọng trong lịch sử phát triển công nghiệp của nhân loại. Thông qua bốn không gian trưng bày, quý khách sẽ được khám phá những phát minh tiêu biểu, từ động cơ hơi nước và máy móc cơ khí, đến điện năng, máy tính, rô-bốt và trí tuệ nhân tạo. Mỗi hiện vật không chỉ phản ánh một bước tiến về khoa học và công nghệ, mà còn cho thấy những thay đổi sâu sắc trong cách con người lao động, sản xuất và sinh sống. Bảo tàng mong muốn mang đến cho quý khách một góc nhìn toàn diện về hành trình phát triển của công nghiệp, đồng thời giúp mỗi người hiểu rõ hơn những cơ hội, thách thức và trách nhiệm mà các tiến bộ công nghệ đặt ra đối với xã hội. Kính mời quý khách bắt đầu hành trình khám phá bốn cuộc cách mạng công nghiệp hành trình về sự sáng tạo, đổi mới và những thay đổi đã định hình thế giới ngày nay.',
      en: 'Welcome to the digital museum of the four Industrial Revolutions, which preserves and presents the key milestones in the history of human industry. Across four exhibition spaces, you will discover landmark inventions, from the steam engine and mechanical machinery to electricity, computers, robots and artificial intelligence. Each exhibit reflects not only a step forward in science and technology, but also deep changes in how people work, produce and live. The museum hopes to give you a complete view of the journey of industry, and to help everyone better understand the opportunities, challenges and responsibilities that technological progress brings to society. Please begin your journey through the four industrial revolutions: a journey of creativity, innovation and the changes that have shaped the world we live in today.',
    },
    sources: [],
  },
  // Written by Claude from the four room backgrounds below (not in the group's document).
  'hall-overview': {
    title: { vi: 'Lộ trình tham quan', en: 'Your Route' },
    facts: [],
    short: {
      vi: 'Bốn phòng trưng bày, mỗi phòng dành cho một cuộc Cách mạng Công nghiệp, nằm quanh Sảnh trung tâm. Quý khách đi lần lượt từ CMCN 1 đến CMCN 4, theo mũi tên trên bản đồ, rồi đến Phòng trò chơi.',
      en: 'Four exhibition rooms, one for each Industrial Revolution, lie around the Central Hall. Visit them in order from IR 1 to IR 4, following the arrow on the map, then go on to the Game Room.',
    },
    long: {
      vi: 'Bốn phòng trưng bày, mỗi phòng dành cho một cuộc Cách mạng Công nghiệp, nằm quanh Sảnh trung tâm. CMCN 1 (khoảng giữa thế kỷ XVIII - giữa thế kỷ XIX): hơi nước và máy móc cơ khí, bắt đầu tại Anh. CMCN 2 (cuối thế kỷ XIX - đầu thế kỷ XX): điện năng và sản xuất hàng loạt. CMCN 3 (nửa sau thế kỷ XX): điện tử, máy tính và tự động hóa. CMCN 4 (đầu thế kỷ XXI đến nay): trí tuệ nhân tạo, Internet vạn vật và dữ liệu. Mỗi phòng có một bảng tổng quan và từ bốn đến sáu phát minh tiêu biểu. Mỗi bảng chữ đều có thể phóng to để đọc toàn văn. Sau khi tham quan cả bốn phòng, Phòng trò chơi sẽ mở cửa.',
      en: 'Four exhibition rooms, one for each Industrial Revolution, lie around the Central Hall. IR 1 (about the mid-18th to the mid-19th century): steam and mechanical machinery, beginning in Britain. IR 2 (the late 19th to the early 20th century): electricity and mass production. IR 3 (the second half of the 20th century): electronics, computers and automation. IR 4 (the early 21st century to today): artificial intelligence, the Internet of Things and data. Each room has an overview board and four to six landmark inventions. Every board can be enlarged to read its full text. Once you have visited all four rooms, the Game Room opens.',
    },
    sources: [BRITANNICA_IR, WEF],
  },
  // ---------- CMCN 1 ----------
  'ir1-overview': {
    title: { vi: 'Tổng quan CMCN 1', en: 'IR 1 Overview' },
    facts: [['period', { vi: 'Khoảng giữa thế kỷ XVIII - giữa thế kỷ XIX', en: 'About the mid-18th to the mid-19th century' }]],
    long: {
      vi: 'Cuộc Cách mạng Công nghiệp lần thứ nhất bắt đầu tại Anh vào nửa sau thế kỷ XVIII. Sản xuất trước đó chủ yếu dựa vào sức người và công cụ thủ công. Sự phát triển của máy móc và năng lượng hơi nước đã thúc đẩy sự ra đời của nhà máy, tăng năng suất và cải thiện giao thông. Tuy nhiên, quá trình công nghiệp hóa cũng dẫn đến điều kiện lao động khó khăn, ô nhiễm và sự phát triển nhanh chóng của đô thị.',
      en: 'The First Industrial Revolution began in Britain in the second half of the 18th century. Until then, production relied mainly on human strength and hand tools. Machinery and steam power led to the rise of factories, raised productivity and improved transport. But industrialisation also brought harsh working conditions, pollution and the rapid growth of cities.',
    },
    sources: [
      BRITANNICA_IR,
      {
        name: 'US National Park Service',
        title: 'Lowell Handbook: The Industrial Revolution in England',
        url: 'https://www.nps.gov/articles/lowell-handbook-industrial-revolution-in-england.htm',
      },
    ],
  },
  'ir1-1': {
    title: { vi: 'Động cơ hơi nước cải tiến', en: 'Watt’s Improved Steam Engine' },
    facts: [
      ['person', same('James Watt')],
      ['year', { vi: '1769 (bằng sáng chế)', en: '1769 (patent)' }],
      ['field', { vi: 'Cơ khí, năng lượng', en: 'Mechanical engineering, energy' }],
    ],
    short: {
      vi: 'James Watt cải tiến động cơ hơi nước, giúp giảm tiêu hao nhiên liệu và tăng hiệu quả hoạt động. Động cơ này thúc đẩy cơ giới hóa nhà máy và trở thành nguồn năng lượng quan trọng của thời kỳ công nghiệp hóa.',
      en: 'James Watt improved the steam engine, cutting its fuel use and making it work more efficiently. His engine drove the mechanisation of factories and became a key source of power in the age of industrialisation.',
    },
    long: {
      vi: 'Máy hơi nước cải tiến của James Watt là một bước tiến quan trọng trong quá trình cơ giới hóa sản xuất. Điểm cải tiến nổi bật là bộ ngưng tụ riêng, giúp giảm lượng nhiệt bị lãng phí so với thiết kế trước đó. Nhờ nâng cao hiệu suất, loại máy này được ứng dụng rộng rãi trong các nhà máy, ngành khai mỏ và nhiều hoạt động công nghiệp. Thành tựu này góp phần chuyển sản xuất từ phụ thuộc chủ yếu vào sức người, sức vật và năng lượng tự nhiên sang sử dụng máy móc.',
      en: 'James Watt’s improved steam engine was an important step in the mechanisation of production. Its key improvement was a separate condenser, which wasted far less heat than earlier designs. Being more efficient, the engine was widely used in factories, in mining and in many other industries. It helped move production away from relying mainly on human and animal strength and natural power, towards machines.',
    },
    sources: [
      {
        name: 'Science Museum',
        title: 'James Watt and the separate condenser',
        url: 'https://blog.sciencemuseum.org.uk/james-watt-and-the-separate-condenser/',
      },
      {
        name: 'Science Museum Group',
        title: 'James Watt',
        url: 'https://collection.sciencemuseumgroup.org.uk/people/ap24508/watt-james',
      },
    ],
  },
  'ir1-2': {
    title: { vi: 'Máy kéo sợi Water Frame', en: 'The Water Frame' },
    facts: [
      ['person', same('Richard Arkwright')],
      ['year', { vi: '1769 (năm được cấp bằng sáng chế)', en: '1769 (patent)' }],
      ['field', { vi: 'Công nghiệp dệt', en: 'Textile industry' }],
    ],
    short: {
      vi: 'Water Frame sử dụng năng lượng nước để kéo sợi bền và sản xuất với quy mô lớn. Máy góp phần hình thành các nhà máy dệt tập trung, đánh dấu sự thay đổi quan trọng trong tổ chức sản xuất.',
      en: 'The Water Frame used water power to spin strong thread on a large scale. It helped give rise to centralised textile mills, a major change in how production was organised.',
    },
    long: {
      vi: 'Water Frame sử dụng năng lượng từ dòng nước để vận hành các bộ phận kéo sợi. Máy có khả năng tạo ra sợi bền và phù hợp với việc sản xuất quy mô lớn. Vì cần nguồn năng lượng và không gian để lắp đặt máy móc, nhiều cơ sở sản xuất dần tập trung thành nhà máy. Sự phát triển này góp phần hình thành mô hình sản xuất công nghiệp tập trung, thay thế dần hoạt động thủ công tại các hộ gia đình.',
      en: 'The Water Frame used the power of flowing water to drive its spinning parts. It made strong thread and suited large-scale production. Because it needed a power source and space for the machines, workshops gradually came together in factories. This helped create centralised industrial production, which slowly replaced hand work in family homes.',
    },
    sources: [
      { name: 'Grace’s Guide', title: 'Richard Arkwright', url: 'https://gracesguide.co.uk/Richard_Arkwright' },
      {
        name: 'Google Arts & Culture',
        title: 'Richard Arkwright’s roller-spinning patent',
        url: 'https://artsandculture.google.com/asset/richard-arkwright-s-roller-spinning-patent-richard-arkwright/JQEM1h62uI09kQ',
      },
      { name: 'Wikipedia', title: 'Cromford Mill', url: 'https://en.wikipedia.org/wiki/Cromford_Mill' },
    ],
  },
  'ir1-3': {
    title: { vi: 'Luyện sắt bằng lò khuấy (puddling)', en: 'Puddled Iron' },
    facts: [
      ['person', same('Henry Cort')],
      ['year', { vi: '1784 (bằng sáng chế phương pháp khuấy)', en: '1784 (patent on the puddling process)' }],
      ['field', { vi: 'Luyện kim', en: 'Metallurgy' }],
    ],
    short: {
      vi: 'Trong lò khuấy đốt bằng than đá, gang nóng chảy được khuấy liên tục để đốt bớt các-bon, tạo ra sắt rèn dẻo và bền với số lượng lớn. Sắt nhiều và rẻ hơn trở thành vật liệu cho máy móc, cầu và đường ray.',
      en: 'In a coal-fired puddling furnace, molten pig iron was stirred to burn off carbon, producing tough wrought iron in large quantities. Cheaper, more plentiful iron became the material of machines, bridges and rails.',
    },
    long: {
      vi: 'Trước đây, việc luyện sắt rèn phụ thuộc vào than củi nên sản lượng bị hạn chế. Henry Cort được cấp bằng sáng chế về cán sắt bằng trục có rãnh (1783) và phương pháp khuấy (1784). Trong lò khuấy dùng than đá, người thợ khuấy gang nóng chảy để không khí đốt bớt các-bon, tạo ra sắt rèn dẻo và bền, rồi cán thành thanh nhanh hơn nhiều so với rèn bằng búa. Nhờ đó, sắt trở thành vật liệu chủ lực để chế tạo máy móc, cầu, khung nhà xưởng và đường ray trong Cách mạng Công nghiệp lần thứ nhất.',
      en: 'Making wrought iron had depended on charcoal, which limited how much could be produced. Henry Cort patented rolling iron between grooved rollers (1783) and the puddling process (1784). In a coal-fired puddling furnace, workers stirred molten pig iron so that air burned off the carbon, giving tough, workable wrought iron that was then rolled into bars far faster than hammering allowed. Iron became the main material for machines, bridges, factory frames and rails in the First Industrial Revolution.',
    },
    sources: [
      { name: 'Britannica', title: 'Henry Cort', url: 'https://www.britannica.com/biography/Henry-Cort' },
      { name: 'Britannica', title: 'Puddling process', url: 'https://www.britannica.com/technology/puddling-process' },
      BRITANNICA_TECH,
    ],
  },
  'ir1-4': {
    title: { vi: 'Đầu máy xe lửa Rocket', en: 'The Rocket Locomotive' },
    facts: [
      ['person', { vi: 'Robert Stephenson và cộng sự', en: 'Robert Stephenson and colleagues' }],
      ['year', same('1829')],
      ['field', { vi: 'Giao thông vận tải', en: 'Transport' }],
    ],
    short: {
      vi: 'Rocket là đầu máy hơi nước nổi tiếng tại cuộc thi Rainhill Trials năm 1829. Nó thể hiện những cải tiến về hiệu suất đầu máy, góp phần thúc đẩy đường sắt, vận chuyển hàng hóa và kết nối các trung tâm công nghiệp.',
      en: 'Rocket is the steam locomotive made famous by the Rainhill Trials of 1829. It showed how much locomotives had improved, and helped drive the growth of railways, freight transport and links between industrial centres.',
    },
    long: {
      vi: 'Rocket là đầu máy hơi nước nổi tiếng được chế tạo để tham gia cuộc thi Rainhill Trials tại Anh năm 1829. Thiết kế của đầu máy đã thể hiện những cải tiến quan trọng về hiệu suất và khả năng vận hành. Sự phát triển của đầu máy hơi nước góp phần mở rộng mạng lưới đường sắt, giúp con người vận chuyển hàng hóa và đi lại nhanh hơn. Đường sắt cũng kết nối các trung tâm sản xuất với thị trường, thúc đẩy thương mại và công nghiệp.',
      en: 'Rocket is a famous steam locomotive built for the Rainhill Trials in England in 1829. Its design showed important gains in efficiency and performance. Better steam locomotives helped railway networks spread, so goods and people could travel faster. Railways also linked centres of production with their markets, boosting trade and industry.',
    },
    sources: [
      {
        name: 'Science Museum Group',
        title: 'Stephenson’s Rocket',
        url: 'https://collection.sciencemuseumgroup.org.uk/objects/co26704',
      },
    ],
  },

  'ir1-5': {
    title: { vi: 'Điện báo và mã Morse', en: 'The Electric Telegraph and Morse Code' },
    facts: [
      ['people', { vi: 'William Cooke và Charles Wheatstone; Samuel Morse và Alfred Vail', en: 'William Cooke and Charles Wheatstone; Samuel Morse and Alfred Vail' }],
      ['year', { vi: '1837 (bằng sáng chế của Cooke và Wheatstone); 1844 (bức điện Morse đầu tiên, Washington - Baltimore)', en: '1837 (Cooke and Wheatstone’s patent); 1844 (Morse’s first message, Washington to Baltimore)' }],
      ['field', { vi: 'Thông tin liên lạc', en: 'Communication' }],
    ],
    short: {
      vi: 'Điện báo gửi tin nhắn bằng dòng điện chạy qua dây dẫn, gần như tức thì qua những khoảng cách rất xa. Mã Morse biến mỗi chữ cái thành một chuỗi tín hiệu ngắn và dài (chấm và gạch). Lần đầu tiên, tin tức đi nhanh hơn cả con tàu nhanh nhất.',
      en: 'The telegraph sent messages as electric current along a wire, almost instantly, over great distances. Morse code turned each letter into a pattern of short and long signals (dots and dashes). For the first time, news travelled faster than the fastest train.',
    },
    long: {
      vi: 'Điện báo gửi tin bằng dòng điện chạy qua dây dẫn, gần như tức thì. Máy điện báo kim của Cooke và Wheatstone (1837) được dùng dọc đường sắt để điều phối tàu an toàn; máy điện báo một dây của Samuel Morse và Alfred Vail mã hóa chữ cái thành tín hiệu ngắn và dài, tức mã Morse, và năm 1844 truyền bức điện đầu tiên của Morse từ Washington tới Baltimore. Lần đầu tiên, tin tức đi nhanh hơn cả đoàn tàu nhanh nhất, phục vụ đường sắt, báo chí và thương mại.',
      en: 'The electric telegraph sent messages as electric current along a wire, almost instantly. Cooke and Wheatstone’s needle telegraph (1837) was used along railways to run trains safely; Samuel Morse and Alfred Vail’s single-wire telegraph turned letters into short and long signals, Morse code, and in 1844 carried Morse’s first message from Washington to Baltimore. For the first time news outran the fastest train, serving railways, newspapers and trade.',
    },
    sources: [
      { name: 'Britannica', title: 'telegraph', url: 'https://www.britannica.com/technology/telegraph' },
      { name: 'Library of Congress', title: 'Invention of the Telegraph (Samuel F. B. Morse Papers)', url: 'https://www.loc.gov/collections/samuel-morse-papers/articles-and-essays/collection-highlights/invention-of-the-telegraph/' },
      { name: 'US Senate', title: 'Morse’s Telegraph in the Capitol', url: 'https://www.senate.gov/artandhistory/senate-stories/morses-telegraph-in-the-capitol.htm' },
      { name: 'Wikipedia', title: 'Cooke and Wheatstone telegraph', url: 'https://en.wikipedia.org/wiki/Cooke_and_Wheatstone_telegraph' },
    ],
  },
  // ---------- CMCN 2 ----------
  'ir2-overview': {
    title: { vi: 'Tổng quan CMCN 2', en: 'IR 2 Overview' },
    facts: [['period', { vi: 'Cuối thế kỷ XIX - đầu thế kỷ XX', en: 'The late 19th to the early 20th century' }]],
    long: {
      vi: 'Cuộc Cách mạng Công nghiệp lần thứ hai phát triển mạnh vào cuối thế kỷ XIX và đầu thế kỷ XX. Điện năng, kỹ thuật cơ khí và các tiến bộ khoa học giúp nhà máy sản xuất với quy mô lớn hơn. Động cơ điện, dây chuyền lắp ráp và điện thoại làm thay đổi sản xuất, giao thông thông tin và đời sống. Tuy nhiên, sản xuất hàng loạt cũng khiến nhiều công việc trở nên lặp lại và đòi hỏi tổ chức lao động chặt chẽ.',
      en: 'The Second Industrial Revolution took off in the late 19th and early 20th centuries. Electricity, mechanical engineering and scientific progress let factories produce on a larger scale. The electric motor, the assembly line and the telephone changed production, communication and daily life. But mass production also made much work repetitive and demanded tightly organised labour.',
    },
    sources: [BRITANNICA_IR, WEF],
  },
  'ir2-1': {
    title: { vi: 'Luyện thép Bessemer', en: 'The Bessemer Process' },
    facts: [
      ['person', same('Henry Bessemer')],
      ['year', { vi: '1856 (bằng sáng chế)', en: '1856 (patent)' }],
      ['field', { vi: 'Luyện kim', en: 'Metallurgy' }],
    ],
    short: {
      vi: 'Thổi không khí qua gang nóng chảy trong lò chuyển giúp đốt cháy tạp chất chỉ trong vài phút, tạo ra thép với số lượng lớn và giá rẻ. Thép trở thành vật liệu của đường ray, cầu, tàu thủy và nhà cao tầng.',
      en: 'Blowing air through molten pig iron in a converter burned off the impurities in minutes, making steel cheaply and in large amounts. Steel became the material of rails, bridges, ships and tall buildings.',
    },
    long: {
      vi: 'Trước phương pháp Bessemer, thép được sản xuất chậm, với số lượng nhỏ và giá cao. Năm 1856, Henry Bessemer được cấp bằng sáng chế cho cách thổi luồng không khí qua gang nóng chảy trong một lò chuyển hình quả lê: ô-xy trong không khí đốt cháy các-bon và các tạp chất khác, đồng thời tỏa nhiệt giữ cho kim loại nóng chảy. Nhờ đó, thép có thể được sản xuất nhanh, nhiều và rẻ hơn rất nhiều. Thép giá rẻ đã thúc đẩy xây dựng đường sắt, cầu, tàu thủy, máy móc và các tòa nhà cao tầng.',
      en: 'Before the Bessemer process, steel was made slowly, in small amounts and at high cost. In 1856 Henry Bessemer patented a way of blowing air through molten pig iron in a pear-shaped converter: the oxygen burned off the carbon and other impurities, and the heat it released kept the metal molten. Steel could now be made quickly, in large amounts and far more cheaply. Cheap steel drove the building of railways, bridges, ships, machines and tall buildings.',
    },
    sources: [
      { name: 'Britannica', title: 'Bessemer process', url: 'https://www.britannica.com/technology/Bessemer-process' },
      { name: 'Britannica', title: 'Sir Henry Bessemer', url: 'https://www.britannica.com/biography/Henry-Bessemer' },
    ],
  },
  'ir2-2': {
    title: { vi: 'Động cơ đốt trong và ô tô', en: 'The Internal Combustion Engine and the Car' },
    facts: [
      ['people', same('Nikolaus Otto, Karl Benz')],
      [
        'year',
        {
          vi: '1876 (động cơ bốn kỳ của Otto); 1886 (xe Benz Patent-Motorwagen được cấp bằng sáng chế)',
          en: '1876 (Otto’s four-stroke engine); 1886 (patent for Benz’s Motorwagen)',
        },
      ],
      ['field', { vi: 'Động lực và giao thông', en: 'Engines and transport' }],
    ],
    short: {
      vi: 'Động cơ đốt trong đốt nhiên liệu ngay trong xi-lanh, nên nhỏ và nhẹ hơn máy hơi nước. Động cơ bốn kỳ của Otto và chiếc xe ba bánh của Benz mở ra thời đại ô tô.',
      en: 'An internal combustion engine burns its fuel inside the cylinder, so it is smaller and lighter than a steam engine. Otto’s four-stroke engine and Benz’s three-wheeled car opened the age of the automobile.',
    },
    long: {
      vi: 'Máy hơi nước cần lò đốt và nồi hơi cồng kềnh, còn động cơ đốt trong đốt nhiên liệu ngay bên trong xi-lanh. Năm 1876, Nikolaus Otto chế tạo động cơ bốn kỳ (nạp, nén, nổ, xả), nguyên lý vẫn được dùng trong nhiều động cơ ngày nay. Năm 1886, Karl Benz được cấp bằng sáng chế cho chiếc xe ba bánh chạy bằng động cơ xăng, thường được xem là ô tô thực dụng đầu tiên (mô hình trên bệ). Động cơ nhỏ gọn đã đưa động lực đến ô tô, xe tải, máy kéo, tàu thủy và sau này là máy bay.',
      en: 'A steam engine needs a bulky firebox and boiler; an internal combustion engine burns its fuel inside the cylinder. In 1876 Nikolaus Otto built a four-stroke engine (intake, compression, power, exhaust), a principle still used in many engines today. In 1886 Karl Benz patented a three-wheeled car driven by a petrol engine, often regarded as the first practical automobile (the model on the plinth). Compact engines brought power to cars, lorries, tractors, ships and later aircraft.',
    },
    sources: [
      { name: 'Britannica', title: 'Nikolaus August Otto', url: 'https://www.britannica.com/biography/Nikolaus-August-Otto' },
      { name: 'Britannica', title: 'Karl Benz', url: 'https://www.britannica.com/biography/Karl-Benz' },
    ],
  },
  'ir2-3': {
    title: { vi: 'Điện năng: đèn điện và động cơ điện', en: 'Electric Power: Light and Motors' },
    facts: [
      ['people', { vi: 'Thomas Edison và cộng sự (đèn điện); Nikola Tesla (động cơ điện xoay chiều)', en: 'Thomas Edison and his team (electric light); Nikola Tesla (AC motor)' }],
      ['year', { vi: '1879 (đèn sợi đốt); 1888 (động cơ cảm ứng xoay chiều)', en: '1879 (incandescent lamp); 1888 (AC induction motor)' }],
      ['field', { vi: 'Điện', en: 'Electricity' }],
    ],
    short: {
      vi: 'Đèn điện sợi đốt thắp sáng nhà ở, đường phố và nhà máy; động cơ điện xoay chiều biến điện năng thành chuyển động cho máy móc. Cùng nhau, chúng đưa điện vào mọi mặt của sản xuất và đời sống.',
      en: 'The incandescent lamp lit homes, streets and factories; the AC motor turned electricity into motion for machines. Together they brought electricity into every part of work and daily life.',
    },
    long: {
      vi: 'Các thử nghiệm của Thomas Edison và cộng sự (đơn sáng chế năm 1879) góp phần tạo ra đèn sợi đốt có tính ứng dụng thực tế, giúp con người làm việc và sinh hoạt thuận tiện sau khi trời tối, đồng thời thúc đẩy xây dựng mạng lưới cung cấp điện. Năm 1888, Nikola Tesla được cấp bằng sáng chế cho động cơ cảm ứng xoay chiều, biến điện năng thành chuyển động cơ học. Thay vì phụ thuộc vào một máy hơi nước duy nhất, nhà máy có thể đặt động cơ điện ở bất cứ đâu cần đến. Ánh sáng và động lực từ điện đã thay đổi cách tổ chức nhà máy và đời sống đô thị.',
      en: 'The experiments of Thomas Edison and his team (patent filed in 1879) helped produce a practical incandescent lamp, so people could work and live more easily after dark, and drove the building of power supply networks. In 1888 Nikola Tesla was granted patents for the AC induction motor, which turns electrical energy into mechanical motion. Instead of depending on a single steam engine, a factory could place electric motors wherever they were needed. Electric light and power changed how factories were organised and how cities lived.',
    },
    sources: [
      {
        name: 'US National Archives (DocsTeach)',
        title: 'Patent application for the incandescent light bulb',
        url: 'https://www.docsteach.org/documents/document/patent-application-incandescent-light-bulb',
      },
      {
        name: 'Smithsonian',
        title: 'Edison’s “New Year’s Eve” lamp',
        url: 'https://www.si.edu/object/edison-new-years-eve-lamp%3Anmah_704361',
      },
      {
        name: 'Smithsonian',
        title: 'Lighting a Revolution',
        url: 'https://americanhistory.si.edu/lighting/history/patents/ed_inc.htm',
      },
      { name: 'ETHW', title: 'Edison’s Incandescent Lamp', url: 'https://ethw.org/Edison%27s_Incandescent_Lamp' },
      {
        name: 'IEEE Spectrum',
        title: 'May 1888: Tesla files his patents for electric motor',
        url: 'https://spectrum.ieee.org/may-1888-tesla-files-his-patents-for-electric-motor',
      },
      {
        name: 'Google Patents',
        title: 'US 381,968 “Electro-Magnetic Motor” (1888)',
        url: 'https://patents.google.com/patent/US381968A/en',
      },
    ],
  },
  'ir2-4': {
    title: { vi: 'Dây chuyền lắp ráp', en: 'The Assembly Line' },
    facts: [
      ['company', same('Ford Motor Company')],
      ['year', { vi: 'Khoảng 1913', en: 'About 1913' }],
      ['field', { vi: 'Sản xuất công nghiệp', en: 'Industrial production' }],
    ],
    short: {
      vi: 'Dây chuyền lắp ráp chia quá trình sản xuất thành các công đoạn chuyên biệt. Việc áp dụng phương pháp này vào sản xuất ô tô Model T giúp tăng sản lượng, giảm thời gian lắp ráp và trở thành hình mẫu cho sản xuất hàng loạt.',
      en: 'The assembly line splits production into specialised steps. Using it to build the Model T raised output, cut assembly time and made it the model for mass production.',
    },
    long: {
      vi: 'Dây chuyền lắp ráp giúp chia quá trình chế tạo sản phẩm thành nhiều công đoạn nhỏ. Mỗi công nhân hoặc nhóm công nhân phụ trách một nhiệm vụ cụ thể, trong khi sản phẩm di chuyển qua các vị trí làm việc. Ford áp dụng dây chuyền chuyển động vào sản xuất ô tô Model T, góp phần tăng sản lượng và giảm thời gian lắp ráp. Phương thức này trở thành một biểu tượng của sản xuất hàng loạt, dù cũng làm cho một số công việc trở nên đơn điệu và lặp lại.',
      en: 'The assembly line splits the making of a product into many small steps. Each worker or team does one specific task while the product moves past their stations. Ford used a moving line to build the Model T, raising output and cutting assembly time. The method became a symbol of mass production, even though it also made some jobs monotonous and repetitive.',
    },
    sources: [
      {
        name: 'HISTORY.com',
        title: 'Ford’s assembly line starts rolling',
        url: 'https://www.history.com/this-day-in-history/october-7/moving-assembly-line-at-ford',
      },
      {
        name: 'Assembly Magazine',
        title: 'The Moving Assembly Line Turns 100',
        url: 'https://www.assemblymag.com/articles/91581-the-moving-assembly-line-turns-100',
      },
    ],
  },
  'ir2-5': {
    title: { vi: 'Điện thoại', en: 'The Telephone' },
    facts: [
      ['person', same('Alexander Graham Bell')],
      ['year', { vi: '1876 (năm Bell được cấp bằng sáng chế tại Hoa Kỳ)', en: '1876 (the year Bell received his US patent)' }],
      ['field', { vi: 'Viễn thông', en: 'Telecommunications' }],
    ],
    short: {
      vi: 'Điện thoại cho phép truyền giọng nói qua khoảng cách xa, giúp cá nhân và doanh nghiệp trao đổi thông tin nhanh hơn. Sự phát triển của mạng lưới điện thoại đặt nền móng cho các hệ thống liên lạc hiện đại.',
      en: 'The telephone carried the human voice over long distances, so people and businesses could share information faster. The growth of telephone networks laid the foundations of modern communication systems.',
    },
    long: {
      vi: 'Điện thoại tạo ra bước tiến lớn trong việc truyền giọng nói qua khoảng cách xa. Thành tựu gắn với Alexander Graham Bell đã góp phần mở rộng khả năng liên lạc trực tiếp giữa con người, doanh nghiệp và các cơ quan. Khi mạng lưới điện thoại phát triển, việc trao đổi thông tin phục vụ kinh doanh và quản lý trở nên thuận tiện hơn. Điện thoại đặt nền móng cho quá trình phát triển lâu dài của các công nghệ truyền thông hiện đại.',
      en: 'The telephone was a great step forward in carrying the voice over long distances. The achievement linked to Alexander Graham Bell made direct contact between people, businesses and institutions far easier. As telephone networks grew, sharing information for business and administration became more convenient. The telephone laid the foundations for the long development of modern communication technology.',
    },
    sources: [
      {
        name: 'Library of Congress',
        title: 'Who is credited with inventing the telephone?',
        url: 'https://www.loc.gov/everyday-mysteries/categories/technology/item/who-is-credited-with-inventing-the-telephone/',
      },
      {
        name: 'Britannica',
        title: 'When was the telephone patented?',
        url: 'https://www.britannica.com/question/When-was-the-telephone-patented',
      },
    ],
  },

  // ---------- CMCN 3 ----------
  'ir3-overview': {
    title: { vi: 'Tổng quan CMCN 3', en: 'IR 3 Overview' },
    facts: [['period', { vi: 'Nửa sau thế kỷ XX', en: 'The second half of the 20th century' }]],
    long: {
      vi: 'Cuộc Cách mạng Công nghiệp lần thứ ba gắn liền với sự phát triển của điện tử, máy tính và công nghệ thông tin từ nửa sau thế kỷ XX. Máy tính giúp xử lý dữ liệu, robot thực hiện các thao tác lặp lại và hệ thống điều khiển lập trình tự động hóa nhà máy. Mạng máy tính mở rộng khả năng trao đổi thông tin. Những công nghệ này tăng độ chính xác và năng suất, nhưng cũng làm thay đổi nhu cầu việc làm và kỹ năng của người lao động.',
      en: 'The Third Industrial Revolution is tied to the rise of electronics, computers and information technology from the second half of the 20th century. Computers processed data, robots took over repetitive tasks and programmable controls automated factories. Computer networks widened the exchange of information. These technologies raised accuracy and productivity, but also changed which jobs and skills workers needed.',
    },
    sources: [WEF],
  },
  'ir3-1': {
    title: { vi: 'Bộ vi xử lý Intel 4004', en: 'The Intel 4004 Microprocessor' },
    facts: [
      ['company', { vi: 'Intel, phối hợp với Busicom trong dự án ban đầu', en: 'Intel, working with Busicom on the original project' }],
      ['year', same('1971')],
      ['field', { vi: 'Điện tử và máy tính', en: 'Electronics and computing' }],
    ],
    short: {
      vi: 'Intel 4004 là một trong những bộ vi xử lý thương mại đầu tiên trên một vi mạch đơn. Nó góp phần mở đường cho máy tính và thiết bị điện tử nhỏ gọn, trở thành nền tảng quan trọng của công nghệ số.',
      en: 'The Intel 4004 was one of the first commercial microprocessors on a single chip. It paved the way for compact computers and electronics, and became an important foundation of digital technology.',
    },
    long: {
      vi: 'Intel 4004 là một trong những bộ vi xử lý thương mại đầu tiên được chế tạo trên một vi mạch đơn. Nó tích hợp các chức năng xử lý trung tâm vào một linh kiện nhỏ, mở ra hướng phát triển cho các thiết bị điện tử ngày càng gọn nhẹ. Công nghệ vi xử lý về sau trở thành nền tảng của máy tính cá nhân, thiết bị thông minh và nhiều hệ thống điều khiển công nghiệp.',
      en: 'The Intel 4004 was one of the first commercial microprocessors built on a single chip. It put the functions of a central processor into one small part, opening the way to ever smaller and lighter electronics. Microprocessors later became the basis of personal computers, smart devices and many industrial control systems.',
    },
    sources: [
      { name: 'Intel', title: 'Intel 4004', url: 'https://www.intel.com/content/www/us/en/newsroom/resources/intel-4004.html' },
      {
        name: 'Science Museum Group',
        title: 'Intel 4004 processor',
        url: 'https://collection.sciencemuseumgroup.org.uk/objects/co523245',
      },
    ],
  },
  'ir3-2': {
    title: { vi: 'Máy tính cá nhân IBM 5150', en: 'The IBM 5150 Personal Computer' },
    facts: [
      ['company', same('IBM')],
      ['year', same('1981')],
      ['field', { vi: 'Máy tính và công nghệ thông tin', en: 'Computing and information technology' }],
    ],
    short: {
      vi: 'IBM 5150 đưa máy tính cá nhân đến gần hơn với văn phòng, trường học và gia đình. Máy hỗ trợ xử lý văn bản, tính toán và lưu trữ dữ liệu, góp phần thúc đẩy ngành công nghiệp phần mềm và máy tính.',
      en: 'The IBM 5150 brought the personal computer closer to offices, schools and homes. It handled word processing, calculation and data storage, and helped the software and computer industries grow.',
    },
    long: {
      vi: 'IBM 5150 là mẫu máy tính cá nhân được IBM giới thiệu năm 1981. Máy góp phần đưa máy tính đến gần hơn với các văn phòng, doanh nghiệp, trường học và người dùng cá nhân. Máy tính cá nhân giúp xử lý văn bản, tính toán, lưu trữ dữ liệu và quản lý công việc hiệu quả hơn. Sự phổ biến của thiết bị này cũng thúc đẩy sự phát triển của phần mềm và ngành công nghiệp máy tính.',
      en: 'The IBM 5150 is the personal computer IBM introduced in 1981. It helped bring computers to offices, businesses, schools and individual users. Personal computers made writing, calculating, storing data and managing work more efficient. Their spread also boosted software and the computer industry.',
    },
    sources: [
      { name: 'IBM', title: 'The IBM PC', url: 'https://www.ibm.com/history/personal-computer' },
      { name: 'Computer History Museum', title: 'Timeline of Computer History: 1981', url: 'https://www.computerhistory.org/timeline/1981/' },
    ],
  },
  'ir3-3': {
    title: { vi: 'Tự động hóa nhà máy: robot Unimate và PLC', en: 'Factory Automation: the Unimate Robot and the PLC' },
    facts: [
      ['people', { vi: 'George Devol, Joseph Engelberger (Unimate); nhiều nhóm kỹ sư (PLC)', en: 'George Devol, Joseph Engelberger (Unimate); many engineering teams (PLC)' }],
      ['time', { vi: '1961 (Unimate làm việc tại nhà máy General Motors); từ cuối thập niên 1960 (PLC)', en: '1961 (Unimate at work in a General Motors factory); from the late 1960s (PLC)' }],
      ['field', { vi: 'Robot và điều khiển tự động', en: 'Robotics and automatic control' }],
    ],
    short: {
      vi: 'Unimate là một trong những robot công nghiệp đầu tiên trong sản xuất thực tế, đảm nhận việc nặng và lặp lại. PLC điều khiển máy móc bằng chương trình có thể thay đổi. Điện tử và lập trình bắt đầu tự động hóa nhà máy.',
      en: 'Unimate was one of the first industrial robots in real production, taking on heavy, repetitive work. The PLC controls machines with a program that can be changed. Electronics and programming began to automate the factory.',
    },
    long: {
      vi: 'Năm 1961, robot Unimate của George Devol và Joseph Engelberger được đưa vào làm việc tại một nhà máy General Motors. Robot thực hiện các thao tác đã lập trình, phù hợp với việc lặp lại hoặc xử lý vật liệu nặng, giúp giảm sự tiếp xúc của công nhân với môi trường nguy hiểm. Từ cuối thập niên 1960, bộ điều khiển logic khả trình (PLC) thay thế những hệ thống điều khiển bằng dây nối: khi quy trình thay đổi, kỹ sư chỉ cần sửa chương trình thay vì đi dây lại. PLC điều khiển băng chuyền, động cơ và máy đóng gói. Robot và PLC là hai trụ cột của nhà máy tự động hóa.',
      en: 'In 1961 the Unimate robot of George Devol and Joseph Engelberger was put to work in a General Motors factory. It carried out programmed movements, suited to repetitive work and heavy materials, and kept workers away from some dangerous conditions. From the late 1960s the programmable logic controller (PLC) replaced hard-wired control systems: when a process changed, engineers edited a program instead of rewiring. PLCs run conveyors, motors and packaging machines. Robots and PLCs are the two pillars of the automated factory.',
    },
    sources: [
      {
        name: 'Guinness World Records',
        title: 'First industrial production robot',
        url: 'https://www.guinnessworldrecords.com/world-records/411563-first-industrial-production-robot',
      },
      { name: 'Wikipedia', title: 'Unimation', url: 'https://en.wikipedia.org/wiki/Unimation' },
      {
        name: 'Control Engineering',
        title: 'How programmable logic controllers emerged from industry needs',
        url: 'https://www.controleng.com/articles/how-programmable-logic-controllers-emerged-from-industry-needs/',
      },
      {
        name: 'Schneider Electric',
        title: 'The PLC: born out of a customer’s need',
        url: 'https://blog.se.com/industry/machine-and-process-management/2018/06/15/the-plc-born-out-of-a-customers-need-to-maximize-profitability/',
      },
    ],
  },
  'ir3-4': {
    title: { vi: 'Mạng máy tính ARPANET', en: 'The ARPANET Computer Network' },
    facts: [
      [
        'organisation',
        {
          vi: 'Cơ quan Nghiên cứu Dự án Tiên tiến của Bộ Quốc phòng Hoa Kỳ (ARPA) và các cơ sở nghiên cứu tham gia',
          en: 'The US Department of Defense’s Advanced Research Projects Agency (ARPA) and the research sites that took part',
        },
      ],
      ['year', { vi: '1969 (các kết nối đầu tiên)', en: '1969 (the first connections)' }],
      ['field', { vi: 'Mạng máy tính', en: 'Computer networking' }],
    ],
    short: {
      vi: 'ARPANET kết nối các máy tính tại những cơ sở nghiên cứu, cho phép trao đổi dữ liệu từ xa. Đây là một trong những nền tảng quan trọng trong lịch sử phát triển Internet, mở rộng khả năng chia sẻ thông tin giữa các địa điểm.',
      en: 'ARPANET linked computers at research sites so they could exchange data at a distance. It is one of the key foundations in the history of the Internet, widening the sharing of information between places.',
    },
    long: {
      vi: 'ARPANET là mạng máy tính tiên phong kết nối các cơ sở nghiên cứu tại Hoa Kỳ. Mạng cho phép máy tính ở những địa điểm khác nhau trao đổi dữ liệu, tạo tiền đề cho sự phát triển của mạng máy tính hiện đại. ARPANET không phải là toàn bộ Internet ngày nay, nhưng là một trong những nền tảng quan trọng trong lịch sử phát triển Internet. Thành tựu này mở ra phương thức giao tiếp và chia sẻ thông tin vượt qua giới hạn địa lý.',
      en: 'ARPANET was a pioneering computer network linking research sites in the United States. It let computers in different places exchange data, preparing the ground for modern computer networks. ARPANET is not the whole of today’s Internet, but it is one of the key foundations in its history. It opened up a way to communicate and share information beyond the limits of geography.',
    },
    sources: [
      {
        name: 'Internet Society',
        title: 'A Brief History of the Internet',
        url: 'https://www.internetsociety.org/internet/history-internet/brief-history-internet/',
      },
      {
        name: 'SRI International',
        title: '75 years of innovation: ARPANET',
        url: 'https://www.sri.com/75-years-of-innovation/75-years-of-innovation-arpanet/',
      },
    ],
  },

  'ir3-5': {
    title: { vi: 'Điện thoại di động và World Wide Web', en: 'The Mobile Phone and the World Wide Web' },
    facts: [
      ['people', { vi: 'Martin Cooper (Motorola); Tim Berners-Lee (CERN)', en: 'Martin Cooper (Motorola); Tim Berners-Lee (CERN)' }],
      ['year', { vi: '1973 (cuộc gọi đầu tiên từ điện thoại di động cầm tay); 1989 (đề xuất World Wide Web)', en: '1973 (the first call from a handheld mobile phone); 1989 (the World Wide Web proposed)' }],
      ['field', { vi: 'Viễn thông và mạng máy tính', en: 'Telecommunications and computer networks' }],
    ],
    short: {
      vi: 'Năm 1973, Martin Cooper của hãng Motorola gọi cuộc gọi đầu tiên từ một chiếc điện thoại di động cầm tay. Năm 1989, Tim Berners-Lee đề xuất World Wide Web tại CERN. Điện thoại di động và Web đưa thông tin đến tay mỗi người, ở bất cứ đâu.',
      en: 'In 1973 Martin Cooper of Motorola made the first call from a handheld mobile phone. In 1989 Tim Berners-Lee proposed the World Wide Web at CERN. Mobile phones and the Web put information in everyone’s hands, wherever they are.',
    },
    long: {
      vi: 'Năm 1973, Martin Cooper của hãng Motorola thực hiện cuộc gọi đầu tiên từ một chiếc điện thoại di động cầm tay, giải phóng chiếc điện thoại khỏi sợi dây. Năm 1989, Tim Berners-Lee đề xuất World Wide Web tại CERN: những trang thông tin liên kết với nhau, chạy trên nền Internet, vốn bắt nguồn từ những mạng như ARPANET. Khi hai phát minh gặp nhau trong chiếc điện thoại thông minh, thông tin, mua bán và trò chuyện theo con người đi khắp nơi.',
      en: 'In 1973 Martin Cooper of Motorola made the first call from a handheld mobile phone, freeing the telephone from its wire. In 1989 Tim Berners-Lee proposed the World Wide Web at CERN: pages of information linked to one another, running on the Internet, which grew out of networks such as ARPANET. When the two came together in the smartphone, information, shopping and conversation followed people everywhere.',
    },
    sources: [
      { name: 'Britannica', title: 'Martin Cooper', url: 'https://www.britannica.com/biography/Martin-Cooper' },
      { name: 'CERN', title: 'A short history of the Web', url: 'https://home.cern/science/computing/the-birth-of-the-web/short-history-web/' },
      { name: 'CERN', title: 'The birth of the Web', url: 'https://home.cern/science/computing/birth-web' },
    ],
  },
  // ---------- CMCN 4 ----------
  'ir4-overview': {
    title: { vi: 'Tổng quan CMCN 4', en: 'IR 4 Overview' },
    facts: [['period', { vi: 'Đầu thế kỷ XXI đến nay', en: 'The early 21st century to today' }]],
    long: {
      vi: 'Cuộc Cách mạng Công nghiệp lần thứ tư kết hợp thế giới vật lý, số và sinh học: trí tuệ nhân tạo, Internet vạn vật, điện toán đám mây và dữ liệu lớn, robot tiên tiến, in 3D và công nghệ sinh học. Máy móc không chỉ tự động thực hiện nhiệm vụ mà còn thu thập dữ liệu, học từ dữ liệu và hỗ trợ ra quyết định. Các công nghệ này giúp tăng chất lượng, giảm lãng phí và mở ra những phương pháp chữa bệnh mới, nhưng đặt ra thách thức về bảo mật, năng lượng, việc làm, kỹ năng lao động và đạo đức.',
      en: 'The Fourth Industrial Revolution brings together the physical, digital and biological worlds: artificial intelligence, the Internet of Things, cloud computing and big data, advanced robots, 3D printing and biotechnology. Machines not only carry out tasks automatically, but also collect data, learn from it and support decisions. These technologies raise quality, reduce waste and open up new ways to treat disease, but bring challenges in security, energy, jobs, workers’ skills and ethics.',
    },
    sources: [WEF],
  },
  'ir4-1': {
    title: { vi: 'Công nghệ in 3D', en: '3D Printing' },
    facts: [
      ['pioneer', same('Chuck Hull')],
      ['year', { vi: '1986 (bằng sáng chế về kỹ thuật stereolithography)', en: '1986 (patent on stereolithography)' }],
      ['field', { vi: 'Sản xuất bồi đắp', en: 'Additive manufacturing' }],
    ],
    short: {
      vi: 'In 3D tạo vật thể từ mô hình số bằng cách thêm vật liệu từng lớp. Công nghệ giúp tạo mẫu nhanh và chế tạo hình dạng phức tạp, được ứng dụng trong y tế, thiết kế và công nghiệp, dù vẫn có giới hạn về vật liệu, tốc độ và chi phí.',
      en: '3D printing builds objects from a digital model by adding material layer by layer. It allows fast prototypes and complex shapes, and is used in medicine, design and industry, though materials, speed and cost still set limits.',
    },
    long: {
      vi: 'Công nghệ in 3D tạo ra vật thể bằng cách xây dựng từng lớp vật liệu dựa trên mô hình kỹ thuật số. Phương pháp này giúp chế tạo các hình dạng phức tạp, tạo mẫu thử nhanh và sản xuất một số linh kiện theo yêu cầu. In 3D được ứng dụng trong thiết kế, y tế, hàng không và công nghiệp. Dù vậy, tốc độ sản xuất, loại vật liệu và chi phí vẫn quyết định khi nào công nghệ này phù hợp hơn các phương pháp truyền thống.',
      en: '3D printing makes objects by building up material layer by layer from a digital model. It can produce complex shapes, quick prototypes and some parts made to order. It is used in design, medicine, aviation and industry. Even so, production speed, materials and cost still decide when it beats traditional methods.',
    },
    sources: [
      {
        name: 'National Inventors Hall of Fame',
        title: '3D printing: Chuck Hull',
        url: 'https://www.invent.org/blog/inventors/3d-printing-chuck-hull',
      },
      { name: 'Google Patents', title: 'US 4,575,330 (1986)', url: 'https://patents.google.com/patent/US4575330A/en' },
    ],
  },
  'ir4-2': {
    title: { vi: 'Nhà máy kết nối: IoT, hệ thống thực-ảo và bản sao số', en: 'The Connected Factory: IoT, Cyber-Physical Systems and the Digital Twin' },
    facts: [
      ['people', { vi: 'Kevin Ashton (người đặt tên "Internet vạn vật")', en: 'Kevin Ashton (who named the “Internet of Things”)' }],
      ['time', { vi: '1999 (thuật ngữ Internet vạn vật); 2011 (khái niệm "Industrie 4.0" ra mắt tại Hội chợ Hannover, Đức)', en: '1999 (the term “Internet of Things”); 2011 (the idea of “Industrie 4.0” presented at the Hannover Fair, Germany)' }],
      ['field', { vi: 'Cảm biến, mạng và tự động hóa', en: 'Sensors, networks and automation' }],
    ],
    short: {
      vi: 'Trong nhà máy kết nối, cảm biến trên máy móc gửi dữ liệu liên tục qua mạng. Máy tính phân tích dữ liệu để báo trước hỏng hóc, điều chỉnh sản xuất và cập nhật một bản sao số của nhà máy, nơi kỹ sư thử thay đổi trước khi làm thật.',
      en: 'In a connected factory, sensors on machines send data over the network all the time. Computers analyse it to warn of breakdowns, adjust production and update a digital twin of the factory, where engineers try out changes before making them for real.',
    },
    long: {
      vi: 'Trong nhà máy kết nối, Internet vạn vật (thuật ngữ ra đời năm 1999) nối máy móc và cảm biến qua mạng, gắn phần tính toán với máy móc thành hệ thống thực - ảo; năm 2011, ý tưởng này được gọi là "Industrie 4.0". Dữ liệu cảm biến giúp bảo trì dự đoán, cảnh báo trước khi máy hỏng, và tạo nên bản sao số, mô hình ảo của dây chuyền để thử thay đổi trước khi làm thật. Tuy vậy, dự báo vẫn có thể sai, và hệ thống kết nối phải được bảo vệ khỏi tấn công mạng.',
      en: 'In a connected factory, the Internet of Things (a term coined in 1999) links machines and sensors over a network, joining computing and machinery into cyber-physical systems; in 2011 the idea was named “Industrie 4.0”. Sensor data powers predictive maintenance, which warns before a machine breaks down, and the digital twin, a virtual copy of a line on which changes are tested first. But predictions can be wrong, and connected systems must be protected from cyber attacks.',
    },
    sources: [
      { name: 'University of Cambridge, Institute for Manufacturing', title: 'The origin of the Internet of Things', url: 'https://www.ifm.eng.cam.ac.uk/news/the-origin-of-the-internet-of-things' },
      { name: 'DFKI (2021)', title: 'Ten years of Industrie 4.0: interview with Wolfgang Wahlster', url: 'https://dfki.de/en/web/news/ten-years-of-industrie-4-0-interview-wolfgang-wahlster-cea-dfki' },
      { name: 'NIST', title: 'Glossary: cyber-physical systems', url: 'https://csrc.nist.gov/glossary/term/cyber_physical_systems' },
      { name: 'SAP', title: 'What is the Industrial Internet of Things (IIoT)?', url: 'https://www.sap.com/resources/what-is-iiot' },
      {
        name: 'US Department of Energy (FEMP)',
        title: 'Operations & Maintenance Best Practices: A Guide to Achieving Operational Efficiency, Release 3.0 (2010)',
        url: 'https://www.energy.gov/eere/femp/articles/operations-and-maintenance-best-practices-guide-achieving-operational-efficiency',
      },
      { name: 'Britannica', title: 'digital twin', url: 'https://www.britannica.com/technology/digital-twin' },
    ],
  },
  'ir4-3': {
    title: { vi: 'Trí tuệ nhân tạo (AI)', en: 'Artificial Intelligence (AI)' },
    facts: [
      ['people', { vi: 'Alan Turing, John McCarthy và nhiều thế hệ nhà khoa học', en: 'Alan Turing, John McCarthy and generations of scientists' }],
      [
        'time',
        {
          vi: '1956 (hội thảo Dartmouth đặt nền móng cho ngành AI); bùng nổ từ thập niên 2010 với học sâu; 2022 (ChatGPT ra mắt); 2024 (hai giải Nobel cho các công trình về AI)',
          en: '1956 (the Dartmouth workshop that founded the field); booming since the 2010s with deep learning; 2022 (ChatGPT released); 2024 (two Nobel Prizes for work on AI)',
        },
      ],
      ['field', { vi: 'Khoa học máy tính', en: 'Computer science' }],
    ],
    short: {
      vi: 'AI là những hệ thống máy tính học từ dữ liệu để nhận dạng, dự đoán, ra quyết định và tạo nội dung. Từ năm 2022, AI tạo sinh lan rộng rất nhanh; nay AI còn giải toán thi Olympic, hỗ trợ nghiên cứu khoa học và tự thực hiện nhiều bước công việc, nhưng vẫn có thể sai và cần con người giám sát.',
      en: 'AI means computer systems that learn from data to recognise, predict, decide and create. Since 2022 generative AI has spread very fast; today AI also solves Olympiad maths problems, helps with scientific research and carries out multi-step tasks on its own, but it can still be wrong and needs human oversight.',
    },
    long: {
      vi: 'Trí tuệ nhân tạo, được đặt tên như một ngành khoa học từ năm 1956, ngày nay học từ lượng dữ liệu rất lớn thay vì chỉ làm theo quy tắc viết sẵn. Học sâu giúp máy tính nhận dạng hình ảnh và giọng nói tốt hơn hẳn, và từ khi ChatGPT ra đời năm 2022, AI tạo sinh đã đến với hàng trăm triệu người. Trong công nghiệp, AI kiểm tra chất lượng, dự đoán hỏng hóc và tối ưu sản xuất. Nhưng AI vẫn có thể sai, mang thiên lệch từ dữ liệu, tiêu tốn nhiều điện năng và cần con người giám sát, nên các nước, trong đó có Việt Nam, đã bắt đầu đặt luật cho AI.',
      en: 'Artificial intelligence, named as a field in 1956, now learns from vast amounts of data instead of only following rules written in advance. Deep learning made computers far better at recognising images and speech, and since ChatGPT in 2022 generative AI has reached hundreds of millions of people. In industry, AI inspects quality, predicts breakdowns and optimises production. But it can still be wrong, inherit bias from its data, use a lot of electricity and needs human oversight, so countries, Vietnam among them, have begun to make laws for it.',
    },
    sources: [
      { name: 'Britannica', title: 'Artificial intelligence', url: 'https://www.britannica.com/technology/artificial-intelligence' },
      { name: 'Britannica', title: 'Alan Turing', url: 'https://www.britannica.com/biography/Alan-Turing' },
      { name: 'OpenAI', title: 'Introducing ChatGPT (2022)', url: 'https://openai.com/index/chatgpt/' },
      { name: 'NobelPrize.org', title: 'The Nobel Prize in Physics 2024', url: 'https://www.nobelprize.org/prizes/physics/2024/summary/' },
      { name: 'NobelPrize.org', title: 'The Nobel Prize in Chemistry 2024', url: 'https://www.nobelprize.org/prizes/chemistry/2024/summary/' },
      {
        name: 'Google DeepMind (2025)',
        title: 'Advanced version of Gemini with Deep Think officially achieves gold-medal standard at the International Mathematical Olympiad',
        url: 'https://deepmind.google/blog/advanced-version-of-gemini-with-deep-think-officially-achieves-gold-medal-standard-at-the-international-mathematical-olympiad/',
      },
      { name: 'Stanford HAI (2026)', title: 'Inside the AI Index: 12 Takeaways from the 2026 Report', url: 'https://hai.stanford.edu/news/inside-the-ai-index-12-takeaways-from-the-2026-report' },
      { name: 'European Commission', title: 'AI Act', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
      {
        name: 'Ministry of Science and Technology of Vietnam (2025)',
        title: 'First-ever Law on Artificial Intelligence approved',
        url: 'https://beta-en.mic.gov.vn/first-ever-law-on-artificial-intelligence-approved-197251215231241888.htm',
      },
      {
        name: 'IEEE Access (Prunella et al., 2023)',
        title: 'Deep Learning for Automatic Vision-Based Recognition of Industrial Surface Defects: A Survey',
        url: 'https://doi.org/10.1109/ACCESS.2023.3271748',
      },
    ],
  },
  'ir4-4': {
    title: { vi: 'Điện toán đám mây và dữ liệu lớn', en: 'Cloud Computing and Big Data' },
    facts: [
      ['time', { vi: '2006 (Amazon Web Services ra mắt dịch vụ lưu trữ S3 và máy chủ thuê EC2); 2011 (NIST công bố định nghĩa điện toán đám mây)', en: '2006 (Amazon Web Services launches S3 storage and EC2 rented servers); 2011 (NIST publishes its definition of cloud computing)' }],
      ['field', { vi: 'Trung tâm dữ liệu và mạng Internet', en: 'Data centres and the Internet' }],
    ],
    short: {
      vi: 'Điện toán đám mây cho phép thuê sức mạnh tính toán và chỗ lưu trữ qua Internet, dùng bao nhiêu trả bấy nhiêu. Nhờ đó, nhà máy và doanh nghiệp xử lý được dữ liệu lớn từ hàng nghìn cảm biến, và các mô hình AI được huấn luyện trong những trung tâm dữ liệu khổng lồ.',
      en: 'Cloud computing lets anyone rent computing power and storage over the Internet, paying for what they use. Factories and businesses can then handle big data from thousands of sensors, and AI models are trained in huge data centres.',
    },
    long: {
      vi: 'Điện toán đám mây cho thuê sức tính toán và chỗ lưu trữ qua Internet, dùng bao nhiêu trả bấy nhiêu, nên doanh nghiệp không còn phải tự mua và vận hành máy chủ; Amazon Web Services mở đường cho nó năm 2006. Đám mây lưu trữ và phân tích dữ liệu lớn, những dòng dữ liệu từ cảm biến nhà máy, giao dịch và điện thoại, quá lớn cho một máy tính thông thường, và là nơi huấn luyện AI. Đám mây tiết kiệm chi phí ban đầu, nhưng đặt ra thách thức về năng lượng, bảo mật dữ liệu và sự phụ thuộc vào kết nối mạng.',
      en: 'Cloud computing rents out computing power and storage over the Internet, paid for as it is used, so businesses no longer have to buy and run their own servers; Amazon Web Services opened the way in 2006. The cloud stores and analyses big data, streams from factory sensors, transactions and phones too large for an ordinary computer, and it is where AI is trained. It saves upfront costs, but raises challenges of energy use, data security and dependence on the network.',
    },
    sources: [
      { name: 'NIST (Mell and Grance, 2011)', title: 'SP 800-145: The NIST Definition of Cloud Computing', url: 'https://doi.org/10.6028/NIST.SP.800-145' },
      { name: 'Wikipedia', title: 'Timeline of Amazon Web Services', url: 'https://en.wikipedia.org/wiki/Timeline_of_Amazon_Web_Services' },
      { name: 'Britannica', title: 'cloud computing', url: 'https://www.britannica.com/technology/cloud-computing' },
      { name: 'Stanford HAI (2026)', title: 'Inside the AI Index: 12 Takeaways from the 2026 Report', url: 'https://hai.stanford.edu/news/inside-the-ai-index-12-takeaways-from-the-2026-report' },
    ],
  },
  'ir4-5': {
    title: { vi: 'Robot tiên tiến và robot cộng tác', en: 'Advanced Robots and Cobots' },
    facts: [
      [
        'developedBy',
        {
          vi: 'Nhiều doanh nghiệp chế tạo robot; thuật ngữ cobot xuất hiện từ thập niên 1990',
          en: 'Many robot makers; the word “cobot” dates from the 1990s',
        },
      ],
      ['time', { vi: 'Năm 2024: khoảng 4,66 triệu robot công nghiệp đang hoạt động trên thế giới', en: '2024: about 4.66 million industrial robots at work worldwide' }],
      ['field', { vi: 'Robot và sản xuất thông minh', en: 'Robotics and smart manufacturing' }],
    ],
    short: {
      vi: 'Robot ngày nay linh hoạt hơn nhiều: nhờ cảm biến và phần mềm, chúng nhìn, cảm nhận lực và có thể làm việc cạnh con người. Năm 2024, khoảng 4,66 triệu robot công nghiệp đang hoạt động trên thế giới, gấp đôi so với mười năm trước.',
      en: 'Today’s robots are far more flexible: with sensors and software they can see, feel force and work beside people. In 2024 about 4.66 million industrial robots were at work worldwide, more than twice as many as ten years earlier.',
    },
    long: {
      vi: 'Những robot công nghiệp đầu tiên làm việc sau hàng rào, lặp lại đúng một chuỗi động tác. Robot tiên tiến ngày nay có camera, cảm biến lực và phần mềm thông minh, nên nhận ra vật thể và tự điều chỉnh động tác; robot cộng tác (cobot) được thiết kế để làm việc ngay cạnh con người. Robot giúp sản xuất chính xác hơn và làm thay việc nặng nhọc, nguy hiểm, nhưng khi làm gần người vẫn cần đánh giá rủi ro và biện pháp bảo vệ, và người lao động cần kỹ năng mới để làm việc cùng robot.',
      en: 'The first industrial robots worked behind fences, repeating one exact sequence of moves. Today’s advanced robots carry cameras, force sensors and smart software, so they can recognise objects and adjust their movements; collaborative robots (cobots) are designed to work right beside people. Robots make production more precise and take over heavy or dangerous work, but near people they still need a risk assessment and safeguards, and workers need new skills to work alongside them.',
    },
    sources: [
      { name: 'International Federation of Robotics (2025)', title: 'World Robotics 2025: global robot demand in factories doubles over 10 years', url: 'https://ifr.org/ifr-press-releases/news/global-robot-demand-in-factories-doubles-over-10-years' },
      { name: 'Northwestern University (Michael Peshkin)', title: 'Cobots', url: 'https://peshkin.mech.northwestern.edu/cobot/' },
      {
        name: 'Association for Advancing Automation',
        title: 'ISO/TS 15066 explained',
        url: 'https://www.automate.org/tech-papers/iso-ts-15066-explained',
      },
    ],
  },
  'ir4-6': {
    title: { vi: 'Công nghệ sinh học và chỉnh sửa gen', en: 'Biotechnology and Gene Editing' },
    facts: [
      ['people', { vi: 'Emmanuelle Charpentier, Jennifer Doudna (CRISPR); Katalin Karikó, Drew Weissman (vắc-xin mRNA)', en: 'Emmanuelle Charpentier, Jennifer Doudna (CRISPR); Katalin Karikó, Drew Weissman (mRNA vaccines)' }],
      ['time', { vi: '2003 (hoàn thành giải mã bộ gen người); 2012 (công cụ chỉnh sửa gen CRISPR-Cas9); 2020 (vắc-xin mRNA ngừa COVID-19)', en: '2003 (the human genome is read); 2012 (the CRISPR-Cas9 gene-editing tool); 2020 (mRNA vaccines against COVID-19)' }],
      ['field', { vi: 'Sinh học, y học và nông nghiệp', en: 'Biology, medicine and agriculture' }],
    ],
    short: {
      vi: 'Cách mạng Công nghiệp lần thứ tư kết hợp thế giới số với sinh học. Máy tính giúp đọc và phân tích gen; công cụ CRISPR-Cas9 cho phép "cắt" ADN tại đúng vị trí mong muốn; vắc-xin mRNA được phát triển nhanh chưa từng có trong đại dịch COVID-19.',
      en: 'The Fourth Industrial Revolution joins the digital world with biology. Computers help read and analyse genes; the CRISPR-Cas9 tool can “cut” DNA at exactly the chosen place; and mRNA vaccines were developed at unprecedented speed during the COVID-19 pandemic.',
    },
    long: {
      vi: 'Cuộc Cách mạng Công nghiệp lần thứ tư kết hợp thế giới số với sinh học. Máy tính giúp giải mã bộ gen người (2003); "chiếc kéo di truyền" CRISPR-Cas9 (2012) có thể cắt ADN tại vị trí chọn trước; và vắc-xin mRNA ngừa COVID-19 được phát triển với tốc độ chưa từng có. Những thành tựu này mở ra cách chữa bệnh mới, nhưng chỉnh sửa gen đặt ra câu hỏi nghiêm túc về đạo đức và an toàn, nhất là khi dùng trên con người, nên cần được quản lý chặt chẽ.',
      en: 'The Fourth Industrial Revolution joins the digital world with biology. Computers made it possible to read the human genome (2003); the “genetic scissors” CRISPR-Cas9 (2012) can cut DNA at a chosen place; and mRNA vaccines against COVID-19 were developed at unprecedented speed. These open new ways to treat disease, but gene editing raises serious ethical and safety questions, above all when used on people, so it must be carefully regulated.',
    },
    sources: [
      WEF,
      { name: 'National Human Genome Research Institute', title: 'Human Genome Project fact sheet', url: 'https://www.genome.gov/about-genomics/educational-resources/fact-sheets/human-genome-project' },
      { name: 'NobelPrize.org', title: 'The Nobel Prize in Chemistry 2020', url: 'https://www.nobelprize.org/prizes/chemistry/2020/summary/' },
      { name: 'NobelPrize.org', title: 'The Nobel Prize in Physiology or Medicine 2023', url: 'https://www.nobelprize.org/prizes/medicine/2023/summary/' },
    ],
  },
}

function buildTexts(lang: Language): Record<string, ExhibitText> {
  const texts: Record<string, ExhibitText> = {}
  for (const [id, entry] of Object.entries(ENTRIES)) {
    texts[id] = {
      title: entry.title[lang],
      facts: entry.facts.map(([label, value]) => `${LABEL[label][lang]}: ${value[lang]}`),
      summary: (entry.short ?? entry.long)[lang],
      body: entry.long[lang],
      sources: entry.sources,
      placeholder: entry.placeholder ?? false,
    }
  }
  // Listed from credits.ts, so it is always complete.
  // The team: one member per line.
  texts['hall-team'] = {
    title: lang === 'vi' ? 'Nhóm thực hiện' : 'Our Team',
    facts: [],
    summary: TEAM.map((m, i) => `${i + 1}. ${m.name}: ${m.role[lang]}`).join('\n'),
    body: TEAM.map((m, i) => `${i + 1}. ${m.name}: ${m.role[lang]}`).join('\n'),
    sources: [],
    placeholder: false,
  }
  // Sources first, then the credits of every asset, one per line (from credits.ts).
  texts['hall-credits'] = {
    title: lang === 'vi' ? 'Nguồn tham khảo và ghi công' : 'References and Credits',
    facts: [],
    summary:
      lang === 'vi'
        ? 'Các nguồn chung về bốn cuộc Cách mạng Công nghiệp (nguồn của từng hiện vật ghi trên bảng của hiện vật đó), cùng tác giả và giấy phép của phông chữ, vật liệu, âm thanh và mô hình.'
        : 'The general sources on the four Industrial Revolutions (each exhibit’s sources are on its own board), and the authors and licences of the font, textures, sounds and models.',
    body:
      (lang === 'vi' ? 'Ghi công:' : 'Credits:') +
      '\n' +
      credits
        // (Sound credits only while sound is switched on, see src/features.ts.)
        .filter((c) => AUDIO_ENABLED || !c.files.every((file) => file.startsWith('sounds/')))
        .map((c) => `• ${c.item[lang]}: ${typeof c.author === 'string' ? c.author : c.author[lang]}, ${c.licence[lang]}`)
        .join('\n'),
    sources: [BRITANNICA_IR, BRITANNICA_TECH, WEF],
    placeholder: false,
  }
  return texts
}

const TEXTS: Record<Language, Record<string, ExhibitText>> = { vi: buildTexts('vi'), en: buildTexts('en') }

export function getExhibitText(id: string, lang: Language): ExhibitText {
  return (
    TEXTS[lang][id] ?? { title: id, facts: [], summary: NOTE[lang], body: NOTE[lang], sources: [], placeholder: true }
  )
}
