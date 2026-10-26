import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useContent } from '../content/use-content'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, Color, MeshBasicMaterial, Object3D, SRGBColorSpace, type Group, type InstancedMesh, type MeshStandardMaterial } from 'three'
import type { RoomId } from '../types'
import { DOOR_WIDTH, HALL_PLANTS, roomById, toWorld } from './layout'
import { ROOM_ACCENT, DARK_WOOD, GOLD, QUIZ_COLOURS } from './style'
import { paintFont, useFontsReady } from './fonts'
import Sign from './Sign'
import EraNumeral from './EraNumeral'
import QuizWall from './QuizWall'
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
      {/* Era rooms: a huge decorated number above the overview board (which ends at
          2.78 m). */}
      {room === 'ir1' || room === 'ir2' || room === 'ir3' || room === 'ir4' ? (
        <group position={[0, size.h - 1.6, -size.d / 2 + 0.03]}>
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
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <mesh>
          <ringGeometry args={[1.6, 1.75, 64]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} metalness={0.6} roughness={0.3} {...inlay} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.5, 0.56, 48]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} metalness={0.6} roughness={0.3} {...inlay} />
        </mesh>
      </group>
    </>
  )
}

// CMCN 1: dark wooden ceiling beams, wall lanterns, iron gears on the back wall.
function SteamAge({ size }: { size: RoomSize }) {
  const lanterns: [number, number, number][] = [
    [-size.w / 2 + 0.15, 2.6, -3 * spread(size)],
    [-size.w / 2 + 0.15, 2.6, 3 * spread(size)],
    [size.w / 2 - 0.15, 2.6, -3 * spread(size)],
    [size.w / 2 - 0.15, 2.6, 3 * spread(size)],
  ]
  return (
    <>
      {[-4.5, -1.5, 1.5, 4.5].map((z) => z * spread(size)).map((z) => (
        <mesh key={z} position={[0, size.h - 0.2, z]}>
          <boxGeometry args={[size.w, 0.4, 0.35]} />
          <meshStandardMaterial color={DARK_WOOD} roughness={0.7} />
        </mesh>
      ))}
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
      {/* Gears on the back wall, either side of the overview board. */}
      {[
        [-(size.w / 2 - 2.6), 1.2],
        [size.w / 2 - 2.6, 0.85],
      ].map(([x, r], i) => (
        <group key={i} position={[x, 1.9, -size.d / 2 + 0.12]}>
          <mesh>
            <torusGeometry args={[r, 0.12, 8, 36]} />
            <meshStandardMaterial color="#3b3530" metalness={0.8} roughness={0.4} />
          </mesh>
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2
            return (
              <mesh key={k} position={[Math.cos(a) * (r + 0.15), Math.sin(a) * (r + 0.15), 0]} rotation={[0, 0, a]}>
                <boxGeometry args={[0.22, 0.14, 0.18]} />
                <meshStandardMaterial color="#3b3530" metalness={0.8} roughness={0.4} />
              </mesh>
            )
          })}
        </group>
      ))}
    </>
  )
}

// CMCN 2: steel I-beams across the ceiling and hanging electric bulbs.
function ElectricAge({ size }: { size: RoomSize }) {
  const steel = <meshStandardMaterial color="#5b636c" metalness={0.8} roughness={0.35} />
  return (
    <>
      {[-4, 0, 4].map((z) => z * spread(size)).map((z) => (
        <group key={z} position={[0, size.h - 0.25, z]}>
          <mesh>
            <boxGeometry args={[size.w, 0.5, 0.06]} />
            {steel}
          </mesh>
          {[-0.25, 0.25].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[size.w, 0.05, 0.3]} />
              {steel}
            </mesh>
          ))}
        </group>
      ))}
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
  const beige = <meshStandardMaterial color="#e3d6b6" roughness={0.6} />
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
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (size.w / 2 - 0.02), 1.15, 0]} rotation={[0, -s * Math.PI / 2, 0]}>
          <planeGeometry args={[size.d, 0.18]} />
          <meshStandardMaterial color="#c4682f" roughness={0.6} />
        </mesh>
      ))}
      <group position={[0, 0, -size.d / 2 + 0.7]}>
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[4.4, 0.06, 0.9]} />
          {beige}
        </mesh>
        {[-1.6, -0.55, 0.55, 1.6].map((x) => (
          <group key={x} position={[x, 0.78, 0]}>
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.55, 0.45, 0.45]} />
              {beige}
            </mesh>
            <mesh position={[0, 0.27, 0.231]}>
              <planeGeometry args={[0.42, 0.3]} />
              <Glow colour="#57e08a" intensity={1.6} />
            </mesh>
          </group>
        ))}
      </group>
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
      <group ref={hologram} position={[0, 2.2, 0]}>
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

// A band running around all four walls at one height (wainscot, rails, mouldings), with a
// gap for the door in the front wall. thickness = how far it sticks out of the wall.
function WallBand({ size, y, height, thickness, doorGap, children }: {
  size: RoomSize
  y: number // centre height
  height: number
  thickness: number
  doorGap: number // half width of the gap left around the door (0 = no gap)
  children: ReactNode // the material
}) {
  const { w, d } = size
  const half = thickness / 2
  // x, z, rotation, length of each piece: back wall, two side walls, front wall.
  const pieces: [number, number, number, number][] = [
    [0, -d / 2 + half, 0, w],
    [-w / 2 + half, 0, Math.PI / 2, d],
    [w / 2 - half, 0, Math.PI / 2, d],
  ]
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
    <group position={[0, 0, 0.004]}>
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

// A coloured tile with one big letter on it (quiz answer tiles, question marks).
function LetterTile({ letter, colour, width, height }: { letter: string; colour: string; width: number; height: number }) {
  const fontsReady = useFontsReady()
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * 200)
    canvas.height = Math.round(height * 200)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const r = canvas.height * 0.18
      ctx.fillStyle = colour
      ctx.beginPath()
      ctx.roundRect(0, 0, canvas.width, canvas.height, r)
      ctx.fill()
      const line = canvas.height * 0.05
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.lineWidth = line
      ctx.beginPath()
      ctx.roundRect(line, line, canvas.width - 2 * line, canvas.height - 2 * line, r * 0.8)
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `700 ${canvas.height * 0.62}px ${paintFont(fontsReady)}`
      ctx.fillText(letter, canvas.width / 2, canvas.height * 0.54)
    }
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    return tex
  }, [letter, colour, width, height, fontsReady])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      {/* Rounded corners are see-through; slightly self-lit so the colours stay bright. */}
      <meshStandardMaterial map={texture} transparent emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.45} />
    </mesh>
  )
}


// Show bulbs along the top of the back and side walls, in the quiz colours. One
// "instanced" mesh draws all of them in a single step, much cheaper than one mesh each.
function MarqueeBulbs({ size }: { size: RoomSize }) {
  const mesh = useRef<InstancedMesh>(null)
  const spots = useMemo(() => {
    const list: [number, number][] = []
    for (let x = -size.w / 2 + 0.4; x <= size.w / 2 - 0.4; x += 0.5) list.push([x, -size.d / 2 + 0.06])
    for (let z = -size.d / 2 + 0.4; z <= size.d / 2 - 0.4; z += 0.5) {
      list.push([-size.w / 2 + 0.06, z], [size.w / 2 - 0.06, z])
    }
    return list
  }, [size])
  // Unlit bulbs, brighter than white so the bloom makes them glow (the colour of each
  // bulb is multiplied by this).
  const material = useMemo(() => {
    const m = new MeshBasicMaterial({ toneMapped: false })
    m.color.setRGB(3, 3, 3)
    return m
  }, [])
  useEffect(() => () => material.dispose(), [material])

  useLayoutEffect(() => {
    const bulbs = mesh.current
    if (!bulbs) return
    const place = new Object3D()
    const colour = new Color()
    spots.forEach(([x, z], i) => {
      place.position.set(x, size.h - 0.28, z)
      place.updateMatrix()
      bulbs.setMatrixAt(i, place.matrix)
      bulbs.setColorAt(i, colour.set(QUIZ_COLOURS[i % QUIZ_COLOURS.length]))
    })
    bulbs.instanceMatrix.needsUpdate = true
    if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true
  }, [spots, size])

  return (
    <instancedMesh ref={mesh} args={[undefined, material, spots.length]}>
      <sphereGeometry args={[0.06, 10, 8]} />
    </instancedMesh>
  )
}

// QUIZ ROOM: a playful TV quiz-show set. Coloured answer tiles on the back wall, big
// question marks on the side walls, show bulbs along the top and four stage lights aimed
// at the pedestal in the middle (where the quiz will start, M7).
function QuizRoom({ size }: { size: RoomSize }) {
  const { ui } = useContent()
  const stageLights: [number, number][] = [
    [-2.6, -2.2],
    [2.6, -2.2],
    [-2.6, 2.2],
    [2.6, 2.2],
  ]
  return (
    <>
      <MarqueeBulbs size={size} />
      {/* The back wall is the quiz itself. */}
      <group position={[0, 0, -size.d / 2 + 0.01]}>
        <QuizWall />
      </group>
      {/* Question marks on the side walls, towards the back (the quiz pedestal and its
          board stand by the left wall nearer the entrance). */}
      {[-1, 1].map((s, i) => (
        <group key={s} position={[s * (size.w / 2 - 0.03), 2.2, -3]} rotation={[0, -s * Math.PI / 2, 0]}>
          <LetterTile letter={ui.decor.quizMark} colour={QUIZ_COLOURS[i + 1]} width={1.6} height={1.6} />
        </group>
      ))}
      {/* A dark skirting band along the bottom of the walls. */}
      <WallBand size={size} y={0.2} height={0.4} thickness={0.03} doorGap={DOOR_WIDTH / 2 + 0.15}>
        <meshStandardMaterial color="#231b30" roughness={0.6} />
      </WallBand>
      {/* Stage lights: tilted so their glowing lens faces the middle of the room. */}
      {stageLights.map(([x, z], i) => (
        <group key={i} position={[x, size.h - 0.35, z]} rotation={[0.5 * Math.sign(z), 0, -0.5 * Math.sign(x)]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.2, 0.4, 16]} />
            <meshStandardMaterial color="#1c1c22" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.201, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.17, 20]} />
            <Glow colour={QUIZ_COLOURS[i]} intensity={5} />
          </mesh>
        </group>
      ))}
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
      {/* The hall shows the museum's own name instead (IntroHall). */}
      {room !== 'hall' && <RoomIdentity room={room} size={size} />}
      {Decor && <Decor size={size} />}
    </group>
  )
}
