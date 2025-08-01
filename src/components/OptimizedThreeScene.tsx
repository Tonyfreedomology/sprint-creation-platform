import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

// Heavily optimized Three.js version with merged geometry
function OptimizedTree() {
  const treeRef = useRef<THREE.Group>(null);
  
  // Create tree as single merged geometry instead of multiple meshes
  const treeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];
    let vertexIndex = 0;

    // Function to add a cylinder to the merged geometry
    const addCylinder = (startX: number, startY: number, startZ: number, 
                        endX: number, endY: number, endZ: number, 
                        radiusStart: number, radiusEnd: number) => {
      const segments = 6; // Reduced segments for performance
      const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2 + (endZ - startZ) ** 2);
      
      // Create simple cylinder vertices
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        
        // Bottom circle
        positions.push(
          startX + Math.cos(angle) * radiusStart,
          startY,
          startZ + Math.sin(angle) * radiusStart
        );
        
        // Top circle  
        positions.push(
          endX + Math.cos(angle) * radiusEnd,
          endY,
          endZ + Math.sin(angle) * radiusEnd
        );
        
        // Create triangles
        if (i < segments) {
          const base = vertexIndex;
          // Side faces
          indices.push(base, base + 2, base + 1);
          indices.push(base + 1, base + 2, base + 3);
        }
        vertexIndex += 2;
      }
    };

    // Build tree structure with merged geometry
    addCylinder(0, 0, 0, 0, 1, 0, 0.1, 0.08); // trunk
    addCylinder(0, 1, 0, -0.3, 1.7, 0, 0.08, 0.05); // left branch
    addCylinder(0, 1, 0, 0.3, 1.7, 0, 0.08, 0.05); // right branch
    addCylinder(-0.3, 1.7, 0, -0.5, 2.2, 0, 0.05, 0.03); // left sub-branch
    addCylinder(-0.3, 1.7, 0, -0.1, 2.2, 0, 0.05, 0.03); // left sub-branch 2
    addCylinder(0.3, 1.7, 0, 0.1, 2.2, 0, 0.05, 0.03); // right sub-branch
    addCylinder(0.3, 1.7, 0, 0.5, 2.2, 0, 0.05, 0.03); // right sub-branch 2

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    
    return geometry;
  }, []);

  useFrame(({ clock, mouse }) => {
    if (!treeRef.current) return;
    
    // Minimal animation - only update when needed
    const t = clock.getElapsedTime();
    treeRef.current.rotation.x = mouse.y * 0.1;
    treeRef.current.rotation.z = -mouse.x * 0.1;
    
    // Gentle breathing effect
    const scale = 1 + Math.sin(t * 0.5) * 0.02;
    treeRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={treeRef} position={[1.5, 0, 0]}>
      <mesh geometry={treeGeometry}>
        <meshBasicMaterial 
          color="#34e7a8" 
          transparent 
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

// Ultra-efficient particle system with points instead of spheres
function OptimizedParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 30; // Reduced count
  
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4 + 1.5;
      positions[i * 3 + 1] = Math.random() * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = 0.005 + Math.random() * 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    return { positions, velocities };
  }, [count]);

  useFrame(() => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] += velocities[i * 3];
      positions[i * 3 + 1] += velocities[i * 3 + 1];
      positions[i * 3 + 2] += velocities[i * 3 + 2];
      
      // Wrap around
      if (positions[i * 3 + 1] > 4) {
        positions[i * 3 + 1] = 0;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#22dfdc" 
        size={0.05} 
        transparent 
        opacity={0.8}
      />
    </points>
  );
}

export const OptimizedThreeScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  // Intersection observer to pause when not visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`absolute inset-0 w-full h-full ${className}`}>
      {isVisible && (
        <Canvas
          camera={{ position: [0, 2, 4], fov: 45 }}
          dpr={[1, 1.5]} // Limit DPR for performance
          performance={{ min: 0.5 }} // Allow frame drops
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.6} />
          <OptimizedTree />
          <OptimizedParticles />
        </Canvas>
      )}
    </div>
  );
};