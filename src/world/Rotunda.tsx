import Centrepiece from './Centrepiece'
import MergeStatic from './MergeStatic'
import HangingSculptures from './HangingSculptures'
import { paintCrown, paintDome } from './dome-painting'
import { useEffect, useMemo } from 'react'
import { BackSide } from 'three'
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
// blank walls, a coffered dome with a painted crown, and a chandelier.
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

// Things that glow (bulbs, gold inlays) are brighter than white, so the bloom
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
  // Sized from the wall, with room for the wall lamps on either side.
  const w = halfSide * 0.9
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
        <group key={s} position={[s * (halfSide - 0.5), 3.1, 0]}>
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
  // White polished marble with cream stone and gilded bases, rings and capitals.
  const marble = <meshStandardMaterial color="#f1ebdd" roughness={0.25} />
  const stone = <meshStandardMaterial color="#e3dac8" roughness={0.4} />
  const gold = <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
  return (
    <>
      {PILLARS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, Math.atan2(x, z), 0]}>
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.0, 0.5, 1.0]} />
            {stone}
          </mesh>
          <mesh position={[0, 0.56, 0]} castShadow>
            <cylinderGeometry args={[0.46, 0.5, 0.12, 24]} />
            {gold}
          </mesh>
          <mesh position={[0, 0.5 + shaftHeight / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.36, 0.4, shaftHeight, 24]} />
            {marble}
          </mesh>
          {/* Gold rings round the shaft, lying flat. */}
          {[0.68, 2.4, H - 0.62].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[y < 1 ? 0.41 : 0.38, 0.035, 8, 32]} />
              {gold}
            </mesh>
          ))}
          <mesh position={[0, H - 0.4, 0]} receiveShadow>
            <cylinderGeometry args={[0.55, 0.38, 0.3, 24]} />
            {gold}
          </mesh>
          <mesh position={[0, H - 0.15, 0]} receiveShadow>
            <boxGeometry args={[1.15, 0.2, 1.15]} />
            {stone}
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
// The dome's painting (dome-painting.ts): classical coffers with an era section above
// each era door. Painted once.
function useDomeTexture() {
  const texture = useMemo(() => paintDome(), [])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function useCrownTexture() {
  const texture = useMemo(() => paintCrown(), [])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function Dome() {
  const coffers = useDomeTexture()
  const crown = useCrownTexture()
  const radius = ROTUNDA_RADIUS
  const oculusAngle = 0.18 // the round crown at the top, about 4.4 m wide
  const top = H + radius * Math.cos(oculusAngle)
  const oculusRadius = radius * Math.sin(oculusAngle)
  return (
    <>
      {/* Seen from inside (BackSide). It casts no shadow, so sunlight still comes in. */}
      <mesh position={[0, H, 0]}>
        <sphereGeometry args={[radius, 64, 24, 0, Math.PI * 2, oculusAngle, Math.PI / 2 - oculusAngle]} />
        <meshStandardMaterial map={coffers} roughness={0.7} side={BackSide} />
      </mesh>
      {/* Crown: a painted rosette closing the top of the dome (no skylight; the chandelier
          lights the hall), framed by the gold ring. */}
      <mesh position={[0, top + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[oculusRadius + 0.3, 64]} />
        <meshStandardMaterial map={crown} roughness={0.6} />
      </mesh>
      <mesh position={[0, top, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[oculusRadius, 0.14, 10, 64]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} />
      </mesh>
    </>
  )
}

// A grand three-tier chandelier hanging from the dome: an ornate gilded column, curved-
// looking arms out to three rings of candles (gold cups, cream candles, glowing flames)
// and strings of crystal drops that catch the light. (Its real light lives in Museum.tsx,
// outside the hide-when-unseen group.) Static, so it is merged into a few meshes.
function Chandelier() {
  const y = CHANDELIER_Y
  const tiers: [number, number, number][] = [
    [2.5, 0, 24], // radius, height offset, candles
    [1.75, -0.6, 16],
    [1.0, -1.15, 10],
  ]
  const gold = <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} />
  const crystal = (
    <meshStandardMaterial color="#f4f7ff" emissive="#fff1d8" emissiveIntensity={1.4} roughness={0.05} toneMapped={false} />
  )
  return (
    <group position={[0, y, 0]}>
      {/* Chain up to the dome and a canopy where it hangs. */}
      <mesh position={[0, 5.4, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 10.6, 6]} />
        <meshStandardMaterial color="#2e2a26" metalness={0.6} />
      </mesh>
      {/* Ornate central column: stacked gold forms. */}
      {[
        [0.55, 0.22, 0.32],
        [0.2, 0.18, 0.5],
        [-0.25, 0.38, 0.3],
        [-0.75, 0.24, 0.45],
        [-1.25, 0.3, 0.25],
      ].map(([dy, r, h], i) => (
        <mesh key={i} position={[0, dy, 0]}>
          <cylinderGeometry args={[r * 0.8, r, h, 20]} />
          {gold}
        </mesh>
      ))}
      <mesh position={[0, -0.25, 0]}>
        <sphereGeometry args={[0.42, 24, 16]} />
        {gold}
      </mesh>
      {/* Finial and a big crystal at the bottom. */}
      <mesh position={[0, -1.55, 0]}>
        <coneGeometry args={[0.18, 0.4, 16]} />
        {gold}
      </mesh>
      <mesh position={[0, -1.95, 0]} rotation={[0, 0, 0]}>
        <octahedronGeometry args={[0.16, 0]} />
        {crystal}
      </mesh>

      {tiers.map(([r, dy, candles]) => (
        <group key={r} position={[0, dy, 0]}>
          {/* The ring and a thinner ring just below it. */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.06, 10, 72]} />
            {gold}
          </mesh>
          <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r * 0.96, 0.025, 8, 72]} />
            {gold}
          </mesh>
          {/* Arms from the column to the ring (six per tier). */}
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2 + r
            return (
              <mesh key={i} position={[(Math.cos(a) * r) / 2, -0.05, (Math.sin(a) * r) / 2]} rotation={[0, -a, 0.08]}>
                <boxGeometry args={[r, 0.05, 0.05]} />
                {gold}
              </mesh>
            )
          })}
          {Array.from({ length: candles }, (_, i) => {
            const a = (i / candles) * Math.PI * 2
            const cx = Math.cos(a) * r
            const cz = Math.sin(a) * r
            return (
              <group key={i} position={[cx, 0, cz]}>
                {/* Gold cup, cream candle, glowing flame. */}
                <mesh position={[0, 0.06, 0]}>
                  <cylinderGeometry args={[0.09, 0.05, 0.08, 12]} />
                  {gold}
                </mesh>
                <mesh position={[0, 0.2, 0]}>
                  <cylinderGeometry args={[0.035, 0.035, 0.2, 8]} />
                  <meshStandardMaterial color="#f3ead6" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.34, 0]}>
                  <sphereGeometry args={[0.045, 10, 8]} />
                  <Glow colour="#ffd49a" intensity={8} />
                </mesh>
                {/* A crystal drop hanging below each candle. */}
                <mesh position={[0, -0.32, 0]}>
                  <cylinderGeometry args={[0.004, 0.004, 0.36, 4]} />
                  {gold}
                </mesh>
                <mesh position={[0, -0.55, 0]}>
                  <octahedronGeometry args={[0.07, 0]} />
                  {crystal}
                </mesh>
              </group>
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
      {/* Everything that never moves is joined into a few big meshes (much cheaper to
          draw); the centrepiece's rings turn, so it stays separate. */}
      <MergeStatic>
        <Floor />
        <WallDecor />
        <Columns />
        <Cornice />
        <Dome />
        <Chandelier />
      </MergeStatic>
      <Centrepiece />
      <HangingSculptures />
    </>
  )
}
