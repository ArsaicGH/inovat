import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  MeshBasicMaterial,
  Object3D,
  SRGBColorSpace,
  type Group,
  type Points as PointsObject,
  type InstancedMesh,
  type Mesh,
} from 'three'
import { useMuseumStore } from '../state/useMuseumStore'
import EraNumeral from './EraNumeral'
import EraSculpture from './era-sculptures'
import Invention from './inventions'

// THE ENDING: after walking into the Game Room's portal, the camera flies down a corridor
// of light through the four eras (each with its number, its sculpture and one of its
// machines as glowing holograms), then rises to look out over a city of the future while
// EndingScreen.tsx shows the thank-you panel.
//
// It is built far away from the museum (beyond the camera's 120 m view distance, so none
// of the museum is drawn meanwhile), and only exists while the ending runs. Everything
// here is unlit, glowing material: no new lights, because a change in the number of
// lights would make the graphics card rebuild every material in the museum.

const ORIGIN: [number, number, number] = [400, 0, 0]
const LENGTH = 140 // metres flown
const DURATION = 32 // seconds of flight
const EYE = 1.7

// One colour per era, as on the era numbers on the walls.
const ERA_COLOURS = ['#e0a050', '#ffd36a', '#6be08b', '#3fd0e0']
const ERAS = ['ir1', 'ir2', 'ir3', 'ir4'] as const
// A machine of each era shown as a hologram (only ones built from shapes: the downloaded
// models are shared with the museum and cannot be shown twice).
const ERA_MACHINES = ['ir1-3', 'ir2-2', 'ir3-3', 'ir4-4']
// Where each era's station stands along the corridor (negative z = forward).
const stationZ = (era: number) => -15 - era * 30

// Which era the camera is passing (1-4), 0 before the first, 5 once arrived. An era's
// name shows from about 15 m before its station, as its number comes into view.
function stageAt(z: number, arrived: boolean): number {
  if (arrived) return 5
  if (-z < 1) return 0
  return Math.min(4, Math.floor((-z - 1) / 30) + 1)
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// Glowing see-through material in an era's colour (brighter than white: the bloom makes it glow).
function hologram(colour: string, opacity: number) {
  const material = new MeshBasicMaterial({ color: colour, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, toneMapped: false })
  material.color.multiplyScalar(1.6)
  return material
}

// Shows its children as a hologram: every mesh inside gets the given material.
// (Runs after the children have joined their parts, see MergeStatic.)
function Hologram({ material, children }: { material: MeshBasicMaterial; children: ReactNode }) {
  const group = useRef<Group>(null)
  useLayoutEffect(() => {
    group.current?.traverse((object) => {
      const mesh = object as Mesh
      if (mesh.isMesh) {
        mesh.material = material
        mesh.castShadow = false
      }
    })
  }, [material])
  return <group ref={group}>{children}</group>
}

// A thing that keeps turning slowly.
function Turning({ speed, children, ...props }: { speed: number; children: ReactNode; position?: [number, number, number]; scale?: number }) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed
  })
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  )
}

// A soft round dot, for the floating specks of light.
function paintDot(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 32
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  g.addColorStop(0, 'rgba(255, 255, 255, 1)')
  g.addColorStop(0.4, 'rgba(255, 255, 255, 0.45)')
  g.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 32, 32)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// The glowing path along the floor: the era colours one after another, white at the end.
function paintPath(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 512, 0, 0) // bottom of the picture = start of the path
  ERA_COLOURS.forEach((colour, i) => g.addColorStop(0.1 + i * 0.22, colour))
  g.addColorStop(1, '#ffffff')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 512)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// The dawn sky behind the city (a flat backdrop, horizon in the middle): deep blue above,
// warm gold at the horizon, dusk below it.
function paintSky(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, '#070b22')
  g.addColorStop(0.3, '#1a2760')
  g.addColorStop(0.44, '#8a5a78')
  g.addColorStop(0.49, '#f0a868')
  g.addColorStop(0.5, '#ffe0a8')
  g.addColorStop(0.53, '#4a3048')
  g.addColorStop(1, '#0a0b14')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 512)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// Building walls: a dark grid of windows, some lit.
function paintWindows(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#10131c'
  ctx.fillRect(0, 0, 64, 64)
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 4; x++) {
      const lit = (x * 7 + y * 13) % 5 < 2
      ctx.fillStyle = lit ? '#ffe2a8' : '#1c2233'
      ctx.fillRect(4 + x * 15, 3 + y * 8, 9, 4)
    }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// ---------- Each era's own world along the corridor ----------
// A motion picture through time: every era has its scenery (all unlit, glowing or dark
// silhouettes) and its sky colour, from the smoky dawn of steam to the cyan glow of data.

const ERA_SKIES = ['#3a2716', '#1a1206', '#04120a', '#021019']
const ARRIVAL_SKY = '#0b1230'
const MUSEUM_SKY = '#1b1d24' // the museum's own background (Museum.tsx)
const SECTION = 30 // metres of corridor per era

// Particles that drift: steam rising (CMCN 1) or data falling (CMCN 4).
function Drift({ count, colour, rise, spread, z }: { count: number; colour: string; rise: number; spread: number; z: number }) {
  const ref = useRef<PointsObject>(null)
  const dot = useMemo(() => paintDot(), []) // soft round specks, not squares
  useEffect(() => () => dot.dispose(), [dot])
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const side = Math.random() < 0.5 ? -1 : 1
      p.set([side * (3 + Math.random() * spread), Math.random() * 12, z - Math.random() * SECTION], i * 3)
    }
    return p
  }, [count, spread, z])
  useFrame((_, delta) => {
    const points = ref.current
    if (!points) return
    const array = points.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] += rise * delta
      if (array[i * 3 + 1] > 12) array[i * 3 + 1] = 0
      if (array[i * 3 + 1] < 0) array[i * 3 + 1] = 12
    }
    points.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={dot} color={colour} size={rise > 0 ? 0.5 : 0.09} sizeAttenuation transparent opacity={rise > 0 ? 0.18 : 0.9} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  )
}

function EraScenery({ era }: { era: number }) {
  const start = -era * SECTION // where this era's section begins
  const along = (n: number) => Array.from({ length: n }, (_, i) => start - 2 - i * ((SECTION - 4) / (n - 1)))
  if (era === 0)
    // Factory chimneys as dark silhouettes against a smoky sky, steam rising.
    return (
      <group>
        {along(6).flatMap((z, i) =>
          [-1, 1].map((side) => (
            <mesh key={`${z}${side}`} position={[side * (7 + (i % 3) * 2), 5 + (i % 2) * 2, z]}>
              <cylinderGeometry args={[0.45, 0.7, 10 + (i % 2) * 4, 10]} />
              <meshBasicMaterial color="#120c08" />
            </mesh>
          )),
        )}
        <Drift count={160} colour="#c9b49a" rise={0.8} spread={8} z={start} />
      </group>
    )
  if (era === 1)
    // Strings of glowing bulbs on poles, like the first electric streets at night.
    return (
      <group>
        {along(7).flatMap((z) =>
          [-1, 1].flatMap((side) => [
            <mesh key={`p${z}${side}`} position={[side * 4, 2.3, z]}>
              <cylinderGeometry args={[0.05, 0.07, 4.6, 6]} />
              <meshBasicMaterial color="#1a120a" />
            </mesh>,
            <mesh key={`b${z}${side}`} position={[side * 4, 4.4, z]}>
              <sphereGeometry args={[0.14, 12, 8]} />
              <meshBasicMaterial color={[3, 2.2, 1.1]} toneMapped={false} />
            </mesh>,
          ]),
        )}
      </group>
    )
  if (era === 2)
    // A glowing green computer grid underfoot and rows of old screens.
    return (
      <group>
        <gridHelper args={[SECTION, 30, '#6be08b', '#1f6a38']} position={[0, 0.01, start - SECTION / 2]} />
        {along(5).flatMap((z) =>
          [-1, 1].map((side) => (
            <mesh key={`${z}${side}`} position={[side * 5.5, 1.6, z]} rotation={[0, -side * 0.5, 0]}>
              <planeGeometry args={[1.6, 1.1]} />
              <meshBasicMaterial color={[0.3, 1.4, 0.55]} toneMapped={false} />
            </mesh>
          )),
        )}
      </group>
    )
  // Streams of cyan data falling all around.
  return <Drift count={500} colour="#7fe9ff" rise={-3} spread={7} z={start} />
}

const SPECKS = 1400
const BUILDINGS = 240
const ARRIVAL_Z = -LENGTH
const CITY_GROUND = -38 // far below the balcony

// The city of the future, seen from above at the end of the flight: one batch of boxes
// (an "instanced" mesh: drawn in a single step).
const City = forwardRef<InstancedMesh, { windows: CanvasTexture }>(function City({ windows }, forwarded) {
  const ref = useRef<InstancedMesh>(null)
  useImperativeHandle(forwarded, () => ref.current as InstancedMesh)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new Object3D()
    const tint = new Color()
    let seed = 11
    const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < BUILDINGS; i++) {
      // Spread out in front of the balcony and well below it (the camera looks out over
      // the rooftops), taller towards the middle.
      const x = (random() - 0.5) * 170
      const z = ARRIVAL_Z - 18 - random() * 70
      const height = 6 + random() * 22 * (1 - Math.abs(x) / 120)
      const width = 3 + random() * 5
      dummy.position.set(x, CITY_GROUND + height / 2, z)
      dummy.scale.set(width, height, width)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, tint.set(ERA_COLOURS[i % 4]).lerp(new Color('#ffffff'), 0.55))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BUILDINGS]} frustumCulled={false}>
      <boxGeometry />
      <meshBasicMaterial map={windows} toneMapped={false} />
    </instancedMesh>
  )
})

export default function EndingScene() {
  const run = useMuseumStore((state) => state.endingRun)
  const elapsed = useRef(0)
  const sky = useRef<MeshBasicMaterial>(null)
  const skyMesh = useRef<Mesh>(null)
  const city = useRef<InstancedMesh>(null)

  const textures = useMemo(() => ({ dot: paintDot(), path: paintPath(), sky: paintSky(), windows: paintWindows() }), [])
  useEffect(() => () => Object.values(textures).forEach((t) => t.dispose()), [textures])
  const eraMaterials = useMemo(() => ERA_COLOURS.map((c) => hologram(c, 0.35)), [])
  const ringMaterials = useMemo(() => ERA_COLOURS.map((c) => hologram(c, 0.9)), [])
  // The sun and the balcony ring: brighter than white, so the bloom makes them glow.
  const glowMaterials = useMemo(() => {
    const glow = (colour: string, strength: number) => {
      const material = new MeshBasicMaterial({ color: colour, toneMapped: false })
      material.color.multiplyScalar(strength)
      return material
    }
    return { sun: glow('#ffd9a0', 2.6), balcony: glow('#fff2c8', 2.2) }
  }, [])
  useEffect(
    () => () => [...eraMaterials, ...ringMaterials, glowMaterials.sun, glowMaterials.balcony].forEach((m) => m.dispose()),
    [eraMaterials, ringMaterials, glowMaterials],
  )

  // Specks of light floating around the corridor, coloured by era.
  const specks = useMemo(() => {
    const positions = new Float32Array(SPECKS * 3)
    const colours = new Float32Array(SPECKS * 3)
    const colour = new Color()
    for (let i = 0; i < SPECKS; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 2.5 + Math.random() * 5
      const z = -Math.random() * (LENGTH - 10)
      positions.set([Math.cos(angle) * radius, 2 + Math.sin(angle) * radius * 0.7, z], i * 3)
      colour.set(ERA_COLOURS[Math.min(3, Math.floor(-z / 30))])
      colours.set([colour.r, colour.g, colour.b], i * 3)
    }
    return { positions, colours }
  }, [])

  // Every new run (and "Replay the journey") starts the flight from the beginning.
  useEffect(() => {
    elapsed.current = 0
  }, [run])

  const scene = useThree((state) => state.scene)
  const sky0 = useMemo(() => new Color(), [])
  useEffect(
    () => () => {
      if (scene.background instanceof Color) scene.background.set(MUSEUM_SKY)
    },
    [scene],
  )
  useFrame(({ camera }, delta) => {
    const store = useMuseumStore.getState()
    // "Skip" (EndingScreen) jumps straight to the arrival.
    if (store.endingStage === 5) elapsed.current = Math.max(elapsed.current, DURATION)
    elapsed.current += Math.min(delta, 0.1)
    const p = Math.min(1, elapsed.current / DURATION)
    // Speeds up gently, glides, then slows down to arrive.
    const travel = 0.5 - 0.5 * Math.cos(p * Math.PI)
    const z = -LENGTH * travel
    const rise = smoothstep(0.8, 1, p)
    const t = elapsed.current
    camera.rotation.order = 'YXZ'
    camera.position.set(ORIGIN[0] + Math.sin(t * 0.35) * 0.3, EYE + rise * 4.5, ORIGIN[2] + z)
    camera.rotation.set(-0.3 * rise + Math.sin(t * 0.5) * 0.015, Math.sin(t * 0.25) * 0.06, 0)

    // The dawn sky fades in over the last part of the flight.
    const skyShown = smoothstep(0.7, 0.95, p)
    if (sky.current) sky.current.opacity = skyShown
    if (skyMesh.current) skyMesh.current.visible = skyShown > 0
    // (The city appears with it; before, it would show through the dark corridor.)
    if (city.current) city.current.visible = skyShown > 0.3

    const stage = stageAt(z, p >= 1)
    // The sky: each era's colour, blending into the next.
    if (scene.background instanceof Color) {
      sky0.set(p >= 0.9 ? ARRIVAL_SKY : ERA_SKIES[Math.min(3, Math.floor(-z / SECTION))])
      scene.background.lerp(sky0, Math.min(1, delta * 1.5))
    }
    if (stage !== store.endingStage) store.setEndingStage(stage)
  })

  const pathLength = LENGTH + 10
  return (
    <group position={ORIGIN}>
      {/* The glowing path along the floor. */}
      <mesh position={[0, 0, -pathLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, pathLength]} />
        <meshBasicMaterial map={textures.path} transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {[0, 1, 2, 3].map((era) => (
        <EraScenery key={era} era={era} />
      ))}

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[specks.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[specks.colours, 3]} />
        </bufferGeometry>
        <pointsMaterial map={textures.dot} vertexColors size={0.12} sizeAttenuation transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </points>

      {/* The four era stations: the era number above the path, the era's sculpture on the
          left and one of its machines on the right, as glowing holograms. */}
      {ERAS.map((era, i) => {
        const z = stationZ(i)
        return (
          <group key={era} position={[0, 0, z]}>
            <group position={[0, 4.4, -2]}>
              <EraNumeral era={era} />
            </group>
            <Turning speed={0.5} position={[-3.2, 2.1, 0]} scale={0.75}>
              <Hologram material={eraMaterials[i]}>
                <EraSculpture room={era} />
              </Hologram>
            </Turning>
            <Turning speed={-0.35} position={[3.2, 0.25, 0]} scale={0.9}>
              <Hologram material={eraMaterials[i]}>
                <Invention id={ERA_MACHINES[i]} />
              </Hologram>
            </Turning>
            {/* Glowing discs under the two holograms. */}
            {[-3.2, 3.2].map((x) => (
              <mesh key={x} position={[x, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ringMaterials[i]}>
                <ringGeometry args={[1.1, 1.2, 48]} />
              </mesh>
            ))}
          </group>
        )
      })}

      {/* The arrival: a balcony ring of light, the dawn sky, the sun and the city. */}
      <mesh position={[0, 0.02, ARRIVAL_Z]} rotation={[-Math.PI / 2, 0, 0]} material={glowMaterials.balcony}>
        <ringGeometry args={[2.6, 2.8, 64]} />
      </mesh>
      {/* (A flat backdrop rather than a dome: the colour bands of a gradient on a dome
          curve into odd rings when seen from inside.) */}
      <mesh ref={skyMesh} position={[0, -6, ARRIVAL_Z - 98]} visible={false}>
        <planeGeometry args={[420, 220]} />
        <meshBasicMaterial ref={sky} map={textures.sky} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, -6, ARRIVAL_Z - 95]} material={glowMaterials.sun}>
        <circleGeometry args={[7, 48]} />
      </mesh>
      <City ref={city} windows={textures.windows} />
    </group>
  )
}
