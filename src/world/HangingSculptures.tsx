import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { ERA_ROOMS, type RoomId } from '../types'
import { ROTUNDA_HEIGHT, ROTUNDA_RADIUS, roomById } from './layout'
import { GOLD } from './style'
import EraSculpture from './era-sculptures'

// HANGING SCULPTURES in the rotunda: four large pieces suspended from the dome on thin
// cables, the way real museums hang big objects in their entrance halls. Each one floats
// in front of its era's door, well above head height (it never blocks the way), and turns
// very slowly (the era sculptures, era-sculptures.tsx).

const DISTANCE = 7.2 // metres from the centre of the rotunda, towards the door
const HEIGHT = 5.6 // height of the sculpture's middle above the floor


function Hanging({ room, index }: { room: RoomId; index: number }) {
  const spin = useRef<Group>(null)
  useFrame((_, delta) => {
    // Each turns slowly, alternating direction.
    if (spin.current) spin.current.rotation.y += delta * (index % 2 === 0 ? 0.12 : -0.12)
  })
  const layout = roomById(room)
  if (!layout) return null
  const x = layout.frame.nx * DISTANCE
  const z = layout.frame.nz * DISTANCE
  // The cable runs up to the dome (a half sphere sitting on top of the walls).
  const domeY = ROTUNDA_HEIGHT + Math.sqrt(Math.max(0, ROTUNDA_RADIUS ** 2 - DISTANCE ** 2))
  const top = HEIGHT + 1.1
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, (top + domeY) / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, domeY - top, 6]} />
        <meshStandardMaterial color="#2e2a26" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* A small gold fitting where the cable meets the sculpture. */}
      <mesh position={[0, top, 0]}>
        <sphereGeometry args={[0.06, 12, 8]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
      </mesh>
      <group ref={spin} position={[0, HEIGHT, 0]}>
        <EraSculpture room={room} />
      </group>
    </group>
  )
}

export default function HangingSculptures() {
  return (
    <>
      {ERA_ROOMS.map((room, i) => (
        <Hanging key={room} room={room} index={i} />
      ))}
    </>
  )
}
