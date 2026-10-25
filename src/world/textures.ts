import { useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture } from 'three'

// Surface textures in /public/textures (CC0, listed in src/content/credits.ts).
// Each has a colour picture and a "normal" picture (tiny bumps that catch the light).
export type SurfaceName = 'marble' | 'plaster' | 'wood-floor' | 'bricks' | 'metal-plates' | 'concrete' | 'tiles'

// The two loaded pictures of a surface. Loading pauses drawing until they are in
// (React "Suspense").
export function useSurfaceTextures(name: SurfaceName): [Texture, Texture] {
  const [colour, normal] = useLoader(TextureLoader, [`/textures/${name}-color.jpg`, `/textures/${name}-normal.jpg`])
  return [colour, normal]
}

// A cheap copy of a loaded picture that repeats `repeatX` x `repeatY` times across a shape.
// Copies share the same picture data, so the graphics card stores it only once.
export function repeated(texture: Texture, repeatX: number, repeatY: number, isColour: boolean): Texture {
  const copy = texture.clone()
  if (isColour) copy.colorSpace = SRGBColorSpace
  copy.wrapS = copy.wrapT = RepeatWrapping
  copy.repeat.set(repeatX, repeatY)
  copy.anisotropy = 8 // sharper floors when seen at a shallow angle
  copy.needsUpdate = true
  return copy
}

// Load a surface and repeat it across one shape.
export function useSurface(name: SurfaceName, repeatX: number, repeatY = repeatX): { map: Texture; normalMap: Texture } {
  const [colour, normal] = useSurfaceTextures(name)
  return useMemo(
    () => ({ map: repeated(colour, repeatX, repeatY, true), normalMap: repeated(normal, repeatX, repeatY, false) }),
    [colour, normal, repeatX, repeatY],
  )
}
