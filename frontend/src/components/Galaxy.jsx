import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Stars } from '@react-three/drei'
import * as THREE from 'three'

// Enhanced color palette for categories with brighter, more sci-fi colors
const CATEGORY_COLORS = [
  '#FF3366', // Bright Red
  '#00FFFF', // Cyan
  '#3366FF', // Bright Blue
  '#FF66FF', // Magenta
  '#66FF66', // Bright Green
  '#FFFF00', // Yellow
  '#FF9900', // Orange
  '#9966FF', // Purple
]

// Calculate distance between two 3D points
function calculateDistance(pos1, pos2) {
  const dx = pos1.x - pos2.x
  const dy = pos1.y - pos2.y
  const dz = pos1.z - pos2.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Constellations component - draws lines between nearby nodes
function Constellations({ nodes, maxDistance = 1.5, scale = 1, centroid = [0, 0, 0] }) {
  const lines = useMemo(() => {
    const lineSegments = []
    const scaledMaxDistance = maxDistance * scale
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        // Subtract centroid before scaling
        const pos1 = {
          x: (nodes[i].x - centroid[0]) * scale,
          y: (nodes[i].y - centroid[1]) * scale,
          z: (nodes[i].z - centroid[2]) * scale
        }
        const pos2 = {
          x: (nodes[j].x - centroid[0]) * scale,
          y: (nodes[j].y - centroid[1]) * scale,
          z: (nodes[j].z - centroid[2]) * scale
        }
        
        const distance = calculateDistance(pos1, pos2)
        
        if (distance <= scaledMaxDistance) {
          lineSegments.push(
            new THREE.Vector3(pos1.x, pos1.y, pos1.z),
            new THREE.Vector3(pos2.x, pos2.y, pos2.z)
          )
        }
      }
    }
    
    return lineSegments
  }, [nodes, maxDistance, scale, centroid])
  
  if (lines.length === 0) return null
  
  const geometry = new THREE.BufferGeometry().setFromPoints(lines)
  
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#4A90E2"
        opacity={0.15}
        transparent
        linewidth={1}
      />
    </lineSegments>
  )
}

function Node({ node, onClick, scale = 1, centroid = [0, 0, 0] }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  const color = CATEGORY_COLORS[node.category % CATEGORY_COLORS.length]
  
  // Calculate centered and scaled position: (node.x - centroid_x) * scale
  const centeredX = (node.x - centroid[0]) * scale
  const centeredY = (node.y - centroid[1]) * scale
  const centeredZ = (node.z - centroid[2]) * scale
  
  // Enhanced rotation animation with pulsing effect
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      // Subtle pulsing effect
      const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 2 + node.id) * 0.05
      meshRef.current.scale.setScalar(pulseScale)
    }
  })
  
  return (
    <group position={[centeredX, centeredY, centeredZ]}>
      {/* Invisible hitbox sphere - much larger for easier clicking */}
      <mesh
        onClick={() => onClick?.(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Main glowing sphere - visual only, no events */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial
          color={hovered ? '#FFFFFF' : color}
          emissive={color}
          emissiveIntensity={hovered ? 1.2 : 0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Outer glow ring - visual only, no events */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.2}
        />
      </mesh>
      
      {/* Hover tooltip */}
      {hovered && (
        <Text
          position={[0, 0.4, 0]}
          fontSize={0.06}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          maxWidth={3}
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {node.label}
        </Text>
      )}
    </group>
  )
}

// Camera animation component
function CameraController({ selectedNodeId, nodes, scale, centroid, controlsRef }) {
  const { camera } = useThree()
  const targetPositionRef = useRef(null)
  const targetLookAtRef = useRef(null)
  const isAnimatingRef = useRef(false)
  
  useEffect(() => {
    if (selectedNodeId === null || selectedNodeId === undefined) {
      // Reset animation when no node is selected
      targetPositionRef.current = null
      targetLookAtRef.current = null
      isAnimatingRef.current = false
      return
    }
    
    // Find the selected node
    const selectedNode = nodes.find(n => n.id === selectedNodeId)
    if (!selectedNode) return
    
    // Calculate centered and scaled position
    const nodeX = (selectedNode.x - centroid[0]) * scale
    const nodeY = (selectedNode.y - centroid[1]) * scale
    const nodeZ = (selectedNode.z - centroid[2]) * scale
    
    // Calculate camera position offset (slightly above and behind the node)
    const offsetDistance = 5
    const offsetX = nodeX + offsetDistance * 0.7
    const offsetY = nodeY + offsetDistance * 0.5
    const offsetZ = nodeZ + offsetDistance * 0.7
    
    // Set target position and look-at point
    targetPositionRef.current = new THREE.Vector3(offsetX, offsetY, offsetZ)
    targetLookAtRef.current = new THREE.Vector3(nodeX, nodeY, nodeZ)
    isAnimatingRef.current = true
  }, [selectedNodeId, nodes, scale, centroid])
  
  useFrame((state, delta) => {
    if (!controlsRef?.current) return
    
    if (isAnimatingRef.current && targetPositionRef.current && targetLookAtRef.current) {
      // Smooth interpolation (lerp) for camera position
      const lerpFactor = 0.05
      camera.position.lerp(targetPositionRef.current, lerpFactor)
      
      // Smooth interpolation for camera target
      const currentTarget = controlsRef.current.target
      currentTarget.lerp(targetLookAtRef.current, lerpFactor)
      controlsRef.current.update()
      
      // Check if animation is complete (close enough)
      const distanceToTarget = camera.position.distanceTo(targetPositionRef.current)
      const targetDistance = currentTarget.distanceTo(targetLookAtRef.current)
      
      if (distanceToTarget < 0.1 && targetDistance < 0.1) {
        isAnimatingRef.current = false
      }
    }
  })
  
  return null
}

export default function Galaxy({ nodes = [], onNodeClick, selectedNodeId = null }) {
  const SCALE_FACTOR = 50 // Multiply coordinates by 50 to spread out the galaxy
  const controlsRef = useRef()
  
  // Calculate centroid (average X, Y, Z) of all nodes
  const centroid = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return [0, 0, 0]
    }
    
    const sumX = nodes.reduce((sum, node) => sum + node.x, 0)
    const sumY = nodes.reduce((sum, node) => sum + node.y, 0)
    const sumZ = nodes.reduce((sum, node) => sum + node.z, 0)
    
    return [
      sumX / nodes.length,
      sumY / nodes.length,
      sumZ / nodes.length
    ]
  }, [nodes])
  
  // Calculate bounding box and max distance for camera positioning
  const { maxDistance } = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return { maxDistance: 100 }
    }
    
    // Calculate centered and scaled positions
    const centeredScaledNodes = nodes.map(n => ({
      x: (n.x - centroid[0]) * SCALE_FACTOR,
      y: (n.y - centroid[1]) * SCALE_FACTOR,
      z: (n.z - centroid[2]) * SCALE_FACTOR
    }))
    
    const xs = centeredScaledNodes.map(n => n.x)
    const ys = centeredScaledNodes.map(n => n.y)
    const zs = centeredScaledNodes.map(n => n.z)
    
    const width = Math.max(...xs) - Math.min(...xs)
    const height = Math.max(...ys) - Math.min(...ys)
    const depth = Math.max(...zs) - Math.min(...zs)
    const maxDim = Math.max(width, height, depth)
    
    // Camera distance should be about 1.5x the maximum dimension
    const cameraDistance = Math.max(maxDim * 1.5, 100)
    
    return {
      maxDistance: cameraDistance
    }
  }, [nodes, centroid, SCALE_FACTOR])
  
  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: 'white'
      }}>
        <p>No nodes to display</p>
      </div>
    )
  }

  // Position camera to view the entire galaxy, centered at [0,0,0]
  const cameraDistance = maxDistance * 0.7
  const cameraPosition = [cameraDistance, cameraDistance, cameraDistance]

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 75 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
    >
      {/* Deep space starfield background */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0.5}
        fade
        speed={0.5}
      />
      
      {/* Enhanced lighting for sci-fi feel - centered at [0,0,0] */}
      <ambientLight intensity={0.3} />
      <pointLight position={[200, 200, 200]} intensity={1.5} color="#4A90E2" />
      <pointLight position={[-200, -200, -200]} intensity={0.8} color="#FF3366" />
      <directionalLight position={[0, 200, 0]} intensity={0.5} />
      
      {/* Cinematic camera controls with auto-rotation - looking at [0,0,0] */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={maxDistance * 0.3}
        maxDistance={maxDistance * 3}
        target={[0, 0, 0]}
        autoRotate={selectedNodeId === null}
        autoRotateSpeed={0.5}
        enableZoom={true}
        enablePan={true}
      />
      
      {/* Camera animation controller */}
      <CameraController 
        selectedNodeId={selectedNodeId} 
        nodes={nodes} 
        scale={SCALE_FACTOR} 
        centroid={centroid}
        controlsRef={controlsRef}
      />
      
      {/* Constellations - connecting nearby nodes */}
      <Constellations nodes={nodes} maxDistance={1.5} scale={SCALE_FACTOR} centroid={centroid} />
      
      {/* Render glowing star nodes */}
      {nodes.map((node) => (
        <Node key={node.id} node={node} onClick={onNodeClick} scale={SCALE_FACTOR} centroid={centroid} />
      ))}
    </Canvas>
  )
}
