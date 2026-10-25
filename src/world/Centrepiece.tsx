import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { ERA_ROOMS } from '../types'
import { roomById } from './layout'
import { GOLD, ROOM_ACCENT } from './style'

// THE ROTUNDA'S CENTREPIECE: a tiered marble pedestal carrying a slowly turning brass
// "armillary" of four rings, one per Industrial Revolution in that room's colour, around
// a gold sphere. Four glowing inlays on the pedestal point to the four era doors.
// (Collision: a box in layout.ts, COLLISION_BOXES.)

// (Metals are kept fairly matt: very shiny thin gold under the chandelier made tiny bright
// highlights that the glow effect turned into flicker while turning the camera.)
const MALACHITE = '#1f3a32' // deep green stone
const CREAM_MARBLE = '#ece4d4'

// Each ring: colour, radius, tilt (x, z) and turning speed. CMCN 4's ring glows.
const RINGS = ERA_ROOMS.map((room, i) => ({
  room,
  colour: ROOM_ACCENT[room],
  radius: 1.0 - i * 0.1,
  tilt: [0.35 + i * 0.4, i * 0.5] as const,
  speed: (i % 2 === 0 ? 1 : -1) * (0.18 + i * 0.06),
  glows: room === 'ir4',
}))

function GoldBand({ radius, y }: { radius: number; y: number }) {
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.03, 8, 64]} />
      <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.42} />
    </mesh>
  )
}

export default function Centrepiece() {
  const rings = useRef<(Group | null)[]>([])
  useFrame((_, delta) => {
    rings.current.forEach((ring, i) => {
      if (ring) ring.rotation.y += delta * RINGS[i].speed
    })
  })

  return (
    <group>
      {/* Pedestal: green stone base, cream marble tier, green drum, each with a gold band. */}
      <mesh position={[0, 0.11, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.7, 1.75, 0.22, 48]} />
        <meshStandardMaterial color={MALACHITE} roughness={0.2} metalness={0.1} />
      </mesh>
      <GoldBand radius={1.71} y={0.22} />
      <mesh position={[0, 0.395, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.4, 0.35, 48]} />
        <meshStandardMaterial color={CREAM_MARBLE} roughness={0.25} />
      </mesh>
      <GoldBand radius={1.36} y={0.57} />
      <mesh position={[0, 0.845, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.9, 0.55, 40]} />
        <meshStandardMaterial color={MALACHITE} roughness={0.2} metalness={0.1} />
      </mesh>
      <GoldBand radius={0.76} y={1.12} />

      {/* A glowing inlay on the drum facing each era room's door. */}
      {ERA_ROOMS.map((id) => {
        const room = roomById(id)
        if (!room) return null
        const { nx, nz } = room.frame
        return (
          <mesh key={id} position={[nx * 0.84, 0.85, nz * 0.84]} rotation={[0, Math.atan2(nx, nz), 0]}>
            <boxGeometry args={[0.14, 0.32, 0.04]} />
            <meshStandardMaterial color={ROOM_ACCENT[id]} emissive={ROOM_ACCENT[id]} emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        )
      })}

      {/* Gold column holding the armillary. */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 1.3, 16]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.42} />
      </mesh>

      <group position={[0, 2.75, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 32, 20]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.38} />
        </mesh>
        {RINGS.map((ring, i) => (
          <group key={ring.room} ref={(g) => { rings.current[i] = g }}>
            <mesh rotation={[ring.tilt[0], 0, ring.tilt[1]]} castShadow>
              <torusGeometry args={[ring.radius, 0.035, 10, 72]} />
              {ring.glows ? (
                <meshStandardMaterial color={ring.colour} emissive={ring.colour} emissiveIntensity={3} toneMapped={false} />
              ) : (
                <meshStandardMaterial color={ring.colour} metalness={0.8} roughness={0.42} />
              )}
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
