import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface AnimatedRaysProps {
  className?: string;
  intensity?: number;
  speed?: number;
  color1?: string;
  color2?: string;
}

const AnimatedRays: React.FC<AnimatedRaysProps> = ({
  className = '',
  intensity = 0.3,
  speed = 0.5,
  color1 = '#22DFDC',
  color2 = '#22EDB6'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const frameIdRef = useRef<number>();

  // Convert hex colors to RGB
  const [color1RGB, color2RGB] = useMemo(() => {
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      ] : [1, 1, 1];
    };
    return [hexToRgb(color1), hexToRgb(color2)];
  }, [color1, color2]);

  // Vertex shader
  const vertexShader = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Fragment shader for downward streaming rays
  const fragmentShader = `
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform float u_intensity;

    // Simple noise function
    float noise(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      
      // Create vertical columns of light coming down from the top
      float x = st.x;
      float y = st.y;
      
      // Create multiple vertical ray columns
      float rays = 0.0;
      
      // Main vertical ray beams - create several columns across the width
      for(int i = 0; i < 8; i++) {
        float columnPos = float(i) / 7.0; // Position from 0 to 1 across width
        float columnWidth = 0.08; // Width of each ray column
        
        // Distance from current pixel to the ray column center
        float distFromColumn = abs(x - columnPos);
        
        // Create a soft falloff for the ray column
        if(distFromColumn < columnWidth) {
          float intensity = smoothstep(columnWidth, 0.0, distFromColumn);
          
          // Add animated movement within the column
          float wave = sin(y * 15.0 - u_time * 3.0 + float(i) * 2.0) * 0.3 + 0.7;
          float movement = sin(y * 8.0 - u_time * 2.0 + float(i) * 1.5) * 0.2 + 0.8;
          
          rays += intensity * wave * movement;
        }
      }
      
      // Add some organic noise for more natural movement
      float n = noise(vec2(x * 12.0, y * 4.0 - u_time * 0.8));
      rays += n * 0.1;
      
      // Fade out towards the bottom and strengthen at the top
      float verticalFade = smoothstep(0.0, 0.8, 1.0 - y); // Stronger at top, weaker at bottom
      
      // Subtle side fading to make it less harsh at edges
      float sideFade = smoothstep(0.0, 0.1, x) * smoothstep(1.0, 0.9, x);
      
      // Combine everything
      float finalIntensity = rays * verticalFade * sideFade * u_intensity;
      
      // Mix colors based on vertical position (top to bottom gradient)
      vec3 color = mix(u_color1, u_color2, y);
      
      gl_FragColor = vec4(color, finalIntensity);
    }
  `;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 1;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create geometry and material
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_resolution: { value: [container.clientWidth, container.clientHeight] },
        u_time: { value: 0 },
        u_color1: { value: new THREE.Vector3(...color1RGB) },
        u_color2: { value: new THREE.Vector3(...color2RGB) },
        u_intensity: { value: intensity },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    meshRef.current = mesh;

    // Animation loop
    let startTime = Date.now();
    const animate = () => {
      const elapsedTime = (Date.now() - startTime) * 0.001 * speed;
      
      if (mesh.material instanceof THREE.ShaderMaterial) {
        mesh.material.uniforms.u_time.value = elapsedTime;
      }

      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      
      if (mesh.material instanceof THREE.ShaderMaterial) {
        mesh.material.uniforms.u_resolution.value = [width, height];
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      geometry.dispose();
      material.dispose();
    };
  }, [color1RGB, color2RGB, intensity, speed]);

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};

export default AnimatedRays;