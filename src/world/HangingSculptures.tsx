import { useRef, type JSX } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { ERA_ROOMS, type RoomId } from '../types'
import { ROTUNDA_HEIGHT, ROTUNDA_RADIUS, roomById } from './layout'
import { GOLD } from './style'

// HANGING SCULPTURES in the rotunda: four large pieces suspended from the dome on thin
// cables, the way real museums hang big objects in their entrance halls. Each one floats
// in front of its era's door, well above head height (it never blocks the way), and turns
// very slowly: a brass cog (steam), a glowing light bulb (electricity), a floppy disk
// (computers) and a glowing polyhedron (digital).

const DISTANCE = 7.2 // metres from the centre of the rotunda, towards the door
const HEIGHT = 5.6 // height of the sculpture's middle above the floor

function Glow({ colour, intensity }: { colour: string; intensity: number }) {
  return <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={intensity} toneMapped={false} />
}

function Cog() {
  const brass = <meshStandardMaterial color="#b5863f" metalness={0.85} roughness={0.35} />
  return (
    <group>
      <mesh>
        <torusGeometry args={[0.85, 0.16, 12, 48]} />
        {brass}
      </mesh>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 1.08, Math.sin(a) * 1.08, 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.28, 0.24, 0.26]} />
            {brass}
          </mesh>
        )
      })}
      {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a) => (
        <mesh key={a} rotation={[0, 0, a]}>
          <boxGeometry args={[1.6, 0.12, 0.12]} />
          {brass}
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.3, 24]} />
        {brass}
      </mesh>
    </group>
  )
}

function Bulb() {
  return (
    <group>
      {/* Clear glass bulb, a glowing filament inside, a brass screw cap on top. */}
      <mesh>
        <sphereGeometry args={[0.85, 32, 24]} />
        <meshStandardMaterial color="#fff6e0" transparent opacity={0.22} roughness={0.05} metalness={0.1} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.025, 8, 24, Math.PI * 1.6]} />
        <Glow colour="#ffcf85" intensity={6} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.32, 0.4, 0.5, 24]} />
        <meshStandardMaterial color="#a8823f" metalness={0.9} roughness={0.3} />
      </mesh>
      {[0.68, 0.8, 0.92, 1.04].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.36, 0.025, 6, 24]} />
          <meshStandardMaterial color="#d0a85a" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function Floppy() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[1.6, 1.6, 0.1]} />
        <meshStandardMaterial color="#1d2a44" roughness={0.5} />
      </mesh>
      {/* Metal shutter at the top and a paper label below it (both sides). */}
      {[1, -1].map((side) => (
        <group key={side} position={[0, 0, side * 0.052]} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
          <mesh position={[0.15, 0.48, 0]}>
            <planeGeometry args={[0.8, 0.62]} />
            <meshStandardMaterial color="#c9ced4" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.32, 0]}>
            <planeGeometry args={[1.2, 0.78]} />
            <meshStandardMaterial color="#efe8d8" roughness={0.8} />
          </mesh>
          {[-0.15, -0.32, -0.49].map((y) => (
            <mesh key={y} position={[0, y, 0.002]}>
              <planeGeometry args={[1.0, 0.03]} />
              <meshStandardMaterial color="#6a8fc7" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Polyhedron() {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#3fd0e0" emissive="#3fd0e0" emissiveIntensity={2} wireframe toneMapped={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.45, 1]} />
        <Glow colour="#bff6ff" intensity={2.5} />
      </mesh>
    </group>
  )
}

const PIECES: Record<string, () => JSX.Element> = { ir1: Cog, ir2: Bulb, ir3: Floppy, ir4: Polyhedron }

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
  const Piece = PIECES[room]
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
        <Piece />
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
