import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { useMuseumStore } from '../state/useMuseumStore'
import type { ExhibitSpot } from './layout'
import { addAimTarget, removeAimTarget } from './aim-targets'

// PLACEHOLDER prototype: a different simple shape per corner, turning slowly so it reads
// as a "demonstration". Real models replace these in Phase D.
function PlaceholderModel({ number }: { number: number }) {
  const ref = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4
  })
  return (
    <mesh ref={ref} position={[0, 1.45, 0]}>
      {number === 1 && <boxGeometry args={[0.5, 0.5, 0.5]} />}
      {number === 2 && <sphereGeometry args={[0.3, 24, 16]} />}
      {number === 3 && <cylinderGeometry args={[0.22, 0.3, 0.6, 24]} />}
      {number >= 4 && <torusGeometry args={[0.25, 0.09, 12, 32]} />}
      <meshStandardMaterial color="#c98a3c" roughness={0.4} metalness={0.3} />
    </mesh>
  )
}

// The text panel's board. It glows faintly while aimed at, as feedback.
function Board({ width, height, aimed }: { width: number; height: number; aimed: boolean }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[width, height, 0.05]} />
      <meshStandardMaterial color="#e8e4dc" emissive="#c98a3c" emissiveIntensity={aimed ? 0.35 : 0} />
    </mesh>
  )
}

// One exhibit spot from the floor plan. The whole group carries `userData.exhibitId`,
// so the crosshair can tell which exhibit it hit.
export default function Exhibit({ spot }: { spot: ExhibitSpot }) {
  const group = useRef<Group>(null)
  const aimed = useMuseumStore((state) => state.aimedExhibitId === spot.id)

  useEffect(() => {
    const exhibit = group.current
    if (!exhibit) return
    addAimTarget(exhibit)
    return () => removeAimTarget(exhibit)
  }, [])

  return (
    <group ref={group} position={[spot.x, 0, spot.z]} rotation={[0, spot.yaw, 0]} userData={{ exhibitId: spot.id }}>
      {spot.kind === 'wall' ? (
        // Intro-hall wall panel, 1 cm off the wall (no shared surface, so no flicker).
        <group position={[0, 1.6, 0.035]}>
          <Board width={1.6} height={1.1} aimed={aimed} />
        </group>
      ) : (
        <>
          {/* Pedestal */}
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 1, 0.9]} />
            <meshStandardMaterial color="#8a8f99" />
          </mesh>
          <PlaceholderModel number={spot.number || 1} />

          {/* Text panel beside the pedestal: a board on a post. */}
          <group position={[spot.panelSide * 1.3, 0, 0]}>
            <mesh position={[0, 0.35, 0]} castShadow>
              <boxGeometry args={[0.08, 0.7, 0.08]} />
              <meshStandardMaterial color="#6d717a" />
            </mesh>
            <group position={[0, 1.3, 0]}>
              <Board width={0.9} height={1.2} aimed={aimed} />
            </group>
          </group>
        </>
      )}
    </group>
  )
}
