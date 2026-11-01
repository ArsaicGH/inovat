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
    diagram: 'twin',
    aspect: 2.1,
    caption: {
      vi: 'Sơ đồ minh họa: bản sao số nhận dữ liệu từ thiết bị thật; các phương án được thử trên bản sao trước khi áp dụng',
      en: 'Diagram: the digital twin receives data from the real machine; changes are tried on the twin before they are applied',
    },
    labels: {
      vi: ['Thiết bị thật', 'Bản sao số', 'Dữ liệu vận hành', 'Phương án đã thử'],
      en: ['Real machine', 'Digital twin', 'Operating data', 'Tested changes'],
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
        'IR 1', 'About the mid-18th to the mid-19th century', 'Steam and mechanical machinery',
        'IR 2', 'Late 19th to early 20th century', 'Electricity and mass production',
        'IR 3', 'Second half of the 20th century', 'Electronics, computers and automation',
        'IR 4', 'Early 21st century to today', 'AI, the Internet of Things and data',
      ],
    },
  },

  // ---------- The wall galleries ----------
  'wall-ir1-1': photo('wall-ir1-1', 1.089, { vi: '“Lò rèn sắt”, tranh của Joseph Wright of Derby (1772)', en: '“An Iron Forge”, painting by Joseph Wright of Derby (1772)' }, same('Joseph Wright of Derby'), PD, 'Joseph_Wright_of_Derby_(1734-1797)_-_An_Iron_Forge_-_T06670_-_Tate.jpg'),
  'wall-ir1-2': photo('wall-ir1-2', 1.195, { vi: 'Cầu Sắt (Iron Bridge) ở Coalbrookdale, tranh của William Williams (1780)', en: 'The Iron Bridge at Coalbrookdale, painting by William Williams (1780)' }, same('William Williams'), PD, 'William_Williams_The_Iron_Bridge.jpg'),
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
  'wall-ir2-2': photo(
    'wall-ir2-2',
    0.686,
    { vi: 'Gian trưng bày của Đức tại Triển lãm Điện quốc tế đầu tiên ở Paris (1881), tranh khắc trên tạp chí Die Gartenlaube', en: 'The German section of the first International Electrical Exhibition in Paris (1881), an engraving from Die Gartenlaube' },
    same('Ernst Hinkefuß, Martin Lämmel'),
    PD,
    'Die_Gartenlaube_(1881)_b_713.jpg',
  ),
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
  'wall-ir3-2': photo('wall-ir3-2', 1.397, { vi: 'Bo mạch chủ của máy tính IBM PC (1981)', en: 'The motherboard of the IBM PC (1981)' }, same('German (Wikipedia)'), cc('CC BY-SA 3.0'), 'IBM_PC_Motherboard_(1981).jpg'),
  'wall-ir3-3': photo('wall-ir3-3', 0.408, { vi: 'Điện thoại di động Motorola DynaTAC 8000X, sản xuất năm 1984', en: 'A Motorola DynaTAC 8000X mobile phone from 1984' }, same('Redrum0486'), cc('CC BY-SA 3.0'), 'DynaTAC8000X.jpg'),
  'wall-ir3-4': photo('wall-ir3-4', 1.333, { vi: 'Máy tính NeXT mà Tim Berners-Lee dùng làm máy chủ Web đầu tiên, trưng bày tại CERN', en: 'The NeXT computer Tim Berners-Lee used as the first Web server, on display at CERN' }, same('Coolcaesar (Wikipedia)'), cc('CC BY-SA 3.0'), 'First_Web_Server.jpg'),
  'wall-ir4-1': photo('wall-ir4-1', 1.333, { vi: 'Một trung tâm dữ liệu tại Đại học Virginia Tech (Mỹ), năm 2008', en: 'A data centre at Virginia Tech, USA, 2008' }, same('Christopher Bowns'), cc('CC BY-SA 2.0'), 'Virginia_Tech_-_data_center.jpg'),
  'wall-ir4-2': photo('wall-ir4-2', 0.486, { vi: 'Robot cộng tác UR5', en: 'A UR5 collaborative robot' }, same('GrowSkills Robotics'), cc('CC BY-SA 4.0'), 'Cobot.jpg'),
  'wall-ir4-3': photo('wall-ir4-3', 0.753, { vi: 'Máy in 3D đang in một vật thể', en: 'A 3D printer at work' }, same('MukhtaromST'), CC0, '3D_Printing.jpg'),
  'wall-ir4-4': photo('wall-ir4-4', 1.501, { vi: 'Xe tự lái của Waymo trên đường phố Mountain View (Mỹ), năm 2017', en: 'A Waymo self-driving car on the road in Mountain View, USA, 2017' }, same('Grendelkhan'), cc('CC BY-SA 4.0'), 'Waymo_self-driving_car_front_view.gk.jpg'),
}

// The wall gallery of each era room: two pictures on each side wall of the hall, in walking
// order (left wall front to back, then right wall back to front).
export const WALL_PICTURES: Record<'ir1' | 'ir2' | 'ir3' | 'ir4', string[]> = {
  ir1: ['wall-ir1-1', 'wall-ir1-2', 'wall-ir1-3', 'wall-ir1-4'],
  ir2: ['wall-ir2-1', 'wall-ir2-2', 'wall-ir2-3', 'wall-ir2-4'],
  ir3: ['wall-ir3-1', 'wall-ir3-2', 'wall-ir3-3', 'wall-ir3-4'],
  ir4: ['wall-ir4-1', 'wall-ir4-2', 'wall-ir4-3', 'wall-ir4-4'],
}

export const isWallPicture = (id: string | null): id is string => !!id && id.startsWith('wall-')
