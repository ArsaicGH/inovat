import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import type { Mesh } from 'three'

// A test box that turns slowly, so we can see the scene is really animating.
function SpinningBox() {
  const ref = useRef<Mesh>(null)

  useFrame((_, delta) => {
    // `delta` is the time since the last frame in seconds. Multiplying by it keeps the
    // speed the same on fast and slow computers (important later for walking too).
    if (ref.current) ref.current.rotation.y += delta * 0.5
  })

  return (
    <mesh ref={ref} position={[0, 0.5, 0]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#c98a3c" />
    </mesh>
  )
}

export default function Museum() {
  return (
    // The Canvas resizes itself with the window, so the scene never stretches.
    <Canvas
      // "percentage" = PCF shadows; the newest Three.js dropped the older "soft" type.
      shadows="percentage"
      // Cap the pixel ratio at 1.5 (CLAUDE.md): sharp enough, but much cheaper on high-DPI screens.
      dpr={[1, 1.5]}
      camera={{ position: [3, 2, 5], fov: 60 }}
    >
      <color attach="background" args={['#1b1d24']} />

      {/* Soft light from every direction, so nothing is pitch black. */}
      <ambientLight intensity={0.5} />
      {/* The only shadow-casting light (CLAUDE.md allows at most one). */}
      <directionalLight position={[4, 6, 3]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />

      {/* Floor: a flat plane rotated to lie horizontally. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#555a66" />
      </mesh>

      <SpinningBox />

      {/* Temporary: drag to look around. Replaced by first-person walking in M3. */}
      <OrbitControls target={[0, 0.5, 0]} />

      {/* FPS counter, only while developing (never shown on the live site). */}
      {import.meta.env.DEV && <Stats />}
    </Canvas>
  )
}
