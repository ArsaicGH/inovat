import { SHADOW_LAYER } from './shadow-layer'
import { Suspense, createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type JSX } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { AdditiveBlending, type AnimationClip, Box3, BufferAttribute, MeshBasicMaterial, MeshStandardMaterial, Quaternion, Vector3, type Group, type Intersection, type Mesh, type Raycaster } from 'three'
import MergeStatic from './MergeStatic'
// The historic machines no museum has shared as a 3D model, built in detail by the team.
import { BessemerConverter, InductionMotor, PuddlingFurnace, Unimate, WaterFrame } from './historic-machines'

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
// The digital twin's wireframe: fainter, as a detailed model has very many lines.
const TWIN_WIRE = new MeshBasicMaterial({ color: '#7febff', wireframe: true, transparent: true, opacity: 0.14, depthWrite: false, toneMapped: false })

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

// copy: a separate copy even in the museum (a model shown in two places there).
// wire: drawn in this material instead of its own (the digital twin's wireframe).
// SHADOW STAND-INS. The most detailed downloaded models (up to 111,000 triangles) cast their
// shadow from a simplified copy (models/...-shadow.glb, about a tenth of the triangles, no
// colours), seen only by the shadow-casting lights: the shadow pictures are far too coarse
// to show the difference, and the shadow drawing (redrawn every few frames, every frame at
// "ultra") was spending most of its time on these few models. The stand-in lives in its own
// layer, which the camera does not draw and the shadow lights do (Museum.tsx).
const STAND_IN_MATERIAL = new MeshBasicMaterial()
function hasShadowStandIn(url: string): boolean {
  return [MODEL.rocket, MODEL.benz, MODEL.pc, MODEL.plc, MODEL.motor, MODEL.gpu, MODEL.printer, MODEL.telephone, MODEL.modelT].includes(url)
}
function ShadowStandIn({ url, yaw }: { url: string; yaw: number }) {
  const loaded = useGLTF(url.replace(/\.glb$/, '-shadow.glb'))
  const scene = useMemo(() => {
    const copy = loaded.scene.clone(true) as Group
    copy.rotation.y = yaw
    copy.traverse((object) => {
      object.layers.set(SHADOW_LAYER)
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = false
      mesh.material = STAND_IN_MATERIAL
    })
    return copy
  }, [loaded.scene, yaw])
  return <primitive object={scene} />
}

function GltfModel({ url, size, yaw = 0, lift = 0, animate = false, onOrigin = false, copy: ownCopy = false, wire }: { url: string; size: number; yaw?: number; lift?: number; animate?: boolean; onOrigin?: boolean; copy?: boolean; wire?: MeshBasicMaterial }) {
  const loaded = useGLTF(url)
  const copy = useContext(ModelCopy) || ownCopy || Boolean(wire)
  // (The copy shares the original's shapes and materials: cheap.)
  const scene = useMemo(() => {
    if (!copy) return loaded.scene
    const clone = loaded.scene.clone(true) as Group
    if (wire)
      clone.traverse((object) => {
        const mesh = object as Mesh
        if (mesh.isMesh) mesh.material = wire
      })
    return clone
  }, [copy, loaded.scene, wire])
  const animations = loaded.animations
  // (A see-through hologram copy casts no shadow; a model with a stand-in lets it cast its own.)
  const standIn = hasShadowStandIn(url) && !wire
  const fit = useMemo(() => {
    prepareModel(scene)
    if (standIn || wire)
      scene.traverse((object) => {
        object.castShadow = false
      })
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
  }, [scene, size, yaw, lift, onOrigin, standIn, wire])
  if (animate) return <AnimatedModel scene={scene} animations={animations} offset={fit.offset} scale={fit.scale} />
  return (
    // keepSeparate: already joined here, so the prototype's own MergeStatic leaves it alone.
    // ownShadows: its shadows are set here, the exhibit's turntable leaves them alone.
    <group position={fit.offset} scale={fit.scale} userData={{ keepSeparate: true, ownShadows: true }}>
      <MergeStatic>
        <primitive object={scene} />
      </MergeStatic>
      {standIn && <ShadowStandIn url={url} yaw={yaw} />}
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
    <group ref={root} position={offset} scale={scale} userData={{ keepSeparate: true, ownShadows: true }}>
      <primitive object={scene} />
    </group>
  )
}

const MODEL = {
  watt: '/models/ir1/watt-steam-engine.glb',
  rocket: '/models/ir1/rocket-locomotive.glb',
  bulb: '/models/ir2/edison-light-bulb.glb',
  modelT: '/models/ir2/ford-model-t-v2.glb',
  benz: '/models/ir2/benz-motorwagen.glb',
  telephone: '/models/ir2/bell-telephone-1876.glb',
  chip: '/models/ir3/intel-4004.glb',
  pc: '/models/ir3/ibm-pc-5150.glb',
  pdp11: '/models/ir3/dec-pdp-11.glb',
  plc: '/models/ir3/siemens-s7-1200.glb',
  printer: '/models/ir4/3d-printer.glb',
  cobot: '/models/ir4/ur3-cobot.glb',
  motor: '/models/ir4/electric-motor.glb',
  gpu: '/models/ir4/gpu-rtx-3070.glb',
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


// ---------- CMCN 2 ----------

// The assembly line: a Ford Model T on a short stretch of moving line.
function AssemblyLine() {
  return (
    <group>
      <Box size={[1.7, 0.16, 0.8]} at={[0, 0.08, 0]} material={M.iron} />
      {Array.from({ length: 9 }, (_, i) => (
        <Rod key={i} r={0.04} length={0.82} at={[-0.76 + i * 0.19, 0.17, 0]} axis="z" material={M.steel} />
      ))}
      <Suspense fallback={null}>
        <GltfModel url={MODEL.modelT} size={1.5} lift={0.21} yaw={Math.PI / 2} />
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

// ARPANET: a minicomputer (a model of a DEC PDP-11, a kind of computer connected to the
// network), and above it the first four linked sites as glowing points.
function Arpanet() {
  const sites: V3[] = [
    [-0.4, 1.45, 0.2],
    [0.35, 1.55, 0.25],
    [-0.25, 1.7, -0.3],
    [0.4, 1.4, -0.25],
  ]
  return (
    <group>
      <Suspense fallback={null}>
        <GltfModel url={MODEL.pdp11} size={1.2} />
      </Suspense>
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
      <Link from={[0, 1.2, 0]} to={sites[0]} material={M.ledAmber} />
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
        {/* The DIN rail with the controller: a model of a real PLC, a Siemens SIMATIC
            S7-1200 (CPU, signal module, communication module), shown about twice life size
            so it can be read from the plinth's edge. Grey wiring ducts above and below. */}
        <Box size={[0.8, 0.035, 0.012]} at={[0, 0.82, -0.125]} material={M.steel} />
        <group position={[0, 0.7, -0.12]}>
          <Suspense fallback={null}>
            <GltfModel url={MODEL.plc} size={0.6} />
          </Suspense>
        </group>
        {[1.07, 0.6].map((y) => (
          <Box key={y} size={[0.8, 0.07, 0.07]} at={[0, y, -0.1]} material={M.cabinet} />
        ))}
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


// The digital twin: a real machine and, floating beside it, its glowing digital copy that
// turns in step with it.
function DigitalTwin() {
  return (
    <group>
      <Suspense fallback={null}>
        <group position={[-0.42, 0, 0]}>
          <GltfModel url={MODEL.motor} size={0.75} copy />
        </group>
        <group position={[0.45, 0.45, 0]}>
          <GltfModel url={MODEL.motor} size={0.75} wire={TWIN_WIRE} />
        </group>
      </Suspense>
      <Rod r={0.3} length={0.02} at={[0.45, 0.4, 0]} material={HOLO_FILL} sides={24} />
      <Link from={[-0.2, 0.6, 0]} to={[0.23, 0.95, 0]} material={HOLO_FILL} r={0.006} />
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

// Predictive maintenance: an electric motor (a downloaded model) with a vibration sensor;
// above it a hologram chart whose line starts to climb, and a warning light asking for a check.
function PredictiveMaintenance() {
  const warning = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (warning.current) warning.current.visible = Math.sin(clock.elapsedTime * 4) > 0
  })
  const chart: V3[] = [0, 0.02, 0.01, 0.03, 0.02, 0.05, 0.04, 0.09, 0.14, 0.22].map((y, i) => [-0.35 + i * 0.078, 1.3 + y, 0])
  return (
    <group>
      <Box size={[1.3, 0.12, 0.6]} at={[0, 0.06, 0]} material={M.navy} />
      <Suspense fallback={null}>
        <GltfModel url={MODEL.motor} size={0.95} lift={0.12} />
      </Suspense>
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

// The Benz Patent-Motorwagen (1886): three large spoked wheels, a bench seat, the steering
// tiller and, at the back, the engine with its big flywheel lying flat.
function MotorWagen() {
  return (
    <Suspense fallback={null}>
      <GltfModel url={MODEL.benz} size={1.95} />
    </Suspense>
  )
}

// Electric power: the light bulb, with Tesla's motor beside it.
function ElectricPower() {
  return (
    <group>
      <group position={[-0.45, 0, 0]}>
        <LightBulb />
      </group>
      <group position={[0.42, 0, 0.08]} rotation={[0, -0.75, 0]} scale={0.72}>
        <InductionMotor />
      </group>
    </group>
  )
}

// Factory automation: the Unimate robot with a PLC cabinet behind it.
function Automation() {
  return (
    <group>
      <group position={[0.05, 0, 0.1]}>
        <Unimate />
      </group>
      <group position={[-0.65, 0, -0.45]} scale={0.6}>
        <Plc />
      </group>
    </group>
  )
}

// Artificial intelligence (the spotlight exhibit): a glowing neural network floating above
// a graphics processor on a dark base: layers of nodes joined by links, signals pulsing
// through them, and a slowly turning core.
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
      {/* A graphics processor (a downloaded model of a GPU card), the kind of chip that deep
          learning runs on, under the network it computes. */}
      <Suspense fallback={null}>
        <GltfModel url={MODEL.gpu} size={0.62} lift={0.2} />
      </Suspense>
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
Object.values(MODEL).filter(hasShadowStandIn).forEach((url) => useGLTF.preload(url.replace(/\.glb$/, '-shadow.glb')))

export default function Invention({ id }: { id: string }) {
  const Prototype = PROTOTYPES[id]
  const group = useRef<Group>(null)
  // Aiming tests a prototype's joined pieces by their bounding box, like the downloaded
  // models (prepareModel): the detailed hand-built machines join into meshes of thousands of
  // triangles, and testing each of them every frame cost about 1 ms near them. (After the
  // joining below, which happens first: children prepare before their parent.)
  useLayoutEffect(() => {
    group.current?.traverse((object) => {
      const mesh = object as Mesh
      if (mesh.isMesh) mesh.raycast = boxRaycast
    })
  }, [id])
  if (!Prototype) return null
  return (
    <group ref={group}>
      <MergeStatic>
        <Prototype />
      </MergeStatic>
    </group>
  )
}

// THE ENDING FILM shows some of these downloaded models again (ending-acts.tsx), much larger
// and as copies (ModelCopy), so the museum's own stay on their plinths. `size` = the model's
// largest side in metres; yaw turns it about its middle.
export type FilmModelName = keyof typeof MODEL
export function FilmModel({ name, size, yaw = 0, animate = false, onOrigin = false }: { name: FilmModelName; size: number; yaw?: number; animate?: boolean; onOrigin?: boolean }) {
  return (
    <ModelCopy.Provider value={true}>
      <Suspense fallback={null}>
        <GltfModel url={MODEL[name]} size={size} yaw={yaw} animate={animate} onOrigin={onOrigin} />
      </Suspense>
    </ModelCopy.Provider>
  )
}
