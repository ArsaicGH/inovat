import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, CanvasTexture, Color, RepeatWrapping, SRGBColorSpace, type Group, type MeshBasicMaterial, type Points, type PointsMaterial } from 'three'
import { useMuseumStore } from '../state/useMuseumStore'
import { GOLD } from './style'

// THE PORTAL DOOR in the Game Room's back wall. Until the quiz is passed it is a plain,
// closed double door in a white-and-gold frame. Once the visitor gets half or more right
// (quizPassed), the two leaves swing open and reveal a heavenly portal of white-gold light
// filling the doorway. Walking into it starts the ending (inPortal in layout.ts,
// EndingScene.tsx).
//
// Local coordinates: x across the wall, y up, z out of the wall into the room.

const W = 2.2 // opening width
const H = 3.0 // opening height
const LEAF_W = W / 2
const OPEN_ANGLE = 1.4 // radians each leaf turns when fully open (out into the room)
const OPEN_TIME = 2.5 // seconds to swing open

function Leaf({ side, open }: { side: -1 | 1; open: { current: number } }) {
  const hinge = useRef<Group>(null)
  useFrame(() => {
    // Ease in and out, so the doors start and stop gently.
    const t = open.current
    const eased = t * t * (3 - 2 * t)
    if (hinge.current) hinge.current.rotation.y = side * eased * OPEN_ANGLE
  })
  const ivory = <meshStandardMaterial color="#f1e9d8" roughness={0.4} />
  const gold = <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
  return (
    // Hinged at the outer edge of the opening.
    <group ref={hinge} position={[side * (W / 2), 0, 0.06]}>
      <group position={[-side * (LEAF_W / 2), H / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[LEAF_W - 0.02, H - 0.02, 0.08]} />
          {ivory}
        </mesh>
        {/* Two raised panels with gold mouldings. */}
        {[0.62, -0.5].map((y) => (
          <group key={y} position={[0, y * (H / 2), 0.045]}>
            <mesh>
              <boxGeometry args={[LEAF_W * 0.68, y > 0 ? H * 0.34 : H * 0.36, 0.02]} />
              {ivory}
            </mesh>
          </group>
        ))}
        {[0.62, -0.5].map((y) =>
          [-1, 1].flatMap((sx) => [
            <mesh key={`v${y}${sx}`} position={[sx * LEAF_W * 0.34, y * (H / 2), 0.06]}>
              <boxGeometry args={[0.025, y > 0 ? H * 0.34 : H * 0.36, 0.015]} />
              {gold}
            </mesh>,
            <mesh key={`h${y}${sx}`} position={[0, y * (H / 2) + sx * (y > 0 ? H * 0.17 : H * 0.18), 0.06]}>
              <boxGeometry args={[LEAF_W * 0.68, 0.025, 0.015]} />
              {gold}
            </mesh>,
          ]),
        )}
        {/* Gold handle near the middle of the double door. */}
        <mesh position={[-side * (LEAF_W / 2 - 0.12), -0.1, 0.07]}>
          <boxGeometry args={[0.03, 0.3, 0.04]} />
          {gold}
        </mesh>
      </group>
    </group>
  )
}

// ---- The light of the portal: soft pictures painted once, in code (no downloads). ----

// A glow, brightest in the middle and warmer at the edges, filling the whole doorway.
function paintGlow(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 150, 4, 64, 140, 170)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.35, '#fff6e2')
  g.addColorStop(0.75, '#ffe2a8')
  g.addColorStop(1, '#f6c878')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 256)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// Soft vertical light rays, see-through between them; it repeats sideways, so sliding it
// makes the rays drift across the doorway.
function paintRays(seed: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  let s = seed
  const random = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < 14; i++) {
    const x = random() * 256
    const width = 6 + random() * 26
    const g = ctx.createLinearGradient(x - width, 0, x + width, 0)
    g.addColorStop(0, 'rgba(255, 240, 210, 0)')
    g.addColorStop(0.5, `rgba(255, 244, 222, ${0.25 + random() * 0.45})`)
    g.addColorStop(1, 'rgba(255, 240, 210, 0)')
    ctx.fillStyle = g
    ctx.fillRect(x - width, 0, width * 2, 64)
    // The same ray again one picture-width away, so the repeat has no seam.
    ctx.fillRect(x - width - 256, 0, width * 2, 64)
    ctx.fillRect(x - width + 256, 0, width * 2, 64)
  }
  // Fade out at the top and bottom.
  ctx.globalCompositeOperation = 'destination-in'
  const fade = ctx.createLinearGradient(0, 0, 0, 64)
  fade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  fade.addColorStop(0.25, 'rgba(0, 0, 0, 1)')
  fade.addColorStop(0.8, 'rgba(0, 0, 0, 1)')
  fade.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = fade
  ctx.fillRect(0, 0, 256, 64)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  return texture
}

// A round soft spot: the floating motes, and the light spilling onto the floor.
function paintSpot(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255, 250, 235, 1)')
  g.addColorStop(0.4, 'rgba(255, 232, 180, 0.5)')
  g.addColorStop(1, 'rgba(255, 220, 160, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// The rays and the light on the floor and wall, brighter than white so they glow.
const RAY_COLOUR = new Color(1.7, 1.6, 1.4)
const SPILL_COLOUR = new Color(1.6, 1.4, 1.0)
const MOTES = 70 // golden specks of light drifting up out of the portal
const MOTE_DEPTH = 1.2 // how far into the room they drift (metres)

// Each mote: a random start position in front of the doorway and its own rising speed.
function placeMotes() {
  const positions = new Float32Array(MOTES * 3)
  const speeds = new Float32Array(MOTES)
  for (let i = 0; i < MOTES; i++) {
    positions[i * 3] = (Math.random() - 0.5) * W
    positions[i * 3 + 1] = Math.random() * H
    positions[i * 3 + 2] = 0.05 + Math.random() * MOTE_DEPTH
    speeds[i] = 0.12 + Math.random() * 0.25
  }
  return { positions, speeds }
}

export default function PortalDoor() {
  const passed = useMuseumStore((state) => state.quizPassed)
  const open = useRef(0) // 0 = closed, 1 = fully open
  const glow = useRef<MeshBasicMaterial>(null)
  const rays = useRef<(MeshBasicMaterial | null)[]>([])
  const spill = useRef<MeshBasicMaterial>(null)
  const halo = useRef<MeshBasicMaterial>(null)
  const motes = useRef<Points>(null)
  const light = useRef<Group>(null)
  const textures = useMemo(() => ({ glow: paintGlow(), rays: [paintRays(7), paintRays(31)], spot: paintSpot() }), [])
  useEffect(() => () => [textures.glow, ...textures.rays, textures.spot].forEach((t) => t.dispose()), [textures])
  const moteData = useMemo(() => placeMotes(), [])

  useFrame((state, delta) => {
    const target = passed ? 1 : 0
    open.current = Math.min(1, Math.max(0, open.current + Math.sign(target - open.current) * (delta / OPEN_TIME)))
    const shown = open.current > 0.01
    if (light.current) light.current.visible = shown // nothing is drawn while the door is shut
    if (!shown) return
    const t = state.clock.elapsedTime
    const o = open.current
    // The light swells as the doors open, then breathes slowly.
    const breath = 1 + 0.08 * Math.sin(t * 1.3)
    // (Brighter, leader 2026-11-01: the core well above white, so the bloom makes it blaze.)
    if (glow.current) glow.current.color.setScalar(2.8 * o * breath)
    rays.current.forEach((ray, i) => {
      if (!ray?.map) return
      ray.map.offset.x += delta * (i === 0 ? 0.015 : -0.022)
      ray.opacity = o * (0.8 + 0.2 * Math.sin(t * (0.7 + i * 0.4) + i))
    })
    if (spill.current) spill.current.opacity = Math.min(1, 0.9 * o * breath)
    if (halo.current) halo.current.opacity = 0.45 * o * breath
    // Motes rise and sway gently; one that reaches the top starts again at the bottom.
    const points = motes.current
    if (points) {
      const position = points.geometry.attributes.position
      const array = position.array as Float32Array
      for (let i = 0; i < MOTES; i++) {
        array[i * 3 + 1] += moteData.speeds[i] * delta
        array[i * 3] += Math.sin(t * 0.8 + i) * 0.04 * delta
        if (array[i * 3 + 1] > H) array[i * 3 + 1] = 0
      }
      position.needsUpdate = true
      ;(points.material as PointsMaterial).opacity = o
    }
  })
  const gold = <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.28} />
  // Light adds to what is behind it, glows (bloom: brighter than white) and casts no shadow.
  const additive = { transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false } as const
  return (
    <group>
      {/* THE PORTAL'S LIGHT: a heavenly glow filling the whole doorway, drifting rays of
          light, golden motes floating up into the room, and light spilling over the floor.
          Shown only once the doors start to open. */}
      <group ref={light} visible={false}>
        <mesh position={[0, H / 2, 0.02]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial ref={glow} map={textures.glow} color="#000000" toneMapped={false} />
        </mesh>
        {textures.rays.map((map, i) => (
          <mesh key={i} position={[0, H / 2, 0.03 + i * 0.01]}>
            <planeGeometry args={[W, H]} />
            <meshBasicMaterial
              ref={(material: MeshBasicMaterial | null) => {
                rays.current[i] = material
              }}
              map={map}
              color={RAY_COLOUR}
              opacity={0}
              {...additive}
            />
          </mesh>
        ))}
        {/* (Above the carpet, not in it: two surfaces at one height flickered.) */}
        <mesh position={[0, 0.03, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W * 1.6, 2]} />
          <meshBasicMaterial ref={spill} map={textures.spot} color={SPILL_COLOUR} opacity={0} {...additive} />
        </mesh>
        {/* A soft halo of the light on the wall around the doorway. */}
        <mesh position={[0, H / 2, -0.01]}>
          <planeGeometry args={[W * 2.6, H * 1.7]} />
          <meshBasicMaterial ref={halo} map={textures.spot} color={SPILL_COLOUR} opacity={0} {...additive} />
        </mesh>
        <points ref={motes} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[moteData.positions, 3]} />
          </bufferGeometry>
          <pointsMaterial map={textures.spot} color="#fff0c8" size={0.09} sizeAttenuation opacity={0} {...additive} />
        </points>
      </group>
      <Leaf side={-1} open={open} />
      <Leaf side={1} open={open} />
      {/* White door surround with a gold inner bead, and a pediment with a gold crest. */}
      {[
        [-(W / 2 + 0.15), H / 2, 0.3, H],
        [W / 2 + 0.15, H / 2, 0.3, H],
        [0, H + 0.15, W + 0.6, 0.3],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.08]} castShadow>
          <boxGeometry args={[w, h, 0.16]} />
          <meshStandardMaterial color="#f7f3ea" roughness={0.35} />
        </mesh>
      ))}
      {[
        [-(W / 2 + 0.01), H / 2, 0.03, H],
        [W / 2 + 0.01, H / 2, 0.03, H],
        [0, H + 0.01, W + 0.05, 0.03],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.17]}>
          <boxGeometry args={[w, h, 0.03]} />
          {gold}
        </mesh>
      ))}
      <mesh position={[0, H + 0.15, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.05, 24]} />
        {gold}
      </mesh>
    </group>
  )
}
