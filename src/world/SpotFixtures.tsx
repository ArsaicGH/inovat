import { useMemo } from 'react'
import { Object3D } from 'three'
import type { RoomId } from '../types'
import { SPOT_PLANS } from './spot-plan'

// The visible lamps of the museum spotlights (spot-plan.ts): a small black can on the
// ceiling or wall, turned towards what it lights, with a warm glowing lens. The light
// itself comes from the five roaming spotlights in Museum.tsx.
export default function SpotFixtures({ room }: { room: RoomId }) {
  const fixtures = useMemo(
    () =>
      (SPOT_PLANS.get(room) ?? []).map(({ from, to }) => {
        // Turn a helper object to face the target and copy its rotation.
        const helper = new Object3D()
        helper.position.set(...from)
        helper.lookAt(...to)
        return { position: from, rotation: [helper.rotation.x, helper.rotation.y, helper.rotation.z] as [number, number, number] }
      }),
    [room],
  )

  return (
    <>
      {fixtures.map(({ position, rotation }, i) => (
        <group key={i} position={position} rotation={rotation}>
          {/* The can points along its local +z axis (lookAt turns +z towards the target). */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.07, 0.24, 16]} />
            <meshStandardMaterial color="#141214" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.121]}>
            <circleGeometry args={[0.075, 16]} />
            <meshStandardMaterial color="#ffe6c4" emissive="#ffe6c4" emissiveIntensity={3} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}
