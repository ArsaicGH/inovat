// Every image, texture, font and 3D model used in the museum, with author and licence
// (CLAUDE.md). Shown on the credits screen (M8). Add an entry for every new asset.

export interface Credit {
  item: string // what it is and where it is used
  author: string
  licence: string
  source: string // where it was downloaded
  files: string[] // paths inside /public
}

const AMBIENTCG = 'ambientCG (Lennart Demes)'
const CC0 = 'CC0 1.0 (phạm vi công cộng)'

function texture(id: string, use: string, file: string): Credit {
  return {
    item: `Vật liệu ${id} – ${use}`,
    author: AMBIENTCG,
    licence: CC0,
    source: `https://ambientcg.com/view?id=${id}`,
    files: [`textures/${file}-color.jpg`, `textures/${file}-normal.jpg`],
  }
}

export const credits: Credit[] = [
  {
    item: 'Phông chữ Be Vietnam Pro',
    author: 'The Be Vietnam Pro Project Authors',
    licence: 'SIL Open Font License 1.1',
    source: 'https://github.com/google/fonts/tree/main/ofl/bevietnampro',
    files: [
      'fonts/be-vietnam-pro-regular.ttf',
      'fonts/be-vietnam-pro-medium.ttf',
      'fonts/be-vietnam-pro-semibold.ttf',
      'fonts/be-vietnam-pro-bold.ttf',
      'fonts/be-vietnam-pro-ofl.txt',
    ],
  },
  texture('Marble012', 'sàn đá cẩm thạch', 'marble'),
  texture('PaintedPlaster017', 'tường vữa sơn', 'plaster'),
  texture('WoodFloor051', 'sàn gỗ', 'wood-floor'),
  texture('Bricks113A', 'tường gạch', 'bricks'),
  texture('MetalPlates006', 'tấm kim loại', 'metal-plates'),
  texture('Concrete034', 'bê tông', 'concrete'),
  texture('Tiles139', 'sàn gạch ô', 'tiles'),
]
