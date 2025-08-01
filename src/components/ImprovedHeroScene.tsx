import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// Number of chevron instances in the spiral
const COUNT = 60;

// Component responsible for the spiral of arrows
function Spiral({ colour = '#22EDB6' }) {
  // Reference to the InstancedMesh so we can update matrices each frame
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  // Preallocate an Object3D to avoid creating garbage on each frame
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Build the V shape once using a simple ExtrudeGeometry.  The
  // geometry is centred so we can rotate it easily later on.
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.5, 1);
    shape.lineTo(1, 0);
    shape.lineTo(0, 0);
    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: 0.2,
      bevelEnabled: false
    });
    extrude.computeBoundingBox();
    // centre the geometry
    const offset = new THREE.Vector3();
    if (extrude.boundingBox) {
      extrude.boundingBox.getCenter(offset).negate();
      extrude.translate(offset.x, offset.y, offset.z);
    }
    return extrude;
  }, []);

  // Animation loop updates the position and orientation of each instance
  useFrame(({ clock, pointer }) => {
    if (!instancedRef.current) return;
    
    const t = clock.getElapsedTime();
    // Use pointer.x to gently rotate the whole spiral based on mouse
    const globalRotation = pointer.x * 0.5;
    for (let i = 0; i < COUNT; i++) {
      const progress = i / COUNT;
      // Spiral parameters.  We wrap four full turns over the height
      const angle = progress * Math.PI * 8 + t * 0.3;
      const radius = 2 + 0.5 * Math.sin(progress * Math.PI * 4 + t);
      const y = (progress - 0.5) * 6;
      dummy.position.set(
        Math.cos(angle + globalRotation) * radius,
        y,
        Math.sin(angle + globalRotation) * radius
      );
      // Orient the arrows so that they point along the spiral
      dummy.rotation.set(0, angle + globalRotation + Math.PI / 2, 0);
      // Scale down towards the top to give a tapering effect
      const scale = 0.3 + 0.7 * (1 - progress);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instancedRef} args={[geometry, undefined, COUNT]}>
      <meshStandardMaterial color={colour} roughness={0.3} metalness={0.1} />
    </instancedMesh>
  );
}

// A lightweight particle system using InstancedMesh.  Each particle
// drifts slowly upwards and wraps back when it reaches the top.
function FloatingParticles({ count = 150, radius = 5, height = 6 }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Precompute random offsets for each particle
  const offsets = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push([
        (Math.random() - 0.5) * radius * 2,
        Math.random() * height - height / 2,
        (Math.random() - 0.5) * radius * 2,
        Math.random() * 0.005 + 0.002 // speed
      ]);
    }
    return arr;
  }, [count, radius, height]);

  // Simple sphere geometry reused by all particles
  const geometry = useMemo(() => new THREE.SphereGeometry(0.03, 8, 8), []);

  useFrame(() => {
    if (!ref.current) return;
    
    for (let i = 0; i < count; i++) {
      const [x, y0, z, speed] = offsets[i];
      // Move the particle upwards; wrap around when it leaves the top
      let y = y0 + (Date.now() * speed) % height - height / 2;
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]}>
      <meshBasicMaterial color="#22dfdc" />
    </instancedMesh>
  );
}

// Main scene containing lighting, the spiral and post-processing
export function ImprovedHeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 45 }}
      dpr={[1, 1.5]}
      // Only update the canvas when the scene changes; this saves
      // resources when the hero is off screen
      frameloop="demand"
      // Set a dark base colour to match the marketing site
      gl={{ antialias: true, alpha: false }}
    >
      {/* Background gradient using a large radial spread */}
      <color attach="background" args={['#01070a']} />
      {/* Soft ambient light and a high key point light */}
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 10, 5]} intensity={1.5} color={'#22dfdc'} />
      {/* Spiral of V shaped arrows */}
      <Spiral colour="#22EDB6" />
      {/* A handful of floating particles using Instanced geometry */}
      <FloatingParticles />
      {/* Optional environment map to add reflections on the arrows */}
      <Environment preset="city" />
      {/* Bloom effect to give the arrows a glowing halo */}
      <EffectComposer multisampling={2}>
        <Bloom 
          intensity={0.6} 
          luminanceThreshold={0.15} 
          luminanceSmoothing={0.9} 
        />
      </EffectComposer>
    </Canvas>
  );
}