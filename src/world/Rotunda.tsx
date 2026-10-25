import { useEffect, useMemo } from 'react'
import { BackSide, CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import {
  DOOR_WIDTH,
  PILLARS,
  ROTUNDA_APOTHEM,
  ROTUNDA_HEIGHT,
  ROTUNDA_RADIUS,
  ROTUNDA_SIDES,
  SIDE_LENGTH,
  CHANDELIER_Y,
  frameOfSide,
  toWorld,
} from './layout'
import { useSurface } from './textures'
import { DARK_WOOD, GOLD } from './style'

// THE ROTUNDA: a grand Victorian dome hall (M6). Everything is built from simple shapes
// plus a few textures, so it stays light: marble floor with gold inlays, plaster walls with
// a wood wainscot and a cornice, 12 columns, framed damask panels with wall lamps on the
// blank walls, a coffered dome with a glowing oculus, and a chandelier.
//
// 12-sided shapes are "circles" with 12 segments, turned 15 degrees so their flat sides
// line up with the walls (flat sides facing north and south).
const TURN = Math.PI / ROTUNDA_SIDES
const H = ROTUNDA_HEIGHT
const A = ROTUNDA_APOTHEM

// Radius of a 12-sided shape whose flat sides are `apothem` from the centre.
function corner(apothem: number) {
  return apothem / Math.cos(Math.PI / ROTUNDA_SIDES)
}

// Things that glow (bulbs, oculus, gold inlays) are brighter than white, so the bloom
// effect picks them up. toneMapped={false} keeps them bright.
function Glow({ colour, intensity }: { colour: string; intensity: number }) {
  return <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={intensity} toneMapped={false} />
}

function Floor() {
  const marble = useSurface('marble', 6)
  const darkMarble = useSurface('marble', 2)
  // Thin decorations sit a few millimetres above the floor; polygonOffset avoids flicker.
  const inlay = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <circleGeometry args={[ROTUNDA_RADIUS, ROTUNDA_SIDES, TURN]} />
        <meshStandardMaterial {...marble} color="#f4efe6" roughness={0.18} />
      </mesh>
      {/* Dark central medallion and two gold rings. */}
      <mesh position={[0, 0, 0.002]} receiveShadow>
        <circleGeometry args={[3, 48]} />
        <meshStandardMaterial {...darkMarble} color="#5a4a42" roughness={0.2} {...inlay} />
      </mesh>
      {[3, 7.4].map((r) => (
        <mesh key={r} position={[0, 0, 0.004]}>
          <ringGeometry args={[r, r + 0.12, 64]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} emissive={GOLD} emissiveIntensity={0.25} {...inlay} />
        </mesh>
      ))}
    </group>
  )
}

// Decorations on each of the 12 walls. Local axes: x along the wall, +z into the hall.
function WallDecor() {
  const halfSide = SIDE_LENGTH / 2
  const halfDoor = DOOR_WIDTH / 2
  return (
    <>
      {Array.from({ length: ROTUNDA_SIDES }, (_, side) => {
        const f = frameOfSide(side)
        const [x, z] = toWorld(f, 0, A)
        const hasDoor = side % 2 === 0
        // Wainscot (lower wooden band) with a gold rail: beside the door, or full width.
        const spans: [number, number][] = hasDoor
          ? [
              [-halfSide, -halfDoor - 0.55],
              [halfDoor + 0.55, halfSide],
            ]
          : [[-halfSide, halfSide]]
        return (
          <group key={side} position={[x, 0, z]} rotation={[0, f.angle, 0]}>
            {spans.map(([u0, u1]) => (
              <group key={u0} position={[(u0 + u1) / 2, 0, 0]}>
                <mesh position={[0, 0.55, 0.025]} receiveShadow>
                  <boxGeometry args={[u1 - u0, 1.1, 0.05]} />
                  <meshStandardMaterial color={DARK_WOOD} roughness={0.5} />
                </mesh>
                <mesh position={[0, 1.13, 0.04]}>
                  <boxGeometry args={[u1 - u0, 0.06, 0.08]} />
                  <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
                </mesh>
              </group>
            ))}
            {!hasDoor && <DamaskPanel halfSide={halfSide} />}
          </group>
        )
      })}
    </>
  )
}

// Blank-wall decoration: a gold-framed fabric panel between two glowing wall lamps.
function DamaskPanel({ halfSide }: { halfSide: number }) {
  const w = 3
  const h = 3.4
  const y = 3.9
  const t = 0.12 // frame thickness
  return (
    <group>
      <mesh position={[0, y, 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#5c1f27" roughness={0.85} />
      </mesh>
      {[
        [0, y + h / 2, w + t, t],
        [0, y - h / 2, w + t, t],
        [-w / 2, y, t, h + t],
        [w / 2, y, t, h + t],
      ].map(([px, py, sx, sy], i) => (
        <mesh key={i} position={[px, py, 0.05]}>
          <boxGeometry args={[sx, sy, 0.08]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (halfSide - 0.85), 3.1, 0]}>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.16, 0.36, 0.06]} />
            <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.22, 0.2]}>
            <sphereGeometry args={[0.09, 16, 12]} />
            <Glow colour="#ffd49a" intensity={6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// A column at each of the 12 corners: base, shaft, gold rings and a capital.
function Columns() {
  const shaftHeight = H - 1.05
  return (
    <>
      {PILLARS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, Math.atan2(x, z), 0]}>
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.0, 0.5, 1.0]} />
            <meshStandardMaterial color="#e3dac8" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.5 + shaftHeight / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.36, 0.4, shaftHeight, 24]} />
            <meshStandardMaterial color="#f1ebdd" roughness={0.3} />
          </mesh>
          {[0.58, H - 0.62].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <torusGeometry args={[0.41, 0.035, 8, 32]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
          <mesh position={[0, H - 0.4, 0]} receiveShadow>
            <cylinderGeometry args={[0.55, 0.38, 0.3, 24]} />
            <meshStandardMaterial color="#e9e1cf" roughness={0.35} />
          </mesh>
          <mesh position={[0, H - 0.15, 0]} receiveShadow>
            <boxGeometry args={[1.15, 0.2, 1.15]} />
            <meshStandardMaterial color="#e9e1cf" roughness={0.35} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// Cornice: a band that runs round the top of the walls, sticking out 30 cm, with a gold
// line. Built as 12-sided rings seen from inside (BackSide), so corners join cleanly.
function Cornice() {
  const depth = 0.3
  const band = 0.6
  const front = corner(A - depth)
  return (
    <>
      <mesh position={[0, H - band / 2, 0]}>
        <cylinderGeometry args={[front, front, band, ROTUNDA_SIDES, 1, true, TURN]} />
        <meshStandardMaterial color="#efe4cf" roughness={0.6} side={BackSide} />
      </mesh>
      <mesh position={[0, H - band, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[front, corner(A) + 0.05, ROTUNDA_SIDES, 1, TURN]} />
        <meshStandardMaterial color="#e2d6bd" roughness={0.6} />
      </mesh>
      <mesh position={[0, H - band - 0.03, 0]}>
        <cylinderGeometry args={[front - 0.02, front - 0.02, 0.06, ROTUNDA_SIDES, 1, true, TURN]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} side={BackSide} />
      </mesh>
    </>
  )
}

// Coffers (recessed square panels) painted onto a small picture that repeats over the dome.
// On a dome the squares naturally get smaller towards the top, like real coffers.
function useCofferTexture() {
  const texture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#e8dcc3' // ribs between coffers
      ctx.fillRect(0, 0, size, size)
      for (let i = 0; i < 4; i++) {
        // Nested squares, darker inwards, to look recessed.
        const inset = 14 + i * 9
        const shade = 200 - i * 22
        ctx.fillStyle = `rgb(${shade + 20}, ${shade + 8}, ${shade - 20})`
        ctx.fillRect(inset, inset, size - 2 * inset, size - 2 * inset)
      }
      ctx.fillStyle = '#c9a25a' // small gold rosette in the middle
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, 7, 0, Math.PI * 2)
      ctx.fill()
    }
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(32, 7)
    tex.anisotropy = 8
    return tex
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function Dome() {
  const coffers = useCofferTexture()
  const radius = ROTUNDA_RADIUS
  const oculusAngle = 0.18 // leaves a round opening about 4.4 m wide at the top
  const top = H + radius * Math.cos(oculusAngle)
  const oculusRadius = radius * Math.sin(oculusAngle)
  return (
    <>
      {/* Seen from inside (BackSide). It casts no shadow, so sunlight still comes in. */}
      <mesh position={[0, H, 0]}>
        <sphereGeometry args={[radius, 64, 24, 0, Math.PI * 2, oculusAngle, Math.PI / 2 - oculusAngle]} />
        <meshStandardMaterial map={coffers} roughness={0.7} side={BackSide} />
      </mesh>
      {/* Oculus: a bright sky disc above the opening, with a gold ring around it. */}
      <mesh position={[0, top + 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[oculusRadius + 0.5, 48]} />
        <Glow colour="#fff4dc" intensity={3} />
      </mesh>
      <mesh position={[0, top, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[oculusRadius, 0.14, 10, 64]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} />
      </mesh>
    </>
  )
}

// A two-tier chandelier hanging from the dome, with glowing candle bulbs. (Its real light
// lives in Museum.tsx, outside the hide-when-unseen group: see ChandelierLight there.)
function Chandelier() {
  const y = CHANDELIER_Y
  const tiers: [number, number, number][] = [
    [1.6, 0, 16], // radius, height offset, bulbs
    [0.95, -0.45, 8],
  ]
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 5.4, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 10.6, 6]} />
        <meshStandardMaterial color="#2e2a26" metalness={0.6} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.32, 24, 16]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} />
      </mesh>
      {tiers.map(([r, dy, bulbs]) => (
        <group key={r} position={[0, dy, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.045, 8, 64]} />
            <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} />
          </mesh>
          {Array.from({ length: bulbs }, (_, i) => {
            const a = (i / bulbs) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * r, 0.1, Math.sin(a) * r]}>
                <sphereGeometry args={[0.07, 10, 8]} />
                <Glow colour="#ffd49a" intensity={8} />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

export default function Rotunda() {
  return (
    <>
      <Floor />
      <WallDecor />
      <Columns />
      <Cornice />
      <Dome />
      <Chandelier />
    </>
  )
}
