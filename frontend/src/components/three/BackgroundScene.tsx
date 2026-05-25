import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { FloatingGraph } from './FloatingGraph'

// Lazy-loaded 3D ambient background.
// Absolutely positioned behind everything, pointer-events: none.
// Bloom gives the violet nodes a soft glow without affecting UI.
export function BackgroundScene() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ opacity: 0.65 }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <FloatingGraph />
          <EffectComposer>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.1}
              luminanceSmoothing={0.8}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
