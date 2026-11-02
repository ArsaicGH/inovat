import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
  type Group,
  type InstancedMesh,
  type Material,
  type Mesh,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { repeated, useSurfaceTextures, type SurfaceName } from './textures'
import EraNumeral from './EraNumeral'
import Invention, { ModelCopy } from './inventions'
import { film, smooth, START } from './ending-shots'

// THE ENDING FILM'S SETS (script in ending-shots.ts, played by EndingScene.tsx): one set per
// era, built from simple shapes, with working machines and people, lit by the film's
// borrowed lights. Like film-studio sets they have no roofs and open fronts, so the last
// shot can look down on all four side by side.

type V3 = [number, number, number]

// ---------- Materials and pictures, shared by all sets ----------
// Made when the film starts and freed when it ends (disposePalette).

export function paint(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, wrap = false) {
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
export function seeded(seed: number) {
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
export const usePalette = () => (palette ??= makePalette())
// Called when the film ends: frees every material and picture made for it.
export function disposePalette() {
  palette?.dispose()
  palette = null
}

// A toothed gear and a spoked wheel, in the x-y plane (they turn about z).
export function gearShape(radius: number, teeth: number, depth: number) {
  const parts: BufferGeometry[] = [new CylinderGeometry(radius, radius, depth, 32).rotateX(Math.PI / 2)]
  for (let i = 0; i < teeth; i++) parts.push(new BoxGeometry(radius * 0.2, radius * 0.24, depth).translate(0, radius * 1.06, 0).rotateZ((i / teeth) * Math.PI * 2))
  const merged = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  return merged
}
export function wheelShape(radius: number, spokes: number, depth: number) {
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

export function Box({ size, at, m, rot }: { size: V3; at: V3; m: Material; rot?: V3 }) {
  return (
    <mesh position={at} rotation={rot} material={m} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}
export function Cyl({ r, h, at, m, rot, top, seg = 24 }: { r: number; h: number; at: V3; m: Material; rot?: V3; top?: number; seg?: number }) {
  return (
    <mesh position={at} rotation={rot} material={m} castShadow receiveShadow>
      <cylinderGeometry args={[top ?? r, r, h, seg]} />
    </mesh>
  )
}
// A flat glowing panel (windows, screens).
export function Panel({ size, at, m, rot }: { size: [number, number]; at: V3; m: Material; rot?: V3 }) {
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
export function Rod({ a, b, r, m }: { a: V3; b: V3; r: number; m: Material }) {
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
export function Surface({ name, size, at, tint, tile, roughness = 0.85, wall }: { name: SurfaceName; size: V3; at: V3; tint: string; tile: number; roughness?: number; wall?: boolean }) {
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

// Something that keeps turning about one axis.
export function Spin({ at, axis = 'z', speed, children, phase = 0 }: { at: V3; axis?: 'x' | 'y' | 'z'; speed: number | (() => number); phase?: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (ref.current && film.running) ref.current.rotation[axis] = phase + (typeof speed === 'number' ? film.t * speed : speed())
  })
  return (
    <group ref={ref} position={at}>
      {children}
    </group>
  )
}

// SOFT PUFFS (steam, smoke): many small round pictures that always face the camera, drawn in
// one batch. Each is born at a place given by `spawn`, drifts up, grows and fades.
export function Puffs({ count, material, colour, size, life, rate, spawn, rise = 0.6, spread = 0.4 }: {
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
    if (!mesh || !film.running) return
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
export function Figure({ era, at, turn = 0, action = 'stand', phase = 0 }: { era: number; at: V3; turn?: number; action?: Action; phase?: number }) {
  const { m, outfits } = usePalette()
  const o = outfits[era]
  const left = useRef<Group>(null)
  const right = useRef<Group>(null)
  useFrame(() => {
    if (!film.running) return
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
  ['ir1-1', 'ir1-2', 'ir1-3', 'ir1-4', 'ir1-5'],
  ['ir2-1', 'ir2-2', 'ir2-3', 'ir2-4', 'ir2-5'],
  ['ir3-1', 'ir3-2', 'ir3-3', 'ir3-4', 'ir3-5'],
  ['ir4-1', 'ir4-2', 'ir4-3', 'ir4-4', 'ir4-5', 'ir4-6'],
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
    if (group.current) group.current.visible = film.running && film.t >= START.timeline - 0.5
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

