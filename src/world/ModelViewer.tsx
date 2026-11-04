import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Center, OrbitControls } from '@react-three/drei'
import Invention, { ModelCopy } from './inventions'

// THE MODEL VIEWER beside an enlarged invention board (InfoPanel.tsx): the invention's
// prototype turning slowly on its own, which the visitor can also turn by dragging.
// A small separate 3D view with its own simple lights, only while the board is open.
// (Its background is the era-coloured gradient behind it, in index.css.)
// silhouette: lights off, so only the dark shape shows against the glow (the Time Machine
// game's "mystery machine" round).

// idle: drawn only when something changes (not every frame), while it is open but unseen
// (the trailer keeps it open between its shots: TrailerCamera.tsx).
export default function ModelViewer({ id, silhouette = false, idle = false }: { id: string; silhouette?: boolean; idle?: boolean }) {
  const light = silhouette ? 0 : 1
  return (
    <Canvas
      className="model-viewer-canvas"
      dpr={[1, 1.5]}
      frameloop={idle ? 'demand' : 'always'}
      // (Sized by its box's layout size, so a zoomed or moving window does not shrink it.)
      resize={{ offsetSize: true }}
      camera={{ fov: 35, position: [0, 0.7, 4.8] }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.5 * light} />
      <hemisphereLight args={['#fff4e0', '#2a2219', 0.9 * light]} />
      <directionalLight position={[3, 5, 4]} intensity={2.2 * light} />
      <directionalLight position={[-4, 2, -3]} intensity={0.8 * light} color="#bcd4ff" />
      <Suspense fallback={null}>
        <ModelCopy.Provider value={true}>
          {/* Centred on its own middle, whatever its shape. */}
          <Center>
            <Invention id={id} />
          </Center>
        </ModelCopy.Provider>
      </Suspense>
      <OrbitControls target={[0, 0, 0]} enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.2} minPolarAngle={0.5} maxPolarAngle={1.75} />
    </Canvas>
  )
}
