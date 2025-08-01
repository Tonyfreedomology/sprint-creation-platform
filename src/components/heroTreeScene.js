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

  // Create the cylinder geometry for this segment with more detail
  const geometry = new THREE.CylinderGeometry(radius * 0.3, radius, length, 12);
  const branchMesh = new THREE.Mesh(geometry, material);

  // Position the mesh so that its base sits at the parent's origin and
  // its top extends upward along the y-axis.
  branchMesh.position.y = length / 2;
  parent.add(branchMesh);

  // Create more organic branching with varied parameters
  const childLength = length * (0.65 + Math.random() * 0.1); // Add some variation
  const childRadius = radius * (0.6 + Math.random() * 0.1);

  // Create 2-4 child branches for more organic look
  const numChildren = depth > 3 ? 2 + Math.floor(Math.random() * 2) : 2;
  
  for (let i = 0; i < numChildren; i++) {
    const child = new THREE.Group();
    child.position.y = length;
    
    // More varied angles for organic branching
    const angleStep = (Math.PI * 2) / numChildren;
    const angle = angleStep * i + (Math.random() - 0.5) * 0.5;
    const tilt = -10 - Math.random() * 20; // Random tilt between -10 and -30 degrees
    
    child.rotation.set(
      THREE.MathUtils.degToRad(tilt), 
      angle, 
      THREE.MathUtils.degToRad((Math.random() - 0.5) * 20)
    );
    
    branchMesh.add(child);
    addBranch(child, depth - 1, childLength, childRadius, material);
  }
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
  treeGroup.position.set(2.5, 0, 0); // Move tree back a bit to the left
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

  // Build a beautiful, fully grown tree from the start
  addBranch(treeGroup, 6, 1.2, 0.12, branchMaterial);

  // Create glowing spherical motes instead of points
  const moteCount = 150;
  const motes = [];
  
  for (let i = 0; i < moteCount; i++) {
    const moteGeometry = new THREE.SphereGeometry(0.02, 8, 6);
    const moteMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x29c991),
      transparent: true,
      opacity: 0.8
    });
    
    const mote = new THREE.Mesh(moteGeometry, moteMaterial);
    
    // Position particles around the tree
    const x = (Math.random() - 0.2) * 3 + 2; // Cluster around new tree position
    const y = Math.random() * 5;
    const z = (Math.random() - 0.5) * 3;
    mote.position.set(x, y, z);
    
    // Add glow effect with a point light
    const glowLight = new THREE.PointLight(0x29c991, 0.3, 2);
    mote.add(glowLight);
    
    scene.add(mote);
    motes.push({
      mesh: mote,
      originalPosition: { x, y, z },
      phase: Math.random() * Math.PI * 2
    });
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

    // Gentle swaying based on mouse movement
    treeGroup.rotation.x = THREE.MathUtils.clamp(mouseY * 0.2, -0.3, 0.3);
    treeGroup.rotation.z = THREE.MathUtils.clamp(-mouseX * 0.2, -0.3, 0.3);

    // Subtle automatic rotation for life-like movement
    treeGroup.rotation.y += 0.002;

    // Animate the glowing motes with more organic movement
    motes.forEach((mote, index) => {
      const time = elapsed + mote.phase;
      
      // More organic floating motion
      mote.mesh.position.x = mote.originalPosition.x + Math.sin(time * 0.4) * 0.4;
      mote.mesh.position.y = mote.originalPosition.y + Math.sin(time * 0.2) * 0.3;
      mote.mesh.position.z = mote.originalPosition.z + Math.cos(time * 0.3) * 0.4;
      
      // Gentle pulsing glow effect
      const pulseIntensity = 0.7 + Math.sin(time * 1.5) * 0.3;
      mote.mesh.material.opacity = pulseIntensity;
    });

    renderer.render(scene, camera);
  }
  animate();

  // Return a clean‑up function to remove event listeners and dispose of
  // resources when the component is unmounted.
  return function cleanup() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', handleResize);
    
    // Dispose mote geometries and materials
    motes.forEach(mote => {
      if (mote.mesh.geometry) mote.mesh.geometry.dispose();
      if (mote.mesh.material) mote.mesh.material.dispose();
    });
    
    // Dispose tree materials
    branchMaterial.dispose();
    renderer.dispose();
    
    // Remove the canvas from the container
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}