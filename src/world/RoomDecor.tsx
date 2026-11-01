import { useRef, type ReactNode } from 'react'
import { useContent } from '../content/use-content'
import { useFrame } from '@react-three/fiber'
import type { Group, MeshStandardMaterial } from 'three'
import type { RoomId } from '../types'
import { ERA_NUMBER_SCALE, eraNumberY } from './WallPictures'
import { ANTE_DEPTH, DOOR_WIDTH, HALL_PLANTS, QUIZ_BOARD as DISPLAY, QUIZ_PLATFORM, QUIZ_STAND, roomById, toWorld } from './layout'
import { ROOM_ACCENT, DARK_WOOD, GOLD } from './style'
import Sign from './Sign'
import EraNumeral from './EraNumeral'
import QuizWall from './QuizWall'
import MergeStatic from './MergeStatic'
import PortalDoor from './PortalDoor'
import EraSculpture from './era-sculptures'
import AnteDecor from './ante-decor'
import { useMuseumStore } from '../state/useMuseumStore'

// DECORATION OF EACH ROOM (M6), built from simple shapes. Inside each room the local axes
// are: x across the room, z towards the entrance (front wall at z = +depth/2, back wall at
// z = -depth/2), y up. Things that glow use bright self-lit materials (picked up by bloom),
// not real lights, so they cost almost nothing.

type ThemedRoom = Exclude<RoomId, 'rotunda'>

function Glow({ colour, intensity = 4 }: { colour: string; intensity?: number }) {
  return <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={intensity} toneMapped={false} />
}

interface RoomSize {
  w: number // width
  d: number // depth
  h: number // height
}

// Era rooms: the middle of the entrance room (local z; the entrance is at +depth/2).
// Elsewhere: the middle of the room.
function anteZ(room: string, size: RoomSize): number {
  return ['ir1', 'ir2', 'ir3', 'ir4'].includes(room) ? size.d / 2 - ANTE_DEPTH / 2 : 0
}

// The decorations were laid out for a 14 m room; positions are stretched by this factor so
// they spread out evenly in rooms of any size.
const spread = (size: RoomSize) => size.w / 14

// Era number (or the quiz room's name sign) high on the back wall, and a medallion in
// the middle of the floor.
function RoomIdentity({ room, size }: { room: ThemedRoom; size: RoomSize }) {
  const { roomNames } = useContent()
  const name = roomNames[room]
  const accent = ROOM_ACCENT[room]
  const inlay = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }
  return (
    <>
      {/* Era rooms: a decorated number in the middle of the back wall, framed by four
          pictures of the era (WallPictures.tsx, ERA_NUMBER_Y). */}
      {room === 'ir1' || room === 'ir2' || room === 'ir3' || room === 'ir4' ? (
        // (CMCN 4's outline number reads smaller than the solid ones: drawn larger.)
        <group position={[0, eraNumberY(size.h), -size.d / 2 + 0.03]} scale={(room === 'ir4' ? 1.4 : 1) * ERA_NUMBER_SCALE}>
          <EraNumeral era={room} />
        </group>
      ) : (
        // (The Game Room's back wall is the quiz screen, so it has no name sign.)
        room !== 'quiz' && (
          <group position={[0, size.h - 1.1, -size.d / 2 + 0.03]}>
            <Sign title={name.short} subtitle={name.short !== name.name ? name.name : undefined} width={5.2} height={1.2} />
          </group>
        )
      )}
      {room !== 'quiz' && (
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, anteZ(room, size)]}>
        <mesh>
          <ringGeometry args={[1.6, 1.75, 64]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} metalness={0.6} roughness={0.3} {...inlay} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.5, 0.56, 48]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} metalness={0.6} roughness={0.3} {...inlay} />
        </mesh>
      </group>
      )}
    </>
  )
}

// CMCN 1: wall lanterns.
function SteamAge({ size }: { size: RoomSize }) {
  const lanterns: [number, number, number][] = [
    [-size.w / 2 + 0.15, 2.6, -3 * spread(size)],
    [-size.w / 2 + 0.15, 2.6, 3 * spread(size)],
    [size.w / 2 - 0.15, 2.6, -3 * spread(size)],
    [size.w / 2 - 0.15, 2.6, 3 * spread(size)],
  ]
  return (
    <>
      {lanterns.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[0.22, 0.34, 0.22]} />
            <meshStandardMaterial color="#2a2420" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.16, 0.24, 0.16]} />
            <Glow colour="#ffb45e" intensity={5} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// CMCN 2: hanging electric bulbs.
function ElectricAge({ size }: { size: RoomSize }) {
  return (
    <>
      {[-3, 0, 3].map((x) => x * spread(size)).flatMap((x) =>
        [-3, 3].map((z) => z * spread(size)).map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh position={[0, size.h - 0.75, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 1.5, 4]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0, size.h - 1.55, 0]}>
              <sphereGeometry args={[0.1, 14, 10]} />
              <Glow colour="#ffcf85" intensity={3} />
            </mesh>
          </group>
        )),
      )}
    </>
  )
}

// CMCN 3: fluorescent ceiling panels, a coloured wall stripe and a desk of vintage computers.
function ComputerAge({ size }: { size: RoomSize }) {
  return (
    <>
      {[-3.5, 0, 3.5].map((x) => x * spread(size)).flatMap((x) =>
        [-3.5, 0, 3.5].map((z) => z * spread(size)).map((z) => (
          <mesh key={`${x}${z}`} position={[x, size.h - 0.01, z]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.8, 0.5]} />
            <Glow colour="#eef6ff" intensity={0.35} />
          </mesh>
        )),
      )}
    </>
  )
}

// CMCN 4: cyan light strips along the walls, a glowing ceiling ring and a slowly turning
// hologram above the floor medallion.
function DigitalAge({ size }: { size: RoomSize }) {
  const hologram = useRef<Group>(null)
  useFrame((_, delta) => {
    if (hologram.current) hologram.current.rotation.y += delta * 0.4
  })
  // Light strips on the back wall and both side walls: x, z, rotation, length.
  const strips: [number, number, number, number][] = [
    [0, -size.d / 2 + 0.03, 0, size.w],
    [-size.w / 2 + 0.03, 0, Math.PI / 2, size.d],
    [size.w / 2 - 0.03, 0, -Math.PI / 2, size.d],
  ]
  return (
    <>
      {/* One strip just above the floor and one just below the ceiling. */}
      {[0.08, size.h - 0.35].map((y) =>
        strips.map(([x, z, r, len], i) => (
          <mesh key={`${y}-${i}`} position={[x, y, z]} rotation={[0, r, 0]}>
            <boxGeometry args={[len - 0.1, 0.04, 0.02]} />
            <Glow colour="#3fd0e0" intensity={2} />
          </mesh>
        )),
      )}
      <mesh position={[0, size.h - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3 * spread(size), 0.05, 8, 80]} />
        <Glow colour="#7fe9ff" intensity={1} />
      </mesh>
      <group ref={hologram} position={[0, CENTRE_HEIGHT, anteZ('ir4', size)]} userData={{ keepSeparate: true }}>
        <mesh>
          <icosahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial color="#3fd0e0" emissive="#3fd0e0" emissiveIntensity={1.5} wireframe toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.1, 0.015, 6, 64]} />
          <Glow colour="#7fe9ff" intensity={3} />
        </mesh>
      </group>
    </>
  )
}

// Half the width of the Game Room's portal door with its white surround (PortalDoor.tsx:
// 2.2 m opening plus a 0.3 m frame each side). The wall bands leave this gap, so the door
// and its light reach the floor.
const PORTAL_GAP = 1.4

// A band running around all four walls at one height (wainscot, rails, mouldings), with a
// gap for the door in the front wall. thickness = how far it sticks out of the wall.
function WallBand({ size, y, height, thickness, doorGap, backGap = 0, children }: {
  size: RoomSize
  y: number // centre height
  height: number
  thickness: number
  doorGap: number // half width of the gap left around the door (0 = no gap)
  backGap?: number // the same in the back wall (the Game Room's portal door)
  children: ReactNode // the material
}) {
  const { w, d } = size
  const half = thickness / 2
  // x, z, rotation, length of each piece: back wall, two side walls, front wall.
  const pieces: [number, number, number, number][] = [
    [-w / 2 + half, 0, Math.PI / 2, d],
    [w / 2 - half, 0, Math.PI / 2, d],
  ]
  if (backGap > 0) {
    const len = w / 2 - backGap
    pieces.push([-(backGap + len / 2), -d / 2 + half, 0, len], [backGap + len / 2, -d / 2 + half, 0, len])
  } else {
    pieces.push([0, -d / 2 + half, 0, w])
  }
  if (doorGap > 0) {
    const len = w / 2 - doorGap
    pieces.push([-(doorGap + len / 2), d / 2 - half, 0, len], [doorGap + len / 2, d / 2 - half, 0, len])
  } else {
    pieces.push([0, d / 2 - half, 0, w])
  }
  return (
    <>
      {pieces.map(([x, z, r, len], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, r, 0]}>
          <boxGeometry args={[len, height, thickness]} />
          {children}
        </mesh>
      ))}
    </>
  )
}

// A small brass chandelier hanging from the ceiling.
function SmallChandelier({ position, ceiling }: { position: [number, number]; ceiling: number }) {
  const y = ceiling - 1.1
  const brass = <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, (ceiling + y) / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, ceiling - y, 6]} />
        {brass}
      </mesh>
      <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.03, 8, 40]} />
        {brass}
      </mesh>
      {Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * Math.PI * 2
        return (
          <mesh key={k} position={[Math.cos(a) * 0.5, y + 0.1, Math.sin(a) * 0.5]}>
            <sphereGeometry args={[0.06, 12, 8]} />
            <Glow colour="#ffd49a" intensity={6} />
          </mesh>
        )
      })}
    </group>
  )
}

// A potted plant: a dark pot with a gold rim and a few overlapping balls of leaves.
function Plant({ x, z }: { x: number; z: number }) {
  const leaves: [number, number, number, number][] = [
    [0, 1.05, 0, 0.42],
    [0.2, 1.35, 0.1, 0.3],
    [-0.18, 1.3, -0.12, 0.32],
    [0.05, 1.6, -0.05, 0.24],
  ]
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.6, 20]} />
        <meshStandardMaterial color="#2f2a26" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.025, 6, 24]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
      </mesh>
      {leaves.map(([lx, ly, lz, r], i) => (
        <mesh key={i} position={[lx, ly, lz]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color="#3f6b3a" roughness={0.8} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// The museum's name on the hall's back wall. Hidden while the title screen shows the same
// words, then fades in once the visit starts.
function FadingSignText({ width, height }: { width: number; height: number }) {
  const { site } = useContent()
  const material = useRef<MeshStandardMaterial>(null)
  useFrame((_, delta) => {
    if (!material.current) return
    const shown = useMuseumStore.getState().mode !== 'start'
    const target = shown ? 1 : 0
    material.current.opacity += Math.sign(target - material.current.opacity) * Math.min(delta / 1.2, Math.abs(target - material.current.opacity))
    material.current.visible = material.current.opacity > 0.001
  })
  return (
    <group position={[0, 0, 0.004]} userData={{ keepSeparate: true }}>
      <Sign title={site.name} subtitle={site.subtitle} width={width} height={height} textOnly materialRef={material} />
    </group>
  )
}

// INTRO HALL: a welcoming lobby in the rotunda's Victorian style. Wooden wainscot with a
// gold rail, a red carpet from the start point to the door, two small chandeliers, plants
// in the corners, the museum's name on the back wall and a sign above the door.
function IntroHall({ size }: { size: RoomSize }) {
  const { roomNames } = useContent()
  const doorGap = DOOR_WIDTH / 2 + 0.15
  const gold = <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
  const inlay = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }
  const carpetLength = size.d - 0.4
  return (
    <>
      {/* Wainscot kept below the information boards (their bottom edge is at 0.9 m). */}
      <WallBand size={size} y={0.4} height={0.8} thickness={0.03} doorGap={doorGap}>
        <meshStandardMaterial color={DARK_WOOD} roughness={0.5} />
      </WallBand>
      <WallBand size={size} y={0.82} height={0.05} thickness={0.05} doorGap={doorGap}>
        {gold}
      </WallBand>
      {/* Crown moulding along the top of the walls. */}
      <WallBand size={size} y={size.h - 0.12} height={0.24} thickness={0.08} doorGap={0}>
        <meshStandardMaterial color="#f4ead6" roughness={0.6} />
      </WallBand>
      <WallBand size={size} y={size.h - 0.27} height={0.04} thickness={0.1} doorGap={0}>
        {gold}
      </WallBand>

      {/* Red carpet with gold edges, from the back wall to the door. */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.2]}>
        <mesh receiveShadow>
          <planeGeometry args={[2, carpetLength]} />
          <meshStandardMaterial color="#7a1f2b" roughness={0.95} {...inlay} />
        </mesh>
        {[-0.92, 0.92].map((x) => (
          // 3 mm above the carpet: in the same plane they flickered against each other.
          <mesh key={x} position={[x, 0, 0.003]}>
            <planeGeometry args={[0.06, carpetLength]} />
            <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.4} {...inlay} />
          </mesh>
        ))}
      </group>

      <SmallChandelier position={[0, -2]} ceiling={size.h} />
      <SmallChandelier position={[0, 2]} ceiling={size.h} />

      {HALL_PLANTS.map(([x, z]) => (
        <Plant key={`${x}${z}`} x={x} z={z} />
      ))}

      {/* The museum's name on the back wall, between two wall lamps. */}
      <group position={[0, 2.75, -size.d / 2 + 0.03]}>
        <Sign title="" width={4.4} height={1.3} />
        <FadingSignText width={4.4} height={1.3} />
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 2.9, -0.1, 0]}>
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[0.16, 0.36, 0.06]} />
              {gold}
            </mesh>
            <mesh position={[0, 0.22, 0.2]}>
              <sphereGeometry args={[0.09, 16, 12]} />
              <Glow colour="#ffd49a" intensity={6} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Above the door, facing into the hall: where the visit begins. */}
      <group position={[0, 3.7, size.d / 2 - 0.03]} rotation={[0, Math.PI, 0]}>
        <Sign title={roomNames.rotunda.name} width={2.8} height={0.7} />
      </group>
    </>
  )
}

// Game Room: a bright white-and-gold salon like the intro hall and the rotunda. Cream
// panelled walls with gold frames between white pilasters, warm sconces, a gold crown
// moulding, a red carpet from the door up to a raised round platform under a spotlight,
// where the quiz stand waits, and the portal door in the back wall (PortalDoor.tsx).
const PANEL_W = 2.3
const CREAM = '#e9dcc2'
const IVORY = '#f6f0e4'
// The quiz lectern: a plinth, a slim column and a sloping top with the quiz screen, like a
// conference lectern but in ivory and gold. The screen's layout is drawn large
// (QuizWall.tsx) and shrunk to fit. Its centre stands TOP_Y above the platform, tilted
// back so it faces the eyes (1.6 m) of a visitor standing just in front of it.
const STAND_SCALE = QUIZ_STAND.width / (DISPLAY.w + 0.6)
const TOP_Y = 1.0
const TILT = -0.7 // radians about x: the screen faces up and towards the visitor's eyes (about 40 degrees)
const SCREEN_DEPTH = (DISPLAY.h + 0.6) * STAND_SCALE // depth of the sloping top
function QuizRoom({ size }: { size: RoomSize }) {
  const gold = <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
  const ivory = <meshStandardMaterial color={IVORY} roughness={0.35} />
  const doorGap = DOOR_WIDTH / 2 + 0.15
  // Along each side wall: three panels, with a pilaster before, between and after them.
  const panelZs = [-1, 0, 1].map((k) => k * (size.d / 3))
  const pilasterZs = [-1.5, -0.5, 0.5, 1.5].map((k) => k * (size.d / 3))
  const p = QUIZ_PLATFORM
  // The carpet runs from the start of the entrance passage (5 m long) to the portal door;
  // the platform sits on top of it.
  const carpetFront = size.d / 2 + 4.8
  const carpetBack = -size.d / 2 + 0.05
  const carpetLength = carpetFront - carpetBack
  return (
    <>
      {/* Raised round platform: white marble on a gold-edged step. */}
      <group position={[0, 0, p.z]}>
        <mesh position={[0, p.height / 2, 0]} receiveShadow>
          <cylinderGeometry args={[p.radius, p.radius + 0.05, p.height, 64]} />
          <meshStandardMaterial color="#f7f3ea" roughness={0.2} />
        </mesh>
        <mesh position={[0, p.height + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[p.radius - 0.18, p.radius - 0.1, 64]} />
          {gold}
        </mesh>
        <mesh position={[0, p.height + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.86, 48]} />
          {gold}
        </mesh>
        <mesh position={[0, p.height - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[p.radius + 0.02, 0.03, 8, 64]} />
          {gold}
        </mesh>
      </group>
      {/* The quiz lectern. */}
      <group position={[0, p.height, QUIZ_STAND.z]}>
        {/* Plinth: a wide ivory base with a gold edge. */}
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.1, 0.6]} />
          {ivory}
        </mesh>
        <mesh position={[0, 0.105, 0]}>
          <boxGeometry args={[0.8, 0.012, 0.5]} />
          {gold}
        </mesh>
        {/* Column with gold bands. */}
        <mesh position={[0, (TOP_Y - 0.1) / 2 + 0.05, -0.05]} castShadow>
          <boxGeometry args={[0.34, TOP_Y - 0.1, 0.22]} />
          {ivory}
        </mesh>
        {[0.2, TOP_Y - 0.22].map((y) => (
          <mesh key={y} position={[0, y, -0.05]}>
            <boxGeometry args={[0.36, 0.035, 0.24]} />
            {gold}
          </mesh>
        ))}
        {/* Sloping top: an ivory case with a gold rim, the screen set into it. */}
        <group position={[0, TOP_Y, 0]} rotation={[TILT, 0, 0]}>
          <mesh position={[0, 0, -0.03]} castShadow>
            <boxGeometry args={[QUIZ_STAND.width + 0.12, SCREEN_DEPTH + 0.12, 0.06]} />
            {ivory}
          </mesh>
          <mesh position={[0, 0, -0.064]}>
            <boxGeometry args={[QUIZ_STAND.width + 0.15, SCREEN_DEPTH + 0.15, 0.012]} />
            {gold}
          </mesh>
          <group position={[0, -DISPLAY.y * STAND_SCALE, 0]} scale={STAND_SCALE} userData={{ keepSeparate: true }}>
            <QuizWall />
          </group>
        </group>
        {/* A slim gold gooseneck microphone at the back corner. */}
        <group position={[QUIZ_STAND.width / 2 - 0.05, TOP_Y + 0.1, -0.2]}>
          <mesh position={[0, 0.15, 0]} rotation={[0.35, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.012, 0.32, 8]} />
            {gold}
          </mesh>
          <mesh position={[0, 0.3, 0.06]}>
            <sphereGeometry args={[0.02, 10, 8]} />
            {gold}
          </mesh>
        </group>
      </group>
      {/* Red carpet from the entrance to the portal door, with gold edges. */}
      <group position={[0, 0.006, (carpetFront + carpetBack) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh receiveShadow>
          <planeGeometry args={[1.6, carpetLength]} />
          <meshStandardMaterial color="#8c1a24" roughness={0.95} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.74, 0, 0.003]}>
            <planeGeometry args={[0.06, carpetLength]} />
            {gold}
          </mesh>
        ))}
      </group>
      <group position={[0, 0, -size.d / 2]} userData={{ keepSeparate: true }}>
        <PortalDoor />
      </group>
      {/* Wainscot: cream panelling to 1 m, a gold rail on top and a gold line at the floor. */}
      <WallBand size={size} y={0.5} height={1} thickness={0.06} doorGap={doorGap} backGap={PORTAL_GAP}>
        <meshStandardMaterial color={CREAM} roughness={0.5} />
      </WallBand>
      <WallBand size={size} y={1.02} height={0.06} thickness={0.1} doorGap={doorGap} backGap={PORTAL_GAP}>
        {gold}
      </WallBand>
      <WallBand size={size} y={0.05} height={0.1} thickness={0.08} doorGap={doorGap} backGap={PORTAL_GAP}>
        {gold}
      </WallBand>
      {/* Crown moulding: a gold band under the ceiling all round the room. */}
      <WallBand size={size} y={size.h - 0.12} height={0.24} thickness={0.12} doorGap={0}>
        {gold}
      </WallBand>
      {[-1, 1].map((s) => (
        // On each side wall, local x runs along the wall and +z points into the room.
        <group key={s} position={[s * (size.w / 2), 0, 0]} rotation={[0, -s * Math.PI / 2, 0]}>
          {panelZs.map((z) => (
            <group key={z} position={[-s * z, 2.4, 0]}>
              <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[PANEL_W, 2.2]} />
                <meshStandardMaterial color={CREAM} roughness={0.6} />
              </mesh>
              {[
                [0, 1.1, PANEL_W + 0.1, 0.08],
                [0, -1.1, PANEL_W + 0.1, 0.08],
                [-PANEL_W / 2, 0, 0.08, 2.2],
                [PANEL_W / 2, 0, 0.08, 2.2],
              ].map(([x, y, w, h], i) => (
                <mesh key={i} position={[x, y, 0.05]}>
                  <boxGeometry args={[w, h, 0.06]} />
                  {gold}
                </mesh>
              ))}
              {/* A gold diamond in the middle of each panel. */}
              <mesh position={[0, 0, 0.04]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.42, 0.42, 0.03]} />
                {gold}
              </mesh>
              <mesh position={[0, 0, 0.05]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.28, 0.28, 0.03]} />
                <meshStandardMaterial color={CREAM} roughness={0.6} />
              </mesh>
            </group>
          ))}
          {/* Pilasters: white with a gold base and capital; the two inner ones carry a warm
              sconce (self-lit bulbs, no real light). */}
          {pilasterZs.map((z, i) => (
            <group key={z} position={[-s * z, 0, 0]}>
              <mesh position={[0, (size.h - 0.24) / 2, 0.08]}>
                <boxGeometry args={[0.36, size.h - 0.24, 0.16]} />
                {ivory}
              </mesh>
              <mesh position={[0, 1.08, 0.12]}>
                <boxGeometry args={[0.46, 0.14, 0.2]} />
                {gold}
              </mesh>
              <mesh position={[0, size.h - 0.36, 0.12]}>
                <boxGeometry args={[0.5, 0.2, 0.22]} />
                {gold}
              </mesh>
              {(i === 1 || i === 2) && (
                <group position={[0, 2.5, 0.16]}>
                  <mesh>
                    <boxGeometry args={[0.16, 0.4, 0.04]} />
                    {gold}
                  </mesh>
                  <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
                    {gold}
                  </mesh>
                  <mesh position={[0, 0.06, 0.28]}>
                    <cylinderGeometry args={[0.05, 0.07, 0.08, 16]} />
                    {gold}
                  </mesh>
                  <mesh position={[0, 0.17, 0.28]}>
                    <sphereGeometry args={[0.07, 14, 10]} />
                    <Glow colour="#ffcf8a" intensity={5} />
                  </mesh>
                </group>
              )}
            </group>
          ))}
        </group>
      ))}
    </>
  )
}

// CMCN 1-3: the room's era sculpture (era-sculptures.tsx, also hanging in the rotunda),
// smaller, hanging on a thin cable from the ceiling above the floor medallion and turning
// slowly. (CMCN 4 has its floating hologram instead: the futuristic one needs no cable.)
const CENTRE_SCALE = 0.62
// High above the overview board standing under it (top at 2.3 m), so that from the
// entrance the era number on the back wall shows between the two; the CMCN 4
// hologram floats at the same height.
const CENTRE_HEIGHT = 3.55 // (under the 4.8 m ceiling, still above the board)
function CentreSculpture({ room, size }: { room: ThemedRoom; size: RoomSize }) {
  const z = anteZ(room, size)
  const spin = useRef<Group>(null)
  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.25
  })
  // The cable runs from just above the sculpture (the bulb's cap is taller) to the ceiling.
  const top = CENTRE_HEIGHT + (room === 'ir2' ? 1.1 : 1.05) * CENTRE_SCALE
  return (
    <>
      <mesh position={[0, (top + size.h) / 2, z]}>
        <cylinderGeometry args={[0.01, 0.01, size.h - top, 6]} />
        <meshStandardMaterial color="#2e2a26" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, top, z]}>
        <sphereGeometry args={[0.04, 12, 8]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
      </mesh>
      <group ref={spin} position={[0, CENTRE_HEIGHT, z]} scale={CENTRE_SCALE} userData={{ keepSeparate: true }}>
        <EraSculpture room={room} />
      </group>
    </>
  )
}

const DECOR: Partial<Record<ThemedRoom, (props: { size: RoomSize }) => ReactNode>> = {
  hall: IntroHall,
  ir1: SteamAge,
  ir2: ElectricAge,
  ir3: ComputerAge,
  ir4: DigitalAge,
  quiz: QuizRoom,
}

// Decoration for one room, placed and turned to match the room in the floor plan.
export default function RoomDecor({ room }: { room: ThemedRoom }) {
  const layout = roomById(room)
  if (!layout) return null
  const [x, z] = toWorld(layout.frame, 0, (layout.vFront + layout.vBack) / 2)
  const size = { w: layout.width, d: layout.depth, h: layout.height }
  const Decor = DECOR[room]
  return (
    <group position={[x, 0, z]} rotation={[0, layout.frame.angle, 0]}>
      {/* Static decoration is joined into a few meshes per room (far fewer draw calls);
          the parts that move or change are marked keepSeparate. */}
      <MergeStatic>
        {/* The hall shows the museum's own name instead (IntroHall). */}
        {room !== 'hall' && <RoomIdentity room={room} size={size} />}
        {Decor && <Decor size={size} />}
        {(room === 'ir1' || room === 'ir2' || room === 'ir3') && <CentreSculpture room={room} size={size} />}
        {/* The entrance room's panelling and wall lights (ante-decor.tsx). */}
        {(room === 'ir1' || room === 'ir2' || room === 'ir3' || room === 'ir4') && <AnteDecor room={room} size={size} />}
      </MergeStatic>
    </group>
  )
}
