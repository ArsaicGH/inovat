import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import type { RoomId } from '../types'
import { WALL_PIECES } from './layout'
import { addAimTarget, removeAimTarget } from './aim-targets'

// The wall blocks of one part of the museum (the rotunda or one room), from the floor plan.
export default function Walls({ group: groupId }: { group: RoomId }) {
  const group = useRef<Group>(null)

  // Walls block the crosshair, so exhibits behind a wall cannot be opened.
  useEffect(() => {
    const walls = group.current
    if (!walls) return
    addAimTarget(walls)
    return () => removeAimTarget(walls)
  }, [])

  return (
    <group ref={group}>
      {WALL_PIECES.filter((piece) => piece.group === groupId).map((piece, i) => (
        <mesh
          key={i}
          position={[piece.cx, (piece.minY + piece.maxY) / 2, piece.cz]}
          rotation={[0, piece.angle, 0]}
          receiveShadow
        >
          <boxGeometry args={[piece.hx * 2, piece.maxY - piece.minY, piece.hz * 2]} />
          <meshStandardMaterial color={piece.solid ? '#c9c3b8' : '#a9a397'} />
        </mesh>
      ))}
    </group>
  )
}
