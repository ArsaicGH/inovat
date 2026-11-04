import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import PanelBoard from './PanelBoard'
import { DARK_WOOD, type BoardTheme } from './style'

// A free-standing text board on a stand that matches the room (style.ts board themes):
// wooden posts, cast-iron posts, steel posts, a graphite computer kiosk, or (CMCN 4) no stand
// at all: the glass board floats above a glowing emitter on the floor.

interface BoardStandProps {
  exhibitId: string
  width: number
  height: number
  centreY: number // height of the board's centre above the floor
  aimed: boolean
  theme: BoardTheme
}

// Two posts from the floor up behind the board's lower half.
function Posts({ width, top, look }: { width: number; top: number; look: BoardTheme['look'] }) {
  const xs = [-width * 0.36, width * 0.36]
  if (look === 'brass') {
    // Cast-iron posts with brass ball feet.
    return (
      <>
        {xs.map((x) => (
          <group key={x} position={[x, 0, -0.05]}>
            <mesh position={[0, top / 2, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.04, top, 12]} />
              <meshStandardMaterial color="#2a2420" metalness={0.6} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <sphereGeometry args={[0.07, 14, 10]} />
              <meshStandardMaterial color="#c8954a" metalness={0.9} roughness={0.3} />
            </mesh>
          </group>
        ))}
      </>
    )
  }
  if (look === 'enamel') {
    // Square steel posts bolted to small floor plates.
    return (
      <>
        {xs.map((x) => (
          <group key={x} position={[x, 0, -0.05]}>
            <mesh position={[0, top / 2, 0]} castShadow>
              <boxGeometry args={[0.07, top, 0.07]} />
              <meshStandardMaterial color="#5b636c" metalness={0.8} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.015, 0]}>
              <boxGeometry args={[0.26, 0.03, 0.26]} />
              <meshStandardMaterial color="#3d434a" metalness={0.8} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </>
    )
  }
  if (look === 'screen') {
    // One graphite kiosk column on a wider foot, like a terminal stand.
    return (
      <group position={[0, 0, -0.04]}>
        <mesh position={[0, top / 2, 0]} castShadow>
          <boxGeometry args={[0.34, top, 0.22]} />
          <meshStandardMaterial color="#1f2723" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.7, 0.08, 0.45]} />
          <meshStandardMaterial color="#161c19" roughness={0.5} metalness={0.3} />
        </mesh>
      </group>
    )
  }
  // Classic wooden posts.
  return (
    <>
      {xs.map((x) => (
        <mesh key={x} position={[x, top / 2, -0.05]} castShadow>
          <boxGeometry args={[0.06, top, 0.06]} />
          <meshStandardMaterial color={DARK_WOOD} />
        </mesh>
      ))}
    </>
  )
}

// CMCN 4: a glowing ring on the floor and a faint beam of light holding up the board.
function Emitter({ colour, top }: { colour: string; top: number }) {
  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.06, 32]} />
        <meshStandardMaterial color="#e9eef2" metalness={0.3} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.38, 40]} />
        <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <mesh position={[0, top / 2, 0]}>
        <cylinderGeometry args={[0.3, 0.38, top, 24, 1, true]} />
        <meshBasicMaterial color={colour} transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  )
}

export default function BoardStand({ exhibitId, width, height, centreY, aimed, theme }: BoardStandProps) {
  const floating = useRef<Group>(null)
  const isHologram = theme.look === 'hologram'
  // The floating board drifts gently up and down.
  useFrame(({ clock }) => {
    if (floating.current) floating.current.position.y = centreY + Math.sin(clock.elapsedTime * 1.2) * 0.04
  })
  const bottom = centreY - height / 2

  return (
    <group>
      {isHologram ? (
        <Emitter colour={theme.rule} top={bottom - 0.1} />
      ) : (
        <Posts width={width} top={bottom + height * 0.35} look={theme.look} />
      )}
      <group ref={isHologram ? floating : undefined} position={[0, centreY, 0]}>
        <PanelBoard exhibitId={exhibitId} width={width} height={height} aimed={aimed} theme={theme} />
      </group>
    </group>
  )
}
