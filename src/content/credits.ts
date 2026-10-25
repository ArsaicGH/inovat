// Every image, texture, font and 3D model used in the museum, with author and licence
// (CLAUDE.md). Shown on the credits screen (M8). Add an entry for every new asset.

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
]
