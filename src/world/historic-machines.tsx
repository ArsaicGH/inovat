import { useMemo, useRef, type ReactNode, type Ref, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Group,
  type Material,
  type Texture,
} from 'three'
import MergeStatic from './MergeStatic'

// THE HISTORIC MACHINES that no museum has shared as a 3D model (no free model of them exists
// on Sketchfab), built here in detail from photographs and drawings of the real machines:
// - Arkwright's water frame (as in the Helmshore and Science Museum examples): oak frame,
//   rows of spindles with bobbins and flyers, three pairs of drafting rollers held down by
//   hanging weights, roving bobbins above, a gear train, turned by a water wheel;
// - Cort's puddling furnace: a brick reverberatory furnace (firebox, low arched hearth, flue
//   and tall chimney) braced by cast-iron buckstays and tie-rods, its working door hung from
//   a counterweighted lever, with the puddler's rabble, a glowing ball of iron and bars;
// - the Bessemer converter (like the one kept at Kelham Island, Sheffield): a riveted
//   pear-shaped vessel turning on trunnions between cast-iron standards, a toothed wheel and
//   rack to tip it, and the blast pipe into its hollow trunnion;
// - Tesla's induction motor of 1888: a laminated iron ring with four coils, the rotor turning
//   inside on a shaft between two bearing pedestals, brass terminals and a pulley;
// - the Unimate robot (1961): its cabinet base with controls, the turret, the boom with its
//   telescoping arm, wrist and gripper, and hydraulic hoses.
// Their pieces never change and are joined into a few meshes (MergeStatic); moving parts are
// joined among themselves. Surfaces get small pictures painted here once (wood grain, brick,
// cast iron, copper winding), shared by every machine.

type V3 = [number, number, number]

// ---------- Painted surface pictures (made once) ----------

// The same "random" numbers every time, so every visitor sees the same grain.
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function canvasTexture(size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void, colour = true): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) paint(ctx, size)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  if (colour) texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

const textures: Record<string, Texture> = {}
function texture(name: 'wood' | 'brick' | 'iron' | 'winding' | 'lamination'): Texture {
  if (textures[name]) return textures[name]
  const rand = seeded(name.length * 977)
  const made = canvasTexture(name === 'brick' ? 256 : 128, (ctx, n) => {
    if (name === 'wood') {
      // Long grain lines along the texture's height, with a few darker streaks.
      ctx.fillStyle = '#d9b48a'
      ctx.fillRect(0, 0, n, n)
      for (let i = 0; i < 46; i++) {
        const x = rand() * n
        ctx.strokeStyle = `rgba(90, 55, 25, ${0.12 + rand() * 0.25})`
        ctx.lineWidth = 0.6 + rand() * 1.8
        ctx.beginPath()
        for (let y = 0; y <= n; y += 8) ctx.lineTo(x + Math.sin(y * 0.05 + i) * 2.5, y)
        ctx.stroke()
      }
    } else if (name === 'brick') {
      // Four courses of bricks with light mortar, each brick a slightly different red.
      ctx.fillStyle = '#b8ab98'
      ctx.fillRect(0, 0, n, n)
      const rows = 8
      const h = n / rows
      for (let r = 0; r < rows; r++)
        for (let c = -1; c < 4; c++) {
          const w = n / 4
          const x = c * w + (r % 2 ? w / 2 : 0)
          const shade = 0.75 + rand() * 0.35
          ctx.fillStyle = `rgb(${Math.round(150 * shade)}, ${Math.round(70 * shade)}, ${Math.round(48 * shade)})`
          ctx.fillRect(x + 2, r * h + 2, w - 4, h - 4)
          ctx.fillStyle = `rgba(0, 0, 0, ${rand() * 0.15})`
          ctx.fillRect(x + 2, r * h + h * 0.6, w - 4, h * 0.4 - 2)
        }
    } else if (name === 'iron') {
      // Cast iron: dark grey with fine speckles.
      ctx.fillStyle = '#8d8b88'
      ctx.fillRect(0, 0, n, n)
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(${rand() < 0.5 ? '40,38,36' : '170,168,164'}, ${rand() * 0.35})`
        ctx.fillRect(rand() * n, rand() * n, 1 + rand() * 2, 1 + rand() * 2)
      }
    } else if (name === 'winding') {
      // Copper wire wound in tight turns.
      ctx.fillStyle = '#c87b46'
      ctx.fillRect(0, 0, n, n)
      for (let y = 0; y < n; y += 4) {
        ctx.fillStyle = 'rgba(80, 30, 10, 0.55)'
        ctx.fillRect(0, y, n, 1)
        ctx.fillStyle = 'rgba(255, 210, 160, 0.35)'
        ctx.fillRect(0, y + 2, n, 1)
      }
    } else {
      // Stacked iron sheets (laminations).
      ctx.fillStyle = '#7d8187'
      ctx.fillRect(0, 0, n, n)
      for (let x = 0; x < n; x += 3) {
        ctx.fillStyle = `rgba(30, 32, 36, ${0.35 + rand() * 0.2})`
        ctx.fillRect(x, 0, 1, n)
      }
    }
  })
  textures[name] = made
  return made
}

// ---------- Materials (shared, so their parts join into few meshes) ----------

let materials: ReturnType<typeof makeMaterials> | null = null
function makeMaterials() {
  const std = (color: string, roughness: number, metalness = 0, map?: Texture) => new MeshStandardMaterial({ color, roughness, metalness, map })
  const glow = (color: string, intensity: number) => new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, toneMapped: false })
  const wood = texture('wood')
  const iron = texture('iron')
  const brick = texture('brick')
  return {
    oak: std('#a6774c', 0.72, 0, wood),
    darkWood: std('#6e4a2c', 0.75, 0, wood),
    leather: std('#5c3a22', 0.8),
    castIron: std('#5a5651', 0.6, 0.5, iron),
    darkIron: std('#2f2d2b', 0.6, 0.6, iron),
    steel: std('#a7adb4', 0.32, 0.85),
    brass: std('#b9893f', 0.32, 0.9),
    copper: std('#c07445', 0.38, 0.85),
    winding: std('#ffffff', 0.4, 0.75, texture('winding')),
    lamination: std('#ffffff', 0.45, 0.7, texture('lamination')),
    cotton: std('#f1ebdd', 0.92),
    brick: std('#ffffff', 0.9, 0, brick),
    stone: std('#8a8378', 0.88),
    coal: std('#161514', 0.45, 0.2),
    water: new MeshStandardMaterial({ color: '#6aa6c9', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.55 }),
    molten: glow('#ff7a2a', 3.4),
    ember: glow('#ff4d1a', 1.6),
    // The converter's flame: soft layers of light added onto what is behind them.
    flameOuter: new MeshBasicMaterial({ color: '#ff6a1a', transparent: true, opacity: 0.32, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    flame: new MeshBasicMaterial({ color: '#ffa040', transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    flameCore: new MeshBasicMaterial({ color: '#fff0c0', transparent: true, opacity: 0.75, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    // The Unimate's slate blue-grey paint, darker trim and black hoses and rubber.
    paint: std('#74879a', 0.5, 0.25),
    paintDark: std('#3d4753', 0.5, 0.3),
    rubber: std('#151617', 0.7),
    panel: std('#22262b', 0.45, 0.3),
    ledRed: glow('#ff4a3a', 2.4),
    ledGreen: glow('#5dff7a', 2.4),
    ledAmber: glow('#ffb347', 2.4),
    dial: std('#efece2', 0.4),
  }
}
function mats() {
  materials ??= makeMaterials()
  return materials
}

// ---------- Shapes ----------

const geometries = new Map<string, BufferGeometry>()
function cached(key: string, make: () => BufferGeometry): BufferGeometry {
  let g = geometries.get(key)
  if (!g) {
    g = make()
    geometries.set(key, g)
  }
  return g
}

// A box whose surface picture keeps the same scale whatever its size (one copy every
// `tile` metres), so wood grain and bricks are not stretched on long parts.
function boxGeometry(w: number, h: number, d: number, tile: number): BufferGeometry {
  return cached(`b${w}|${h}|${d}|${tile}`, () => {
    const g = new BoxGeometry(w, h, d)
    const uv = g.getAttribute('uv')
    // Face order: +x, -x, +y, -y, +z, -z (4 corners each).
    const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
    for (let f = 0; f < 6; f++)
      for (let i = 0; i < 4; i++) {
        const k = f * 4 + i
        uv.setXY(k, (uv.getX(k) * dims[f][0]) / tile, (uv.getY(k) * dims[f][1]) / tile)
      }
    return g
  })
}

function B({ s, at, r, m, tile = 0.4 }: { s: V3; at: V3; r?: V3; m: Material; tile?: number }) {
  return <mesh geometry={boxGeometry(s[0], s[1], s[2], tile)} position={at} rotation={r} material={m} />
}

// A cylinder along X, Y or Z (r2 = radius at the top end, for tapers).
function C({ r, l, at, axis = 'y', m, r2, seg = 18, rot }: { r: number; l: number; at: V3; axis?: 'x' | 'y' | 'z'; m: Material; r2?: number; seg?: number; rot?: V3 }) {
  const rotation: V3 = rot ?? (axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0])
  const g = cached(`c${r}|${r2 ?? r}|${l}|${seg}`, () => new CylinderGeometry(r2 ?? r, r, l, seg))
  return <mesh geometry={g} position={at} rotation={rotation} material={m} />
}

// A rod from one point to another (threads, chains, tools, struts).
const UP = new Vector3(0, 1, 0)
function Rod({ from, to, r, m, seg = 8 }: { from: V3; to: V3; r: number; m: Material; seg?: number }) {
  const a = new Vector3(...from)
  const b = new Vector3(...to)
  const dir = b.clone().sub(a)
  const length = dir.length()
  const q = new Quaternion().setFromUnitVectors(UP, dir.normalize())
  const mid = a.add(b).multiplyScalar(0.5)
  const g = cached(`c${r}|${r}|${length.toFixed(3)}|${seg}`, () => new CylinderGeometry(r, r, length, seg))
  return <mesh geometry={g} position={mid} quaternion={q} material={m} />
}

// A ring around the Y axis (bands, flanges).
function Ring({ R, t, y = 0, at, m, seg = 40, square = false }: { R: number; t: number; y?: number; at?: V3; m: Material; seg?: number; square?: boolean }) {
  const g = cached(`t${R}|${t}|${seg}|${square}`, () => {
    // (A square band, for the chimney, is a torus with four sides turned 45 degrees.)
    const geometry = new CylinderGeometry(R + t, R + t, t * 2, square ? 4 : seg, 1, true)
    return geometry
  })
  return <mesh geometry={g} position={at ?? [0, y, 0]} rotation={square ? [0, Math.PI / 4, 0] : undefined} material={m} />
}

// A spur gear, its axle along Z: a toothed outline with a hole, given thickness.
function gearGeometry(r: number, teeth: number, thick: number): BufferGeometry {
  return cached(`g${r}|${teeth}|${thick}`, () => {
    const shape = new Shape()
    const root = r * 0.86
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2
      const step = (Math.PI * 2) / teeth
      const pts: [number, number][] = [
        [root, a],
        [r, a + step * 0.18],
        [r, a + step * 0.42],
        [root, a + step * 0.6],
      ]
      pts.forEach(([rad, ang], j) => {
        const x = Math.cos(ang) * rad
        const y = Math.sin(ang) * rad
        if (i === 0 && j === 0) shape.moveTo(x, y)
        else shape.lineTo(x, y)
      })
    }
    shape.closePath()
    const hole = new Path()
    hole.absarc(0, 0, r * 0.14, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    // Lightening holes between the rim and the hub, as on cast gears.
    if (r > 0.1)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        const p = new Path()
        p.absarc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.18, 0, Math.PI * 2, true)
        shape.holes.push(p)
      }
    const g = new ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 6 })
    g.translate(0, 0, -thick / 2)
    return g
  })
}
function Gear({ r, teeth, thick, at, axis = 'z', m }: { r: number; teeth: number; thick: number; at?: V3; axis?: 'x' | 'z'; m: Material }) {
  return <mesh geometry={gearGeometry(r, teeth, thick)} position={at} rotation={axis === 'x' ? [0, Math.PI / 2, 0] : undefined} material={m} />
}

// A bent pipe or hose along a smooth curve through the points.
function Tube({ points, r, m }: { points: V3[]; r: number; m: Material }) {
  const key = `p${r}|${points.map((p) => p.join(',')).join(';')}`
  const g = cached(key, () => new TubeGeometry(new CatmullRomCurve3(points.map((p) => new Vector3(...p))), 24, r, 8, false))
  return <mesh geometry={g} material={m} />
}

// Turning parts: their own pieces joined, then turned as one (keepSeparate: the machine's
// merging leaves them alone).
function Turning({ at, children, groupRef }: { at?: V3; children: ReactNode; groupRef: Ref<Group> }) {
  return (
    <group ref={groupRef} position={at} userData={{ keepSeparate: true }}>
      <MergeStatic>{children}</MergeStatic>
    </group>
  )
}

// =====================================================================================
// ARKWRIGHT'S WATER FRAME
// =====================================================================================

const FRAME_X = 0.2 // the frame's middle (the water wheel stands at its left end)
const HEADS = [-0.39, -0.13, 0.13, 0.39]

function SpinningHead({ x, side }: { x: number; side: number }) {
  const m = mats()
  const z = side * 0.21
  return (
    <group position={[x, 0, 0]}>
      {/* Spindle, its pulley (wharve), the bobbin with yarn, and the flyer above it. */}
      <C r={0.005} l={0.56} at={[0, 0.7, z]} m={m.steel} seg={6} />
      <C r={0.022} l={0.03} at={[0, 0.47, z]} m={m.brass} seg={14} />
      <C r={0.016} l={0.13} at={[0, 0.7, z]} m={m.darkWood} seg={12} />
      <C r={0.036} l={0.012} at={[0, 0.635, z]} m={m.darkWood} seg={16} />
      <C r={0.036} l={0.012} at={[0, 0.765, z]} m={m.darkWood} seg={16} />
      <C r={0.031} l={0.11} at={[0, 0.7, z]} m={m.cotton} seg={16} />
      <C r={0.012} l={0.03} at={[0, 0.81, z]} m={m.steel} seg={10} />
      <B s={[0.1, 0.012, 0.012]} at={[0, 0.795, z]} m={m.steel} />
      {[-1, 1].map((s) => (
        <C key={s} r={0.004} l={0.15} at={[s * 0.048, 0.72, z]} m={m.steel} seg={6} />
      ))}
      {/* Three pairs of drafting rollers: fluted steel below, leather-covered above. */}
      {[0.24, 0.205, 0.17].map((rz) => (
        <group key={rz}>
          <C r={0.011} l={0.2} at={[0, 1.075, side * rz]} axis="x" m={m.steel} seg={10} />
          <C r={0.015} l={0.17} at={[0, 1.1, side * rz]} axis="x" m={m.leather} seg={12} />
        </group>
      ))}
      {/* The saddle and hanging weight that press the top rollers down. */}
      <B s={[0.16, 0.012, 0.02]} at={[0, 1.122, side * 0.205]} m={m.castIron} />
      <C r={0.003} l={0.27} at={[0, 0.99, side * 0.275]} m={m.castIron} seg={6} />
      <C r={0.022} l={0.07} at={[0, 0.84, side * 0.275]} m={m.castIron} seg={14} />
      {/* The roving bobbin on the creel above, and the threads running down. */}
      <C r={0.01} l={0.18} at={[0, 1.54, side * 0.12]} m={m.darkWood} seg={8} />
      <C r={0.04} l={0.12} at={[0, 1.54, side * 0.12]} m={m.cotton} seg={16} />
      <Rod from={[0, 1.48, side * 0.12]} to={[0, 1.1, side * 0.17]} r={0.0016} m={m.cotton} seg={4} />
      <Rod from={[0, 1.07, side * 0.24]} to={[0, 0.825, z]} r={0.0016} m={m.cotton} seg={4} />
    </group>
  )
}

export function WaterFrame() {
  const m = mats()
  const wheel = useRef<Group>(null)
  const gears = useRef<(Group | null)[]>([])
  useFrame((_, delta) => {
    const turn = Math.min(delta, 0.1) * 0.7
    if (wheel.current) wheel.current.rotation.x += turn
    // Each gear turns at the speed its size gives it, alternating direction as they mesh.
    const ratios = [1, -2, 1.33, -2.6, -2.6]
    gears.current.forEach((g, i) => {
      if (g) g.rotation.x += turn * ratios[i]
    })
  })
  const cx = FRAME_X
  const posts: [number, number][] = [-0.55, 0, 0.55].flatMap((x) => [-1, 1].map((s): [number, number] => [cx + x, s * 0.29]))
  return (
    <group>
      {/* The oak frame: posts, rails along both sides, cross rails at the ends. */}
      {posts.map(([x, z]) => (
        <B key={`${x}${z}`} s={[0.07, 1.5, 0.07]} at={[x, 0.75, z]} m={m.oak} />
      ))}
      {[0.06, 0.43, 0.62, 1.02, 1.46].flatMap((y) =>
        [-1, 1].map((s) => <B key={`${y}${s}`} s={[1.17, y === 1.02 ? 0.08 : 0.06, 0.07]} at={[cx, y, s * 0.29]} m={m.oak} />),
      )}
      {[0.06, 0.62, 1.02, 1.46].flatMap((y) => [-1, 1].map((e) => <B key={`e${y}${e}`} s={[0.07, 0.06, 0.58]} at={[cx + e * 0.55, y, 0]} m={m.oak} />))}
      {/* Roller beams and the creel bars across the middle of the top. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <B s={[1.1, 0.03, 0.12]} at={[cx, 1.045, s * 0.2]} m={m.oak} />
          <B s={[1.1, 0.04, 0.04]} at={[cx, 1.455, s * 0.12]} m={m.oak} />
          <B s={[1.1, 0.03, 0.1]} at={[cx, 0.415, s * 0.21]} m={m.oak} />
          {HEADS.map((x) => (
            <SpinningHead key={x} x={cx + x} side={s} />
          ))}
        </group>
      ))}
      {/* The main shaft from the water wheel along the bottom, in its bearings. */}
      <C r={0.022} l={1.45} at={[cx - 0.38, 0.43, 0]} axis="x" m={m.castIron} seg={10} />
      {[cx - 0.55, cx + 0.55].map((x) => (
        <B key={x} s={[0.09, 0.07, 0.08]} at={[x, 0.43, 0]} m={m.castIron} />
      ))}
      {/* The gear train at the right end, up to the rollers. */}
      {(
        [
          [0.43, 0, 0.16, 30],
          [0.67, 0, 0.08, 15],
          [0.87, 0, 0.12, 22],
          [1.075, 0.21, 0.06, 12],
          [1.075, -0.21, 0.06, 12],
        ] as [number, number, number, number][]
      ).map(([y, z, r, teeth], i) => (
        <group key={i} position={[cx + 0.62, y, z]}>
          <Turning
            groupRef={(g: Group | null) => {
              gears.current[i] = g
            }}
          >
            <Gear r={r} teeth={teeth} thick={0.025} axis="x" m={m.castIron} />
          </Turning>
          <C r={0.018} l={0.06} at={[-0.02, 0, 0]} axis="x" m={m.steel} seg={10} />
        </group>
      ))}
      {/* The water wheel: two rims, spokes, floats (paddles), hub and axle. */}
      <group position={[-0.62, 0.43, 0]}>
        <Turning groupRef={wheel}>
          {[-0.07, 0.07].map((x) => (
            <group key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <mesh material={m.darkWood}>
                <torusGeometry args={[0.4, 0.022, 6, 40]} />
              </mesh>
              {Array.from({ length: 8 }, (_, i) => (
                <B key={i} s={[0.74, 0.028, 0.03]} r={[0, 0, (i / 8) * Math.PI]} at={[0, 0, 0]} m={m.darkWood} />
              ))}
            </group>
          ))}
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2
            return <B key={i} s={[0.17, 0.018, 0.11]} at={[0, Math.sin(a) * 0.39, Math.cos(a) * 0.39]} r={[-a, 0, 0]} m={m.darkWood} />
          })}
          <C r={0.07} l={0.2} at={[0, 0, 0]} axis="x" m={m.darkWood} seg={16} />
          <C r={0.03} l={0.32} at={[0, 0, 0]} axis="x" m={m.castIron} seg={10} />
        </Turning>
      </group>
      {/* Its two trestles, and the wooden flume bringing water onto the wheel. */}
      {[-0.78, -0.46].map((x) => (
        <group key={x}>
          <B s={[0.06, 0.45, 0.06]} at={[x, 0.225, 0]} m={m.oak} />
          <B s={[0.06, 0.05, 0.3]} at={[x, 0.025, 0]} m={m.oak} />
          <B s={[0.08, 0.06, 0.09]} at={[x, 0.43, 0]} m={m.castIron} />
        </group>
      ))}
      <group position={[-0.62, 0.9, -0.42]} rotation={[0.18, 0, 0]}>
        <B s={[0.2, 0.02, 0.52]} at={[0, -0.05, 0]} m={m.oak} />
        {[-1, 1].map((s) => (
          <B key={s} s={[0.02, 0.1, 0.52]} at={[s * 0.1, 0, 0]} m={m.oak} />
        ))}
        <B s={[0.17, 0.03, 0.5]} at={[0, -0.02, 0]} m={m.water} />
      </group>
      <B s={[0.15, 0.36, 0.02]} at={[-0.62, 0.69, -0.17]} r={[0.25, 0, 0]} m={m.water} />
      <B s={[0.06, 0.88, 0.06]} at={[-0.62, 0.44, -0.66]} m={m.oak} />
    </group>
  )
}

// =====================================================================================
// CORT'S PUDDLING FURNACE
// =====================================================================================

export function PuddlingFurnace() {
  const m = mats()
  // The brick of the arched roof and the chimney, with its picture repeated to keep the
  // bricks the right size on their curved surfaces.
  const roofBrick = useMemo(() => {
    const mat = m.brick.clone()
    const map = texture('brick').clone()
    map.repeat.set(2.4, 1.4)
    map.needsUpdate = true
    mat.map = map
    return mat
  }, [m.brick])
  const stackBrick = useMemo(() => {
    const mat = m.brick.clone()
    const map = texture('brick').clone()
    map.repeat.set(1.4, 5)
    map.needsUpdate = true
    mat.map = map
    return mat
  }, [m.brick])
  const front = 0.37
  return (
    <group>
      <B s={[1.56, 0.06, 0.84]} at={[0, 0.03, 0]} m={m.stone} />
      {/* Firebox (left), hearth under a low arch (middle), flue (right). */}
      <B s={[0.42, 0.78, 0.72]} at={[-0.51, 0.45, 0]} m={m.brick} tile={0.5} />
      <B s={[0.6, 0.55, 0.72]} at={[0, 0.335, 0]} m={m.brick} tile={0.5} />
      <mesh position={[0, 0.61, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.75, 1, 1]} material={roofBrick}>
        <cylinderGeometry args={[0.36, 0.36, 0.6, 24, 1, false, 0, Math.PI]} />
      </mesh>
      <B s={[0.42, 0.5, 0.72]} at={[0.51, 0.31, 0]} m={m.brick} tile={0.5} />
      {/* The chimney: a tapering square brick stack with iron bands and a damper. */}
      <mesh position={[0.52, 1.185, 0]} rotation={[0, Math.PI / 4, 0]} material={stackBrick}>
        <cylinderGeometry args={[0.17, 0.21, 1.25, 4, 1]} />
      </mesh>
      {[0.9, 1.3, 1.7].map((y) => {
        const r = 0.21 - ((y - 0.56) / 1.25) * 0.04
        return <Ring key={y} R={r} t={0.008} at={[0.52, y, 0]} m={m.darkIron} square />
      })}
      <B s={[0.28, 0.03, 0.28]} at={[0.52, 1.82, 0]} m={m.darkIron} />
      <B s={[0.22, 0.01, 0.22]} at={[0.54, 1.86, 0]} r={[0, 0, 0.35]} m={m.darkIron} />
      <Rod from={[0.66, 1.88, 0]} to={[0.8, 1.6, 0]} r={0.006} m={m.darkIron} />
      {/* Cast-iron buckstays on both faces, tied across by rods with nuts. */}
      {[-0.72, -0.31, 0, 0.31, 0.72].map((x) => {
        const h = x < -0.3 ? 0.86 : x > 0.5 ? 0.6 : 0.82
        return (
          <group key={x}>
            {[-1, 1].map((s) => (
              <group key={s} position={[x, 0.06 + h / 2, s * (front + 0.012)]}>
                <B s={[0.05, h, 0.012]} at={[0, 0, s * 0.012]} m={m.castIron} />
                <B s={[0.014, h, 0.024]} at={[0, 0, 0]} m={m.castIron} />
              </group>
            ))}
            <C r={0.008} l={0.84} at={[x, 0.06 + h - 0.03, 0]} axis="z" m={m.darkIron} seg={6} />
            {[-1, 1].map((s) => (
              <B key={s} s={[0.03, 0.03, 0.02]} at={[x, 0.06 + h - 0.03, s * 0.415]} m={m.darkIron} />
            ))}
          </group>
        )
      })}
      {[-1, 1].map((s) => (
        <C key={s} r={0.007} l={1.48} at={[0, 0.72, s * 0.41]} axis="x" m={m.darkIron} seg={6} />
      ))}
      {/* The working door, its glowing stopper hole, and the counterweighted lever that
          lifts it. */}
      <B s={[0.32, 0.3, 0.03]} at={[0, 0.37, front + 0.01]} m={m.darkIron} />
      <B s={[0.25, 0.23, 0.025]} at={[0, 0.37, front + 0.035]} m={m.castIron} />
      <B s={[0.06, 0.045, 0.01]} at={[0, 0.285, front + 0.049]} m={m.molten} />
      <B s={[0.25, 0.008, 0.01]} at={[0, 0.255, front + 0.04]} m={m.ember} />
      <C r={0.012} l={0.78} at={[0.2, 0.55, front + 0.06]} m={m.darkIron} seg={8} />
      <B s={[0.5, 0.025, 0.025]} at={[0.08, 0.95, front + 0.06]} r={[0, 0, -0.06]} m={m.darkIron} />
      <C r={0.04} l={0.09} at={[0.32, 0.9, front + 0.06]} m={m.castIron} seg={14} />
      <Rod from={[-0.12, 0.96, front + 0.06]} to={[0, 0.49, front + 0.05]} r={0.004} m={m.darkIron} />
      {/* The fire door at the firebox, glowing at its edges, and the grate below. */}
      <B s={[0.2, 0.18, 0.025]} at={[-0.51, 0.47, front + 0.012]} m={m.castIron} />
      <B s={[0.21, 0.01, 0.01]} at={[-0.51, 0.375, front + 0.01]} m={m.ember} />
      <C r={0.008} l={0.08} at={[-0.43, 0.47, front + 0.04]} axis="x" m={m.darkIron} seg={6} />
      <B s={[0.24, 0.1, 0.01]} at={[-0.51, 0.16, front + 0.002]} m={m.ember} />
      {Array.from({ length: 6 }, (_, i) => (
        <B key={i} s={[0.012, 0.1, 0.015]} at={[-0.6 + i * 0.036, 0.16, front + 0.008]} m={m.darkIron} />
      ))}
      {/* The rabble: the long iron rod the puddler stirred the iron with, in the hole. */}
      <Rod from={[0.02, 0.285, front + 0.04]} to={[0.62, 0.78, 0.66]} r={0.009} m={m.darkIron} />
      <Rod from={[0.56, 0.84, 0.62]} to={[0.68, 0.72, 0.7]} r={0.01} m={m.darkIron} />
      {/* A glowing ball ("bloom") of puddled iron on an iron plate, with tongs. */}
      <B s={[0.3, 0.02, 0.24]} at={[0.42, 0.07, 0.6]} m={m.darkIron} />
      <mesh position={[0.42, 0.135, 0.6]} scale={[1, 0.8, 1]} material={m.molten}>
        <icosahedronGeometry args={[0.07, 1]} />
      </mesh>
      <Rod from={[0.45, 0.14, 0.56]} to={[0.7, 0.32, 0.35]} r={0.006} m={m.darkIron} />
      <Rod from={[0.45, 0.14, 0.64]} to={[0.72, 0.3, 0.4]} r={0.006} m={m.darkIron} />
      {/* Finished puddled bars, and coal for the fire. */}
      {[0, 1, 2, 3, 4].map((i) => (
        <B key={i} s={[0.55, 0.035, 0.035]} at={[0.15, 0.078 + Math.floor(i / 3) * 0.036, -0.52 + (i % 3) * 0.04 + Math.floor(i / 3) * 0.02]} m={m.darkIron} />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = i * 2.4
        const rr = 0.02 + (i % 4) * 0.02
        return (
          <mesh key={i} position={[-0.62 + Math.cos(a) * rr, 0.08 + (i % 3) * 0.015, 0.55 + Math.sin(a) * rr]} rotation={[a, a * 0.7, 0]} material={m.coal}>
            <dodecahedronGeometry args={[0.025 + (i % 3) * 0.008, 0]} />
          </mesh>
        )
      })}
    </group>
  )
}

// =====================================================================================
// THE BESSEMER CONVERTER
// =====================================================================================

// The vessel's outline from bottom to mouth (radius, height from the trunnions).
const VESSEL: [number, number][] = [
  [0.001, -0.62],
  [0.2, -0.62],
  [0.27, -0.58],
  [0.33, -0.45],
  [0.36, -0.25],
  [0.365, -0.05],
  [0.36, 0.12],
  [0.33, 0.28],
  [0.27, 0.42],
  [0.2, 0.52],
  [0.155, 0.6],
  [0.14, 0.66],
  [0.105, 0.66],
  [0.105, 0.56],
]
const vesselRadius = (y: number) => {
  for (let i = 1; i < 11; i++) {
    const [r0, y0] = VESSEL[i]
    const [r1, y1] = VESSEL[i + 1]
    if (y >= y0 && y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
  }
  return 0.3
}

export function BessemerConverter() {
  const m = mats()
  const vessel = useRef<Group>(null)
  const flame = useRef<Group>(null)
  const lathe = useMemo(() => cached('vessel', () => new LatheGeometry(VESSEL.map(([r, y]) => new Vector2(r, y)), 36)), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // The vessel tips slowly back and forth on its trunnions, the flame flickering.
    if (vessel.current) vessel.current.rotation.z = -0.25 + Math.sin(t * 0.35) * 0.12
    if (flame.current) {
      const f = 1 + Math.sin(t * 17) * 0.06 + Math.sin(t * 7.3) * 0.08
      flame.current.scale.set(1 + Math.sin(t * 11) * 0.05, f, 1 + Math.cos(t * 9) * 0.05)
    }
  })
  const axisY = 0.98
  const bands = [-0.5, -0.3, 0.2, 0.38]
  return (
    <group>
      <B s={[1.3, 0.06, 1.24]} at={[0, 0.03, 0]} m={m.stone} />
      {/* Two cast-iron standards carrying the trunnions. */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * 0.52]}>
          <B s={[0.44, 0.04, 0.22]} at={[0, 0.08, 0]} m={m.castIron} />
          {[-1, 1].map((k) => (
            <B key={k} s={[0.07, 0.8, 0.09]} at={[k * 0.11, 0.49, 0]} r={[0, 0, k * 0.15]} m={m.castIron} />
          ))}
          <B s={[0.28, 0.05, 0.08]} at={[0, 0.42, 0]} m={m.castIron} />
          <B s={[0.24, 0.12, 0.16]} at={[0, 0.9, 0]} m={m.castIron} />
          <mesh position={[0, axisY, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.brass}>
            <cylinderGeometry args={[0.075, 0.075, 0.15, 18, 1, false, Math.PI / 2, Math.PI]} />
          </mesh>
          {[-1, 1].map((k) => (
            <C key={k} r={0.012} l={0.06} at={[k * 0.1, 0.97, 0]} m={m.darkIron} seg={6} />
          ))}
        </group>
      ))}
      {/* The blast main rising to the hollow trunnion, with its valve wheel. */}
      <C r={0.05} l={0.86} at={[0, 0.5, -0.7]} m={m.castIron} seg={14} />
      <Tube points={[[0, 0.92, -0.7], [0, 0.98, -0.69], [0, axisY, -0.62]]} r={0.05} m={m.castIron} />
      <group position={[0.07, 0.5, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <Ring R={0.06} t={0.008} m={m.darkIron} seg={20} />
        <C r={0.006} l={0.12} at={[0, 0, 0]} axis="x" m={m.darkIron} seg={6} />
        <C r={0.006} l={0.12} at={[0, 0, 0]} axis="z" m={m.darkIron} seg={6} />
      </group>
      {/* The rack and hydraulic ram that turn the toothed wheel to tip the vessel. */}
      <B s={[0.04, 0.85, 0.05]} at={[0.28, 0.98, 0.68]} m={m.darkIron} />
      {Array.from({ length: 14 }, (_, i) => (
        <B key={i} s={[0.025, 0.025, 0.05]} at={[0.252, 0.62 + i * 0.055, 0.68]} m={m.darkIron} />
      ))}
      <C r={0.055} l={0.5} at={[0.28, 0.33, 0.68]} m={m.castIron} seg={14} />
      <C r={0.022} l={0.2} at={[0.28, 0.62, 0.68]} m={m.steel} seg={10} />
      {/* THE VESSEL, turning about the trunnions. */}
      <group position={[0, axisY, 0]}>
        <Turning groupRef={vessel}>
          <mesh geometry={lathe} material={m.castIron} />
          {/* Riveted seams between its plates. */}
          {bands.map((y) => {
            const r = vesselRadius(y)
            return (
              <group key={y}>
                <Ring R={r} t={0.01} y={y} m={m.darkIron} seg={36} />
                {Array.from({ length: 22 }, (_, i) => {
                  const a = (i / 22) * Math.PI * 2
                  return (
                    <mesh key={i} position={[Math.cos(a) * (r + 0.014), y, Math.sin(a) * (r + 0.014)]} material={m.darkIron}>
                      <sphereGeometry args={[0.009, 5, 3]} />
                    </mesh>
                  )
                })}
              </group>
            )
          })}
          {/* The trunnion belt, the two trunnions and the toothed wheel. */}
          <C r={0.385} l={0.12} at={[0, 0, 0]} m={m.darkIron} seg={36} />
          <C r={0.065} l={0.24} at={[0, 0, 0.47]} axis="z" m={m.steel} seg={14} />
          <C r={0.065} l={0.24} at={[0, 0, -0.47]} axis="z" m={m.steel} seg={14} />
          <Gear r={0.24} teeth={28} thick={0.05} at={[0, 0, 0.68]} m={m.darkIron} />
          {/* The wind box under the bottom and the blast pipe from the hollow trunnion. */}
          <C r={0.22} l={0.1} at={[0, -0.67, 0]} m={m.darkIron} seg={28} />
          <Tube points={[[0, 0, -0.58], [0, -0.12, -0.44], [0, -0.45, -0.4], [0, -0.66, -0.26], [0, -0.7, -0.14]]} r={0.035} m={m.castIron} />
          {/* The glowing mouth. */}
          <C r={0.106} l={0.02} at={[0, 0.645, 0]} m={m.molten} seg={20} />
        </Turning>
        {/* The flame, tipping with the vessel (outside its joined pieces: it flickers). */}
        <Follow target={vessel} axis="z">
          <group ref={flame} position={[0, 0.66, 0]} userData={{ keepSeparate: true }}>
            <C r={0.15} r2={0.03} l={0.75} at={[0, 0.37, 0]} m={m.flameOuter} seg={16} />
            <C r={0.1} r2={0.015} l={0.52} at={[0, 0.26, 0]} m={m.flame} seg={14} />
            <C r={0.055} r2={0.008} l={0.3} at={[0, 0.15, 0]} m={m.flameCore} seg={10} />
          </group>
        </Follow>
      </group>
    </group>
  )
}

// =====================================================================================
// TESLA'S INDUCTION MOTOR (1888)
// =====================================================================================

// An annulus (ring) or an arc of one, given thickness along Z.
function arcGeometry(outer: number, inner: number, from: number, to: number, depth: number): BufferGeometry {
  return cached(`a${outer}|${inner}|${from}|${to}|${depth}`, () => {
    const shape = new Shape()
    const full = to - from >= Math.PI * 2 - 0.001
    if (full) {
      shape.absarc(0, 0, outer, 0, Math.PI * 2, false)
      const hole = new Path()
      hole.absarc(0, 0, inner, 0, Math.PI * 2, true)
      shape.holes.push(hole)
    } else {
      shape.absarc(0, 0, outer, from, to, false)
      shape.absarc(0, 0, inner, to, from, true)
      shape.closePath()
    }
    const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 24 })
    g.translate(0, 0, -depth / 2)
    // (The copper winding's stripes run across the ring, as the wire wraps around it.)
    const uv = g.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6, uv.getY(i) * 6)
    return g
  })
}

export function InductionMotor() {
  const m = mats()
  const rotor = useRef<Group>(null)
  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.x += Math.min(delta, 0.1) * 3
  })
  const y = 0.48
  return (
    <group>
      {/* The cast-iron bed on four feet. */}
      <B s={[1.0, 0.07, 0.5]} at={[0, 0.075, 0]} m={m.castIron} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`}>
            <B s={[0.13, 0.04, 0.11]} at={[sx * 0.43, 0.02, sz * 0.2]} m={m.castIron} />
            <C r={0.014} l={0.03} at={[sx * 0.45, 0.12, sz * 0.21]} m={m.darkIron} seg={6} />
          </group>
        )),
      )}
      {/* The stator: a ring of thin iron sheets with four coils of copper wire wound on it,
          held by two cast brackets. */}
      <group position={[0, y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={arcGeometry(0.36, 0.265, 0, Math.PI * 2, 0.12)} material={m.lamination} />
        {[0.25, 0.75, 1.25, 1.75].map((k) => (
          <mesh key={k} geometry={arcGeometry(0.385, 0.24, (k - 0.15) * Math.PI, (k + 0.15) * Math.PI, 0.17)} material={m.winding} />
        ))}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8
          return <C key={i} r={0.01} l={0.13} at={[Math.cos(a) * 0.335, Math.sin(a) * 0.335, 0]} axis="z" m={m.darkIron} seg={6} />
        })}
      </group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <B s={[0.1, 0.07, 0.36]} at={[s * 0.04, 0.14, 0]} m={m.castIron} />
          <B s={[0.08, 0.2, 0.06]} at={[s * 0.04, 0.27, s * 0.13]} r={[s * 0.35, 0, 0]} m={m.castIron} />
        </group>
      ))}
      {/* The two bearing pedestals, with brass caps and oil cups. */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.38, 0, 0]}>
          <mesh position={[0, 0.27, 0]} rotation={[0, Math.PI / 4, 0]} material={m.castIron}>
            <cylinderGeometry args={[0.075, 0.12, 0.32, 4, 1]} />
          </mesh>
          <C r={0.05} l={0.1} at={[0, y, 0]} axis="x" m={m.castIron} seg={16} />
          <mesh position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} material={m.brass}>
            <cylinderGeometry args={[0.056, 0.056, 0.08, 16, 1, false, 0, Math.PI]} />
          </mesh>
          <C r={0.014} l={0.04} at={[0, y + 0.075, 0]} m={m.brass} seg={10} />
          <C r={0.02} l={0.01} at={[0, y + 0.098, 0]} m={m.brass} seg={10} />
        </group>
      ))}
      {/* The rotor, shaft and pulley, turning. */}
      <group position={[0, y, 0]}>
        <Turning groupRef={rotor}>
          <C r={0.232} l={0.11} at={[0, 0, 0]} axis="x" m={m.lamination} seg={32} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2
            return <B key={i} s={[0.115, 0.016, 0.012]} at={[0, Math.cos(a) * 0.233, Math.sin(a) * 0.233]} r={[a, 0, 0]} m={m.copper} />
          })}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.058, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <mesh material={m.copper}>
                <torusGeometry args={[0.21, 0.014, 6, 32]} />
              </mesh>
            </group>
          ))}
          <C r={0.022} l={0.98} at={[0, 0, 0]} axis="x" m={m.steel} seg={12} />
          <C r={0.085} l={0.07} at={[0.47, 0, 0]} axis="x" m={m.castIron} seg={24} />
          {[-1, 1].map((s) => (
            <C key={s} r={0.093} l={0.008} at={[0.47 + s * 0.035, 0, 0]} axis="x" m={m.castIron} seg={24} />
          ))}
        </Turning>
      </group>
      {/* The terminal board with brass binding posts, and the wires to the coils. */}
      <B s={[0.2, 0.04, 0.12]} at={[-0.22, 0.13, 0.17]} m={m.darkWood} />
      {[0, 1, 2, 3].map((i) => {
        const x = -0.29 + i * 0.045
        const coil: V3 = [i < 2 ? -0.06 : 0.06, i % 2 ? y + 0.22 : y - 0.22, i % 2 ? 0.2 : 0.24]
        return (
          <group key={i}>
            <C r={0.01} l={0.04} at={[x, 0.17, 0.17]} m={m.brass} seg={8} />
            <C r={0.016} l={0.012} at={[x, 0.195, 0.17]} m={m.brass} seg={10} />
            <Tube points={[[x, 0.2, 0.17], [x, 0.32, 0.22], [coil[0] * 0.5, coil[1] - 0.05, coil[2] + 0.04], coil]} r={0.004} m={m.copper} />
          </group>
        )
      })}
    </group>
  )
}

// =====================================================================================
// THE UNIMATE (1961)
// =====================================================================================

// The maker's nameplate, painted once.
let nameplate: Texture | null = null
function nameplateTexture(): Texture {
  nameplate ??= canvasTexture(256, (ctx, n) => {
    ctx.fillStyle = '#d9dcdf'
    ctx.fillRect(0, 0, n, n)
    ctx.fillStyle = '#1d2a3a'
    ctx.font = `700 ${n * 0.2}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('UNIMATE', n / 2, n / 2)
  })
  return nameplate
}

export function Unimate() {
  const m = mats()
  const turret = useRef<Group>(null)
  const boom = useRef<Group>(null)
  const arm = useRef<Group>(null)
  const plate = useMemo(() => new MeshStandardMaterial({ map: nameplateTexture(), roughness: 0.4, metalness: 0.3 }), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.5
    // Swinging round, dipping the boom and reaching out with the arm, like unloading parts
    // from a die-casting machine.
    if (turret.current) turret.current.rotation.y = Math.sin(t) * 0.55
    if (boom.current) boom.current.rotation.z = Math.sin(t + 1) * 0.07
    if (arm.current) arm.current.position.x = 0.5 + (Math.sin(t * 2 + 2) * 0.5 + 0.5) * 0.18
  })
  const top = 0.62
  return (
    <group>
      {/* The cabinet base on levelling feet: kick plate, top plate, panel seams. */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[-0.15 + sx * 0.45, 0, sz * 0.26]}>
            <C r={0.035} l={0.015} at={[0, 0.008, 0]} m={m.rubber} seg={12} />
            <C r={0.012} l={0.04} at={[0, 0.03, 0]} m={m.steel} seg={8} />
          </group>
        )),
      )}
      <B s={[1.0, 0.56, 0.6]} at={[-0.15, 0.33, 0]} m={m.paint} />
      <B s={[1.01, 0.06, 0.61]} at={[-0.15, 0.08, 0]} m={m.paintDark} />
      <B s={[1.02, 0.03, 0.62]} at={[-0.15, top - 0.015, 0]} m={m.paintDark} />
      {[-0.4, 0.1].flatMap((x) =>
        [-1, 1].map((s) => <B key={`${x}${s}`} s={[0.006, 0.42, 0.006]} at={[x, 0.36, s * 0.302]} m={m.paintDark} />),
      )}
      {/* The front: nameplate, louvred vents, and the control panel with buttons. */}
      <mesh position={[-0.38, 0.5, 0.302]} material={plate}>
        <planeGeometry args={[0.24, 0.06]} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <B key={i} s={[0.24, 0.008, 0.008]} at={[-0.38, 0.22 + i * 0.022, 0.302]} m={m.paintDark} />
      ))}
      <B s={[0.3, 0.24, 0.012]} at={[0.15, 0.42, 0.303]} m={m.panel} />
      {[m.ledGreen, m.ledAmber, m.ledRed].map((mat, i) => (
        <C key={i} r={0.013} l={0.012} at={[0.05 + i * 0.05, 0.49, 0.312]} axis="z" m={mat} seg={12} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <C key={i} r={0.011} l={0.014} at={[0.04 + i * 0.045, 0.42, 0.312]} axis="z" m={i === 3 ? m.ledRed : m.dial} seg={10} />
      ))}
      <C r={0.035} l={0.01} at={[0.24, 0.36, 0.312]} axis="z" m={m.dial} seg={20} />
      <B s={[0.004, 0.028, 0.004]} at={[0.24, 0.37, 0.318]} r={[0, 0, -0.6]} m={m.rubber} />
      {/* THE TURRET, swinging round on its turntable. */}
      <group position={[-0.38, top, 0]}>
        <Turning groupRef={turret}>
          <C r={0.23} l={0.06} at={[0, 0.03, 0]} m={m.paintDark} seg={32} />
          <B s={[0.34, 0.26, 0.32]} at={[0, 0.19, 0]} m={m.paint} />
          <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.paint}>
            <cylinderGeometry args={[0.17, 0.17, 0.32, 24, 1, false, Math.PI / 2, Math.PI]} />
          </mesh>
          {/* Hydraulic hoses curving down the back of the turret. */}
          <Tube points={[[-0.17, 0.3, 0.08], [-0.24, 0.2, 0.1], [-0.22, 0.04, 0.12], [-0.12, 0.0, 0.14]]} r={0.012} m={m.rubber} />
          <Tube points={[[-0.17, 0.28, -0.08], [-0.25, 0.18, -0.1], [-0.22, 0.03, -0.12], [-0.12, 0.0, -0.14]]} r={0.012} m={m.rubber} />
        </Turning>
        {/* THE BOOM, dipping at the shoulder (it turns with the turret: placed in a group
            that copies the turret's swing each frame, below). */}
        <Follow target={turret} axis="y">
          <group position={[0, 0.34, 0]}>
            <Turning groupRef={boom}>
              <B s={[0.62, 0.15, 0.15]} at={[0.3, 0, 0]} m={m.paint} />
              <B s={[0.16, 0.18, 0.17]} at={[-0.08, 0, 0]} m={m.paintDark} />
              <C r={0.05} l={0.36} at={[0, 0, 0]} axis="z" m={m.steel} seg={16} />
              {[-1, 1].map((s) => (
                <C key={s} r={0.07} l={0.02} at={[0, 0, s * 0.17]} axis="z" m={m.paintDark} seg={18} />
              ))}
              <Tube points={[[0.02, 0.08, 0.04], [0.25, 0.1, 0.04], [0.5, 0.09, 0.04], [0.6, 0.08, 0.04]]} r={0.01} m={m.rubber} />
              <C r={0.025} l={0.3} at={[0.18, -0.12, 0]} rot={[0, 0, 1.2]} m={m.steel} seg={10} />
              <C r={0.035} l={0.2} at={[0.05, -0.16, 0]} rot={[0, 0, 1.2]} m={m.paintDark} seg={12} />
            </Turning>
            <Follow target={boom} axis="z">
              {/* The telescoping arm, sliding out of the boom, with the wrist and gripper. */}
              <group ref={arm} position={[0.5, 0, 0]} userData={{ keepSeparate: true }}>
                <MergeStatic>
                  <B s={[0.5, 0.1, 0.1]} at={[0.05, 0, 0]} m={m.steel} />
                  <C r={0.058} l={0.08} at={[0.34, 0, 0]} axis="x" m={m.paintDark} seg={18} />
                  <B s={[0.08, 0.11, 0.11]} at={[0.41, 0, 0]} m={m.paintDark} />
                  <B s={[0.03, 0.12, 0.08]} at={[0.46, 0, 0]} m={m.steel} />
                  {[-1, 1].map((s) => (
                    <group key={s}>
                      <B s={[0.12, 0.02, 0.035]} at={[0.53, s * 0.045, 0]} m={m.steel} />
                      <B s={[0.03, 0.022, 0.04]} at={[0.58, s * 0.032, 0]} m={m.rubber} />
                    </group>
                  ))}
                  {/* A die-cast part held in the gripper. */}
                  <B s={[0.06, 0.04, 0.09]} at={[0.58, 0, 0]} m={m.castIron} />
                </MergeStatic>
              </group>
            </Follow>
          </group>
        </Follow>
      </group>
    </group>
  )
}

// A group that copies another group's turn each frame, so a moving part can carry further
// moving parts (each joined separately).
function Follow({ target, axis, children }: { target: RefObject<Group | null>; axis: 'y' | 'z'; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (ref.current && target.current) ref.current.rotation[axis] = target.current.rotation[axis]
  })
  return (
    <group ref={ref} userData={{ keepSeparate: true }}>
      {children}
    </group>
  )
}
