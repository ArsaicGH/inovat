import { useEffect, useRef } from 'react'
import { useContent } from '../content/use-content'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { useMuseumStore, isQuizUnlocked } from '../state/useMuseumStore'
import { DOORS, type DoorLayout } from './layout'
import { doorOpen } from './door-state'
import { playEffect } from '../audio/sound'
import { addAimTarget, removeAimTarget } from './aim-targets'
import Sign from './Sign'

const OPEN_DISTANCE = 3 // metres from the doorway at which a door opens
const LOCK_MESSAGE_DISTANCE = 3.5 // how close to the locked door its message appears
const OPEN_SPEED = 5 // higher = faster opening/closing

// One sliding double door in a rotunda doorway. Its local +z points into the rotunda,
// so the signs face visitors standing in the rotunda.
function Door({ door }: { door: DoorLayout }) {
  const { roomNames } = useContent()
  const group = useRef<Group>(null)
  const left = useRef<Mesh>(null)
  const right = useRef<Mesh>(null)
  const lastTarget = useRef(-1) // last open (1) / closed (0) decision, -1 = none yet
  const visited = useMuseumStore((state) => state.visitedRooms)
  const locked = door.room === 'quiz' && !isQuizUnlocked(visited)
  const leafWidth = door.width / 2

  // Closed door leaves block the crosshair (no aiming through a shut door).
  useEffect(() => {
    const doorGroup = group.current
    if (!doorGroup) return
    addAimTarget(doorGroup)
    return () => removeAimTarget(doorGroup)
  }, [])

  useFrame(({ camera }, delta) => {
    const dist = Math.hypot(camera.position.x - door.centre[0], camera.position.z - door.centre[1])
    const target = !locked && dist < OPEN_DISTANCE ? 1 : 0
    // Sliding sound when the door starts to open or to close (quieter further away).
    if (target !== lastTarget.current) {
      if (lastTarget.current !== -1) playEffect(target ? 'doorOpen' : 'doorClose', Math.max(0.1, 0.5 - dist * 0.04))
      lastTarget.current = target
    }
    const current = doorOpen.get(door.room) ?? 0
    let next = current + (target - current) * Math.min(1, delta * OPEN_SPEED)
    if (Math.abs(target - next) < 0.001) next = target
    doorOpen.set(door.room, next)

    // The two halves slide sideways into the wall on either side.
    const offset = leafWidth / 2 + next * leafWidth
    if (left.current) left.current.position.x = -offset
    if (right.current) right.current.position.x = offset

    if (door.room === 'quiz') {
      const store = useMuseumStore.getState()
      const near = locked && dist < LOCK_MESSAGE_DISTANCE
      if (near !== store.nearLockedDoor) store.setNearLockedDoor(near)
    }
  })

  const grand = door.style === 'grand'
  const name = roomNames[door.room]
  const leafColour = locked ? '#5b4a4a' : grand ? '#6b5636' : '#5d6168'

  return (
    <group ref={group} position={[door.centre[0], 0, door.centre[1]]} rotation={[0, door.frame.angle, 0]}>
      {/* Door halves (do not cast shadows: shadows are drawn only once). */}
      <mesh ref={left} position={[-leafWidth / 2, door.height / 2, 0]}>
        <boxGeometry args={[leafWidth - 0.02, door.height, 0.06]} />
        <meshStandardMaterial color={leafColour} metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh ref={right} position={[leafWidth / 2, door.height / 2, 0]}>
        <boxGeometry args={[leafWidth - 0.02, door.height, 0.06]} />
        <meshStandardMaterial color={leafColour} metalness={0.2} roughness={0.6} />
      </mesh>

      {grand ? (
        <>
          {/* Grand portal: two columns and a beam in front of the wall, then a big sign. */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (door.width / 2 + 0.3), (door.height + 0.3) / 2, 0.28]} receiveShadow>
              <boxGeometry args={[0.35, door.height + 0.3, 0.35]} />
              <meshStandardMaterial color="#b9ab8e" />
            </mesh>
          ))}
          <mesh position={[0, door.height + 0.475, 0.28]} receiveShadow>
            <boxGeometry args={[door.width + 0.95, 0.35, 0.4]} />
            <meshStandardMaterial color="#b9ab8e" />
          </mesh>
          <group position={[0, door.height + 1.25, 0.12]}>
            <Sign title={name.short} subtitle={name.name} width={3.8} height={1} />
          </group>
        </>
      ) : (
        // Plain start/end door: just a smaller sign above it.
        <group position={[0, door.height + 0.45, 0.12]}>
          <Sign title={name.name} width={2.6} height={0.6} />
        </group>
      )}
    </group>
  )
}

export default function Doors() {
  return (
    <>
      {DOORS.map((door) => (
        <Door key={door.room} door={door} />
      ))}
    </>
  )
}
