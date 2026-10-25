import type { RoomId } from '../types'
import { SURFACES } from './layout'

// Grey-box tints so the rooms can be told apart until M6 gives each one its own theme.
const FLOOR_TINTS: Record<RoomId, string> = {
  rotunda: '#6a6458',
  hall: '#5c6170',
  ir1: '#6b5f55',
  ir2: '#5d6166',
  ir3: '#646058',
  ir4: '#565f6b',
  quiz: '#5f5a6b',
}

// Floor and ceiling of one room and its entry passage. The walls are drawn by Walls.tsx.
export default function Room({ room }: { room: RoomId }) {
  return (
    <>
      {SURFACES.filter((s) => s.group === room).map(({ box, ceilingHeight }, i) => (
        <group key={i} position={[box.cx, 0, box.cz]} rotation={[0, box.angle, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[box.hx * 2, box.hz * 2]} />
            <meshStandardMaterial color={FLOOR_TINTS[room]} />
          </mesh>
          {/* The ceiling faces down and casts no shadow, so the light still reaches inside. */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ceilingHeight, 0]}>
            <planeGeometry args={[box.hx * 2, box.hz * 2]} />
            <meshStandardMaterial color="#8a8d94" />
          </mesh>
        </group>
      ))}
    </>
  )
}
