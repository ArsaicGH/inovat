import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import Room from './Room'
import Player from './Player'
import FrameTimingProbe from './FrameTimingProbe'
import { buildRoomWalls, type WallBox } from './collision'
import { CANVAS_WRAPPER_ID } from './pointer-lock'

// M3 test room. Defined outside the component so these values never change between renders.
const ROOM = { width: 10, depth: 12, height: 3 }
// A pillar in the middle, to test walking around corners.
const PILLAR: WallBox = { minX: -0.5, maxX: 0.5, minZ: -2.5, maxZ: -1.5 }
const WALLS: WallBox[] = [...buildRoomWalls(ROOM.width, ROOM.depth), PILLAR]
// Start near the front wall, facing into the room (yaw 0 = looking towards -z).
const SPAWN: [number, number] = [0, 4]
const SPAWN_YAW = 0

// DEVELOPMENT-ONLY test switches in the address bar, to find what slows frames down:
// ?dpr=1 (normal resolution), ?aa=0 (no edge smoothing), ?shadows=0 (no shadows).
// They can be combined: ?dpr=1&aa=0. On the live site they are ignored.
const testSwitches = new URLSearchParams(import.meta.env.DEV ? window.location.search : '')
const MAX_PIXEL_RATIO = testSwitches.get('dpr') === '1' ? 1 : 1.5
const ANTIALIAS = testSwitches.get('aa') !== '0'
const SHADOWS = testSwitches.get('shadows') !== '0'

export default function Museum() {
  return (
    // The Canvas resizes itself with the window, so the scene never stretches.
    <Canvas
      id={CANVAS_WRAPPER_ID}
      // "percentage" = PCF shadows; the newest Three.js dropped the older "soft" type.
      shadows={SHADOWS ? 'percentage' : false}
      // Cap the pixel ratio at 1.5 (CLAUDE.md): sharp enough, but much cheaper on high-DPI screens.
      dpr={[1, MAX_PIXEL_RATIO]}
      camera={{ fov: 70, near: 0.1, far: 100 }}
      // Laptops with two graphics chips: ask for the faster one.
      gl={{ powerPreference: 'high-performance', antialias: ANTIALIAS }}
      onCreated={({ gl }) => {
        // Nothing in the room moves, so draw the shadows once instead of 100+ times a
        // second. If moving objects are added later, set gl.shadowMap.needsUpdate = true.
        gl.shadowMap.autoUpdate = false
        gl.shadowMap.needsUpdate = true
      }}
    >
      <color attach="background" args={['#1b1d24']} />

      {/* Soft light from every direction, so nothing is pitch black. */}
      <ambientLight intensity={0.6} />
      {/* The only shadow-casting light (CLAUDE.md allows at most one). */}
      <directionalLight
        position={[4, 8, 3]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        // Make the shadow area cover the whole room.
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      <Room
        width={ROOM.width}
        depth={ROOM.depth}
        height={ROOM.height}
        walls={WALLS}
        floorColor="#555a66"
        wallColor="#c9c3b8"
      />

      <Player walls={WALLS} spawn={SPAWN} spawnYaw={SPAWN_YAW} />

      {/* FPS counter, only while developing (never shown on the live site). */}
      {import.meta.env.DEV && <Stats />}
      {import.meta.env.DEV && <FrameTimingProbe />}
    </Canvas>
  )
}
