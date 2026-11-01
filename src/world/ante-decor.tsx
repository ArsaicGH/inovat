import type { ReactNode } from 'react'
import { ANTE_DEPTH, ANTE_WIDTH, DOOR_WIDTH, INNER_DOOR } from './layout'
import { GOLD } from './style'

// THE ENTRANCE ROOM'S DRESSING (each era room's first stage, where the visitor meets the era
// as a whole: its overview board, a timeline and a diagram of what it changed, pictures;
// WallPictures.tsx). Around its walls: a panelled dado with a rail at hip height and a
// cornice under the ceiling, and wall lights beside the diagrams and the entrance, all in the
// era's own style. Glowing parts are self-lit materials (bloom picks them up), not real
// lamps, and everything here is merged into a few meshes (RoomDecor.tsx), so it costs
// almost nothing to draw.
// Local axes as in RoomDecor.tsx: x across the room, z towards the entrance, y up.

type EraRoom = 'ir1' | 'ir2' | 'ir3' | 'ir4'

interface Size {
  w: number
  d: number
  h: number
}

function Glow({ colour, intensity }: { colour: string; intensity: number }) {
  return <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={intensity} toneMapped={false} />
}

// The dado panels, the rail on top of them and the cornice, per era.
const DRESSING: Record<EraRoom, { panel: ReactNode; rail: ReactNode; cornice: ReactNode }> = {
  // Dark oak panelling with a brass rail, like a Victorian hall.
  ir1: {
    panel: <meshStandardMaterial color="#5a3d28" roughness={0.6} />,
    rail: <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />,
    cornice: <meshStandardMaterial color="#4a3423" roughness={0.7} />,
  },
  // Navy enamel with a steel rail, like a power station's switch hall.
  ir2: {
    panel: <meshStandardMaterial color="#26334f" metalness={0.1} roughness={0.35} />,
    rail: <meshStandardMaterial color="#8f9aa6" metalness={0.8} roughness={0.35} />,
    cornice: <meshStandardMaterial color="#5b636c" metalness={0.8} roughness={0.35} />,
  },
  // Dark teal panels with a glowing sea-green line, like a computer room's console.
  ir3: {
    panel: <meshStandardMaterial color="#213531" roughness={0.6} />,
    rail: <Glow colour="#7fd9b8" intensity={0.6} />,
    cornice: <meshStandardMaterial color="#d9cdb0" roughness={0.6} />,
  },
  // White gloss with a cyan light line.
  ir4: {
    panel: <meshStandardMaterial color="#cfd8de" roughness={0.25} />,
    rail: <Glow colour="#3fd0e0" intensity={0.9} />,
    cornice: <Glow colour="#3fd0e0" intensity={0.8} />,
  },
}

// One wall light, its back against the wall (local +z points into the room).
function WallLight({ room }: { room: EraRoom }) {
  if (room === 'ir1') {
    // An iron lantern on a bracket, lit warm like a flame.
    return (
      <>
        <mesh position={[0, 0.22, 0.12]}>
          <boxGeometry args={[0.03, 0.03, 0.24]} />
          <meshStandardMaterial color="#2a2420" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.2]}>
          <boxGeometry args={[0.2, 0.32, 0.2]} />
          <meshStandardMaterial color="#2a2420" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.2]}>
          <boxGeometry args={[0.15, 0.24, 0.21]} />
          <Glow colour="#ffb45e" intensity={4} />
        </mesh>
      </>
    )
  }
  if (room === 'ir2') {
    // A bare early bulb under a small steel shade, on an arm.
    return (
      <>
        <mesh position={[0, 0.12, 0.13]}>
          <boxGeometry args={[0.025, 0.025, 0.26]} />
          <meshStandardMaterial color="#5b636c" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.06, 0.26]}>
          <coneGeometry args={[0.12, 0.1, 16, 1, true]} />
          <meshStandardMaterial color="#5b636c" metalness={0.8} roughness={0.35} side={2} />
        </mesh>
        <mesh position={[0, -0.02, 0.26]}>
          <sphereGeometry args={[0.065, 14, 10]} />
          <Glow colour="#ffcf85" intensity={3} />
        </mesh>
      </>
    )
  }
  if (room === 'ir3') {
    // An upright fluorescent tube in a beige housing.
    return (
      <>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.14, 0.8, 0.06]} />
          <meshStandardMaterial color="#d9cdb0" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.065]}>
          <boxGeometry args={[0.07, 0.7, 0.02]} />
          <Glow colour="#eef6ff" intensity={1.3} />
        </mesh>
      </>
    )
  }
  // CMCN 4: a tall, thin light blade.
  return (
    <mesh position={[0, 0, 0.02]}>
      <boxGeometry args={[0.035, 1.5, 0.03]} />
      <Glow colour="#7fe9ff" intensity={2} />
    </mesh>
  )
}

export default function AnteDecor({ room, size }: { room: EraRoom; size: Size }) {
  const { panel, rail, cornice } = DRESSING[room]
  const front = size.d / 2 // the entrance wall
  const back = front - ANTE_DEPTH // the wall to the hall
  const middle = front - ANTE_DEPTH / 2
  const halfW = ANTE_WIDTH / 2
  // Wall runs (x, z, turn, length) around the entrance room, leaving the two doorways free.
  const outer = DOOR_WIDTH / 2 + 0.12
  const inner = INNER_DOOR / 2
  const runs: [number, number, number, number][] = [
    [-halfW, middle, Math.PI / 2, ANTE_DEPTH],
    [halfW, middle, -Math.PI / 2, ANTE_DEPTH],
    ...[-1, 1].map((s): [number, number, number, number] => [s * (outer + halfW) / 2, front, Math.PI, halfW - outer]),
    ...[-1, 1].map((s): [number, number, number, number] => [s * (inner + halfW) / 2, back, 0, halfW - inner]),
  ]
  // Wall lights: beside each diagram on the side walls, and on each side of the entrance.
  const lights: [number, number, number, number][] = [
    ...[-1, 1].flatMap((s) => [-1, 1].map((t): [number, number, number, number] => [s * halfW, middle + t * 2.85, -s * (Math.PI / 2), 2.4])),
    ...[-1, 1].map((s): [number, number, number, number] => [s * (outer + 0.9), front, Math.PI, 2.5]),
  ]
  return (
    <>
      {runs.map(([x, z, turn, length], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, turn, 0]}>
          {/* (Each part pushed out from the wall by half its own thickness.) */}
          <mesh position={[0, 0.48, 0.015]}>
            <boxGeometry args={[length, 0.96, 0.03]} />
            {panel}
          </mesh>
          <mesh position={[0, 0.99, 0.025]}>
            <boxGeometry args={[length, 0.06, 0.05]} />
            {rail}
          </mesh>
          <mesh position={[0, size.h - 0.12, 0.03]}>
            <boxGeometry args={[length, 0.14, 0.06]} />
            {cornice}
          </mesh>
        </group>
      ))}
      {lights.map(([x, z, turn, y], i) => (
        <group key={`light-${i}`} position={[x, y, z]} rotation={[0, turn, 0]}>
          <WallLight room={room} />
        </group>
      ))}
    </>
  )
}
