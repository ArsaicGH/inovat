import type { WallBox } from './collision'

interface RoomProps {
  width: number
  depth: number
  height: number
  walls: WallBox[]
  floorColor: string
  wallColor: string
}

// One reusable room: a floor plus wall blocks. Later rooms only change sizes and colours.
export default function Room({ width, depth, height, walls, floorColor, wallColor }: RoomProps) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>

      {walls.map((box, i) => {
        const sizeX = box.maxX - box.minX
        const sizeZ = box.maxZ - box.minZ
        const centreX = (box.minX + box.maxX) / 2
        const centreZ = (box.minZ + box.maxZ) / 2
        return (
          <mesh key={i} position={[centreX, height / 2, centreZ]} castShadow receiveShadow>
            <boxGeometry args={[sizeX, height, sizeZ]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        )
      })}
    </group>
  )
}
