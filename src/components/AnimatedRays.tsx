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
      
      // Position the ray source way above the screen so only downward rays are visible  
      vec2 raySource = vec2(0.6, 4.0); // Slightly right of center horizontally, much higher above screen
      
      // Calculate direction from ray source to current pixel
      vec2 direction = st - raySource;
      float distance = length(direction);
      
      // Normalize direction for angle calculation
      vec2 normalizedDir = normalize(direction);
      
      // Calculate angle for ray pattern
      float angle = atan(normalizedDir.x, normalizedDir.y);
      
      // Create multiple ray beams streaming downward
      float rays = 0.0;
      
      // Main ray pattern - create distinct beams
      rays += sin(angle * 16.0 + u_time * 1.2) * 0.5 + 0.5;
      rays *= sin(angle * 8.0 + u_time * 0.9) * 0.4 + 0.6;
      
      // Secondary ray pattern for more distinct beams
      rays += sin(angle * 32.0 - u_time * 1.8) * 0.3 + 0.7;
      
      // Add animated noise for organic movement
      float n = noise(st * 6.0 + u_time * 0.3);
      rays += n * 0.1;
      
      // Create falloff based on distance from ray source
      float falloff = 1.0 / (1.0 + distance * distance * 0.3);
      
      // Strong fade at screen edges to create distinct beams
      float edgeFade = smoothstep(0.0, 0.15, st.x) * smoothstep(1.0, 0.85, st.x);
      
      // Fade towards bottom for natural light falloff
      float bottomFade = smoothstep(0.0, 0.4, st.y);
      
      // Only show rays that are pointing downward (bottom half of the radial pattern)
      float downwardMask = smoothstep(0.3, 0.7, st.y);
      
      // Combine everything
      float finalIntensity = rays * falloff * edgeFade * bottomFade * downwardMask * u_intensity;
      
      // Mix colors based on distance from source (creates depth)
      vec3 color = mix(u_color1, u_color2, distance * 0.3);
      
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

    // Create geometry and material - much bigger scale
    const geometry = new THREE.PlaneGeometry(6, 6);
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