import { Suspense, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Stats } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Color, HalfFloatType, Object3D, Texture, WebGLRenderTarget, type Camera, type Group, type HemisphereLight, type Mesh, type PointLight, type SpotLight, type Scene, type WebGLRenderer } from 'three'
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
import { CHANDELIER_Y, COLLISION_BOXES, DOORS, EXHIBIT_SPOTS, PART_COUNT, ROOMS, roomById, toWorld } from './layout'
import { isPartVisible } from './door-state'
import { ROOM_THEMES } from './room-themes'
import { CANVAS_WRAPPER_ID } from './pointer-lock'
import { KEY_PLANS, SPOT_COUNT, SPOT_PLANS } from './spot-plan'
import SpotFixtures from './SpotFixtures'
import { useFontsReady } from './fonts'

// DEVELOPMENT-ONLY test switches in the address bar, to find what slows frames down:
// ?dpr=1 (normal resolution), ?aa=0 (no edge smoothing), ?shadows=0 (no shadows),
// ?fx=0 (no bloom glow), ?ao=0 (no ambient occlusion). They can be combined: ?dpr=1&fx=0.
// Ignored on the live site.
const testSwitches = new URLSearchParams(import.meta.env.DEV ? window.location.search : '')
const MAX_PIXEL_RATIO = testSwitches.get('dpr') === '1' ? 1 : 1.5
const ANTIALIAS = testSwitches.get('aa') !== '0'
const SHADOWS = testSwitches.get('shadows') !== '0'
const EFFECTS = testSwitches.get('fx') !== '0'
const AO = testSwitches.get('ao') !== '0'

const GROUPS: RoomId[] = ['rotunda', ...ROOMS.map((room) => room.id)]

// Which room's lights are on: the room you are in, or, in the rotunda, the room whose door
// is nearest. So a room is already lit before its door opens, and the room you just left
// stays lit while its door closes behind you.
function litRoom(here: RoomId, x: number, z: number): RoomId {
  if (here !== 'rotunda') return here
  let best: RoomId = 'hall'
  let bestDistance = Infinity
  for (const door of DOORS) {
    const distance = Math.hypot(door.centre[0] - x, door.centre[1] - z)
    if (distance < bestDistance) {
      bestDistance = distance
      best = door.room
    }
  }
  return best
}

// How long a change of lit room takes: the old room's lights fade out, then the new
// room's fade in (seconds each), instead of popping.
const LIGHT_FADE = 0.3

// The rotunda's soft fill light: generous, the hall is meant to feel grand and welcoming.
const ROTUNDA_FILL = 0.3

// Brightness of one museum spotlight (spot-plan.ts).
const SPOT_INTENSITY = 120

// LIGHTING, in the style of a real museum: the rooms themselves are fairly dim (low soft
// light, a gentle room light) and warm spotlights pick out the exhibits, which gives the
// dramatic contrast of a gallery instead of flat office light.
// The NUMBER of lights never changes (switching lights on/off would make the browser
// re-prepare its drawing code, causing hitches); only their brightness and place do.
function Lighting() {
  const accent = useRef<PointLight>(null) // the lit room's coloured lamp light
  const keyLight = useRef<SpotLight>(null)
  const keyTarget = useMemo(() => new Object3D(), [])
  const keyArea = useRef<RoomId | null>(null)
  const keyLevel = useRef(0)
  const sky = useRef<HemisphereLight>(null)
  // Five spotlights that move to the room you are in (spot-plan.ts), each with the point
  // it shines at (a spotlight's target must be in the scene too).
  const spots = useRef<(SpotLight | null)[]>([])
  const spotTargets = useMemo(() => Array.from({ length: SPOT_COUNT }, () => new Object3D()), [])
  const lit = useRef<RoomId | null>(null) // the room the lights are in now
  const level = useRef(0) // 0-1: the lights fade between rooms
  const skyColour = useMemo(() => new Color(), [])

  useFrame(({ camera, gl }, delta) => {
    const here = useMuseumStore.getState().currentRoom
    const want = litRoom(here, camera.position.x, camera.position.z)

    // Fade out, move the lights to the new room, fade back in.
    const dt = Math.min(delta, 0.1)
    if (lit.current !== want) {
      level.current = Math.max(0, level.current - dt / LIGHT_FADE)
      if (level.current === 0 || lit.current === null) {
        lit.current = want
        const plan = SPOT_PLANS.get(want) ?? []
        spots.current.forEach((spot, i) => {
          const aim = plan[i]
          if (!spot || !aim) return
          spot.position.set(...aim.from)
          // Exhibits: a tight beam that just covers the object and its plinth, fading out
          // very softly (a wide beam left a hard bright ring on the floor around the plinth).
          spot.angle = aim.narrow ? 0.3 : 0.42
          spot.penumbra = aim.narrow ? 0.9 : 0.5
          spotTargets[i].position.set(...aim.to)
          spotTargets[i].updateMatrixWorld()
        })
      }
    } else {
      level.current = Math.min(1, level.current + dt / LIGHT_FADE)
    }
    const room = lit.current ?? want
    const plan = SPOT_PLANS.get(room) ?? []
    // The room's coloured lamp light (lanterns, bulbs, panels...), following the lit room.
    const roomLayout = roomById(room)
    if (accent.current && roomLayout && room !== 'rotunda') {
      const { colour, intensity, at } = ROOM_THEMES[room].accent
      const [ax, az] = toWorld(roomLayout.frame, at[0], (roomLayout.vFront + roomLayout.vBack) / 2 - at[2])
      accent.current.position.set(ax, at[1], az)
      accent.current.color.set(colour)
      accent.current.intensity = intensity * level.current
    }
    spots.current.forEach((spot, i) => {
      if (spot) spot.intensity = plan[i] ? SPOT_INTENSITY * (plan[i].strength ?? 1) * level.current : 0
    })

    // The key light follows the area you are in, fading out, moving and fading back in.
    const key = keyLight.current
    if (key) {
      if (keyArea.current !== here) {
        keyLevel.current = Math.max(0, keyLevel.current - dt / LIGHT_FADE)
        const plan = KEY_PLANS.get(here)
        if ((keyLevel.current === 0 || keyArea.current === null) && plan) {
          keyArea.current = here
          key.position.set(...plan.from)
          gl.shadowMap.needsUpdate = true // the key light moved: redraw its shadows
          key.angle = plan.angle
          keyTarget.position.set(...plan.to)
          keyTarget.updateMatrixWorld()
        }
      } else {
        keyLevel.current = Math.min(1, keyLevel.current + dt / LIGHT_FADE)
      }
      key.intensity = (KEY_PLANS.get(keyArea.current ?? here)?.intensity ?? 0) * keyLevel.current
    }

    // The soft "sky" light takes the colour of where you are, gradually.
    skyColour.set(here === 'rotunda' ? '#fff1dc' : ROOM_THEMES[here].sky)
    const fill = here === 'rotunda' ? ROTUNDA_FILL : ROOM_THEMES[here].fill
    if (sky.current) {
      sky.current.color.lerp(skyColour, Math.min(1, dt * 3))
      sky.current.intensity += (fill - sky.current.intensity) * Math.min(1, dt * 3)
    }
  })

  return (
    <>
      {/* A little soft light from every direction, so nothing is pitch black. */}
      <ambientLight intensity={0.04} />
      {/* Even fill in the room's colour (a ceiling lamp here made a fake bright spot). */}
      <hemisphereLight ref={sky} args={['#fff1dc', '#2a2219', 0.13]} />
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
            // Beam width and softness are set per target (see the frame code above).
            angle={0.42}
            penumbra={0.5}
            decay={2}
          />
        </group>
      ))}
      {/* The lit room's coloured lamp light (no shadows). */}
      <pointLight ref={accent} intensity={0} decay={2} />
      {/* Always on (switching it on only when the rotunda came into view made it pop). */}
      <pointLight color="#ffd9a0" intensity={125} decay={2} position={[0, CHANDELIER_Y - 0.3, 0]} />
      {/* The key light: the only shadow-casting light (CLAUDE.md allows one). A big soft
          spotlight from high above the area you are in (spot-plan.ts, KEY_PLANS). */}
      <primitive object={keyTarget} />
      <spotLight
        ref={keyLight}
        target={keyTarget}
        color="#ffe9cf"
        intensity={0}
        penumbra={0.9}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
      />
      {/* Reflections: a small "light map" of glowing shapes, made once at start (no
          download). Shiny surfaces such as marble and gold reflect it. */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="ring" intensity={1.2} color="#ffe4b8" scale={10} position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer form="rect" intensity={0.2} color="#fff3e0" scale={[20, 4, 1]} position={[0, 4, -12]} />
        <Lightformer form="rect" intensity={0.15} color="#ffe9cc" scale={[20, 4, 1]} position={[0, 4, 12]} rotation={[0, Math.PI, 0]} />
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
    // Keep everything visible until it has been prepared.
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

// Redraw the shadows once a part has loaded (harmless now that they are redrawn every
// frame, but keeps the shadows right if that is ever switched off again).
// AUTOMATIC QUALITY, decided ONCE, behind the loading screen. Changing the resolution or
// the effects rebuilds the effects' picture buffers, and the ambient-occlusion effect then
// rebuilds its drawing code, which on Windows browsers can freeze everything for many
// seconds (the leader saw a 20 s freeze). So nothing changes during play.
//
// How it decides: after the warm-up drawing, the camera is moved for a moment into the
// ROTUNDA, the heaviest view (measuring in the light intro hall picked settings that were
// too high for the rotunda), the frame rate is measured there, then the camera goes back
// to the start. The expensive work costs per pixel, so the frame rate at another resolution
// can be estimated (1x instead of 1.5x = 2.25 times fewer pixels). It then picks, in this
// order, giving up as little as possible:
// 1. the highest resolution step that still reaches 60 fps (1.5, 1.25, 1, 0.85);
// 2. if even 1x is too slow: ambient occlusion off (assumed to save about a quarter);
// 3. then 0.75x, and shadows only redrawn when the key light moves.
const RATIO_STEPS = [1.5, 1.25, 1, 0.85]
const MIN_PIXEL_RATIO = 0.75
const TARGET_FPS = 60
const AO_SAVING = 1.3 // frame rate gain assumed from turning ambient occlusion off
const SETTLE = 1 // seconds to wait in the rotunda before measuring (lights fade in)
const MEASURE = 1.5 // seconds of frames measured
function AdaptiveQuality() {
  const setDpr = useThree((state) => state.setDpr)
  const phase = useRef<'waiting' | 'settling' | 'measuring' | 'done'>('waiting')
  const time = useRef(0)
  const frames = useRef(0)
  const visitedBefore = useRef<RoomId[]>([])
  useFrame((_, delta) => {
    const store = useMuseumStore.getState()
    if (phase.current === 'done' || store.qualityChosen || !store.warmedUp) return
    // Only behind the loading screen: if loading gave up waiting and the visit has already
    // started, keep the full settings rather than move the camera mid-game.
    if (store.worldReady && phase.current === 'waiting') {
      store.setQualityChosen()
      phase.current = 'done'
      return
    }
    if (phase.current === 'waiting') {
      visitedBefore.current = store.visitedRooms
      store.requestTeleport('rotunda')
      phase.current = 'settling'
      time.current = 0
      return
    }
    time.current += delta
    if (phase.current === 'settling') {
      if (time.current < SETTLE) return
      phase.current = 'measuring'
      time.current = 0
      frames.current = 0
      return
    }
    frames.current += 1
    if (time.current < MEASURE) return

    const fps = frames.current / time.current
    const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO)
    const at = (r: number) => fps * (ratio / r) ** 2 // estimated frame rate at resolution r
    const steps = RATIO_STEPS.filter((r) => r <= ratio)
    let next = steps.find((r) => r >= 1 && at(r) >= TARGET_FPS)
    if (next === undefined) {
      store.lowerGraphics() // ambient occlusion off
      next = steps.find((r) => at(r) * AO_SAVING >= TARGET_FPS)
      if (next === undefined) {
        next = MIN_PIXEL_RATIO
        if (at(next) * AO_SAVING < TARGET_FPS * 0.7) store.lowerGraphics() // fewer shadow redraws
      }
    }
    if (next !== ratio) setDpr(next)

    // Back to the start, as if nothing happened.
    store.requestTeleport('hall')
    useMuseumStore.setState({ visitedRooms: visitedBefore.current })
    store.setQualityChosen()
    phase.current = 'done'
  })
  return null
}

// Shadows: redrawn every third frame (the key light moves rarely and the prototypes turn
// slowly). At the lowest graphics level only when the key light has moved.
function ShadowThrottle() {
  const frame = useRef(0)
  useFrame(({ gl }) => {
    frame.current += 1
    if (useMuseumStore.getState().graphicsLevel > 0 && frame.current % 3 === 0) gl.shadowMap.needsUpdate = true
  })
  return null
}

function ShadowRefresh() {
  const get = useThree((state) => state.get)
  useEffect(() => {
    get().gl.shadowMap.needsUpdate = true
  }, [get])
  return null
}

export default function Museum() {
  const graphicsLevel = useMuseumStore((state) => state.graphicsLevel)
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
        // If the graphics driver resets (Windows does this when the graphics card stalls),
        // say so in the console: it explains a long freeze or a black picture.
        gl.domElement.addEventListener('webglcontextlost', () => console.warn('INOVAT: graphics context lost (driver reset)'))
        gl.domElement.addEventListener('webglcontextrestored', () => console.warn('INOVAT: graphics context restored'))
        // Shadows are redrawn by ShadowThrottle (every third frame), not every frame.
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
      <AdaptiveQuality />
      <ShadowThrottle />
      <PreparedDoors>
        <Doors />
      </PreparedDoors>

      <Player walls={COLLISION_BOXES} />
      <Interaction />

      {/* Bloom: things brighter than white (bulbs, gold rings) glow softly.
          ToneMapping turns the bright picture into screen colours (needed with effects). */}
      {EFFECTS && (
        // Edge smoothing by SMAA (a filter on the finished picture) instead of multisampling
        // (extra samples for every pixel): the same smooth edges for much less work.
        <EffectComposer multisampling={0}>
          {/* Ambient occlusion: the soft darkening where objects meet the floor and in
              corners, which real rooms always have. Half resolution keeps it cheap. */}
          {AO && graphicsLevel === 2 ? <N8AO halfRes quality="performance" aoSamples={8} denoiseSamples={4} aoRadius={1.2} distanceFalloff={1} intensity={2.2} /> : <></>}
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.45} />
          {/* AgX: a natural, film-like way of turning light into screen colours. */}
          <ToneMapping mode={ToneMappingMode.AGX} />
          {/* Slightly darker corners, like a camera lens: a cinematic frame. */}
          <Vignette offset={0.3} darkness={0.55} />
          {ANTIALIAS ? <SMAA /> : <></>}
        </EffectComposer>
      )}

      {/* FPS counter, only while developing (never shown on the live site). */}
      {import.meta.env.DEV && <Stats />}
      {import.meta.env.DEV && <FrameTimingProbe />}
    </Canvas>
  )
}
