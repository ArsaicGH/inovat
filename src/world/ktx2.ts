import type { WebGLRenderer } from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// COMPRESSED TEXTURES (.ktx2). An ordinary picture (JPG, PNG, WebP) is small to download,
// but the graphics card unpacks it to full size: 4 bytes a pixel, a third more with its
// smaller copies. A KTX2 texture stays compressed on the graphics card (a quarter of the
// memory or less) and arrives with its smaller copies already made. The surface textures
// and the downloaded models' textures are KTX2 files, made with Khronos's KTX-Software
// (toktx, and gltf-transform's uastc / etc1s commands). They are turned into whatever
// compressed format this graphics card reads by a small decoder ("transcoder", from
// three.js) in public/basis/.

export const ktx2Loader = new KTX2Loader().setTranscoderPath(`${import.meta.env.BASE_URL}basis/`)

// The loader must know which compressed formats the graphics card reads before the first
// file arrives. The models start loading before the museum's renderer exists (preload in
// inventions.tsx), so a tiny drawing surface on the same graphics card is asked instead.
const probe = typeof document !== 'undefined' ? document.createElement('canvas').getContext('webgl2') : null
ktx2Loader.detectSupport({
  extensions: {
    has: (name: string) => Boolean(probe?.getExtension(name)),
    get: (name: string) => probe?.getExtension(name),
  },
} as unknown as WebGLRenderer)
probe?.getExtension('WEBGL_lose_context')?.loseContext()

// For useGLTF: models whose textures are KTX2. (drei uses its own copy of the model loader,
// three-stdlib's, which takes this one all the same.)
export const withKtx2 = (loader: object) => {
  const gltf = loader as GLTFLoader
  gltf.setKTX2Loader(ktx2Loader)
}
