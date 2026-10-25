import { useEffect, useMemo } from 'react'
import type { SurfaceStyle } from './room-themes'
import { repeated, useSurfaceTextures, type SurfaceName } from './textures'

interface SurfaceMaterialProps {
  style: SurfaceStyle
  width: number // size of the surface in metres, so textures keep a real-world scale
  height: number
}

function TexturedMaterial({ style, texture, width, height }: SurfaceMaterialProps & { texture: SurfaceName }) {
  const [colour, normal] = useSurfaceTextures(texture)
  const maps = useMemo(() => {
    const rx = Math.max(1, width / style.tile)
    const ry = Math.max(1, height / style.tile)
    return { map: repeated(colour, rx, ry, true), normalMap: repeated(normal, rx, ry, false) }
  }, [colour, normal, width, height, style.tile])
  useEffect(
    () => () => {
      maps.map.dispose()
      maps.normalMap.dispose()
    },
    [maps],
  )
  return (
    <meshStandardMaterial
      {...maps}
      color={style.colour}
      roughness={style.roughness}
      metalness={style.metalness ?? 0}
    />
  )
}

// The material of a wall, floor or other surface, following a room's theme (room-themes.ts).
export default function SurfaceMaterial({ style, width, height }: SurfaceMaterialProps) {
  if (style.texture) return <TexturedMaterial style={style} texture={style.texture} width={width} height={height} />
  return <meshStandardMaterial color={style.colour} roughness={style.roughness} metalness={style.metalness ?? 0} />
}
