import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, type Group } from 'three'
import { useMuseumStore } from '../state/useMuseumStore'
import { SPOTLIGHT_ID, SPOTLIGHT_SCALE, panelOffset, type ExhibitSpot } from './layout'
import { addAimTarget, removeAimTarget } from './aim-targets'
import { ROOM_ACCENT, GOLD, DARK_WOOD, BOARD_SIZE, BOARD_THEMES } from './style'
import PanelBoard from './PanelBoard'
import BoardStand from './BoardStand'
import Invention from './inventions'

const PLINTH_TOP = 0.6 // height of the plinth's top surface (metres)

// The invention's prototype (inventions.tsx) on top of the plinth. It turns slowly like a
// showcase piece, and every part of it casts a shadow from the key light.
function Prototype({ id }: { id: string }) {
  const ref = useRef<Group>(null)
  useLayoutEffect(() => {
    ref.current?.traverse((object) => {
      object.castShadow = true
    })
  }, [id])
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.25
  })
  return (
    <group ref={ref} position={[0, PLINTH_TOP, 0]}>
      <Invention id={id} />
    </group>
  )
}

// CONTACT SHADOW: where something stands, less of the room's light reaches the surface
// around its foot, a soft darkening that makes it sit on the surface instead of floating.
// (The ambient-occlusion effect does this too, but only at the high graphics level.)
// One soft round picture, painted once and shared.
let contactShadowPicture: CanvasTexture | null = null
function contactShadowTexture(): CanvasTexture {
  if (contactShadowPicture) return contactShadowPicture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(0, 0, 0, 0.8)')
  g.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)')
  g.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  contactShadowPicture = new CanvasTexture(canvas)
  return contactShadowPicture
}
function ContactShadow({ radius, y, opacity }: { radius: number; y: number; opacity: number }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial map={contactShadowTexture()} transparent opacity={opacity} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

// A round plinth with a thin brass inlay ring. (It glowed before; a museum plinth should
// not compete with its exhibit, so the brass only catches the spotlight.)
function Plinth({ colour }: { colour: string }) {
  return (
    <group>
      <ContactShadow radius={1.85} y={0.006} opacity={0.75} />
      <ContactShadow radius={0.8} y={PLINTH_TOP + 0.003} opacity={0.55} />
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.25, 0.4, 32]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.05, 0.2, 32]} />
        {/* Dark matt stone, like gallery pedestals: the exhibit, not its stand, catches the eye. */}
        <meshStandardMaterial color="#4e463d" roughness={0.8} />
      </mesh>
      <mesh position={[0, PLINTH_TOP + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 0.98, 48]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.35} emissive={colour} emissiveIntensity={0.08} />
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
        // The era's overview board, standing in the middle of the room in the room's style.
        <BoardStand
          exhibitId={spot.id}
          width={BOARD_SIZE.overview[0]}
          height={BOARD_SIZE.overview[1]}
          centreY={1.6}
          aimed={aimed}
          theme={theme}
        />
      )}
      {(spot.kind === 'corner' || spot.kind === 'centre') && (
        <>
          <group scale={spot.id === SPOTLIGHT_ID ? SPOTLIGHT_SCALE : 1}>
            <Plinth colour={colour} />
            <Prototype id={spot.id} />
          </group>

          {/* Readable text board beside the plinth, on a stand in the room's style. */}
          <group position={[spot.panelSide * panelOffset(spot.id), 0, 0]}>
            <BoardStand
              exhibitId={spot.id}
              width={BOARD_SIZE.stand[0]}
              height={BOARD_SIZE.stand[1]}
              centreY={1.62}
              aimed={aimed}
              theme={theme}
            />
          </group>
        </>
      )}
    </group>
  )
}
