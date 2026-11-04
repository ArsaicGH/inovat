// PICTURES around the museum: on each exhibit's board (in the room and enlarged) and in the
// gallery on the side walls of each era room. Photos, paintings and engravings come from
// Wikimedia Commons (public domain or Creative Commons; each is credited in credits.ts from
// this list). Diagrams are drawn by the museum itself (world/diagrams.ts), with the labels
// below. Captions describe only what the picture's own Commons page says.

import type { Language } from './language'
import type { DiagramId } from '../world/diagrams'

type Text = Record<Language, string>

export interface Picture {
  file?: string // a photo / painting / engraving in /public (pictures/<id>.webp)
  diagram?: DiagramId // or a diagram drawn by the museum
  labels?: Record<Language, string[]> // the diagram's labels
  era?: number // 0-3: the era whose icon a timeline or change diagram shows
  aspect: number // width / height
  caption: Text
  author?: Text
  licence?: Text
  source?: string // the picture's page on Wikimedia Commons
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:'
const UNKNOWN: Text = { vi: 'Không rõ tác giả', en: 'Unknown author' }
const PD: Text = { vi: 'Phạm vi công cộng', en: 'Public domain' }
const CC0: Text = { vi: 'CC0 (phạm vi công cộng)', en: 'CC0 (public domain)' }
// Creative Commons licences: the picture may be shared and adapted (here: made smaller for
// the web) with its author named; "SA" = adaptations keep the same licence.
const cc = (kind: string): Text => ({ vi: `${kind} (ghi công tác giả; đã thu nhỏ cho web)`, en: `${kind} (attribution; resized for the web)` })
const same = (name: string): Text => ({ vi: name, en: name })

function photo(id: string, aspect: number, caption: Text, author: Text, licence: Text, page: string): Picture {
  return { file: `pictures/${id}.webp`, aspect, caption, author, licence, source: COMMONS + page }
}

// THE ENTRANCE ROOMS' DIAGRAMS. The eras' names and periods, as on their overview boards.
const ERA_NAME: Record<Language, string[]> = { vi: ['CMCN 1', 'CMCN 2', 'CMCN 3', 'CMCN 4'], en: ['Industry 1.0', 'Industry 2.0', 'Industry 3.0', 'Industry 4.0'] }
const ERA_PERIOD: Record<Language, string[]> = {
  vi: ['Khoảng giữa thế kỷ XVIII - giữa thế kỷ XIX', 'Cuối thế kỷ XIX - đầu thế kỷ XX', 'Nửa sau thế kỷ XX', 'Đầu thế kỷ XXI đến nay'],
  en: ['About the mid-18th to the mid-19th century', 'The late 19th to the early 20th century', 'The second half of the 20th century', 'The early 21st century to today'],
}

// A timeline of an era room's inventions. entries: date, name, date, name... oldest first.
function timeline(era: number, entries: Record<Language, string[]>): Record<string, Picture> {
  return {
    [`wall-ir${era + 1}-timeline`]: {
      diagram: 'timeline',
      era,
      aspect: 2.2,
      caption: {
        vi: `Dòng thời gian các phát minh trong phòng ${ERA_NAME.vi[era]} (theo thứ tự, không theo tỉ lệ)`,
        en: `Timeline of the inventions in the ${ERA_NAME.en[era]} room (in order, not to scale)`,
      },
      labels: {
        vi: [`Dòng thời gian của phòng ${ERA_NAME.vi[era]}`, ERA_PERIOD.vi[era], ...entries.vi],
        en: [`Timeline of the ${ERA_NAME.en[era]} room`, ERA_PERIOD.en[era], ...entries.en],
      },
    },
  }
}

// What an era changed, from its overview text: driving forces, landmark inventions, results
// and the downside (CMCN 4, still going on: its challenges).
function change(era: number, texts: Record<Language, string[]>): Record<string, Picture> {
  const now = era === 3
  const heads: Record<Language, string[]> = {
    vi: ['Động lực', 'Phát minh tiêu biểu', 'Kết quả', now ? 'Thách thức' : 'Mặt trái'],
    en: ['Driving forces', 'Landmark inventions', 'Results', now ? 'Challenges' : 'The downside'],
  }
  const verb = { vi: now ? 'đang thay đổi' : 'đã thay đổi', en: now ? 'is changing' : 'changed' }
  const labels = (lang: Language, title: string) => [title, ...heads[lang].flatMap((head, i) => [head, texts[lang][i]])]
  return {
    [`wall-ir${era + 1}-change`]: {
      diagram: 'change',
      era,
      aspect: 2.2,
      caption: {
        vi: `Sơ đồ tóm tắt: ${ERA_NAME.vi[era]} ${verb.vi} điều gì (theo bảng tổng quan)`,
        en: `Summary diagram: what ${ERA_NAME.en[era]} ${verb.en} (from the overview board)`,
      },
      labels: {
        vi: labels('vi', `${ERA_NAME.vi[era]} ${verb.vi} điều gì?`),
        en: labels('en', now ? `What is ${ERA_NAME.en[era]} changing?` : `What did ${ERA_NAME.en[era]} change?`),
      },
    },
  }
}

export const PICTURES: Record<string, Picture> = {
  // ---------- CMCN 1 ----------
  'ir1-overview': photo(
    'ir1-overview',
    1.547,
    { vi: 'Dệt vải bằng máy dệt cơ khí, tranh khắc năm 1835', en: 'Power loom weaving, an engraving from 1835' },
    { vi: 'T. Allom (vẽ), J. Tingle (khắc)', en: 'T. Allom (artist), J. Tingle (engraver)' },
    PD,
    'Powerloom_weaving_in_1835.jpg',
  ),
  'ir1-1': photo(
    'ir1-1',
    1.384,
    {
      vi: 'Mặt cắt động cơ hơi nước tác dụng kép có bộ ngưng tụ của Watt, khoảng năm 1782 (phim kính chiếu)',
      en: 'Cross-section of Watt’s double-acting condensing steam engine, about 1782 (lantern slide)',
    },
    UNKNOWN,
    PD,
    "Lantern_Slide_-_Cross-Section_of_Watt's_Rotative_Double-Acting_Condensing_Steam_Engine,_Birmingham,_England,_circa_1782.jpg",
  ),
  'ir1-2': photo(
    'ir1-2',
    0.621,
    { vi: 'Một máy Water Frame của Arkwright chế tạo năm 1775, nay ở một bảo tàng tại Manchester', en: 'An Arkwright water frame made in 1775, now in a museum in Manchester' },
    same('Chris55 (Wikipedia)'),
    cc('CC BY 3.0'),
    'Arkwright-water-frame.jpg',
  ),
  'ir1-3': photo(
    'ir1-3',
    0.801,
    { vi: 'Thợ luyện đang khuấy mẻ gang trong lò khuấy (hình in năm 1917)', en: 'A puddler stirring (“rabbling”) a charge in a puddling furnace (published in 1917)' },
    same('Walter Macfarlane'),
    PD,
    'Puddling_furnace_Rabbling.jpg',
  ),
  'ir1-4': photo(
    'ir1-4',
    1.501,
    { vi: 'Bản sao năm 1931 của đầu máy Rocket (1829), tại Bảo tàng Khoa học và Công nghiệp Chicago', en: 'A 1931 replica of the 1829 Rocket, at the Museum of Science and Industry, Chicago' },
    same('Daderot'),
    CC0,
    'Robert_Stephenson_locomotive,_1931_replica_of_1829_original,_view_1_-_Museum_of_Science_and_Industry_(Chicago)_-_DSC06584.JPG',
  ),
  'ir1-5': {
    diagram: 'morse',
    aspect: 2.1,
    caption: {
      vi: 'Sơ đồ minh họa: tên bảo tàng, INOVAT, viết bằng mã Morse, đúng như chiếc khóa điện báo trong phòng đang gõ',
      en: 'Diagram: the museum’s name, INOVAT, written in Morse code, just as the telegraph key in this room taps it out',
    },
    labels: {
      vi: ['INOVAT', 'Chấm = tín hiệu ngắn, gạch = tín hiệu dài'],
      en: ['INOVAT', 'Dot = a short signal, dash = a long one'],
    },
  },

  // ---------- CMCN 2 ----------
  'ir2-overview': photo(
    'ir2-overview',
    1.613,
    { vi: '“Xưởng cán sắt”, tranh sơn dầu của Adolph Menzel (1872-1875)', en: '“The Iron Rolling Mill”, oil painting by Adolph Menzel (1872-1875)' },
    same('Adolph Menzel'),
    PD,
    'Adolph_Menzel_-_Eisenwalzwerk_-_Google_Art_Project.jpg',
  ),
  'ir2-1': photo(
    'ir2-1',
    1.571,
    { vi: 'Các lò thổi Bessemer đang hoạt động ở Pittsburgh (Mỹ), tranh khắc gỗ năm 1886', en: 'Bessemer converters at work in Pittsburgh, USA, a wood engraving from 1886' },
    same('Charles Graham (Library of Congress)'),
    PD,
    'Making_bessemer_steel_at_Pittsburgh_-_the_converters_at_work_-_drawn_by_Charles_Graham._LCCN93509654.jpg',
  ),
  'ir2-2': photo(
    'ir2-2',
    1.501,
    { vi: 'Xe Benz Patent-Motorwagen (1886) của Karl Benz, chạy bằng động cơ đốt trong bốn kỳ', en: 'Karl Benz’s Patent-Motorwagen (1886), powered by a four-stroke internal combustion engine' },
    same('Sicnag'),
    cc('CC BY 2.0'),
    '1886_Benz_Patent_Motorwagen_(29744182207).jpg',
  ),
  'ir2-3': photo(
    'ir2-3',
    0.667,
    {
      vi: 'Bóng đèn trình diễn năm 1879, được cho là bóng đèn đầu tiên thắp sáng trước công chúng (bộ sưu tập Henry Ford)',
      en: 'A demonstration light bulb of 1879, said to be the first light bulb lit in public (Henry Ford collections)',
    },
    same('Daderot'),
    CC0,
    'Demonstration_light_bulb,_stated_to_be_the_first_light_bulb_ever_lit_in_public,_1879,_from_Henry_Ford_collections_-_Museum_of_Science_and_Industry_(Chicago)_-_DSC06446.JPG',
  ),
  'ir2-4': photo('ir2-4', 1.386, { vi: 'Dây chuyền lắp ráp của Ford năm 1913', en: 'Ford’s assembly line in 1913' }, UNKNOWN, PD, 'Ford_assembly_line_-_1913.jpg'),
  'ir2-5': photo(
    'ir2-5',
    1.724,
    { vi: 'Bộ phát và bộ thu điện thoại thử nghiệm của Alexander Graham Bell, năm 1876', en: 'Alexander Graham Bell’s experimental telephone transmitter and receiver, 1876' },
    same('Elmer Ellsworth Burns'),
    PD,
    'Bell_Centennial_telephone_receiver_&_transmitter_1876.png',
  ),

  // ---------- CMCN 3 ----------
  'ir3-overview': photo(
    'ir3-overview',
    1.51,
    { vi: 'Phòng điều khiển sứ mệnh Apollo 11 của NASA khi chuyến bay kết thúc, tháng 7 năm 1969', en: 'NASA’s Mission Operations Control Room at the end of the Apollo 11 mission, July 1969' },
    same('NASA'),
    PD,
    'Mission_Operations_Control_Room_at_the_conclusion_of_Apollo_11.jpg',
  ),
  'ir3-1': photo('ir3-1', 1.501, { vi: 'Bộ vi xử lý Intel C4004', en: 'An Intel C4004 microprocessor' }, same('Thomas Nguyen'), cc('CC BY-SA 4.0'), 'Intel_C4004.jpg'),
  'ir3-2': photo(
    'ir3-2',
    1.077,
    { vi: 'Máy tính cá nhân IBM 5150 với màn hình đơn sắc IBM 5151 và bàn phím', en: 'The IBM 5150 personal computer with its IBM 5151 monochrome monitor and keyboard' },
    same('Ruben de Rijcke'),
    cc('CC BY-SA 3.0'),
    'Ibm_pc_5150.jpg',
  ),
  'ir3-3': photo(
    'ir3-3',
    1.086,
    { vi: 'Robot Unimate rót cà phê cho một phụ nữ tại khách sạn Biltmore, năm 1967', en: 'A Unimate robot pouring coffee for a woman at the Biltmore Hotel, 1967' },
    same('Frank Q. Brown, Los Angeles Times'),
    cc('CC BY 4.0'),
    'Unimate_pouring_coffee_for_a_woman_at_Biltmore_Hotel,_1967.jpg',
  ),
  'ir3-4': photo('ir3-4', 1.397, { vi: 'Sơ đồ logic của mạng ARPANET, tháng 3 năm 1977', en: 'Logical map of the ARPANET, March 1977' }, same('ARPANET'), PD, 'Arpanet_logical_map,_march_1977.png'),
  'ir3-5': photo('ir3-5', 1.5, { vi: 'Điện thoại di động Motorola DynaTAC bên cạnh một chiếc điện thoại thông minh Samsung Galaxy Note Edge', en: 'A Motorola DynaTAC mobile phone beside a Samsung Galaxy Note Edge smartphone' }, same('Umut Çolak'), PD, 'Motorola_DynaTAC_and_Samsung_Galaxy_Note_Edge.jpg'),

  // ---------- CMCN 4 ----------
  'ir4-overview': photo(
    'ir4-overview',
    1.499,
    {
      vi: 'Robot công nghiệp KUKA hàn điểm thân xe BMW 3 Series tại nhà máy BMW ở Leipzig (Đức), năm 2005',
      en: 'KUKA industrial robots spot-welding BMW 3 Series car bodies at BMW’s Leipzig plant, Germany, 2005',
    },
    same('BMW Werk Leipzig'),
    cc('CC BY-SA 2.0 DE'),
    'BMW_Leipzig_MEDIA_050719_Download_Karosseriebau_max.jpg',
  ),
  'ir4-1': photo('ir4-1', 1.333, { vi: 'Dãy máy in 3D tại Hackerspace Wrocław (Ba Lan)', en: 'A row of 3D printers at Hackerspace Wrocław, Poland' }, same('Majabojarska'), cc('CC BY 4.0'), '3D_printer_farm_at_Hackerspace_Wrocław.jpg'),
  'ir4-2': {
    diagram: 'iiot',
    aspect: 2.1,
    caption: {
      vi: 'Sơ đồ minh họa: cảm biến gửi dữ liệu qua mạng; hệ thống phân tích và báo cần bảo trì trước khi máy hỏng',
      en: 'Diagram: sensors send data over the network; the system analyses it and calls for maintenance before the machine fails',
    },
    labels: {
      vi: ['Cảm biến trên máy', 'Mạng kết nối', 'Phân tích dữ liệu', 'Bảo trì kịp thời'],
      en: ['Sensors on machines', 'Network', 'Data analysis', 'Timely maintenance'],
    },
  },
  'ir4-3': {
    diagram: 'neural',
    aspect: 1.9,
    caption: { vi: 'Sơ đồ minh họa mạng nơ-ron nhân tạo, cách tiếp cận chính của học sâu', en: 'Diagram of an artificial neural network, the main approach behind deep learning' },
    labels: { vi: ['Dữ liệu vào', 'Các lớp ẩn', 'Kết quả'], en: ['Input data', 'Hidden layers', 'Output'] },
  },
  'ir4-4': {
    diagram: 'cloud',
    aspect: 2.1,
    caption: {
      vi: 'Sơ đồ minh họa: máy móc và thiết bị gửi dữ liệu qua Internet lên các trung tâm dữ liệu của đám mây, nơi dữ liệu được lưu trữ, phân tích và dùng để huấn luyện AI',
      en: 'Diagram: machines and devices send data over the Internet to the cloud’s data centres, where it is stored, analysed and used to train AI',
    },
    labels: {
      vi: ['Máy móc, thiết bị', 'Internet', 'Trung tâm dữ liệu', 'Phân tích, AI'],
      en: ['Machines and devices', 'The Internet', 'Data centres', 'Analysis and AI'],
    },
  },
  'ir4-5': photo(
    'ir4-5',
    1.235,
    { vi: 'Robot cộng tác UR16e của hãng Universal Robots, cùng bộ điều khiển và bảng lập trình cầm tay', en: 'A UR16e collaborative robot by Universal Robots, with its controller and teach pendant' },
    same('Auledas'),
    cc('CC BY-SA 4.0'),
    'UR16e_robot_arm.png',
  ),
  'ir4-6': {
    diagram: 'dna',
    aspect: 2.1,
    caption: {
      vi: 'Sơ đồ minh họa: "chiếc kéo di truyền" CRISPR-Cas9 tìm đến một đoạn ADN chọn trước, cắt tại đó, và tế bào sửa lại đoạn gen',
      en: 'Diagram: the “genetic scissors” CRISPR-Cas9 find a chosen stretch of DNA, cut it there, and the cell repairs the gene',
    },
    labels: {
      vi: ['ADN', 'Cas9 cắt đúng vị trí', 'Gen đã được sửa'],
      en: ['DNA', 'Cas9 cuts at the chosen place', 'The edited gene'],
    },
  },

  // ---------- Intro hall: the route board ----------
  'hall-overview': {
    diagram: 'eras',
    aspect: 2.3,
    caption: { vi: 'Bốn cuộc Cách mạng Công nghiệp trên một dòng thời gian', en: 'The four Industrial Revolutions on one timeline' },
    // Name, period (as on each overview board) and theme (as on this board), for each era.
    labels: {
      vi: [
        'CMCN 1', 'Khoảng giữa thế kỷ XVIII - giữa thế kỷ XIX', 'Hơi nước và máy móc cơ khí',
        'CMCN 2', 'Cuối thế kỷ XIX - đầu thế kỷ XX', 'Điện năng và sản xuất hàng loạt',
        'CMCN 3', 'Nửa sau thế kỷ XX', 'Điện tử, máy tính và tự động hóa',
        'CMCN 4', 'Đầu thế kỷ XXI đến nay', 'Trí tuệ nhân tạo, Internet vạn vật và dữ liệu',
      ],
      en: [
        'Industry 1.0', 'About the mid-18th to the mid-19th century', 'Steam and mechanical machinery',
        'Industry 2.0', 'Late 19th to early 20th century', 'Electricity and mass production',
        'Industry 3.0', 'Second half of the 20th century', 'Electronics, computers and automation',
        'Industry 4.0', 'Early 21st century to today', 'AI, the Internet of Things and data',
      ],
    },
  },

  // ---------- The wall galleries ----------
  'wall-ir1-1': photo('wall-ir1-1', 1.089, { vi: '“Lò rèn sắt”, tranh của Joseph Wright of Derby (1772)', en: '“An Iron Forge”, painting by Joseph Wright of Derby (1772)' }, same('Joseph Wright of Derby'), PD, 'Joseph_Wright_of_Derby_(1734-1797)_-_An_Iron_Forge_-_T06670_-_Tate.jpg'),
  'wall-ir1-3': photo('wall-ir1-3', 1.568, { vi: '“Coalbrookdale về đêm”, tranh của Philip James de Loutherbourg (1801)', en: '“Coalbrookdale by Night”, painting by Philip James de Loutherbourg (1801)' }, same('Philip James de Loutherbourg'), PD, 'Philipp_Jakob_Loutherbourg_d._J._-_Coalbrookdale_by_Night_-_WGA13730.jpg'),
  'wall-ir1-4': photo(
    'wall-ir1-4',
    1.226,
    { vi: 'Tuyến đường sắt Liverpool - Manchester, tranh khắc tô màu năm 1831 theo bản vẽ của Thomas Talbot Bury', en: 'The Liverpool and Manchester Railway, a hand-coloured aquatint of 1831 after Thomas Talbot Bury' },
    { vi: 'S. G. Hughes, H. Pyall theo T. T. Bury', en: 'S. G. Hughes, H. Pyall after T. T. Bury' },
    PD,
    'Coloured_View_on_the_Liverpool_and_Manchester_Railway,_1831.jpg',
  ),
  'wall-ir2-1': photo('wall-ir2-1', 1.566, { vi: 'Các nữ điện thoại viên Nhật Bản tại tổng đài điện thoại, năm 1902', en: 'Japanese telephone operators at their switchboard, 1902' }, UNKNOWN, PD, 'Switchboard_in_the_early_1900s.jpg'),
  'wall-ir2-3': photo('wall-ir2-3', 1.395, { vi: 'Xe điện đầu tiên chạy bằng đường dây điện trên cao (Siemens, Paris, 1881)', en: 'The first tram powered by overhead electric lines (Siemens, Paris, 1881)' }, UNKNOWN, PD, 'Siemens-1881-Strassenbahn-Paris.jpg'),
  'wall-ir2-4': photo('wall-ir2-4', 0.786, { vi: 'Tháp Eiffel đang xây dựng, ảnh chụp ngày 23/11/1888', en: 'The Eiffel Tower under construction, photographed on 23 November 1888' }, same('Louis-Émile Durandelle'), PD, 'Louis-Emile_Durandelle,_The_Eiffel_Tower_-_State_of_the_Construction,_1888.jpg'),
  'wall-ir3-1': photo(
    'wall-ir3-1',
    0.862,
    { vi: 'Robot công nghiệp Unimate 500 PUMA (1983) với bộ điều khiển và màn hình, tại Bảo tàng Đức (Munich)', en: 'A Unimate 500 PUMA industrial robot (1983) with its control unit and terminal, at the Deutsches Museum, Munich' },
    same('Theoprakt'),
    cc('CC BY-SA 3.0'),
    'Unimate_500_PUMA_Deutsches_Museum.jpg',
  ),
  'wall-ir3-3': photo('wall-ir3-3', 0.408, { vi: 'Điện thoại di động Motorola DynaTAC 8000X, sản xuất năm 1984', en: 'A Motorola DynaTAC 8000X mobile phone from 1984' }, same('Redrum0486'), cc('CC BY-SA 3.0'), 'DynaTAC8000X.jpg'),
  'wall-ir3-4': photo('wall-ir3-4', 1.333, { vi: 'Máy tính NeXT mà Tim Berners-Lee dùng làm máy chủ Web đầu tiên, trưng bày tại CERN, nơi ông phát minh ra Web năm 1991', en: 'The NeXT computer Tim Berners-Lee used as the first Web server, on display at CERN, where he invented the Web in 1991' }, same('Coolcaesar (Wikipedia)'), cc('CC BY-SA 3.0'), 'First_Web_Server.jpg'),
  'wall-ir4-1': photo('wall-ir4-1', 1.499, { vi: 'Siêu máy tính Frontier tại Phòng thí nghiệm Quốc gia Oak Ridge (Hoa Kỳ), năm 2022 được xếp hạng nhanh nhất thế giới, cỗ máy đầu tiên đạt sức tính exaflop', en: 'The Frontier supercomputer at Oak Ridge National Laboratory, USA, ranked the world’s fastest in 2022, the first machine to reach exaflop performance' }, same('Oak Ridge National Laboratory'), cc('CC BY 2.0'), 'Frontier_supercomputer_(52280657003).jpg'),
  'wall-ir4-4': photo('wall-ir4-4', 1.501, { vi: 'Xe tự lái của Waymo trên đường phố Mountain View (Mỹ), năm 2017', en: 'A Waymo self-driving car on the road in Mountain View, USA, 2017' }, same('Grendelkhan'), cc('CC BY-SA 4.0'), 'Waymo_self-driving_car_front_view.gk.jpg'),

  // ---------- More of the gallery: beside the hall's doorway and in the entrance rooms ----------
  'wall-ir1-7': photo('wall-ir1-7', 1.56, { vi: '“Manchester nhìn từ đồi Kersal”, tranh của William Wyld (1852)', en: '“Manchester from Kersal Moor”, painting by William Wyld (1852)' }, same('William Wyld'), PD, 'Wyld,_William_-_Manchester_from_Kersal_Moor,_with_rustic_figures_and_goats_-_Google_Art_Project.jpg'),
  'wall-ir1-8': photo(
    'wall-ir1-8',
    1.459,
    { vi: 'Máy kéo sợi mule đang hoạt động, hình minh họa trong sách “Lịch sử ngành sản xuất bông ở Anh” của Edward Baines (1835)', en: 'Mule spinning in action, an illustration from Edward Baines’s “History of the Cotton Manufacture in Great Britain” (1835)' },
    same('Edward Baines'),
    PD,
    'Baines_1835-Mule_spinning.png',
  ),
  'wall-ir2-6': photo('wall-ir2-6', 1.676, { vi: 'Chuyến bay thành công đầu tiên của máy bay Wright Flyer, Kitty Hawk (Mỹ), 17/12/1903: bay được 36,6 m trong 12 giây', en: 'The first successful flight of the Wright Flyer, Kitty Hawk, USA, 17 December 1903: 36.6 m in 12 seconds' }, same('John T. Daniels'), PD, 'Wrightflyer.jpg'),
  'wall-ir2-7': photo(
    'wall-ir2-7',
    0.799,
    { vi: 'Tòa nhà Hành chính về đêm, nhìn từ Tòa nhà Điện tại Hội chợ Thế giới Chicago năm 1893', en: 'The Administration Building at night, seen from the Electricity Building at the 1893 World’s Columbian Exposition, Chicago' },
    same('William Henry Jackson'),
    PD,
    'Administration_Building_at_Night,_from_Electricity_Building,_William_Henry_Jackson,_1893.jpg',
  ),
  'wall-ir3-5': photo('wall-ir3-5', 1.5, { vi: 'Máy tính Apple II (1977) tại Bảo tàng Lịch sử Máy tính (Mỹ)', en: 'An Apple II computer (1977) at the Computer History Museum, USA' }, same('The wub'), cc('CC BY-SA 4.0'), 'Apple_II,_1977,_Computer_History_Museum.jpg'),
  'wall-ir3-6': photo('wall-ir3-6', 1.333, { vi: 'Cận cảnh một tấm wafer silic, trên đó các mạch tích hợp được khắc bằng phương pháp quang khắc', en: 'Close-up of a silicon wafer, on which integrated circuits are engraved by photolithography' }, same('Le hollandais volant'), cc('CC BY 4.0'), 'Silicon_wafer_close_view.jpg'),
  'wall-ir3-8': photo('wall-ir3-8', 1.5, { vi: 'Bộ hiển thị và bàn phím (DSKY) của máy tính dẫn đường Apollo, tại Bảo tàng Hàng không và Vũ trụ Quốc gia Hoa Kỳ', en: 'The display and keyboard (DSKY) of the Apollo Guidance Computer, at the US National Air and Space Museum' }, same('Tamorlan'), cc('CC BY-SA 3.0'), 'Apollo_Guidance_Computer_(NASM).JPG'),
  'wall-ir4-6': photo('wall-ir4-6', 0.594, { vi: 'Robot hình người Unitree G1 tại một triển lãm năm 2024', en: 'A Unitree G1 humanoid robot at an expo in 2024' }, same('Sayanesy'), CC0, 'Unitree_G1.jpg'),
  'wall-ir4-8': photo('wall-ir4-8', 0.931, { vi: 'Một lọ vắc-xin mRNA Comirnaty (Pfizer-BioNTech) ngừa COVID-19, năm 2021', en: 'A vial of the Comirnaty (Pfizer-BioNTech) mRNA vaccine against COVID-19, 2021' }, same('Alison Newman'), CC0, 'Pfizer-Comirnaty_vaccine_held_in_a_gloved_hand_-_October_2021.png'),

  'wall-ir1-9': photo('wall-ir1-9', 1.326, { vi: '“Các nhà máy của Arkwright”, tranh của Joseph Wright of Derby (khoảng 1795-1796), Bảo tàng và Phòng tranh Derby', en: '“Arkwright’s Mills”, painting by Joseph Wright of Derby (about 1795-1796), Derby Museum and Art Gallery' }, same('Joseph Wright of Derby'), PD, "Joseph_Wright_of_Derby_(1734-1797)_-_Arkwright's_Mills_-_2016-56-2_-_Derby_Museum_and_Art_Gallery.jpg"),
  'wall-ir3-9': photo('wall-ir3-9', 1.24, { vi: 'Phòng máy tính điều khiển sứ mệnh của NASA với hai máy IBM 7090, vào khoảng thời gian chuyến bay vũ trụ Mercury-Atlas 6 năm 1962', en: 'NASA’s mission control computer room with two IBM 7090s, around the time of the Mercury-Atlas 6 spaceflight in 1962' }, same('NASA'), PD, 'NASAComputerRoom7090.NARA.jpg'),
  'wall-ir4-9': photo('wall-ir4-9', 1.501, { vi: 'Một khu trưng bày tại Hội chợ Công nghiệp Hannover (Đức) năm 2016', en: 'Part of a hall at the Hannover Messe industrial fair, Germany, 2016' }, same('Bahnfrend'), cc('CC BY-SA 4.0'), 'Hannover_Messe_2016_(45).jpg'),
  'wall-ir4-10': photo('wall-ir4-10', 1.4, { vi: 'Khách tham quan chơi bóng bàn với robot thích ứng của Omron tại Hội chợ Hannover 2016', en: 'A visitor playing table tennis against Omron’s adaptive ping-pong robot at the Hannover Messe 2016' }, same('Bahnfrend'), cc('CC BY-SA 4.0'), 'Hannover_Messe_2016_(35).jpg'),

  // (Third round: fact pictures whose captions give the fact stated on their Commons page.)
  'wall-ir1-11': photo('wall-ir1-11', 0.667, { vi: 'Động cơ Smethwick, động cơ cổ nhất thế giới vẫn còn chạy được, tại bảo tàng ThinkTank ở Birmingham (Anh)', en: 'The Smethwick Engine, the world’s oldest engine still in working order, at the ThinkTank museum in Birmingham, UK' }, same('IMechE1'), cc('CC BY-SA 3.0'), 'Smethwick_Engine_at_ThinkTank_Museum.jpg'),
  'wall-ir1-12': photo('wall-ir1-12', 1.308, { vi: 'Puffing Billy, đầu máy hơi nước cổ nhất thế giới, tại Bảo tàng Khoa học London', en: 'Puffing Billy, the world’s oldest steam locomotive, at the Science Museum, London' }, same('Slashme'), cc('CC BY-SA 4.0'), 'Puffing_Billy_Side_view_London_Science_Museum.jpg'),
  'wall-ir1-13': photo('wall-ir1-13', 1.458, { vi: 'Cầu Sắt bắc qua sông Severn ở Shropshire (Anh), cây cầu đầu tiên trên thế giới làm bằng gang', en: 'The Iron Bridge over the River Severn in Shropshire, England, the first bridge in the world made of cast iron' }, same('Michal Osmenda'), cc('CC BY-SA 2.0'), 'The_Iron_Bridge_(2772205816).jpg'),
  'wall-ir1-14': photo(
    'wall-ir1-14',
    1.512,
    {
      vi: '“Người thợ mỏ than” trong sách The Costume of Yorkshire (1814) của George Walker; tranh cũng là hình minh họa đầu máy hơi nước đầu tiên từng được xuất bản (đầu máy do Murray và Blenkinsop chế tạo năm 1812)',
      en: '“The Collier” from George Walker’s The Costume of Yorkshire (1814); it is also the first published illustration of a locomotive (built by Murray and Blenkinsop in 1812)',
    },
    { vi: 'George Walker (bản phục chế: Rawpixel)', en: 'George Walker (enhanced by Rawpixel)' },
    cc('CC BY-SA 4.0'),
    'Illustration_from_The_Costume_of_Yorkshire_by_George_Walker,_digitally_enhanced_by_rawpixel-com_4.jpg',
  ),
  'wall-ir2-11': photo('wall-ir2-11', 0.639, { vi: '“Tháp Eiffel rực sáng trong Triển lãm Thế giới 1889”, tranh của Georges Garen (1889)', en: '“The Eiffel Tower ablaze with light during the 1889 World’s Fair”, painting by Georges Garen (1889)' }, same('Georges Garen'), PD, 'Georges_Garen_embrasement_tour_Eiffel.jpg'),
  'wall-ir2-12': photo('wall-ir2-12', 1.243, { vi: 'Dây chuyền lắp ráp tại nhà máy Highland Park của hãng Ford, năm 1913', en: 'An assembly line at the Ford Motor Company’s Highland Park plant, 1913' }, { vi: 'Không rõ tác giả (Thư viện Quốc hội Hoa Kỳ)', en: 'Unknown author (Library of Congress)' }, PD, "Assembly_line_at_the_Ford_Motor_Company's_Highland_Park_plant_LCCN2011661021.jpg"),
  'wall-ir2-13': photo('wall-ir2-13', 1.393, { vi: '“Cầu treo lớn trên sông East nối New York và Brooklyn”, tranh in màu của Currier & Ives (1883)', en: '“The Great East River Suspension Bridge, connecting the cities of New York and Brooklyn”, a colour print by Currier & Ives (1883)' }, same('Currier & Ives'), PD, 'Currier_and_Ives_Brooklyn_Bridge2_courtesy_copy.jpg'),
  'wall-ir2-14': photo(
    'wall-ir2-14',
    1.494,
    {
      vi: 'Mười máy phát điện Westinghouse 5.000 mã lực tại nhà máy điện Adams ở thác Niagara (Mỹ), nhà máy phát điện xoay chiều quy mô lớn đầu tiên trên thế giới, xây năm 1895',
      en: 'Ten 5,000-horsepower Westinghouse generators at the Adams Power Plant, Niagara Falls, the world’s first large-scale alternating current power plant, built in 1895',
    },
    same('Westinghouse Electric & Manufacturing Co.'),
    PD,
    'Westinghouse_Generators_at_Niagara_Falls.jpg',
  ),
  'wall-ir2-15': photo('wall-ir2-15', 1.558, { vi: 'Máy hát lá thiếc do Thomas Edison phát minh, John Kruesi chế tạo tại Menlo Park (Mỹ) tháng 12/1877', en: 'The tinfoil phonograph invented by Thomas Edison and built by John Kruesi at Menlo Park, New Jersey, in December 1877' }, same('National Park Service'), PD, "Edison's_1877_Cylinder_Tinfoil_Phonograph_(photo_1_of_2)_(5cc2641d-1dd8-b71b-0b6c-0871a45fb59a).jpg"),
  'wall-ir3-11': photo('wall-ir3-11', 1.052, { vi: 'Trung tâm máy tính của Đại học Kỹ thuật Aachen (Đức), năm 1970', en: 'The computer centre of the Technical University of Aachen, Germany, 1970' }, same('Jens Gathmann (Bundesarchiv)'), cc('CC BY-SA 3.0 DE'), 'Bundesarchiv_B_145_Bild-F031434-0006,_Aachen,_Technische_Hochschule,_Rechenzentrum.jpg'),
  'wall-ir3-12': photo('wall-ir3-12', 0.75, { vi: 'Deep Blue, máy tính đã đánh bại nhà vô địch cờ vua Garry Kasparov năm 1997', en: 'Deep Blue, the computer that beat chess champion Garry Kasparov in 1997' }, same('Erik Pitti'), cc('CC BY 2.0'), 'Say_hello_to_Deep_Blue_(2586059148).jpg'),
  'wall-ir3-13': photo(
    'wall-ir3-13',
    1.5,
    {
      vi: 'Con chuột máy tính nguyên mẫu đầu tiên, do Bill English chế tạo, được Douglas Engelbart dùng trong buổi trình diễn nổi tiếng năm 1968 (Bảo tàng Lịch sử Máy tính, Mỹ)',
      en: 'The first prototype computer mouse, built by Bill English and used by Douglas Engelbart in his famous 1968 demonstration (Computer History Museum, USA)',
    },
    same('Michael Hicks'),
    cc('CC BY 2.0'),
    "Douglas_Engelbart's_prototype_mouse_-_Computer_History_Museum.jpg",
  ),
  'wall-ir4-11': photo('wall-ir4-11', 0.769, { vi: 'Điện thoại thông minh hiển thị ứng dụng bản đồ', en: 'A smartphone showing a map app' }, same('Highways England'), cc('CC BY 2.0'), 'HA0478-006_(6011470974).jpg'),
  'wall-ir4-12': photo('wall-ir4-12', 0.766, { vi: 'Sophia, “công dân robot đầu tiên”, tại Hội nghị AI for Good năm 2018', en: 'Sophia, the “first robot citizen”, at the AI for Good Global Summit 2018' }, same('ITU Pictures'), cc('CC BY 2.0'), 'Sophia_at_the_AI_for_Good_Global_Summit_2018_(27254369807)_(cropped).jpg'),
  'wall-ir4-13': photo('wall-ir4-13', 1.333, { vi: 'Bác sĩ phẫu thuật chuẩn bị thực hiện ca bắc cầu nối với sự trợ giúp của robot da Vinci', en: 'A surgeon preparing to perform a bypass with the help of a da Vinci robot' }, same('Nicoleon'), cc('CC BY-SA 4.0'), 'Chirurgien_son_robot_da-vinci.JPG'),
  'wall-ir4-14': photo('wall-ir4-14', 1.775, { vi: 'Máy in 3D bê tông của Đại học Công nghệ Eindhoven (Hà Lan), dùng để nghiên cứu in bê tông', en: 'The 3D concrete printer of Eindhoven University of Technology (TU/e), used for research into printing concrete' }, same('Misanthropic One'), cc('CC BY 2.0'), '3D_Concrete_Printer.jpg'),

  // ---------- The entrance rooms' wall diagrams (drawn by the museum) ----------
  // Every date, name and idea comes from the room's own exhibit and overview texts
  // (content/exhibits.ts, with their sources): nothing that the boards do not say.
  ...timeline(0, {
    vi: ['1769', 'Động cơ hơi nước của Watt (bằng sáng chế)', '1769', 'Máy kéo sợi Water Frame (bằng sáng chế)', '1784', 'Luyện sắt bằng lò khuấy (bằng sáng chế)', '1829', 'Đầu máy xe lửa Rocket', '1837', 'Điện báo của Cooke và Wheatstone (bằng sáng chế)', '1844', 'Bức điện Morse đầu tiên'],
    en: ['1769', 'Watt’s steam engine (patent)', '1769', 'The Water Frame (patent)', '1784', 'Puddled iron (patent)', '1829', 'The Rocket locomotive', '1837', 'Cooke and Wheatstone’s telegraph (patent)', '1844', 'Morse’s first telegraph message'],
  }),
  ...timeline(1, {
    vi: [
      '1856', 'Luyện thép Bessemer (bằng sáng chế)',
      '1876', 'Động cơ bốn kỳ của Otto',
      '1876', 'Điện thoại của Bell (bằng sáng chế tại Hoa Kỳ)',
      '1879', 'Đèn sợi đốt',
      '1886', 'Xe Motorwagen của Benz (bằng sáng chế)',
      '1888', 'Động cơ cảm ứng xoay chiều',
      'Khoảng 1913', 'Dây chuyền lắp ráp',
    ],
    en: [
      '1856', 'The Bessemer process (patent)',
      '1876', 'Otto’s four-stroke engine',
      '1876', 'Bell’s telephone (US patent)',
      '1879', 'The incandescent lamp',
      '1886', 'Benz’s Motorwagen (patent)',
      '1888', 'The AC induction motor',
      'About 1913', 'The assembly line',
    ],
  }),
  ...timeline(2, {
    vi: [
      '1961', 'Robot Unimate làm việc tại nhà máy General Motors',
      'Cuối thập niên 1960', 'Bộ điều khiển logic khả trình (PLC)',
      '1969', 'Những kết nối đầu tiên của ARPANET',
      '1971', 'Bộ vi xử lý Intel 4004',
      '1973', 'Cuộc gọi đầu tiên từ điện thoại di động cầm tay',
      '1981', 'Máy tính cá nhân IBM 5150',
      '1989', 'Đề xuất World Wide Web',
    ],
    en: [
      '1961', 'The Unimate robot at work in a General Motors factory',
      'Late 1960s', 'The programmable logic controller (PLC)',
      '1969', 'ARPANET’s first connections',
      '1971', 'The Intel 4004 microprocessor',
      '1973', 'The first call from a handheld mobile phone',
      '1981', 'The IBM 5150 personal computer',
      '1989', 'The World Wide Web proposed',
    ],
  }),
  ...timeline(3, {
    vi: [
      '1956', 'Hội thảo Dartmouth đặt nền móng cho ngành AI',
      '1986', 'Bằng sáng chế kỹ thuật in 3D stereolithography',
      'Thập niên 1990', 'Robot cộng tác (cobot)',
      '1999', 'Thuật ngữ Internet vạn vật',
      '2003', 'Hoàn thành giải mã bộ gen người',
      '2006', 'Điện toán đám mây đại chúng',
      '2012', 'Công cụ chỉnh sửa gen CRISPR-Cas9',
      '2022', 'ChatGPT ra mắt',
      '2026', 'Luật AI của Việt Nam có hiệu lực',
    ],
    en: [
      '1956', 'The Dartmouth workshop founds the field of AI',
      '1986', 'Patent on stereolithography (3D printing)',
      '1990s', 'The collaborative robot (cobot)',
      '1999', 'The term “Internet of Things”',
      '2003', 'The human genome is read',
      '2006', 'Public cloud computing',
      '2012', 'The CRISPR-Cas9 gene-editing tool',
      '2022', 'ChatGPT released',
      '2026', 'Vietnam’s AI Law takes effect',
    ],
  }),
  ...change(0, {
    vi: ['Máy móc và năng lượng hơi nước', 'Động cơ hơi nước, máy kéo sợi, lò khuấy, đầu máy xe lửa, điện báo', 'Nhà máy ra đời, năng suất tăng, giao thông và liên lạc nhanh hơn', 'Điều kiện lao động khó khăn, ô nhiễm, đô thị phát triển nhanh chóng'],
    en: ['Machinery and steam power', 'The steam engine, the spinning frame, the puddling furnace, the locomotive, the telegraph', 'Factories, higher productivity, faster transport and communication', 'Harsh working conditions, pollution, rapidly growing cities'],
  }),
  ...change(1, {
    vi: ['Điện năng, kỹ thuật cơ khí và tiến bộ khoa học', 'Động cơ điện, dây chuyền lắp ráp, điện thoại', 'Nhà máy sản xuất quy mô lớn hơn; sản xuất, thông tin và đời sống thay đổi', 'Nhiều công việc trở nên lặp lại, đòi hỏi tổ chức lao động chặt chẽ'],
    en: ['Electricity, mechanical engineering and scientific progress', 'The electric motor, the assembly line, the telephone', 'Larger-scale factories; production, communication and daily life changed', 'Much work became repetitive and tightly organised'],
  }),
  ...change(2, {
    vi: ['Điện tử, máy tính và công nghệ thông tin', 'Máy tính, robot, bộ điều khiển lập trình, mạng máy tính, điện thoại di động, Web', 'Độ chính xác và năng suất tăng; trao đổi thông tin mở rộng', 'Nhu cầu việc làm và kỹ năng của người lao động thay đổi'],
    en: ['Electronics, computers and information technology', 'Computers, robots, programmable controls, computer networks, mobile phones, the Web', 'Greater accuracy and productivity; a wider exchange of information', 'Changes in the jobs and skills workers need'],
  }),
  ...change(3, {
    vi: ['Trí tuệ nhân tạo, dữ liệu, kết nối và sinh học', 'In 3D, nhà máy kết nối, AI, điện toán đám mây, robot tiên tiến, công nghệ sinh học', 'Máy móc thu thập dữ liệu, hỗ trợ ra quyết định; chất lượng tăng, lãng phí giảm; y học tiến bộ', 'Bảo mật, năng lượng, việc làm, kỹ năng lao động và đạo đức'],
    en: ['Artificial intelligence, data, connectivity and biology', '3D printing, the connected factory, AI, the cloud, advanced robots, biotechnology', 'Machines collect data and support decisions; higher quality, less waste; advances in medicine', 'Security, energy, jobs, workers’ skills and ethics'],
  }),
}

// The wall gallery of each era room (WallPictures.tsx). Three kinds of picture (leader), each
// chosen to tell its own part of the era's story, large and clear enough to read from a few
// metres away:
// - FIRST IMPRESSION: the two in the entrance room (ante: left and right of the doorway into
//   the hall), the most important, which shape how the visitor sees the era;
// - BIRD'S-EYE VIEW: the four around the era number on the hall's back wall (eraWall: top
//   left, bottom left, top right, bottom right): the era's main fields at a glance;
// - FASCINATING FACTS: one in the middle of each side wall of the hall (sides: left, right)
//   and one on each side of the doorway back to the entrance room (doorway: left, right as
//   seen from inside the hall), each caption giving a fact stated on the picture's page.
// Plus the entrance room's two wall diagrams (timeline on the left wall, change on the right).
export interface WallGallery {
  ante: [string, string]
  eraWall: [string, string, string, string]
  sides: [string, string]
  doorway: [string, string]
  timeline: string
  change: string
}
export const WALL_GALLERY: Record<'ir1' | 'ir2' | 'ir3' | 'ir4', WallGallery> = {
  // CMCN 1. First impression: the iron works ablaze at night, and the smoking factory city.
  // Bird's-eye: the mill, factory work, iron, the railway. Facts: oldest working engine,
  // oldest locomotive, first iron bridge, first published picture of a locomotive.
  ir1: {
    ante: ['wall-ir1-3', 'wall-ir1-7'],
    eraWall: ['wall-ir1-9', 'wall-ir1-8', 'wall-ir1-4', 'wall-ir1-1'],
    sides: ['wall-ir1-11', 'wall-ir1-12'],
    doorway: ['wall-ir1-13', 'wall-ir1-14'],
    timeline: 'wall-ir1-timeline',
    change: 'wall-ir1-change',
  },
  // CMCN 2. First impression: the Eiffel Tower lit by electricity, and the assembly line.
  // Bird's-eye: a steel bridge, the telephone exchange, a steel tower, a city lit at night.
  // Facts: first large AC power plant, first tram on overhead lines, the first flight, the
  // phonograph.
  ir2: {
    ante: ['wall-ir2-11', 'wall-ir2-12'],
    eraWall: ['wall-ir2-13', 'wall-ir2-1', 'wall-ir2-4', 'wall-ir2-7'],
    sides: ['wall-ir2-14', 'wall-ir2-3'],
    doorway: ['wall-ir2-6', 'wall-ir2-15'],
    timeline: 'wall-ir2-timeline',
    change: 'wall-ir2-change',
  },
  // CMCN 3. First impression: people at work in a computer centre, and the silicon chip.
  // Bird's-eye: the personal computer, the mobile phone, computers in spaceflight, the
  // industrial robot. Facts: Deep Blue, the first Web server, the first mouse, NASA's
  // computer room.
  ir3: {
    ante: ['wall-ir3-11', 'wall-ir3-6'],
    eraWall: ['wall-ir3-5', 'wall-ir3-3', 'wall-ir3-8', 'wall-ir3-1'],
    sides: ['wall-ir3-12', 'wall-ir3-4'],
    doorway: ['wall-ir3-13', 'wall-ir3-9'],
    timeline: 'wall-ir3-timeline',
    change: 'wall-ir3-change',
  },
  // CMCN 4. First impression: a connected smart factory (2016), and the first exascale
  // supercomputer (2022). Bird's-eye: the self-driving car, the smartphone, a humanoid robot
  // (2024), an mRNA vaccine (2021). Facts: the "first robot citizen" (2018), robot-assisted
  // surgery, a robot that adapts to its opponent (2016), printing with concrete. (Spread over
  // the era, from the early 2010s to the 2020s.)
  ir4: {
    ante: ['wall-ir4-9', 'wall-ir4-1'],
    eraWall: ['wall-ir4-4', 'wall-ir4-11', 'wall-ir4-6', 'wall-ir4-8'],
    sides: ['wall-ir4-12', 'wall-ir4-13'],
    doorway: ['wall-ir4-10', 'wall-ir4-14'],
    timeline: 'wall-ir4-timeline',
    change: 'wall-ir4-change',
  },
}

export const isWallPicture = (id: string | null): id is string => !!id && id.startsWith('wall-')
