import { Suspense, createContext, useContext, useEffect, useMemo, useRef, type JSX, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { AdditiveBlending, type AnimationClip, Box3, BufferAttribute, MeshBasicMaterial, MeshStandardMaterial, Quaternion, Vector3, type Group, type Intersection, type Mesh, type Raycaster } from 'three'
import MergeStatic from './MergeStatic'

// THE 19 INVENTION PROTOTYPES on the plinths of the era rooms (one per text id in
// src/content/exhibits.ts). Ten are free models from Sketchfab (CC BY, credited in
// src/content/credits.ts), shrunk for the web; the other nine are built here from simple
// shapes, because no free model of those machines was found. Each stands on the
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
  brick: std('#7a3b2a', 0.85),
  molten: glow('#ff7a2a', 3.2),
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
// the data the museum uses: position, normal, colour where the material reads it, and
// texture coordinates where it has a picture. (Unused extra data on some parts and not on
// others would stop MergeStatic from joining parts that look the same.)
const rayBox = new Box3()
const rayHit = new Vector3()
function boxRaycast(this: Mesh, raycaster: Raycaster, intersects: Intersection[]) {
  if (!this.geometry.boundingBox) this.geometry.computeBoundingBox()
  rayBox.copy(this.geometry.boundingBox!).applyMatrix4(this.matrixWorld)
  if (!raycaster.ray.intersectBox(rayBox, rayHit)) return
  const distance = raycaster.ray.origin.distanceTo(rayHit)
  if (distance >= raycaster.near && distance <= raycaster.far) intersects.push({ distance, point: rayHit.clone(), object: this })
}

function prepareModel(scene: Group) {
  scene.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = true
    // Aiming (Interaction.tsx) tests what the crosshair points at every frame; testing
    // every one of a detailed model's thousands of triangles made the game stutter. Its
    // bounding box is precise enough to aim at.
    mesh.raycast = boxRaycast
    const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as MeshStandardMaterial
    const keepColour = material.vertexColors
    const keepUv = Boolean(material.map || material.normalMap || material.roughnessMap || material.metalnessMap || material.emissiveMap || material.aoMap)
    for (const name of Object.keys(mesh.geometry.attributes)) {
      const keep = name === 'position' || name === 'normal' || (name === 'color' && keepColour) || (name === 'uv' && keepUv)
      if (!keep) {
        mesh.geometry.deleteAttribute(name)
        continue
      }
      // The files store numbers compactly (small whole numbers, "quantised"). MergeStatic
      // moves parts by rewriting their numbers, which only works with ordinary decimals.
      const attribute = mesh.geometry.getAttribute(name) as BufferAttribute
      if (!(attribute.array instanceof Float32Array) || attribute.normalized) {
        const plain = new Float32Array(attribute.count * attribute.itemSize)
        for (let i = 0; i < attribute.count; i++)
          for (let c = 0; c < attribute.itemSize; c++) plain[i * attribute.itemSize + c] = attribute.getComponent(i, c)
        mesh.geometry.setAttribute(name, new BufferAttribute(plain, attribute.itemSize))
      }
    }
    // See-through "transmission" glass makes three.js draw the whole scene once more every
    // frame; plain see-through glass looks almost the same at a fraction of the cost.
    const glass = material as MeshStandardMaterial & { transmission?: number }
    if (glass.transmission) {
      glass.transmission = 0
      glass.transparent = true
      glass.opacity = 0.3
      glass.depthWrite = false
    }
    if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals()
  })
}

// Loads a .glb model, scales it so its largest side is `size` metres, and stands it on y = 0,
// centred. Its meshes are then joined by look (MergeStatic), to keep the drawing work low.
// onOrigin: keep the model's own centre point over the plinth's centre (the cobot: its base,
// not the middle of everything its arm can reach).
// animate: play the model's own animation instead (its moving parts must stay separate,
// so it is not joined).
// True inside the enlarged board's model viewer (ModelViewer.tsx): it shows a copy of each
// downloaded model, because one model can only stand in one place, and the original
// stays on its plinth in the museum.
export const ModelCopy = createContext(false)

function GltfModel({ url, size, yaw = 0, lift = 0, animate = false, onOrigin = false }: { url: string; size: number; yaw?: number; lift?: number; animate?: boolean; onOrigin?: boolean }) {
  const loaded = useGLTF(url)
  const copy = useContext(ModelCopy)
  // (The copy shares the original's shapes and materials: cheap.)
  const scene = useMemo(() => (copy ? (loaded.scene.clone(true) as Group) : loaded.scene), [copy, loaded.scene])
  const animations = loaded.animations
  const fit = useMemo(() => {
    prepareModel(scene)
    scene.rotation.y = yaw
    // Measured on its own: a model shown before is still attached to its old place in the
    // museum, and measuring it there gave museum-wide positions (the model then circled
    // far off its plinth as the exhibit turned).
    const parent = scene.parent
    scene.parent = null
    scene.position.set(0, 0, 0)
    scene.scale.set(1, 1, 1)
    scene.updateMatrixWorld(true)
    const box = new Box3().setFromObject(scene)
    scene.parent = parent
    const extent = box.getSize(new Vector3())
    const scale = size / Math.max(extent.x, extent.y, extent.z)
    const centre = box.getCenter(new Vector3())
    if (onOrigin) centre.set(0, 0, 0)
    return { scale, offset: [-centre.x * scale, -box.min.y * scale + lift, -centre.z * scale] as V3 }
  }, [scene, size, yaw, lift, onOrigin])
  if (animate) return <AnimatedModel scene={scene} animations={animations} offset={fit.offset} scale={fit.scale} />
  return (
    // keepSeparate: already joined here, so the prototype's own MergeStatic leaves it alone.
    <group position={fit.offset} scale={fit.scale} userData={{ keepSeparate: true }}>
      <MergeStatic>
        <primitive object={scene} />
      </MergeStatic>
    </group>
  )
}

// A downloaded model playing its first animation on a loop (the Watt engine's beam and
// flywheel, the cobot's pick-and-place).
function AnimatedModel({ scene, animations, offset, scale }: { scene: Group; animations: AnimationClip[]; offset: V3; scale: number }) {
  const root = useRef<Group>(null)
  const { actions, names } = useAnimations(animations, root)
  useEffect(() => {
    const action = names[0] ? actions[names[0]] : null
    action?.play()
    return () => {
      action?.stop()
    }
  }, [actions, names])
  return (
    <group ref={root} position={offset} scale={scale} userData={{ keepSeparate: true }}>
      <primitive object={scene} />
    </group>
  )
}

const MODEL = {
  watt: '/models/ir1/watt-steam-engine.glb',
  rocket: '/models/ir1/rocket-locomotive.glb',
  bulb: '/models/ir2/edison-light-bulb.glb',
  modelT: '/models/ir2/ford-model-t.glb',
  telephone: '/models/ir2/bell-telephone-1876.glb',
  chip: '/models/ir3/intel-4004.glb',
  pc: '/models/ir3/ibm-5150.glb',
  printer: '/models/ir4/3d-printer.glb',
  cobot: '/models/ir4/ur3-cobot.glb',
}

// ---------- CMCN 1 ----------

// Watt's steam engine: a museum model of a Watt engine (beam, cylinder, flywheel and
// governor on a table), with its own animation of the moving parts.
function WattEngine() {
  return (
    <Suspense fallback={null}>
      <GltfModel url={MODEL.watt} size={1.8} animate />
    </Suspense>
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

// Bell's telephone of 1876 (a model of the instrument), on a wooden display box.
function Telephone() {
  return (
    <group>
      <Box size={[0.9, 0.5, 0.6]} at={[0, 0.25, 0]} material={M.darkWood} />
      <Suspense fallback={null}>
        <GltfModel url={MODEL.telephone} size={0.9} lift={0.5} />
      </Suspense>
    </group>
  )
}

// ---------- CMCN 3 ----------

// The Intel 4004: a model of the 16-pin chip, enlarged many times and tilted towards the
// visitor on a black stand.
function Intel4004() {
  return (
    <group>
      <Box size={[0.5, 0.5, 0.3]} at={[0, 0.25, 0]} material={M.black} />
      <group position={[0, 0.62, 0]} rotation={[0.5, 0, 0]}>
        <Suspense fallback={null}>
          <GltfModel url={MODEL.chip} size={1.3} />
        </Suspense>
      </group>
    </group>
  )
}

// The IBM 5150 (a model with its monitor and keyboard) on a small desk.
function PersonalComputer() {
  return (
    <group>
      <Box size={[1.2, 0.06, 0.8]} at={[0, 0.66, 0]} material={M.darkWood} />
      {[-0.55, 0.55].flatMap((x) =>
        [-0.35, 0.35].map((z) => <Box key={`${x}${z}`} size={[0.05, 0.63, 0.05]} at={[x, 0.315, z]} material={M.iron} />),
      )}
      <Suspense fallback={null}>
        <GltfModel url={MODEL.pc} size={1.1} lift={0.69} />
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



// 3D printing: a desktop 3D printer.
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

// A cobot: a model of a Universal Robots UR3 arm, playing its own pick-and-place motion.
function Cobot() {
  return (
    <group>
      <Rod r={0.3} length={0.25} at={[0, 0.125, 0]} material={M.white} sides={24} />
      <Suspense fallback={null}>
        <GltfModel url={MODEL.cobot} size={1.9} lift={0.25} animate onOrigin />
      </Suspense>
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

// Stephenson's Rocket (a model of the locomotive with its tender) on a short track.
function Locomotive() {
  return (
    <group>
      <Box size={[1.8, 0.08, 0.5]} at={[0, 0.04, 0]} material={M.darkWood} />
      {[-0.12, 0.12].map((z) => (
        <Box key={z} size={[1.8, 0.04, 0.04]} at={[0, 0.1, z]} material={M.steel} />
      ))}
      <Suspense fallback={null}>
        <GltfModel url={MODEL.rocket} size={1.8} lift={0.12} yaw={Math.PI / 2} />
      </Suspense>
    </group>
  )
}

// The light bulb (a model of an Edison-style bulb with its filament) on a slim stand.
function LightBulb() {
  return (
    <group>
      <Rod r={0.18} length={0.06} at={[0, 0.03, 0]} material={M.brass} sides={20} />
      <Rod r={0.03} length={0.6} at={[0, 0.33, 0]} material={M.brass} />
      {/* The model hangs cap-up like a ceiling bulb; turned over, its screw cap sits on the stand. */}
      <group position={[0, 1.55, 0]} rotation={[Math.PI, 0, 0]}>
        <Suspense fallback={null}>
          <GltfModel url={MODEL.bulb} size={0.95} />
        </Suspense>
      </group>
    </group>
  )
}

// ---------- New in the 18-exhibit plan ----------

// Puddled iron: a brick puddling furnace with its chimney and a door glowing with molten
// iron, the puddler's long rod, a glowing ball ("bloom") of iron and finished bars.
function PuddlingFurnace() {
  return (
    <group>
      <Box size={[1.1, 0.8, 0.8]} at={[-0.25, 0.4, 0]} material={M.brick} />
      <Box size={[1.14, 0.08, 0.84]} at={[-0.25, 0.84, 0]} material={M.iron} />
      <Rod r={0.17} r2={0.12} length={1.0} at={[-0.6, 1.38, -0.1]} material={M.brick} />
      <Box size={[0.44, 0.34, 0.03]} at={[-0.1, 0.42, 0.405]} material={M.iron} />
      <Box size={[0.32, 0.22, 0.02]} at={[-0.1, 0.42, 0.425]} material={M.molten} />
      <Box size={[0.9, 0.025, 0.025]} at={[0.25, 0.45, 0.5]} rotation={[0, 0.25, -0.12]} material={M.iron} />
      <mesh position={[0.5, 0.13, 0.25]} material={M.molten}>
        <sphereGeometry args={[0.12, 14, 10]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <Box key={i} size={[0.5, 0.06, 0.08]} at={[0.6, 0.04 + i * 0.065, -0.2 + (i % 2) * 0.1]} material={M.iron} />
      ))}
    </group>
  )
}

// The Bessemer converter: the pear-shaped vessel on its pivot, tipping slowly, with a
// flame roaring from its mouth.
function BessemerConverter() {
  const vessel = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (vessel.current) vessel.current.rotation.z = -0.3 + Math.sin(clock.elapsedTime * 0.4) * 0.12
  })
  return (
    <group>
      <Box size={[1.2, 0.12, 0.9]} at={[0, 0.06, 0]} material={M.iron} />
      {[-0.45, 0.45].map((z) => (
        <Box key={z} size={[0.16, 0.75, 0.12]} at={[0, 0.48, z]} material={M.iron} />
      ))}
      <Rod r={0.05} length={0.95} at={[0, 0.82, 0]} axis="z" material={M.steel} />
      <group ref={vessel} position={[0, 0.82, 0]} userData={{ keepSeparate: true }}>
        <mesh position={[0, -0.02, 0]} scale={[1, 1.2, 1]} material={M.iron}>
          <sphereGeometry args={[0.34, 24, 16]} />
        </mesh>
        <Rod r={0.3} r2={0.15} length={0.4} at={[0, 0.48, 0]} material={M.iron} sides={24} />
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
          <torusGeometry args={[0.36, 0.03, 8, 32]} />
        </mesh>
        <Rod r={0.13} length={0.03} at={[0, 0.69, 0]} material={M.molten} />
        <Rod r={0.03} r2={0.12} length={0.35} at={[0, 0.88, 0]} material={M.molten} />
      </group>
    </group>
  )
}

// The Benz Patent-Motorwagen (1886): three large spoked wheels, a bench seat, the steering
// tiller and, at the back, the engine with its big flywheel lying flat.
function MotorWagen() {
  return (
    <group>
      {[-0.42, 0.42].map((z) => (
        <group key={z} position={[-0.35, 0.44, z]}>
          <Wheel radius={0.42} tube={0.022} spokes={6} material={M.black} />
        </group>
      ))}
      <Rod r={0.025} length={0.9} at={[-0.35, 0.44, 0]} axis="z" material={M.steel} />
      <group position={[0.62, 0.28, 0]}>
        <Wheel radius={0.27} tube={0.02} spokes={5} material={M.black} />
      </group>
      <Rod r={0.02} length={0.5} at={[0.62, 0.52, 0]} material={M.steel} />
      {[-0.2, 0.2].map((z) => (
        <Rod key={z} r={0.018} length={1.15} at={[0.1, 0.5, z]} axis="x" material={M.steel} />
      ))}
      <Box size={[0.42, 0.28, 0.5]} at={[-0.12, 0.66, 0]} material={M.darkWood} />
      <Box size={[0.46, 0.08, 0.62]} at={[-0.12, 0.84, 0]} material={M.black} />
      <Box size={[0.06, 0.28, 0.62]} at={[-0.34, 0.98, 0]} material={M.black} />
      <Rod r={0.014} length={0.55} at={[0.3, 0.98, 0]} material={M.steel} />
      <Box size={[0.03, 0.03, 0.22]} at={[0.3, 1.26, 0]} material={M.black} />
      <Box size={[0.32, 0.22, 0.24]} at={[-0.6, 0.66, 0]} material={M.iron} />
      <Rod r={0.07} length={0.3} at={[-0.62, 0.62, 0.12]} axis="x" material={M.brass} />
      <Spin speed={2.4} axis="y" at={[-0.62, 0.82, 0]}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <Wheel radius={0.2} tube={0.025} spokes={4} material={M.iron} />
        </group>
      </Spin>
    </group>
  )
}

// Electric power: the light bulb, with Tesla's motor beside it.
function ElectricPower() {
  return (
    <group>
      <group position={[-0.45, 0, 0]}>
        <LightBulb />
      </group>
      <group position={[0.5, 0, 0]} scale={0.55}>
        <InductionMotor />
      </group>
    </group>
  )
}

// Factory automation: the Unimate robot with a PLC cabinet behind it.
function Automation() {
  return (
    <group>
      <group position={[0.2, 0, 0.1]}>
        <Unimate />
      </group>
      <group position={[-0.65, 0, -0.45]} scale={0.6}>
        <Plc />
      </group>
    </group>
  )
}

// Artificial intelligence (the spotlight exhibit): a glowing neural network floating above
// a dark base: layers of nodes joined by links, signals pulsing through them, and a slowly
// turning core.
const NETWORK: number[][] = [
  [-0.36, -0.12, 0.12, 0.36],
  [-0.48, -0.24, 0, 0.24, 0.48],
  [-0.36, -0.12, 0.12, 0.36],
  [-0.12, 0.12],
]
function ArtificialIntelligence() {
  const core = useRef<Group>(null)
  const pulse = useRef<MeshBasicMaterial>(null)
  useFrame(({ clock }, delta) => {
    if (core.current) core.current.rotation.y += delta * 0.6
    if (pulse.current) pulse.current.opacity = 0.25 + 0.2 * Math.sin(clock.elapsedTime * 3)
  })
  const layerX = (i: number) => -0.6 + i * 0.4
  const nodes = NETWORK.flatMap((layer, i) => layer.map((y): V3 => [layerX(i), 1.15 + y, 0]))
  return (
    <group>
      <Rod r={0.42} r2={0.32} length={0.18} at={[0, 0.09, 0]} material={M.black} sides={32} />
      <Rod r={0.34} length={0.02} at={[0, 0.19, 0]} material={M.cyan} sides={32} />
      <Rod r={0.02} length={0.5} at={[0, 0.45, 0]} material={HOLO_FILL} />
      {NETWORK.slice(1).flatMap((layer, i) =>
        layer.flatMap((y) =>
          NETWORK[i].map((y0) => (
            <Link key={`${i}-${y}-${y0}`} from={[layerX(i), 1.15 + y0, 0]} to={[layerX(i + 1), 1.15 + y, 0]} material={HOLO_FILL} r={0.005} />
          )),
        ),
      )}
      {nodes.map((at, i) => (
        <mesh key={i} position={at} material={M.cyan}>
          <sphereGeometry args={[0.045, 12, 8]} />
        </mesh>
      ))}
      <group ref={core} position={[0, 1.15, -0.25]} userData={{ keepSeparate: true }}>
        <mesh material={HOLO_WIRE}>
          <icosahedronGeometry args={[0.55, 1]} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.5, 24, 16]} />
          <meshBasicMaterial ref={pulse} color="#5fe3ff" transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

// ---------- Which prototype goes with which text ----------

const PROTOTYPES: Record<string, () => JSX.Element> = {
  'ir1-1': WattEngine,
  'ir1-2': WaterFrame,
  'ir1-3': PuddlingFurnace,
  'ir1-4': Locomotive,
  'ir2-1': BessemerConverter,
  'ir2-2': MotorWagen,
  'ir2-3': ElectricPower,
  'ir2-4': AssemblyLine,
  'ir2-5': Telephone,
  'ir3-1': Intel4004,
  'ir3-2': PersonalComputer,
  'ir3-3': Automation,
  'ir3-4': Arpanet,
  'ir4-1': Printer3d,
  'ir4-2': PredictiveMaintenance,
  'ir4-3': ArtificialIntelligence,
  'ir4-4': DigitalTwin,
  'ir4-5': Cobot,
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
