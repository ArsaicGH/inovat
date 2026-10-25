import { Suspense, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Stats } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { HalfFloatType, Object3D, Texture, WebGLRenderTarget, type Camera, type Group, type HemisphereLight, type Mesh, type PointLight, type SpotLight, type Scene, type WebGLRenderer } from 'three'
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
import { CHANDELIER_Y, COLLISION_BOXES, EXHIBIT_SPOTS, PART_COUNT, ROOMS, toWorld } from './layout'
import { doorOpen, isPartVisible } from './door-state'
import { ROOM_THEMES } from './room-themes'
import { CANVAS_WRAPPER_ID } from './pointer-lock'
import { SPOT_COUNT, SPOT_PLANS } from './spot-plan'
import SpotFixtures from './SpotFixtures'
import { useFontsReady } from './fonts'

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

// Brightness of one museum spotlight (spot-plan.ts).
const SPOT_INTENSITY = 45

// LIGHTING, in the style of a real museum: the rooms themselves are fairly dim (low soft
// light, a gentle room light) and warm spotlights pick out the exhibits, which gives the
// dramatic contrast of a gallery instead of flat office light.
// The NUMBER of lights never changes (switching lights on/off would make the browser
// re-prepare its drawing code, causing hitches); only their brightness and place do.
function Lighting() {
  // A directional light shines towards its "target"; it must be in the scene to be used.
  const target = useMemo(() => new Object3D(), [])
  const chandelier = useRef<PointLight>(null)
  const roomLight = useRef<PointLight>(null) // the room you are in
  const peekLight = useRef<PointLight>(null) // a room whose door is open in front of you
  const sky = useRef<HemisphereLight>(null)
  // Five spotlights that move to the room you are in (spot-plan.ts), each with the point
  // it shines at (a spotlight's target must be in the scene too).
  const spots = useRef<(SpotLight | null)[]>([])
  const spotTargets = useMemo(() => Array.from({ length: SPOT_COUNT }, () => new Object3D()), [])
  const spotRoom = useRef<RoomId | null>(null)

  useFrame(() => {
    const here = useMuseumStore.getState().currentRoom
    // The chandelier's warm light only matters while the rotunda can be seen.
    if (chandelier.current) chandelier.current.intensity = isPartVisible('rotunda', here) ? 110 : 0
    if (roomLight.current) placeRoomLight(roomLight.current, here)
    if (peekLight.current) {
      // From the rotunda you can look into a room through its open door.
      const peek = here === 'rotunda' ? ROOMS.find((room) => (doorOpen.get(room.id) ?? 0) > 0)?.id ?? null : null
      placeRoomLight(peekLight.current, peek)
    }
    if (sky.current) sky.current.color.set(here === 'rotunda' ? '#fff1dc' : ROOM_THEMES[here].sky)

    // Move the spotlights only when the room changes.
    if (spotRoom.current !== here) {
      spotRoom.current = here
      const plan = SPOT_PLANS.get(here) ?? []
      spots.current.forEach((spot, i) => {
        if (!spot) return
        const aim = plan[i]
        spot.intensity = aim ? SPOT_INTENSITY * (aim.strength ?? 1) : 0
        if (!aim) return
        spot.position.set(...aim.from)
        spotTargets[i].position.set(...aim.to)
        spotTargets[i].updateMatrixWorld()
      })
    }
  })

  return (
    <>
      <primitive object={target} position={[0, 0, 0]} />
      {/* A little soft light from every direction, so nothing is pitch black. */}
      <ambientLight intensity={0.08} />
      <hemisphereLight ref={sky} args={['#fff1dc', '#2a2219', 0.2]} />
      {/* The museum spotlights (no shadows: CLAUDE.md allows only one shadow light). */}
      {spotTargets.map((spotTarget, i) => (
        <group key={i}>
          <primitive object={spotTarget} />
          <spotLight
            ref={(light: SpotLight | null) => {
              spots.current[i] = light
            }}
            target={spotTarget}
            color="#ffe6c4"
            intensity={0}
            angle={0.5}
            penumbra={0.7}
            decay={2}
          />
        </group>
      ))}
      {/* Two roaming room lights (always present; only moved, recoloured and dimmed). */}
      <pointLight ref={roomLight} intensity={0} decay={2} />
      <pointLight ref={peekLight} intensity={0} decay={2} />
      <pointLight ref={chandelier} color="#ffd9a0" intensity={110} decay={2} position={[0, CHANDELIER_Y - 0.3, 0]} />
      {/* The only shadow-casting light (CLAUDE.md allows at most one): "sunlight". */}
      <directionalLight
        target={target}
        position={[8, 25, 6]}
        intensity={0.55}
        color="#fff1dc"
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
        <Lightformer form="ring" intensity={1.3} color="#ffe4b8" scale={10} position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer form="rect" intensity={0.45} color="#fff3e0" scale={[20, 4, 1]} position={[0, 4, -12]} />
        <Lightformer form="rect" intensity={0.35} color="#ffe9cc" scale={[20, 4, 1]} position={[0, 4, 12]} rotation={[0, Math.PI, 0]} />
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
  // Either way the part counts as ready for the loading screen (a failure is not fatal:
  // it is then simply prepared when first seen).
  const done = () => useMuseumStore.getState().markPartPrepared()
  gl.compileAsync(part, camera, scene).then(done, done)
}

// Get a group ready for the graphics card behind the loading screen, instead of the
// moment it is first seen (that caused a hitch when entering a room). Only things in
// front of the camera are drawn, so without this each room's pictures were uploaded and
// its drawing code built when its door opened. It waits for the museum font, because
// every sign and text board is repainted (as a new picture) once the font arrives.
// Returns how many frames have passed since then (-1 = still waiting for the font).
function usePrepareForDrawing(group: RefObject<Group | null>) {
  const fontsReady = useFontsReady()
  const framesSinceFont = useRef(-1)
  const get = useThree((state) => state.get)
  useFrame(() => {
    if (!fontsReady) return
    framesSinceFont.current += 1
    // Two frames later every repainted picture exists.
    if (framesSinceFont.current === 2 && group.current) prepareForDrawing(group.current, get())
  })
  return framesSinceFont
}

// One part of the museum (the rotunda or one room with its passage and exhibits),
// drawn only while it can be seen (see isPartVisible in door-state.ts).
function MuseumPart({ id }: { id: RoomId }) {
  const group = useRef<Group>(null)
  const prepared = usePrepareForDrawing(group)

  useFrame(() => {
    // Keep everything visible until it has been prepared (and for the once-only shadows).
    if (prepared.current < 5) return
    if (group.current) group.current.visible = isPartVisible(id, useMuseumStore.getState().currentRoom)
  })

  return (
    <group ref={group} userData={{ museumPart: true }}>
      {id === 'rotunda' ? <Rotunda /> : <Room room={id} />}
      <SpotFixtures room={id} />
      <Walls group={id} />
      {EXHIBIT_SPOTS.filter((spot) => spot.room === id).map((spot) => (
        <Exhibit key={spot.id} spot={spot} />
      ))}
    </group>
  )
}

// WARM-UP: once every part is prepared, draw the WHOLE museum once into a small hidden
// picture, with every room shown and nothing skipped for being off-screen. The graphics
// card does some work only the first time each thing is really drawn; doing it here,
// behind the loading screen, avoids a hitch the first time a room comes into view.
function WarmUp() {
  const target = useMemo(() => new WebGLRenderTarget(64, 64, { type: HalfFloatType }), [])
  useEffect(() => () => target.dispose(), [target])
  useFrame(({ gl, scene, camera }) => {
    const store = useMuseumStore.getState()
    if (store.warmedUp || store.partsPrepared < PART_COUNT) return
    const changed: [Object3D, boolean, boolean][] = []
    scene.traverse((object) => {
      changed.push([object, object.visible, object.frustumCulled])
      object.frustumCulled = false
      if (object.userData.museumPart) object.visible = true
    })
    gl.setRenderTarget(target)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    for (const [object, visible, culled] of changed) {
      object.visible = visible
      object.frustumCulled = culled
    }
    store.setWarmedUp()
  })
  return null
}

// The doors and their signs, prepared like the parts (they are always drawn).
function PreparedDoors({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null)
  usePrepareForDrawing(group)
  return <group ref={group}>{children}</group>
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
        </Suspense>
      ))}
      {/* Doors are always drawn: you see them from both the rotunda and the rooms. */}
      <WarmUp />
      <PreparedDoors>
        <Doors />
      </PreparedDoors>

      <Player walls={COLLISION_BOXES} />
      <Interaction />

      {/* Bloom: things brighter than white (bulbs, oculus, gold rings) glow softly.
          ToneMapping turns the bright picture into screen colours (needed with effects). */}
      {EFFECTS && (
        <EffectComposer multisampling={ANTIALIAS ? 4 : 0}>
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.8} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          {/* Slightly darker corners, like a camera lens: a cinematic frame. */}
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      )}

      {/* FPS counter, only while developing (never shown on the live site). */}
      {import.meta.env.DEV && <Stats />}
      {import.meta.env.DEV && <FrameTimingProbe />}
    </Canvas>
  )
}
