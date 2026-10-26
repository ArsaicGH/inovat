import type { RoomId } from '../types'
import { SURFACES } from './layout'
import { ROOM_THEMES } from './room-themes'
import SurfaceMaterial from './SurfaceMaterial'
import RoomDecor from './RoomDecor'

// Floor, ceiling and decoration of one room and its entry passage, in the room's theme.
// The walls are drawn by Walls.tsx.
export default function Room({ room }: { room: Exclude<RoomId, 'rotunda'> }) {
  const theme = ROOM_THEMES[room]
  return (
    <>
      {SURFACES.filter((s) => s.group === room).map(({ box, ceilingHeight }, i) => (
        <group key={i} position={[box.cx, 0, box.cz]} rotation={[0, box.angle, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[box.hx * 2, box.hz * 2]} />
            <SurfaceMaterial style={theme.floor} width={box.hx * 2} height={box.hz * 2} />
          </mesh>
          {/* The ceiling faces down and casts no shadow, so the light still reaches inside. */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ceilingHeight, 0]}>
            <planeGeometry args={[box.hx * 2, box.hz * 2]} />
            {theme.ceilingSurface ? (
              <SurfaceMaterial style={theme.ceilingSurface} width={box.hx * 2} height={box.hz * 2} />
            ) : (
              <meshStandardMaterial color={theme.ceiling} roughness={0.8} />
            )}
          </mesh>
        </group>
      ))}
      <RoomDecor room={room} />
    </>
  )
}
