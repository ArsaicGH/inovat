import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import { Object3D, type Group } from 'three'
import type { RoomId } from '../types'
import { useMuseumStore } from '../state/useMuseumStore'
import Room from './Room'
import Rotunda from './Rotunda'
import Walls from './Walls'
import Doors from './Doors'
import Exhibit from './Exhibit'
import Player from './Player'
import Interaction from './Interaction'
import FrameTimingProbe from './FrameTimingProbe'
import { COLLISION_BOXES, EXHIBIT_SPOTS, ROOMS } from './layout'
import { doorOpen } from './door-state'
import { CANVAS_WRAPPER_ID } from './pointer-lock'

// DEVELOPMENT-ONLY test switches in the address bar, to find what slows frames down:
// ?dpr=1 (normal resolution), ?aa=0 (no edge smoothing), ?shadows=0 (no shadows).
// They can be combined: ?dpr=1&aa=0. On the live site they are ignored.
const testSwitches = new URLSearchParams(import.meta.env.DEV ? window.location.search : '')
const MAX_PIXEL_RATIO = testSwitches.get('dpr') === '1' ? 1 : 1.5
const ANTIALIAS = testSwitches.get('aa') !== '0'
const SHADOWS = testSwitches.get('shadows') !== '0'

const GROUPS: RoomId[] = ['rotunda', ...ROOMS.map((room) => room.id)]

// Grey-box lighting for the whole building. M6 replaces this with themed lighting per room.
function Lighting() {
  // A directional light shines towards its "target"; it must be in the scene to be used.
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      <primitive object={target} position={[0, 0, 0]} />
      {/* Soft light from every direction, so nothing is pitch black. */}
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
      {/* The only shadow-casting light (CLAUDE.md allows at most one). */}
      <directionalLight
        target={target}
        position={[8, 25, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        // Make the shadow area cover the whole museum (about 70 m across).
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />
    </>
  )
}

// One part of the museum (the rotunda or one room with its passage and exhibits).
// Only draw what can be seen: rooms are behind closed doors, so a room is drawn only while
// you are in it (or its passage) or while its door is open; the rotunda only while you are
// in it or the door of the room you are in is open. This saves a lot of drawing work.
function MuseumPart({ id }: { id: RoomId }) {
  const group = useRef<Group>(null)
  const frames = useRef(0)

  useFrame(() => {
    // Keep everything visible for the first frames, so the once-only shadows include it all.
    if (frames.current < 3) {
      frames.current += 1
      return
    }
    if (!group.current) return
    const here = useMuseumStore.getState().currentRoom
    const isOpen = (room: RoomId) => (doorOpen.get(room) ?? 0) > 0
    group.current.visible = id === 'rotunda' ? here === 'rotunda' || isOpen(here) : here === id || isOpen(id)
  })

  return (
    <group ref={group}>
      {id === 'rotunda' ? <Rotunda /> : <Room room={id} />}
      <Walls group={id} />
      {EXHIBIT_SPOTS.filter((spot) => spot.room === id).map((spot) => (
        <Exhibit key={spot.id} spot={spot} />
      ))}
    </group>
  )
}

export default function Museum() {
  return (
    // The Canvas resizes itself with the window, so the scene never stretches.
    <Canvas
      id={CANVAS_WRAPPER_ID}
      // "percentage" = PCF shadows; the newest Three.js dropped the older "soft" type.
      shadows={SHADOWS ? 'percentage' : false}
      // Cap the pixel ratio at 1.5 (CLAUDE.md): sharp enough, but much cheaper on high-DPI screens.
      dpr={[1, MAX_PIXEL_RATIO]}
      camera={{ fov: 70, near: 0.1, far: 120 }}
      // Laptops with two graphics chips: ask for the faster one.
      gl={{ powerPreference: 'high-performance', antialias: ANTIALIAS }}
      onCreated={({ gl }) => {
        // Nothing big moves (doors and small placeholder models cast no shadows), so draw
        // the shadows once instead of 100+ times a second. If moving shadow casters are
        // added later, set gl.shadowMap.needsUpdate = true.
        gl.shadowMap.autoUpdate = false
        gl.shadowMap.needsUpdate = true
      }}
    >
      <color attach="background" args={['#1b1d24']} />
      <Lighting />

      {GROUPS.map((id) => (
        <MuseumPart key={id} id={id} />
      ))}
      {/* Doors are always drawn: you see them from both the rotunda and the rooms. */}
      <Doors />

      <Player walls={COLLISION_BOXES} />
      <Interaction />

      {/* FPS counter, only while developing (never shown on the live site). */}
      {import.meta.env.DEV && <Stats />}
      {import.meta.env.DEV && <FrameTimingProbe />}
    </Canvas>
  )
}
