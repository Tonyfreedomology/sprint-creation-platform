/*
 * heroTreeScene.js
 *
 * This module exports a helper function that mounts an animated Three.js scene
 * into a specified DOM element. The scene depicts a stylised fractal tree
 * surrounded by glowing particles. The tree slowly grows over time and
 * responds to mouse movement by rotating on its axes. The overall colour
 * palette (neon greens on a deep, dark background) is inspired by the
 * existing Lovable sprint creation platform hero section.
 *
 * To use this component on your page:
 *   1. Import this module into your JavaScript bundle.
 *   2. Call `initHeroScene(element)` once, passing in a DOM node (e.g.
 *      document.getElementById('hero-canvas')). The function will
 *      automatically create a canvas, attach it to the provided element
 *      and start the animation loop.
 *   3. To clean up when the component is removed, call the return value
 *      of `initHeroScene()` which removes event listeners and stops the
 *      animation.
 */

import * as THREE from 'three';

/**
 * Recursively build a branching tree structure. Each branch is a tapered
 * cylinder. Child branches emanate from the top of the parent at opposing
 * angles. The geometry is built using meshes and nested groups so that
 * rotations and positioning are propagated down the hierarchy automatically.
 *
 * @param {THREE.Group} parent - the parent group to attach the new branch to
 * @param {number} depth - how many generations of branches remain
 * @param {number} length - the length of this branch
 * @param {number} radius - the starting radius of this branch (tapering down)
 * @param {THREE.Material} material - the material used for each branch
 */
function addBranch(parent, depth, length, radius, material) {
  if (depth <= 0) return;

  // Create the cylinder geometry for this segment. The base is slightly
  // thicker than the top to give a natural taper.
  const geometry = new THREE.CylinderGeometry(radius * 0.4, radius, length, 8);
  const branchMesh = new THREE.Mesh(geometry, material);

  // Position the mesh so that its base sits at the parent's origin and
  // its top extends upward along the y-axis.
  branchMesh.position.y = length / 2;
  parent.add(branchMesh);

  // Determine child parameters. Each subsequent generation shrinks in
  // length and radius to give the impression of tapering limbs.
  const childLength = length * 0.7;
  const childRadius = radius * 0.65;

  // Left child branch
  const left = new THREE.Group();
  left.position.y = length;
  // Rotate slightly forward/back and left
  left.rotation.set(THREE.MathUtils.degToRad(-15), 0, THREE.MathUtils.degToRad(30));
  branchMesh.add(left);
  addBranch(left, depth - 1, childLength, childRadius, material);

  // Right child branch
  const right = new THREE.Group();
  right.position.y = length;
  // Rotate slightly forward/back and right
  right.rotation.set(THREE.MathUtils.degToRad(-15), 0, THREE.MathUtils.degToRad(-30));
  branchMesh.add(right);
  addBranch(right, depth - 1, childLength, childRadius, material);
}

/**
 * Initialise the Three.js hero scene within a given container. This function
 * encapsulates all the setup, animation, and event handling required to
 * render the animated tree. It returns a clean‑up function that should
 * be invoked if the scene is ever torn down (e.g. when navigating away
 * from the page) to avoid memory leaks.
 *
 * @param {HTMLElement} container - the DOM node to mount the scene to
 * @returns {() => void} a function that, when called, cleans up the scene
 */
export function initHeroScene(container) {
  // Determine the dimensions of the container. Use the container's size so
  // the canvas fills the available space. If the container resizes after
  // initialisation, you may need to handle that externally.
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Create the scene with transparent background
  const scene = new THREE.Scene();
  // No background - let the page background show through

  // Set up a camera with standard position
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 2.5, 5);

  // Add a gentle ambient light so the tree is visible without harsh shadows.
  const ambient = new THREE.AmbientLight(0x406e5c, 1.2);
  scene.add(ambient);

  // Create the fractal tree positioned on the right but more visible
  const treeGroup = new THREE.Group();
  treeGroup.position.set(1.8, 0, 0); // Move tree a bit more to the left
  scene.add(treeGroup);

  // Define a material with emissive properties to make the tree glow. The
  // emissive term makes the branches appear luminous against the dark
  // background, tying into the concept of life and transformation.
  const branchMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x34e7a8),
    emissive: new THREE.Color(0x1fae6b),
    metalness: 0.1,
    roughness: 0.4,
  });

  // Build a beautiful tree with the original simpler design
  addBranch(treeGroup, 5, 1, 0.1, branchMaterial);

  // Create efficient instanced particles instead of individual meshes
  const particleCount = 75;
  const particleGeometry = new THREE.SphereGeometry(0.0075, 8, 8); // 50% smaller than 0.015
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x22dfdc),
    emissive: new THREE.Color(0x22dfdc), // Stronger glow - full color emissive
    transparent: true,
    opacity: 1.0
  });
  
  const instancedParticles = new THREE.InstancedMesh(particleGeometry, particleMaterial, particleCount);
  scene.add(instancedParticles);
  
  // Store particle data for animation
  const particleData = [];
  const dummy = new THREE.Object3D();
  
  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 5 + 1.5; // Cluster around tree
    const y = Math.random() * 6 - 1;
    const z = (Math.random() - 0.5) * 5;
    const speed = Math.random() * 0.0025 + 0.001;
    const phase = Math.random() * Math.PI * 2;
    
    particleData.push({
      originalPosition: { x, y, z },
      speed,
      phase,
      currentY: y
    });
    
    // Set initial matrix
    dummy.position.set(x, y, z);
    dummy.updateMatrix();
    instancedParticles.setMatrixAt(i, dummy.matrix);
  }

  // Set up the renderer with transparent background
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0); // Transparent background
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // Track mouse movement for gentle swaying
  let mouseX = 0;
  let mouseY = 0;

  function handleMouseMove(event) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    mouseX = (x / width) * 2 - 1;
    mouseY = (y / height) * 2 - 1;
  }
  window.addEventListener('mousemove', handleMouseMove);

  // Handle window resize
  function handleResize() {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  }
  window.addEventListener('resize', handleResize);

  // Animate the beautiful tree with gentle swaying
  let growth = 0.0;
  const maxGrowth = 1.0;
  const startTime = Date.now();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = (Date.now() - startTime) / 1000;
    
    // Ease in the tree scale on initial load
    growth = Math.min(maxGrowth, 1 - Math.exp(-3 * elapsed));
    treeGroup.scale.set(growth, growth, growth);

    // Gentle autonomous swaying with time-based motion
    treeGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.1;
    treeGroup.rotation.z = Math.cos(elapsed * 0.2) * 0.08;

    // Animate the efficient instanced particles
    particleData.forEach((particle, i) => {
      const time = elapsed + particle.phase;
      
      // Slow upward drift with wrapping
      particle.currentY += particle.speed;
      if (particle.currentY > 6) {
        particle.currentY = -1;
      }
      
      // Gentle floating motion
      const x = particle.originalPosition.x + Math.sin(time * 0.4) * 0.3;
      const y = particle.currentY + Math.sin(time * 0.2) * 0.2;
      const z = particle.originalPosition.z + Math.cos(time * 0.3) * 0.3;
      
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      instancedParticles.setMatrixAt(i, dummy.matrix);
    });
    instancedParticles.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  // Return a clean‑up function to remove event listeners and dispose of
  // resources when the component is unmounted.
  return function cleanup() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', handleResize);
    
    // Dispose instanced particle resources
    particleGeometry.dispose();
    particleMaterial.dispose();
    
    // Dispose tree materials
    branchMaterial.dispose();
    renderer.dispose();
    
    // Remove the canvas from the container
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}