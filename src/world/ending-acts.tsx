import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  LatheGeometry,
  Object3D,
  Path,
  Plane,
  QuadraticBezierCurve3,
  Shape,
  Vector2,
  Vector3,
  type Group,
  type InstancedMesh,
  type Material,
  type Mesh,
  type MeshBasicMaterial,
  type Points,
} from 'three'
import { useContent } from '../content/use-content'
import { FilmModel } from './inventions'
import { Box, Cyl, Figure, Panel, Puffs, Rod, Spin, Surface, paint, seeded, usePalette } from './ending-sets'
import { ERA_ICONS } from './diagrams'
import { LINE_SPEED, ORIGIN, film, fireLevel, gridRadius, lampLevel, mindLevel, rocketX, shotId, since, smooth } from './ending-shots'

// THE ENDING FILM'S FOUR ACTS (script in ending-shots.ts, played by EndingScene.tsx): one
// set per era, each a few scenes. Each scene is drawn only during its own shots, so only one
// is on the graphics card's hands at a time, and the scenes of one set can share the ground.
// The heroes are the museum's own downloaded models (Watt's engine, the Rocket, the Model T,
// the Intel 4004, the IBM PC, the 3D printer, the cobot), shown much larger.

type V3 = [number, number, number]

// ---------- Scenes ----------

// Whether a scene is on screen (its moving parts rest while it is not).
const SceneState = createContext<{ on: boolean }>({ on: true })
const useOn = () => useContext(SceneState)

function Scene({ shots, children }: { shots: string[]; children: ReactNode }) {
  const ref = useRef<Group>(null)
  const state = useMemo(() => ({ on: true }), [])
  useFrame(() => {
    state.on = film.running && (!film.ready || shots.includes(shotId()))
    if (ref.current) ref.current.visible = state.on
  })
  return (
    <SceneState.Provider value={state}>
      <group ref={ref}>{children}</group>
    </SceneState.Provider>
  )
}

// Something moved every frame by `update` (only while its scene is on screen).
function Moving({ update, children, at }: { update: (o: Group, t: number) => void; children: ReactNode; at?: V3 }) {
  const ref = useRef<Group>(null)
  const on = useOn()
  useFrame(() => {
    if (ref.current && on.on) update(ref.current, film.t)
  })
  return (
    <group ref={ref} position={at}>
      {children}
    </group>
  )
}

// ---------- Building blocks ----------

const random = (r: () => number, a: number, b: number) => a + (b - a) * r()

// Many copies of one shape in one batch, placed once.
function Many({ count, place, material, children, shadows = false }: { count: number; place: (i: number, o: Object3D) => void; material: Material; children: ReactNode; shadows?: boolean }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new Object3D()
    for (let i = 0; i < count; i++) {
      o.position.set(0, 0, 0)
      o.rotation.set(0, 0, 0)
      o.scale.set(1, 1, 1)
      place(i, o)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    // (place is written inline by each caller; the copies are placed once.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={material} castShadow={shadows} receiveShadow>
      {children}
    </instancedMesh>
  )
}

// GLINTS: sparks, flames, embers, dust, stars, drawn as one batch of glowing dots. Each is
// born where `emit` says, moves, and glows brightest halfway through its life.
function Glints({ count, size, colour, life, emit, gate, gravity = 0, drag = 0 }: {
  count: number
  size: number
  colour: string
  life: number
  emit: (p: Vector3, v: Vector3, r: () => number) => void
  gate?: () => number
  gravity?: number
  drag?: number
}) {
  const { tex } = usePalette()
  const on = useOn()
  const ref = useRef<Points>(null)
  const data = useMemo(() => {
    const r = seeded(count * 7 + Math.round(life * 100))
    return {
      pos: new Float32Array(count * 3).fill(-999),
      col: new Float32Array(count * 3),
      vel: Array.from({ length: count }, () => new Vector3()),
      age: Float32Array.from({ length: count }, () => r() * life),
      born: new Uint8Array(count),
      p: new Vector3(),
    }
  }, [count, life])
  const base = useMemo(() => new Color(colour), [colour])
  useFrame((_, delta) => {
    const points = ref.current
    if (!points || !on.on) return
    const dt = Math.min(delta, 0.05)
    const g = gate ? gate() : 1
    const { pos, col, vel, age, born, p } = data
    for (let i = 0; i < count; i++) {
      let a = age[i] + dt
      const v = vel[i]
      if (!born[i] || a >= life) {
        emit(p, v, Math.random)
        // (The first time, each starts part-way through its life, so they do not all
        // appear together.)
        const head = born[i] ? 0 : age[i]
        a = born[i] ? a - life : age[i]
        born[i] = 1
        pos[i * 3] = p.x + v.x * head
        pos[i * 3 + 1] = p.y + v.y * head
        pos[i * 3 + 2] = p.z + v.z * head
      } else {
        v.y += gravity * dt
        if (drag) v.multiplyScalar(1 - Math.min(1, drag * dt))
        pos[i * 3] += v.x * dt
        pos[i * 3 + 1] += v.y * dt
        pos[i * 3 + 2] += v.z * dt
      }
      age[i] = a
      const f = Math.sin(Math.PI * Math.min(1, a / life)) * g
      col[i * 3] = base.r * f
      col[i * 3 + 1] = base.g * f
      col[i * 3 + 2] = base.b * f
    }
    points.geometry.attributes.position.needsUpdate = true
    points.geometry.attributes.color.needsUpdate = true
  })
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={size} map={tex.dot} vertexColors transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} sizeAttenuation />
    </points>
  )
}

// A bent pipe or cable along points.
function Pipe({ points, r, m, segments = 48 }: { points: V3[]; r: number; m: Material; segments?: number }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(...p))), [points])
  return (
    <mesh material={m} castShadow>
      <tubeGeometry args={[curve, segments, r, 12, false]} />
    </mesh>
  )
}

// A canvas picture made once for this component, freed with it.
function usePainted(width: number, height: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, wrap = false) {
  // (The drawing is fixed for each picture; only its size changes what is painted.)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const texture = useMemo(() => paint(width, height, draw, wrap), [width, height, wrap])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

// A material whose glow follows `level` every frame (lamps switching on, a fire...).
function useGlow(colour: string, level: () => number, strength = 3) {
  const ref = useRef<MeshBasicMaterial>(null)
  const base = useMemo(() => new Color(colour), [colour])
  const on = useOn()
  useFrame(() => {
    if (ref.current && on.on) ref.current.color.copy(base).multiplyScalar(strength * level())
  })
  return ref
}

// ======================================================================================
// ACT I, STEAM
// ======================================================================================

// The boiler's front plate: a round, bevelled iron plate with the firebox door opening.
function boilerFront() {
  const shape = new Shape()
  shape.absarc(0, 0, 1.35, 0, Math.PI * 2, false)
  const hole = new Path()
  const [x, y, w, h, r] = [-0.42, -0.95, 0.84, 0.55, 0.1]
  hole.moveTo(x + r, y)
  hole.lineTo(x + w - r, y)
  hole.quadraticCurveTo(x + w, y, x + w, y + r)
  hole.lineTo(x + w, y + h - r)
  hole.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  hole.lineTo(x + r, y + h)
  hole.quadraticCurveTo(x, y + h, x, y + h - r)
  hole.lineTo(x, y + r)
  hole.quadraticCurveTo(x, y, x + r, y)
  shape.holes.push(hole)
  return new ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 72 })
}

function PressureGauge({ at }: { at: V3 }) {
  const { m } = usePalette()
  const dial = usePainted(256, 256, (c, w) => {
    c.fillStyle = '#efe6d2'
    c.beginPath()
    c.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2)
    c.fill()
    // The red zone at the top of the scale, then the ticks.
    c.strokeStyle = '#b3261e'
    c.lineWidth = 14
    c.beginPath()
    c.arc(w / 2, w / 2, w * 0.38, -0.35, 0.55)
    c.stroke()
    c.strokeStyle = '#2a2016'
    for (let i = 0; i <= 20; i++) {
      const a = -Math.PI * 1.25 + (i / 20) * Math.PI * 1.5
      const inner = i % 5 === 0 ? 0.3 : 0.36
      c.lineWidth = i % 5 === 0 ? 5 : 2
      c.beginPath()
      c.moveTo(w / 2 + Math.cos(a) * w * inner, w / 2 + Math.sin(a) * w * inner)
      c.lineTo(w / 2 + Math.cos(a) * w * 0.43, w / 2 + Math.sin(a) * w * 0.43)
      c.stroke()
    }
  })
  return (
    <group position={at}>
      <mesh material={m.brass}>
        <torusGeometry args={[0.17, 0.03, 12, 40]} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[0.17, 40]} />
        <meshStandardMaterial map={dial} roughness={0.5} emissive="#ffffff" emissiveMap={dial} emissiveIntensity={0.15} />
      </mesh>
      {/* The needle climbs as the pressure rises. */}
      <Moving update={(o) => (o.rotation.z = 2.3 - 2.6 * smooth(0.3, 3.0, since('ember')) - 0.03 * Math.sin(film.t * 23))}>
        <mesh position={[0, 0.06, 0.012]}>
          <boxGeometry args={[0.012, 0.13, 0.004]} />
          <meshStandardMaterial color="#1a1410" />
        </mesh>
      </Moving>
      <mesh position={[0, 0, 0.02]} material={m.glass}>
        <circleGeometry args={[0.17, 40]} />
      </mesh>
      <Rod a={[0, -0.18, -0.02]} b={[0, -0.42, -0.06]} r={0.02} m={m.copper} />
    </group>
  )
}

function Firebox() {
  const { m } = usePalette()
  const front = useMemo(boilerFront, [])
  useEffect(() => () => front.dispose(), [front])
  const coals = useGlow('#ff5a14', fireLevel, 1.6)
  const heat = useGlow('#ff6a20', fireLevel, 0.22)
  const rivets: [number, number][] = useMemo(() => {
    const list: [number, number][] = []
    for (let i = 0; i < 64; i++) list.push([Math.cos((i / 64) * Math.PI * 2) * 1.24, Math.sin((i / 64) * Math.PI * 2) * 1.24])
    for (let i = 0; i < 10; i++) list.push([-0.5 + i * 0.11, -0.3], [-0.5 + i * 0.11, -1.02])
    return list
  }, [])
  return (
    <group>
      <Surface name="tiles" size={[14, 0, 12]} at={[0, 0, 2]} tint="#4a3c30" tile={0.9} />
      {/* The boiler: front plate, riveted barrel, brick setting. */}
      <mesh geometry={front} position={[0, 1.5, 0]} material={m.iron} castShadow receiveShadow />
      <Many count={rivets.length} material={m.iron} place={(i, o) => o.position.set(rivets[i][0], 1.5 + rivets[i][1], 0.14)}>
        <sphereGeometry args={[0.024, 8, 6]} />
      </Many>
      <Cyl r={1.33} h={4.4} at={[0, 1.5, -2.25]} rot={[Math.PI / 2, 0, 0]} m={m.iron} seg={48} />
      {[-0.7, -1.8, -2.9, -4].map((z) => (
        <mesh key={z} position={[0, 1.5, z]} material={m.darkIron}>
          <torusGeometry args={[1.345, 0.028, 8, 64]} />
        </mesh>
      ))}
      <Box size={[3.2, 0.5, 4.4]} at={[0, 0.25, -2.3]} m={m.brick} />
      {/* The firebox: a glowing cave behind the door, coals, flames and sparks. */}
      <mesh position={[0, 0.83, -0.62]}>
        <boxGeometry args={[0.84, 0.55, 1.2]} />
        <meshStandardMaterial color="#3a1a0c" side={BackSide} emissive="#ff4a10" emissiveIntensity={0.35} roughness={1} />
      </mesh>
      <Many count={70} material={m.soot} place={(i, o) => {
        const r = seeded(i * 13 + 5)
        o.position.set(random(r, -0.38, 0.38), random(r, 0.57, 0.64), random(r, -1.15, -0.05))
        o.rotation.set(r() * 3, r() * 3, 0)
        o.scale.setScalar(random(r, 0.6, 1.3))
      }}>
        <icosahedronGeometry args={[0.055, 0]} />
      </Many>
      <Many count={18} material={m.fire} place={(i, o) => {
        const r = seeded(i * 31 + 9)
        o.position.set(random(r, -0.34, 0.34), random(r, 0.6, 0.66), random(r, -1.0, -0.1))
        o.rotation.set(r() * 3, r() * 3, 0)
        o.scale.setScalar(random(r, 0.5, 0.9))
      }}>
        <icosahedronGeometry args={[0.05, 0]} />
      </Many>
      <mesh position={[0, 0.6, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 1.15]} />
        <meshBasicMaterial ref={coals} toneMapped={false} />
      </mesh>
      <Glints count={260} size={0.28} colour="#ff7a22" life={0.55} gate={fireLevel} emit={(p, v, r) => {
        p.set(random(r, -0.36, 0.36), 0.62, random(r, -1.05, -0.1))
        v.set(random(r, -0.15, 0.15), random(r, 0.7, 1.4), random(r, 0, 0.3))
      }} />
      <Glints count={130} size={0.16} colour="#ffd690" life={0.38} gate={fireLevel} emit={(p, v, r) => {
        p.set(random(r, -0.34, 0.34), 0.62, random(r, -0.9, -0.1))
        v.set(random(r, -0.1, 0.1), random(r, 0.5, 1.0), random(r, 0, 0.2))
      }} />
      <Glints count={60} size={0.035} colour="#ffb060" life={1.8} gravity={0.15} drag={0.4} gate={fireLevel} emit={(p, v, r) => {
        p.set(random(r, -0.3, 0.3), random(r, 0.7, 0.95), random(r, -0.3, 0.05))
        v.set(random(r, -0.35, 0.35), random(r, 0.3, 0.9), random(r, 0.5, 1.2))
      }} />
      <mesh position={[0, 0.83, 0.2]}>
        <planeGeometry args={[1.1, 0.8]} />
        <meshBasicMaterial ref={heat} map={usePalette().tex.dot} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* The door, swung open on its hinge, and the door frame. */}
      <group position={[0.45, 0.83, 0.16]} rotation={[0, 2.55, 0]}>
        <mesh position={[-0.43, 0, 0]} material={m.iron} castShadow>
          <boxGeometry args={[0.86, 0.57, 0.05]} />
        </mesh>
        <Cyl r={0.03} h={0.12} at={[-0.75, 0, 0.05]} rot={[Math.PI / 2, 0, 0]} m={m.brass} />
      </group>
      {[0.56, 1.1].map((y) => (
        <Box key={y} size={[0.98, 0.05, 0.05]} at={[0, y, 0.17]} m={m.brass} />
      ))}
      {/* Gauge, water-level glass, pipes and a brass maker's plate. */}
      <PressureGauge at={[0.78, 2.28, 0.2]} />
      <Pipe points={[[-1.0, 2.6, 0.22], [-1.0, 2.05, 0.24], [-0.75, 1.82, 0.24], [-0.25, 1.78, 0.24]]} r={0.035} m={m.copper} />
      <Pipe points={[[1.2, 1.7, 0.2], [0.95, 1.95, 0.24], [0.78, 2.0, 0.24]]} r={0.025} m={m.copper} />
      <Cyl r={0.035} h={0.62} at={[-0.62, 2.12, 0.24]} m={m.glass} />
      <Cyl r={0.05} h={0.08} at={[-0.62, 2.45, 0.24]} m={m.brass} />
      <Cyl r={0.05} h={0.08} at={[-0.62, 1.79, 0.24]} m={m.brass} />
      <mesh position={[-0.05, 2.5, 0.17]} scale={[1, 0.36, 1]} material={m.brass}>
        <circleGeometry args={[0.3, 40]} />
      </mesh>
      {/* The stoker and his coal. */}
      <Figure era={0} at={[-0.95, 0, 1.3]} turn={2.6} action="shovel" />
      <Cyl r={0.95} h={0.6} top={0.05} at={[-2.2, 0.3, 1.6]} m={m.soot} seg={20} />
      <Many count={36} material={m.soot} place={(i, o) => {
        const r = seeded(i * 7 + 2)
        o.position.set(random(r, -2.9, -0.9), 0.04, random(r, 0.6, 2.6))
        o.rotation.set(r() * 3, r() * 3, 0)
      }}>
        <icosahedronGeometry args={[0.06, 0]} />
      </Many>
    </group>
  )
}

// The engine house: Watt's engine (the museum's animated model), very large, in shafts of light.
const WATT_SIZE = 11 // the model's height (its largest side), metres
const WATT_TABLE = WATT_SIZE * 0.565 // the height of its display table (top just under the floor)
function EngineHouse() {
  const { m } = usePalette()
  return (
    <group>
      {/* (The museum model stands on a display table: sunk to the table top, which lies just
          under the floor, the engine stands on the engine-house floor itself.) */}
      <group position={[0, -WATT_TABLE, 0]}>
        <FilmModel name="watt" size={WATT_SIZE} animate />
      </group>
      <Surface name="tiles" size={[20, 0, 16]} at={[0, 0, 1]} tint="#6a5a48" tile={1.1} />
      <Surface name="bricks" size={[20, 11, 0.5]} at={[0, 5.5, -4.2]} tint="#9a6a50" tile={1.3} wall />
      <Surface name="bricks" size={[0.5, 11, 14]} at={[-8.5, 5.5, 1]} tint="#8a5e48" tile={1.3} wall />
      {[-4.6, 0, 4.6].map((x) => (
        <group key={x}>
          {/* An arched window, its glazing bars, and the shaft of daylight through it. */}
          <Panel size={[1.7, 3.2]} at={[x, 4.2, -3.93]} m={m.daylight} />
          <mesh position={[x, 5.8, -3.93]} material={m.daylight}>
            <circleGeometry args={[0.85, 32, 0, Math.PI]} />
          </mesh>
          <Box size={[0.06, 4.0, 0.06]} at={[x, 4.6, -3.9]} m={m.darkIron} />
          {[3.0, 4.0, 5.0].map((y) => (
            <Box key={y} size={[1.7, 0.05, 0.06]} at={[x, y, -3.9]} m={m.darkIron} />
          ))}
          <mesh position={[x + 0.3, 2.3, -0.25]} rotation={[-1.0, 0, 0]} material={m.shaft}>
            <planeGeometry args={[1.7, 9.6]} />
          </mesh>
        </group>
      ))}
      <Glints count={160} size={0.03} colour="#8a7a64" life={6} emit={(p, v, r) => {
        p.set(random(r, -6, 6), random(r, 0.3, 6), random(r, -3.5, 3.5))
        v.set(random(r, -0.05, 0.05), random(r, -0.02, 0.06), random(r, -0.05, 0.05))
      }} />
      {/* A steam pipe from the boiler house, and steam escaping at a valve. */}
      <Pipe points={[[-8.2, 0.7, 2.6], [-6.5, 0.7, 2.6], [-5.4, 0.7, 2.3]]} r={0.09} m={m.copper} />
      <Cyl r={0.14} h={0.25} at={[-5.3, 0.82, 2.3]} m={m.brass} />
      <Puffs count={50} material={m.steam} colour="#9c968c" size={0.9} life={2.6} rate={16} rise={0.9} spread={0.5} spawn={(o) => (o.set(-5.3, 1.0, 2.3), true)} />
      {/* The oil lamp that lights the front. */}
      <group position={[5.6, 3.6, 3.6]}>
        <Rod a={[0, 0, 0]} b={[0, 4, 0]} r={0.012} m={m.darkIron} />
        <Cyl r={0.12} h={0.3} at={[0, -0.15, 0]} m={m.glass} />
        <mesh position={[0, -0.15, 0]} material={m.bulb}>
          <sphereGeometry args={[0.06, 12, 8]} />
        </mesh>
        <Cyl r={0.15} h={0.04} at={[0, 0.02, 0]} m={m.brass} />
      </group>
    </group>
  )
}

// Out on the line at sunset: the Rocket races past, smoke streaming behind it.
function Railway() {
  const { m, tex } = usePalette()
  const sky = usePainted(4, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#4c5a7e')
    g.addColorStop(0.36, '#b98a74')
    g.addColorStop(0.48, '#f2b47a')
    g.addColorStop(0.5, '#f7cf98')
    g.addColorStop(0.53, '#8a6a4c')
    g.addColorStop(1, '#3a2c20')
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
  })
  const chimneyFront = 2.45 // the Rocket's chimney, ahead of its middle (metres)
  return (
    <group>
      <mesh>
        <sphereGeometry args={[390, 32, 16]} />
        <meshBasicMaterial map={sky} side={BackSide} fog={false} />
      </mesh>
      {/* The low sun and its glow. */}
      <mesh position={[-300, 24, -150]} rotation={[0, 1.1, 0]}>
        <circleGeometry args={[12, 40]} />
        <meshBasicMaterial color={new Color('#ffe2b0').multiplyScalar(2.5)} toneMapped={false} fog={false} />
      </mesh>
      <mesh position={[-298, 24, -149]} rotation={[0, 1.1, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial map={tex.dot} color="#ff9a50" transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[700, 700]} />
        <meshStandardMaterial color="#6b5f3e" roughness={1} />
      </mesh>
      {[
        [-90, -140, 70],
        [10, -170, 90],
        [120, -150, 80],
        [-200, -190, 110],
        [220, -200, 100],
      ].map(([x, z, w], i) => (
        <mesh key={i} position={[x, -6, z]} scale={[w, 18, w * 0.45]}>
          <sphereGeometry args={[1, 24, 12]} />
          <meshStandardMaterial color="#4a4630" roughness={1} />
        </mesh>
      ))}
      {/* The line: ballast, sleepers, two rails, and a fence along it. */}
      <Box size={[260, 0.22, 3.4]} at={[-10, 0.11, 0]} m={m.stone} />
      <Many count={300} material={m.timber} place={(i, o) => o.position.set(-140 + i * 0.85, 0.27, 0)}>
        <boxGeometry args={[0.24, 0.1, 2.5]} />
      </Many>
      {[-0.72, 0.72].map((z) => (
        <Box key={z} size={[260, 0.12, 0.07]} at={[-10, 0.38, z]} m={m.iron} />
      ))}
      <Many count={70} material={m.timber} place={(i, o) => o.position.set(-120 + i * 3.4, 0.55, -4.2)}>
        <boxGeometry args={[0.12, 1.1, 0.12]} />
      </Many>
      {[0.45, 0.85].map((y) => (
        <Box key={y} size={[240, 0.06, 0.04]} at={[-1, y, -4.2]} m={m.timber} />
      ))}
      {/* The Rocket and its smoke. */}
      <Moving update={(o) => (o.position.x = rocketX(since('rocket')))}>
        <group position={[0, 0.44, 0]}>
          <FilmModel name="rocket" size={6.4} yaw={Math.PI / 2} />
        </group>
      </Moving>
      <Puffs count={140} material={m.smoke} colour="#4a4440" size={2.2} life={3.2} rate={42} rise={2.2} spread={0.9} spawn={(o) => (o.set(rocketX(since('rocket')) + chimneyFront, 4.6, 0), since('rocket') > -0.5)} />
      <Puffs count={40} material={m.steam} colour="#7a706a" size={0.7} life={1.0} rate={22} rise={0.5} spread={1.4} spawn={(o) => (o.set(rocketX(since('rocket')) + 1.2, 1.2, 0.9), since('rocket') > -0.5)} />
      {/* The mill towns on the horizon, their chimneys smoking. */}
      {[
        [-70, -42, 16, 9],
        [-46, -50, 12, 7],
        [-96, -56, 18, 10],
        [-20, -60, 10, 6],
      ].map(([x, z, w, h], i) => (
        <Box key={i} size={[w, h, 8]} at={[x, h / 2, z]} m={m.brick} />
      ))}
      {[-80, -58, -36, -104, -14].map((x, i) => (
        <group key={x}>
          <Cyl r={1.1} top={0.8} h={26} at={[x, 13, -44 - i * 4]} m={m.brick} seg={16} />
          <Puffs count={40} material={m.smoke} colour="#3a3430" size={6} life={7} rate={6} rise={2.6} spread={1.8} spawn={(o) => (o.set(x + 0.5, 26.5, -44 - i * 4), true)} />
        </group>
      ))}
    </group>
  )
}

export function ActSteam() {
  return (
    <>
      <Scene shots={['ember']}>
        <Firebox />
      </Scene>
      <Scene shots={['engine', 'echo1']}>
        <EngineHouse />
      </Scene>
      <Scene shots={['rocket']}>
        <Railway />
      </Scene>
    </>
  )
}

// ======================================================================================
// ACT II, ELECTRICITY
// ======================================================================================

// The dynamo's turning angle: it runs up to speed in its first second and a half.
const dynamoAngle = () => {
  const s = Math.max(0, since('dynamo') + 0.6)
  return s < 1.5 ? 2.6 * s * s : 2.6 * 2.25 + 7.8 * (s - 1.5)
}

// A lamp of the dynamo's row: socket, glass bulb, glowing filament.
function DynamoLamp({ x, i }: { x: number; i: number }) {
  const { m } = usePalette()
  const filament = useGlow('#ffb860', () => lampLevel(i), 4)
  const halo = useGlow('#ffc070', () => lampLevel(i), 0.5)
  return (
    <group position={[x, 3.25, -1.6]}>
      <Rod a={[0, 0, 0]} b={[0, 0.5, 0]} r={0.008} m={m.darkIron} />
      <Cyl r={0.035} h={0.08} at={[0, -0.03, 0]} m={m.brass} />
      <mesh position={[0, -0.13, 0]} material={m.glass}>
        <sphereGeometry args={[0.075, 16, 12]} />
      </mesh>
      <mesh position={[0, -0.13, 0]}>
        <torusGeometry args={[0.022, 0.004, 6, 16]} />
        <meshBasicMaterial ref={filament} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.13, 0.01]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial ref={halo} map={usePalette().tex.dot} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

function DynamoHall() {
  const { m } = usePalette()
  const greenIron = useMemo(() => ({ color: '#24382d', roughness: 0.45, metalness: 0.35 }), [])
  const coils = usePainted(16, 128, (c, w, h) => {
    for (let y = 0; y < h; y += 4) {
      c.fillStyle = y % 8 ? '#b8703f' : '#7a4424'
      c.fillRect(0, y, w, 4)
    }
  }, true)
  coils.repeat.set(1, 6)
  return (
    <group>
      <Surface name="tiles" size={[18, 0, 14]} at={[0, 0, 1]} tint="#8a8478" tile={0.8} />
      <Surface name="plaster" size={[18, 8, 0.4]} at={[0, 4, -6.2]} tint="#a8a090" tile={2} wall />
      {[-5, 0, 5].map((x) => (
        <group key={x}>
          <Panel size={[1.8, 3.4]} at={[x, 4.2, -5.98]} m={m.dusk} />
          <mesh position={[x, 5.9, -5.98]} material={m.dusk}>
            <circleGeometry args={[0.9, 32, 0, Math.PI]} />
          </mesh>
          <Box size={[0.06, 4.2, 0.05]} at={[x, 4.6, -5.95]} m={m.darkIron} />
          <Box size={[1.8, 0.05, 0.05]} at={[x, 4.4, -5.95]} m={m.darkIron} />
        </group>
      ))}
      {/* The machine: a cast-iron base and frame, two field coils, the turning ring. */}
      <RoundedBox args={[3.3, 0.7, 2.1]} radius={0.08} position={[0, 0.35, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...greenIron} />
      </RoundedBox>
      <Box size={[3.34, 0.06, 2.14]} at={[0, 0.62, 0]} m={m.brass} />
      {[-1.55, 1.55].map((x) => (
        <RoundedBox key={x} args={[0.36, 3.0, 1.2]} radius={0.06} position={[x, 2.1, 0]} castShadow>
          <meshStandardMaterial {...greenIron} />
        </RoundedBox>
      ))}
      {[3.35, 0.95].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 2.74, 40]} />
            <meshStandardMaterial map={coils} roughness={0.38} metalness={0.85} />
          </mesh>
          {[-1.4, 1.4].map((x) => (
            <Cyl key={x} r={0.4} h={0.06} at={[x, y, 0]} rot={[0, 0, Math.PI / 2]} m={m.brass} seg={32} />
          ))}
        </group>
      ))}
      {/* Pole pieces curving round the ring, top and bottom. */}
      {[0, Math.PI].map((r) => (
        <mesh key={r} position={[0, 2.05, 0.1]} rotation={[0, 0, r + Math.PI * 0.15]}>
          <torusGeometry args={[1.22, 0.13, 12, 40, Math.PI * 0.7]} />
          <meshStandardMaterial {...greenIron} />
        </mesh>
      ))}
      <Spin at={[0, 2.05, 0.1]} speed={dynamoAngle}>
        <mesh material={m.darkIron}>
          <torusGeometry args={[0.92, 0.17, 16, 64]} />
        </mesh>
        <Many count={56} material={m.copper} place={(i, o) => {
          const a = (i / 56) * Math.PI * 2
          o.position.set(Math.cos(a) * 0.92, Math.sin(a) * 0.92, 0)
          o.rotation.set(0, Math.PI / 2, a + Math.PI / 2, 'ZYX')
        }}>
          <torusGeometry args={[0.2, 0.03, 8, 20]} />
        </Many>
        {[0, Math.PI / 3, (Math.PI * 2) / 3].map((a) => (
          <Box key={a} size={[1.7, 0.08, 0.08]} at={[0, 0, 0]} rot={[0, 0, a]} m={m.iron} />
        ))}
        <Cyl r={0.18} h={0.34} at={[0, 0, 0.45]} rot={[Math.PI / 2, 0, 0]} m={m.copper} seg={20} />
      </Spin>
      <Cyl r={0.07} h={2.2} at={[0, 2.05, -0.2]} rot={[Math.PI / 2, 0, 0]} m={m.satin} />
      {/* The belt pulley at the back, driven from the engine below the floor. */}
      <Spin at={[0, 2.05, -1.25]} speed={dynamoAngle}>
        <Cyl r={0.55} h={0.22} at={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} m={m.iron} seg={40} />
      </Spin>
      <Rod a={[0.55, 2.05, -1.25]} b={[1.2, -0.5, -1.6]} r={0.03} m={m.tapeDark} />
      <Rod a={[-0.55, 2.05, -1.25]} b={[-1.2, -0.5, -1.6]} r={0.03} m={m.tapeDark} />
      {/* The brushes on the commutator, sparking. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[0.08, 0.32, 0.08]} at={[s * 0.24, 2.05 + s * 0.12, 0.62]} rot={[0, 0, s * 0.5]} m={m.brass} />
          <Box size={[0.04, 0.06, 0.06]} at={[s * 0.16, 2.05 + s * 0.06, 0.62]} m={m.soot} />
        </group>
      ))}
      <Glints count={50} size={0.05} colour="#cfe4ff" life={0.22} gravity={-4} gate={() => smooth(0, 0.6, since('dynamo') + 0.6) * (Math.sin(film.t * 37) > 0.2 ? 1 : 0.2)} emit={(p, v, r) => {
        const s = r() < 0.5 ? -1 : 1
        p.set(s * 0.16, 2.05 + s * 0.06, 0.66)
        v.set(random(r, -1.4, 1.4), random(r, -0.4, 1.6), random(r, 0.2, 1.4))
      }} />
      {/* Cables up to the lamp bar, the lamps, and a marble switchboard on the wall. */}
      <Pipe points={[[0.3, 2.3, 0.7], [0.9, 2.9, 0.4], [1.2, 3.6, -1.0], [1.4, 3.75, -1.6]]} r={0.035} m={m.tapeDark} />
      <Pipe points={[[-0.3, 1.8, 0.7], [-1.0, 2.6, 0.5], [-1.3, 3.6, -1.0], [-1.5, 3.75, -1.6]]} r={0.035} m={m.tapeDark} />
      <Box size={[6.8, 0.06, 0.06]} at={[0, 3.75, -1.6]} m={m.brass} />
      {[-3, -2, -1, 0, 1, 2, 3].map((x, i) => (
        <DynamoLamp key={x} x={x} i={i} />
      ))}
      <Box size={[2.6, 1.7, 0.1]} at={[-5.2, 1.9, -5.9]} m={m.marble} />
      {[-5.9, -5.2, -4.5].map((x) => (
        <group key={x}>
          <mesh position={[x, 2.35, -5.84]} material={m.cream}>
            <circleGeometry args={[0.16, 24]} />
          </mesh>
          <Box size={[0.06, 0.32, 0.06]} at={[x, 1.6, -5.8]} rot={[0.6, 0, 0]} m={m.copper} />
        </group>
      ))}
    </group>
  )
}

// THE CITY AT NIGHT: blocks of buildings and lines of street lamps, lit street by street as
// the light spreads out from the power station in the middle.
function City() {
  const { m } = usePalette()
  const on = useOn()
  const windows = usePainted(64, 128, (c, w, h) => {
    const r = seeded(17)
    c.fillStyle = '#000'
    c.fillRect(0, 0, w, h)
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 6; x++) {
        if (r() < 0.35) continue
        c.fillStyle = r() < 0.6 ? '#ffd29a' : '#fff0d0'
        c.fillRect(3 + x * 10, 3 + y * 8, 5, 4)
      }
  }, true)
  windows.repeat.set(4, 1)
  const city = useMemo(() => {
    const r = seeded(91)
    const buildings: { x: number; z: number; w: number; d: number; h: number; dist: number; lit: number }[] = []
    for (let i = -10; i <= 10; i++)
      for (let j = -10; j <= 10; j++) {
        if (Math.abs(i) <= 0 && Math.abs(j) <= 0) continue // the power station's block
        const cx = i * 10
        const cz = j * 10
        const dist = Math.hypot(cx, cz)
        if (dist > 104) continue
        const lots = 1 + Math.floor(r() * 3)
        for (let k = 0; k < lots; k++) {
          const w = random(r, 2.5, 6.5 / Math.sqrt(lots))
          const d = random(r, 2.5, 6.5)
          buildings.push({
            x: cx + random(r, -3.4 + w / 2, 3.4 - w / 2),
            z: cz + random(r, -3.4 + d / 2, 3.4 - d / 2),
            w,
            d,
            h: random(r, 3, 7) + (r() < 0.25 ? random(r, 0, 1) * 12 * Math.exp(-dist / 30) : 0),
            dist,
            lit: random(r, 0.55, 1),
          })
        }
      }
    const lamps: number[] = []
    for (let k = -10; k <= 9; k++)
      for (let s = -100; s <= 100; s += 5) {
        const a = (k + 0.5) * 10
        if (Math.hypot(a, s) < 104) lamps.push(a, 0.5, s, s, 0.5, a)
      }
    return { buildings, lamps: new Float32Array(lamps), lampColours: new Float32Array(lamps.length) }
  }, [])
  const bodies = useRef<InstancedMesh>(null)
  const lights = useRef<InstancedMesh>(null)
  const lamps = useRef<Points>(null)
  const ring = useRef<Mesh>(null)
  const { tex } = usePalette()
  useLayoutEffect(() => {
    const o = new Object3D()
    const black = new Color(0, 0, 0)
    city.buildings.forEach((b, i) => {
      o.position.set(b.x, b.h / 2, b.z)
      o.scale.set(b.w, b.h, b.d)
      o.updateMatrix()
      bodies.current?.setMatrixAt(i, o.matrix)
      o.scale.set(b.w * 1.01, b.h * 0.98, b.d * 1.01)
      o.updateMatrix()
      lights.current?.setMatrixAt(i, o.matrix)
      lights.current?.setColorAt(i, black)
    })
    for (const mesh of [bodies.current, lights.current]) {
      if (!mesh) continue
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }, [city])
  const colour = useMemo(() => new Color(), [])
  const settled = useRef(-1) // the light's reach when the colours were last set
  useFrame(() => {
    if (!on.on) return
    const radius = gridRadius()
    // (Past the edge of the city every light is on: nothing left to change.)
    const reach = Math.min(radius, 120)
    if (reach === settled.current) return
    settled.current = reach
    const mesh = lights.current
    if (mesh) {
      city.buildings.forEach((b, i) => mesh.setColorAt(i, colour.setRGB(1, 0.85, 0.62).multiplyScalar(1.5 * b.lit * smooth(0, 9, radius - b.dist))))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    const points = lamps.current
    if (points) {
      const p = city.lamps
      const c = city.lampColours
      for (let i = 0; i < p.length; i += 3) {
        const level = 2.2 * smooth(0, 5, radius - Math.hypot(p[i], p[i + 2]))
        c[i] = level
        c[i + 1] = level * 0.78
        c[i + 2] = level * 0.48
      }
      points.geometry.attributes.color.needsUpdate = true
    }
    if (ring.current) {
      ring.current.scale.setScalar(Math.max(0.01, radius))
      ;(ring.current.material as MeshBasicMaterial).opacity = 0.35 * (1 - smooth(70, 120, radius))
    }
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[240, 64]} />
        <meshStandardMaterial color="#14161a" roughness={0.95} />
      </mesh>
      <instancedMesh ref={bodies} args={[undefined, undefined, city.buildings.length]} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#262a32" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={lights} args={[undefined, undefined, city.buildings.length]}>
        <cylinderGeometry args={[Math.SQRT1_2, Math.SQRT1_2, 1, 4, 1, true]} />
        <meshBasicMaterial map={windows} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <points ref={lamps} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[city.lamps, 3]} />
          <bufferAttribute attach="attributes-color" args={[city.lampColours, 3]} />
        </bufferGeometry>
        <pointsMaterial size={1.3} map={tex.dot} vertexColors transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} sizeAttenuation />
      </points>
      {/* The wave of light running out across the ground. */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <ringGeometry args={[0.96, 1, 96]} />
        <meshBasicMaterial color="#ffc070" transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* The power station: hall, chimneys, and its glowing transformer yard. */}
      <Box size={[8, 6, 6]} at={[0, 3, -1]} m={m.brick} />
      {[-2.5, 0, 2.5].map((x) => (
        <Cyl key={x} r={0.6} top={0.45} h={18} at={[x, 9, -2.5]} m={m.brick} seg={16} />
      ))}
      <Many count={6} material={m.headlamp} place={(i, o) => o.position.set(-2.5 + (i % 3) * 2.5, 0.8, 3 + Math.floor(i / 3) * 1.6)}>
        <boxGeometry args={[0.8, 1.2, 0.8]} />
      </Many>
    </group>
  )
}

// THE ASSEMBLY LINE: Model Ts roll towards the camera down a long hall, workers at their
// stations, a lamp over every few metres.
const LINE_CARS = 8
function AssemblyHall() {
  const { m } = usePalette()
  const on = useOn()
  const belt = usePainted(16, 64, (c, w, h) => {
    c.fillStyle = '#2a2622'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#3d3731'
    for (let y = 0; y < h; y += 16) c.fillRect(0, y, w, 4)
  }, true)
  belt.repeat.set(1, 40)
  useFrame(() => {
    if (on.on) belt.offset.y = (film.t * LINE_SPEED) / 2
  })
  return (
    <group>
      <Surface name="concrete" size={[16, 0, 84]} at={[0, 0, -32]} tint="#6a6560" tile={1.6} />
      {[-8, 8].map((x) => (
        <group key={x}>
          <Surface name="bricks" size={[0.4, 9, 84]} at={[x, 4.5, -32]} tint="#7d5a48" tile={1.4} wall />
          <Many count={13} material={m.dusk} place={(i, o) => {
            o.position.set(x - Math.sign(x) * 0.21, 5.6, 6 - i * 6)
            o.rotation.y = -Math.sign(x) * (Math.PI / 2)
          }}>
            <planeGeometry args={[2.6, 2.4]} />
          </Many>
        </group>
      ))}
      <Many count={21} material={m.darkIron} place={(i, o) => o.position.set(0, 8, 8 - i * 4)}>
        <boxGeometry args={[16, 0.3, 0.25]} />
      </Many>
      {/* The line: its iron frame and the moving belt. */}
      <Box size={[2.4, 0.45, 84]} at={[0, 0.225, -32]} m={m.iron} />
      <mesh position={[0, 0.47, -32]} receiveShadow>
        <boxGeometry args={[2.0, 0.04, 84]} />
        <meshStandardMaterial map={belt} roughness={0.85} />
      </mesh>
      {Array.from({ length: LINE_CARS }, (_, i) => (
        <Moving key={i} update={(o, t) => (o.position.z = ((i * 6.5 + t * LINE_SPEED) % (LINE_CARS * 6.5)) - LINE_CARS * 6.5 + 7)} at={[0, 0.49, 0]}>
          <FilmModel name="modelT" size={3.3} />
          {/* Headlamps lit as the cars leave the line. */}
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x, 1.1, 1.62]} material={m.headlamp}>
              <sphereGeometry args={[0.07, 12, 8]} />
            </mesh>
          ))}
        </Moving>
      ))}
      {[0, 1, 2, 3, 4].flatMap((k) =>
        [-1, 1].map((s) => <Figure key={`${k}${s}`} era={1} at={[s * 1.75, 0, -3 - k * 6.5 + (s > 0 ? 3 : 0)]} turn={-s * (Math.PI / 2)} action="work" phase={k * 0.7 + s} />),
      )}
      {Array.from({ length: 12 }, (_, i) => (
        <group key={i} position={[0, 4.3, 2 - i * 4]}>
          <Rod a={[0, 0.2, 0]} b={[0, 3.7, 0]} r={0.012} m={m.darkIron} />
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.08, 0.46, 0.34, 24, 1, true]} />
            <meshStandardMaterial color="#2f4a3a" roughness={0.5} metalness={0.3} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0.0, 0]} material={m.bulb}>
            <sphereGeometry args={[0.08, 12, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function ActElectric() {
  return (
    <>
      <Scene shots={['dynamo']}>
        <DynamoHall />
      </Scene>
      <Scene shots={['grid']}>
        <City />
      </Scene>
      <Scene shots={['line', 'echo2']}>
        <AssemblyHall />
      </Scene>
    </>
  )
}

// ======================================================================================
// ACT III, DIGITAL
// ======================================================================================

// The microprocessor (the museum's Intel 4004 model), close up on its circuit board.
function ChipMacro() {
  const { m } = usePalette()
  const board = usePainted(512, 512, (c, w) => {
    const r = seeded(23)
    c.fillStyle = '#123a24'
    c.fillRect(0, 0, w, w)
    c.strokeStyle = '#c9a24a'
    c.lineWidth = 3
    for (let i = 0; i < 70; i++) {
      let x = Math.floor(r() * 32) * 16
      let y = Math.floor(r() * 32) * 16
      c.beginPath()
      c.moveTo(x, y)
      for (let k = 0; k < 4; k++) {
        if (r() < 0.5) x += (Math.floor(r() * 9) - 4) * 16
        else y += (Math.floor(r() * 9) - 4) * 16
        c.lineTo(x, y)
      }
      c.stroke()
      c.fillStyle = '#d8b25a'
      c.beginPath()
      c.arc(x, y, 5, 0, Math.PI * 2)
      c.fill()
    }
  }, true)
  board.repeat.set(2, 2)
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial map={board} roughness={0.45} metalness={0.3} />
      </mesh>
      <FilmModel name="chip" size={1.7} />
      {/* Resistors and capacitors around it, out of focus in the dark. */}
      <Many count={10} material={m.cream} place={(i, o) => {
        const r = seeded(i * 5 + 1)
        const a = r() * Math.PI * 2
        o.position.set(Math.cos(a) * random(r, 1.6, 2.6), 0.07, Math.sin(a) * random(r, 1.6, 2.6))
        o.rotation.set(0, r() * 3, Math.PI / 2)
      }}>
        <capsuleGeometry args={[0.06, 0.22, 4, 12]} />
      </Many>
      <Many count={6} material={m.cobotBlue} place={(i, o) => {
        const r = seeded(i * 11 + 3)
        const a = r() * Math.PI * 2
        o.position.set(Math.cos(a) * random(r, 1.8, 2.8), 0.18, Math.sin(a) * random(r, 1.8, 2.8))
      }}>
        <cylinderGeometry args={[0.13, 0.13, 0.36, 20]} />
      </Many>
    </group>
  )
}

// INSIDE THE CHIP: its circuits as a city seen from a low flight, with signals racing along
// the streets between the blocks.
const PULSES = 360
function DieCity() {
  const on = useOn()
  const circuit = usePainted(1024, 1024, (c, w) => {
    const r = seeded(29)
    c.fillStyle = '#0d1a24'
    c.fillRect(0, 0, w, w)
    c.strokeStyle = '#2f6c86'
    for (let i = 0; i < 900; i++) {
      c.lineWidth = r() < 0.2 ? 4 : 1.5
      let x = Math.floor(r() * 64) * 16
      let y = Math.floor(r() * 64) * 16
      c.beginPath()
      c.moveTo(x, y)
      for (let k = 0; k < 3; k++) {
        if (r() < 0.5) x += (Math.floor(r() * 7) - 3) * 16
        else y += (Math.floor(r() * 7) - 3) * 16
        c.lineTo(x, y)
      }
      c.stroke()
    }
    c.fillStyle = '#1d3a4a'
    for (let i = 0; i < 160; i++) c.fillRect(Math.floor(r() * 64) * 16, Math.floor(r() * 64) * 16, 16 * (1 + Math.floor(r() * 3)), 16 * (1 + Math.floor(r() * 3)))
  }, true)
  circuit.repeat.set(4, 4)
  const pulses = useMemo(() => {
    const r = seeded(77)
    return Array.from({ length: PULSES }, () => ({ alongX: r() < 0.5, lane: (Math.floor(r() * 34) - 17) * 2 + 1, speed: random(r, 6, 16) * (r() < 0.5 ? -1 : 1), phase: r() * 70 }))
  }, [])
  const ref = useRef<InstancedMesh>(null)
  const o = useMemo(() => new Object3D(), [])
  useFrame(() => {
    const mesh = ref.current
    if (!mesh || !on.on) return
    pulses.forEach((p, i) => {
      const s = ((((p.phase + film.t * p.speed) % 70) + 70) % 70) - 35
      o.position.set(p.alongX ? s : p.lane, 0.08, p.alongX ? p.lane : s)
      o.rotation.set(0, p.alongX ? 0 : Math.PI / 2, 0)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[72, 72]} />
        <meshStandardMaterial map={circuit} roughness={0.35} metalness={0.6} emissive="#3fd0e0" emissiveMap={circuit} emissiveIntensity={0.6} />
      </mesh>
      <DieBlocks />
      <instancedMesh ref={ref} args={[undefined, undefined, PULSES]} frustumCulled={false}>
        <boxGeometry args={[1.3, 0.07, 0.12]} />
        <meshBasicMaterial color={new Color('#a8fff0').multiplyScalar(3.2)} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

// The chip's functional blocks: metal-topped boxes between the signal lanes.
function DieBlocks() {
  const { m } = usePalette()
  const blocks = useMemo(() => {
    const r = seeded(53)
    const list: [number, number, number, number, number][] = []
    for (let i = -17; i < 17; i++)
      for (let j = -17; j < 17; j++) {
        if (r() < 0.45) continue
        list.push([i * 2 + 2, j * 2 + 2, random(r, 0.6, 1.6), random(r, 0.6, 1.6), random(r, 0.06, 0.9) * (r() < 0.12 ? 2.2 : 1)])
      }
    return list
  }, [])
  return (
    <>
      <Many count={blocks.length} material={m.blackGloss} place={(i, o) => {
        const [x, z, w, d, h] = blocks[i]
        o.position.set(x, h / 2, z)
        o.scale.set(w, h, d)
      }}>
        <boxGeometry />
      </Many>
      <Many count={Math.floor(blocks.length / 3)} material={m.cyan} place={(i, o) => {
        const [x, z, w, d, h] = blocks[i * 3]
        o.position.set(x, h + 0.01, z)
        o.scale.set(w * 0.7, 1, d * 0.7)
        o.rotation.x = -Math.PI / 2
      }}>
        <planeGeometry />
      </Many>
    </>
  )
}

// The program being typed on the terminal's screen (text from content/ui.ts).
function TypedScreen({ at, size }: { at: V3; size: [number, number] }) {
  const { ui } = useContent()
  const on = useOn()
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 384
    return c
  }, [])
  const texture = useMemo(() => new CanvasTexture(canvas), [canvas])
  useEffect(() => () => texture.dispose(), [texture])
  const shown = useRef(-1)
  useFrame(() => {
    if (!on.on) return
    const lines = ui.ending.screen
    const chars = Math.max(0, Math.floor((since('terminal') + 0.4) * 34))
    if (chars === shown.current) return
    shown.current = chars
    const c = canvas.getContext('2d')
    if (!c) return
    c.fillStyle = '#04120a'
    c.fillRect(0, 0, 512, 384)
    c.font = "bold 26px 'Courier New', monospace"
    c.fillStyle = '#7dff9a'
    c.shadowColor = '#3cff7a'
    c.shadowBlur = 8
    let left = chars
    lines.forEach((line, i) => {
      if (left <= 0) return
      const text = line.slice(0, left)
      left -= line.length
      c.fillText(text + (left <= 0 && Math.floor(film.t * 3) % 2 ? '█' : ''), 22, 40 + i * 31)
    })
    texture.needsUpdate = true
  })
  return (
    <mesh position={at}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} color={new Color(1.25, 1.25, 1.25)} toneMapped={false} />
    </mesh>
  )
}

function ComputerRoom() {
  const { m } = usePalette()
  const cream = useMemo(() => ({ color: '#d8cfb8', roughness: 0.55 }), [])
  return (
    <group>
      <Surface name="tiles" size={[16, 0, 14]} at={[0, 0, -1]} tint="#5d636b" tile={0.6} />
      {/* The computer cabinets along the back, lamps blinking, tape reels turning. */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = -5.6 + i * 1.6
        return (
          <group key={i} position={[x, 0, -4.6]}>
            <RoundedBox args={[1.4, 2.0, 0.8]} radius={0.04} position={[0, 1.0, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#9aa6b4" roughness={0.5} metalness={0.2} />
            </RoundedBox>
            {i % 2 ? (
              <>
                <Panel size={[1.0, 0.55]} at={[0, 1.45, 0.41]} m={m.leds} />
                <Box size={[1.1, 0.04, 0.02]} at={[0, 0.9, 0.41]} m={m.darkIron} />
              </>
            ) : (
              [-0.3, 0.3].map((dx) => (
                <Spin key={dx} at={[dx, 1.35, 0.42]} speed={(dx > 0 ? 2.2 : -1.6) * (1 + (i % 3) * 0.2)}>
                  <mesh material={m.blackGloss}>
                    <circleGeometry args={[0.26, 32]} />
                  </mesh>
                  <mesh material={m.satin} position={[0, 0, 0.01]}>
                    <ringGeometry args={[0.07, 0.24, 6, 1]} />
                  </mesh>
                </Spin>
              ))
            )}
          </group>
        )
      })}
      {/* The operator's console with its terminal, and an IBM PC beside it. */}
      <RoundedBox args={[2.4, 1.0, 0.85]} radius={0.04} position={[0, 0.5, -0.65]} castShadow receiveShadow>
        <meshStandardMaterial color="#8c949e" roughness={0.5} metalness={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.54, 0.46, 0.5]} radius={0.05} position={[0, 1.24, -0.8]} castShadow>
        <meshStandardMaterial {...cream} />
      </RoundedBox>
      <Box size={[0.46, 0.36, 0.02]} at={[0, 1.27, -0.545]} m={m.blackGloss} />
      <TypedScreen at={[0, 1.27, -0.532]} size={[0.38, 0.285]} />
      <RoundedBox args={[0.5, 0.04, 0.18]} radius={0.01} position={[0, 1.03, -0.36]} rotation={[0.12, 0, 0]}>
        <meshStandardMaterial {...cream} />
      </RoundedBox>
      <group position={[-0.85, 1.0, -0.75]}>
        <FilmModel name="pc" size={0.62} />
      </group>
      <Figure era={2} at={[0.03, 0, 0.32]} turn={Math.PI} action="type" />
      {/* Fluorescent tubes overhead. */}
      {[-3, 0, 3].map((x) => (
        <Panel key={x} size={[1.6, 0.3]} at={[x, 3.6, -1.5]} rot={[Math.PI / 2, 0, 0]} m={m.tube} />
      ))}
    </group>
  )
}

// THE NETWORK: computers appearing all over a globe and links of light joining them.
const NODES = 84
function NetGlobe() {
  const on = useOn()
  const grid = usePainted(1024, 512, (c, w, h) => {
    c.fillStyle = '#000'
    c.fillRect(0, 0, w, h)
    c.strokeStyle = '#2a8fa6'
    c.lineWidth = 1.2
    for (let x = 0; x <= w; x += w / 24) {
      c.beginPath()
      c.moveTo(x, 0)
      c.lineTo(x, h)
      c.stroke()
    }
    for (let y = 0; y <= h; y += h / 12) {
      c.beginPath()
      c.moveTo(0, y)
      c.lineTo(w, y)
      c.stroke()
    }
  })
  const net = useMemo(() => {
    const r = seeded(61)
    const nodes: Vector3[] = []
    for (let i = 0; i < NODES; i++) {
      const u = r() * 2 - 1
      const a = r() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      nodes.push(new Vector3(Math.cos(a) * s, u, Math.sin(a) * s).multiplyScalar(5.02))
    }
    // Each new computer joins the nearest one already there, plus a few long links.
    const links: [number, number][] = []
    for (let i = 1; i < NODES; i++) {
      let best = 0
      for (let j = 1; j < i; j++) if (nodes[j].distanceTo(nodes[i]) < nodes[best].distanceTo(nodes[i])) best = j
      links.push([i, best])
      if (r() < 0.45) links.push([i, Math.floor(r() * i)])
    }
    const curves = links.map(([a, b]) => {
      const mid = nodes[a].clone().add(nodes[b]).multiplyScalar(0.5)
      const lift = 1 + nodes[a].distanceTo(nodes[b]) * 0.06
      return new QuadraticBezierCurve3(nodes[a], mid.normalize().multiplyScalar(5.02 * lift), nodes[b])
    })
    const STEPS = 24
    const positions = new Float32Array(curves.length * STEPS * 6)
    curves.forEach((curve, k) => {
      const pts = curve.getPoints(STEPS)
      for (let s = 0; s < STEPS; s++) {
        positions.set([pts[s].x, pts[s].y, pts[s].z, pts[s + 1].x, pts[s + 1].y, pts[s + 1].z], (k * STEPS + s) * 6)
      }
    })
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    return { nodes, links, curves, geometry, steps: STEPS }
  }, [])
  useEffect(() => () => net.geometry.dispose(), [net])
  const nodeMesh = useRef<InstancedMesh>(null)
  const pulseMesh = useRef<InstancedMesh>(null)
  const o = useMemo(() => new Object3D(), [])
  const point = useMemo(() => new Vector3(), [])
  useFrame(() => {
    if (!on.on) return
    // The network grows during the shot: nodes, then the links between them.
    const grown = smooth(-0.3, 2.6, since('net'))
    const nodes = nodeMesh.current
    if (nodes) {
      net.nodes.forEach((p, i) => {
        o.position.copy(p)
        o.scale.setScalar(smooth(i / NODES - 0.05, i / NODES + 0.05, grown) * (1 + 0.25 * Math.sin(film.t * 5 + i)))
        o.updateMatrix()
        nodes.setMatrixAt(i, o.matrix)
      })
      nodes.instanceMatrix.needsUpdate = true
    }
    const shownLinks = Math.floor(net.links.length * grown)
    net.geometry.setDrawRange(0, shownLinks * net.steps * 2)
    const pulses = pulseMesh.current
    if (pulses) {
      for (let i = 0; i < 160; i++) {
        const k = shownLinks ? (i * 7) % shownLinks : 0
        const u = (film.t * (0.5 + (i % 5) * 0.12) + i * 0.37) % 1
        net.curves[k].getPoint(i % 2 ? u : 1 - u, point)
        o.position.copy(point)
        o.scale.setScalar(shownLinks ? 1 : 0)
        o.updateMatrix()
        pulses.setMatrixAt(i, o.matrix)
      }
      pulses.instanceMatrix.needsUpdate = true
    }
  })
  return (
    <group>
      <mesh>
        <sphereGeometry args={[5, 64, 32]} />
        <meshStandardMaterial color="#0a1a2c" roughness={0.55} metalness={0.25} emissive="#56dff0" emissiveMap={grid} emissiveIntensity={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[5.35, 48, 24]} />
        <meshBasicMaterial color="#3fd0e0" transparent opacity={0.1} blending={AdditiveBlending} side={BackSide} depthWrite={false} />
      </mesh>
      <lineSegments geometry={net.geometry}>
        <lineBasicMaterial color="#56dff0" transparent opacity={0.6} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>
      <instancedMesh ref={nodeMesh} args={[undefined, undefined, NODES]} frustumCulled={false}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshBasicMaterial color={new Color('#bff6ff').multiplyScalar(1.3)} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={pulseMesh} args={[undefined, undefined, 160]} frustumCulled={false}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshBasicMaterial color={new Color('#ffffff').multiplyScalar(1.8)} toneMapped={false} />
      </instancedMesh>
      <Glints count={700} size={0.5} colour="#b9c8e0" life={9999} emit={(p, v, r) => {
        const u = r() * 2 - 1
        const a = r() * Math.PI * 2
        const s = Math.sqrt(1 - u * u)
        p.set(Math.cos(a) * s, u, Math.sin(a) * s).multiplyScalar(random(r, 70, 130))
        v.set(0, 0, 0)
      }} />
    </group>
  )
}

export function ActDigital() {
  return (
    <>
      <Scene shots={['chip']}>
        <ChipMacro />
      </Scene>
      <Scene shots={['die', 'echo3']}>
        <DieCity />
      </Scene>
      <Scene shots={['terminal']}>
        <ComputerRoom />
      </Scene>
      <Scene shots={['net']}>
        <NetGlobe />
      </Scene>
    </>
  )
}

// ======================================================================================
// ACT IV, CONNECTED
// ======================================================================================

const WHITE = { color: '#eef1f3', roughness: 0.35 }

// A self-driving cart going round its marked loop on the factory floor.
function Cart({ phase }: { phase: number }) {
  const { m } = usePalette()
  return (
    <Moving update={(o, t) => {
      // Round a 16 x 3 m loop at 1.6 m/s.
      const length = 38
      const d = (((t * 1.6 + phase) % length) + length) % length
      if (d < 16) o.position.set(-8 + d, 0, 3.2), (o.rotation.y = Math.PI / 2)
      else if (d < 19) o.position.set(8, 0, 3.2 - (d - 16)), (o.rotation.y = Math.PI)
      else if (d < 35) o.position.set(8 - (d - 19), 0, 0.2), (o.rotation.y = -Math.PI / 2)
      else o.position.set(-8, 0, 0.2 + (d - 35)), (o.rotation.y = 0)
    }}>
      <RoundedBox args={[0.62, 0.28, 0.95]} radius={0.06} position={[0, 0.2, 0]} castShadow>
        <meshStandardMaterial {...WHITE} />
      </RoundedBox>
      <Box size={[0.64, 0.03, 0.97]} at={[0, 0.12, 0]} m={m.cyan} />
      <Box size={[0.4, 0.3, 0.5]} at={[0, 0.5, 0]} m={m.timberLight} />
    </Moving>
  )
}

function SmartFactory() {
  const { m } = usePalette()
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[28, 22]} />
        <meshStandardMaterial color="#e3e8ec" roughness={0.3} />
      </mesh>
      <Box size={[28, 6, 0.3]} at={[0, 3, -7]} m={m.wallWhite} />
      {[-7, 0, 7].map((x) => (
        <Panel key={x} size={[5.4, 3]} at={[x, 3.3, -6.84]} m={m.daylight} />
      ))}
      {[-4.5, -1.5, 1.5, 4.5].map((x, i) => (
        <group key={x} position={[x, 0, -2]}>
          <RoundedBox args={[1.8, 0.85, 1.1]} radius={0.05} position={[0, 0.425, 0]} castShadow receiveShadow>
            <meshStandardMaterial {...WHITE} />
          </RoundedBox>
          <Box size={[1.82, 0.03, 1.12]} at={[0, 0.7, 0]} m={m.cyan} />
          <group position={[0.1, 0.85, 0]}>
            <FilmModel name="cobot" size={1.15} animate onOrigin />
          </group>
          {/* The station's live dashboard, floating above it. */}
          <Moving update={(o, t) => (o.position.y = 2.25 + Math.sin(t * 1.3 + i) * 0.04)} at={[0, 2.25, -0.5]}>
            <Panel size={[1.3, 0.62]} at={[0, 0, 0]} m={m.dash} />
            {[-0.32, 0.32].map((y) => (
              <Box key={y} size={[1.32, 0.012, 0.012]} at={[0, y, 0.01]} m={m.cyan} />
            ))}
          </Moving>
        </group>
      ))}
      <Figure era={3} at={[-0.45, 0, -0.75]} turn={-2.4} action="hold" />
      <Figure era={3} at={[3.5, 0, -0.55]} turn={2.5} action="work" />
      <Cart phase={0} />
      <Cart phase={19} />
      {/* The carts' marked lanes, and the light panels overhead. */}
      {[3.2, 0.2].map((z) => (
        <Panel key={z} size={[16.6, 0.06]} at={[0, 0.012, z]} rot={[-Math.PI / 2, 0, 0]} m={m.cyan} />
      ))}
      {[-8, 8].map((x) => (
        <Panel key={x} size={[0.06, 3.06]} at={[x, 0.012, 1.7]} rot={[-Math.PI / 2, 0, 0]} m={m.cyan} />
      ))}
      {[-4.5, 0, 4.5].map((x) => (
        <Panel key={x} size={[3, 0.4]} at={[x, 5.6, -1.5]} rot={[Math.PI / 2, 0, 0]} m={m.tube} />
      ))}
    </group>
  )
}

// The vase's outline (radius, height), for the print and its digital twin.
const VASE = [
  [0.0, 0.0],
  [0.12, 0.0],
  [0.14, 0.04],
  [0.16, 0.14],
  [0.165, 0.24],
  [0.14, 0.34],
  [0.09, 0.42],
  [0.075, 0.48],
  [0.085, 0.53],
  [0.1, 0.56],
].map(([r, h]) => new Vector2(r, h))
const printedLevel = () => 0.12 + 0.88 * smooth(0, 3.1, since('printer'))

function PrintAndTwin() {
  const { m } = usePalette()
  const on = useOn()
  // Everything of the print above the nozzle's height is cut away (a clipping plane).
  const gl = useThree((state) => state.gl)
  const cut = useMemo(() => new Plane(new Vector3(0, -1, 0), 0), [])
  useEffect(() => {
    const was = gl.localClippingEnabled
    gl.localClippingEnabled = true
    return () => {
      gl.localClippingEnabled = was
    }
  }, [gl])
  useFrame(() => {
    if (on.on) cut.constant = ORIGIN[1] + 0.93 + 0.56 * printedLevel()
  })
  const vase = useMemo(() => new LatheGeometry(VASE, 64), [])
  const twin = useMemo(() => new LatheGeometry(VASE, 24), [])
  useEffect(
    () => () => {
      vase.dispose()
      twin.dispose()
    },
    [vase, twin],
  )
  const layers = usePainted(4, 32, (c, w, h) => {
    for (let y = 0; y < h; y += 2) {
      c.fillStyle = y % 4 ? '#e8742c' : '#c45a1c'
      c.fillRect(0, y, w, 2)
    }
  }, true)
  layers.repeat.set(1, 40)
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#e3e8ec" roughness={0.3} />
      </mesh>
      <Box size={[14, 5, 0.3]} at={[0, 2.5, -3]} m={m.wallWhite} />
      <Panel size={[4, 2.4]} at={[-2.5, 2.6, -2.84]} m={m.daylight} />
      <RoundedBox args={[3.4, 0.9, 1.3]} radius={0.05} position={[0.6, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...WHITE} />
      </RoundedBox>
      <group position={[0.2, 0.9, -0.05]}>
        <FilmModel name="printer" size={0.95} yaw={Math.PI} />
      </group>
      {/* The print, growing layer by layer on its plate, the nozzle's glow at its top. */}
      <Cyl r={0.24} h={0.03} at={[0.95, 0.915, 0]} m={m.satin} seg={40} />
      <mesh geometry={vase} position={[0.95, 0.93, 0]} castShadow>
        <meshStandardMaterial map={layers} roughness={0.5} side={DoubleSide} clippingPlanes={[cut]} clipShadows />
      </mesh>
      <Moving update={(o, t) => {
        const level = printedLevel()
        const h = 0.56 * level
        let r = 0.1
        for (let i = 1; i < VASE.length; i++) if (VASE[i].y >= h) {
          const a = VASE[i - 1]
          const b = VASE[i]
          r = a.x + ((b.x - a.x) * (h - a.y)) / Math.max(0.001, b.y - a.y)
          break
        }
        o.position.set(0.95 + Math.cos(t * 9) * r, 0.93 + h, Math.sin(t * 9) * r)
      }}>
        <mesh material={m.nozzle}>
          <sphereGeometry args={[0.012, 8, 6]} />
        </mesh>
      </Moving>
      {/* Its digital twin: complete before the print is, turning over a projector. */}
      <Cyl r={0.26} h={0.04} at={[1.85, 0.92, 0]} m={m.blackGloss} seg={40} />
      <mesh position={[1.85, 0.945, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.cyan}>
        <ringGeometry args={[0.2, 0.24, 48]} />
      </mesh>
      <Moving update={(o, t) => (o.rotation.y = t * 0.6)} at={[1.85, 0.98, 0]}>
        <mesh geometry={twin} material={m.wire} />
      </Moving>
      <Moving update={(o) => (o.position.y = 0.98 + 0.56 * printedLevel())} at={[1.85, 0.98, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.cyan}>
          <torusGeometry args={[0.19, 0.004, 6, 48]} />
        </mesh>
      </Moving>
    </group>
  )
}

// A PERSON BEFORE AN ARTIFICIAL NEURAL NETWORK THAT RECOGNISES PICTURES. Shown the way such
// networks are drawn in textbooks, so it reads at a glance: on the left a picture comes in
// (one of the four eras' icons: a gear, a bulb, a chip, a network), columns of neurons pass a
// wave of signals from layer to layer, and on the right the matching answer lights up among
// four icons. Then the next picture. The waves come faster as the network "wakes".
const MIND_LAYERS = [5, 7, 7, 5] // neurons in each hidden column
const MIND_X = [-5.4, -1.9, 1.6, 5.1] // the columns' places, left to right
const MIND_Y = 4.4 // the network's middle height
const MIND_Z = -8
const MIND_GAP = 1.0 // between neurons in a column
const INPUT_X = -9 // the picture coming in
const OUTPUT_X = 8.6 // the four answers
const OUTPUT_Y = [1.65, 0.55, -0.55, -1.65].map((y) => MIND_Y + y * 1.35)
function MindNetwork() {
  const on = useOn()
  const net = useMemo(() => {
    const r = seeded(83)
    const columns = MIND_LAYERS.map((n, l) =>
      Array.from({ length: n }, (_, i) => new Vector3(MIND_X[l], MIND_Y + (i - (n - 1) / 2) * MIND_GAP, MIND_Z)),
    )
    const nodes = columns.flat()
    const input = new Vector3(INPUT_X + 1.1, MIND_Y, MIND_Z)
    const outputs = OUTPUT_Y.map((y) => new Vector3(OUTPUT_X - 0.75, y, MIND_Z))
    // Every connection, by stage: picture -> first column, column -> column, last -> answers.
    // Each has a strength for each picture (which signals pass when that picture comes in).
    type Link = { from: Vector3; to: Vector3; stage: number; answer?: number; weight: number[] }
    const links: Link[] = []
    const strengths = () => [0, 1, 2, 3].map(() => r())
    columns[0].forEach((to) => links.push({ from: input, to, stage: 0, weight: strengths() }))
    for (let l = 0; l < columns.length - 1; l++)
      for (const from of columns[l]) for (const to of columns[l + 1]) links.push({ from, to, stage: l + 1, weight: strengths() })
    columns[columns.length - 1].forEach((from) =>
      outputs.forEach((to, answer) => links.push({ from, to, stage: columns.length, answer, weight: strengths() })),
    )
    const positions = new Float32Array(links.length * 6)
    links.forEach((link, k) => positions.set([link.from.x, link.from.y, link.from.z, link.to.x, link.to.y, link.to.z], k * 6))
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    // The pictures (and the answers' tiles): the four icons in light on dark glass.
    const icons = [0, 1, 2, 3].map((era) =>
      paint(256, 256, (c, w, h) => {
        c.fillStyle = 'rgba(8, 30, 40, 0.85)'
        c.fillRect(0, 0, w, h)
        c.strokeStyle = '#8fe8ff'
        c.lineWidth = 8
        c.strokeRect(6, 6, w - 12, h - 12)
        c.fillStyle = '#d8fbff'
        c.strokeStyle = '#d8fbff'
        c.lineWidth = 7
        ERA_ICONS[era](c, w / 2, h / 2, w * 0.62)
      }),
    )
    return { nodes, columns, links, geometry, icons }
  }, [])
  useEffect(
    () => () => {
      net.geometry.dispose()
      net.icons.forEach((icon) => icon.dispose())
    },
    [net],
  )
  const nodeMesh = useRef<InstancedMesh>(null)
  const signalMesh = useRef<InstancedMesh>(null)
  const picture = useRef<MeshBasicMaterial>(null)
  const answers = useRef<(MeshBasicMaterial | null)[]>([])
  const o = useMemo(() => new Object3D(), [])
  const wave = useRef({ phase: 0, shown: 0 })
  useFrame((_, delta) => {
    if (!on.on) return
    const stages = MIND_LAYERS.length + 1
    const w = wave.current
    // One picture every 2 seconds or so, faster once awake; a pause at the end of each,
    // with the answer lit.
    w.phase += Math.min(delta, 0.05) * (0.35 + 0.45 * mindLevel())
    if (w.phase >= 1) {
      w.phase -= 1
      w.shown = (w.shown + 1) % 4
    }
    const front = w.phase * (stages + 1.5) // how far the wave has come, in stages
    if (picture.current) picture.current.map = net.icons[w.shown]
    // The signals: on the stronger connections for this picture, and into the right answer.
    const mesh = signalMesh.current
    if (mesh) {
      net.links.forEach((link, k) => {
        const u = front - link.stage
        const passes = link.answer === undefined ? link.weight[w.shown] > 0.55 : link.answer === w.shown
        const visible = passes && u > 0 && u < 1
        o.position.lerpVectors(link.from, link.to, Math.min(Math.max(u, 0), 1))
        o.scale.setScalar(visible ? 1 : 0)
        o.updateMatrix()
        mesh.setMatrixAt(k, o.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    // The neurons light up as the wave reaches their column.
    const nm = nodeMesh.current
    if (nm) {
      let i = 0
      net.columns.forEach((column, l) => {
        const glow = Math.max(0, 1 - Math.abs(front - (l + 1)) * 1.4)
        for (const p of column) {
          o.position.copy(p)
          o.scale.setScalar(1 + glow * 0.8)
          o.updateMatrix()
          nm.setMatrixAt(i++, o.matrix)
        }
      })
      nm.instanceMatrix.needsUpdate = true
    }
    // The answer: the matching tile lights up once the wave arrives, the others stay dim.
    const done = smooth(stages, stages + 0.5, front)
    answers.current.forEach((material, a) => {
      if (material) material.color.setScalar(a === w.shown ? 0.55 + done * 1.6 : 0.4)
    })
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial color="#05070a" roughness={0.25} metalness={0.4} />
      </mesh>
      {[2, 5, 9, 14].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[r, r + 0.03, 96]} />
          <meshBasicMaterial color="#1f6f80" transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
      <lineSegments geometry={net.geometry}>
        <lineBasicMaterial color="#3fd0e0" transparent opacity={0.22} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>
      <instancedMesh ref={nodeMesh} args={[undefined, undefined, net.nodes.length]} frustumCulled={false}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshBasicMaterial color={new Color('#8fe8ff').multiplyScalar(1.15)} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={signalMesh} args={[undefined, undefined, net.links.length]} frustumCulled={false}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshBasicMaterial color={new Color('#ffffff').multiplyScalar(2)} toneMapped={false} />
      </instancedMesh>
      {/* The picture coming in, on the left. */}
      <mesh position={[INPUT_X, MIND_Y, MIND_Z]}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshBasicMaterial ref={picture} map={net.icons[0]} transparent toneMapped={false} />
      </mesh>
      {/* The four answers, on the right. */}
      {OUTPUT_Y.map((y, a) => (
        <mesh key={a} position={[OUTPUT_X, y, MIND_Z]}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshBasicMaterial ref={(m) => void (answers.current[a] = m)} map={net.icons[a]} transparent toneMapped={false} />
        </mesh>
      ))}
      {/* The person, small before it, on a disc of light. */}
      <Figure era={2} at={[0, 0, 5]} turn={Math.PI} action="stand" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 5]}>
        <circleGeometry args={[0.9, 48]} />
        <meshBasicMaterial color="#3fd0e0" transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function ActConnected() {
  return (
    <>
      <Scene shots={['cobots']}>
        <SmartFactory />
      </Scene>
      <Scene shots={['printer']}>
        <PrintAndTwin />
      </Scene>
      <Scene shots={['mind', 'echo4']}>
        <MindNetwork />
      </Scene>
    </>
  )
}

