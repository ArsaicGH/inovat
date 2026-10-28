# CONTENT.md: everything for Phase D (real content)

This is the content of the museum, ready to go into the game in Phase D (M10-M12). It is
built from the group's content document (linked at the top of `PLAN.md`) with:

- the welcome text chosen by the leader ("Linh", the first of the three drafts);
- small corrections (listed under "What changed from the doc" below);
- an English version of every text (the game is bilingual: Vietnamese first, English second);
- sources for every name, date and claim (researched 2026-10-28; re-check links before launch).

The Vietnamese texts are the group's own words, unchanged except for the corrections. The
English texts are translations of them: they add no new facts.

**Rules (CLAUDE.md):** every text in both languages; every fact with a real source; every
image, 3D model, sound and font credited in `src/content/credits.ts` (that is what puts it on
the intro hall's "Ghi công" board). Anything unsure is marked `[CẦN KIỂM TRA]` /
`[NEEDS CHECKING]`.

**Where things go in the game:** texts in `src/content/exhibits.ts` (ids in brackets below,
e.g. `ir1-1`), room names in `src/content/rooms.ts`, quiz in `src/content/quiz.ts`, models in
`public/models/<room>/`, credits in `src/content/credits.ts`.

Each invention has two texts: the **short text** goes on its board beside the pedestal, the
**long text** is shown when the board is enlarged. [CẦN KIỂM TRA: confirm this split, or use
only one of them.]

---

## What changed from the doc

1. Intro: "Linh" chosen; "Linh2" and "Linh3" removed. The museum's name, left blank in the
   doc, is **INOVAT** (subtitle "Bảo tàng Cách mạng Công nghiệp").
2. Rooms renumbered to match the game: Phòng 1 = intro hall, Phòng 2-5 = CMCN 1-4. (The doc
   called both CMCN 3 and CMCN 4 "Phòng 4".)
3. CMCN 3's period: "Từ khoảng thập niên 1970" became **"Nửa sau thế kỷ XX"**, because three of
   its inventions are older than 1970 (Unimate 1961, ARPANET 1969, PLC late 1960s).
4. Spinning Jenny: "khoảng 1764" kept, with its patent year added (1770).
5. Edison: "1879" kept, with "patent filed 1879, granted 1880" added.
6. Unimate's and 3D printing's short texts got the same "Nhân vật | Năm" line as the others
   (the doc left it out or put it in a different place).
7. The doc's "Mã hiện vật đề xuất" (P3-04, P3-05, P4-06) are replaced by the game's own ids
   (`ir3-4`, `ir3-5`, `ir4-6`).

---

## Museum name

- **INOVAT** (both languages)
- Subtitle: **Bảo tàng Cách mạng Công nghiệp** / **Museum of the Industrial Revolutions**

---

## Phòng 1: Intro hall (`hall`)

### Welcome (`hall-intro`)

**VI:** Chào mừng quý khách đến với Bảo tàng số về bốn cuộc Cách mạng Công nghiệp nơi lưu giữ
và giới thiệu những dấu mốc quan trọng trong lịch sử phát triển công nghiệp của nhân loại.
Thông qua bốn không gian trưng bày, quý khách sẽ được khám phá những phát minh tiêu biểu, từ
động cơ hơi nước và máy móc cơ khí, đến điện năng, máy tính, rô-bốt và trí tuệ nhân tạo. Mỗi
hiện vật không chỉ phản ánh một bước tiến về khoa học và công nghệ, mà còn cho thấy những thay
đổi sâu sắc trong cách con người lao động, sản xuất và sinh sống. Bảo tàng mong muốn mang đến
cho quý khách một góc nhìn toàn diện về hành trình phát triển của công nghiệp, đồng thời giúp
mỗi người hiểu rõ hơn những cơ hội, thách thức và trách nhiệm mà các tiến bộ công nghệ đặt ra
đối với xã hội. Kính mời quý khách bắt đầu hành trình khám phá bốn cuộc cách mạng công nghiệp
hành trình về sự sáng tạo, đổi mới và những thay đổi đã định hình thế giới ngày nay.

**EN:** Welcome to the digital museum of the four Industrial Revolutions, which preserves and
presents the key milestones in the history of human industry. Across four exhibition spaces,
you will discover landmark inventions, from the steam engine and mechanical machinery to
electricity, computers, robots and artificial intelligence. Each exhibit reflects not only a
step forward in science and technology, but also deep changes in how people work, produce and
live. The museum hopes to give you a complete view of the journey of industry, and to help
everyone better understand the opportunities, challenges and responsibilities that
technological progress brings to society. Please begin your journey through the four
industrial revolutions: a journey of creativity, innovation and the changes that have shaped
the world we live in today.

*(Proofreading suggestion for the Vietnamese, not applied: a comma or colon is missing before
"nơi lưu giữ" and before the second "hành trình".)*

### Other intro hall boards (not in the doc yet)

- **Overview** (`hall-overview`): a short guide to the four rooms. [CẦN KIỂM TRA: to write;
  the four room backgrounds below can be shortened for it.]
- **Our team** (`hall-team`): the group's names and roles. [CẦN KIỂM TRA: the group to provide.]
- **Credits** (`hall-credits`): filled automatically from `src/content/credits.ts`.
- **Sources** (`hall-sources`): the source list below, shortened. [CẦN KIỂM TRA: decide how
  many to show on the board.]

### Sources for the four-era framework

- Britannica, "Industrial Revolution": https://www.britannica.com/event/Industrial-Revolution
- Britannica, "The Industrial Revolution (1750-1900)":
  https://www.britannica.com/technology/history-of-technology/The-Industrial-Revolution-1750-1900
- World Economic Forum, Klaus Schwab, "The Fourth Industrial Revolution: what it means and how
  to respond" (2016; first: water and steam, second: electricity and mass production, third:
  electronics and IT, fourth: combining technologies):
  https://www.weforum.org/agenda/2016/01/the-fourth-industrial-revolution-what-it-means-and-how-to-respond/

---

## Phòng 2: CMCN 1 (`ir1`)

**Period:** Khoảng giữa thế kỷ XVIII - giữa thế kỷ XIX / About the mid-18th to the mid-19th century

### Background (`ir1-overview`)

**VI:** Cuộc Cách mạng Công nghiệp lần thứ nhất bắt đầu tại Anh vào nửa sau thế kỷ XVIII. Sản
xuất trước đó chủ yếu dựa vào sức người và công cụ thủ công. Sự phát triển của máy móc và năng
lượng hơi nước đã thúc đẩy sự ra đời của nhà máy, tăng năng suất và cải thiện giao thông. Tuy
nhiên, quá trình công nghiệp hóa cũng dẫn đến điều kiện lao động khó khăn, ô nhiễm và sự phát
triển nhanh chóng của đô thị.

**EN:** The First Industrial Revolution began in Britain in the second half of the 18th
century. Until then, production relied mainly on human strength and hand tools. Machinery and
steam power led to the rise of factories, raised productivity and improved transport. But
industrialisation also brought harsh working conditions, pollution and the rapid growth of
cities.

**Sources:**
- Britannica, "Industrial Revolution" (above).
- US National Park Service, "Lowell Handbook: The Industrial Revolution in England":
  https://www.nps.gov/articles/lowell-handbook-industrial-revolution-in-england.htm

### 1. Watt's improved steam engine (`ir1-1`)

- **Title:** Động cơ hơi nước cải tiến / Watt's improved steam engine
- **Person:** James Watt
- **Year:** 1769 (bằng sáng chế / patent)
- **Field:** Cơ khí, năng lượng / Mechanical engineering, energy
- **Term:** Steam engine (động cơ hơi nước)

**Short text**
- **VI:** James Watt cải tiến động cơ hơi nước, giúp giảm tiêu hao nhiên liệu và tăng hiệu quả
  hoạt động. Động cơ này thúc đẩy cơ giới hóa nhà máy và trở thành nguồn năng lượng quan trọng
  của thời kỳ công nghiệp hóa.
- **EN:** James Watt improved the steam engine, cutting its fuel use and making it work more
  efficiently. His engine drove the mechanisation of factories and became a key source of power
  in the age of industrialisation.

**Long text**
- **VI:** Máy hơi nước cải tiến của James Watt là một bước tiến quan trọng trong quá trình cơ
  giới hóa sản xuất. Điểm cải tiến nổi bật là bộ ngưng tụ riêng, giúp giảm lượng nhiệt bị lãng
  phí so với thiết kế trước đó. Nhờ nâng cao hiệu suất, loại máy này được ứng dụng rộng rãi
  trong các nhà máy, ngành khai mỏ và nhiều hoạt động công nghiệp. Thành tựu này góp phần chuyển
  sản xuất từ phụ thuộc chủ yếu vào sức người, sức vật và năng lượng tự nhiên sang sử dụng máy
  móc.
- **EN:** James Watt's improved steam engine was an important step in the mechanisation of
  production. Its key improvement was a separate condenser, which wasted far less heat than
  earlier designs. Being more efficient, the engine was widely used in factories, in mining and
  in many other industries. It helped move production away from relying mainly on human and
  animal strength and natural power, towards machines.

**Sources**
- Science Museum, "James Watt and the separate condenser" (patent granted 5 January 1769;
  engines with the condenser burned about two thirds less coal):
  https://blog.sciencemuseum.org.uk/james-watt-and-the-separate-condenser/
- Science Museum Group, James Watt:
  https://collection.sciencemuseumgroup.org.uk/people/ap24508/watt-james

### 2. Spinning Jenny (`ir1-2`)

- **Title:** Máy kéo sợi Spinning Jenny / The Spinning Jenny
- **Person:** James Hargreaves
- **Year:** Khoảng 1764 (bằng sáng chế năm 1770) / About 1764 (patented in 1770)
- **Field:** Công nghiệp dệt / Textile industry

**Short text**
- **VI:** Máy cho phép một người kéo nhiều sợi cùng lúc, làm tăng năng suất ngành dệt. Nó góp
  phần chuyển sản xuất từ thủ công tại gia đình sang quy mô lớn hơn, đồng thời thay đổi công
  việc truyền thống của người lao động.
- **EN:** The machine let one person spin several threads at once, raising productivity in
  textiles. It helped move production from hand work at home to a larger scale, and changed the
  traditional work of spinners.

**Long text**
- **VI:** Trước khi Spinning Jenny xuất hiện, việc kéo sợi chủ yếu được thực hiện bằng các công
  cụ thủ công và mất nhiều thời gian. Máy kéo sợi này cho phép một người vận hành nhiều cọc sợi
  cùng lúc, làm tăng đáng kể năng suất. Nhờ đó, ngành dệt có thể đáp ứng nhu cầu vải ngày càng
  lớn. Tuy nhiên, sự phát triển của máy móc cũng làm thay đổi công việc của những người thợ dệt
  và kéo sợi truyền thống.
- **EN:** Before the Spinning Jenny, spinning was done mostly with hand tools and took a long
  time. This machine let one person work many spindles at once, greatly raising output. The
  textile industry could then keep up with the growing demand for cloth. But machines also
  changed the work of traditional weavers and spinners.

**Sources**
- Britannica, "James Hargreaves" (the idea about 1764; one person spins several threads at
  once; patent 12 July 1770): https://www.britannica.com/biography/James-Hargreaves
- Backup: https://en.wikipedia.org/wiki/Spinning_jenny

### 3. Water Frame (`ir1-3`)

- **Title:** Máy kéo sợi Water Frame / The Water Frame
- **Person:** Richard Arkwright
- **Year:** 1769 (năm được cấp bằng sáng chế / patent)
- **Field:** Công nghiệp dệt / Textile industry

**Short text**
- **VI:** Water Frame sử dụng năng lượng nước để kéo sợi bền và sản xuất với quy mô lớn. Máy
  góp phần hình thành các nhà máy dệt tập trung, đánh dấu sự thay đổi quan trọng trong tổ chức
  sản xuất.
- **EN:** The Water Frame used water power to spin strong thread on a large scale. It helped
  give rise to centralised textile mills, a major change in how production was organised.

**Long text**
- **VI:** Water Frame sử dụng năng lượng từ dòng nước để vận hành các bộ phận kéo sợi. Máy có
  khả năng tạo ra sợi bền và phù hợp với việc sản xuất quy mô lớn. Vì cần nguồn năng lượng và
  không gian để lắp đặt máy móc, nhiều cơ sở sản xuất dần tập trung thành nhà máy. Sự phát
  triển này góp phần hình thành mô hình sản xuất công nghiệp tập trung, thay thế dần hoạt động
  thủ công tại các hộ gia đình.
- **EN:** The Water Frame used the power of flowing water to drive its spinning parts. It made
  strong thread and suited large-scale production. Because it needed a power source and space
  for the machines, workshops gradually came together in factories. This helped create
  centralised industrial production, which slowly replaced hand work in family homes.

**Sources**
- Grace's Guide, "Richard Arkwright" (patent July 1769 for roller spinning; called the "water
  frame" once powered by water at Cromford): https://gracesguide.co.uk/Richard_Arkwright
- Google Arts & Culture, Arkwright's roller-spinning patent:
  https://artsandculture.google.com/asset/richard-arkwright-s-roller-spinning-patent-richard-arkwright/JQEM1h62uI09kQ
- Backup (Cromford, often called the first water-powered cotton mill):
  https://en.wikipedia.org/wiki/Cromford_Mill

### 4. The Rocket locomotive (`ir1-4`)

- **Title:** Đầu máy xe lửa Rocket / The Rocket locomotive
- **Person:** Robert Stephenson và cộng sự / Robert Stephenson and colleagues
- **Year:** 1829
- **Field:** Giao thông vận tải / Transport

**Short text**
- **VI:** Rocket là đầu máy hơi nước nổi tiếng tại cuộc thi Rainhill Trials năm 1829. Nó thể
  hiện những cải tiến về hiệu suất đầu máy, góp phần thúc đẩy đường sắt, vận chuyển hàng hóa và
  kết nối các trung tâm công nghiệp.
- **EN:** Rocket is the steam locomotive made famous by the Rainhill Trials of 1829. It showed
  how much locomotives had improved, and helped drive the growth of railways, freight transport
  and links between industrial centres.

**Long text**
- **VI:** Rocket là đầu máy hơi nước nổi tiếng được chế tạo để tham gia cuộc thi Rainhill Trials
  tại Anh năm 1829. Thiết kế của đầu máy đã thể hiện những cải tiến quan trọng về hiệu suất và
  khả năng vận hành. Sự phát triển của đầu máy hơi nước góp phần mở rộng mạng lưới đường sắt,
  giúp con người vận chuyển hàng hóa và đi lại nhanh hơn. Đường sắt cũng kết nối các trung tâm
  sản xuất với thị trường, thúc đẩy thương mại và công nghiệp.
- **EN:** Rocket is a famous steam locomotive built for the Rainhill Trials in England in 1829.
  Its design showed important gains in efficiency and performance. Better steam locomotives
  helped railway networks spread, so goods and people could travel faster. Railways also linked
  centres of production with their markets, boosting trade and industry.

**Sources**
- Science Museum Group collection, "Stephenson's Rocket" (designed by Robert Stephenson; clear
  winner of the 1829 Rainhill trials for the Liverpool & Manchester Railway):
  https://collection.sciencemuseumgroup.org.uk/objects/co26704

---

## Phòng 3: CMCN 2 (`ir2`)

**Period:** Cuối thế kỷ XIX - đầu thế kỷ XX / The late 19th to the early 20th century

### Background (`ir2-overview`)

**VI:** Cuộc Cách mạng Công nghiệp lần thứ hai phát triển mạnh vào cuối thế kỷ XIX và đầu thế
kỷ XX. Điện năng, kỹ thuật cơ khí và các tiến bộ khoa học giúp nhà máy sản xuất với quy mô lớn
hơn. Động cơ điện, dây chuyền lắp ráp và điện thoại làm thay đổi sản xuất, giao thông thông tin
và đời sống. Tuy nhiên, sản xuất hàng loạt cũng khiến nhiều công việc trở nên lặp lại và đòi hỏi
tổ chức lao động chặt chẽ.

**EN:** The Second Industrial Revolution took off in the late 19th and early 20th centuries.
Electricity, mechanical engineering and scientific progress let factories produce on a larger
scale. The electric motor, the assembly line and the telephone changed production,
communication and daily life. But mass production also made much work repetitive and demanded
tightly organised labour.

**Sources:** Britannica, "Industrial Revolution"; World Economic Forum (both above).

### 1. The incandescent light bulb (`ir2-1`)

- **Title:** Đèn điện sợi đốt / The incandescent light bulb
- **Person:** Thomas Edison và nhóm cộng sự; nhiều nhà phát minh khác cũng đóng góp vào sự phát
  triển đèn điện / Thomas Edison and his team; many other inventors also contributed to electric
  lighting
- **Year:** 1879 (nộp đơn xin cấp bằng sáng chế; được cấp năm 1880) / 1879 (patent filed;
  granted in 1880)
- **Field:** Điện và chiếu sáng / Electricity and lighting

**Short text**
- **VI:** Những cải tiến của Edison và cộng sự góp phần tạo ra đèn điện có tính ứng dụng thực tế.
  Đèn điện giúp chiếu sáng nhà ở, đường phố và nhà máy, đồng thời thúc đẩy sự phát triển của hệ
  thống cung cấp điện.
- **EN:** Edison and his team's improvements helped create a practical electric lamp. Electric
  light lit up homes, streets and factories, and drove the growth of power supply networks.

**Long text**
- **VI:** Đèn điện sợi đốt là một trong những thành tựu tiêu biểu của quá trình phát triển hệ
  thống chiếu sáng bằng điện. Các thử nghiệm của Edison và cộng sự góp phần tạo ra loại đèn có
  tính ứng dụng thực tế cao hơn. Khi hệ thống điện được mở rộng, đèn điện giúp chiếu sáng nhà ở,
  đường phố và nhà máy. Nhờ đó, con người có thể làm việc và sinh hoạt thuận tiện hơn sau khi
  trời tối. Thành tựu này cũng góp phần thúc đẩy sự phát triển của mạng lưới cung cấp điện.
- **EN:** The incandescent light bulb is one of the landmark achievements in the development of
  electric lighting. The experiments of Edison and his team helped produce a far more practical
  lamp. As electricity networks spread, electric light lit up homes, streets and factories, so
  people could work and live more easily after dark. It also helped drive the growth of the power
  supply network.

**Sources**
- US National Archives (DocsTeach), "Patent application for the incandescent light bulb" (filed
  4 November 1879, granted 27 January 1880, patent 223,898):
  https://www.docsteach.org/documents/document/patent-application-incandescent-light-bulb
- Smithsonian, Edison's "New Year's Eve" lamp (public demonstration at Menlo Park, end of 1879):
  https://www.si.edu/object/edison-new-years-eve-lamp%3Anmah_704361
- Smithsonian, "Lighting a Revolution":
  https://americanhistory.si.edu/lighting/history/patents/ed_inc.htm
- For "other inventors" (e.g. Joseph Swan's lamp, 1878): ETHW, "Edison's Incandescent Lamp":
  https://ethw.org/Edison%27s_Incandescent_Lamp

### 2. The AC induction motor (`ir2-2`)

- **Title:** Động cơ điện cảm ứng xoay chiều / The AC induction motor
- **Person:** Nikola Tesla
- **Year:** 1888 (năm Tesla được cấp bằng sáng chế tại Hoa Kỳ cho các phát minh liên quan / the
  year Tesla received the related US patents)
- **Field:** Kỹ thuật điện / Electrical engineering

**Short text**
- **VI:** Động cơ biến điện năng thành chuyển động cơ học, giúp máy móc vận hành hiệu quả và linh
  hoạt hơn. Thành tựu này góp phần mở rộng việc sử dụng điện trong nhà máy và các hoạt động công
  nghiệp.
- **EN:** The motor turns electricity into mechanical motion, so machines run more efficiently
  and flexibly. It helped spread the use of electricity in factories and industry.

**Long text**
- **VI:** Động cơ điện cảm ứng xoay chiều biến điện năng thành chuyển động cơ học. Thiết kế của
  Tesla góp phần quan trọng vào sự phát triển của hệ thống điện xoay chiều và ứng dụng động cơ
  điện trong công nghiệp. So với việc phụ thuộc hoàn toàn vào máy hơi nước, động cơ điện có thể
  được bố trí tại nhiều vị trí khác nhau trong nhà máy. Công nghệ này hỗ trợ vận hành máy móc, bơm
  nước và nhiều thiết bị sản xuất.
- **EN:** The AC induction motor turns electrical energy into mechanical motion. Tesla's design
  played an important part in the development of alternating-current power systems and of
  electric motors in industry. Unlike a factory that depended entirely on one steam engine,
  electric motors could be placed wherever they were needed. The technology powered machines,
  water pumps and much other production equipment.

**Sources**
- IEEE Spectrum, "May 1888: Tesla files his patents for electric motor" (polyphase motor patents
  granted 1888; Westinghouse bought the AC patents in July 1888):
  https://spectrum.ieee.org/may-1888-tesla-files-his-patents-for-electric-motor
- The patent, US 381,968 "Electro-Magnetic Motor" (1 May 1888):
  https://patents.google.com/patent/US381968A/en

### 3. The assembly line (`ir2-3`)

- **Title:** Dây chuyền lắp ráp / The assembly line
- **Company:** Ford Motor Company
- **Year:** Khoảng 1913 / About 1913
- **Field:** Sản xuất công nghiệp / Industrial production

**Short text**
- **VI:** Dây chuyền lắp ráp chia quá trình sản xuất thành các công đoạn chuyên biệt. Việc áp
  dụng phương pháp này vào sản xuất ô tô Model T giúp tăng sản lượng, giảm thời gian lắp ráp và
  trở thành hình mẫu cho sản xuất hàng loạt.
- **EN:** The assembly line splits production into specialised steps. Using it to build the
  Model T raised output, cut assembly time and made it the model for mass production.

**Long text**
- **VI:** Dây chuyền lắp ráp giúp chia quá trình chế tạo sản phẩm thành nhiều công đoạn nhỏ.
  Mỗi công nhân hoặc nhóm công nhân phụ trách một nhiệm vụ cụ thể, trong khi sản phẩm di chuyển
  qua các vị trí làm việc. Ford áp dụng dây chuyền chuyển động vào sản xuất ô tô Model T, góp
  phần tăng sản lượng và giảm thời gian lắp ráp. Phương thức này trở thành một biểu tượng của sản
  xuất hàng loạt, dù cũng làm cho một số công việc trở nên đơn điệu và lặp lại.
- **EN:** The assembly line splits the making of a product into many small steps. Each worker or
  team does one specific task while the product moves past their stations. Ford used a moving
  line to build the Model T, raising output and cutting assembly time. The method became a
  symbol of mass production, even though it also made some jobs monotonous and repetitive.

**Sources**
- HISTORY.com, "Ford's assembly line starts rolling" (7 October 1913, Highland Park):
  https://www.history.com/this-day-in-history/october-7/moving-assembly-line-at-ford
- Assembly Magazine, "The Moving Assembly Line Turns 100" (building one car fell from about
  12.5 hours to under 6): https://www.assemblymag.com/articles/91581-the-moving-assembly-line-turns-100

### 4. The telephone (`ir2-4`)

- **Title:** Điện thoại / The telephone
- **Person:** Alexander Graham Bell
- **Year:** 1876 (năm Bell được cấp bằng sáng chế tại Hoa Kỳ / the year Bell received his US
  patent)
- **Field:** Viễn thông / Telecommunications

**Short text**
- **VI:** Điện thoại cho phép truyền giọng nói qua khoảng cách xa, giúp cá nhân và doanh nghiệp
  trao đổi thông tin nhanh hơn. Sự phát triển của mạng lưới điện thoại đặt nền móng cho các hệ
  thống liên lạc hiện đại.
- **EN:** The telephone carried the human voice over long distances, so people and businesses
  could share information faster. The growth of telephone networks laid the foundations of
  modern communication systems.

**Long text**
- **VI:** Điện thoại tạo ra bước tiến lớn trong việc truyền giọng nói qua khoảng cách xa. Thành
  tựu gắn với Alexander Graham Bell đã góp phần mở rộng khả năng liên lạc trực tiếp giữa con
  người, doanh nghiệp và các cơ quan. Khi mạng lưới điện thoại phát triển, việc trao đổi thông tin
  phục vụ kinh doanh và quản lý trở nên thuận tiện hơn. Điện thoại đặt nền móng cho quá trình phát
  triển lâu dài của các công nghệ truyền thông hiện đại.
- **EN:** The telephone was a great step forward in carrying the voice over long distances. The
  achievement linked to Alexander Graham Bell made direct contact between people, businesses and
  institutions far easier. As telephone networks grew, sharing information for business and
  administration became more convenient. The telephone laid the foundations for the long
  development of modern communication technology.

**Sources**
- Library of Congress, "Who is credited with inventing the telephone?":
  https://www.loc.gov/everyday-mysteries/categories/technology/item/who-is-credited-with-inventing-the-telephone/
- Britannica, "When was the telephone patented?" (US patent 174,465, 7 March 1876):
  https://www.britannica.com/question/When-was-the-telephone-patented

---

## Phòng 4: CMCN 3 (`ir3`)

**Period:** Nửa sau thế kỷ XX / The second half of the 20th century *(changed, see above)*

### Background (`ir3-overview`)

**VI:** Cuộc Cách mạng Công nghiệp lần thứ ba gắn liền với sự phát triển của điện tử, máy tính
và công nghệ thông tin từ nửa sau thế kỷ XX. Máy tính giúp xử lý dữ liệu, robot thực hiện các
thao tác lặp lại và hệ thống điều khiển lập trình tự động hóa nhà máy. Mạng máy tính mở rộng khả
năng trao đổi thông tin. Những công nghệ này tăng độ chính xác và năng suất, nhưng cũng làm thay
đổi nhu cầu việc làm và kỹ năng của người lao động.

**EN:** The Third Industrial Revolution is tied to the rise of electronics, computers and
information technology from the second half of the 20th century. Computers processed data,
robots took over repetitive tasks and programmable controls automated factories. Computer
networks widened the exchange of information. These technologies raised accuracy and
productivity, but also changed which jobs and skills workers needed.

**Sources:** World Economic Forum (above: "the Third used electronics and information
technology to automate production").

### 1. The Intel 4004 microprocessor (`ir3-1`)

- **Title:** Bộ vi xử lý Intel 4004 / The Intel 4004 microprocessor
- **Company:** Intel, phối hợp với Busicom trong dự án ban đầu / Intel, working with Busicom on
  the original project
- **Year:** 1971
- **Field:** Điện tử và máy tính / Electronics and computing

**Short text**
- **VI:** Intel 4004 là một trong những bộ vi xử lý thương mại đầu tiên trên một vi mạch đơn. Nó
  góp phần mở đường cho máy tính và thiết bị điện tử nhỏ gọn, trở thành nền tảng quan trọng của
  công nghệ số.
- **EN:** The Intel 4004 was one of the first commercial microprocessors on a single chip. It
  paved the way for compact computers and electronics, and became an important foundation of
  digital technology.

**Long text**
- **VI:** Intel 4004 là một trong những bộ vi xử lý thương mại đầu tiên được chế tạo trên một vi
  mạch đơn. Nó tích hợp các chức năng xử lý trung tâm vào một linh kiện nhỏ, mở ra hướng phát
  triển cho các thiết bị điện tử ngày càng gọn nhẹ. Công nghệ vi xử lý về sau trở thành nền tảng
  của máy tính cá nhân, thiết bị thông minh và nhiều hệ thống điều khiển công nghiệp.
- **EN:** The Intel 4004 was one of the first commercial microprocessors built on a single chip.
  It put the functions of a central processor into one small part, opening the way to ever
  smaller and lighter electronics. Microprocessors later became the basis of personal computers,
  smart devices and many industrial control systems.

**Sources**
- Intel, "Intel 4004" (the world's first commercially available microprocessor, developed for
  the Busicom calculator): https://www.intel.com/content/www/us/en/newsroom/resources/intel-4004.html
- Science Museum Group collection, Intel 4004 processor:
  https://collection.sciencemuseumgroup.org.uk/objects/co523245

### 2. The IBM 5150 personal computer (`ir3-2`)

- **Title:** Máy tính cá nhân IBM 5150 / The IBM 5150 personal computer
- **Company:** IBM
- **Year:** 1981
- **Field:** Máy tính và công nghệ thông tin / Computing and information technology

**Short text**
- **VI:** IBM 5150 đưa máy tính cá nhân đến gần hơn với văn phòng, trường học và gia đình. Máy hỗ
  trợ xử lý văn bản, tính toán và lưu trữ dữ liệu, góp phần thúc đẩy ngành công nghiệp phần mềm và
  máy tính.
- **EN:** The IBM 5150 brought the personal computer closer to offices, schools and homes. It
  handled word processing, calculation and data storage, and helped the software and computer
  industries grow.

**Long text**
- **VI:** IBM 5150 là mẫu máy tính cá nhân được IBM giới thiệu năm 1981. Máy góp phần đưa máy tính
  đến gần hơn với các văn phòng, doanh nghiệp, trường học và người dùng cá nhân. Máy tính cá nhân
  giúp xử lý văn bản, tính toán, lưu trữ dữ liệu và quản lý công việc hiệu quả hơn. Sự phổ biến
  của thiết bị này cũng thúc đẩy sự phát triển của phần mềm và ngành công nghiệp máy tính.
- **EN:** The IBM 5150 is the personal computer IBM introduced in 1981. It helped bring computers
  to offices, businesses, schools and individual users. Personal computers made writing,
  calculating, storing data and managing work more efficient. Their spread also boosted software
  and the computer industry.

**Sources**
- IBM, "The IBM PC" (announced 12 August 1981): https://www.ibm.com/history/personal-computer
- Computer History Museum, timeline 1981: https://www.computerhistory.org/timeline/1981/

### 3. The Unimate industrial robot (`ir3-3`)

- **Title:** Robot công nghiệp Unimate / The Unimate industrial robot
- **People:** George Devol và Joseph Engelberger gắn liền với quá trình phát triển, thương mại hóa
  robot / George Devol and Joseph Engelberger, who developed and commercialised the robot
- **Year:** 1961 (robot Unimate được đưa vào sử dụng tại nhà máy General Motors / Unimate put to
  work in a General Motors factory)
- **Field:** Robot và tự động hóa / Robotics and automation

**Short text**
- **VI:** Nhân vật: George Devol và Joseph Engelberger | Năm: 1961. Unimate là một trong những
  robot công nghiệp đầu tiên được đưa vào sản xuất thực tế. Robot thực hiện các thao tác đã lập
  trình, hỗ trợ xử lý vật liệu nặng và công việc lặp lại, giúp tăng tính ổn định và giảm sự tiếp
  xúc với một số môi trường nguy hiểm.
- **EN:** People: George Devol and Joseph Engelberger | Year: 1961. Unimate was one of the first
  industrial robots used in real production. It carried out programmed movements, handling heavy
  materials and repetitive work, which made production steadier and kept workers away from some
  dangerous conditions.

**Long text**
- **VI:** Unimate là một trong những robot công nghiệp đầu tiên được sử dụng trong sản xuất thực
  tế. Robot có thể thực hiện các thao tác đã được lập trình, đặc biệt phù hợp với những công việc
  lặp lại hoặc đòi hỏi xử lý vật liệu nặng. Việc sử dụng robot giúp giảm sự tiếp xúc trực tiếp
  của công nhân với một số môi trường nguy hiểm và nâng cao tính ổn định của quy trình sản xuất.
  Đây là bước tiến quan trọng hướng đến nhà máy tự động hóa.
- **EN:** Unimate was one of the first industrial robots used in real production. It could carry
  out programmed movements, and was especially suited to repetitive work or handling heavy
  materials. Robots reduced workers' direct contact with some dangerous conditions and made
  production more consistent. It was an important step towards the automated factory.

**Sources**
- Guinness World Records, "First industrial production robot" (Unimate, General Motors, 1961):
  https://www.guinnessworldrecords.com/world-records/411563-first-industrial-production-robot
- Backup (Devol and Engelberger; die-casting and spot welding at GM):
  https://en.wikipedia.org/wiki/Unimation

### 4. ARPANET (`ir3-4`)

- **Title:** Mạng máy tính ARPANET / The ARPANET computer network
- **Organisation:** Cơ quan Nghiên cứu Dự án Tiên tiến của Bộ Quốc phòng Hoa Kỳ (ARPA) và các cơ
  sở nghiên cứu tham gia / The US Department of Defense's Advanced Research Projects Agency
  (ARPA) and the research sites that took part
- **Year:** 1969 (các kết nối đầu tiên / the first connections)
- **Field:** Mạng máy tính / Computer networking

**Short text**
- **VI:** ARPANET kết nối các máy tính tại những cơ sở nghiên cứu, cho phép trao đổi dữ liệu từ
  xa. Đây là một trong những nền tảng quan trọng trong lịch sử phát triển Internet, mở rộng khả
  năng chia sẻ thông tin giữa các địa điểm.
- **EN:** ARPANET linked computers at research sites so they could exchange data at a distance.
  It is one of the key foundations in the history of the Internet, widening the sharing of
  information between places.

**Long text**
- **VI:** ARPANET là mạng máy tính tiên phong kết nối các cơ sở nghiên cứu tại Hoa Kỳ. Mạng cho
  phép máy tính ở những địa điểm khác nhau trao đổi dữ liệu, tạo tiền đề cho sự phát triển của
  mạng máy tính hiện đại. ARPANET không phải là toàn bộ Internet ngày nay, nhưng là một trong
  những nền tảng quan trọng trong lịch sử phát triển Internet. Thành tựu này mở ra phương thức
  giao tiếp và chia sẻ thông tin vượt qua giới hạn địa lý.
- **EN:** ARPANET was a pioneering computer network linking research sites in the United States.
  It let computers in different places exchange data, preparing the ground for modern computer
  networks. ARPANET is not the whole of today's Internet, but it is one of the key foundations in
  its history. It opened up a way to communicate and share information beyond the limits of
  geography.

**Sources**
- Internet Society, "A Brief History of the Internet":
  https://www.internetsociety.org/internet/history-internet/brief-history-internet/
- SRI International, "75 years of innovation: ARPANET" (first link between UCLA and SRI, 29
  October 1969): https://www.sri.com/75-years-of-innovation/75-years-of-innovation-arpanet/

### 5. The programmable logic controller, PLC (`ir3-5`)

- **Title:** Bộ điều khiển logic khả trình (PLC) / The programmable logic controller (PLC)
- **Developed by:** Nhiều nhóm kỹ sư và nhà sản xuất công nghiệp / Many groups of engineers and
  industrial manufacturers
- **Time:** Từ cuối thập niên 1960 / From the late 1960s
- **Field:** Điều khiển tự động / Automatic control

**Short text**
- **VI:** PLC là thiết bị điều khiển máy móc bằng chương trình có thể thay đổi. Nó được dùng để
  vận hành băng chuyền, động cơ và máy đóng gói, giúp nhà máy tự động hóa quy trình và điều chỉnh
  sản xuất linh hoạt hơn.
- **EN:** A PLC controls machines with a program that can be changed. It runs conveyors, motors
  and packaging machines, helping factories automate their processes and adjust production more
  flexibly.

**Long text**
- **VI:** PLC là thiết bị điều khiển công nghiệp có thể được lập trình để thực hiện các nhiệm vụ
  cụ thể. Thay vì phải thay đổi toàn bộ hệ thống điều khiển bằng dây nối khi quy trình sản xuất
  thay đổi, kỹ sư có thể điều chỉnh chương trình của PLC. Thiết bị này thường được dùng để điều
  khiển băng chuyền, động cơ, máy đóng gói và nhiều hệ thống tự động khác. PLC giúp quy trình sản
  xuất linh hoạt và dễ kiểm soát hơn.
- **EN:** A PLC is an industrial controller that can be programmed for specific tasks. When a
  production process changes, engineers adjust the PLC's program instead of rewiring the whole
  control system. PLCs commonly control conveyors, motors, packaging machines and many other
  automated systems. They make production more flexible and easier to control.

**Sources**
- Control Engineering, "How programmable logic controllers emerged from industry needs":
  https://www.controleng.com/articles/how-programmable-logic-controllers-emerged-from-industry-needs/
- Schneider Electric (owner of Modicon), "The PLC: born out of a customer's need" (Modicon 084,
  Bedford Associates, 1968-1969):
  https://blog.se.com/industry/machine-and-process-management/2018/06/15/the-plc-born-out-of-a-customers-need-to-maximize-profitability/

---

## Phòng 5: CMCN 4 (`ir4`)

**Period:** Đầu thế kỷ XXI đến nay / The early 21st century to today

### Background (`ir4-overview`)

**VI:** Cuộc Cách mạng Công nghiệp lần thứ tư kết hợp trí tuệ nhân tạo, Internet vạn vật, dữ liệu
lớn, robot và công nghệ sản xuất mới. Máy móc không chỉ tự động thực hiện nhiệm vụ mà còn có thể
thu thập dữ liệu và hỗ trợ ra quyết định. Các công nghệ này giúp tăng chất lượng và giảm lãng phí,
nhưng đặt ra thách thức về bảo mật, chi phí, việc làm và kỹ năng lao động.

**EN:** The Fourth Industrial Revolution brings together artificial intelligence, the Internet of
Things, big data, robots and new production technologies. Machines not only carry out tasks
automatically, but can also collect data and support decisions. These technologies raise quality
and reduce waste, but bring challenges in security, cost, jobs and workers' skills.

**Sources:** World Economic Forum (above).

### 1. AI quality inspection (`ir4-1`)

- **Title:** Kiểm tra chất lượng bằng AI / AI quality inspection
- **Developed by:** Nhiều nhóm nghiên cứu và doanh nghiệp công nghệ / Many research groups and
  technology companies
- **Time:** Phát triển mạnh trong thế kỷ XXI / Grew rapidly in the 21st century
- **Field:** AI và kiểm soát chất lượng / AI and quality control

**Short text**
- **VI:** AI phân tích hình ảnh sản phẩm để phát hiện lỗi như vết nứt hoặc sai lệch bề mặt. Công
  nghệ giúp kiểm tra nhanh và nhất quán hơn, nhưng vẫn cần dữ liệu phù hợp và sự giám sát của con
  người.
- **EN:** AI analyses images of products to find defects such as cracks or surface flaws. It makes
  inspection faster and more consistent, but still needs suitable data and human oversight.

**Long text**
- **VI:** Hệ thống kiểm tra chất lượng bằng AI sử dụng camera và thuật toán để phân tích hình ảnh
  sản phẩm. Hệ thống có thể phát hiện những dấu hiệu bất thường như vết nứt, sai lệch kích thước
  hoặc lỗi bề mặt. Khi được huấn luyện bằng dữ liệu phù hợp, AI hỗ trợ kiểm tra nhiều sản phẩm
  trong thời gian ngắn và giúp phát hiện lỗi nhất quán hơn. Tuy nhiên, kết quả vẫn cần được kiểm
  tra và giám sát phù hợp để tránh bỏ sót lỗi hoặc đánh giá sai.
- **EN:** AI quality inspection uses cameras and algorithms to analyse images of products. It can
  spot signs of trouble such as cracks, wrong dimensions or surface defects. Trained on suitable
  data, AI helps check many products in a short time and find defects more consistently. But its
  results still need proper checking and oversight, so that no defect is missed or misjudged.

**Sources**
- Prunella et al., "Deep Learning for Automatic Vision-Based Recognition of Industrial Surface
  Defects: A Survey", IEEE Access 11 (2023): https://doi.org/10.1109/ACCESS.2023.3271748
- [CẦN KIỂM TRA: a textbook or Vietnamese source would be stronger; this describes a whole
  field, with no single inventor or date.]

### 2. The Industrial Internet of Things, IIoT (`ir4-2`)

- **Title:** Internet vạn vật công nghiệp (IIoT) / The Industrial Internet of Things (IIoT)
- **Developed by:** Nhiều doanh nghiệp và tổ chức công nghệ công nghiệp / Many industrial
  technology companies and organisations
- **Time:** Phát triển mạnh từ cuối thế kỷ XX đến thế kỷ XXI / Grew rapidly from the late 20th
  into the 21st century
- **Field:** Kết nối thiết bị và thu thập dữ liệu / Connecting devices and collecting data

**Short text**
- **VI:** IIoT kết nối máy móc và cảm biến để thu thập, trao đổi dữ liệu. Nhờ đó, nhà máy có thể
  theo dõi thiết bị, sản lượng và năng lượng hiệu quả hơn, đồng thời cần chú trọng an ninh mạng.
- **EN:** IIoT connects machines and sensors to collect and share data. Factories can then monitor
  equipment, output and energy more effectively, but must take cybersecurity seriously.

**Long text**
- **VI:** IIoT là việc kết nối máy móc, cảm biến và thiết bị công nghiệp qua mạng để thu thập và
  trao đổi dữ liệu. Nhờ đó, người quản lý có thể theo dõi tình trạng thiết bị, sản lượng và mức
  tiêu thụ năng lượng. Dữ liệu được cập nhật thường xuyên giúp nhà máy phát hiện vấn đề sớm hơn
  và phối hợp hoạt động giữa các bộ phận hiệu quả hơn. Tuy nhiên, hệ thống kết nối cũng cần được
  bảo vệ trước các nguy cơ an ninh mạng.
- **EN:** IIoT means connecting industrial machines, sensors and equipment over a network to
  collect and share data. Managers can then follow the condition of equipment, output and energy
  use. Regularly updated data helps factories catch problems earlier and coordinate their
  departments better. But connected systems also need protecting against cyber threats.

**Sources**
- SAP, "What is the Industrial Internet of Things (IIoT)?": https://www.sap.com/resources/what-is-iiot
- [CẦN KIỂM TRA: SAP is a software company; a textbook, an encyclopaedia or a Vietnamese
  government or university source would be stronger.]

### 3. 3D printing (`ir4-3`)

- **Title:** Công nghệ in 3D / 3D printing
- **Person:** Chuck Hull, một trong những người tiên phong của công nghệ in 3D / Chuck Hull, one of
  the pioneers of 3D printing
- **Year:** 1986 (bằng sáng chế về kỹ thuật stereolithography của Hull / Hull's patent on
  stereolithography)
- **Field:** Sản xuất bồi đắp / Additive manufacturing

**Short text**
- **VI:** Nhân vật tiêu biểu: Chuck Hull | Năm: 1986. In 3D tạo vật thể từ mô hình số bằng cách
  thêm vật liệu từng lớp. Công nghệ giúp tạo mẫu nhanh và chế tạo hình dạng phức tạp, được ứng
  dụng trong y tế, thiết kế và công nghiệp, dù vẫn có giới hạn về vật liệu, tốc độ và chi phí.
- **EN:** Pioneer: Chuck Hull | Year: 1986. 3D printing builds objects from a digital model by
  adding material layer by layer. It allows fast prototypes and complex shapes, and is used in
  medicine, design and industry, though materials, speed and cost still set limits.

**Long text**
- **VI:** Công nghệ in 3D tạo ra vật thể bằng cách xây dựng từng lớp vật liệu dựa trên mô hình kỹ
  thuật số. Phương pháp này giúp chế tạo các hình dạng phức tạp, tạo mẫu thử nhanh và sản xuất một
  số linh kiện theo yêu cầu. In 3D được ứng dụng trong thiết kế, y tế, hàng không và công nghiệp.
  Dù vậy, tốc độ sản xuất, loại vật liệu và chi phí vẫn quyết định khi nào công nghệ này phù hợp
  hơn các phương pháp truyền thống.
- **EN:** 3D printing makes objects by building up material layer by layer from a digital model.
  It can produce complex shapes, quick prototypes and some parts made to order. It is used in
  design, medicine, aviation and industry. Even so, production speed, materials and cost still
  decide when it beats traditional methods.

**Sources**
- National Inventors Hall of Fame, "3D printing: Chuck Hull":
  https://www.invent.org/blog/inventors/3d-printing-chuck-hull
- The patent, US 4,575,330 (11 March 1986): https://patents.google.com/patent/US4575330A/en

### 4. The digital twin (`ir4-4`)

- **Title:** Bản sao số (Digital Twin) / The digital twin
- **Developed by:** Nhiều nhóm nghiên cứu và doanh nghiệp công nghệ / Many research groups and
  technology companies
- **Time:** Được ứng dụng rộng hơn trong thế kỷ XXI / Used more widely in the 21st century
- **Field:** Mô phỏng và quản lý hệ thống / Simulation and systems management

**Short text**
- **VI:** Bản sao số là mô hình kỹ thuật số đại diện cho một thiết bị hoặc hệ thống thực tế. Nó
  hỗ trợ theo dõi hoạt động, thử nghiệm phương án và phân tích hiệu suất trước khi thay đổi hệ
  thống thật.
- **EN:** A digital twin is a digital model that stands for a real device or system. It helps
  monitor operations, test options and analyse performance before the real system is changed.

**Long text**
- **VI:** Bản sao số là mô hình kỹ thuật số đại diện cho một thiết bị, quy trình hoặc hệ thống
  thực tế. Khi được kết nối với dữ liệu phù hợp, mô hình có thể phản ánh trạng thái hoạt động của
  đối tượng và hỗ trợ thử nghiệm các phương án thay đổi. Trong nhà máy, bản sao số giúp kỹ sư quan
  sát quy trình, phân tích hiệu suất và dự đoán ảnh hưởng của một số điều chỉnh trước khi áp dụng
  ngoài thực tế. Giá trị của nó phụ thuộc vào độ chính xác của mô hình và dữ liệu đầu vào.
- **EN:** A digital twin is a digital model that represents a real device, process or system.
  Connected to suitable data, it can mirror how the real thing is working and help test possible
  changes. In factories, digital twins let engineers watch processes, analyse performance and
  predict the effect of some adjustments before making them for real. Its value depends on how
  accurate the model and its data are.

**Sources**
- Britannica, "digital twin" (a virtual representation that uses real-time data from what it
  represents): https://www.britannica.com/technology/digital-twin
- Backup, for its history (concept presented by Michael Grieves in 2002; named "digital twin"
  in NASA's 2010 technology roadmap): https://en.wikipedia.org/wiki/Digital_twin

### 5. The collaborative robot, cobot (`ir4-5`)

- **Title:** Robot cộng tác (Cobot) / The collaborative robot (cobot)
- **Developed by:** Nhiều doanh nghiệp chế tạo robot; thuật ngữ cobot xuất hiện từ thập niên 1990
  / Many robot makers; the word "cobot" dates from the 1990s
- **Time:** Phát triển và ứng dụng mạnh trong thế kỷ XXI / Developed and widely used in the 21st
  century
- **Field:** Robot và sản xuất thông minh / Robotics and smart manufacturing

**Short text**
- **VI:** Cobot hỗ trợ con người trong các công việc như lắp ráp, gắp đặt và đóng gói. Robot giúp
  quy trình linh hoạt hơn, nhưng cần được đánh giá rủi ro và trang bị biện pháp an toàn phù hợp.
- **EN:** Cobots help people with tasks such as assembly, picking and placing, and packing. They
  make processes more flexible, but need a risk assessment and proper safety measures.

**Long text**
- **VI:** Robot cộng tác được thiết kế để hỗ trợ con người trong những nhiệm vụ sản xuất nhất định.
  Tùy theo thiết kế và hệ thống an toàn, cobot có thể hỗ trợ lắp ráp, gắp đặt, đóng gói hoặc xử
  lý những thao tác lặp lại. Việc kết hợp khả năng của robot với kinh nghiệm của con người giúp
  quy trình sản xuất linh hoạt hơn. Tuy nhiên, cobot vẫn cần được đánh giá rủi ro và lắp đặt biện
  pháp bảo vệ phù hợp trước khi làm việc gần con người.
- **EN:** Collaborative robots are designed to help people with particular production tasks.
  Depending on their design and safety systems, cobots can help with assembly, picking and
  placing, packing or repetitive movements. Combining a robot's abilities with human experience
  makes production more flexible. But a cobot still needs a risk assessment and proper safeguards
  before it works near people.

**Sources**
- Northwestern University, Michael Peshkin's cobot page (invented in 1996 by J. Edward Colgate
  and Michael Peshkin; the name "cobot" comes from their lab):
  https://peshkin.mech.northwestern.edu/cobot/
- On safety and risk assessment: ISO/TS 15066 (safety requirements for collaborative robots,
  2016), explained by the Association for Advancing Automation:
  https://www.automate.org/tech-papers/iso-ts-15066-explained

### 6. Data-driven predictive maintenance (`ir4-6`)

- **Title:** Bảo trì dự đoán bằng dữ liệu / Data-driven predictive maintenance
- **Developed by:** Nhiều doanh nghiệp và nhóm kỹ thuật công nghiệp / Many companies and
  industrial engineering teams
- **Time:** Được mở rộng nhờ cảm biến, phân tích dữ liệu và AI hiện đại / Expanded thanks to
  sensors, data analysis and modern AI
- **Field:** Quản lý thiết bị và bảo trì / Equipment management and maintenance

**Short text**
- **VI:** Hệ thống phân tích dữ liệu cảm biến để phát hiện dấu hiệu máy móc có nguy cơ hỏng hóc.
  Nhờ đó, doanh nghiệp có thể lên kế hoạch bảo trì sớm, giảm thời gian dừng máy và chi phí sửa
  chữa, dù kết quả dự đoán vẫn có thể sai lệch.
- **EN:** The system analyses sensor data to spot signs that a machine may fail. Companies can then
  plan maintenance early, cutting downtime and repair costs, though predictions can still be
  wrong.

**Long text**
- **VI:** Bảo trì dự đoán sử dụng dữ liệu từ cảm biến và lịch sử vận hành để nhận biết dấu hiệu
  bất thường của máy móc. Thay vì chỉ sửa chữa sau khi thiết bị hỏng hoặc bảo trì theo lịch cố
  định, doanh nghiệp có thể lên kế hoạch kiểm tra khi dữ liệu cho thấy nguy cơ sự cố tăng lên.
  Phương pháp này có thể giảm thời gian dừng máy và hạn chế chi phí phát sinh. Tuy nhiên, dự đoán
  vẫn có sai số và cần được kết hợp với chuyên môn của kỹ thuật viên.
- **EN:** Predictive maintenance uses sensor data and operating history to recognise signs of
  trouble in machines. Instead of repairing equipment only after it breaks, or servicing it on a
  fixed schedule, companies can plan checks when the data shows the risk of failure is rising.
  This can cut downtime and limit unexpected costs. But predictions still have errors, and must be
  combined with technicians' expertise.

**Sources**
- US Department of Energy (FEMP), "Operations & Maintenance Best Practices: A Guide to Achieving
  Operational Efficiency", Release 3.0 (2010), chapter on maintenance types:
  https://www.energy.gov/eere/femp/articles/operations-and-maintenance-best-practices-guide-achieving-operational-efficiency

---

## Quiz (Phòng trò chơi) (`src/content/quiz.ts`)

The doc has no quiz yet. The game asks 8 questions, 4 answers each; half right opens the portal.
Below is a **draft** written only from the facts above, for the group to check, edit or
replace. (Each has its source in the invention above.)

1. **VI:** Bộ phận cải tiến nổi bật trong động cơ hơi nước của James Watt là gì?
   **EN:** What was the key improvement in James Watt's steam engine?
   A. Bộ ngưng tụ riêng / A separate condenser *(đúng / correct)* · B. Bánh xe nước / A water
   wheel · C. Động cơ điện / An electric motor · D. Nồi hơi bằng gỗ / A wooden boiler
2. **VI:** Đầu máy Rocket nổi tiếng nhờ cuộc thi nào năm 1829?
   **EN:** Which 1829 competition made the Rocket locomotive famous?
   A. Rainhill Trials *(đúng / correct)* · B. Cromford Trials · C. Model T Race · D. Menlo Park
   Fair
3. **VI:** Water Frame của Richard Arkwright dùng nguồn năng lượng nào?
   **EN:** What powered Richard Arkwright's Water Frame?
   A. Sức nước / Water power *(đúng / correct)* · B. Điện / Electricity · C. Gió / Wind ·
   D. Xăng / Petrol
4. **VI:** Ford áp dụng dây chuyền lắp ráp chuyển động để sản xuất mẫu ô tô nào?
   **EN:** Which car did Ford build on its moving assembly line?
   A. Model T *(đúng / correct)* · B. Rocket · C. Unimate · D. IBM 5150
5. **VI:** Alexander Graham Bell được cấp bằng sáng chế điện thoại tại Hoa Kỳ vào năm nào?
   **EN:** In which year did Alexander Graham Bell receive his US telephone patent?
   A. 1876 *(đúng / correct)* · B. 1769 · C. 1913 · D. 1971
6. **VI:** Unimate là gì?
   **EN:** What was Unimate?
   A. Một trong những robot công nghiệp đầu tiên / One of the first industrial robots *(đúng /
   correct)* · B. Một bộ vi xử lý / A microprocessor · C. Một mạng máy tính / A computer
   network · D. Một máy kéo sợi / A spinning machine
7. **VI:** Vì sao PLC giúp nhà máy linh hoạt hơn?
   **EN:** Why does a PLC make factories more flexible?
   A. Có thể đổi chương trình thay vì đi lại dây / Its program can be changed instead of
   rewiring *(đúng / correct)* · B. Chạy bằng hơi nước / It runs on steam · C. Không cần điện /
   It needs no electricity · D. Tự in ra linh kiện / It prints parts by itself
8. **VI:** Bản sao số (digital twin) là gì?
   **EN:** What is a digital twin?
   A. Mô hình kỹ thuật số đại diện cho một thiết bị hoặc hệ thống thực tế / A digital model of a
   real device or system *(đúng / correct)* · B. Một robot giống hệt con người / A robot that
   looks like a person · C. Bản in 3D của một máy / A 3D print of a machine · D. Hai máy tính nối
   mạng / Two networked computers

Each question also needs a one-sentence explanation shown after answering (both languages).
[CẦN KIỂM TRA: to write once the questions are final.]

---

## Assets still needed (each one credited in `src/content/credits.ts`)

- **19 prototype models**, one per invention, about 2 MB or less each (CLAUDE.md), placed in
  `public/models/ir1/` ... `ir4/`. Free sources with clear licences, e.g. Sketchfab (filter
  "Downloadable" and CC licences), Poly Pizza (CC0/CC-BY), NASA 3D Resources, Smithsonian 3D
  (CC0 items). Or build simple ones from shapes in code, as the placeholders are.
- **Optional images** for the boards (portraits, patent drawings): only with a clear licence
  (Wikimedia Commons public-domain files are the easiest).
- **Already done:** all music and sound effects (credited), the font, the textures.

## Before launch

- Re-check every link above (some sites block automatic checks, so open them by hand).
- The group proofreads both languages.
- Remind the leader: every new image or model needs its `credits.ts` entry.
