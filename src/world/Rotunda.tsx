import { PILLARS, PILLAR_RADIUS, ROTUNDA_HEIGHT, ROTUNDA_RADIUS, ROTUNDA_SIDES } from './layout'

// The 12-sided central hall: floor, flat ceiling and a pillar at every corner.
// Grey-box only; M6 turns it into a Victorian dome hall.
// The 12-sided shape is a "circle" with 12 segments, turned so its flat sides face
// north and south (thetaStart = 15 degrees).
const THETA_START = Math.PI / ROTUNDA_SIDES

export default function Rotunda() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[ROTUNDA_RADIUS, ROTUNDA_SIDES, THETA_START]} />
        <meshStandardMaterial color="#6a6458" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROTUNDA_HEIGHT, 0]}>
        <circleGeometry args={[ROTUNDA_RADIUS, ROTUNDA_SIDES, THETA_START]} />
        <meshStandardMaterial color="#8a8d94" />
      </mesh>
      {PILLARS.map(([x, z], i) => (
        <mesh key={i} position={[x, ROTUNDA_HEIGHT / 2, z]} receiveShadow>
          <cylinderGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS, ROTUNDA_HEIGHT, 16]} />
          <meshStandardMaterial color="#d6cfc0" />
        </mesh>
      ))}
    </>
  )
}
