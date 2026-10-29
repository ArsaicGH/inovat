import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  LatheGeometry,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  QuadraticBezierCurve3,
  RepeatWrapping,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Curve,
  type Group,
  type InstancedMesh,
  type Material,
  type Mesh,
  type Points,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { repeated, useSurfaceTextures, type SurfaceName } from './textures'
import EraNumeral from './EraNumeral'
import Invention, { ModelCopy } from './inventions'
import { RAIL_TOP, RAIL_Z, ROAD_Z, carX, film, filmSet, fireLevel, lineLamp, locoX, printed, since, smooth, START, streetLamp, streetWindows, welding } from './ending-shots'

// THE ENDING FILM'S SETS (script in ending-shots.ts, played by EndingScene.tsx): one set per
// era, built from simple shapes, with working machines and people, lit by the film's
// borrowed lights. Like film-studio sets they have no roofs and open fronts, so the last
// shot can look down on all four side by side.

type V3 = [number, number, number]

// ---------- Materials and pictures, shared by all sets ----------
// Made when the film starts and freed when it ends (disposePalette).

function paint(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, wrap = false) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d')!, width, height)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  if (wrap) texture.wrapS = texture.wrapT = RepeatWrapping
  return texture
}

// A repeatable pseudo-random sequence, so the painted pictures are the same every time.
function seeded(seed: number) {
  return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
}

function makePalette() {
  const made: { dispose(): void }[] = []
  const keep = <T extends { dispose(): void }>(thing: T) => {
    made.push(thing)
    return thing
  }
  const std = (color: string, roughness = 0.7, metalness = 0) => keep(new MeshStandardMaterial({ color, roughness, metalness }))
  // Light sources: brighter than white, so the bloom makes them glow.
  const glow = (color: string, strength: number, map?: CanvasTexture) => {
    const m = keep(new MeshBasicMaterial({ color, map, toneMapped: false }))
    m.color.multiplyScalar(strength)
    return m
  }

  const tex = {
    dot: keep(paint(64, 64, (c, w) => {
      const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.45, 'rgba(255,255,255,0.4)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = g
      c.fillRect(0, 0, w, w)
    })),
    // Light falling through a window: bright at the window, fading into the room.
    shaft: keep(paint(4, 64, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, 'rgba(255,255,255,0.9)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = g
      c.fillRect(0, 0, w, h)
    })),
    // A city façade: brick with a 4 x 4 grid of windows (and which of them are lit).
    facade: keep(paint(128, 128, (c) => {
      c.fillStyle = '#6d4636'
      c.fillRect(0, 0, 128, 128)
      c.fillStyle = '#1a1c24'
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) c.fillRect(8 + x * 32, 6 + y * 32, 16, 20)
    }, true)),
    lit: keep(paint(128, 128, (c) => {
      const r = seeded(7)
      c.fillStyle = '#000'
      c.fillRect(0, 0, 128, 128)
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          if (r() < 0.3) continue
          c.fillStyle = r() < 0.5 ? '#ffd9a0' : '#ffe8c0'
          c.fillRect(8 + x * 32, 6 + y * 32, 16, 20)
        }
    }, true)),
    // Indicator lamps on computer cabinets (scrolled in steps to blink).
    leds: keep(paint(32, 64, (c) => {
      const r = seeded(3)
      c.fillStyle = '#0b0c0e'
      c.fillRect(0, 0, 32, 64)
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 8; x++) {
          if (r() < 0.55) continue
          c.fillStyle = ['#ff5040', '#ffd060', '#60ff80', '#ffffff'][Math.floor(r() * 4)]
          c.fillRect(1 + x * 4, 1 + y * 4, 2, 2)
        }
    }, true)),
    // Text on a terminal: green (computer room) and amber (robot cell).
    crt: keep(paint(128, 96, (c) => {
      const r = seeded(11)
      c.fillStyle = '#04140a'
      c.fillRect(0, 0, 128, 96)
      c.fillStyle = '#7dffa0'
      for (let y = 0; y < 11; y++) c.fillRect(8, 8 + y * 7.5, 20 + r() * 90, 3)
    })),
    amber: keep(paint(128, 96, (c) => {
      const r = seeded(5)
      c.fillStyle = '#140c02'
      c.fillRect(0, 0, 128, 96)
      c.fillStyle = '#ffb347'
      for (let y = 0; y < 11; y++) c.fillRect(8 + (y % 3) * 6, 8 + y * 7.5, 16 + r() * 80, 3)
    })),
    // An early graphical desktop: windows on a blue screen.
    gui: keep(paint(128, 96, (c) => {
      c.fillStyle = '#2a5d8a'
      c.fillRect(0, 0, 128, 96)
      c.fillStyle = '#d8d8d8'
      c.fillRect(14, 12, 70, 50)
      c.fillRect(48, 34, 66, 48)
      c.fillStyle = '#1c3c78'
      c.fillRect(14, 12, 70, 6)
      c.fillRect(48, 34, 66, 6)
      c.fillStyle = '#c0c0c0'
      c.fillRect(0, 88, 128, 8)
    })),
    // The factory's live dashboard (CMCN 4): restrained white and cyan lines on dark navy.
    dashboard: keep(paint(256, 112, (c) => {
      const r = seeded(19)
      c.fillStyle = '#0c1624'
      c.fillRect(0, 0, 256, 112)
      c.strokeStyle = 'rgba(160, 200, 230, 0.35)'
      c.lineWidth = 1
      for (const [x, y, w, h] of [[8, 8, 116, 46], [132, 8, 116, 46], [8, 60, 240, 44]]) c.strokeRect(x, y, w, h)
      c.strokeStyle = '#7fe6f2'
      c.lineWidth = 2
      for (const [x0, y0, w, h] of [[10, 10, 112, 42], [10, 62, 236, 40]]) {
        c.beginPath()
        for (let i = 0; i <= 24; i++) c.lineTo(x0 + (i / 24) * w, y0 + h * (0.25 + 0.5 * r()))
        c.stroke()
      }
      c.fillStyle = '#e8f2f8'
      for (let i = 0; i < 6; i++) c.fillRect(140 + i * 18, 50 - 8 - r() * 32, 10, 8 + r() * 32)
    })),
    // The digital twin's live graph (scrolls sideways as data arrives).
    graph: keep(paint(256, 64, (c) => {
      c.fillStyle = '#0a1420'
      c.fillRect(0, 0, 256, 64)
      c.strokeStyle = '#7fe6f2'
      c.lineWidth = 2
      c.beginPath()
      for (let i = 0; i <= 64; i++) c.lineTo(i * 4, 32 + Math.sin(i * 0.39) * 12 + Math.sin(i * 1.3) * 5)
      c.stroke()
    }, true)),
    // The microprocessor's die: a dense maze of metal tracks on silicon.
    circuit: keep(paint(256, 256, (c) => {
      const r = seeded(29)
      c.fillStyle = '#2b2533'
      c.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 220; i++) {
        c.fillStyle = r() < 0.6 ? '#b8a27a' : '#6f8a9a'
        const x = Math.floor(r() * 32) * 8
        const y = Math.floor(r() * 32) * 8
        if (r() < 0.5) c.fillRect(x, y, 8 + Math.floor(r() * 10) * 8, 2)
        else c.fillRect(x, y, 2, 8 + Math.floor(r() * 10) * 8)
      }
      c.fillStyle = '#d8c08a'
      for (let i = 0; i < 16; i++) {
        c.fillRect(4 + i * 15.5, 2, 8, 8)
        c.fillRect(4 + i * 15.5, 246, 8, 8)
      }
    })),
    // Signals running along the die's tracks (scrolled over it).
    pulses: keep(paint(256, 256, (c) => {
      const r = seeded(31)
      c.fillStyle = '#000'
      c.fillRect(0, 0, 256, 256)
      c.fillStyle = '#9ff4ff'
      for (let i = 0; i < 40; i++) c.fillRect(Math.floor(r() * 32) * 8, Math.floor(r() * 32) * 8, 10, 2)
    }, true)),
    // A 3D print's layers.
    layers: keep(paint(4, 16, (c) => {
      for (let y = 0; y < 16; y++) {
        c.fillStyle = y % 2 ? '#c9ced3' : '#e9edf0'
        c.fillRect(0, y, 4, 1)
      }
    }, true)),
    // The timeline across the back of the finale: amber, gold, green, cyan, as the era numbers.
    ribbon: keep(paint(512, 4, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, w, 0)
      ;['#e0a050', '#ffd36a', '#6be08b', '#3fd0e0'].forEach((colour, i) => g.addColorStop(0.08 + i * 0.28, colour))
      c.fillStyle = g
      c.fillRect(0, 0, w, h)
    })),
  }
  tex.layers.repeat.set(1, 30)

  const m = {
    iron: std('#2e2c2b', 0.5, 0.75),
    darkIron: std('#1b1a19', 0.6, 0.6),
    brass: std('#b9914f', 0.32, 0.9),
    copper: std('#b8703f', 0.38, 0.85),
    timber: std('#5b3f29', 0.85),
    timberLight: std('#9a7a56', 0.7),
    stone: std('#6f6a63', 0.9),
    brick: std('#7d4a35', 0.9),
    soot: std('#171412', 0.95),
    locoGreen: std('#1f4430', 0.45, 0.3),
    red: std('#7a2018', 0.5, 0.25),
    cotton: std('#e8e2d4', 0.95),
    machineGreen: std('#36493c', 0.55, 0.35),
    marble: std('#e6e1d8', 0.3),
    enamel: std('#0e0e10', 0.25, 0.4),
    cream: std('#dcd3bd', 0.55),
    grey: std('#8c9096', 0.5, 0.3),
    wallWhite: std('#d9dad6', 0.85),
    tapeDark: std('#1d1f22', 0.4, 0.2),
    robotOrange: std('#e2661c', 0.42, 0.15),
    primer: std('#9aa0a6', 0.6, 0.2),
    white: std('#eceef0', 0.4),
    satin: std('#c9ced3', 0.3, 0.8),
    cobotBlue: std('#2d78c8', 0.35, 0.2),
    yellow: std('#d6b22a', 0.6),
    asphalt: std('#2b2d30', 0.9),
    grass: std('#55624a', 1),
    carpet: std('#4a4f58', 1),
    ceramic: std('#e9e4da', 0.45),
    gold: std('#d4a84a', 0.3, 1),
    solar: std('#1d2c46', 0.25, 0.5),
    plinth: std('#16130f', 0.35, 0.2),
    blackGloss: std('#0c0d10', 0.25, 0.4),
    glass: keep(new MeshStandardMaterial({ color: '#b8d4e0', roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false })),
    skin: std('#c3926e', 0.8),
    fire: glow('#ff6a1a', 1),
    window: glow('#bccbe0', 1.1),
    dusk: glow('#6f84a8', 0.7),
    daylight: glow('#e8f4ff', 1.25),
    tube: glow('#f2f6ff', 1.6),
    headlamp: glow('#fff1cf', 4),
    bulb: glow('#ffd590', 3),
    led: glow('#ff4030', 2.2),
    cyan: glow('#56dff0', 1.6),
    nozzle: glow('#ffb347', 2.5),
    crt: glow('#ffffff', 1.3, tex.crt),
    amberScreen: glow('#ffffff', 1.2, tex.amber),
    gui: glow('#ffffff', 1.1, tex.gui),
    dash: glow('#ffffff', 1.05, tex.dashboard),
    graph: glow('#ffffff', 1.1, tex.graph),
    leds: glow('#ffffff', 1.5, tex.leds),
    tablet: glow('#cfeaff', 1.2),
    facade: keep(new MeshStandardMaterial({ map: tex.facade, roughness: 0.9 })),
    print: keep(new MeshStandardMaterial({ map: tex.layers, roughness: 0.55 })),
    die: keep(new MeshStandardMaterial({ map: tex.circuit, roughness: 0.35, metalness: 0.5, emissive: '#ffffff', emissiveMap: tex.circuit, emissiveIntensity: 0.12 })),
    diePulse: keep(new MeshBasicMaterial({ map: tex.pulses, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false })),
    wire: keep(new MeshBasicMaterial({ color: new Color('#56dff0').multiplyScalar(1.4), wireframe: true, toneMapped: false })),
    steam: keep(new MeshBasicMaterial({ map: tex.dot, transparent: true, blending: AdditiveBlending, depthWrite: false })),
    smoke: keep(new MeshBasicMaterial({ map: tex.dot, transparent: true, opacity: 0.5, depthWrite: false })),
    shaft: keep(new MeshBasicMaterial({ map: tex.shaft, color: '#a9bddc', transparent: true, opacity: 0.07, blending: AdditiveBlending, depthWrite: false, side: DoubleSide })),
    pulse: glow('#9ff4ff', 2.2),
    link: keep(new MeshBasicMaterial({ color: '#56dff0', transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false })),
    ribbon: keep(new MeshBasicMaterial({ map: tex.ribbon, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false })),
  }
  // Flat panels lie just in front of walls and cases: pulled towards the camera when drawn,
  // so they never flicker against the surface behind them (seen from far away in the finale).
  for (const panel of [m.window, m.dusk, m.daylight, m.fire, m.crt, m.amberScreen, m.gui, m.dash, m.graph, m.leds, m.tube, m.die, m.diePulse]) {
    panel.polygonOffset = true
    panel.polygonOffsetFactor = -4
    panel.polygonOffsetUnits = -40
  }
  m.diePulse.color.multiplyScalar(1.6)
  m.ribbon.color.multiplyScalar(1.6)
  // Clothes of each era: waistcoat and flat cap, overalls, shirt and tie, hi-vis and helmet.
  const outfits = [
    { shirt: std('#5d4a38', 0.9), legs: std('#2b2724', 0.9), hat: std('#262220', 0.9) },
    { shirt: std('#34465e', 0.85), legs: std('#2a3242', 0.85), hat: std('#2b2b2e', 0.9) },
    { shirt: std('#e6e4de', 0.7), legs: std('#363840', 0.8), hat: std('#2a2018', 0.9), tie: std('#2f3f66', 0.6) },
    { shirt: std('#e9772c', 0.6), legs: std('#2a323e', 0.8), hat: std('#f1f1ef', 0.35) },
  ]

  // Shapes used many times (a gear, a spoked wheel), built once.
  const shapes = new Map<string, BufferGeometry>()
  const shape = (key: string, build: () => BufferGeometry) => {
    let g = shapes.get(key)
    if (!g) shapes.set(key, (g = keep(build())))
    return g
  }
  return { m, tex, outfits, shape, dispose: () => made.forEach((thing) => thing.dispose()) }
}

let palette: ReturnType<typeof makePalette> | null = null
const usePalette = () => (palette ??= makePalette())
// Called when the film ends: frees every material and picture made for it.
export function disposePalette() {
  palette?.dispose()
  palette = null
}

// A toothed gear and a spoked wheel, in the x-y plane (they turn about z).
function gearShape(radius: number, teeth: number, depth: number) {
  const parts: BufferGeometry[] = [new CylinderGeometry(radius, radius, depth, 32).rotateX(Math.PI / 2)]
  for (let i = 0; i < teeth; i++) parts.push(new BoxGeometry(radius * 0.2, radius * 0.24, depth).translate(0, radius * 1.06, 0).rotateZ((i / teeth) * Math.PI * 2))
  const merged = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  return merged
}
function wheelShape(radius: number, spokes: number, depth: number) {
  const parts: BufferGeometry[] = [
    new TorusGeometry(radius * 0.93, radius * 0.07, 8, 48),
    new CylinderGeometry(radius * 0.16, radius * 0.16, depth * 1.5, 16).rotateX(Math.PI / 2),
  ]
  for (let i = 0; i < spokes; i++) parts.push(new BoxGeometry(radius * 0.07, radius * 0.9, depth * 0.5).translate(0, radius * 0.45, 0).rotateZ((i / spokes) * Math.PI * 2))
  const merged = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  return merged
}

// ---------- Small building blocks ----------

function Box({ size, at, m, rot }: { size: V3; at: V3; m: Material; rot?: V3 }) {
  return (
    <mesh position={at} rotation={rot} material={m} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}
function Cyl({ r, h, at, m, rot, top, seg = 24 }: { r: number; h: number; at: V3; m: Material; rot?: V3; top?: number; seg?: number }) {
  return (
    <mesh position={at} rotation={rot} material={m} castShadow receiveShadow>
      <cylinderGeometry args={[top ?? r, r, h, seg]} />
    </mesh>
  )
}
// A flat glowing panel (windows, screens).
function Panel({ size, at, m, rot }: { size: [number, number]; at: V3; m: Material; rot?: V3 }) {
  return (
    <mesh position={at} rotation={rot} material={m}>
      <planeGeometry args={size} />
    </mesh>
  )
}

const UP = new Vector3(0, 1, 0)
const between = new Vector3()
// Stretch a unit-tall cylinder from point a to point b (rods, cables, belts).
function placeBetween(o: Object3D, a: Vector3, b: Vector3) {
  o.position.copy(a).add(b).multiplyScalar(0.5)
  between.subVectors(b, a)
  const length = between.length() || 1
  o.quaternion.setFromUnitVectors(UP, between.divideScalar(length))
  o.scale.set(1, length, 1)
}
function Rod({ a, b, r, m }: { a: V3; b: V3; r: number; m: Material }) {
  const ref = useRef<Mesh>(null)
  useLayoutEffect(() => {
    if (ref.current) placeBetween(ref.current, new Vector3(...a), new Vector3(...b))
  }, [a, b])
  return (
    <mesh ref={ref} material={m} castShadow>
      <cylinderGeometry args={[r, r, 1, 8]} />
    </mesh>
  )
}

// A floor or wall in one of the museum's own surface textures (already loaded).
function Surface({ name, size, at, tint, tile, roughness = 0.85, wall }: { name: SurfaceName; size: V3; at: V3; tint: string; tile: number; roughness?: number; wall?: boolean }) {
  const [colour, normal] = useSurfaceTextures(name)
  const [w, h, d] = size
  const material = useMemo(() => {
    const across = (wall ? Math.max(w, d) : w) / tile
    const up = (wall ? h : d) / tile
    return new MeshStandardMaterial({ map: repeated(colour, across, up, true), normalMap: repeated(normal, across, up, false), color: tint, roughness })
  }, [colour, normal, w, h, d, tile, tint, roughness, wall])
  useEffect(
    () => () => {
      material.map?.dispose()
      material.normalMap?.dispose()
      material.dispose()
    },
    [material],
  )
  if (!wall)
    return (
      <mesh position={at} rotation={[-Math.PI / 2, 0, 0]} material={material} receiveShadow>
        <planeGeometry args={[w, d]} />
      </mesh>
    )
  return (
    <mesh position={at} material={material} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}

// Each set stands on its own patch of ground (they never overlap, so the last shot shows
// four separate sets side by side)...
// In the finale each set reads as a museum model on its plinth: a dark stone base with a
// thin gold edge, the set's own ground on top.
function Island({ colour }: { colour: string }) {
  const { m } = usePalette()
  const material = useMemo(() => new MeshStandardMaterial({ color: colour, roughness: 0.95 }), [colour])
  useEffect(() => () => material.dispose(), [material])
  return (
    <group position={[0, 0, -5]}>
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material} receiveShadow>
        <planeGeometry args={[42, 48]} />
      </mesh>
      <Box size={[42.6, 1.2, 48.6]} at={[0, -0.66, 0]} m={m.plinth} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[42.8, 0.08, 0.12]} at={[0, -0.02, s * 24.3]} m={m.gold} />
          <Box size={[0.12, 0.08, 48.8]} at={[s * 21.3, -0.02, 0]} m={m.gold} />
        </group>
      ))}
    </group>
  )
}
// Working parts of a set that only make sense inside its scene (light shafts, the open
// roof frame): taken away for the finale's overview, so the sets look finished from above.
function SceneOnly({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.visible = film.t < START.timeline
  })
  return <group ref={ref}>{children}</group>
}
// ...and its far scenery (landscape, skyline, railway...) is only there while the camera is
// in that set, like scenery struck after its scene: it would otherwise spill into the
// neighbouring sets and stand between the camera and the sets in the last shot.
function Backdrop({ set, children }: { set: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.visible = filmSet() === set
  })
  return <group ref={ref}>{children}</group>
}

// Something that keeps turning about one axis.
function Spin({ at, axis = 'z', speed, children, phase = 0 }: { at: V3; axis?: 'x' | 'y' | 'z'; speed: number | (() => number); phase?: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation[axis] = phase + (typeof speed === 'number' ? film.t * speed : speed())
  })
  return (
    <group ref={ref} position={at}>
      {children}
    </group>
  )
}

// SOFT PUFFS (steam, smoke): many small round pictures that always face the camera, drawn in
// one batch. Each is born at a place given by `spawn`, drifts up, grows and fades.
function Puffs({ count, material, colour, size, life, rate, spawn, rise = 0.6, spread = 0.4 }: {
  count: number
  material: Material
  colour: string
  size: number
  life: number
  rate: number // new puffs per second
  spawn: (out: Vector3) => boolean // false = none now
  rise?: number
  spread?: number
}) {
  const ref = useRef<InstancedMesh>(null)
  const parts = useMemo(
    () => ({
      pos: Array.from({ length: count }, () => new Vector3(0, -999, 0)),
      vel: Array.from({ length: count }, () => new Vector3()),
      age: new Float32Array(count).fill(life),
      next: 0,
      due: 0,
    }),
    [count, life],
  )
  const tmp = useMemo(() => ({ m: new Matrix4(), s: new Vector3(), c: new Color(), base: new Color(colour) }), [colour])
  useLayoutEffect(() => {
    // Colours exist from the start, so the drawing code is built once.
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, tmp.c.setRGB(0, 0, 0))
      mesh.setMatrixAt(i, tmp.m.makeScale(0, 0, 0))
    }
  }, [count, tmp])
  useFrame(({ camera }, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const dt = Math.min(delta, 0.05)
    parts.due += rate * dt
    while (parts.due >= 1) {
      parts.due -= 1
      const i = parts.next
      parts.next = (i + 1) % count
      if (spawn(parts.pos[i])) {
        parts.age[i] = 0
        parts.vel[i].set((Math.random() - 0.5) * spread, rise * (0.6 + Math.random() * 0.8), (Math.random() - 0.5) * spread)
      }
    }
    for (let i = 0; i < count; i++) {
      const a = (parts.age[i] += dt) / life
      if (a >= 1) tmp.s.setScalar(0)
      else {
        parts.pos[i].addScaledVector(parts.vel[i], dt)
        parts.vel[i].multiplyScalar(1 - dt * 0.35)
        // (Smoke cannot fade in a single batch: it shrinks away at the end of its life.)
        tmp.s.setScalar(size * (0.35 + a * 1.6) * (material.blending === AdditiveBlending ? 1 : 1 - smooth(0.75, 1, a)))
      }
      tmp.m.compose(parts.pos[i], camera.quaternion, tmp.s)
      mesh.setMatrixAt(i, tmp.m)
      mesh.setColorAt(i, tmp.c.copy(tmp.base).multiplyScalar(Math.sin(Math.min(1, a) * Math.PI)))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={material} frustumCulled={false}>
      <planeGeometry />
    </instancedMesh>
  )
}

// A person of the given era (0-3), with a simple working motion.
type Action = 'stand' | 'shovel' | 'work' | 'type' | 'hold'
function Figure({ era, at, turn = 0, action = 'stand', phase = 0 }: { era: number; at: V3; turn?: number; action?: Action; phase?: number }) {
  const { m, outfits } = usePalette()
  const o = outfits[era]
  const left = useRef<Group>(null)
  const right = useRef<Group>(null)
  useFrame(() => {
    const t = film.t + phase
    // Arm angles (negative = forwards).
    let l = -0.08
    let r = -0.08
    if (action === 'shovel') l = r = -0.75 + 0.55 * Math.sin(t * 2.2)
    else if (action === 'work') {
      l = -1.05 + 0.18 * Math.sin(t * 3.1)
      r = -1.05 + 0.18 * Math.sin(t * 3.1 + 2)
    } else if (action === 'type') {
      l = -1.15 + 0.05 * Math.sin(t * 11)
      r = -1.15 + 0.05 * Math.sin(t * 9 + 1)
    } else if (action === 'hold') l = r = -1.2
    if (left.current) left.current.rotation.x = l
    if (right.current) right.current.rotation.x = r
  })
  const arm = (side: number, ref: typeof left) => (
    <group ref={ref} position={[side * 0.235, 1.42, 0]}>
      <mesh position={[0, -0.28, 0]} material={o.shirt} castShadow>
        <capsuleGeometry args={[0.055, 0.44, 4, 8]} />
      </mesh>
      <mesh position={[0, -0.58, 0]} material={m.skin}>
        <sphereGeometry args={[0.05, 8, 6]} />
      </mesh>
    </group>
  )
  return (
    <group position={at} rotation={[0, turn, 0]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.1, 0.45, 0]} material={o.legs} castShadow>
          <capsuleGeometry args={[0.085, 0.72, 4, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 1.17, 0]} scale={[1.15, 1, 0.75]} material={o.shirt} castShadow>
        <capsuleGeometry args={[0.17, 0.42, 4, 10]} />
      </mesh>
      <mesh position={[0, 1.66, 0]} material={m.skin} castShadow>
        <sphereGeometry args={[0.11, 14, 10]} />
      </mesh>
      {era === 0 || era === 1 ? (
        // A flat cap with its peak.
        <group>
          <Cyl r={0.118} h={0.05} at={[0, 1.745, 0]} m={o.hat} />
          <Box size={[0.13, 0.015, 0.1]} at={[0, 1.728, 0.1]} m={o.hat} />
        </group>
      ) : era === 2 ? (
        <mesh position={[0, 1.675, -0.01]} material={o.hat}>
          <sphereGeometry args={[0.114, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ) : (
        // A safety helmet.
        <mesh position={[0, 1.69, 0]} material={o.hat}>
          <sphereGeometry args={[0.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      )}
      {era === 2 && <Box size={[0.05, 0.3, 0.01]} at={[0, 1.3, 0.13]} m={outfits[2].tie!} />}
      {arm(-1, left)}
      {arm(1, right)}
      {action === 'hold' && <Panel size={[0.26, 0.18]} at={[0, 1.08, 0.42]} rot={[-1.0, 0, 0]} m={m.tablet} />}
    </group>
  )
}

// ======================================================================================
// CMCN 1: a steam-powered mill (boiler, beam engine, spinning frames) and a railway.
// ======================================================================================

const PIVOT: V3 = [1.4, 5.25, -21] // the engine beam's pivot
const BEAM_HALF = 2.5
const FLY: V3 = [3.9, 2.2, -20.3] // the flywheel's centre
const FRAME_Z = [-12, -9, -6, -3, 0] // spinning frames, two rows

function BeamEngine() {
  const { m, shape } = usePalette()
  const beam = useRef<Group>(null)
  const fly = useRef<Group>(null)
  const gearA = useRef<Group>(null)
  const gearB = useRef<Group>(null)
  const conRod = useRef<Mesh>(null)
  const pistonRod = useRef<Mesh>(null)
  const tmp = useMemo(() => ({ a: new Vector3(), b: new Vector3() }), [])
  useFrame(() => {
    const turn = film.t * 1.5
    if (fly.current) fly.current.rotation.z = -turn
    if (gearA.current) gearA.current.rotation.z = -turn
    if (gearB.current) gearB.current.rotation.z = turn * 2 + 0.16
    // The crank pin on the flywheel; the beam rocks to follow it, the rods hang between.
    const px = FLY[0] + 0.55 * Math.cos(-turn)
    const py = FLY[1] + 0.55 * Math.sin(-turn)
    const tilt = Math.asin(Math.max(-0.5, Math.min(0.5, (py + 3.0 - PIVOT[1]) / BEAM_HALF)))
    if (beam.current) beam.current.rotation.z = tilt
    const ex = Math.cos(tilt) * BEAM_HALF
    const ey = Math.sin(tilt) * BEAM_HALF
    if (conRod.current) placeBetween(conRod.current, tmp.a.set(PIVOT[0] + ex, PIVOT[1] + ey, FLY[2] + 0.2), tmp.b.set(px, py, FLY[2] + 0.2))
    if (pistonRod.current) placeBetween(pistonRod.current, tmp.a.set(PIVOT[0] - ex, PIVOT[1] - ey, PIVOT[2]), tmp.b.set(PIVOT[0] - ex, PIVOT[1] - ey - 2.1, PIVOT[2]))
  })
  return (
    <group>
      {/* Steam cylinder on its stone base, the valve chest and the pipe from the boiler. */}
      <Box size={[1.6, 0.8, 1.6]} at={[-1.1, 0.4, -21]} m={m.stone} />
      <Cyl r={0.52} h={2.4} at={[-1.1, 2.0, -21]} m={m.iron} />
      <Cyl r={0.56} h={0.08} at={[-1.1, 3.22, -21]} m={m.brass} />
      <Box size={[0.5, 0.5, 0.5]} at={[-0.55, 2.6, -21]} m={m.iron} />
      <Rod a={[-4.3, 3.4, -21]} b={[-4.3, 3.9, -21]} r={0.09} m={m.copper} />
      <Rod a={[-4.3, 3.9, -21]} b={[-0.55, 3.9, -21]} r={0.09} m={m.copper} />
      <Rod a={[-0.55, 3.9, -21]} b={[-0.55, 2.85, -21]} r={0.09} m={m.copper} />
      <mesh ref={pistonRod} material={m.brass} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1, 10]} />
      </mesh>
      {/* The rocking beam on its column. */}
      <Cyl r={0.2} h={5.2} at={[PIVOT[0], 2.6, -21.35]} m={m.iron} />
      <group ref={beam} position={PIVOT}>
        <Box size={[BEAM_HALF * 2 + 0.3, 0.34, 0.22]} at={[0, 0, 0]} m={m.iron} />
        <Cyl r={0.16} h={0.5} at={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} m={m.brass} />
      </group>
      <mesh ref={conRod} material={m.iron} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1, 10]} />
      </mesh>
      {/* Flywheel with its crank, bearings and the pair of gears it drives. */}
      <group ref={fly} position={FLY}>
        <mesh geometry={shape('fly', () => wheelShape(1.8, 8, 0.25))} material={m.iron} castShadow />
        <Cyl r={0.08} h={0.3} at={[0.55, 0, 0.2]} rot={[Math.PI / 2, 0, 0]} m={m.brass} />
      </group>
      <Box size={[0.5, 1.4, 0.5]} at={[FLY[0], 0.7, -21]} m={m.stone} />
      <group ref={gearA} position={[FLY[0], FLY[1], -19.95]}>
        <mesh geometry={shape('gearA', () => gearShape(0.9, 20, 0.2))} material={m.brass} castShadow />
      </group>
      <group ref={gearB} position={[FLY[0] + 1.38, FLY[1], -19.95]}>
        <mesh geometry={shape('gearB', () => gearShape(0.46, 10, 0.2))} material={m.iron} castShadow />
      </group>
      <Box size={[0.4, 2.0, 0.4]} at={[FLY[0] + 1.38, 1.0, -20.3]} m={m.stone} />
    </group>
  )
}

function Boiler() {
  const { m } = usePalette()
  const fire = useMemo(() => new Color('#ff6a1a'), [])
  useFrame(() => {
    m.fire.color.copy(fire).multiplyScalar(0.12 + 3.2 * fireLevel())
  })
  return (
    <group>
      {/* Brick firebox, the glowing fire door, the boiler and its flue. */}
      <Box size={[3, 1.5, 2.6]} at={[-6, 0.75, -21]} m={m.brick} />
      <Panel size={[0.9, 0.6]} at={[-6, 0.72, -19.69]} m={m.fire} />
      <Box size={[0.5, 0.66, 0.05]} at={[-6.7, 0.72, -19.45]} rot={[0, -1.1, 0]} m={m.darkIron} />
      <Cyl r={1.05} h={3.6} at={[-6, 2.45, -21]} rot={[0, 0, Math.PI / 2]} m={m.iron} />
      {[-7.2, -6, -4.8].map((x) => (
        <Cyl key={x} r={1.08} h={0.07} at={[x, 2.45, -21]} rot={[0, 0, Math.PI / 2]} m={m.brass} />
      ))}
      <Cyl r={0.3} h={6} at={[-7.8, 5.2, -21]} m={m.soot} />
      <mesh position={[-5.1, 0.12, -18.3]} scale={[1, 0.35, 0.8]} material={m.soot}>
        <sphereGeometry args={[0.6, 12, 8]} />
      </mesh>
    </group>
  )
}

function SpinningFrames() {
  const { m, shape } = usePalette()
  const bobbins = useRef<InstancedMesh>(null)
  const count = FRAME_Z.length * 2 * 14
  useLayoutEffect(() => {
    const mesh = bobbins.current
    if (!mesh) return
    const o = new Object3D()
    let i = 0
    for (const x of [-3.6, 3.6])
      for (const z of FRAME_Z)
        for (const side of [-0.3, 0.3])
          for (let k = 0; k < 7; k++) {
            o.position.set(x + side, 1.55, z - 1.0 + k * 0.33)
            o.updateMatrix()
            mesh.setMatrixAt(i++, o.matrix)
          }
    mesh.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      {[-3.6, 3.6].flatMap((x) =>
        FRAME_Z.map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            {[-0.4, 0.4].flatMap((dx) => [-1.1, 1.1].map((dz) => <Box key={`${dx}${dz}`} size={[0.08, 1.4, 0.08]} at={[dx, 0.7, dz]} m={m.timber} />))}
            <Box size={[0.95, 0.08, 2.35]} at={[0, 1.4, 0]} m={m.timber} />
            <Box size={[0.95, 0.06, 2.35]} at={[0, 0.5, 0]} m={m.timber} />
            <Cyl r={0.2} h={2.3} at={[0, 1.0, 0]} rot={[Math.PI / 2, 0, 0]} m={m.machineGreen} />
            {/* The belt from the overhead shaft. */}
            <Rod a={[-x * 0.92, 5.6, 0]} b={[0, 1.15, 0]} r={0.025} m={m.timber} />
          </group>
        )),
      )}
      <instancedMesh ref={bobbins} args={[undefined, undefined, count]} material={m.cotton} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.22, 10]} />
      </instancedMesh>
      {/* The line shaft overhead, its pulleys turning, hung from the roof trusses. */}
      <Cyl r={0.07} h={17} at={[0, 5.6, -5]} rot={[Math.PI / 2, 0, 0]} m={m.iron} />
      {FRAME_Z.map((z) => (
        <Spin key={z} at={[0, 5.6, z]} speed={4.5}>
          <mesh geometry={shape('pulley', () => wheelShape(0.4, 4, 0.12))} material={m.iron} />
        </Spin>
      ))}
      {[-13, -5, 3].map((z) => (
        <Rod key={z} a={[0, 5.6, z]} b={[0, 7.6, z]} r={0.04} m={m.iron} />
      ))}
    </group>
  )
}

function Locomotive() {
  const { m, shape } = usePalette()
  const group = useRef<Group>(null)
  const wheels = useRef<(Group | null)[]>([])
  const small = useRef<(Group | null)[]>([])
  const coupling = useRef<(Mesh | null)[]>([])
  const rods = useRef<(Mesh | null)[]>([])
  const tmp = useMemo(() => ({ a: new Vector3(), b: new Vector3() }), [])
  useFrame(() => {
    const x = locoX(since('loco'))
    if (group.current) group.current.position.x = x
    // Wheels roll: turned by the distance travelled.
    const a = -(x - locoX(0)) / 0.8
    wheels.current.forEach((w) => w && (w.rotation.z = a))
    small.current.forEach((w) => w && (w.rotation.z = (a * 0.8) / 0.45))
    const cx = 0.35 * Math.cos(a)
    const cy = 0.35 * Math.sin(a)
    ;[-1, 1].forEach((side, i) => {
      const z = side * 0.86
      const bar = coupling.current[i]
      if (bar) bar.position.set(0.55 + cx, 0.8 + cy, z)
      const rod = rods.current[i]
      if (rod) placeBetween(rod, tmp.a.set(2.3 + cx * 0.4, 0.95, z), tmp.b.set(1.4 + cx, 0.8 + cy, z))
    })
  })
  const wheel = shape('locoWheel', () => wheelShape(0.8, 12, 0.12))
  const smallWheel = shape('tenderWheel', () => wheelShape(0.45, 8, 0.1))
  return (
    <group ref={group} position={[locoX(0), RAIL_TOP, RAIL_Z]}>
      <Box size={[5.4, 0.3, 1.5]} at={[0.2, 1.05, 0]} m={m.darkIron} />
      <Cyl r={0.72} h={3.4} at={[0.9, 2.05, 0]} rot={[0, 0, Math.PI / 2]} m={m.locoGreen} />
      {[-0.4, 0.9, 2.2].map((x) => (
        <Cyl key={x} r={0.74} h={0.06} at={[x, 2.05, 0]} rot={[0, 0, Math.PI / 2]} m={m.brass} />
      ))}
      <Cyl r={0.76} h={0.7} at={[2.95, 2.05, 0]} rot={[0, 0, Math.PI / 2]} m={m.soot} />
      <Cyl r={0.2} top={0.27} h={1.5} at={[2.9, 3.4, 0]} m={m.soot} />
      <mesh position={[1.0, 2.85, 0]} material={m.brass} castShadow>
        <sphereGeometry args={[0.34, 16, 10]} />
      </mesh>
      <Box size={[1.5, 1.6, 1.7]} at={[-1.55, 2.1, 0]} m={m.locoGreen} />
      <Box size={[1.8, 0.1, 2.0]} at={[-1.55, 3.0, 0]} m={m.darkIron} />
      <Box size={[0.2, 0.35, 1.9]} at={[3.1, 1.0, 0]} m={m.red} />
      {[-1, 1].map((side) => (
        <Cyl key={side} r={0.22} h={1.0} at={[2.8, 0.95, side * 0.86]} rot={[0, 0, Math.PI / 2]} m={m.iron} />
      ))}
      {[-0.3, 1.4].flatMap((x, i) =>
        [-1, 1].map((side, j) => (
          <group key={`${x}${side}`} ref={(g) => void (wheels.current[i * 2 + j] = g)} position={[x, 0.8, side * 0.72]}>
            <mesh geometry={wheel} material={m.red} castShadow />
          </group>
        )),
      )}
      {[0, 1].map((i) => (
        <mesh key={i} ref={(b) => void (coupling.current[i] = b)} material={m.iron} castShadow>
          <boxGeometry args={[1.7, 0.1, 0.06]} />
        </mesh>
      ))}
      {[0, 1].map((i) => (
        <mesh key={i} ref={(r) => void (rods.current[i] = r)} material={m.iron} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 1, 8]} />
        </mesh>
      ))}
      {/* The tender with its coal. */}
      <Box size={[2.4, 1.1, 1.7]} at={[-3.85, 1.35, 0]} m={m.locoGreen} />
      <Box size={[2.2, 0.3, 1.5]} at={[-3.85, 1.95, 0]} m={m.soot} />
      {[-4.6, -3.1].flatMap((x, i) =>
        [-1, 1].map((side, j) => (
          <group key={`${x}${side}`} ref={(g) => void (small.current[i * 2 + j] = g)} position={[x, 0.45, side * 0.72]}>
            <mesh geometry={smallWheel} material={m.iron} castShadow />
          </group>
        )),
      )}
    </group>
  )
}

const CHIMNEYS: [number, number, number, number][] = [
  [-48, 46, 26, 1.2], [-30, 60, 32, 1.4], [-12, 52, 22, 1.0], [8, 66, 30, 1.5], [24, 48, 20, 1.0],
  [40, 58, 28, 1.3], [58, 50, 24, 1.1], [-60, 70, 30, 1.4], [-20, 80, 34, 1.6], [30, 82, 30, 1.4],
]

export function SteamSet() {
  const { m } = usePalette()
  const sleepers = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = sleepers.current
    if (!mesh) return
    const o = new Object3D()
    for (let i = 0; i < 90; i++) {
      o.position.set(-66 + i * 1.5, 0.17, RAIL_Z)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      {/* The mill: timber floor, brick walls with tall windows, roof trusses (no roof). */}
      <Surface name="wood-floor" size={[24, 0, 32]} at={[0, 0, -10]} tint="#8a6a4c" tile={2.4} />
      <Surface wall name="bricks" size={[24, 8, 0.5]} at={[0, 4, -26.25]} tint="#c9a48c" tile={2.5} />
      <Surface wall name="bricks" size={[0.5, 8, 30]} at={[-12.25, 4, -11]} tint="#c9a48c" tile={2.5} />
      {[-20, -11, -2].map((z) => (
        <group key={z}>
          <Panel size={[2.2, 3.6]} at={[-11.99, 3.8, z]} rot={[0, Math.PI / 2, 0]} m={m.window} />
          <Box size={[0.06, 3.6, 0.08]} at={[-11.95, 3.8, z]} m={m.darkIron} />
          <Box size={[0.06, 0.08, 2.2]} at={[-11.95, 3.8, z]} m={m.darkIron} />
          <Box size={[0.06, 0.08, 2.2]} at={[-11.95, 5.0, z]} m={m.darkIron} />
          {/* A faint shaft of daylight through the dusty air (kept very light). */}
          <SceneOnly>
          <mesh position={[-7.4, 2.0, z]} rotation={[0, Math.PI / 2, 1.17, 'ZYX']} material={m.shaft}>
            <planeGeometry args={[2.2, 9.4]} />
          </mesh>
          </SceneOnly>
        </group>
      ))}
      <SceneOnly>
      {[-24, -18, -12, -6, 0].map((z) => (
        <group key={z}>
          <Box size={[24, 0.3, 0.3]} at={[0, 7.7, z]} m={m.timber} />
          <Box size={[0.2, 1.2, 0.2]} at={[0, 8.4, z]} m={m.timber} />
        </group>
      ))}
      </SceneOnly>
      <Boiler />
      <BeamEngine />
      <SpinningFrames />
      <Figure era={0} at={[-6.15, 0, -18.6]} turn={Math.PI} action="shovel" />
      <Figure era={0} at={[0.3, 0, -18.4]} turn={Math.PI + 0.4} phase={2} />
      <Figure era={0} at={[-2.75, 0, -6]} turn={-Math.PI / 2} action="work" phase={1} />
      <Figure era={0} at={[2.75, 0, -9]} turn={Math.PI / 2} action="work" phase={2.5} />
      <Figure era={0} at={[-2.75, 0, 0]} turn={-Math.PI / 2} action="work" phase={4} />

      <Island colour="#3a3028" />
      {/* Outside: the railway, the locomotive, and a smoky industrial skyline. */}
      <Backdrop set={0}>
      <Surface name="concrete" size={[140, 0, 90]} at={[0, -0.02, 51]} tint="#4a3d31" tile={6} />
      <Box size={[140, 0.12, 3.2]} at={[0, 0.06, RAIL_Z]} m={m.stone} />
      <instancedMesh ref={sleepers} args={[undefined, undefined, 90]} material={m.timber} receiveShadow>
        <boxGeometry args={[0.26, 0.1, 2.5]} />
      </instancedMesh>
      {[-0.72, 0.72].map((dz) => (
        <Box key={dz} size={[140, 0.1, 0.07]} at={[0, 0.27, RAIL_Z + dz]} m={m.iron} />
      ))}
      <Locomotive />
      {CHIMNEYS.map(([x, z, h, r]) => (
        <Cyl key={`${x}${z}`} r={r} top={r * 0.75} h={h} at={[x, h / 2, z]} m={m.soot} seg={12} />
      ))}
      {[[-40, 48, 16, 9], [-6, 58, 22, 8], [18, 54, 14, 10], [48, 62, 20, 9], [-58, 60, 14, 7]].map(([x, z, w, h]) => (
        <Box key={`${x}${z}`} size={[w, h, 10]} at={[x, h / 2, z]} m={m.soot} />
      ))}
      {/* Smoke from the chimneys, the cloud of steam the locomotive comes out of, and its own. */}
      <Puffs count={90} material={m.smoke} colour="#2e2824" size={4} life={7} rate={13} rise={1.3} spread={0.9} spawn={(out) => {
        const [x, z, h] = CHIMNEYS[Math.floor(Math.random() * CHIMNEYS.length)]
        out.set(x, h + 1, z)
        return true
      }} />
      <Puffs count={70} material={m.steam} colour="#5a5450" size={2.6} life={3.5} rate={20} rise={0.5} spread={1.2} spawn={(out) => {
        if (since('loco') > 3.2) return false
        out.set(-25 + Math.random() * 6, 0.5 + Math.random() * 2.5, RAIL_Z + (Math.random() - 0.5) * 4)
        return true
      }} />
      <Puffs count={60} material={m.steam} colour="#6a625c" size={1.5} life={2.4} rate={14} rise={1.7} spread={0.5} spawn={(out) => {
        const s = since('loco')
        if (s < 0 || s > 9) return false
        out.set(locoX(s) + 2.9, RAIL_TOP + 4.3, RAIL_Z)
        return true
      }} />
      </Backdrop>
    </group>
  )
}

// ======================================================================================
// CMCN 2: a dynamo hall, a street lit by electric lamps, an assembly line, a motor car.
// ======================================================================================

// A Model T-like motor car (front towards +x). `stage` builds it up on the line: chassis,
// then engine, then body. Its wheels turn when `rolling` gives a distance.
function ModelT({ lamps, rolling }: { lamps?: boolean; rolling?: () => number }) {
  const { m, shape } = usePalette()
  const wheels = useRef<(Group | null)[]>([])
  useFrame(() => {
    if (!rolling) return
    const a = -rolling() / 0.38
    wheels.current.forEach((w) => w && (w.rotation.z = a))
  })
  const wheel = shape('carWheel', () => wheelShape(0.38, 12, 0.08))
  return (
    <group>
      {/* 0: chassis and wheels */}
      <group>
        {[-0.4, 0.4].map((z) => (
          <Box key={z} size={[2.8, 0.1, 0.08]} at={[0, 0.55, z]} m={m.darkIron} />
        ))}
        {[-1.15, 1.15].flatMap((x, i) =>
          [-0.72, 0.72].map((z, j) => (
            <group key={`${x}${z}`} ref={(g) => void (wheels.current[i * 2 + j] = g)} position={[x, 0.38, z]}>
              <mesh geometry={wheel} material={m.timberLight} castShadow />
            </group>
          )),
        )}
      </group>
      {/* 1: engine and radiator */}
      <group>
        <Box size={[0.7, 0.45, 0.5]} at={[0.95, 0.85, 0]} m={m.iron} />
        <Box size={[0.08, 0.6, 0.6]} at={[1.38, 0.95, 0]} m={m.brass} />
      </group>
      {/* 2: body, hood, mudguards, roof and lamps */}
      <group>
        <Box size={[0.8, 0.4, 0.62]} at={[0.95, 1.05, 0]} m={m.enamel} />
        <Box size={[1.4, 0.55, 1.2]} at={[-0.35, 1.0, 0]} m={m.enamel} />
        <Box size={[0.05, 0.5, 1.1]} at={[0.42, 1.5, 0]} m={m.darkIron} />
        {[-0.75, 0.75].flatMap((z) => [-1.15, 1.15].map((x) => <Box key={`${x}${z}`} size={[0.75, 0.04, 0.24]} at={[x, 0.82, z]} m={m.enamel} />))}
        {[-0.9, 0.3].flatMap((x) => [-0.55, 0.55].map((z) => <Box key={`${x}${z}`} size={[0.04, 0.75, 0.04]} at={[x, 1.65, z]} m={m.darkIron} />))}
        <Box size={[1.35, 0.05, 1.2]} at={[-0.3, 2.03, 0]} m={m.enamel} />
        {[-0.38, 0.38].map((z) => (
          <group key={z}>
            <Cyl r={0.1} h={0.14} at={[1.42, 1.05, z]} rot={[0, 0, Math.PI / 2]} m={m.brass} />
            <Panel size={[0.16, 0.16]} at={[1.5, 1.05, z]} rot={[0, Math.PI / 2, 0]} m={lamps ? m.headlamp : m.brass} />
          </group>
        ))}
      </group>
    </group>
  )
}

const LINE_CARS = 7
// The cars move along the line and are built up as they go: chassis, engine, then body.
function AssemblyLine() {
  const groups = useRef<(Group | null)[]>([])
  useFrame(() => {
    groups.current.forEach((car, i) => {
      if (!car) return
      const z = -19 + ((film.t * 0.7 + i * 2.8) % 19.6)
      car.position.set(9, 0.55, z)
      const stage = z < -13 ? 0 : z < -6 ? 1 : 2
      const parts = car.children[0]?.children
      if (parts) {
        parts[1].visible = stage >= 1
        parts[2].visible = stage >= 2
      }
    })
  })
  return (
    <group>
      {Array.from({ length: LINE_CARS }, (_, i) => (
        <group key={i} ref={(g) => void (groups.current[i] = g)} rotation={[0, -Math.PI / 2, 0]}>
          <ModelT />
        </group>
      ))}
    </group>
  )
}

function Lamp({ at, level, cord = 2.2 }: { at: V3; level: () => number; cord?: number }) {
  const { m } = usePalette()
  const bulb = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), [])
  useEffect(() => () => bulb.dispose(), [bulb])
  const on = useMemo(() => new Color('#ffd590').multiplyScalar(3), [])
  const off = useMemo(() => new Color('#2a241c'), [])
  useFrame(() => {
    bulb.color.copy(off).lerp(on, level())
  })
  return (
    <group position={at}>
      <Rod a={[0, 0, 0]} b={[0, cord, 0]} r={0.01} m={m.darkIron} />
      <mesh position={[0, -0.12, 0]} material={m.machineGreen}>
        <coneGeometry args={[0.45, 0.3, 20, 1, true]} />
      </mesh>
      <mesh position={[0, -0.25, 0]} material={bulb}>
        <sphereGeometry args={[0.1, 12, 8]} />
      </mesh>
    </group>
  )
}

function StreetLamp({ x, i }: { x: number; i: number }) {
  const { m } = usePalette()
  const glass = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), [])
  useEffect(() => () => glass.dispose(), [glass])
  const on = useMemo(() => new Color('#ffd28a').multiplyScalar(3.2), [])
  const off = useMemo(() => new Color('#1c1a17'), [])
  useFrame(() => {
    glass.color.copy(off).lerp(on, streetLamp(i))
  })
  return (
    <group position={[x, 0, 3.4]}>
      <Cyl r={0.07} top={0.05} h={4.6} at={[0, 2.3, 0]} m={m.iron} />
      <Box size={[0.06, 0.06, 0.6]} at={[0, 4.55, 0.3]} m={m.iron} />
      <mesh position={[0, 4.33, 0.55]} material={glass}>
        <sphereGeometry args={[0.17, 14, 10]} />
      </mesh>
      <Cyl r={0.2} top={0.02} h={0.16} at={[0, 4.55, 0.55]} m={m.darkIron} />
    </group>
  )
}

function Building({ x, w, h, i }: { x: number; w: number; h: number; i: number }) {
  const { tex } = usePalette()
  const material = useMemo(() => {
    const map = tex.facade.clone()
    const lit = tex.lit.clone()
    for (const t of [map, lit]) {
      t.repeat.set(w / 10, h / 12)
      t.needsUpdate = true
    }
    return new MeshStandardMaterial({ map, emissive: '#ffd29a', emissiveMap: lit, emissiveIntensity: 0, roughness: 0.9 })
  }, [tex, w, h])
  useEffect(
    () => () => {
      material.map?.dispose()
      material.emissiveMap?.dispose()
      material.dispose()
    },
    [material],
  )
  useFrame(() => {
    material.emissiveIntensity = 1.4 * streetWindows(i)
  })
  return (
    <mesh position={[x, h / 2, 15]} material={material} castShadow receiveShadow>
      <boxGeometry args={[w, h, 5]} />
    </mesh>
  )
}

export function ElectricSet() {
  const { m, shape } = usePalette()
  return (
    <group>
      {/* The dynamo hall. */}
      <Surface name="concrete" size={[14, 0, 18]} at={[-7.5, 0, -8]} tint="#8b8780" tile={3} />
      <Surface wall name="bricks" size={[14, 7, 0.5]} at={[-7.5, 3.5, -17.25]} tint="#b89482" tile={2.5} />
      {[-11, -4].map((x) => (
        <Panel key={x} size={[1.6, 3.2]} at={[x, 3.9, -16.99]} m={m.dusk} />
      ))}
      {[-14, -1].flatMap((x) => [-14, -8, -2].map((z) => <Cyl key={`${x}${z}`} r={0.15} h={7} at={[x, 3.5, z]} m={m.iron} seg={12} />))}
      <SceneOnly>
        {[-14, -8, -2].map((z) => (
          <Box key={z} size={[13.4, 0.35, 0.25]} at={[-7.5, 6.6, z]} m={m.iron} />
        ))}
      </SceneOnly>
      {[-10, -5.5].map((x) => (
        <group key={x}>
          <Box size={[2.8, 0.45, 2.2]} at={[x, 0.225, -10.6]} m={m.iron} />
          <Cyl r={1.32} h={1.3} at={[x, 1.5, -10.75]} rot={[Math.PI / 2, 0, 0]} m={m.machineGreen} />
          <mesh position={[x, 1.5, -10.06]} material={m.machineGreen} castShadow>
            <torusGeometry args={[1.22, 0.16, 10, 40]} />
          </mesh>
          <Spin at={[x, 1.5, -9.98]} speed={5}>
            <mesh geometry={shape('rotor', () => wheelShape(1.05, 10, 0.14))} material={m.copper} castShadow />
            <Cyl r={0.2} h={0.3} at={[0, 0, 0.1]} rot={[Math.PI / 2, 0, 0]} m={m.brass} />
          </Spin>
          <Box size={[0.6, 1.3, 0.6]} at={[x, 0.9, -11.8]} m={m.iron} />
        </group>
      ))}
      {/* The switchboard: marble, brass gauges, knife switches; the engineer watching it. */}
      <Box size={[4.2, 2.6, 0.12]} at={[-7.75, 1.9, -16.9]} m={m.marble} />
      {[-9.1, -7.75, -6.4].map((x) => (
        <group key={x}>
          <Cyl r={0.17} h={0.05} at={[x, 2.7, -16.82]} rot={[Math.PI / 2, 0, 0]} m={m.brass} />
          <Cyl r={0.14} h={0.02} at={[x, 2.7, -16.79]} rot={[Math.PI / 2, 0, 0]} m={m.cotton} />
        </group>
      ))}
      {[-9.3, -8.3, -7.2, -6.2].map((x) => (
        <Box key={x} size={[0.05, 0.3, 0.05]} at={[x, 1.6, -16.78]} rot={[0.5, 0, 0]} m={m.copper} />
      ))}
      <Figure era={1} at={[-6.4, 0, -14.6]} turn={Math.PI} />
      {/* Wires out of the hall to the street. */}
      <Rod a={[-7.75, 3.2, -16.85]} b={[-7.75, 6.8, -16.85]} r={0.025} m={m.darkIron} />
      <Rod a={[-7.75, 6.8, -16.85]} b={[-7.75, 6.8, 1]} r={0.025} m={m.darkIron} />
      <Rod a={[-7.75, 6.8, 1]} b={[-12, 4.75, 3.4]} r={0.025} m={m.darkIron} />
      {[-12, -6, 0, 6].map((x) => (
        <Rod key={x} a={[x, 4.75, 3.4]} b={[x + 6, 4.75, 3.4]} r={0.018} m={m.darkIron} />
      ))}

      <Island colour="#34322f" />
      {/* The street, its lamps and the city. */}
      <Surface name="bricks" size={[36, 0, 4.4]} at={[0, 0.01, ROAD_Z]} tint="#6d6a66" tile={1.2} />
      {[-3.1, 3.1].map((dz) => (
        <Box key={dz} size={[36, 0.15, 1.8]} at={[0, 0.075, ROAD_Z + dz]} m={m.stone} />
      ))}
      {[-12, -6, 0, 6, 12].map((x, i) => (
        <StreetLamp key={x} x={x} i={i} />
      ))}
      {[[-14, 5, 9], [-8.5, 5, 12], [-3, 5, 8], [2.5, 5, 11], [8, 5, 13], [13.5, 5, 9]].map(([x, w, h], i) => (
        <Building key={x} x={x} w={w} h={h} i={i} />
      ))}
      <group position={[0, 0, 0]}>
        <StreetCar />
      </group>

      {/* The factory: the assembly line, its lamps, its motor and workers. */}
      <Surface name="concrete" size={[14, 0, 22]} at={[9, 0, -9]} tint="#9a958c" tile={3} />
      <Surface wall name="bricks" size={[14, 7, 0.5]} at={[9, 3.5, -20.25]} tint="#b89482" tile={2.5} />
      <Surface wall name="bricks" size={[0.5, 7, 22]} at={[16.25, 3.5, -9]} tint="#b89482" tile={2.5} />
      {[-16, -9, -2].map((z) => (
        <Panel key={z} size={[2, 3.4]} at={[15.99, 3.6, z]} rot={[0, -Math.PI / 2, 0]} m={m.dusk} />
      ))}
      <Box size={[1.6, 0.55, 21]} at={[9, 0.275, -9.5]} m={m.iron} />
      {[8.2, 9.8].map((x) => (
        <Box key={x} size={[0.08, 0.1, 21]} at={[x, 0.6, -9.5]} m={m.darkIron} />
      ))}
      <Cyl r={0.35} h={0.9} at={[10.8, 0.6, -19.4]} rot={[Math.PI / 2, 0, 0]} m={m.machineGreen} />
      <Spin at={[10.8, 0.6, -18.88]} speed={9}>
        <mesh geometry={shape('motorPulley', () => wheelShape(0.32, 6, 0.1))} material={m.iron} castShadow />
      </Spin>
      {[-17, -13.5, -10, -6.5, -3].map((z, i) => (
        <Lamp key={z} at={[9, 4.8, z]} level={() => lineLamp(i)} />
      ))}
      <AssemblyLine />
      {([[7.45, -15, Math.PI / 2], [10.55, -13, -Math.PI / 2], [7.45, -11, Math.PI / 2], [10.55, -7, -Math.PI / 2], [7.45, -4, Math.PI / 2], [10.55, -2.5, -Math.PI / 2]] as const).map(([x, z, turn], i) => (
        <Figure key={i} era={1} at={[x, 0, z]} turn={turn} action="work" phase={i * 1.3} />
      ))}
    </group>
  )
}

function StreetCar() {
  const car = useRef<Group>(null)
  useFrame(() => {
    if (car.current) car.current.position.x = carX(since('car'))
  })
  return (
    <group ref={car} position={[carX(0), 0, ROAD_Z]} rotation={[0, Math.PI, 0]}>
      <ModelT lamps rolling={() => carX(0) - carX(since('car'))} />
    </group>
  )
}

// ======================================================================================
// CMCN 3: a computer room, a robot welding cell with its programmer, an office network
// with a radio tower, and a microprocessor seen up close.
// ======================================================================================

function Robot({ at, turn, phase, tip }: { at: V3; turn: number; phase: number; tip: (o: Object3D | null) => void }) {
  const { m } = usePalette()
  const turret = useRef<Group>(null)
  const shoulder = useRef<Group>(null)
  const elbow = useRef<Group>(null)
  useFrame(() => {
    const t = film.t + phase
    if (turret.current) turret.current.rotation.y = 0.35 * Math.sin(t * 0.8)
    if (shoulder.current) shoulder.current.rotation.x = 0.35 + 0.15 * Math.sin(t * 1.1)
    if (elbow.current) elbow.current.rotation.x = 0.55 + 0.22 * Math.sin(t * 1.3 + 1)
  })
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <Cyl r={0.42} h={0.35} at={[0, 0.175, 0]} m={m.iron} />
      <group ref={turret} position={[0, 0.35, 0]}>
        <Cyl r={0.34} h={0.45} at={[0, 0.225, 0]} m={m.robotOrange} />
        <group ref={shoulder} position={[0, 0.62, 0]}>
          <Box size={[0.26, 1.25, 0.3]} at={[0, 0.62, 0]} m={m.robotOrange} />
          <group ref={elbow} position={[0, 1.25, 0]}>
            <Cyl r={0.16} h={0.36} at={[0, 0, 0]} rot={[0, 0, Math.PI / 2]} m={m.darkIron} />
            <Box size={[0.2, 0.2, 1.1]} at={[0, 0, 0.55]} m={m.robotOrange} />
            <Cyl r={0.1} h={0.2} at={[0, 0, 1.12]} rot={[Math.PI / 2, 0, 0]} m={m.darkIron} />
            <Box size={[0.08, 0.3, 0.08]} at={[0, -0.15, 1.18]} m={m.darkIron} />
            <object3D ref={tip} position={[0, -0.32, 1.18]} />
          </group>
        </group>
      </group>
    </group>
  )
}

// Welding sparks: bright specks thrown from each welding gun, falling.
function Sparks({ tips, phases }: { tips: RefObject<(Object3D | null)[]>; phases: number[] }) {
  const ref = useRef<Points>(null)
  const set = useRef<Group>(null)
  const N = 300
  const data = useMemo(() => ({ pos: new Float32Array(N * 3).fill(-999), vel: new Float32Array(N * 3), life: new Float32Array(N), next: 0 }), [])
  const p = useMemo(() => new Vector3(), [])
  useFrame((_, delta) => {
    const points = ref.current
    if (!points || !set.current) return
    const dt = Math.min(delta, 0.05)
    tips.current?.forEach((tip, k) => {
      if (!tip || !welding(phases[k])) return
      tip.getWorldPosition(p)
      set.current!.worldToLocal(p)
      for (let n = 0; n < 5; n++) {
        const i = data.next
        data.next = (i + 1) % N
        data.pos.set([p.x, p.y, p.z], i * 3)
        data.vel.set([(Math.random() - 0.5) * 2.4, Math.random() * 1.6, (Math.random() - 0.5) * 2.4], i * 3)
        data.life[i] = 0.5 + Math.random() * 0.4
      }
    })
    for (let i = 0; i < N; i++) {
      if ((data.life[i] -= dt) <= 0) {
        data.pos[i * 3 + 1] = -999
        continue
      }
      data.vel[i * 3 + 1] -= 9.8 * dt
      for (let a = 0; a < 3; a++) data.pos[i * 3 + a] += data.vel[i * 3 + a] * dt
    }
    points.geometry.attributes.position.needsUpdate = true
  })
  return (
    <group ref={set}>
      <points ref={ref} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        </bufferGeometry>
        <pointsMaterial color={[3, 1.6, 0.6]} size={0.05} sizeAttenuation transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </points>
    </group>
  )
}

// Things that travel along cables: small glowing dots (data on the move).
function Pulses({ curves, perCurve, speed }: { curves: Curve<Vector3>[]; perCurve: number; speed: number }) {
  const { m } = usePalette()
  const ref = useRef<InstancedMesh>(null)
  const o = useMemo(() => new Object3D(), [])
  const count = curves.length * perCurve
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    curves.forEach((curve, c) => {
      for (let k = 0; k < perCurve; k++) {
        const u = (film.t * speed + k / perCurve + c * 0.37) % 1
        curve.getPointAt(u, o.position)
        o.updateMatrix()
        mesh.setMatrixAt(c * perCurve + k, o.matrix)
      }
    })
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={m.pulse} frustumCulled={false}>
      <sphereGeometry args={[0.045, 8, 6]} />
    </instancedMesh>
  )
}

function Cable({ curve, r = 0.02, m }: { curve: Curve<Vector3>; r?: number; m: Material }) {
  return (
    <mesh material={m}>
      <tubeGeometry args={[curve, 48, r, 6, false]} />
    </mesh>
  )
}

// Blinking indicator lamps: the shared picture jumps every quarter second.
function useBlink() {
  const { tex } = usePalette()
  const last = useRef(0)
  useFrame(() => {
    if (film.t - last.current < 0.25) return
    last.current = film.t
    tex.leds.offset.y = Math.floor(Math.random() * 16) / 16
  })
}

const DESKS: [number, number][] = [[-11, 4.5], [-7, 4.5], [-11, 8.5], [-7, 8.5]]

export function DigitalSet() {
  const { m, shape, tex } = usePalette()
  useBlink()
  const tips = useRef<(Object3D | null)[]>([])
  const reels = useRef<(Group | null)[]>([])
  useFrame(() => {
    // Tape reels turn in short jerks, as the computer reads.
    const step = Math.floor(film.t * 3)
    reels.current.forEach((r, i) => r && (r.rotation.z = step * (0.9 + (i % 3) * 0.4) + Math.sin(film.t * 9 + i) * 0.1))
    tex.pulses.offset.x = film.t * 0.12
    tex.pulses.offset.y = film.t * 0.05
  })
  const network = useMemo(() => {
    const toRack = DESKS.map(
      ([x, z]) => new CatmullRomCurve3([new Vector3(x, 0.4, z - 0.3), new Vector3(x, 0.05, z - 0.6), new Vector3(-3.4, 0.05, z - 0.6), new Vector3(-2.9, 0.05, 10.5), new Vector3(-2.9, 0.6, 10.5)]),
    )
    const toTower = new CatmullRomCurve3([new Vector3(-2.5, 2, 10.5), new Vector3(-3, 3.5, 14), new Vector3(-7, 2, 20), new Vector3(-8, 0.3, 24), new Vector3(-8, 13, 24)])
    return { toRack, toTower }
  }, [])
  return (
    <group>
      <Island colour="#2c2e32" />
      {/* The computer room: raised white floor tiles, cabinets of tape drives and lamps. */}
      <Surface name="tiles" size={[14, 0, 17]} at={[-7.5, 0, -8.5]} tint="#cfd2d4" tile={1.2} roughness={0.5} />
      <Box size={[14, 4.2, 0.3]} at={[-7.5, 2.1, -17.15]} m={m.wallWhite} />
      <Box size={[0.3, 4.2, 17]} at={[-14.65, 2.1, -8.5]} m={m.wallWhite} />
      {[-11, -5].flatMap((x) => [-11, -6].map((z) => <Box key={`${x}${z}`} size={[1.4, 0.08, 0.3]} at={[x, 3.8, z]} m={m.tube} />))}
      {[-13, -9.6].flatMap((z) =>
        [-12.5, -10.8, -9.1, -7.4, -5.7, -4.0].map((x, i, row) => (
          <group key={`${x}${z}`}>
            <Box size={[1.5, 1.9, 0.8]} at={[x, 0.95, z]} m={m.cream} />
            {i % 2 === 0 ? (
              <group>
                <Box size={[1.0, 0.9, 0.02]} at={[x, 1.35, z + 0.41]} m={m.tapeDark} />
                {[-0.27, 0.27].map((dx, j) => (
                  <group key={dx} ref={(g) => void (reels.current[((z < -10 ? 0 : row.length) + i) * 2 + j] = g)} position={[x + dx, 1.4, z + 0.43]}>
                    <mesh geometry={shape('reel', () => wheelShape(0.2, 3, 0.03))} material={m.grey} />
                  </group>
                ))}
              </group>
            ) : (
              <Panel size={[1.1, 0.6]} at={[x, 1.3, z + 0.41]} m={m.leds} />
            )}
          </group>
        )),
      )}
      <Box size={[2.2, 0.75, 0.9]} at={[-6, 0.375, -5.6]} m={m.grey} />
      <Box size={[0.55, 0.48, 0.5]} at={[-6, 1.0, -5.65]} m={m.cream} />
      <Panel size={[0.42, 0.32]} at={[-6, 1.0, -5.395]} m={m.crt} />
      <Box size={[0.5, 0.04, 0.18]} at={[-6, 0.78, -5.25]} m={m.cream} />
      <Figure era={2} at={[-6.8, 0, -4.8]} turn={Math.PI + 0.3} />
      <Figure era={2} at={[-9, 0, -11.0]} turn={Math.PI} action="work" phase={1} />

      {/* The robot cell: a car body on its jig, three welding robots, the controller cabinet,
          and the programmer at a terminal. */}
      <Surface name="concrete" size={[14, 0, 15]} at={[8, 0, -9.5]} tint="#8e9194" tile={3} />
      {[[8, -14], [8, -6]].map(([x, z]) => (
        <Box key={z} size={[8, 0.01, 0.1]} at={[x, 0.006, z]} m={m.yellow} />
      ))}
      {[4, 12].map((x) => (
        <Box key={x} size={[0.1, 0.01, 8]} at={[x, 0.006, -10]} m={m.yellow} />
      ))}
      <Box size={[3.4, 0.5, 1.4]} at={[8, 0.25, -10]} m={m.iron} />
      <Box size={[3.9, 0.65, 1.7]} at={[8, 0.95, -10]} m={m.primer} />
      <Box size={[2.0, 0.55, 1.5]} at={[7.8, 1.55, -10]} m={m.primer} />
      {([[6.6, -12.2, 0, 0], [9.4, -12.2, 0, 1.7], [8, -7.8, Math.PI, 3.1]] as const).map(([x, z, turn, phase], k) => (
        <Robot key={k} at={[x, 0, z]} turn={turn} phase={phase} tip={(o) => void (tips.current[k] = o)} />
      ))}
      <Sparks tips={tips} phases={[0, 1.7, 3.1]} />
      <Box size={[0.9, 1.9, 0.5]} at={[13.8, 0.95, -15.5]} m={m.grey} />
      <Panel size={[0.6, 0.5]} at={[13.8, 1.3, -15.24]} m={m.leds} />
      <Box size={[2.0, 0.75, 0.9]} at={[3, 0.375, -5.6]} m={m.grey} />
      <Box size={[0.5, 0.42, 0.45]} at={[3, 0.99, -5.7]} m={m.cream} />
      <Panel size={[0.4, 0.3]} at={[3, 0.99, -5.47]} m={m.amberScreen} />
      <Figure era={2} at={[3, 0, -4.7]} turn={Math.PI} action="type" />

      {/* The office: personal computers on desks, cabled to a server rack and out to a radio tower. */}
      <mesh position={[-7.5, 0.005, 7]} rotation={[-Math.PI / 2, 0, 0]} material={m.carpet} receiveShadow>
        <planeGeometry args={[14, 12]} />
      </mesh>
      {DESKS.map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Box size={[1.8, 0.75, 0.8]} at={[x, 0.375, z]} m={m.timberLight} />
          <Box size={[0.45, 0.16, 0.4]} at={[x, 0.83, z - 0.1]} m={m.cream} />
          <Box size={[0.42, 0.36, 0.38]} at={[x, 1.09, z - 0.1]} m={m.cream} />
          <Panel size={[0.34, 0.26]} at={[x, 1.09, z + 0.095]} m={m.gui} />
          <Box size={[0.5, 0.08, 0.5]} at={[x, 0.48, z + 0.75]} m={m.darkIron} />
        </group>
      ))}
      <Figure era={2} at={[-11, 0, 5.5]} turn={Math.PI} action="type" phase={0.5} />
      <Figure era={2} at={[-3.4, 0, 9.4]} turn={Math.PI / 2} phase={1.5} />
      <Box size={[0.8, 2, 0.8]} at={[-2.5, 1, 10.5]} m={m.darkIron} />
      <Panel size={[0.6, 1.4]} at={[-2.91, 1.1, 10.5]} rot={[0, -Math.PI / 2, 0]} m={m.leds} />
      {network.toRack.map((curve, i) => (
        <Cable key={i} curve={curve} m={m.darkIron} />
      ))}
      <Pulses curves={network.toRack} perCurve={3} speed={0.22} />
      <Backdrop set={2}>
      <Cable curve={network.toTower} r={0.035} m={m.darkIron} />
      <Pulses curves={[network.toTower]} perCurve={4} speed={0.22} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Rod key={`${sx}${sz}`} a={[-8 + sx * 1.8, 0, 24 + sz * 1.8]} b={[-8 + sx * 0.35, 16, 24 + sz * 0.35]} r={0.06} m={m.grey} />))}
      {[4, 8, 12].map((y) => {
        const half = 1.8 - (y / 16) * 1.45
        return (
          <group key={y}>
            {[-1, 1].map((s) => (
              <group key={s}>
                <Rod a={[-8 - half, y, 24 + s * half]} b={[-8 + half, y, 24 + s * half]} r={0.03} m={m.grey} />
                <Rod a={[-8 + s * half, y, 24 - half]} b={[-8 + s * half, y, 24 + half]} r={0.03} m={m.grey} />
              </group>
            ))}
          </group>
        )
      })}
      {[[12.5, 0.4], [14.6, -0.5]].map(([y, yaw]) => (
        <group key={y} position={[-8, y, 24]} rotation={[0, yaw, 0]}>
          <Cyl r={0.9} top={0.25} h={0.35} at={[0, 0, -0.6]} rot={[-Math.PI / 2, 0, 0]} m={m.white} />
        </group>
      ))}
      <mesh position={[-8, 16.2, 24]} material={m.led}>
        <sphereGeometry args={[0.12, 8, 6]} />
      </mesh>
      </Backdrop>

      {/* The microprocessor, seen as if through a macro lens: a ceramic package, its gold
          legs and bond wires, and the die with signals running through it. */}
      <mesh position={[8, 0, 7]} rotation={[-Math.PI / 2, 0, 0]} material={m.blackGloss} receiveShadow>
        <planeGeometry args={[16, 14]} />
      </mesh>
      <Box size={[5, 0.45, 2]} at={[8, 0.5, 7]} m={m.ceramic} />
      {Array.from({ length: 8 }, (_, k) => 8 - 2.1 + k * 0.6).flatMap((x) =>
        [-1, 1].map((s) => (
          <group key={`${x}${s}`}>
            <Box size={[0.14, 0.5, 0.05]} at={[x, 0.25, 7 + s * 1.06]} m={m.gold} />
            <Box size={[0.14, 0.05, 0.12]} at={[x, 0.5, 7 + s * 1.0]} m={m.gold} />
          </group>
        )),
      )}
      <Box size={[1.5, 0.02, 1.1]} at={[8, 0.73, 7]} m={m.gold} />
      <Panel size={[1.1, 0.8]} at={[8, 0.745, 7]} rot={[-Math.PI / 2, 0, 0]} m={m.die} />
      <Panel size={[1.1, 0.8]} at={[8, 0.75, 7]} rot={[-Math.PI / 2, 0, 0]} m={m.diePulse} />
      {Array.from({ length: 6 }, (_, k) => -0.45 + k * 0.18).flatMap((dx) =>
        [-1, 1].map((s) => <Rod key={`${dx}${s}`} a={[8 + dx, 0.75, 7 + s * 0.38]} b={[8 + dx * 1.6, 0.735, 7 + s * 0.52]} r={0.006} m={m.gold} />),
      )}
    </group>
  )
}

// ======================================================================================
// CMCN 4: a smart factory (cobots, self-driving carts, sensors, a dashboard), a 3D printer,
// a digital twin, and the connected world outside (wind, sun, roads, rail, data).
// ======================================================================================

function Cobot({ at, phase, wire }: { at: V3; phase: number; wire?: boolean }) {
  const { m } = usePalette()
  const body = wire ? m.wire : m.white
  const ring = wire ? m.wire : m.cobotBlue
  const base = useRef<Group>(null)
  const shoulder = useRef<Group>(null)
  const elbow = useRef<Group>(null)
  useFrame(() => {
    const t = film.t + phase
    if (base.current) base.current.rotation.y = 0.9 * Math.sin(t * 0.7)
    if (shoulder.current) shoulder.current.rotation.x = 0.5 + 0.35 * Math.sin(t * 0.9)
    if (elbow.current) elbow.current.rotation.x = 0.9 + 0.4 * Math.sin(t * 0.9 + 0.8)
  })
  return (
    <group position={at}>
      <Cyl r={0.11} h={0.12} at={[0, 0.06, 0]} m={body} />
      <group ref={base} position={[0, 0.12, 0]}>
        <Cyl r={0.075} h={0.16} at={[0, 0.08, 0]} m={body} />
        <Cyl r={0.08} h={0.03} at={[0, 0.17, 0]} m={ring} />
        <group ref={shoulder} position={[0, 0.2, 0]}>
          <Cyl r={0.055} h={0.45} at={[0, 0.225, 0]} m={body} />
          <group ref={elbow} position={[0, 0.45, 0]}>
            <Cyl r={0.07} h={0.03} at={[0, 0, 0]} m={ring} />
            <Cyl r={0.045} h={0.4} at={[0, 0.2, 0]} m={body} />
            <Cyl r={0.045} h={0.1} at={[0, 0.42, 0]} m={ring} />
            <Box size={[0.08, 0.06, 0.03]} at={[0, 0.5, 0]} m={wire ? m.wire : m.darkIron} />
          </group>
        </group>
      </group>
    </group>
  )
}

// Self-driving carts going round a marked loop on the floor.
function Carts() {
  const { m } = usePalette()
  const carts = useRef<(Group | null)[]>([])
  useFrame(() => {
    const [x0, x1, z0, z1] = [-13, 8, -15.5, -6.5]
    const loop = 2 * (x1 - x0 + (z1 - z0))
    carts.current.forEach((cart, i) => {
      if (!cart) return
      let d = (film.t * 1.6 + i * loop * 0.5) % loop
      let x = x0
      let z = z0
      let yaw = 0
      if (d < x1 - x0) [x, z, yaw] = [x0 + d, z0, Math.PI / 2]
      else if ((d -= x1 - x0) < z1 - z0) [x, z, yaw] = [x1, z0 + d, 0]
      else if ((d -= z1 - z0) < x1 - x0) [x, z, yaw] = [x1 - d, z1, -Math.PI / 2]
      else [x, z, yaw] = [x0, z1 - (d - (x1 - x0)), Math.PI]
      cart.position.set(x, 0, z)
      cart.rotation.y = yaw
    })
  })
  return (
    <>
      {[0, 1].map((i) => (
        <group key={i} ref={(g) => void (carts.current[i] = g)}>
          <Box size={[0.7, 0.28, 1.1]} at={[0, 0.16, 0]} m={m.white} />
          <Box size={[0.6, 0.05, 1.0]} at={[0, 0.32, 0]} m={m.cobotBlue} />
          <Cyl r={0.07} h={0.08} at={[0, 0.38, 0.4]} m={m.darkIron} />
          <Box size={[0.5, 0.03, 0.02]} at={[0, 0.2, 0.56]} m={m.cyan} />
        </group>
      ))}
    </>
  )
}

function Printer() {
  const { m } = usePalette()
  const object = useRef<Mesh>(null)
  const head = useRef<Group>(null)
  const vase = useMemo(
    () => new LatheGeometry([[0, 0], [0.16, 0], [0.2, 0.1], [0.13, 0.3], [0.17, 0.48], [0.12, 0.6], [0, 0.6]].map(([x, y]) => new Vector2(x, y)), 40),
    [],
  )
  useEffect(() => () => vase.dispose(), [vase])
  useFrame(() => {
    const p = printed()
    if (object.current) object.current.scale.y = Math.max(0.001, p)
    if (head.current) {
      head.current.position.set(0.3 * Math.sin(film.t * 7), 0.73 + 0.6 * p + 0.09, 0.25 * Math.sin(film.t * 5.3 + 1))
    }
  })
  return (
    <group position={[6, 0, -4]}>
      <Box size={[1.2, 0.7, 1.1]} at={[0, 0.35, 0]} m={m.white} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} size={[0.06, 1.3, 0.06]} at={[sx * 0.57, 1.35, sz * 0.52]} m={m.satin} />))}
      <Box size={[1.2, 0.22, 1.1]} at={[0, 2.11, 0]} m={m.white} />
      <Box size={[0.9, 0.03, 0.8]} at={[0, 0.715, 0]} m={m.satin} />
      <mesh ref={object} position={[0, 0.73, 0]} geometry={vase} material={m.print} castShadow />
      <group ref={head}>
        <Box size={[0.14, 0.14, 0.14]} at={[0, 0.05, 0]} m={m.darkIron} />
        <mesh position={[0, -0.04, 0]} material={m.nozzle}>
          <sphereGeometry args={[0.018, 8, 6]} />
        </mesh>
      </group>
      <Panel size={[1.1, 1.3]} at={[0, 1.35, 0.56]} m={m.glass} />
    </group>
  )
}

const TURBINES: V3[] = [[-24, 0, 52], [6, 0, 64], [34, 0, 50]]

export function SmartSet() {
  const { m, tex } = usePalette()
  useFrame(() => {
    // The twin's graph scrolls as new readings arrive; the sensors pulse gently.
    tex.graph.offset.x = film.t * 0.08
    m.cyan.color.setRGB(0.34, 0.87, 0.94).multiplyScalar(1.2 + 0.5 * Math.sin(film.t * 3))
  })
  const links = useMemo(
    () => [
      new QuadraticBezierCurve3(new Vector3(-2, 9, -2), new Vector3(2, 30, 30), new Vector3(TURBINES[1][0], 34, TURBINES[1][2])),
      new QuadraticBezierCurve3(new Vector3(-2, 9, -2), new Vector3(-20, 22, 20), new Vector3(TURBINES[0][0], 34, TURBINES[0][2])),
      new QuadraticBezierCurve3(new Vector3(-2, 9, -2), new Vector3(-30, 14, 20), new Vector3(-45, 1.5, 38)),
    ],
    [],
  )
  const panels = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = panels.current
    if (!mesh) return
    const o = new Object3D()
    let i = 0
    for (let c = 0; c < 10; c++)
      for (let r = 0; r < 8; r++) {
        o.position.set(-60 + c * 3.4, 1.0, 30 + r * 2.6)
        o.rotation.set(-0.5, 0, 0)
        o.updateMatrix()
        mesh.setMatrixAt(i++, o.matrix)
      }
    mesh.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      <Island colour="#4f5649" />
      {/* The hall: polished concrete, white walls, a band of daylight windows. */}
      <Surface name="concrete" size={[26, 0, 22]} at={[-2, 0, -8]} tint="#c9cccd" tile={4} roughness={0.35} />
      <Box size={[26, 9, 0.4]} at={[-2, 4.5, -19.2]} m={m.white} />
      <Panel size={[24, 2.2]} at={[-2, 7.2, -18.99]} m={m.daylight} />
      <Box size={[0.4, 9, 22]} at={[-15.2, 4.5, -8]} m={m.white} />
      {[-15, -9, -3].map((z) => (
        <Panel key={z} size={[1.2, 6]} at={[-14.99, 4.5, z]} rot={[0, Math.PI / 2, 0]} m={m.daylight} />
      ))}
      <SceneOnly>
        {[-17, -11, -5, 1].map((z) => (
          <Box key={z} size={[26, 0.3, 0.3]} at={[-2, 8.6, z]} m={m.white} />
        ))}
      </SceneOnly>
      {[[-2.5, -15.5, 21, 0.1], [-2.5, -6.5, 21, 0.1], [-13, -11, 0.1, 9], [8, -11, 0.1, 9]].map(([x, z, w, d]) => (
        <Box key={`${x}${z}`} size={[w, 0.01, d]} at={[x, 0.006, z]} m={m.yellow} />
      ))}
      <Carts />
      {/* Collaborative robots at their stations, each with a sensor. */}
      {[-12, -9, -6, -3].map((x, i) => (
        <group key={x}>
          <Box size={[1.8, 0.08, 1.2]} at={[x, 0.81, -10]} m={m.white} />
          <Box size={[1.6, 0.77, 1.0]} at={[x, 0.385, -10]} m={m.satin} />
          <Cobot at={[x, 0.85, -10]} phase={i * 1.4} />
          <Box size={[0.12, 0.08, 0.12]} at={[x + 0.5, 0.89, -9.8]} m={m.cobotBlue} />
          <Rod a={[x - 0.8, 0.85, -10.5]} b={[x - 0.8, 2.3, -10.5]} r={0.015} m={m.satin} />
          <mesh position={[x - 0.8, 2.35, -10.5]} rotation={[Math.PI / 2, 0, 0]} material={m.cyan}>
            <torusGeometry args={[0.08, 0.012, 6, 20]} />
          </mesh>
        </group>
      ))}
      <Panel size={[6.4, 2.8]} at={[-2, 4.0, -18.98]} m={m.dash} />
      <Figure era={3} at={[-3.2, 0, -15.5]} turn={Math.PI} />
      <Figure era={3} at={[-7.6, 0, -8.7]} turn={Math.PI + 0.4} action="work" phase={1} />
      <Printer />
      {/* The digital twin: the machine, its live copy over a projection table, the readings. */}
      <Box size={[0.7, 0.9, 0.7]} at={[-7, 0.45, -3]} m={m.satin} />
      <Cobot at={[-7, 0.9, -3]} phase={9} />
      <Cyl r={0.5} h={0.9} at={[-5, 0.45, -3]} m={m.darkIron} />
      <mesh position={[-5, 0.91, -3]} rotation={[Math.PI / 2, 0, 0]} material={m.cyan}>
        <torusGeometry args={[0.45, 0.01, 6, 40]} />
      </mesh>
      <Cobot at={[-5, 1.05, -3]} phase={9} wire />
      <Panel size={[1.3, 0.75]} at={[-6, 1.75, -3.9]} m={m.graph} />
      <Figure era={3} at={[-6, 0, -1.4]} turn={Math.PI} action="hold" />

      {/* Outside: a road with trucks, a railway with a train, solar panels, wind turbines,
          and the data links between them (thin, faint lines). */}
      <Backdrop set={3}>
      <mesh position={[0, -0.02, 68]} rotation={[-Math.PI / 2, 0, 0]} material={m.grass} receiveShadow>
        <planeGeometry args={[180, 130]} />
      </mesh>
      <Box size={[180, 0.02, 6]} at={[0, 0.01, 12]} m={m.asphalt} />
      <Box size={[180, 0.2, 3]} at={[0, 0.1, 22]} m={m.stone} />
      <Traffic />
      <instancedMesh ref={panels} args={[undefined, undefined, 80]} material={m.solar} castShadow>
        <boxGeometry args={[3, 0.06, 1.7]} />
      </instancedMesh>
      {TURBINES.map(([x, , z], i) => (
        <group key={x}>
          <Cyl r={0.9} top={0.5} h={34} at={[x, 17, z]} m={m.white} seg={16} />
          <Box size={[1.2, 1.2, 3]} at={[x, 34, z]} m={m.white} />
          <Spin at={[x, 34, z + 1.6]} speed={0.9} phase={i}>
            {[0, 1, 2].map((k) => (
              <group key={k} rotation={[0, 0, (k * Math.PI * 2) / 3]}>
                <Box size={[0.7, 15, 0.25]} at={[0, 7.6, 0]} m={m.white} />
              </group>
            ))}
          </Spin>
        </group>
      ))}
      {links.map((curve, i) => (
        <Cable key={i} curve={curve} r={0.05} m={m.link} />
      ))}
      <Pulses curves={links} perCurve={3} speed={0.15} />
      {[[-70, 112, 10, 30], [-40, 120, 12, 44], [-12, 116, 9, 36], [20, 118, 14, 52], [52, 112, 10, 34], [76, 120, 12, 40]].map(([x, z, w, h]) => (
        <Box key={x} size={[w, h, 10]} at={[x, h / 2, z]} m={m.grey} />
      ))}
      </Backdrop>
    </group>
  )
}

function Traffic() {
  const { m } = usePalette()
  const trucks = useRef<(Group | null)[]>([])
  const train = useRef<Group>(null)
  useFrame(() => {
    trucks.current.forEach((truck, i) => {
      if (!truck) return
      const dir = i === 0 ? 1 : -1
      truck.position.x = dir * ((((film.t * 9 + i * 80) % 170) + 170) % 170 - 85)
    })
    if (train.current) train.current.position.x = ((film.t * 22) % 300) - 150
  })
  return (
    <>
      {[0, 1].map((i) => (
        <group key={i} ref={(g) => void (trucks.current[i] = g)} position={[0, 0, i === 0 ? 10.6 : 13.4]} rotation={[0, i === 0 ? 0 : Math.PI, 0]}>
          <Box size={[2, 2.4, 2.3]} at={[3.6, 1.4, 0]} m={m.cobotBlue} />
          <Box size={[6.5, 2.8, 2.4]} at={[-0.8, 1.6, 0]} m={m.white} />
        </group>
      ))}
      <group ref={train} position={[0, 0, 22]}>
        {[0, 1, 2, 3, 4].map((k) => (
          <group key={k}>
            <Box size={[12, 3, 3]} at={[-k * 12.4, 1.7, 0]} m={m.white} />
            <Box size={[12, 0.25, 3.02]} at={[-k * 12.4, 1.5, 0]} m={m.cobotBlue} />
          </group>
        ))}
      </group>
    </>
  )
}

// ======================================================================================
// THE TIMELINE of the finale: a line of light behind the four sets, oldest to newest,
// with each era's number standing over its set.
// ======================================================================================

// THE FINALE: four tall showcases ("lands"), one per era, side by side high above the sets.
// Each is a column in its era's colours (those of the central hall's ceiling), with its
// inventions on ledges up the column and its number at the top. The camera starts close on
// CMCN 1 and pulls back until the four columns fill the screen.
export const LANDS_Y = 200
export const LAND_X = [-30, -10, 10, 30]
const LAND_WIDTH = 19
const LAND_HEIGHT = 40
// Ceiling colours (dome-painting.ts), light to deep: bronze, steel blue, green, teal.
const LAND_SHADES = [
  ['#d6ba96', '#a47a52', '#8a6038'],
  ['#96a0b0', '#3e4e6a', '#2a3852'],
  ['#96ac98', '#3a604a', '#244634'],
  ['#94acb4', '#385c6a', '#224250'],
]
const LAND_INVENTIONS = [
  ['ir1-1', 'ir1-2', 'ir1-3', 'ir1-4'],
  ['ir2-1', 'ir2-2', 'ir2-3', 'ir2-4', 'ir2-5'],
  ['ir3-1', 'ir3-2', 'ir3-3', 'ir3-4'],
  ['ir4-1', 'ir4-2', 'ir4-3', 'ir4-4', 'ir4-5'],
]

function Land({ era }: { era: number }) {
  const { m } = usePalette()
  const back = useMemo(() => {
    const [light, mid, deep] = LAND_SHADES[era]
    const texture = paint(512, 1024, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, light)
      g.addColorStop(0.45, mid)
      g.addColorStop(1, deep)
      c.fillStyle = g
      c.fillRect(0, 0, w, h)
      paintLandPattern(c, w, h, era)
      // Darker towards the edges, so the column has depth.
      const v = c.createRadialGradient(w / 2, h * 0.45, w * 0.2, w / 2, h * 0.45, h * 0.75)
      v.addColorStop(0, 'rgba(0,0,0,0)')
      v.addColorStop(1, 'rgba(0,0,0,0.5)')
      c.fillStyle = v
      c.fillRect(0, 0, w, h)
    })
    const material = new MeshBasicMaterial({ map: texture })
    material.color.setScalar(0.9)
    return material
  }, [era])
  useEffect(() => () => {
    back.map?.dispose()
    back.dispose()
  }, [back])
  const items = LAND_INVENTIONS[era]
  return (
    <group position={[LAND_X[era], 0, 0]}>
      {/* The column: its colour, a gold frame, a stone base. */}
      <mesh position={[0, LAND_HEIGHT / 2, -2.6]} material={back}>
        <planeGeometry args={[LAND_WIDTH, LAND_HEIGHT]} />
      </mesh>
      {[-1, 1].map((side) => (
        <Box key={side} size={[0.25, LAND_HEIGHT, 0.3]} at={[side * (LAND_WIDTH / 2), LAND_HEIGHT / 2, -2.5]} m={m.gold} />
      ))}
      <Box size={[LAND_WIDTH + 0.25, 0.3, 0.3]} at={[0, LAND_HEIGHT, -2.5]} m={m.gold} />
      <Box size={[LAND_WIDTH, 1.2, 7]} at={[0, -0.6, 0.8]} m={m.plinth} />
      <Box size={[LAND_WIDTH, 0.08, 0.12]} at={[0, 0.02, 4.3]} m={m.gold} />
      {/* The era's inventions on ledges, zig-zagging up the column. */}
      {items.map((id, i) => {
        const x = (i % 2 ? 1 : -1) * 4.2
        const y = 1 + i * (30 / items.length)
        return (
          <group key={id} position={[x, y, 0]}>
            <Box size={[6.5, 0.4, 5]} at={[0, -0.2, 0]} m={[m.timber, m.iron, m.grey, m.white][era]} />
            <Box size={[6.5, 0.06, 0.1]} at={[0, 0.02, 2.5]} m={m.gold} />
            <group scale={1.25}>
              <Invention id={id} />
            </group>
          </group>
        )
      })}
      <LandDeco era={era} />
      <group position={[0, LAND_HEIGHT - 4.5, -2.4]} scale={1.4}>
        <EraNumeral era={(['ir1', 'ir2', 'ir3', 'ir4'] as const)[era]} />
      </group>
    </group>
  )
}

// Each column's wall, painted in its era's style: brickwork and gears (steam), riveted steel
// plates and an Art Deco sunburst (electricity), circuit tracks and pixels (digital), a
// hexagon grid and a network of nodes (connected).
function paintLandPattern(c: CanvasRenderingContext2D, w: number, h: number, era: number) {
  const r = seeded(41 + era)
  c.save()
  if (era === 0) {
    c.strokeStyle = 'rgba(40, 20, 8, 0.35)'
    c.lineWidth = 2
    for (let y = 0; y < h; y += 24) {
      c.beginPath()
      c.moveTo(0, y)
      c.lineTo(w, y)
      c.stroke()
      for (let x = (y / 24) % 2 ? 0 : 32; x < w; x += 64) {
        c.beginPath()
        c.moveTo(x, y)
        c.lineTo(x, y + 24)
        c.stroke()
      }
    }
    c.strokeStyle = 'rgba(255, 220, 160, 0.16)'
    c.lineWidth = 10
    for (const [x, y, rad] of [[90, 260, 70], [420, 520, 110], [120, 800, 90]]) {
      c.beginPath()
      c.arc(x, y, rad, 0, Math.PI * 2)
      c.stroke()
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2
        c.fillStyle = 'rgba(255, 220, 160, 0.16)'
        c.fillRect(x + Math.cos(a) * rad - 8, y + Math.sin(a) * rad - 8, 16, 16)
      }
    }
  } else if (era === 1) {
    c.strokeStyle = 'rgba(255, 230, 180, 0.18)'
    c.lineWidth = 3
    for (let k = 0; k < 24; k++) {
      const a = Math.PI + (k / 23) * Math.PI
      c.beginPath()
      c.moveTo(w / 2, h)
      c.lineTo(w / 2 + Math.cos(a) * h, h + Math.sin(a) * h)
      c.stroke()
    }
    c.strokeStyle = 'rgba(0, 0, 0, 0.3)'
    c.fillStyle = 'rgba(220, 220, 230, 0.25)'
    for (let y = 0; y < h; y += 128)
      for (let x = 0; x < w; x += 128) {
        c.strokeRect(x, y, 128, 128)
        for (const [dx, dy] of [[10, 10], [118, 10], [10, 118], [118, 118]]) c.fillRect(x + dx - 3, y + dy - 3, 6, 6)
      }
  } else if (era === 2) {
    c.strokeStyle = 'rgba(150, 255, 180, 0.22)'
    c.lineWidth = 3
    for (let i = 0; i < 70; i++) {
      let x = Math.floor(r() * 16) * 32
      let y = Math.floor(r() * 32) * 32
      c.beginPath()
      c.moveTo(x, y)
      for (let k = 0; k < 4; k++) {
        if (r() < 0.5) x += (r() < 0.5 ? -1 : 1) * 64
        else y += (r() < 0.5 ? -1 : 1) * 64
        c.lineTo(x, y)
      }
      c.stroke()
      c.fillStyle = 'rgba(150, 255, 180, 0.35)'
      c.fillRect(x - 5, y - 5, 10, 10)
    }
  } else {
    c.strokeStyle = 'rgba(160, 240, 255, 0.16)'
    c.lineWidth = 2
    const R = 30
    for (let row = 0; row < h / (R * 1.5) + 1; row++)
      for (let col = 0; col < w / (R * 1.73) + 1; col++) {
        const cx = col * R * 1.73 + (row % 2) * R * 0.87
        const cy = row * R * 1.5
        c.beginPath()
        for (let k = 0; k <= 6; k++) c.lineTo(cx + R * Math.cos((k * Math.PI) / 3 + Math.PI / 6), cy + R * Math.sin((k * Math.PI) / 3 + Math.PI / 6))
        c.stroke()
      }
    const nodes = Array.from({ length: 14 }, () => [r() * w, r() * h])
    c.strokeStyle = 'rgba(180, 250, 255, 0.3)'
    nodes.forEach(([x, y], i) => {
      const [nx, ny] = nodes[(i + 3) % nodes.length]
      c.beginPath()
      c.moveTo(x, y)
      c.lineTo(nx, ny)
      c.stroke()
      c.fillStyle = 'rgba(200, 250, 255, 0.6)'
      c.beginPath()
      c.arc(x, y, 6, 0, Math.PI * 2)
      c.fill()
    })
  }
  c.restore()
}

// Era decorations on each column: turning gears (steam), a row of glowing bulbs (electricity),
// small green screens (digital), slowly turning rings of light (connected).
function LandDeco({ era }: { era: number }) {
  const { m, shape } = usePalette()
  const side = (i: number) => (i % 2 ? -1 : 1) * 7.6
  if (era === 0)
    return (
      <>
        {[[7.2, 8, 1.6, 1], [-7.3, 15, 1.2, -1.4], [7.4, 23, 2, 0.8], [-7, 31, 1.4, -1]].map(([x, y, r, sp], i) => (
          <Spin key={i} at={[x, y, -2.3]} speed={sp * 0.5}>
            <mesh geometry={shape(`landGear${i}`, () => gearShape(r, Math.round(r * 10), 0.25))} material={m.brass} />
          </Spin>
        ))}
      </>
    )
  if (era === 1)
    return (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} position={[-7.7 + i * 2.2, LAND_HEIGHT - 1.2, -1.6]}>
            <Rod a={[0, 0, 0]} b={[0, 1.2, 0]} r={0.02} m={m.darkIron} />
            <mesh material={m.bulb}>
              <sphereGeometry args={[0.18, 12, 8]} />
            </mesh>
          </group>
        ))}
        {[6, 14, 22, 30].map((y, i) => (
          <Box key={y} size={[0.4, 4, 0.2]} at={[side(i), y, -2.4]} m={m.brass} />
        ))}
      </>
    )
  if (era === 2)
    return (
      <>
        {[5, 11, 17, 23, 29].map((y, i) => (
          <group key={y} position={[side(i), y, -2.3]}>
            <Box size={[2.2, 1.6, 0.3]} at={[0, 0, 0]} m={m.cream} />
            <Panel size={[1.8, 1.2]} at={[0, 0, 0.16]} m={m.crt} />
          </group>
        ))}
      </>
    )
  return (
    <>
      {[7, 16, 25, 33].map((y, i) => (
        <Spin key={y} at={[side(i), y, -2.2]} speed={(i % 2 ? 1 : -1) * 0.3}>
          <mesh material={m.cyan}>
            <torusGeometry args={[1.4, 0.06, 6, 6]} />
          </mesh>
          <mesh material={m.cyan} scale={0.6}>
            <torusGeometry args={[1.4, 0.05, 6, 6]} />
          </mesh>
        </Spin>
      ))}
    </>
  )
}

export function FinaleLands() {
  const group = useRef<Group>(null)
  useFrame(() => {
    if (group.current) group.current.visible = film.t >= START.timeline - 0.5
  })
  return (
    // The downloaded models are already shown in the museum: copies are made for here.
    <ModelCopy.Provider value={true}>
      <group ref={group} position={[0, LANDS_Y, 0]} visible={false}>
        {[0, 1, 2, 3].map((era) => (
          <Land key={era} era={era} />
        ))}
      </group>
    </ModelCopy.Provider>
  )
}

