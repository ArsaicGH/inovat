import { useEffect, useMemo, useRef } from 'react'
import { MeshStandardMaterial, RepeatWrapping, type Group, type Texture } from 'three'
import type { RoomId } from '../types'
import { WALL_PIECES, type WallPiece } from './layout'
import { addAimTarget, removeAimTarget } from './aim-targets'
import { useSurface } from './textures'
import { ROOM_THEMES } from './room-themes'
import SurfaceMaterial from './SurfaceMaterial'
import { wallWashMap } from './light-maps'

function WallMeshes({ pieces, material }: { pieces: WallPiece[]; material: MeshStandardMaterial }) {
  return (
    <>
      {pieces.map((piece, i) => (
        <mesh
          key={i}
          position={[piece.cx, (piece.minY + piece.maxY) / 2, piece.cz]}
          rotation={[0, piece.angle, 0]}
          material={material}
          receiveShadow
        >
          <boxGeometry args={[piece.hx * 2, piece.maxY - piece.minY, piece.hz * 2]} />
        </mesh>
      ))}
    </>
  )
}

// Rotunda walls: warm cream plaster (one shared material for all pieces).
function PlasterWalls({ pieces }: { pieces: WallPiece[] }) {
  const { map, normalMap } = useSurface('plaster', 2, 2)
  const material = useMemo(
    () => new MeshStandardMaterial({ color: '#efe4cf', map, normalMap, roughness: 0.85 }),
    [map, normalMap],
  )
  useEffect(() => () => material.dispose(), [material])
  return <WallMeshes pieces={pieces} material={material} />
}

// Room walls in the room's theme (room-themes.ts); each block gets its own texture scale.
function ThemedWalls({ pieces, room }: { pieces: WallPiece[]; room: Exclude<RoomId, 'rotunda'> }) {
  const style = ROOM_THEMES[room].walls
  const { wallWash } = ROOM_THEMES[room].lighting
  // The light of the hidden wall-washers (light-maps.ts). With washers in a row, each wall
  // block repeats one washer's cone of light along its length, one every few metres.
  const washes = useMemo(() => {
    if (wallWash.strength <= 0) return pieces.map(() => null)
    const wash = wallWashMap(room)
    if (wallWash.rhythm <= 0) return pieces.map(() => wash)
    return pieces.map((piece): Texture => {
      const copy = wash.clone()
      copy.wrapS = RepeatWrapping
      copy.repeat.set(Math.max(1, Math.round((Math.max(piece.hx, piece.hz) * 2) / wallWash.rhythm)), 1)
      copy.needsUpdate = true
      return copy
    })
  }, [pieces, room, wallWash.strength, wallWash.rhythm])
  // (Only the per-wall copies are freed; the shared picture stays for the next visit.)
  useEffect(() => () => {
    if (wallWash.rhythm > 0) washes.forEach((map) => map?.dispose())
  }, [washes, wallWash.rhythm])
  return (
    <>
      {pieces.map((piece, i) => (
        <mesh
          key={i}
          position={[piece.cx, (piece.minY + piece.maxY) / 2, piece.cz]}
          rotation={[0, piece.angle, 0]}
          receiveShadow
        >
          <boxGeometry args={[piece.hx * 2, piece.maxY - piece.minY, piece.hz * 2]} />
          <SurfaceMaterial
            style={style}
            width={Math.max(piece.hx, piece.hz) * 2}
            height={piece.maxY - piece.minY}
            lightMap={washes[i]}
            lightMapIntensity={wallWash.strength}
          />
        </mesh>
      ))}
    </>
  )
}

// The wall blocks of one part of the museum (the rotunda or one room), from the floor plan.
export default function Walls({ group: groupId }: { group: RoomId }) {
  const group = useRef<Group>(null)
  const pieces = useMemo(() => WALL_PIECES.filter((piece) => piece.group === groupId), [groupId])

  // Walls block the crosshair, so exhibits behind a wall cannot be opened.
  useEffect(() => {
    const walls = group.current
    if (!walls) return
    addAimTarget(walls)
    return () => removeAimTarget(walls)
  }, [])

  return (
    <group ref={group}>
      {groupId === 'rotunda' ? <PlasterWalls pieces={pieces} /> : <ThemedWalls pieces={pieces} room={groupId} />}
    </group>
  )
}
