import type { Language } from './language'
import { credits } from './credits'
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

// Marks text that still has to be written or checked.
const NOTE: Both = { vi: '[CẦN KIỂM TRA]', en: '[NEEDS CHECKING]' }

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
      vi: 'Bốn phòng trưng bày, mỗi phòng dành cho một cuộc Cách mạng Công nghiệp, nằm quanh Sảnh trung tâm. CMCN 1 (khoảng giữa thế kỷ XVIII - giữa thế kỷ XIX): hơi nước và máy móc cơ khí, bắt đầu tại Anh. CMCN 2 (cuối thế kỷ XIX - đầu thế kỷ XX): điện năng và sản xuất hàng loạt. CMCN 3 (nửa sau thế kỷ XX): điện tử, máy tính và tự động hóa. CMCN 4 (đầu thế kỷ XXI đến nay): trí tuệ nhân tạo, Internet vạn vật và dữ liệu. Mỗi phòng có một bảng tổng quan và các phát minh tiêu biểu, phòng sau nhiều hơn phòng trước: 4, 4, 5 rồi 6 phát minh. Mỗi bảng chữ đều có thể phóng to để đọc toàn văn. Sau khi tham quan cả bốn phòng, Phòng trò chơi sẽ mở cửa.',
      en: 'Four exhibition rooms, one for each Industrial Revolution, lie around the Central Hall. IR 1 (about the mid-18th to the mid-19th century): steam and mechanical machinery, beginning in Britain. IR 2 (the late 19th to the early 20th century): electricity and mass production. IR 3 (the second half of the 20th century): electronics, computers and automation. IR 4 (the early 21st century to today): artificial intelligence, the Internet of Things and data. Each room has an overview board and its landmark inventions, more in each room than the one before: 4, 4, 5 and then 6. Every board can be enlarged to read its full text. Once you have visited all four rooms, the Game Room opens.',
    },
    sources: [BRITANNICA_IR, WEF],
  },
  'hall-team': {
    title: { vi: 'Nhóm thực hiện', en: 'Our Team' },
    facts: [],
    short: {
      vi: `Các thành viên của nhóm và vai trò của từng người. ${NOTE.vi}`,
      en: `The members of the team and their roles. ${NOTE.en}`,
    },
    long: {
      vi: `Danh sách thành viên và vai trò sẽ được nhóm bổ sung. ${NOTE.vi}`,
      en: `The list of members and their roles will be added by the team. ${NOTE.en}`,
    },
    sources: [],
    placeholder: true,
  },
  // Written by Claude: the general sources behind the four-era framework (CONTENT.md).
  'hall-sources': {
    title: { vi: 'Nguồn tham khảo', en: 'References' },
    facts: [],
    short: {
      vi: 'Các nguồn chung về bốn cuộc Cách mạng Công nghiệp. Nguồn của từng hiện vật được ghi ngay trên bảng của hiện vật đó.',
      en: 'The general sources on the four Industrial Revolutions. The sources for each exhibit are given on that exhibit’s own board.',
    },
    long: {
      vi: 'Cách chia lịch sử công nghiệp thành bốn cuộc cách mạng theo các nguồn dưới đây: lần thứ nhất dùng nước và hơi nước để cơ giới hóa sản xuất, lần thứ hai dùng điện năng cho sản xuất hàng loạt, lần thứ ba dùng điện tử và công nghệ thông tin để tự động hóa, và lần thứ tư kết hợp nhiều công nghệ với nhau. Nguồn của từng hiện vật được ghi ngay trên bảng của hiện vật đó, trong mỗi phòng.',
      en: 'The division of industrial history into four revolutions follows the sources below: the first used water and steam to mechanise production, the second used electricity for mass production, the third used electronics and information technology to automate, and the fourth brings many technologies together. The sources for each exhibit are given on that exhibit’s own board, in each room.',
    },
    sources: [BRITANNICA_IR, BRITANNICA_TECH, WEF],
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
    title: { vi: 'Máy kéo sợi Spinning Jenny', en: 'The Spinning Jenny' },
    facts: [
      ['person', same('James Hargreaves')],
      ['year', { vi: 'Khoảng 1764 (bằng sáng chế năm 1770)', en: 'About 1764 (patented in 1770)' }],
      ['field', { vi: 'Công nghiệp dệt', en: 'Textile industry' }],
    ],
    short: {
      vi: 'Máy cho phép một người kéo nhiều sợi cùng lúc, làm tăng năng suất ngành dệt. Nó góp phần chuyển sản xuất từ thủ công tại gia đình sang quy mô lớn hơn, đồng thời thay đổi công việc truyền thống của người lao động.',
      en: 'The machine let one person spin several threads at once, raising productivity in textiles. It helped move production from hand work at home to a larger scale, and changed the traditional work of spinners.',
    },
    long: {
      vi: 'Trước khi Spinning Jenny xuất hiện, việc kéo sợi chủ yếu được thực hiện bằng các công cụ thủ công và mất nhiều thời gian. Máy kéo sợi này cho phép một người vận hành nhiều cọc sợi cùng lúc, làm tăng đáng kể năng suất. Nhờ đó, ngành dệt có thể đáp ứng nhu cầu vải ngày càng lớn. Tuy nhiên, sự phát triển của máy móc cũng làm thay đổi công việc của những người thợ dệt và kéo sợi truyền thống.',
      en: 'Before the Spinning Jenny, spinning was done mostly with hand tools and took a long time. This machine let one person work many spindles at once, greatly raising output. The textile industry could then keep up with the growing demand for cloth. But machines also changed the work of traditional weavers and spinners.',
    },
    sources: [
      { name: 'Britannica', title: 'James Hargreaves', url: 'https://www.britannica.com/biography/James-Hargreaves' },
      { name: 'Wikipedia', title: 'Spinning jenny', url: 'https://en.wikipedia.org/wiki/Spinning_jenny' },
    ],
  },
  'ir1-3': {
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
    title: { vi: 'Đèn điện sợi đốt', en: 'The Incandescent Light Bulb' },
    facts: [
      [
        'person',
        {
          vi: 'Thomas Edison và nhóm cộng sự; nhiều nhà phát minh khác cũng đóng góp vào sự phát triển đèn điện',
          en: 'Thomas Edison and his team; many other inventors also contributed to electric lighting',
        },
      ],
      ['year', { vi: '1879 (nộp đơn xin cấp bằng sáng chế; được cấp năm 1880)', en: '1879 (patent filed; granted in 1880)' }],
      ['field', { vi: 'Điện và chiếu sáng', en: 'Electricity and lighting' }],
    ],
    short: {
      vi: 'Những cải tiến của Edison và cộng sự góp phần tạo ra đèn điện có tính ứng dụng thực tế. Đèn điện giúp chiếu sáng nhà ở, đường phố và nhà máy, đồng thời thúc đẩy sự phát triển của hệ thống cung cấp điện.',
      en: 'Edison and his team’s improvements helped create a practical electric lamp. Electric light lit up homes, streets and factories, and drove the growth of power supply networks.',
    },
    long: {
      vi: 'Đèn điện sợi đốt là một trong những thành tựu tiêu biểu của quá trình phát triển hệ thống chiếu sáng bằng điện. Các thử nghiệm của Edison và cộng sự góp phần tạo ra loại đèn có tính ứng dụng thực tế cao hơn. Khi hệ thống điện được mở rộng, đèn điện giúp chiếu sáng nhà ở, đường phố và nhà máy. Nhờ đó, con người có thể làm việc và sinh hoạt thuận tiện hơn sau khi trời tối. Thành tựu này cũng góp phần thúc đẩy sự phát triển của mạng lưới cung cấp điện.',
      en: 'The incandescent light bulb is one of the landmark achievements in the development of electric lighting. The experiments of Edison and his team helped produce a far more practical lamp. As electricity networks spread, electric light lit up homes, streets and factories, so people could work and live more easily after dark. It also helped drive the growth of the power supply network.',
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
    ],
  },
  'ir2-2': {
    title: { vi: 'Động cơ điện cảm ứng xoay chiều', en: 'The AC Induction Motor' },
    facts: [
      ['person', same('Nikola Tesla')],
      [
        'year',
        {
          vi: '1888 (năm Tesla được cấp bằng sáng chế tại Hoa Kỳ cho các phát minh liên quan)',
          en: '1888 (the year Tesla received the related US patents)',
        },
      ],
      ['field', { vi: 'Kỹ thuật điện', en: 'Electrical engineering' }],
    ],
    short: {
      vi: 'Động cơ biến điện năng thành chuyển động cơ học, giúp máy móc vận hành hiệu quả và linh hoạt hơn. Thành tựu này góp phần mở rộng việc sử dụng điện trong nhà máy và các hoạt động công nghiệp.',
      en: 'The motor turns electricity into mechanical motion, so machines run more efficiently and flexibly. It helped spread the use of electricity in factories and industry.',
    },
    long: {
      vi: 'Động cơ điện cảm ứng xoay chiều biến điện năng thành chuyển động cơ học. Thiết kế của Tesla góp phần quan trọng vào sự phát triển của hệ thống điện xoay chiều và ứng dụng động cơ điện trong công nghiệp. So với việc phụ thuộc hoàn toàn vào máy hơi nước, động cơ điện có thể được bố trí tại nhiều vị trí khác nhau trong nhà máy. Công nghệ này hỗ trợ vận hành máy móc, bơm nước và nhiều thiết bị sản xuất.',
      en: 'The AC induction motor turns electrical energy into mechanical motion. Tesla’s design played an important part in the development of alternating-current power systems and of electric motors in industry. Unlike a factory that depended entirely on one steam engine, electric motors could be placed wherever they were needed. The technology powered machines, water pumps and much other production equipment.',
    },
    sources: [
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
  'ir2-3': {
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
  'ir2-4': {
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
    title: { vi: 'Robot công nghiệp Unimate', en: 'The Unimate Industrial Robot' },
    facts: [
      ['people', same('George Devol, Joseph Engelberger')],
      ['year', { vi: '1961 (đưa vào sử dụng tại nhà máy General Motors)', en: '1961 (put to work in a General Motors factory)' }],
      ['field', { vi: 'Robot và tự động hóa', en: 'Robotics and automation' }],
    ],
    short: {
      vi: 'Unimate là một trong những robot công nghiệp đầu tiên được đưa vào sản xuất thực tế. Robot thực hiện các thao tác đã lập trình, hỗ trợ xử lý vật liệu nặng và công việc lặp lại, giúp tăng tính ổn định và giảm sự tiếp xúc với một số môi trường nguy hiểm.',
      en: 'Unimate was one of the first industrial robots used in real production. It carried out programmed movements, handling heavy materials and repetitive work, which made production steadier and kept workers away from some dangerous conditions.',
    },
    long: {
      vi: 'Unimate là một trong những robot công nghiệp đầu tiên được sử dụng trong sản xuất thực tế. Robot có thể thực hiện các thao tác đã được lập trình, đặc biệt phù hợp với những công việc lặp lại hoặc đòi hỏi xử lý vật liệu nặng. Việc sử dụng robot giúp giảm sự tiếp xúc trực tiếp của công nhân với một số môi trường nguy hiểm và nâng cao tính ổn định của quy trình sản xuất. Đây là bước tiến quan trọng hướng đến nhà máy tự động hóa.',
      en: 'Unimate was one of the first industrial robots used in real production. It could carry out programmed movements, and was especially suited to repetitive work or handling heavy materials. Robots reduced workers’ direct contact with some dangerous conditions and made production more consistent. It was an important step towards the automated factory.',
    },
    sources: [
      {
        name: 'Guinness World Records',
        title: 'First industrial production robot',
        url: 'https://www.guinnessworldrecords.com/world-records/411563-first-industrial-production-robot',
      },
      { name: 'Wikipedia', title: 'Unimation', url: 'https://en.wikipedia.org/wiki/Unimation' },
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
    title: { vi: 'Bộ điều khiển logic khả trình (PLC)', en: 'The Programmable Logic Controller (PLC)' },
    facts: [
      ['developedBy', { vi: 'Nhiều nhóm kỹ sư và nhà sản xuất công nghiệp', en: 'Many groups of engineers and industrial manufacturers' }],
      ['time', { vi: 'Từ cuối thập niên 1960', en: 'From the late 1960s' }],
      ['field', { vi: 'Điều khiển tự động', en: 'Automatic control' }],
    ],
    short: {
      vi: 'PLC là thiết bị điều khiển máy móc bằng chương trình có thể thay đổi. Nó được dùng để vận hành băng chuyền, động cơ và máy đóng gói, giúp nhà máy tự động hóa quy trình và điều chỉnh sản xuất linh hoạt hơn.',
      en: 'A PLC controls machines with a program that can be changed. It runs conveyors, motors and packaging machines, helping factories automate their processes and adjust production more flexibly.',
    },
    long: {
      vi: 'PLC là thiết bị điều khiển công nghiệp có thể được lập trình để thực hiện các nhiệm vụ cụ thể. Thay vì phải thay đổi toàn bộ hệ thống điều khiển bằng dây nối khi quy trình sản xuất thay đổi, kỹ sư có thể điều chỉnh chương trình của PLC. Thiết bị này thường được dùng để điều khiển băng chuyền, động cơ, máy đóng gói và nhiều hệ thống tự động khác. PLC giúp quy trình sản xuất linh hoạt và dễ kiểm soát hơn.',
      en: 'A PLC is an industrial controller that can be programmed for specific tasks. When a production process changes, engineers adjust the PLC’s program instead of rewiring the whole control system. PLCs commonly control conveyors, motors, packaging machines and many other automated systems. They make production more flexible and easier to control.',
    },
    sources: [
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

  // ---------- CMCN 4 ----------
  'ir4-overview': {
    title: { vi: 'Tổng quan CMCN 4', en: 'IR 4 Overview' },
    facts: [['period', { vi: 'Đầu thế kỷ XXI đến nay', en: 'The early 21st century to today' }]],
    long: {
      vi: 'Cuộc Cách mạng Công nghiệp lần thứ tư kết hợp trí tuệ nhân tạo, Internet vạn vật, dữ liệu lớn, robot và công nghệ sản xuất mới. Máy móc không chỉ tự động thực hiện nhiệm vụ mà còn có thể thu thập dữ liệu và hỗ trợ ra quyết định. Các công nghệ này giúp tăng chất lượng và giảm lãng phí, nhưng đặt ra thách thức về bảo mật, chi phí, việc làm và kỹ năng lao động.',
      en: 'The Fourth Industrial Revolution brings together artificial intelligence, the Internet of Things, big data, robots and new production technologies. Machines not only carry out tasks automatically, but can also collect data and support decisions. These technologies raise quality and reduce waste, but bring challenges in security, cost, jobs and workers’ skills.',
    },
    sources: [WEF],
  },
  'ir4-1': {
    title: { vi: 'Kiểm tra chất lượng bằng AI', en: 'AI Quality Inspection' },
    facts: [
      ['developedBy', { vi: 'Nhiều nhóm nghiên cứu và doanh nghiệp công nghệ', en: 'Many research groups and technology companies' }],
      ['time', { vi: 'Phát triển mạnh trong thế kỷ XXI', en: 'Grew rapidly in the 21st century' }],
      ['field', { vi: 'AI và kiểm soát chất lượng', en: 'AI and quality control' }],
    ],
    short: {
      vi: 'AI phân tích hình ảnh sản phẩm để phát hiện lỗi như vết nứt hoặc sai lệch bề mặt. Công nghệ giúp kiểm tra nhanh và nhất quán hơn, nhưng vẫn cần dữ liệu phù hợp và sự giám sát của con người.',
      en: 'AI analyses images of products to find defects such as cracks or surface flaws. It makes inspection faster and more consistent, but still needs suitable data and human oversight.',
    },
    long: {
      vi: 'Hệ thống kiểm tra chất lượng bằng AI sử dụng camera và thuật toán để phân tích hình ảnh sản phẩm. Hệ thống có thể phát hiện những dấu hiệu bất thường như vết nứt, sai lệch kích thước hoặc lỗi bề mặt. Khi được huấn luyện bằng dữ liệu phù hợp, AI hỗ trợ kiểm tra nhiều sản phẩm trong thời gian ngắn và giúp phát hiện lỗi nhất quán hơn. Tuy nhiên, kết quả vẫn cần được kiểm tra và giám sát phù hợp để tránh bỏ sót lỗi hoặc đánh giá sai.',
      en: 'AI quality inspection uses cameras and algorithms to analyse images of products. It can spot signs of trouble such as cracks, wrong dimensions or surface defects. Trained on suitable data, AI helps check many products in a short time and find defects more consistently. But its results still need proper checking and oversight, so that no defect is missed or misjudged.',
    },
    sources: [
      {
        name: 'IEEE Access (Prunella et al., 2023)',
        title: 'Deep Learning for Automatic Vision-Based Recognition of Industrial Surface Defects: A Survey',
        url: 'https://doi.org/10.1109/ACCESS.2023.3271748',
      },
    ],
  },
  'ir4-2': {
    title: { vi: 'Internet vạn vật công nghiệp (IIoT)', en: 'The Industrial Internet of Things (IIoT)' },
    facts: [
      ['developedBy', { vi: 'Nhiều doanh nghiệp và tổ chức công nghệ công nghiệp', en: 'Many industrial technology companies and organisations' }],
      ['time', { vi: 'Phát triển mạnh từ cuối thế kỷ XX đến thế kỷ XXI', en: 'Grew rapidly from the late 20th into the 21st century' }],
      ['field', { vi: 'Kết nối thiết bị và thu thập dữ liệu', en: 'Connecting devices and collecting data' }],
    ],
    short: {
      vi: 'IIoT kết nối máy móc và cảm biến để thu thập, trao đổi dữ liệu. Nhờ đó, nhà máy có thể theo dõi thiết bị, sản lượng và năng lượng hiệu quả hơn, đồng thời cần chú trọng an ninh mạng.',
      en: 'IIoT connects machines and sensors to collect and share data. Factories can then monitor equipment, output and energy more effectively, but must take cybersecurity seriously.',
    },
    long: {
      vi: 'IIoT là việc kết nối máy móc, cảm biến và thiết bị công nghiệp qua mạng để thu thập và trao đổi dữ liệu. Nhờ đó, người quản lý có thể theo dõi tình trạng thiết bị, sản lượng và mức tiêu thụ năng lượng. Dữ liệu được cập nhật thường xuyên giúp nhà máy phát hiện vấn đề sớm hơn và phối hợp hoạt động giữa các bộ phận hiệu quả hơn. Tuy nhiên, hệ thống kết nối cũng cần được bảo vệ trước các nguy cơ an ninh mạng.',
      en: 'IIoT means connecting industrial machines, sensors and equipment over a network to collect and share data. Managers can then follow the condition of equipment, output and energy use. Regularly updated data helps factories catch problems earlier and coordinate their departments better. But connected systems also need protecting against cyber threats.',
    },
    sources: [{ name: 'SAP', title: 'What is the Industrial Internet of Things (IIoT)?', url: 'https://www.sap.com/resources/what-is-iiot' }],
  },
  'ir4-3': {
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
  'ir4-4': {
    title: { vi: 'Bản sao số (Digital Twin)', en: 'The Digital Twin' },
    facts: [
      ['developedBy', { vi: 'Nhiều nhóm nghiên cứu và doanh nghiệp công nghệ', en: 'Many research groups and technology companies' }],
      ['time', { vi: 'Được ứng dụng rộng hơn trong thế kỷ XXI', en: 'Used more widely in the 21st century' }],
      ['field', { vi: 'Mô phỏng và quản lý hệ thống', en: 'Simulation and systems management' }],
    ],
    short: {
      vi: 'Bản sao số là mô hình kỹ thuật số đại diện cho một thiết bị hoặc hệ thống thực tế. Nó hỗ trợ theo dõi hoạt động, thử nghiệm phương án và phân tích hiệu suất trước khi thay đổi hệ thống thật.',
      en: 'A digital twin is a digital model that stands for a real device or system. It helps monitor operations, test options and analyse performance before the real system is changed.',
    },
    long: {
      vi: 'Bản sao số là mô hình kỹ thuật số đại diện cho một thiết bị, quy trình hoặc hệ thống thực tế. Khi được kết nối với dữ liệu phù hợp, mô hình có thể phản ánh trạng thái hoạt động của đối tượng và hỗ trợ thử nghiệm các phương án thay đổi. Trong nhà máy, bản sao số giúp kỹ sư quan sát quy trình, phân tích hiệu suất và dự đoán ảnh hưởng của một số điều chỉnh trước khi áp dụng ngoài thực tế. Giá trị của nó phụ thuộc vào độ chính xác của mô hình và dữ liệu đầu vào.',
      en: 'A digital twin is a digital model that represents a real device, process or system. Connected to suitable data, it can mirror how the real thing is working and help test possible changes. In factories, digital twins let engineers watch processes, analyse performance and predict the effect of some adjustments before making them for real. Its value depends on how accurate the model and its data are.',
    },
    sources: [
      { name: 'Britannica', title: 'digital twin', url: 'https://www.britannica.com/technology/digital-twin' },
      { name: 'Wikipedia', title: 'Digital twin', url: 'https://en.wikipedia.org/wiki/Digital_twin' },
    ],
  },
  'ir4-5': {
    title: { vi: 'Robot cộng tác (Cobot)', en: 'The Collaborative Robot (Cobot)' },
    facts: [
      [
        'developedBy',
        {
          vi: 'Nhiều doanh nghiệp chế tạo robot; thuật ngữ cobot xuất hiện từ thập niên 1990',
          en: 'Many robot makers; the word “cobot” dates from the 1990s',
        },
      ],
      ['time', { vi: 'Phát triển và ứng dụng mạnh trong thế kỷ XXI', en: 'Developed and widely used in the 21st century' }],
      ['field', { vi: 'Robot và sản xuất thông minh', en: 'Robotics and smart manufacturing' }],
    ],
    short: {
      vi: 'Cobot hỗ trợ con người trong các công việc như lắp ráp, gắp đặt và đóng gói. Robot giúp quy trình linh hoạt hơn, nhưng cần được đánh giá rủi ro và trang bị biện pháp an toàn phù hợp.',
      en: 'Cobots help people with tasks such as assembly, picking and placing, and packing. They make processes more flexible, but need a risk assessment and proper safety measures.',
    },
    long: {
      vi: 'Robot cộng tác được thiết kế để hỗ trợ con người trong những nhiệm vụ sản xuất nhất định. Tùy theo thiết kế và hệ thống an toàn, cobot có thể hỗ trợ lắp ráp, gắp đặt, đóng gói hoặc xử lý những thao tác lặp lại. Việc kết hợp khả năng của robot với kinh nghiệm của con người giúp quy trình sản xuất linh hoạt hơn. Tuy nhiên, cobot vẫn cần được đánh giá rủi ro và lắp đặt biện pháp bảo vệ phù hợp trước khi làm việc gần con người.',
      en: 'Collaborative robots are designed to help people with particular production tasks. Depending on their design and safety systems, cobots can help with assembly, picking and placing, packing or repetitive movements. Combining a robot’s abilities with human experience makes production more flexible. But a cobot still needs a risk assessment and proper safeguards before it works near people.',
    },
    sources: [
      { name: 'Northwestern University (Michael Peshkin)', title: 'Cobots', url: 'https://peshkin.mech.northwestern.edu/cobot/' },
      {
        name: 'Association for Advancing Automation',
        title: 'ISO/TS 15066 explained',
        url: 'https://www.automate.org/tech-papers/iso-ts-15066-explained',
      },
    ],
  },
  'ir4-6': {
    title: { vi: 'Bảo trì dự đoán bằng dữ liệu', en: 'Data-Driven Predictive Maintenance' },
    facts: [
      ['developedBy', { vi: 'Nhiều doanh nghiệp và nhóm kỹ thuật công nghiệp', en: 'Many companies and industrial engineering teams' }],
      [
        'time',
        {
          vi: 'Được mở rộng nhờ cảm biến, phân tích dữ liệu và AI hiện đại',
          en: 'Expanded thanks to sensors, data analysis and modern AI',
        },
      ],
      ['field', { vi: 'Quản lý thiết bị và bảo trì', en: 'Equipment management and maintenance' }],
    ],
    short: {
      vi: 'Hệ thống phân tích dữ liệu cảm biến để phát hiện dấu hiệu máy móc có nguy cơ hỏng hóc. Nhờ đó, doanh nghiệp có thể lên kế hoạch bảo trì sớm, giảm thời gian dừng máy và chi phí sửa chữa, dù kết quả dự đoán vẫn có thể sai lệch.',
      en: 'The system analyses sensor data to spot signs that a machine may fail. Companies can then plan maintenance early, cutting downtime and repair costs, though predictions can still be wrong.',
    },
    long: {
      vi: 'Bảo trì dự đoán sử dụng dữ liệu từ cảm biến và lịch sử vận hành để nhận biết dấu hiệu bất thường của máy móc. Thay vì chỉ sửa chữa sau khi thiết bị hỏng hoặc bảo trì theo lịch cố định, doanh nghiệp có thể lên kế hoạch kiểm tra khi dữ liệu cho thấy nguy cơ sự cố tăng lên. Phương pháp này có thể giảm thời gian dừng máy và hạn chế chi phí phát sinh. Tuy nhiên, dự đoán vẫn có sai số và cần được kết hợp với chuyên môn của kỹ thuật viên.',
      en: 'Predictive maintenance uses sensor data and operating history to recognise signs of trouble in machines. Instead of repairing equipment only after it breaks, or servicing it on a fixed schedule, companies can plan checks when the data shows the risk of failure is rising. This can cut downtime and limit unexpected costs. But predictions still have errors, and must be combined with technicians’ expertise.',
    },
    sources: [
      {
        name: 'US Department of Energy (FEMP)',
        title: 'Operations & Maintenance Best Practices: A Guide to Achieving Operational Efficiency, Release 3.0 (2010)',
        url: 'https://www.energy.gov/eere/femp/articles/operations-and-maintenance-best-practices-guide-achieving-operational-efficiency',
      },
    ],
  },

  // ---------- Game Room ----------
  // (The minigame is not finished yet: this board stays a placeholder.)
  'quiz-info': {
    title: { vi: 'Trò chơi câu hỏi', en: 'The Quiz' },
    facts: [],
    short: {
      vi: `Câu hỏi về bốn cuộc Cách mạng Công nghiệp hiện trên bức tường cuối phòng. Nhắm vào đáp án quý khách chọn rồi nhấn E. ${NOTE.vi}`,
      en: `Questions about the four Industrial Revolutions appear on the back wall. Aim at the answer you choose and press E. ${NOTE.en}`,
    },
    long: {
      vi: `Câu hỏi về bốn cuộc Cách mạng Công nghiệp hiện trên bức tường cuối phòng. Nhắm vào đáp án quý khách chọn rồi nhấn E. ${NOTE.vi}`,
      en: `Questions about the four Industrial Revolutions appear on the back wall. Aim at the answer you choose and press E. ${NOTE.en}`,
    },
    sources: [],
    placeholder: true,
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
  texts['hall-credits'] = {
    title: lang === 'vi' ? 'Ghi công' : 'Credits',
    facts: [],
    summary:
      lang === 'vi'
        ? 'Phông chữ, vật liệu, âm thanh và mô hình dùng trong bảo tàng, cùng tác giả và giấy phép.'
        : 'The font, textures, sounds and models used in the museum, with their authors and licences.',
    body:
      credits
        // (Sound credits only while sound is switched on, see src/features.ts.)
        .filter((c) => AUDIO_ENABLED || !c.files.every((file) => file.startsWith('sounds/')))
        .map((c) => `${c.item[lang]} - ${c.author} (${c.licence[lang]})`)
        .join('; ') + '.',
    sources: [],
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
