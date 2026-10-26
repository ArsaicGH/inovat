// Every image, texture, font, sound and 3D model used in the museum, with author and licence
// (CLAUDE.md). Shown on the intro hall's "Ghi công" board. Add an entry for every new asset.

import type { Language } from './language'

export interface Credit {
  item: Record<Language, string> // what it is and where it is used
  author: string
  licence: Record<Language, string>
  source: string // where it was downloaded
  files: string[] // paths inside /public
}

const AMBIENTCG = 'ambientCG (Lennart Demes)'
const CC0 = { vi: 'CC0 1.0 (phạm vi công cộng)', en: 'CC0 1.0 (public domain)' }

function texture(id: string, use: Record<Language, string>, file: string): Credit {
  return {
    item: { vi: `Vật liệu ${id} – ${use.vi}`, en: `Texture ${id} – ${use.en}` },
    author: AMBIENTCG,
    licence: CC0,
    source: `https://ambientcg.com/view?id=${id}`,
    files: [`textures/${file}-color.jpg`, `textures/${file}-normal.jpg`],
  }
}

export const credits: Credit[] = [
  {
    item: { vi: 'Phông chữ Be Vietnam Pro', en: 'Be Vietnam Pro font' },
    author: 'The Be Vietnam Pro Project Authors',
    licence: { vi: 'SIL Open Font License 1.1', en: 'SIL Open Font License 1.1' },
    source: 'https://github.com/google/fonts/tree/main/ofl/bevietnampro',
    files: [
      'fonts/be-vietnam-pro-regular.ttf',
      'fonts/be-vietnam-pro-medium.ttf',
      'fonts/be-vietnam-pro-semibold.ttf',
      'fonts/be-vietnam-pro-bold.ttf',
      'fonts/be-vietnam-pro-ofl.txt',
    ],
  },
  texture('Marble012', { vi: 'sàn đá cẩm thạch', en: 'marble floor' }, 'marble'),
  texture('PaintedPlaster017', { vi: 'tường vữa sơn', en: 'painted plaster walls' }, 'plaster'),
  texture('WoodFloor051', { vi: 'sàn gỗ', en: 'wooden floor' }, 'wood-floor'),
  texture('Bricks113A', { vi: 'tường gạch', en: 'brick walls' }, 'bricks'),
  texture('MetalPlates006', { vi: 'tấm kim loại', en: 'metal plates' }, 'metal-plates'),
  texture('Concrete034', { vi: 'bê tông', en: 'concrete' }, 'concrete'),
  texture('Tiles139', { vi: 'sàn gạch ô', en: 'tiled floor' }, 'tiles'),

  // Sounds (M8b). Converted to small .ogg files; listed per source pack.
  {
    item: { vi: 'Âm thanh giao diện (nhấp, mở, đóng, đúng/sai...) – bộ Interface Sounds', en: 'Interface sounds (clicks, open, close, right/wrong...) – Interface Sounds pack' },
    author: 'Kenney (kenney.nl)',
    licence: CC0,
    source: 'https://kenney.nl/assets/interface-sounds',
    files: ['sounds/ui/click.ogg', 'sounds/ui/open.ogg', 'sounds/ui/close.ogg', 'sounds/ui/map-open.ogg', 'sounds/ui/map-close.ogg', 'sounds/ui/teleport.ogg', 'sounds/ui/select.ogg', 'sounds/ui/correct.ogg', 'sounds/ui/wrong.ogg', 'sounds/world/new-room.ogg'],
  },
  {
    item: { vi: 'Tiếng bước chân, tiếng cửa và chốt khóa – bộ RPG Audio', en: 'Footsteps, door and latch sounds – RPG Audio pack' },
    author: 'Kenney (kenney.nl)',
    licence: CC0,
    source: 'https://kenney.nl/assets/rpg-audio',
    files: ['sounds/steps/step-0.ogg', 'sounds/steps/step-1.ogg', 'sounds/world/door-open.ogg', 'sounds/world/door-close.ogg', 'sounds/world/locked.ogg'],
  },
  {
    item: { vi: 'Nhạc hiệu kết quả trò chơi – bộ Music Jingles', en: 'Quiz results jingle – Music Jingles pack' },
    author: 'Kenney (kenney.nl)',
    licence: CC0,
    source: 'https://kenney.nl/assets/music-jingles',
    files: ['sounds/ui/results.ogg'],
  },
  {
    item: { vi: 'Âm thanh nền (sảnh trung tâm, phòng trò chơi) – bộ 30 CC0 SFX loops', en: 'Background sound (Central Hall, Game Room) – 30 CC0 SFX loops pack' },
    author: 'rubberduck (OpenGameArt)',
    licence: CC0,
    source: 'https://opengameart.org/content/30-cc0-sfx-loops',
    files: ['sounds/ambience/rotunda.ogg', 'sounds/ambience/quiz.ogg'],
  },
  {
    item: { vi: 'Nhạc CMCN 1: Giuseppe Verdi, "Điệp khúc cái đe" (Anvil Chorus) trong vở opera "Il trovatore" (1853), bản thu của Musopen', en: 'CMCN 1 music: Giuseppe Verdi, "Anvil Chorus" from the opera "Il trovatore" (1853), Musopen recording' },
    author: 'Giuseppe Verdi (composer); Musopen (recording)',
    licence: CC0,
    source: 'https://commons.wikimedia.org/wiki/File:Giuseppe_Verdi_-_Anvil_Chorus.ogg',
    files: ['sounds/music/ir1.ogg'],
  },
  {
    item: { vi: 'Nhạc CMCN 2: Scott Joplin, "Maple Leaf Rag", Ban nhạc Thủy quân lục chiến Hoa Kỳ thu âm năm 1906', en: 'CMCN 2 music: Scott Joplin, "Maple Leaf Rag", recorded by the United States Marine Band in 1906' },
    author: 'Scott Joplin (composer); United States Marine Band (performers)',
    licence: { vi: 'Phạm vi công cộng', en: 'Public domain' },
    source: 'https://commons.wikimedia.org/wiki/File:1906_-_Scott_Joplin%27s_Maple_Leaf_Rag_(1899)_played_by_the_United_States_Marine_Band.ogg',
    files: ['sounds/music/ir2.ogg'],
  },
  {
    item: { vi: 'Nhạc CMCN 3: "Korobeiniki" (dân ca Nga, nhạc nền Tetris) phong cách 8-bit, do nhóm tự tạo bằng mã', en: 'CMCN 3 music: "Korobeiniki" (Russian folk song, the Tetris theme) in 8-bit style, generated in code by the team' },
    author: 'INOVAT (arrangement); traditional melody',
    licence: { vi: 'Giai điệu thuộc phạm vi công cộng; bản phối do nhóm tạo', en: 'Melody in the public domain; arrangement made by the team' },
    source: 'https://en.wikipedia.org/wiki/Korobeiniki',
    files: ['sounds/music/ir3.ogg'],
  },
  {
    item: { vi: 'Nhạc CMCN 4: "Claimed by the Void" (nhạc nền khoa học viễn tưởng)', en: 'CMCN 4 music: "Claimed by the Void" (sci-fi ambient)' },
    author: 'vitalezzz (OpenGameArt)',
    licence: CC0,
    source: 'https://opengameart.org/content/claimed-by-the-void',
    files: ['sounds/music/ir4.ogg'],
  },
  {
    item: { vi: 'Âm thanh chào đón ở sảnh giới thiệu (nhịp binaural) và tiếng chuông bước hướng dẫn, do nhóm tạo bằng FFmpeg', en: 'Intro hall welcome sound (binaural beat) and tutorial step chime, generated with FFmpeg by the team' },
    author: 'INOVAT',
    licence: { vi: 'Sản phẩm của nhóm', en: 'Our own work' },
    source: 'https://ffmpeg.org',
    files: ['sounds/ambience/hall.ogg', 'sounds/ui/step-done.ogg'],
  },
]
