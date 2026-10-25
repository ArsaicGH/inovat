import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useMuseumStore } from '../state/useMuseumStore'
import type { ExhibitSpot } from './layout'
import { addAimTarget, removeAimTarget } from './aim-targets'
import { ROOM_ACCENT, GOLD, DARK_WOOD, BOARD_SIZE, BOARD_THEMES } from './style'
import PanelBoard from './PanelBoard'
import BoardStand from './BoardStand'

const PLINTH_TOP = 0.6 // height of the plinth's top surface (metres)

// PLACEHOLDER prototypes: bold "machines" built from simple shapes, one design per corner,
// in the room's accent colour. They turn slowly like showcase pieces. Real models replace
// them in Phase D (M11).
function PlaceholderMachine({ number, colour }: { number: number; colour: string }) {
  const ref = useRef<Group>(null)
  // Every part of the prototype casts a shadow from the key light.
  useLayoutEffect(() => {
    ref.current?.traverse((object) => {
      object.castShadow = true
    })
  }, [number])
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.25
  })
  const metal = <meshStandardMaterial color={colour} metalness={0.6} roughness={0.35} />
  const dark = <meshStandardMaterial color="#2e2a26" metalness={0.5} roughness={0.5} />

  return (
    <group ref={ref} position={[0, PLINTH_TOP, 0]}>
      {number === 1 && (
        // Boiler with chimney and flywheel.
        <>
          <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.42, 0.42, 1.3, 28]} />
            {metal}
          </mesh>
          <mesh position={[0.35, 1.25, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 0.9, 16]} />
            {dark}
          </mesh>
          <mesh position={[-0.8, 0.75, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.55, 0.07, 12, 40]} />
            {dark}
          </mesh>
        </>
      )}
      {number === 2 && (
        // Stepped tower with a sphere on top.
        <>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.1, 0.7, 1.1]} />
            {dark}
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[0.75, 0.6, 0.75]} />
            {metal}
          </mesh>
          <mesh position={[0, 1.65, 0]}>
            <sphereGeometry args={[0.38, 32, 20]} />
            {metal}
          </mesh>
        </>
      )}
      {number === 3 && (
        // Two meshing gears on a frame.
        <>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.4, 0.9, 0.3]} />
            {dark}
          </mesh>
          {[-0.4, 0.45].map((x, i) => (
            <mesh key={i} position={[x, 1.15, 0.2]}>
              <cylinderGeometry args={[i === 0 ? 0.5 : 0.36, i === 0 ? 0.5 : 0.36, 0.14, 14]} />
              {metal}
            </mesh>
          ))}
        </>
      )}
      {number >= 4 && (
        // Abstract knot on a column.
        <>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 1, 20]} />
            {dark}
          </mesh>
          <mesh position={[0, 1.45, 0]}>
            <torusKnotGeometry args={[0.38, 0.11, 120, 16]} />
            {metal}
          </mesh>
        </>
      )}
    </group>
  )
}

// A round plinth with a softly glowing gold ring (the glow is picked up by the bloom effect).
function Plinth({ colour }: { colour: string }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.25, 0.4, 32]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.05, 0.2, 32]} />
        {/* Matt stone, so the spotlight straight above does not blow it out to white. */}
        <meshStandardMaterial color="#b8ae9c" roughness={0.75} />
      </mesh>
      <mesh position={[0, PLINTH_TOP + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 0.98, 48]} />
        <meshStandardMaterial color={GOLD} emissive={colour} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
    </group>
  )
}

// One exhibit spot from the floor plan. The whole group carries `userData.exhibitId`,
// so the crosshair can tell which exhibit it hit.
export default function Exhibit({ spot }: { spot: ExhibitSpot }) {
  const group = useRef<Group>(null)
  const aimed = useMuseumStore((state) => state.aimedExhibitId === spot.id)
  const colour = ROOM_ACCENT[spot.room]
  const theme = BOARD_THEMES[spot.room]

  useEffect(() => {
    const exhibit = group.current
    if (!exhibit) return
    addAimTarget(exhibit)
    return () => removeAimTarget(exhibit)
  }, [])

  return (
    <group ref={group} position={[spot.x, 0, spot.z]} rotation={[0, spot.yaw, 0]} userData={{ exhibitId: spot.id }}>
      {spot.kind === 'wall' && (
        // Intro-hall wall panel, just off the wall surface.
        <group position={[0, 1.65, 0.04]}>
          <PanelBoard exhibitId={spot.id} width={BOARD_SIZE.wall[0]} height={BOARD_SIZE.wall[1]} aimed={aimed} theme={theme} />
        </group>
      )}
      {spot.kind === 'overview' && (
        // The era's overview board on the back wall, under the room's name sign (which
        // starts at 2.8 m); in CMCN 3 it hangs just above the desk of old computers.
        <group position={[0, 2.08, 0.08]}>
          <PanelBoard exhibitId={spot.id} width={BOARD_SIZE.overview[0]} height={BOARD_SIZE.overview[1]} aimed={aimed} theme={theme} />
        </group>
      )}
      {(spot.kind === 'corner' || spot.kind === 'centre') && (
        <>
          <Plinth colour={colour} />
          <PlaceholderMachine number={spot.number || 1} colour={colour} />

          {/* Readable text board beside the plinth, on a stand in the room's style. */}
          <group position={[spot.panelSide * 2.3, 0, 0]}>
            <BoardStand
              exhibitId={spot.id}
              width={BOARD_SIZE.stand[0]}
              height={BOARD_SIZE.stand[1]}
              centreY={1.55}
              aimed={aimed}
              theme={theme}
            />
          </group>
        </>
      )}
    </group>
  )
}
