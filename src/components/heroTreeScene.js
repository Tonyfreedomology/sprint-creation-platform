/*
 * Enhanced Hero Tree Scene
 * 
 * An immersive 3D forest ecosystem with organic growth, interactive effects,
 * floating icons, cosmic background, and stunning lighting effects.
 */

import * as THREE from 'three';

// Icon shapes for floating particles
const iconShapes = {
  heart: '❤️',
  brain: '🧠', 
  lightning: '⚡',
  star: '⭐',
  growth: '🌱'
};

/**
 * Create a curved, organic branch using spline curves
 */
function createOrganicBranch(startPos, endPos, radius, segments = 20) {
  const curve = new THREE.CatmullRomCurve3([
    startPos,
    new THREE.Vector3(
      startPos.x + (endPos.x - startPos.x) * 0.3 + (Math.random() - 0.5) * 0.2,
      startPos.y + (endPos.y - startPos.y) * 0.3,
      startPos.z + (endPos.z - startPos.z) * 0.3 + (Math.random() - 0.5) * 0.2
    ),
    new THREE.Vector3(
      startPos.x + (endPos.x - startPos.x) * 0.7 + (Math.random() - 0.5) * 0.2,
      startPos.y + (endPos.y - startPos.y) * 0.7,
      startPos.z + (endPos.z - startPos.z) * 0.7 + (Math.random() - 0.5) * 0.2
    ),
    endPos
  ]);

  const geometry = new THREE.TubeGeometry(curve, segments, radius, 8, false);
  return { geometry, curve };
}

/**
 * Recursively build an organic tree with flowing, curved branches
 */
function addOrganicBranch(parent, depth, startPos, length, radius, material, glowMaterial, allBranches) {
  if (depth <= 0) return;

  const branchCount = depth > 3 ? 2 : Math.floor(Math.random() * 3) + 2;
  
  for (let i = 0; i < branchCount; i++) {
    const angle = (i / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const upwardBias = 0.3 + depth * 0.1;
    
    const endPos = new THREE.Vector3(
      startPos.x + Math.cos(angle) * length * 0.7,
      startPos.y + length * upwardBias,
      startPos.z + Math.sin(angle) * length * 0.7
    );

    const { geometry, curve } = createOrganicBranch(startPos, endPos, radius);
    
    // Create gradient material based on height
    const heightFactor = (startPos.y + length) / 4; // Normalize height
    const branchMaterial = material.clone();
    branchMaterial.color = new THREE.Color().lerpColors(
      new THREE.Color(0x1a4d3a), // Deep emerald
      new THREE.Color(0x22EDB6), // Bright mint
      Math.min(heightFactor, 1)
    );
    branchMaterial.emissive = new THREE.Color().lerpColors(
      new THREE.Color(0x0d2818),
      new THREE.Color(0x1fae6b),
      Math.min(heightFactor, 1)
    );

    const branchMesh = new THREE.Mesh(geometry, branchMaterial);
    parent.add(branchMesh);

    // Store branch info for interaction
    allBranches.push({
      mesh: branchMesh,
      curve: curve,
      endPos: endPos,
      depth: depth,
      originalScale: 1
    });

    // Add flowing light particles along the branch
    createFlowingLights(branchMesh, curve, glowMaterial);

    // Recursive branches
    const childLength = length * (0.6 + Math.random() * 0.2);
    const childRadius = radius * 0.7;
    addOrganicBranch(parent, depth - 1, endPos, childLength, childRadius, material, glowMaterial, allBranches);
  }
}

/**
 * Create flowing light particles along branch curves
 */
function createFlowingLights(branchMesh, curve, glowMaterial) {
  const lightCount = 8 + Math.floor(Math.random() * 12);
  const lights = [];
  
  for (let i = 0; i < lightCount; i++) {
    const lightGeometry = new THREE.SphereGeometry(0.01, 8, 8);
    const lightMesh = new THREE.Mesh(lightGeometry, glowMaterial);
    
    const t = Math.random();
    const point = curve.getPoint(t);
    lightMesh.position.copy(point);
    
    branchMesh.add(lightMesh);
    lights.push({
      mesh: lightMesh,
      progress: t,
      speed: 0.002 + Math.random() * 0.003
    });
  }
  
  branchMesh.userData.flowingLights = lights;
}

/**
 * Create floating icon particles
 */
function createFloatingIcons(scene) {
  const icons = [];
  const iconGeometry = new THREE.PlaneGeometry(0.2, 0.2);
  
  Object.keys(iconShapes).forEach(iconType => {
    for (let i = 0; i < 3; i++) {
      // Create canvas texture for icon
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#22EDB6';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconShapes[iconType], 32, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.8
      });
      
      const iconMesh = new THREE.Mesh(iconGeometry, material);
      iconMesh.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 2,
        (Math.random() - 0.5) * 8
      );
      
      scene.add(iconMesh);
      icons.push({
        mesh: iconMesh,
        velocity: new THREE.Vector3(0, 0.01 + Math.random() * 0.02, 0),
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 50
      });
    }
  });
  
  return icons;
}

/**
 * Create shooting stars system
 */
function createShootingStars(scene) {
  const stars = [];
  
  for (let i = 0; i < 50; i++) {
    const starGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const starMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.5 + Math.random() * 0.3, 0.8, 0.9),
      transparent: true,
      opacity: 0.8
    });
    
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.set(
      (Math.random() - 0.5) * 20,
      Math.random() * 10 + 5,
      (Math.random() - 0.5) * 20
    );
    
    scene.add(star);
    stars.push({
      mesh: star,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        -Math.random() * 0.05,
        (Math.random() - 0.5) * 0.1
      ),
      trail: []
    });
  }
  
  return stars;
}

/**
 * Initialize the enhanced hero scene
 */
export function initHeroScene(container) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Scene setup with cosmic gradient background
  const scene = new THREE.Scene();
  
  // Create cosmic gradient background
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, '#1a0d2e');
  gradient.addColorStop(0.3, '#16213e');
  gradient.addColorStop(0.6, '#0f3460');
  gradient.addColorStop(1, '#031a13');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  const bgTexture = new THREE.CanvasTexture(canvas);
  scene.background = bgTexture;

  // Enhanced camera with slight film-like effect
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 3, 6);

  // Multiple light sources for dramatic effect
  const ambientLight = new THREE.AmbientLight(0x2a4d3a, 0.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0x22EDB6, 1.5);
  mainLight.position.set(5, 10, 5);
  mainLight.castShadow = true;
  scene.add(mainLight);

  const rimLight = new THREE.DirectionalLight(0x8fbc8f, 0.8);
  rimLight.position.set(-5, 3, -5);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x40e0d0, 0.6, 10);
  fillLight.position.set(0, 5, 0);
  scene.add(fillLight);

  // Forest group
  const forestGroup = new THREE.Group();
  scene.add(forestGroup);

  // Enhanced materials
  const branchMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x2d5a3d),
    emissive: new THREE.Color(0x1a3d2b),
    metalness: 0.1,
    roughness: 0.3,
    transparent: true,
    opacity: 0.9
  });

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x22EDB6),
    transparent: true,
    opacity: 0.8
  });

  // Store all branches for interaction
  const allBranches = [];

  // Create multiple organic trees
  for (let i = 0; i < 5; i++) {
    const treeGroup = new THREE.Group();
    const angle = (i / 5) * Math.PI * 2;
    const radius = 1 + Math.random() * 2;
    
    treeGroup.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    
    forestGroup.add(treeGroup);
    
    const startPos = new THREE.Vector3(0, 0, 0);
    addOrganicBranch(treeGroup, 6, startPos, 1.2, 0.08, branchMaterial, glowMaterial, allBranches);
  }

  // Create floating icons
  const floatingIcons = createFloatingIcons(scene);

  // Create shooting stars
  const shootingStars = createShootingStars(scene);

  // Renderer with enhanced settings
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Mouse interaction variables
  let mouseX = 0;
  let mouseY = 0;
  let mouseVelocity = new THREE.Vector2(0, 0);
  let lastMouseTime = Date.now();

  function handleMouseMove(event) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newMouseX = (x / width) * 2 - 1;
    const newMouseY = (y / height) * 2 - 1;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastMouseTime;
    
    if (deltaTime > 0) {
      mouseVelocity.x = (newMouseX - mouseX) / deltaTime * 1000;
      mouseVelocity.y = (newMouseY - mouseY) / deltaTime * 1000;
    }
    
    mouseX = newMouseX;
    mouseY = newMouseY;
    lastMouseTime = currentTime;
  }

  // Touch/device orientation for mobile
  function handleDeviceOrientation(event) {
    if (event.gamma !== null && event.beta !== null) {
      mouseX = THREE.MathUtils.clamp(event.gamma / 45, -1, 1);
      mouseY = THREE.MathUtils.clamp(event.beta / 45, -1, 1);
    }
  }

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('deviceorientation', handleDeviceOrientation);

  // Window resize handler
  function handleResize() {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  }
  window.addEventListener('resize', handleResize);

  // Animation variables
  let growth = 0.0;
  const startTime = Date.now();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = (Date.now() - startTime) / 1000;
    const deltaTime = 0.016; // Assume 60fps

    // Organic growth animation
    growth = Math.min(1.0, 1 - Math.exp(-1.5 * elapsed));
    forestGroup.scale.set(growth, growth, growth);

    // Dynamic forest movement based on mouse
    const forestTilt = 0.2;
    forestGroup.rotation.x = THREE.MathUtils.lerp(
      forestGroup.rotation.x,
      mouseY * forestTilt,
      0.02
    );
    forestGroup.rotation.z = THREE.MathUtils.lerp(
      forestGroup.rotation.z,
      -mouseX * forestTilt,
      0.02
    );

    // Gentle base rotation
    forestGroup.rotation.y += 0.002;

    // Update flowing lights on branches
    allBranches.forEach(branch => {
      if (branch.mesh.userData.flowingLights) {
        branch.mesh.userData.flowingLights.forEach(light => {
          light.progress += light.speed;
          if (light.progress > 1) light.progress = 0;
          
          const point = branch.curve.getPoint(light.progress);
          light.mesh.position.copy(point);
          
          // Pulse effect
          const pulse = Math.sin(elapsed * 3 + light.progress * 10) * 0.5 + 0.5;
          light.mesh.scale.setScalar(0.5 + pulse * 0.5);
        });
      }
    });

    // Update floating icons
    floatingIcons.forEach(icon => {
      icon.mesh.position.add(icon.velocity);
      icon.life += 1;
      
      // Fade out over time
      const fadeStart = icon.maxLife * 0.7;
      if (icon.life > fadeStart) {
        const fadeProgress = (icon.life - fadeStart) / (icon.maxLife - fadeStart);
        icon.mesh.material.opacity = 0.8 * (1 - fadeProgress);
      }
      
      // Reset when life expires
      if (icon.life > icon.maxLife) {
        icon.mesh.position.set(
          (Math.random() - 0.5) * 8,
          -2,
          (Math.random() - 0.5) * 8
        );
        icon.life = 0;
        icon.mesh.material.opacity = 0.8;
      }
      
      // Gentle floating motion
      icon.mesh.rotation.z += 0.01;
    });

    // Update shooting stars
    shootingStars.forEach(star => {
      star.mesh.position.add(star.velocity);
      
      // Reset when out of bounds
      if (star.mesh.position.y < -5) {
        star.mesh.position.set(
          (Math.random() - 0.5) * 20,
          Math.random() * 5 + 10,
          (Math.random() - 0.5) * 20
        );
      }
      
      // Sparkle effect
      const sparkle = Math.sin(elapsed * 10 + star.mesh.position.x * 100) * 0.3 + 0.7;
      star.mesh.material.opacity = sparkle;
    });

    // Dynamic lighting effects
    fillLight.intensity = 0.6 + Math.sin(elapsed * 0.5) * 0.2;
    fillLight.color.setHSL(0.5 + Math.sin(elapsed * 0.3) * 0.1, 0.8, 0.7);

    // Mouse velocity particle effects
    const velocityMagnitude = mouseVelocity.length();
    if (velocityMagnitude > 2) {
      // Create particle burst effect (could add actual particles here)
      allBranches.forEach(branch => {
        const scalePulse = 1 + velocityMagnitude * 0.01;
        branch.mesh.scale.setScalar(
          THREE.MathUtils.lerp(branch.mesh.scale.x, scalePulse, 0.1)
        );
      });
    } else {
      // Return to normal scale
      allBranches.forEach(branch => {
        branch.mesh.scale.setScalar(
          THREE.MathUtils.lerp(branch.mesh.scale.x, 1, 0.05)
        );
      });
    }

    // Decay mouse velocity
    mouseVelocity.multiplyScalar(0.95);

    renderer.render(scene, camera);
  }
  animate();

  // Cleanup function
  return function cleanup() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('deviceorientation', handleDeviceOrientation);
    window.removeEventListener('resize', handleResize);
    
    // Dispose of all geometries and materials
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    renderer.dispose();
    
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}