import { Suspense, useMemo, useRef, type JSX, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { AdditiveBlending, Box3, MeshBasicMaterial, MeshStandardMaterial, Quaternion, Vector3, type Group, type Mesh } from 'three'
import MergeStatic from './MergeStatic'

// THE 19 INVENTION PROTOTYPES on the plinths of the era rooms (one per text id in
// src/content/exhibits.ts). Five are free low-poly models from Poly Pizza (credited in
// src/content/credits.ts); the others are built here from simple shapes, because no free
// model of those machines could be downloaded without an account. Each stands on the
// plinth's top (y = 0 here), fits inside about 1 m of its centre and is at most about
// 1.9 m tall, so it stays inside the plinth's spotlight while the exhibit turns.

// ---------- Shared materials (one copy each, shared by every prototype) ----------

const std = (color: string, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
const glow = (color: string, intensity: number) =>
  // Brighter than white, so the bloom effect makes it glow.
  new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, toneMapped: false })

const M = {
  oak: std('#8a5a32', 0.7),
  darkWood: std('#5a3a22', 0.7),
  iron: std('#3d3a37', 0.55, 0.6),
  brass: std('#b5863f', 0.35, 0.85),
  copper: std('#b8683a', 0.35, 0.8),
  steel: std('#9aa3ad', 0.35, 0.8),
  thread: std('#f2ead8', 0.9),
  stone: std('#8d867b', 0.85),
  ceramic: std('#e4e0d6', 0.45),
  gold: std('#d8b25a', 0.3, 0.9),
  cabinet: std('#8c9089', 0.6, 0.3),
  beige: std('#d9cfb5', 0.6),
  navy: std('#3e5a7a', 0.5, 0.4),
  white: std('#eceef1', 0.35, 0.1),
  black: std('#1e2024', 0.5, 0.3),
  blue: std('#2f6fb3', 0.4, 0.2),
  water: new MeshStandardMaterial({ color: '#5a9ec9', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.6 }),
  ledGreen: glow('#5dff7a', 2.5),
  ledRed: glow('#ff5a4a', 2.5),
  ledAmber: glow('#ffb347', 2.5),
  ledWhite: glow('#fff2c8', 2.5),
  cyan: glow('#5fe3ff', 2.2),
}
// Holograms (CMCN 4): see-through light that adds to what is behind it.
const holo = (opacity: number) =>
  new MeshBasicMaterial({ color: '#5fe3ff', transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, toneMapped: false })
const HOLO_FILL = holo(0.12)
const HOLO_WIRE = new MeshBasicMaterial({ color: '#7febff', wireframe: true, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false })

// ---------- Small building blocks ----------

type V3 = [number, number, number]

function Box({ size, at, material, rotation }: { size: V3; at: V3; material: MeshStandardMaterial | MeshBasicMaterial; rotation?: V3 }) {
  return (
    <mesh position={at} rotation={rotation} material={material}>
      <boxGeometry args={size} />
    </mesh>
  )
}

// A cylinder along X, Y or Z.
function Rod({ r, length, at, axis = 'y', material, r2, sides = 16 }: { r: number; length: number; at: V3; axis?: 'x' | 'y' | 'z'; material: MeshStandardMaterial | MeshBasicMaterial; r2?: number; sides?: number }) {
  const rotation: V3 = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]
  return (
    <mesh position={at} rotation={rotation} material={material}>
      <cylinderGeometry args={[r2 ?? r, r, length, sides]} />
    </mesh>
  )
}

// A spoked wheel in the XY plane (its axle along Z), centred on the group's origin.
function Wheel({ radius, tube, spokes, material }: { radius: number; tube: number; spokes: number; material: MeshStandardMaterial }) {
  return (
    <group>
      <mesh material={material}>
        <torusGeometry args={[radius, tube, 8, 36]} />
      </mesh>
      {Array.from({ length: spokes }, (_, i) => (
        <mesh key={i} rotation={[0, 0, (i / spokes) * Math.PI]} material={material}>
          <boxGeometry args={[radius * 2, tube * 0.8, tube * 0.8]} />
        </mesh>
      ))}
      <Rod r={tube * 1.8} length={tube * 3} at={[0, 0, 0]} axis="z" material={material} />
    </group>
  )
}

// A part that keeps turning (wheels, rotors). keepSeparate: not joined by MergeStatic.
function Spin({ speed, axis, at, children }: { speed: number; axis: 'x' | 'y' | 'z'; at: V3; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation[axis] += delta * speed
  })
  return (
    <group ref={ref} position={at} userData={{ keepSeparate: true }}>
      {children}
    </group>
  )
}

// ---------- Downloaded models ----------

// Prepares a downloaded model's parts once: they cast shadows, and every part keeps only
// the data the museum uses (position, normal, and colour where the material reads it).
// These models have no textures, but some parts carry texture coordinates and others do
// not, which would stop MergeStatic from joining them.
function prepareModel(scene: Group) {
  scene.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = true
    const keepColour = !Array.isArray(mesh.material) && mesh.material.vertexColors
    for (const name of Object.keys(mesh.geometry.attributes)) {
      if (name !== 'position' && name !== 'normal' && !(name === 'color' && keepColour)) mesh.geometry.deleteAttribute(name)
    }
    if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals()
  })
}

// Loads a .glb model, scales it so its largest side is `size` metres, and stands it on y = 0,
// centred. Its meshes are then joined by look (MergeStatic), to keep the drawing work low.
function GltfModel({ url, size, yaw = 0, lift = 0 }: { url: string; size: number; yaw?: number; lift?: number }) {
  const { scene } = useGLTF(url)
  const fit = useMemo(() => {
    prepareModel(scene)
    scene.rotation.y = yaw
    scene.updateMatrixWorld(true)
    const box = new Box3().setFromObject(scene)
    const extent = box.getSize(new Vector3())
    const scale = size / Math.max(extent.x, extent.y, extent.z)
    const centre = box.getCenter(new Vector3())
    return { scale, offset: [-centre.x * scale, -box.min.y * scale + lift, -centre.z * scale] as V3 }
  }, [scene, size, yaw, lift])
  return (
    // keepSeparate: already joined here, so the prototype's own MergeStatic leaves it alone.
    <group position={fit.offset} scale={fit.scale} userData={{ keepSeparate: true }}>
      <MergeStatic>
        <primitive object={scene} />
      </MergeStatic>
    </group>
  )
}

const MODEL = {
  locomotive: '/models/ir1/steam-locomotive.glb',
  bulb: '/models/ir2/light-bulb.glb',
  modelT: '/models/ir2/ford-model-t.glb',
  pc: '/models/ir3/personal-computer.glb',
  printer: '/models/ir4/3d-printer.glb',
}

// ---------- CMCN 1 ----------

// Watt's beam engine: the cylinder, the separate condenser beside it (his key improvement),
// the rocking beam on its pillar and the flywheel.
function WattEngine() {
  return (
    <group>
      <Box size={[1.7, 0.14, 0.9]} at={[0, 0.07, 0]} material={M.stone} />
      {/* Cylinder and, beside it, the separate condenser. */}
      <Rod r={0.22} length={0.85} at={[-0.55, 0.57, 0]} material={M.iron} sides={20} />
      <Rod r={0.25} length={0.06} at={[-0.55, 1.0, 0]} material={M.brass} sides={20} />
      <Rod r={0.12} length={0.45} at={[-0.55, 0.37, 0.36]} material={M.copper} />
      <Rod r={0.03} length={0.3} at={[-0.55, 0.62, 0.22]} axis="z" material={M.copper} />
      {/* Piston rod up to the beam. */}
      <Rod r={0.025} length={0.45} at={[-0.62, 1.25, 0]} material={M.steel} />
      {/* Pillar and rocking beam. */}
      <Box size={[0.14, 1.3, 0.14]} at={[0, 0.79, -0.18]} material={M.darkWood} />
      <Box size={[0.14, 1.3, 0.14]} at={[0, 0.79, 0.18]} material={M.darkWood} />
      <Box size={[1.5, 0.1, 0.1]} at={[0, 1.48, 0]} material={M.iron} />
      <Rod r={0.05} length={0.5} at={[0, 1.48, 0]} axis="z" material={M.brass} />
      {/* Connecting rod down to the flywheel. */}
      <Rod r={0.025} length={0.8} at={[0.65, 1.06, 0]} material={M.steel} />
      <Spin speed={1.2} axis="z" at={[0.62, 0.62, 0.3]}>
        <Wheel radius={0.46} tube={0.05} spokes={4} material={M.iron} />
      </Spin>
      {/* Centrifugal governor: two brass balls on a spindle. */}
      <Rod r={0.02} length={0.4} at={[0.3, 0.34, -0.3]} material={M.brass} />
      <Spin speed={2.5} axis="y" at={[0.3, 0.5, -0.3]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.12, 0, 0]} material={M.brass}>
            <sphereGeometry args={[0.05, 12, 8]} />
          </mesh>
        ))}
      </Spin>
    </group>
  )
}

// Spinning Jenny: a wooden frame with a row of spindles at the back, turned by the big
// hand wheel at the side, and the sliding bar (the carriage) that draws the threads.
function SpinningJenny() {
  const spindleX = Array.from({ length: 8 }, (_, i) => -0.55 + i * 0.13)
  return (
    <group>
      {[-0.7, 0.55].flatMap((x) =>
        [-0.3, 0.3].map((z) => <Box key={`${x}${z}`} size={[0.07, 0.75, 0.07]} at={[x, 0.375, z]} material={M.oak} />),
      )}
      <Box size={[1.4, 0.06, 0.66]} at={[-0.08, 0.75, 0]} material={M.oak} />
      <Box size={[1.4, 0.05, 0.05]} at={[-0.08, 0.3, -0.3]} material={M.oak} />
      {/* Spindles with their cones of thread. */}
      {spindleX.map((x) => (
        <group key={x} position={[x, 0.78, -0.22]}>
          <Rod r={0.012} length={0.4} at={[0, 0.2, 0]} material={M.iron} />
          <Rod r={0.035} r2={0.015} length={0.18} at={[0, 0.15, 0]} material={M.thread} />
        </group>
      ))}
      {/* The carriage (a sliding bar) and the threads running to it. */}
      <Box size={[1.2, 0.05, 0.06]} at={[-0.1, 1.0, 0.25]} material={M.darkWood} />
      {spindleX.map((x) => (
        <mesh key={x} position={[x, 1.08, 0.015]} rotation={[Math.atan2(0.47, 0.16), 0, 0]} material={M.thread}>
          <cylinderGeometry args={[0.004, 0.004, 0.5, 4]} />
        </mesh>
      ))}
      {/* Hand wheel at the side. */}
      <Box size={[0.06, 0.5, 0.06]} at={[0.68, 1.0, 0]} material={M.oak} />
      <Spin speed={1.5} axis="x" at={[0.75, 1.15, 0]}>
        <group rotation={[0, Math.PI / 2, 0]}>
          <Wheel radius={0.38} tube={0.03} spokes={3} material={M.oak} />
        </group>
      </Spin>
    </group>
  )
}

// Water Frame: a tall wooden frame with rows of rollers and bobbins, driven through a
// shaft by a water wheel at the side.
function WaterFrame() {
  return (
    <group>
      {[-0.45, 0.45].flatMap((x) =>
        [-0.28, 0.28].map((z) => <Box key={`${x}${z}`} size={[0.08, 1.45, 0.08]} at={[x, 0.725, z]} material={M.oak} />),
      )}
      {[0.35, 0.85, 1.4].map((y) => (
        <Box key={y} size={[0.98, 0.06, 0.62]} at={[0, y, 0]} material={M.oak} />
      ))}
      {/* Rollers (pairs, front and back) and bobbins on both levels. */}
      {[0.95, 1.5].map((y) =>
        [-0.32, 0.32].map((z) => <Rod key={`${y}${z}`} r={0.03} length={0.9} at={[0, y + 0.03, z]} axis="x" material={M.steel} />),
      )}
      {[0.38, 0.88].flatMap((y) =>
        [-0.3, -0.1, 0.1, 0.3].map((x) => (
          <group key={`${x}${y}`} position={[x, y + 0.03, 0]}>
            <Rod r={0.012} length={0.32} at={[0, 0.16, 0]} material={M.iron} />
            <Rod r={0.045} length={0.16} at={[0, 0.14, 0]} material={M.thread} />
          </group>
        )),
      )}
      {/* Drive shaft out to the water wheel, and the water running onto it. */}
      <Rod r={0.03} length={0.5} at={[-0.7, 0.55, 0]} axis="x" material={M.iron} />
      <Spin speed={0.8} axis="x" at={[-0.85, 0.55, 0]}>
        <group rotation={[0, Math.PI / 2, 0]}>
          <Wheel radius={0.48} tube={0.035} spokes={4} material={M.darkWood} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2
            return <Box key={i} size={[0.14, 0.04, 0.16]} at={[Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0]} rotation={[0, 0, a]} material={M.darkWood} />
          })}
        </group>
      </Spin>
      <Box size={[0.18, 0.04, 0.5]} at={[-0.85, 1.08, 0.18]} rotation={[0.25, 0, 0]} material={M.water} />
    </group>
  )
}

// ---------- CMCN 2 ----------

// Tesla's AC induction motor: a ring of copper coils (the stator) around a turning rotor,
// with the shaft resting on two bearing stands.
function InductionMotor() {
  return (
    <group>
      <Box size={[1.4, 0.1, 0.7]} at={[0, 0.05, 0]} material={M.iron} />
      <group position={[0, 0.7, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh material={M.iron}>
          <torusGeometry args={[0.5, 0.09, 10, 40]} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return <Box key={i} size={[0.16, 0.12, 0.28]} at={[Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0]} rotation={[0, 0, a]} material={M.copper} />
        })}
      </group>
      {/* Feet under the ring. */}
      <Box size={[0.2, 0.2, 0.7]} at={[0, 0.2, 0]} material={M.iron} />
      <Spin speed={3} axis="x" at={[0, 0.7, 0]}>
        <Rod r={0.22} length={0.26} at={[0, 0, 0]} axis="x" material={M.steel} sides={20} />
        <Rod r={0.035} length={1.3} at={[0, 0, 0]} axis="x" material={M.steel} />
        <Rod r={0.14} length={0.08} at={[0.6, 0, 0]} axis="x" material={M.brass} sides={20} />
      </Spin>
      {[-0.45, 0.45].map((x) => (
        <Box key={x} size={[0.08, 0.62, 0.16]} at={[x, 0.38, 0]} material={M.iron} />
      ))}
    </group>
  )
}

// The assembly line: a Ford Model T on a short stretch of moving line.
function AssemblyLine() {
  return (
    <group>
      <Box size={[1.7, 0.16, 0.8]} at={[0, 0.08, 0]} material={M.iron} />
      {Array.from({ length: 9 }, (_, i) => (
        <Rod key={i} r={0.04} length={0.82} at={[-0.76 + i * 0.19, 0.17, 0]} axis="z" material={M.steel} />
      ))}
      <Suspense fallback={null}>
        <GltfModel url={MODEL.modelT} size={1.5} lift={0.21} />
      </Suspense>
    </group>
  )
}

// A wall telephone of the 1880s-1890s on a wooden post: two bells, the crank, a
// mouthpiece and the earpiece on its hook. (Not Bell's own 1876 instrument.)
function Telephone() {
  return (
    // (Shown a little larger than life, so it does not look lost on the plinth.)
    <group scale={1.2}>
      <Rod r={0.3} length={0.06} at={[0, 0.03, 0]} material={M.darkWood} sides={24} />
      <Box size={[0.1, 0.8, 0.1]} at={[0, 0.45, -0.05]} material={M.darkWood} />
      <Box size={[0.5, 0.9, 0.04]} at={[0, 1.2, -0.05]} material={M.darkWood} />
      {/* Top box with the bells. */}
      <Box size={[0.4, 0.3, 0.2]} at={[0, 1.45, 0.07]} material={M.oak} />
      {[-0.09, 0.09].map((x) => (
        <mesh key={x} position={[x, 1.45, 0.18]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}>
          <sphereGeometry args={[0.07, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
      {/* Writing shelf and the mouthpiece arm. */}
      <Box size={[0.4, 0.04, 0.2]} at={[0, 1.0, 0.07]} material={M.oak} />
      <Box size={[0.32, 0.22, 0.14]} at={[0, 1.15, 0.04]} material={M.oak} />
      <Rod r={0.02} length={0.16} at={[0, 1.2, 0.18]} axis="z" material={M.black} />
      <Rod r={0.045} r2={0.02} length={0.08} at={[0, 1.2, 0.29]} axis="z" material={M.black} />
      {/* Crank on the right side. */}
      <Rod r={0.015} length={0.12} at={[0.26, 1.45, 0.07]} axis="x" material={M.steel} />
      <Box size={[0.02, 0.12, 0.02]} at={[0.32, 1.4, 0.07]} material={M.steel} />
      {/* Earpiece on its hook at the left, with its cord. */}
      <Rod r={0.03} length={0.2} at={[-0.27, 1.32, 0.08]} material={M.black} />
      <Rod r={0.045} r2={0.03} length={0.05} at={[-0.27, 1.44, 0.08]} material={M.black} />
      <mesh position={[-0.2, 1.16, 0.06]} rotation={[0, 0, -0.4]} material={M.black}>
        <torusGeometry args={[0.08, 0.006, 4, 16, Math.PI]} />
      </mesh>
    </group>
  )
}

// ---------- CMCN 3 ----------

// The Intel 4004: a 16-pin chip, enlarged many times and tilted towards the visitor.
function Intel4004() {
  return (
    <group>
      <Box size={[0.5, 0.5, 0.3]} at={[0, 0.25, 0]} material={M.black} />
      <group position={[0, 0.85, 0]} rotation={[0.5, 0, 0]}>
        <Box size={[1.3, 0.14, 0.6]} at={[0, 0, 0]} material={M.ceramic} />
        <Box size={[0.36, 0.02, 0.3]} at={[0, 0.075, 0]} material={M.gold} />
        <Box size={[0.24, 0.025, 0.2]} at={[0, 0.08, 0]} material={M.black} />
        {/* The 16 legs, eight on each side. */}
        {[-1, 1].flatMap((side) =>
          Array.from({ length: 8 }, (_, i) => (
            <group key={`${side}${i}`} position={[-0.53 + i * 0.152, 0, side * 0.33]}>
              <Box size={[0.07, 0.03, 0.08]} at={[0, 0, 0]} material={M.gold} />
              <Box size={[0.07, 0.2, 0.03]} at={[0, -0.1, side * 0.03]} material={M.gold} />
            </group>
          )),
        )}
      </group>
    </group>
  )
}

// The IBM 5150 (a low-poly beige PC of that era) on a small desk.
function PersonalComputer() {
  return (
    <group>
      <Box size={[1.2, 0.06, 0.8]} at={[0, 0.66, 0]} material={M.darkWood} />
      {[-0.55, 0.55].flatMap((x) =>
        [-0.35, 0.35].map((z) => <Box key={`${x}${z}`} size={[0.05, 0.63, 0.05]} at={[x, 0.315, z]} material={M.iron} />),
      )}
      <Suspense fallback={null}>
        <GltfModel url={MODEL.pc} size={0.95} lift={0.69} yaw={Math.PI} />
      </Suspense>
    </group>
  )
}

// Unimate: a heavy base and turret with a long arm that reaches out and grips.
function Unimate() {
  const arm = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (arm.current) arm.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.5
  })
  return (
    <group>
      <Box size={[0.8, 0.55, 0.7]} at={[-0.15, 0.275, 0]} material={M.navy} />
      <Box size={[0.3, 0.2, 0.5]} at={[0.35, 0.1, 0]} material={M.navy} />
      <group ref={arm} position={[-0.15, 0.55, 0]} userData={{ keepSeparate: true }}>
        <Rod r={0.3} length={0.22} at={[0, 0.11, 0]} material={M.cabinet} sides={20} />
        <group position={[0, 0.45, 0]} rotation={[0, 0, -0.2]}>
          <Box size={[0.5, 0.36, 0.42]} at={[0, 0, 0]} material={M.navy} />
          {/* The boom and the thinner arm sliding out of it. */}
          <Box size={[0.6, 0.18, 0.18]} at={[0.52, 0, 0]} material={M.cabinet} />
          <Box size={[0.3, 0.11, 0.11]} at={[0.95, 0, 0]} material={M.steel} />
          <Box size={[0.1, 0.16, 0.16]} at={[1.12, 0, 0]} material={M.iron} />
          {[-1, 1].map((s) => (
            <Box key={s} size={[0.14, 0.03, 0.04]} at={[1.22, s * 0.06, 0]} material={M.steel} />
          ))}
        </group>
      </group>
    </group>
  )
}

// ARPANET: a minicomputer cabinet like the network's first routers (the IMPs), with its
// panel of lights, and above it the first four linked sites as glowing points.
function Arpanet() {
  const lights = useMemo(() => {
    const out: { at: V3; material: MeshStandardMaterial }[] = []
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        const pick = (row * 5 + col * 3) % 7
        out.push({ at: [-0.21 + col * 0.06, 0.75 + row * 0.07, 0.31], material: pick < 2 ? M.ledRed : pick < 5 ? M.ledAmber : M.ledWhite })
      }
    }
    return out
  }, [])
  const sites: V3[] = [
    [-0.4, 1.45, 0.2],
    [0.35, 1.55, 0.25],
    [-0.25, 1.7, -0.3],
    [0.4, 1.4, -0.25],
  ]
  return (
    <group>
      <Box size={[0.66, 1.15, 0.6]} at={[0, 0.575, 0]} material={M.cabinet} />
      <Box size={[0.56, 0.4, 0.02]} at={[0, 0.85, 0.3]} material={M.black} />
      {lights.map((light, i) => (
        <Box key={i} size={[0.025, 0.025, 0.01]} at={light.at} material={light.material} />
      ))}
      <Box size={[0.56, 0.4, 0.02]} at={[0, 0.35, 0.3]} material={M.beige} />
      {/* The four sites and their links (lines between them), joined to the cabinet. */}
      {sites.map((site, i) => (
        <mesh key={i} position={site} material={M.ledAmber}>
          <sphereGeometry args={[0.05, 12, 8]} />
        </mesh>
      ))}
      {[
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
        [1, 2],
      ].map(([a, b]) => (
        <Link key={`${a}${b}`} from={sites[a]} to={sites[b]} material={M.ledAmber} />
      ))}
      <Link from={[0, 1.15, 0]} to={sites[0]} material={M.ledAmber} />
    </group>
  )
}

// A thin straight line (a cylinder) between two points.
function Link({ from, to, material, r = 0.008 }: { from: V3; to: V3; material: MeshStandardMaterial | MeshBasicMaterial; r?: number }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new Vector3(...from)
    const b = new Vector3(...to)
    const direction = b.clone().sub(a)
    // Turn the cylinder (which stands along Y) to point from `from` to `to`.
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize())
    return { position: a.add(b).multiplyScalar(0.5), quaternion, length: direction.length() }
  }, [from, to])
  return (
    <mesh position={position} quaternion={quaternion} material={material}>
      <cylinderGeometry args={[r, r, length, 4]} />
    </mesh>
  )
}

// A PLC: an open control cabinet with the controller and its modules on a rail, their
// status lights, and the wiring below.
function Plc() {
  return (
    <group>
      <Box size={[0.3, 0.45, 0.3]} at={[0, 0.225, -0.1]} material={M.iron} />
      <group position={[0, 0.45, -0.1]}>
        {/* Cabinet back and sides; the door stands open. */}
        <Box size={[0.9, 1.2, 0.04]} at={[0, 0.6, -0.15]} material={M.cabinet} />
        <Box size={[0.04, 1.2, 0.34]} at={[-0.45, 0.6, 0]} material={M.cabinet} />
        <Box size={[0.04, 1.2, 0.34]} at={[0.45, 0.6, 0]} material={M.cabinet} />
        <Box size={[0.94, 0.04, 0.34]} at={[0, 1.2, 0]} material={M.cabinet} />
        <Box size={[0.94, 0.04, 0.34]} at={[0, 0, 0]} material={M.cabinet} />
        <group position={[0.47, 0, 0.17]} rotation={[0, 1.9, 0]}>
          <Box size={[0.9, 1.2, 0.03]} at={[-0.45, 0.6, 0]} material={M.cabinet} />
        </group>
        {/* DIN rail with the controller (CPU) and six modules, each with lights. */}
        <Box size={[0.8, 0.03, 0.02]} at={[0, 0.85, -0.12]} material={M.steel} />
        <Box size={[0.2, 0.26, 0.14]} at={[-0.28, 0.85, -0.06]} material={M.blue} />
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i} position={[-0.1 + i * 0.075, 0.85, -0.06]}>
            <Box size={[0.065, 0.26, 0.14]} at={[0, 0, 0]} material={M.black} />
            {[0.08, 0.04, 0].map((y, j) => (
              <Box key={y} size={[0.02, 0.015, 0.01]} at={[0, y, 0.071]} material={(i + j) % 3 === 0 ? M.ledAmber : M.ledGreen} />
            ))}
          </group>
        ))}
        <Box size={[0.2, 0.04, 0.01]} at={[-0.28, 0.93, 0.011]} material={M.ledGreen} />
        {/* Terminal row and wires. */}
        <Box size={[0.8, 0.08, 0.06]} at={[0, 0.45, -0.1]} material={M.ceramic} />
        {Array.from({ length: 10 }, (_, i) => (
          <Box key={i} size={[0.012, 0.3, 0.012]} at={[-0.36 + i * 0.08, 0.62, -0.08]} material={i % 2 ? M.blue : M.ledRed} />
        ))}
      </group>
    </group>
  )
}

// ---------- CMCN 4 ----------

// AI quality inspection: products ride a conveyor under a camera, which scans each one
// with a beam of light. One product in four is faulty (red mark) and gets flagged.
function AiInspection() {
  const items = useRef<Group>(null)
  useFrame((_, delta) => {
    const group = items.current
    if (!group) return
    for (const item of group.children) {
      item.position.x += delta * 0.18
      if (item.position.x > 0.7) item.position.x -= 1.4
    }
  })
  return (
    <group>
      {[-0.6, 0.6].map((x) => (
        <Box key={x} size={[0.06, 0.55, 0.45]} at={[x, 0.275, 0]} material={M.steel} />
      ))}
      <Box size={[1.5, 0.08, 0.5]} at={[0, 0.59, 0]} material={M.black} />
      <group ref={items} position={[0, 0.66, 0]} userData={{ keepSeparate: true }}>
        {[-0.7, -0.35, 0, 0.35].map((x, i) => (
          <group key={x} position={[x, 0, 0]}>
            <Rod r={0.1} length={0.06} at={[0, 0, 0]} material={M.steel} sides={12} />
            {i === 1 && <Box size={[0.08, 0.01, 0.02]} at={[0, 0.035, 0]} material={M.ledRed} />}
          </group>
        ))}
      </group>
      {/* The arch with the camera, and its scanning beam. */}
      {[-0.27, 0.27].map((z) => (
        <Box key={z} size={[0.05, 0.75, 0.05]} at={[0, 0.98, z]} material={M.white} />
      ))}
      <Box size={[0.08, 0.06, 0.6]} at={[0, 1.36, 0]} material={M.white} />
      <Box size={[0.16, 0.12, 0.14]} at={[0, 1.27, 0]} material={M.black} />
      <Rod r={0.035} length={0.02} at={[0, 1.2, 0]} material={M.cyan} />
      <mesh position={[0, 0.94, 0]} material={HOLO_FILL}>
        <coneGeometry args={[0.18, 0.5, 20, 1, true]} />
      </mesh>
      {/* A screen beside it with its verdict lights. */}
      <Box size={[0.03, 0.5, 0.03]} at={[0.45, 0.88, -0.22]} material={M.steel} />
      <Box size={[0.3, 0.2, 0.02]} at={[0.45, 1.2, -0.22]} rotation={[0, -0.5, 0]} material={M.black} />
      <Box size={[0.24, 0.05, 0.01]} at={[0.455, 1.24, -0.207]} rotation={[0, -0.5, 0]} material={M.ledGreen} />
      <Box size={[0.24, 0.05, 0.01]} at={[0.455, 1.16, -0.207]} rotation={[0, -0.5, 0]} material={M.ledRed} />
    </group>
  )
}

// IIoT: a machine with sensors, each sending a stream of data (moving points of light) up
// to a glowing hub that collects it.
function Iiot() {
  const sensors: V3[] = [
    [-0.35, 0.86, 0.2],
    [0.35, 0.86, 0.2],
    [0, 0.86, -0.25],
  ]
  const hub: V3 = [0, 1.6, 0]
  const packets = useRef<Group>(null)
  useFrame(({ clock }) => {
    const group = packets.current
    if (!group) return
    group.children.forEach((packet, i) => {
      const sensor = sensors[i % 3]
      const t = (clock.elapsedTime * 0.45 + i * 0.37) % 1
      packet.position.set(sensor[0] + (hub[0] - sensor[0]) * t, sensor[1] + (hub[1] - sensor[1]) * t, sensor[2] + (hub[2] - sensor[2]) * t)
    })
  })
  return (
    <group>
      <Box size={[1.0, 0.75, 0.7]} at={[0, 0.375, 0]} material={M.white} />
      <Box size={[0.4, 0.25, 0.02]} at={[0, 0.45, 0.36]} material={M.black} />
      <Box size={[0.3, 0.04, 0.01]} at={[0, 0.5, 0.371]} material={M.cyan} />
      <Rod r={0.25} length={0.1} at={[0, 0.8, 0]} material={M.steel} sides={20} />
      {sensors.map((at, i) => (
        <group key={i}>
          <Rod r={0.03} length={0.1} at={[at[0], at[1] - 0.05, at[2]]} material={M.black} />
          <mesh position={at} material={M.cyan}>
            <sphereGeometry args={[0.03, 10, 8]} />
          </mesh>
          <Link from={at} to={hub} material={HOLO_FILL} r={0.006} />
        </group>
      ))}
      <mesh position={hub} rotation={[Math.PI / 2, 0, 0]} material={M.cyan}>
        <torusGeometry args={[0.16, 0.015, 8, 32]} />
      </mesh>
      <mesh position={hub} material={HOLO_FILL}>
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>
      <group ref={packets} userData={{ keepSeparate: true }}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} material={M.cyan}>
            <sphereGeometry args={[0.022, 8, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// 3D printing: a low-poly desktop 3D printer.
function Printer3d() {
  return (
    <group>
      <Box size={[0.9, 0.5, 0.8]} at={[0, 0.25, 0]} material={M.white} />
      <Suspense fallback={null}>
        <GltfModel url={MODEL.printer} size={1.0} lift={0.5} yaw={Math.PI} />
      </Suspense>
    </group>
  )
}

// A small turbine (housing, fan, stand), used twice by the digital twin.
function Turbine({ body, fan }: { body: MeshStandardMaterial | MeshBasicMaterial; fan: MeshStandardMaterial | MeshBasicMaterial }) {
  return (
    <group>
      <Box size={[0.12, 0.45, 0.3]} at={[0, 0.225, 0]} material={body} />
      <Rod r={0.26} length={0.4} at={[0, 0.7, 0]} axis="x" material={body} sides={20} />
      <Rod r={0.1} r2={0.04} length={0.18} at={[-0.29, 0.7, 0]} axis="x" material={body} />
      <Spin speed={2} axis="x" at={[0.22, 0.7, 0]}>
        {Array.from({ length: 5 }, (_, i) => (
          <Box key={i} size={[0.02, 0.4, 0.08]} at={[0, 0, 0]} rotation={[(i / 5) * Math.PI, 0.4, 0]} material={fan} />
        ))}
      </Spin>
    </group>
  )
}

// The digital twin: a real machine and, floating beside it, its glowing digital copy that
// turns in step with it.
function DigitalTwin() {
  return (
    <group>
      <group position={[-0.42, 0, 0]}>
        <Turbine body={M.steel} fan={M.iron} />
      </group>
      <group position={[0.45, 0.45, 0]}>
        <Turbine body={HOLO_WIRE} fan={HOLO_WIRE} />
      </group>
      <Rod r={0.25} length={0.02} at={[0.45, 0.4, 0]} material={HOLO_FILL} sides={24} />
      <Link from={[-0.2, 0.7, 0]} to={[0.23, 1.15, 0]} material={HOLO_FILL} r={0.006} />
    </group>
  )
}

// A cobot: a slim white arm with round blue joints, moving slowly back and forth between
// picking and placing.
function Cobot() {
  const base = useRef<Group>(null)
  const shoulder = useRef<Group>(null)
  const elbow = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.6
    if (base.current) base.current.rotation.y = Math.sin(t) * 0.9
    if (shoulder.current) shoulder.current.rotation.z = -0.5 + Math.sin(t * 2) * 0.15
    if (elbow.current) elbow.current.rotation.z = 1.4 + Math.sin(t * 2 + 1) * 0.2
  })
  const joint = (at: V3) => <Rod r={0.08} length={0.16} at={at} axis="z" material={M.blue} sides={20} />
  return (
    <group>
      <Rod r={0.17} length={0.12} at={[0, 0.06, 0]} material={M.white} sides={24} />
      <group ref={base} position={[0, 0.12, 0]} userData={{ keepSeparate: true }}>
        <Rod r={0.1} length={0.25} at={[0, 0.125, 0]} material={M.white} sides={20} />
        <group ref={shoulder} position={[0, 0.3, 0]}>
          {joint([0, 0, 0])}
          <Rod r={0.06} length={0.6} at={[0, 0.3, 0]} material={M.white} />
          <group ref={elbow} position={[0, 0.6, 0]}>
            {joint([0, 0, 0])}
            <Rod r={0.05} length={0.5} at={[0, 0.25, 0]} material={M.white} />
            <group position={[0, 0.5, 0]}>
              {joint([0, 0, 0])}
              <Rod r={0.04} length={0.12} at={[0, 0.08, 0]} material={M.white} />
              {[-1, 1].map((s) => (
                <Box key={s} size={[0.02, 0.08, 0.03]} at={[s * 0.035, 0.17, 0]} material={M.black} />
              ))}
            </group>
          </group>
        </group>
      </group>
      {/* The part it is handling, on a small stand. */}
      <Box size={[0.25, 0.4, 0.25]} at={[0.6, 0.2, 0.3]} material={M.black} />
      <Box size={[0.12, 0.08, 0.12]} at={[0.6, 0.44, 0.3]} material={M.ledAmber} />
    </group>
  )
}

// Predictive maintenance: a motor and pump with a vibration sensor; above it a hologram
// chart whose line starts to climb, and a warning light asking for a check.
function PredictiveMaintenance() {
  const warning = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (warning.current) warning.current.visible = Math.sin(clock.elapsedTime * 4) > 0
  })
  const chart: V3[] = [0, 0.02, 0.01, 0.03, 0.02, 0.05, 0.04, 0.09, 0.14, 0.22].map((y, i) => [-0.35 + i * 0.078, 1.3 + y, 0])
  return (
    <group>
      <Box size={[1.3, 0.12, 0.5]} at={[0, 0.06, 0]} material={M.navy} />
      <Rod r={0.2} length={0.55} at={[-0.25, 0.36, 0]} axis="x" material={M.blue} sides={20} />
      {Array.from({ length: 6 }, (_, i) => (
        <Rod key={i} r={0.215} length={0.02} at={[-0.45 + i * 0.08, 0.36, 0]} axis="x" material={M.iron} sides={20} />
      ))}
      <Rod r={0.04} length={0.3} at={[0.15, 0.36, 0]} axis="x" material={M.steel} />
      <Rod r={0.18} length={0.3} at={[0.42, 0.36, 0]} axis="z" material={M.steel} sides={20} />
      <Rod r={0.06} length={0.3} at={[0.42, 0.65, 0]} material={M.steel} />
      {/* The sensor on top, with its link to the chart. */}
      <Rod r={0.035} length={0.08} at={[-0.25, 0.6, 0]} material={M.black} />
      <mesh position={[-0.25, 0.65, 0]} material={M.cyan}>
        <sphereGeometry args={[0.025, 10, 8]} />
      </mesh>
      <Link from={[-0.25, 0.65, 0]} to={[-0.25, 1.15, 0]} material={HOLO_FILL} r={0.006} />
      {/* Hologram chart. */}
      <Box size={[0.85, 0.5, 0.01]} at={[0, 1.42, 0]} material={HOLO_FILL} />
      <Box size={[0.8, 0.008, 0.01]} at={[0, 1.27, 0]} material={M.cyan} />
      {chart.slice(1).map((point, i) => (
        <Link key={i} from={chart[i]} to={point} material={M.cyan} r={0.01} />
      ))}
      <mesh ref={warning} position={[0.45, 0.85, 0]} material={M.ledAmber} userData={{ keepSeparate: true }}>
        <sphereGeometry args={[0.05, 12, 8]} />
      </mesh>
    </group>
  )
}

// The steam locomotive (a low-poly model of a steam engine; the real Rocket looked
// different, with a tall chimney and sloping cylinders).
function Locomotive() {
  return (
    <group>
      <Box size={[1.7, 0.08, 0.5]} at={[0, 0.04, 0]} material={M.darkWood} />
      {[-0.12, 0.12].map((z) => (
        <Box key={z} size={[1.7, 0.04, 0.04]} at={[0, 0.1, z]} material={M.steel} />
      ))}
      <Suspense fallback={null}>
        <GltfModel url={MODEL.locomotive} size={1.6} lift={0.12} yaw={Math.PI / 2} />
      </Suspense>
    </group>
  )
}

// The light bulb (a low-poly clear bulb with its filament) on a slim stand.
function LightBulb() {
  return (
    <group>
      <Rod r={0.18} length={0.06} at={[0, 0.03, 0]} material={M.brass} sides={20} />
      <Rod r={0.03} length={0.6} at={[0, 0.33, 0]} material={M.brass} />
      <Suspense fallback={null}>
        <GltfModel url={MODEL.bulb} size={0.9} lift={0.6} />
      </Suspense>
    </group>
  )
}

// ---------- Which prototype goes with which text ----------

const PROTOTYPES: Record<string, () => JSX.Element> = {
  'ir1-1': WattEngine,
  'ir1-2': SpinningJenny,
  'ir1-3': WaterFrame,
  'ir1-4': Locomotive,
  'ir2-1': LightBulb,
  'ir2-2': InductionMotor,
  'ir2-3': AssemblyLine,
  'ir2-4': Telephone,
  'ir3-1': Intel4004,
  'ir3-2': PersonalComputer,
  'ir3-3': Unimate,
  'ir3-4': Arpanet,
  'ir3-5': Plc,
  'ir4-1': AiInspection,
  'ir4-2': Iiot,
  'ir4-3': Printer3d,
  'ir4-4': DigitalTwin,
  'ir4-5': Cobot,
  'ir4-6': PredictiveMaintenance,
}

// Start downloading the models straight away (they are small), so they are ready by the
// time the visitor reaches their room.
Object.values(MODEL).forEach((url) => useGLTF.preload(url))

export default function Invention({ id }: { id: string }) {
  const Prototype = PROTOTYPES[id]
  if (!Prototype) return null
  return (
    <MergeStatic>
      <Prototype />
    </MergeStatic>
  )
}
