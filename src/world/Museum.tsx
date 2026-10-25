import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Stats } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Object3D, Texture, type Camera, type Group, type HemisphereLight, type Mesh, type PointLight, type Scene, type WebGLRenderer } from 'three'
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
import { CHANDELIER_Y, COLLISION_BOXES, EXHIBIT_SPOTS, ROOMS, toWorld } from './layout'
import { doorOpen, isPartVisible } from './door-state'
import { ROOM_THEMES } from './room-themes'
import { CANVAS_WRAPPER_ID } from './pointer-lock'

// DEVELOPMENT-ONLY test switches in the address bar, to find what slows frames down:
// ?dpr=1 (normal resolution), ?aa=0 (no edge smoothing), ?shadows=0 (no shadows),
// ?fx=0 (no bloom glow). They can be combined: ?dpr=1&fx=0. Ignored on the live site.
const testSwitches = new URLSearchParams(import.meta.env.DEV ? window.location.search : '')
const MAX_PIXEL_RATIO = testSwitches.get('dpr') === '1' ? 1 : 1.5
const ANTIALIAS = testSwitches.get('aa') !== '0'
const SHADOWS = testSwitches.get('shadows') !== '0'
const EFFECTS = testSwitches.get('fx') !== '0'

const GROUPS: RoomId[] = ['rotunda', ...ROOMS.map((room) => room.id)]

// Where each room's roaming light hangs: room centre, 1.8 m below the ceiling. (Close to
// a light-coloured ceiling it made a blinding bright spot.)
const ROOM_LIGHT_SPOTS = new Map(
  ROOMS.map((room) => {
    const [x, z] = toWorld(room.frame, 0, (room.vFront + room.vBack) / 2)
    return [room.id, [x, room.height - 1.8, z] as const]
  }),
)

// Put a roaming light in a room (with its theme colour), or switch it off (room = null).
function placeRoomLight(light: PointLight, room: RoomId | null) {
  const spot = room ? ROOM_LIGHT_SPOTS.get(room) : undefined
  if (!room || room === 'rotunda' || !spot) {
    light.intensity = 0
    return
  }
  const theme = ROOM_THEMES[room].light
  light.position.set(spot[0], spot[1], spot[2])
  light.color.set(theme.colour)
  light.intensity = theme.intensity
}

// Lights. Their NUMBER never changes (switching lights on/off would make the browser
// re-prepare its drawing code, causing hitches); only their brightness does.
function Lighting() {
  // A directional light shines towards its "target"; it must be in the scene to be used.
  const target = useMemo(() => new Object3D(), [])
  const chandelier = useRef<PointLight>(null)
  const roomLight = useRef<PointLight>(null) // the room you are in
  const peekLight = useRef<PointLight>(null) // a room whose door is open in front of you
  const sky = useRef<HemisphereLight>(null)

  useFrame(() => {
    const here = useMuseumStore.getState().currentRoom
    // The chandelier's warm light only matters while the rotunda can be seen.
    if (chandelier.current) chandelier.current.intensity = isPartVisible('rotunda', here) ? 140 : 0
    if (roomLight.current) placeRoomLight(roomLight.current, here)
    if (peekLight.current) {
      // From the rotunda you can look into a room through its open door.
      const peek = here === 'rotunda' ? ROOMS.find((room) => (doorOpen.get(room.id) ?? 0) > 0)?.id ?? null : null
      placeRoomLight(peekLight.current, peek)
    }
    if (sky.current) sky.current.color.set(here === 'rotunda' ? '#fff1dc' : ROOM_THEMES[here].sky)
  })

  return (
    <>
      <primitive object={target} position={[0, 0, 0]} />
      {/* Soft light from every direction, so nothing is pitch black. */}
      <ambientLight intensity={0.25} />
      <hemisphereLight ref={sky} args={['#fff1dc', '#3a3026', 0.5]} />
      {/* Two roaming room lights (always present; only moved, recoloured and dimmed). */}
      <pointLight ref={roomLight} intensity={0} decay={2} />
      <pointLight ref={peekLight} intensity={0} decay={2} />
      <pointLight ref={chandelier} color="#ffd9a0" intensity={140} decay={2} position={[0, CHANDELIER_Y - 0.3, 0]} />
      {/* The only shadow-casting light (CLAUDE.md allows at most one): "sunlight". */}
      <directionalLight
        target={target}
        position={[8, 25, 6]}
        intensity={1.2}
        color="#fff6e6"
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
      {/* Reflections: a small "light map" of glowing shapes, made once at start (no
          download). Shiny surfaces such as marble and gold reflect it. */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="ring" intensity={2} color="#ffe4b8" scale={10} position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} color="#fff3e0" scale={[20, 4, 1]} position={[0, 4, -12]} />
        <Lightformer form="rect" intensity={0.6} color="#ffe9cc" scale={[20, 4, 1]} position={[0, 4, 12]} rotation={[0, Math.PI, 0]} />
      </Environment>
    </>
  )
}

// Upload every picture of a part to the graphics card and build its drawing code
// ("shaders"). compileAsync lets the browser build them in the background where it can.
function prepareForDrawing(part: Object3D, { gl, camera, scene }: { gl: WebGLRenderer; camera: Camera; scene: Scene }) {
  part.traverse((object) => {
    const material = (object as Mesh).material
    if (!material) return
    for (const m of Array.isArray(material) ? material : [material]) {
      for (const value of Object.values(m)) {
        if (value instanceof Texture) gl.initTexture(value)
      }
    }
  })
  gl.compileAsync(part, camera, scene).catch(() => {
    // Not fatal: it will simply be prepared when first seen.
  })
}

// One part of the museum (the rotunda or one room with its passage and exhibits),
// drawn only while it can be seen (see isPartVisible in door-state.ts).
function MuseumPart({ id }: { id: RoomId }) {
  const group = useRef<Group>(null)
  const frames = useRef(0)
  const get = useThree((state) => state.get)

  useFrame(() => {
    // Keep everything visible for the first frames, so the once-only shadows include it all.
    if (frames.current < 3) {
      // On the first frame, get the whole part ready for the graphics card now, behind
      // the title screen, instead of the moment its door first opens (that caused a
      // hitch). Only things in front of the camera are drawn, so without this each
      // room's pictures were uploaded and its drawing code built when first seen.
      if (frames.current === 0 && group.current) prepareForDrawing(group.current, get())
      frames.current += 1
      return
    }
    if (group.current) group.current.visible = isPartVisible(id, useMuseumStore.getState().currentRoom)
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

// Tells the interface that the museum has loaded. Waits a few frames, so the camera is
// already in the starting room and nothing half-drawn is revealed.
function WorldReady() {
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 2) useMuseumStore.getState().setWorldReady()
  })
  return null
}

// Shadows are drawn only once (see onCreated). Textures load in the background, so the
// museum appears a moment after start; redraw the shadows once it has.
function ShadowRefresh() {
  const get = useThree((state) => state.get)
  useEffect(() => {
    get().gl.shadowMap.needsUpdate = true
  }, [get])
  return null
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

      {/* Each part appears once its own textures have loaded, so the starting hall does
          not wait for the rest; the others finish loading behind the title screen. */}
      {GROUPS.map((id) => (
        <Suspense key={id} fallback={null}>
          <MuseumPart id={id} />
          <ShadowRefresh />
          {id === 'hall' && <WorldReady />}
        </Suspense>
      ))}
      {/* Doors are always drawn: you see them from both the rotunda and the rooms. */}
      <Doors />

      <Player walls={COLLISION_BOXES} />
      <Interaction />

      {/* Bloom: things brighter than white (bulbs, oculus, gold rings) glow softly.
          ToneMapping turns the bright picture into screen colours (needed with effects). */}
      {EFFECTS && (
        <EffectComposer multisampling={ANTIALIAS ? 4 : 0}>
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.8} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}

      {/* FPS counter, only while developing (never shown on the live site). */}
      {import.meta.env.DEV && <Stats />}
      {import.meta.env.DEV && <FrameTimingProbe />}
    </Canvas>
  )
}
