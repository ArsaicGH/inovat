import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, MeshStandardMaterial } from 'three'
import { useMuseumStore } from '../state/useMuseumStore'
import { GOLD } from './style'

// THE PORTAL DOOR in the Game Room's back wall. Until the quiz is passed it is a plain,
// closed double door in a white-and-gold frame. Once the visitor gets half or more right
// (quizPassed), the two leaves swing open and reveal a bright, softly pulsing portal of
// white-gold light. It leads nowhere yet: the wall behind it is still solid.
//
// Local coordinates: x across the wall, y up, z out of the wall into the room.

const W = 2.2 // opening width
const H = 3.0 // opening height
const LEAF_W = W / 2
const OPEN_ANGLE = 1.4 // radians each leaf turns when fully open (out into the room)
const OPEN_TIME = 2.5 // seconds to swing open

function Leaf({ side, open }: { side: -1 | 1; open: { current: number } }) {
  const hinge = useRef<Group>(null)
  useFrame(() => {
    // Ease in and out, so the doors start and stop gently.
    const t = open.current
    const eased = t * t * (3 - 2 * t)
    if (hinge.current) hinge.current.rotation.y = side * eased * OPEN_ANGLE
  })
  const ivory = <meshStandardMaterial color="#f1e9d8" roughness={0.4} />
  const gold = <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
  return (
    // Hinged at the outer edge of the opening.
    <group ref={hinge} position={[side * (W / 2), 0, 0.06]}>
      <group position={[-side * (LEAF_W / 2), H / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[LEAF_W - 0.02, H - 0.02, 0.08]} />
          {ivory}
        </mesh>
        {/* Two raised panels with gold mouldings. */}
        {[0.62, -0.5].map((y) => (
          <group key={y} position={[0, y * (H / 2), 0.045]}>
            <mesh>
              <boxGeometry args={[LEAF_W * 0.68, y > 0 ? H * 0.34 : H * 0.36, 0.02]} />
              {ivory}
            </mesh>
          </group>
        ))}
        {[0.62, -0.5].map((y) =>
          [-1, 1].flatMap((sx) => [
            <mesh key={`v${y}${sx}`} position={[sx * LEAF_W * 0.34, y * (H / 2), 0.06]}>
              <boxGeometry args={[0.025, y > 0 ? H * 0.34 : H * 0.36, 0.015]} />
              {gold}
            </mesh>,
            <mesh key={`h${y}${sx}`} position={[0, y * (H / 2) + sx * (y > 0 ? H * 0.17 : H * 0.18), 0.06]}>
              <boxGeometry args={[LEAF_W * 0.68, 0.025, 0.015]} />
              {gold}
            </mesh>,
          ]),
        )}
        {/* Gold handle near the middle of the double door. */}
        <mesh position={[-side * (LEAF_W / 2 - 0.12), -0.1, 0.07]}>
          <boxGeometry args={[0.03, 0.3, 0.04]} />
          {gold}
        </mesh>
      </group>
    </group>
  )
}

export default function PortalDoor() {
  const passed = useMuseumStore((state) => state.quizPassed)
  const open = useRef(0) // 0 = closed, 1 = fully open
  const light = useRef<MeshStandardMaterial>(null)
  const swirl = useRef<Group>(null)
  useFrame((state, delta) => {
    const target = passed ? 1 : 0
    open.current = Math.min(1, Math.max(0, open.current + Math.sign(target - open.current) * (delta / OPEN_TIME)))
    // The portal brightens as the doors open, and then breathes gently.
    if (light.current) light.current.emissiveIntensity = open.current * (2.4 + 0.4 * Math.sin(state.clock.elapsedTime * 1.6))
    if (swirl.current) {
      swirl.current.rotation.z += delta * 0.4
      swirl.current.visible = open.current > 0.01
    }
  })
  const gold = <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.28} />
  return (
    <group>
      {/* The portal: a glowing surface just inside the opening, dark until it opens. */}
      <mesh position={[0, H / 2, 0.02]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial ref={light} color="#fff4dc" emissive="#ffe6b0" emissiveIntensity={0} toneMapped={false} />
      </mesh>
      {/* Slowly turning gold rings inside the light. */}
      <group ref={swirl} position={[0, H / 2, 0.03]}>
        {[0.95, 0.7, 0.45].map((r, i) => (
          <mesh key={r} rotation={[0, 0, i]}>
            <torusGeometry args={[r, 0.015, 6, 48, Math.PI * 1.5]} />
            <meshStandardMaterial color="#fff0c8" emissive="#ffd88a" emissiveIntensity={3} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <Leaf side={-1} open={open} />
      <Leaf side={1} open={open} />
      {/* White door surround with a gold inner bead, and a pediment with a gold crest. */}
      {[
        [-(W / 2 + 0.15), H / 2, 0.3, H],
        [W / 2 + 0.15, H / 2, 0.3, H],
        [0, H + 0.15, W + 0.6, 0.3],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.08]} castShadow>
          <boxGeometry args={[w, h, 0.16]} />
          <meshStandardMaterial color="#f7f3ea" roughness={0.35} />
        </mesh>
      ))}
      {[
        [-(W / 2 + 0.01), H / 2, 0.03, H],
        [W / 2 + 0.01, H / 2, 0.03, H],
        [0, H + 0.01, W + 0.05, 0.03],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.17]}>
          <boxGeometry args={[w, h, 0.03]} />
          {gold}
        </mesh>
      ))}
      <mesh position={[0, H + 0.15, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.05, 24]} />
        {gold}
      </mesh>
    </group>
  )
}
