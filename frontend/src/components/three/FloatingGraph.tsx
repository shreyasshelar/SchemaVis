import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Floating graph of nodes + edges ──────────────────────────────
// Lazy-loaded inside BackgroundScene. Glowing violet dots connected
// by thin lines — slowly drift and rotate. Pure ambient chrome.

const NODE_COUNT = 28
const EDGE_PROB  = 0.12   // probability of edge between any two nodes

export function FloatingGraph() {
  const groupRef = useRef<THREE.Group>(null)

  // Generate random node positions once
  const positions = useMemo(
    () => Array.from(
      { length: NODE_COUNT },
      () => new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 6,
      )
    ),
    []
  )

  // Build edge buffer geometry
  const edgeGeometry = useMemo(() => {
    const verts: number[] = []
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (Math.random() < EDGE_PROB) {
          verts.push(
            positions[i].x, positions[i].y, positions[i].z,
            positions[j].x, positions[j].y, positions[j].z,
          )
        }
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    return geo
  }, [positions])

  // Node instanced mesh geometry
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.06, 8, 8), [])

  // Slow drift + rotation
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.rotation.y = t * 0.018
    groupRef.current.rotation.x = Math.sin(t * 0.009) * 0.15
  })

  return (
    <group ref={groupRef}>
      {/* Edges */}
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#7C3AED" transparent opacity={0.12} />
      </lineSegments>

      {/* Nodes */}
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} geometry={sphereGeo}>
          <meshBasicMaterial color="#7C3AED" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  )
}
