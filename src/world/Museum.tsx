import { Suspense, lazy, useLayoutEffect, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { CopyPass, EffectPass, ToneMappingMode, type EffectComposer as Composer } from 'postprocessing'
import { Color, CubeCamera, DefaultLoadingManager, DoubleSide, HalfFloatType, Mesh as MeshObject, MeshBasicMaterial, PlaneGeometry, RingGeometry, Scene as SceneObject, WebGLCubeRenderTarget, Object3D, Texture, WebGLRenderTarget, type Camera, type Group, type HemisphereLight, type Mesh, type PointLight, type SpotLight, type Scene, type WebGLRenderer } from 'three'
import type { RoomId } from '../types'
import { useMuseumStore, type GraphicsLevel } from '../state/useMuseumStore'
import Room from './Room'
import Rotunda from './Rotunda'
import Walls from './Walls'
import WallPictures from './WallPictures'
import Doors from './Doors'
import Exhibit from './Exhibit'
import Player from './Player'
import Interaction from './Interaction'
import FrameTimingProbe from './FrameTimingProbe'
import { IS_TOUCH } from '../ui/touch'
import { reportFileProgress, reportFilesDone } from '../ui/load-progress'

// File downloads (textures) are reported to the loading screen.
DefaultLoadingManager.onStart = (_item, loaded, total) => reportFileProgress(loaded, total)
DefaultLoadingManager.onProgress = (_item, loaded, total) => reportFileProgress(loaded, total)
DefaultLoadingManager.onLoad = () => reportFilesDone()

// FPS counter while developing only (loaded on demand, so the live site never downloads it).
const DevStats = import.meta.env.DEV ? lazy(() => import('@react-three/drei').then((drei) => ({ default: drei.Stats }))) : null
import { CHANDELIER_Y, COLLISION_BOXES, DOORS, EXHIBIT_SPOTS, PART_COUNT, ROOMS, roomById, toWorld } from './layout'
import { isPartVisible } from './door-state'
import { ROOM_THEMES } from './room-themes'
import { CANVAS_WRAPPER_ID } from './pointer-lock'
import { KEY_PLANS, SPOT_COUNT, SPOT_PLANS } from './spot-plan'
import { borrowedLights } from './ending-shots'
import SpotFixtures from './SpotFixtures'
import EndingScene from './EndingScene'
import { useFontsReady } from './fonts'
import { SHADOW_LAYER } from './shadow-layer'
import { skipWhileHidden } from './skip-while-hidden'

// DEVELOPMENT-ONLY test switches in the address bar, to find what slows frames down:
// ?dpr=1 (normal resolution), ?aa=0 (no edge smoothing), ?shadows=0 (no shadows),
// ?fx=0 (no bloom glow), ?ao=0 (no ambient occlusion). They can be combined: ?dpr=1&fx=0.
// Ignored on the live site.
const testSwitches = new URLSearchParams(import.meta.env.DEV ? window.location.search : '')
// Phones and tablets may go up to 2: their screens have far fewer pixels than a laptop's
// but are very sharp, so a low factor makes text on the boards blurry.
const MAX_PIXEL_RATIO = testSwitches.get('dpr') === '1' ? 1 : IS_TOUCH ? 2 : 1.5
const ANTIALIAS = testSwitches.get('aa') !== '0'
const SHADOWS = testSwitches.get('shadows') !== '0'
const EFFECTS = testSwitches.get('fx') !== '0'
// Never on phones and tablets: their less precise depth pictures turned the effect into
// grey, smudgy patches on the big flat walls (leader's phone). It is hard to see on a small
// screen anyway, and dropping it saves work there.
const AO = testSwitches.get('ao') !== '0' && !IS_TOUCH
// The screen's full sharpness, within the cap above.
const FULL_RATIO = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO)

// GRAPHICS LEVELS, chosen in the pause menu (or automatically, AdaptiveQuality below).
// What stays at every level, because it IS the museum's look: all the lights, the bloom
// glow, the film-like colours and the darker corners. What changes, cheapest last:
// - sharpness: the share of the screen's full resolution drawn (the biggest saving);
// - ambient occlusion: the soft darkening where things meet and in corners. "half" =
//   worked out at half resolution with few samples; "full" = every pixel, many samples:
//   clean, detailed contact shadows (only for strong graphics cards);
// - shadows: size of the shadow picture (crispness), softness of the edges (in shadow
//   picture pixels), and how often they are redrawn (every Nth frame; 0 = only when the
//   key light moves, so turning prototypes keep a still shadow). At ultra the museum
//   spotlights cast shadows too, not just the one key light;
// - edge smoothing: SMAA at every level. (FXAA, about a third of the work, was tried for
//   low and medium: it left large dark patches around bright lights, on the ceilings and
//   across the boards.)
// "High" is what every computer got before this menu existed, the museum as designed;
// "ultra" goes beyond it. "Medium" and "low" are for weaker computers (budget and office
// laptops): measured on the leader's laptop, drawing the lit rooms is about 90% of the work
// and grows with the number of pixels, the effects only about 10%. So they mostly draw
// fewer pixels (medium about two thirds of them, low about a third; medium's sharpness is
// halfway between low and high, leader's decision); low also redraws the
// shadows only when the key light moves. (Low once had no shadows at all: places meant to be
// in shadow, like the rotunda's columns, were then lit directly and showed hard, patchy
// highlights. The shadow test itself is cheap, about 0.7 ms; drawing the shadow picture is
// what costs.)
interface GraphicsSettings {
  sharpness: number
  ao: 'off' | 'half' | 'full'
  shadowSize: number
  shadowSoftness: number
  shadowEvery: number
  spotShadows: boolean // the museum spotlights cast shadows too (ultra only)
}
// How many museum spotlights may cast shadows at the ultra level.
const SPOT_SHADOWS = 4

const GRAPHICS_LEVELS: Record<GraphicsLevel, GraphicsSettings> = {
  0: { sharpness: 0.5, ao: 'off', shadowSize: 1024, shadowSoftness: 1, shadowEvery: 0, spotShadows: false }, // very low
  1: { sharpness: 0.6, ao: 'off', shadowSize: 1024, shadowSoftness: 1, shadowEvery: 0, spotShadows: false }, // low
  2: { sharpness: 0.8, ao: 'off', shadowSize: 1024, shadowSoftness: 1, shadowEvery: 4, spotShadows: false }, // medium
  3: { sharpness: 1, ao: 'half', shadowSize: 1024, shadowSoftness: 1, shadowEvery: 3, spotShadows: false }, // high
  4: { sharpness: 1, ao: 'full', shadowSize: 2048, shadowSoftness: 2, shadowEvery: 1, spotShadows: true }, // ultra
}

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
// How far the key light's shadows reach: in the museum, and in the ending film's larger sets.
const KEY_SHADOW_FAR = 30
const FILM_SHADOW_FAR = 200

// LIGHTING, in the style of a real museum: the rooms themselves are fairly dim (low soft
// light, a gentle room light) and warm spotlights pick out the exhibits, which gives the
// dramatic contrast of a gallery instead of flat office light.
// The NUMBER of lights never changes (switching lights on/off would make the browser
// re-prepare its drawing code, causing hitches); only their brightness and place do.
function Lighting() {
  const get = useThree((state) => state.get)
  const accent = useRef<PointLight>(null) // the lit room's coloured lamp light
  const keyLight = useRef<SpotLight>(null)
  const keyTarget = useMemo(() => new Object3D(), [])
  const keyArea = useRef<RoomId | null>(null)
  const keyLevel = useRef(0)
  const sky = useRef<HemisphereLight>(null)
  // Shadow sharpness follows the graphics level (GRAPHICS_LEVELS): a bigger shadow picture
  // gives crisper shadows, a wider softness blurs their edges like real light. The old
  // picture is thrown away so the next shadow drawing makes one of the new size.
  const graphicsLevel = useMuseumStore((state) => state.graphicsLevel)
  useEffect(() => {
    const light = keyLight.current
    if (!light) return
    const { shadowSize, shadowSoftness, spotShadows } = GRAPHICS_LEVELS[graphicsLevel]
    // The shadow lights also see the detailed models' simplified shadow stand-ins
    // (inventions.tsx), which the camera never draws.
    light.shadow.camera.layers.enable(SHADOW_LAYER)
    spots.current.forEach((spot) => spot?.shadow.camera.layers.enable(SHADOW_LAYER))
    light.shadow.radius = shadowSoftness
    get().gl.shadowMap.needsUpdate = true
    // Ultra only: the museum spotlights cast shadows too (leader's decision; CLAUDE.md
    // allows it at this level only). Each exhibit then throws a real shadow onto its
    // plinth and each board onto its wall. Switched off below ultra, and their shadow
    // pictures freed. (Changing the number of shadow lights rebuilds the drawing code of
    // every material: part of the freeze the pause menu warns about.)
    spots.current.forEach((spot, i) => {
      // (At most SPOT_SHADOWS of them: with all six plus the key light, the graphics card
      // refused to draw anything at all; a grey screen.)
      const casts = spotShadows && i < SPOT_SHADOWS
      if (!spot || spot.castShadow === casts) return
      spot.castShadow = casts
      spot.shadow.radius = shadowSoftness
      if (!casts) {
        spot.shadow.map?.dispose()
        spot.shadow.map = null
      }
    })
    if (light.shadow.mapSize.x === shadowSize) return
    light.shadow.mapSize.set(shadowSize, shadowSize)
    light.shadow.map?.dispose()
    light.shadow.map = null
  }, [graphicsLevel, get])
  // Six spotlights that move to the room you are in (spot-plan.ts), each with the point
  // it shines at (a spotlight's target must be in the scene too).
  const spots = useRef<(SpotLight | null)[]>([])
  const spotTargets = useMemo(() => Array.from({ length: SPOT_COUNT }, () => new Object3D()), [])
  const lit = useRef<RoomId | null>(null) // the room the lights are in now
  const level = useRef(0) // 0-1: the lights fade between rooms
  const skyColour = useMemo(() => new Color(), [])
  const bounceColour = useMemo(() => new Color(), [])

  useFrame(({ camera, gl, scene }, delta) => {
    // THE ENDING FILM borrows these lights (ending-shots.ts): each shot places them.
    if (borrowedLights.active) {
      const film = borrowedLights
      spots.current.forEach((spot, i) => {
        if (!spot) return
        const light = film.spots[i]
        spot.intensity = light ? light.intensity : 0
        if (!light) return
        spot.position.copy(light.from)
        spot.color.copy(light.colour)
        spot.angle = light.angle
        spot.penumbra = 0.7
        spotTargets[i].position.copy(light.to)
        spotTargets[i].updateMatrixWorld()
      })
      const key = keyLight.current
      if (key && film.key) {
        if (!key.position.equals(film.key.from)) gl.shadowMap.needsUpdate = true
        key.position.copy(film.key.from)
        key.color.copy(film.key.colour)
        key.intensity = film.key.intensity
        key.angle = film.key.angle
        keyTarget.position.copy(film.key.to)
        keyTarget.updateMatrixWorld()
        if (key.shadow.camera.far !== FILM_SHADOW_FAR) {
          key.shadow.camera.far = FILM_SHADOW_FAR
          key.shadow.camera.updateProjectionMatrix()
        }
      }
      if (accent.current) accent.current.intensity = 0
      if (sky.current) {
        sky.current.color.copy(film.sky)
        sky.current.groundColor.copy(film.ground)
        sky.current.intensity = film.fill
      }
      scene.environmentIntensity = film.environment
      // Afterwards the lights go straight back to the museum and fade in there.
      lit.current = null
      keyArea.current = null
      level.current = 0
      keyLevel.current = 0
      return
    }

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
          // Boards: a wider beam with a very soft edge (a hard-edged oval looked like a flat
          // patch of light pasted onto the wall or door).
          // Exhibits: a tighter beam with a crisper edge, a pool of light like on a stage.
          // (A wide, very soft edge: the pool of light melts into the floor.)
          // A tight beam on the object with a soft edge: the exhibit glows, the floor
          // around it stays dim (gallery practice).
          spot.angle = aim.narrow ? 1.2 : 0.5
          // (A wide, fully soft edge: the pool melts into the room instead of ending in a ring.)
          spot.penumbra = aim.narrow ? 1 : 0.85
          // The room's colour temperature (room-themes.ts): amber in CMCN 1 to cool white in CMCN 4.
          spot.color.set(want === 'rotunda' ? '#ffe6c4' : ROOM_THEMES[want].lighting.spotColour)
          spotTargets[i].position.set(...aim.to)
          spotTargets[i].updateMatrixWorld()
        })
        // Spotlights this room does not use (dark) skip their shadow drawing at ultra.
        spots.current.forEach((spot, i) => {
          if (spot) spot.shadow.autoUpdate = plan[i] !== undefined
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
          key.color.set(here === 'rotunda' ? '#ffe9cf' : ROOM_THEMES[here].lighting.keyColour)
          if (key.shadow.camera.far !== KEY_SHADOW_FAR) {
            key.shadow.camera.far = KEY_SHADOW_FAR
            key.shadow.camera.updateProjectionMatrix()
          }
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
    // Its lower half: light bouncing up off this room's floor.
    bounceColour.set(here === 'rotunda' ? '#2a2219' : ROOM_THEMES[here].bounce)
    const fill = here === 'rotunda' ? ROTUNDA_FILL : ROOM_THEMES[here].fill
    // The reflection light (scene.environment) also lights every wall evenly: lower in the
    // darker galleries, so the exhibit spotlights stand out (room-themes.ts).
    const environment = here === 'rotunda' ? 1 : ROOM_THEMES[here].lighting.environment
    scene.environmentIntensity += (environment - scene.environmentIntensity) * Math.min(1, dt * 3)
    if (sky.current) {
      sky.current.color.lerp(skyColour, Math.min(1, dt * 3))
      sky.current.groundColor.lerp(bounceColour, Math.min(1, dt * 3))
      sky.current.intensity += (fill - sky.current.intensity) * Math.min(1, dt * 3)
    }
  })

  return (
    <>
      {/* A little soft light from every direction, so nothing is pitch black. */}
      <ambientLight intensity={0.04} />
      {/* Even fill in the room's colour (a ceiling lamp here made a fake bright spot). */}
      <hemisphereLight ref={sky} args={['#fff1dc', '#2a2219', 0.13]} />
      {/* The museum spotlights. Shadows only at the ultra graphics level (switched on in
          the effect above; CLAUDE.md allows only one shadow light at the other levels). */}
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
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
            shadow-camera-near={0.3}
            shadow-camera-far={14}
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
        shadow-camera-far={KEY_SHADOW_FAR}
      />
      {/* Reflections: a small "light map" of glowing shapes, made once at start (no
          download). Shiny surfaces such as marble and gold reflect it. */}
      <StudioEnvironment />
    </>
  )
}

// REFLECTIONS: a small "light map" of glowing shapes (a ring above, two soft panels at the
// sides), drawn ONCE into a 128 px cube picture at start; shiny surfaces such as marble and
// gold reflect it. (Made with three.js alone: the helper library used before brought along
// 226 KB of image-file readers the game never used.)
function StudioEnvironment() {
  const get = useThree((state) => state.get)
  useLayoutEffect(() => {
    const { gl, scene } = get()
    const shapes = new SceneObject()
    const glow = (colour: string, intensity: number) =>
      new MeshBasicMaterial({ color: new Color(colour).multiplyScalar(intensity), side: DoubleSide, toneMapped: false })
    const ring = new MeshObject(new RingGeometry(0.25, 0.5, 64), glow('#ffe4b8', 1.2))
    ring.scale.setScalar(10)
    ring.position.set(0, 12, 0)
    ring.rotation.set(Math.PI / 2, 0, 0)
    const back = new MeshObject(new PlaneGeometry(1, 1), glow('#fff3e0', 0.2))
    back.scale.set(20, 4, 1)
    back.position.set(0, 4, -12)
    back.lookAt(0, 0, 0)
    const front = new MeshObject(new PlaneGeometry(1, 1), glow('#ffe9cc', 0.15))
    front.scale.set(20, 4, 1)
    front.position.set(0, 4, 12)
    front.rotation.set(0, Math.PI, 0)
    shapes.add(ring, back, front)
    const target = new WebGLCubeRenderTarget(128)
    target.texture.type = HalfFloatType
    const camera = new CubeCamera(0.1, 1000, target)
    shapes.add(camera)
    const autoClear = gl.autoClear
    gl.autoClear = true
    camera.update(gl, shapes)
    gl.autoClear = autoClear
    scene.environment = target.texture
    return () => {
      scene.environment = null
      target.dispose()
      shapes.traverse((object) => {
        const mesh = object as MeshObject
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        ;(mesh.material as MeshBasicMaterial).dispose()
      })
    }
  }, [get])
  return null
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

  // (While hidden, its objects' places are not worked out every frame: skip-while-hidden.ts.)
  useLayoutEffect(() => {
    if (group.current) skipWhileHidden(group.current)
  }, [])

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
      {(id === 'ir1' || id === 'ir2' || id === 'ir3' || id === 'ir4') && <WallPictures room={id} />}
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
// Done again when the spotlight shadows are switched on or off (ultra graphics level): that
// changes the drawing code of every material, and rooms out of sight would otherwise
// rebuild theirs the moment they come into view.
function WarmUp() {
  const target = useMemo(() => new WebGLRenderTarget(64, 64, { type: HalfFloatType }), [])
  useEffect(() => () => target.dispose(), [target])
  const spotShadows = GRAPHICS_LEVELS[useMuseumStore((state) => state.graphicsLevel)].spotShadows
  const warmedWith = useRef(spotShadows)
  useFrame(({ gl, scene, camera }) => {
    const store = useMuseumStore.getState()
    const again = store.warmedUp && warmedWith.current !== spotShadows
    if ((store.warmedUp && !again) || store.partsPrepared < PART_COUNT) return
    warmedWith.current = spotShadows
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
// seconds (the leader saw a 20 s freeze). So nothing changes during play, except the
// resolution after the window is resized on a machine that needed it lower (ResizeQuality),
// combined with the rebuild the resize causes anyway.
//
// How it decides: after the warm-up drawing, the camera is moved for a moment into the
// ROTUNDA, the heaviest view (measuring in the light intro hall picked settings that were
// too high for the rotunda), the frame rate is measured there, then the camera goes back
// to the start. The measurement is made at the "high" graphics level. The expensive work
// costs per pixel, so the frame rate at another resolution can be estimated (1x instead of
// 1.5x = 2.25 times fewer pixels). It then picks, in this order, giving up as little as
// possible:
// 1. the highest resolution step that still reaches 60 fps (1.5, 1.25, 1, 0.85);
// 2. if even 1x is too slow: ambient occlusion off (assumed to save about a quarter);
// 3. then 0.75x and the "very low" level.
// It never picks "ultra": the frame rate cannot rise above the screen's refresh rate
// (usually 60), so there is no way to see how much power is left over. Ultra is the
// visitor's own choice in the pause menu.
// The pause menu shows the result as a level; the resolution chosen here is kept as long
// as "automatic" is on (GraphicsResolution).
const RATIO_STEPS = [2, 1.75, 1.5, 1.25, 1, 0.85]
const MIN_PIXEL_RATIO = 0.75
const TARGET_FPS = 60
// What counts as reaching it: one dropped frame in the short measurement already reads as
// 59, and a laptop that keeps 60 fps (the leader's, the benchmark for "high") then lost it.
const ENOUGH_FPS = TARGET_FPS * 0.95
// Frame rate gain assumed from turning ambient occlusion off (measured: only a few per cent
// in its half-resolution "high" form; 1.3 made automatic mode drop it expecting much more).
const AO_SAVING = 1.1
const SETTLE = 1 // seconds to wait in the rotunda before measuring (lights fade in)
const MEASURE = 1.5 // seconds of frames measured
// Set by AdaptiveQuality on machines that needed a lower resolution: the number of pixels
// they draw at 60 fps, and the resolution chosen (never exceeded later).
let pixelBudget: number | null = null
let pixelRatioCeiling = FULL_RATIO

// The resolution automatic mode draws at in a window of this size: the one chosen during
// loading, or, on a machine that needed it lowered, the step that keeps the same number of
// pixels (a bigger window gets a lower resolution, a smaller one goes back up, never above
// the original choice).
function autoPixelRatio(width: number, height: number): number {
  if (pixelBudget === null) return pixelRatioCeiling
  const fits = Math.sqrt(pixelBudget / (width * height))
  const steps = [...RATIO_STEPS, MIN_PIXEL_RATIO].filter((r) => r <= pixelRatioCeiling)
  return steps.find((r) => r <= fits * 1.02) ?? MIN_PIXEL_RATIO
}

function AdaptiveQuality() {
  const setDpr = useThree((state) => state.setDpr)
  const size = useThree((state) => state.size)
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
    const ratio = FULL_RATIO
    const at = (r: number) => fps * (ratio / r) ** 2 // estimated frame rate at resolution r
    const steps = RATIO_STEPS.filter((r) => r <= ratio)
    let level: GraphicsLevel = 3 // high
    // Touch devices: ambient occlusion (soft corner shadows, hard to see on a small screen)
    // goes BEFORE any sharpness, since blurry text matters far more there.
    if (IS_TOUCH && at(ratio) < ENOUGH_FPS) level = 2
    const saving = level < 3 ? AO_SAVING : 1
    let next = steps.find((r) => r >= 1 && at(r) * saving >= ENOUGH_FPS)
    if (next === undefined && !IS_TOUCH) {
      level = 2 // ambient occlusion off
      next = steps.find((r) => at(r) * AO_SAVING >= ENOUGH_FPS)
    }
    if (next === undefined) {
      // Too slow even at 1x without ambient occlusion.
      next = MIN_PIXEL_RATIO
      if (at(next) * AO_SAVING < TARGET_FPS * 0.7) level = 0 // fewer shadow redraws
    }
    // No ambient occlusion and less than full sharpness: shown as "low" in the pause menu.
    if (level === 2 && next < ratio) level = 1
    store.setAutoGraphics(level)
    if (next !== ratio) setDpr(next)
    // A machine that needed a lower resolution keeps the same NUMBER of pixels if the
    // window is resized later (ResizeQuality).
    pixelBudget = next < ratio ? next * next * size.width * size.height : null
    pixelRatioCeiling = next

    // Back to the start, as if nothing happened.
    store.requestTeleport('hall')
    useMuseumStore.setState({ visitedRooms: visitedBefore.current })
    store.setQualityChosen()
    phase.current = 'done'
  })
  return null
}

// RESOLUTION after loading:
// - a level chosen in the pause menu: that level's share of the screen's full sharpness;
// - automatic: the resolution chosen during loading. If the window is resized during the
//   visit (e.g. full screen after loading) on a machine whose resolution had to be lowered,
//   it is stepped so the number of pixels drawn stays what that machine managed at 60 fps
//   (autoPixelRatio). Applied once, half a second after the resizing stops, right after the
//   rebuild the resize causes anyway. Machines with room to spare: unchanged.
function GraphicsResolution() {
  const size = useThree((state) => state.size)
  const setDpr = useThree((state) => state.setDpr)
  const get = useThree((state) => state.get)
  const qualityChosen = useMuseumStore((state) => state.qualityChosen)
  const auto = useMuseumStore((state) => state.graphicsAuto)
  const level = useMuseumStore((state) => state.graphicsLevel)
  const apply = (width: number, height: number) => {
    const next = auto ? autoPixelRatio(width, height) : FULL_RATIO * GRAPHICS_LEVELS[level].sharpness
    if (Math.abs(next - get().viewport.dpr) > 0.01) setDpr(next)
  }
  // A new level or mode: at once (the visitor is in the pause menu).
  useEffect(() => {
    if (qualityChosen) apply(size.width, size.height)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualityChosen, auto, level])
  // A new window size: only automatic mode on a machine that needed a lower resolution.
  useEffect(() => {
    if (!qualityChosen || !auto || pixelBudget === null) return
    const timer = window.setTimeout(() => apply(size.width, size.height), 500)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height])
  return null
}

// Shadows: redrawn every Nth frame (GRAPHICS_LEVELS; the key light moves rarely and the
// prototypes turn slowly). At the lowest graphics level only when the key light has moved.
function ShadowThrottle() {
  const frame = useRef(0)
  useFrame(({ gl }) => {
    frame.current += 1
    const every = GRAPHICS_LEVELS[useMuseumStore.getState().graphicsLevel].shadowEvery
    if (every > 0 && frame.current % every === 0) gl.shadowMap.needsUpdate = true
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

// The ambient occlusion effect (N8AO) switches itself into a "transparency-aware" mode as
// soon as the scene holds any see-through material (a glass bulb, the quiz panels). That
// mode draws the scene twice more every frame at full resolution and searches every object
// five times per frame. Our see-through objects are flat panels and glows, which look the
// same without it, so it is switched off for good (and the per-frame search with it).
//
// It also draws its finished picture into a private buffer and then copies that whole
// picture into the next effect's buffer: a full-screen copy every frame for nothing. While
// it draws, its private buffer is pointed at the next effect's buffer and the copy is
// skipped, so it draws there directly. (Swapped back right after, so resizing still works.)
interface N8AOPassInternals {
  configuration: { transparencyAware: boolean }
  autoDetectTransparency: boolean
  renderToScreen: boolean
  outputTargetInternal: unknown
  copyQuad: { render: (renderer: unknown) => void }
  render: (renderer: unknown, inputBuffer: unknown, outputBuffer: unknown, ...rest: unknown[]) => void
  drawsDirectly?: boolean
}
function tuneAmbientOcclusion(pass: N8AOPassInternals | null) {
  if (!pass) return
  pass.autoDetectTransparency = false
  pass.configuration.transparencyAware = false
  if (pass.drawsDirectly) return
  pass.drawsDirectly = true
  const render = pass.render.bind(pass)
  const copy = pass.copyQuad.render.bind(pass.copyQuad)
  const skipCopy = () => {}
  pass.render = (renderer, inputBuffer, outputBuffer, ...rest) => {
    if (pass.renderToScreen || !outputBuffer || outputBuffer === inputBuffer) return render(renderer, inputBuffer, outputBuffer, ...rest)
    const own = pass.outputTargetInternal
    pass.outputTargetInternal = outputBuffer
    pass.copyQuad.render = skipCopy
    try {
      render(renderer, inputBuffer, outputBuffer, ...rest)
    } finally {
      pass.outputTargetInternal = own
      pass.copyQuad.render = copy
    }
  }
}

// The effects library adds a final full-screen copy whenever ambient occlusion is used,
// even when the last effect can draw straight to the screen: a whole extra pass over every
// pixel each frame. Remove it, so the last effect draws to the screen itself. Checked every
// frame (cheap), because the library rebuilds the chain when the quality changes.
function DropTrailingCopy({ composer }: { composer: RefObject<Composer | null> }) {
  useFrame(() => {
    const passes = composer.current?.passes
    if (!passes || passes.length < 2) return
    const last = passes[passes.length - 1]
    if (last instanceof CopyPass && passes[passes.length - 2] instanceof EffectPass) composer.current?.removePass(last)
  })
  return null
}

// THE EFFECTS' PICTURES FOLLOW THE RESOLUTION. The effects (bloom, colours, smoothing...)
// draw the scene into pictures of their own, sized when the window size changes, but not
// when only the resolution (sharpness) changes. So a lower graphics level, or automatic
// mode lowering the resolution on a weak computer, still drew the whole scene at full
// resolution: measured, medium cost 9.0 ms a frame with the effects and 5.9 ms without.
function EffectsFollowResolution({ composer }: { composer: RefObject<Composer | null> }) {
  const dpr = useThree((state) => state.viewport.dpr)
  const size = useThree((state) => state.size)
  useEffect(() => {
    composer.current?.setSize(size.width, size.height)
  }, [composer, dpr, size.width, size.height])
  return null
}

// The ending's world, built ahead and hidden as soon as the museum has loaded and the
// automatic quality has been measured (behind the loading and title screens), so it is
// ready the moment the visitor steps into the portal (EndingScene.tsx). (Built when the
// visitor entered the Game Room, it froze the game there for a moment: about 2,500 objects
// and their models made at once. Built during the quality measurement, it slowed those
// frames and made automatic mode choose "low" on the leader's laptop.)
function EndingWhileRunning() {
  const ending = useMuseumStore((state) => state.mode === 'ending')
  const loaded = useMuseumStore((state) => state.qualityChosen)
  return loaded || ending ? <EndingScene running={ending} /> : null
}

export default function Museum() {
  const settings = GRAPHICS_LEVELS[useMuseumStore((state) => state.graphicsLevel)]
  const composer = useRef<Composer>(null)
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
      // No multisampling on the page's own canvas when the effects run: every frame is drawn
      // and smoothed (SMAA) in the effects chain first, so the canvas's own smoothing would
      // change nothing on screen and only cost memory and work on large screens.
      gl={{ powerPreference: 'high-performance', antialias: ANTIALIAS && !EFFECTS }}
      onCreated={({ gl }) => {
        // If the graphics driver resets (Windows does this when the graphics card stalls),
        // say so in the console: it explains a long freeze or a black picture.
        gl.domElement.addEventListener('webglcontextlost', () => console.warn('INOVAT: graphics context lost (driver reset)'))
        gl.domElement.addEventListener('webglcontextrestored', () => console.warn('INOVAT: graphics context restored'))
        // Shadows are redrawn by ShadowThrottle (every Nth frame, by graphics level).
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
      <GraphicsResolution />
      <ShadowThrottle />
      <DropTrailingCopy composer={composer} />
      <EffectsFollowResolution composer={composer} />
      <PreparedDoors>
        <Doors />
      </PreparedDoors>

      <Player walls={COLLISION_BOXES} />
      <Interaction />
      <EndingWhileRunning />

      {/* Bloom: things brighter than white (bulbs, gold rings) glow softly.
          ToneMapping turns the bright picture into screen colours (needed with effects). */}
      {EFFECTS && (
        // Edge smoothing by SMAA (a filter on the finished picture) instead of multisampling
        // (extra samples for every pixel): the same smooth edges for much less work.
        <EffectComposer ref={composer} multisampling={0}>
          {/* Ambient occlusion: the soft darkening where objects meet the floor and in
              corners, which real rooms always have. "High": half resolution and few
              samples keep it cheap. "Ultra": every pixel and four times the samples, so
              the contact shadows are clean and follow small details. */}
          {AO && settings.ao !== 'off' ? (
            settings.ao === 'full' ? (
              <N8AO ref={tuneAmbientOcclusion as never} halfRes={false} aoSamples={32} denoiseSamples={8} denoiseRadius={6} aoRadius={1.2} distanceFalloff={1} intensity={2.2} />
            ) : (
              <N8AO ref={tuneAmbientOcclusion as never} halfRes quality="performance" aoSamples={8} denoiseSamples={4} aoRadius={1.2} distanceFalloff={1} intensity={2.2} />
            )
          ) : (
            <></>
          )}
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.45} />
          {/* AgX: a natural, film-like way of turning light into screen colours. */}
          <ToneMapping mode={ToneMappingMode.AGX} />
          {/* Slightly darker corners, like a camera lens: a cinematic frame. */}
          <Vignette offset={0.3} darkness={0.55} />
          {/* Edge smoothing (SMAA). */}
          {ANTIALIAS ? <SMAA /> : <></>}
        </EffectComposer>
      )}

      {/* FPS counter, only while developing (never shown on the live site). */}
      {DevStats && (
        <Suspense fallback={null}>
          <DevStats />
        </Suspense>
      )}
      {import.meta.env.DEV && <FrameTimingProbe />}
    </Canvas>
  )
}
