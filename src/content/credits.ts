// Every image, texture, font, sound and 3D model used in the museum, with author and licence
// (CLAUDE.md). Shown on the intro hall's "Ghi công" board. Add an entry for every new asset.

import type { Language } from './language'
import { PICTURES } from './pictures'

export interface Credit {
  item: Record<Language, string> // what it is and where it is used
  author: string | Record<Language, string>
  licence: Record<Language, string>
  source: string // where it was downloaded
  files: string[] // paths inside /public
}

const AMBIENTCG = 'ambientCG (Lennart Demes)'
const PUBLIC_DOMAIN = { vi: 'Phạm vi công cộng (Public Domain Mark)', en: 'Public domain (Public Domain Mark)' }
const CC0 = { vi: 'CC0 1.0 (phạm vi công cộng)', en: 'CC0 1.0 (public domain)' }

function texture(id: string, use: Record<Language, string>, file: string): Credit {
  return {
    item: { vi: `Vật liệu ${id} - ${use.vi}`, en: `Texture ${id} - ${use.en}` },
    author: AMBIENTCG,
    licence: CC0,
    source: `https://ambientcg.com/view?id=${id}`,
    files: [`textures/${file}-color.ktx2`, `textures/${file}-normal.ktx2`],
  }
}

// Sketchfab's "CC Attribution" licence. The models were simplified and compressed for the
// web, which the licence allows as long as the change is mentioned.
const CC_BY = { vi: 'CC BY 4.0 (ghi công tác giả; đã thu gọn cho web)', en: 'CC BY 4.0 (attribution; simplified for the web)' }

// A 3D model downloaded from Sketchfab (sketchfab.com/3d-models/<id>).
function model(id: string, item: Record<Language, string>, author: string, file: string): Credit {
  return { item, author: `${author} (Sketchfab)`, licence: CC_BY, source: `https://sketchfab.com/3d-models/${id}`, files: [`models/${file}`] }
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

  // 3D models of inventions (the other prototypes are built from shapes by the team).
  model('36e57c231b6546b7bdd19bf4dba8063d', { vi: 'Mô hình "Model of the Watt Steam Engine with animation" - CMCN 1', en: 'Model "Model of the Watt Steam Engine with animation" - IR 1' }, 'Virtual Museums of Małopolska', 'ir1/watt-steam-engine.glb'),
  model('1cd9aa31c6a34ab9b7023aaf5ba593f2', { vi: 'Mô hình "Stephensons Rocket Steam Engine" - CMCN 1', en: 'Model "Stephensons Rocket Steam Engine" - IR 1' }, 'Railmonsterinc', 'ir1/rocket-locomotive.glb'),
  model('aeb0e4832f04463280510e550e2cdbd5', { vi: 'Mô hình "Edison Light Bulb" - CMCN 2', en: 'Model "Edison Light Bulb" - IR 2' }, 'Fishboe', 'ir2/edison-light-bulb.glb'),
  model('028ff3c03a284216801eb05623c5b2a3', { vi: 'Mô hình "Ford Model T v2 Downloadable" - CMCN 2', en: 'Model "Ford Model T v2 Downloadable" - IR 2' }, 'Libau Media', 'ir2/ford-model-t-v2.glb'),
  {
    item: { vi: 'Mô hình "Erster Dreirad-Motorwagen von Carl Benz" (bản quét xe Benz Patent-Motorwagen) - CMCN 2', en: 'Model "Erster Dreirad-Motorwagen von Carl Benz" (a scan of the Benz Patent-Motorwagen) - IR 2' },
    author: 'Deutsches Museum | Digital (Sketchfab)',
    // Share-alike: this changed copy (simplified for the web) keeps the same licence.
    licence: { vi: 'CC BY-SA 4.0 (ghi công tác giả, chia sẻ tương tự; đã thu gọn cho web)', en: 'CC BY-SA 4.0 (attribution, share-alike; simplified for the web)' },
    source: 'https://sketchfab.com/3d-models/47df0cb894a34d33a09361f3cb182070',
    files: ['models/ir2/benz-motorwagen.glb'],
  },
  model('4d6396e8dc164f4d8da7821eb139160d', { vi: 'Mô hình "Alexander Graham Bell Telephone 1876" - CMCN 2', en: 'Model "Alexander Graham Bell Telephone 1876" - IR 2' }, 'Fabuleo8796', 'ir2/bell-telephone-1876.glb'),
  model('815dd2ba92474299a387faeeaac83fd4', { vi: 'Mô hình "CPU Intel 4004" - CMCN 3', en: 'Model "CPU Intel 4004" - IR 3' }, 'Nadya Sarieva', 'ir3/intel-4004.glb'),
  model('556af16d476d4144bab11ed744a849e6', { vi: 'Mô hình "IBM PC XT 5150" - CMCN 3', en: 'Model "IBM PC XT 5150" - IR 3' }, 'denisstephane', 'ir3/ibm-pc-5150.glb'),
  model('e695ca5586014c0cbe6878492259a210', { vi: 'Mô hình "DEC PDP-11" - CMCN 3', en: 'Model "DEC PDP-11" - IR 3' }, 'maxdragonn', 'ir3/dec-pdp-11.glb'),
  model('83a800f6ca824d37859f575e4b505e31', { vi: 'Mô hình "SIMATIC S7-1200, CPU2" (bộ điều khiển PLC) - CMCN 3', en: 'Model "SIMATIC S7-1200, CPU2" (a PLC) - IR 3' }, 'MaaB', 'ir3/siemens-s7-1200.glb'),
  model('0e825a8d48b14bee883a131fe029d4fc', { vi: 'Mô hình "3D Printer" - CMCN 4', en: 'Model "3D Printer" - IR 4' }, 'Gregsterius', 'ir4/3d-printer.glb'),
  model('31968bd4ec5943f785cdf028facfba5c', { vi: 'Mô hình "Universal Robots UR3 Animated Cobot" - CMCN 4', en: 'Model "Universal Robots UR3 Animated Cobot" - IR 4' }, 'kerwink', 'ir4/ur3-cobot.glb'),
  model('048b9dc3095e44c0883b6b7944ad4916', { vi: 'Mô hình "Electric Motor (high poly)" - CMCN 4', en: 'Model "Electric Motor (high poly)" - IR 4' }, 'Scarecrow_original', 'ir4/electric-motor.glb'),
  model('29da4e10eb6c427cb72f3ebdf822f89e', { vi: 'Mô hình "Nvidia GeForce RTX 3070 - UPDATED" - CMCN 4', en: 'Model "Nvidia GeForce RTX 3070 - UPDATED" - IR 4' }, 'DatSketch', 'ir4/gpu-rtx-3070.glb'),

  // Sounds (M8b). Converted to small .ogg files; listed per source pack.
  {
    item: { vi: 'Âm thanh giao diện (nhấp, mở, đóng, đúng/sai...) - bộ Interface Sounds', en: 'Interface sounds (clicks, open, close, right/wrong...) - Interface Sounds pack' },
    author: 'Kenney (kenney.nl)',
    licence: CC0,
    source: 'https://kenney.nl/assets/interface-sounds',
    files: ['sounds/ui/click.ogg', 'sounds/ui/open.ogg', 'sounds/ui/close.ogg', 'sounds/ui/map-open.ogg', 'sounds/ui/map-close.ogg', 'sounds/ui/teleport.ogg', 'sounds/ui/select.ogg', 'sounds/ui/correct.ogg', 'sounds/ui/wrong.ogg', 'sounds/world/new-room.ogg'],
  },
  {
    item: { vi: 'Tiếng bước chân, tiếng cửa và chốt khóa - bộ RPG Audio', en: 'Footsteps, door and latch sounds - RPG Audio pack' },
    author: 'Kenney (kenney.nl)',
    licence: CC0,
    source: 'https://kenney.nl/assets/rpg-audio',
    files: ['sounds/steps/step-0.ogg', 'sounds/steps/step-1.ogg', 'sounds/world/door-open.ogg', 'sounds/world/door-close.ogg', 'sounds/world/locked.ogg'],
  },
  {
    item: { vi: 'Nhạc hiệu kết quả trò chơi - bộ Music Jingles', en: 'Quiz results jingle - Music Jingles pack' },
    author: 'Kenney (kenney.nl)',
    licence: CC0,
    source: 'https://kenney.nl/assets/music-jingles',
    files: ['sounds/ui/results.ogg'],
  },
  {
    item: { vi: 'Nhạc cảnh kết: "Flight Hymn" (đã cắt ngắn)', en: 'Ending music: "Flight Hymn" (shortened)' },
    author: 'Ross Bugden',
    licence: { vi: 'Miễn phí bản quyền, có ghi công tác giả', en: 'Royalty free, with credit to the author' },
    source: 'https://youtu.be/XCr0bsng60Y',
    files: ['sounds/music/ending.ogg', 'sounds/music/ending.m4a'],
  },
  {
    item: { vi: 'Nhạc sảnh trung tâm: Minuet cung Sol trưởng, BWV Anh. 114 (Christian Petzold), bản thu piano của Musopen', en: 'Central Hall music: Minuet in G major, BWV Anh. 114 (Christian Petzold), Musopen piano recording' },
    author: 'Aaron Dunn (Musopen), via Wikimedia Commons',
    licence: PUBLIC_DOMAIN,
    source: 'https://commons.wikimedia.org/wiki/File:Minuet_in_G_major,_Anh._114_-_Notebook_for_Anna_Magdalena_Bach.ogg',
    files: ['sounds/music/rotunda.ogg'],
  },
  {
    item: { vi: 'Nhạc CMCN 1: "Factory ambiance" (nhạc nền không khí nhà máy)', en: 'CMCN 1 music: "Factory ambiance" (atmospheric factory ambience)' },
    author: 'yd (OpenGameArt)',
    licence: CC0,
    source: 'https://opengameart.org/content/factory-ambiance',
    files: ['sounds/music/ir1.ogg'],
  },
  {
    item: { vi: 'Nhạc CMCN 3: "Factorio Clone Music" (nhạc nền nhà máy)', en: 'CMCN 3 music: "Factorio Clone Music" (factory background music)' },
    author: 'Pro Sensory (OpenGameArt)',
    licence: CC0,
    source: 'https://opengameart.org/content/factorio-clone-music',
    files: ['sounds/music/ir3.ogg'],
  },
  {
    item: { vi: 'Nhạc CMCN 2: "Life in corrupted binary" (nhạc nền điện tử không khí)', en: 'CMCN 2 music: "Life in corrupted binary" (atmospheric electronic ambience)' },
    author: 'HaelDB (OpenGameArt)',
    licence: CC0,
    source: 'https://opengameart.org/content/life-corrupted-binary',
    files: ['sounds/music/ir2.ogg'],
  },
  {
    item: { vi: 'Nhạc CMCN 4: "Space Ambient" (nhạc nền không gian)', en: 'CMCN 4 music: "Space Ambient" (space ambience)' },
    author: 'Solarflex (Pixabay)',
    // Free to use, no credit required (we credit every asset anyway).
    licence: { vi: 'Giấy phép nội dung Pixabay', en: 'Pixabay Content License' },
    source: 'https://pixabay.com/music/ambient-space-ambient-569588/',
    files: ['sounds/music/ir4.ogg'],
  },
  {
    item: { vi: 'Tiếng chuông khi hoàn thành một bước hướng dẫn, do nhóm tạo bằng FFmpeg', en: 'Tutorial step chime, generated with FFmpeg by the team' },
    author: 'INOVAT',
    licence: { vi: 'Sản phẩm của nhóm', en: 'Our own work' },
    source: 'https://ffmpeg.org',
    files: ['sounds/ui/step-done.ogg'],
  },
  {
    item: { vi: 'Nhạc trailer, do nhóm tạo bằng DiffRhythm', en: 'Trailer music, generated with DiffRhythm by the team' },
    author: 'INOVAT',
    licence: { vi: 'Sản phẩm của nhóm (tạo bằng AI)', en: 'Our own work (AI-generated)' },
    source: 'https://diffrhythm.ai',
    files: ['sounds/music/trailer.ogg', 'sounds/music/trailer.m4a'],
  },
  {
    item: { vi: 'Nhạc phòng trò chơi: "Prelude in F# Minor"', en: 'Game Room music: "Prelude in F# Minor"' },
    author: 'Kistol (OpenGameArt)',
    licence: CC0,
    source: 'https://opengameart.org/content/prelude-in-f-minor',
    files: ['sounds/music/quiz.ogg'],
  },
  {
    item: { vi: 'Âm thanh chào đón khi bắt đầu tham quan: đoạn mở đầu "Mùa xuân" (Bốn mùa, Op. 8, chương I, Allegro) của Antonio Vivaldi', en: 'Welcome sound when the visit starts: the opening of "Spring" (The Four Seasons, Op. 8, I. Allegro) by Antonio Vivaldi' },
    author: 'Antonio Vivaldi (composer); The Modena Chamber Orchestra (performers), via Musopen',
    licence: { vi: 'Phạm vi công cộng', en: 'Public domain' },
    source: "https://commons.wikimedia.org/wiki/File:The_Modena_Chamber_Orchestra_-_Vivaldi's_Spring,_RV_269_-_I._Allegro.ogg",
    files: ['sounds/music/welcome.ogg'],
  },

  // The pictures on the boards and in the wall galleries (content/pictures.ts). (The
  // diagrams are drawn by the museum, so they need no credit.)
  ...Object.values(PICTURES)
    .filter((p) => p.file && p.author && p.licence && p.source)
    .map(
      (p): Credit => ({
        item: { vi: `Ảnh: ${p.caption.vi}`, en: `Picture: ${p.caption.en}` },
        author: p.author!,
        licence: p.licence!,
        source: p.source!,
        files: [p.file!],
      }),
    ),
]
