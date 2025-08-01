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

  // Create the scene and set a black space-like background
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Set up a camera. A perspective camera with a medium field of view
  // gives depth to the composition. Position it so that the entire tree
  // fits within view.
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 2.5, 5);

  // Add a gentle ambient light so the tree is visible without harsh shadows.
  const ambient = new THREE.AmbientLight(0x406e5c, 1.2);
  scene.add(ambient);

  // Create the fractal tree as a group. We'll animate this group's scale
  // over time and based on cursor proximity to the "get started" button
  const treeGroup = new THREE.Group();
  scene.add(treeGroup);

  // Define a material with emissive properties to make the tree glow. The
  // emissive term makes the branches appear luminous against the dark
  // background, tying into the concept of life and transformation.
  const branchMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x34e7a8),
    emissive: new THREE.Color(0x1fae6b),
    metalness: 0.1,
    roughness: 0.5,
  });

  // Track tree depth based on cursor proximity to button
  let currentTreeDepth = 1;
  let targetTreeDepth = 1;

  // Function to rebuild tree with specified depth
  function rebuildTree(depth) {
    // Clear existing tree
    while (treeGroup.children.length > 0) {
      const child = treeGroup.children[0];
      treeGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }
    
    // Build new tree with specified depth
    addBranch(treeGroup, depth, 1, 0.1, branchMaterial);
  }

  // Build initial tree with minimal depth
  rebuildTree(1);

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
    
    // Random position around the tree
    const x = (Math.random() - 0.5) * 8;
    const y = Math.random() * 5;
    const z = (Math.random() - 0.5) * 8;
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

  // Set up the renderer. Use a high pixel ratio for crisp rendering on
  // high‑DPI displays. Append the renderer's canvas to the container.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // Track mouse movement for interactive rotation and button proximity
  let mouseX = 0;
  let mouseY = 0;
  let buttonProximity = 0;

  function handleMouseMove(event) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    mouseX = (x / width) * 2 - 1;
    mouseY = (y / height) * 2 - 1;

    // Find the "get started" button and calculate distance
    const button = document.querySelector('[data-testid="get-started-button"]') || 
                   document.querySelector('button:has-text("Get started free")') ||
                   document.querySelector('button');
    
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      const buttonCenterY = buttonRect.top + buttonRect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(event.clientX - buttonCenterX, 2) + 
        Math.pow(event.clientY - buttonCenterY, 2)
      );
      
      // Convert distance to proximity (closer = higher value)
      const maxDistance = 300; // pixels
      buttonProximity = Math.max(0, 1 - (distance / maxDistance));
      
      // Determine target tree depth based on proximity
      if (buttonProximity > 0.8) {
        targetTreeDepth = 6;
      } else if (buttonProximity > 0.6) {
        targetTreeDepth = 5;
      } else if (buttonProximity > 0.4) {
        targetTreeDepth = 4;
      } else if (buttonProximity > 0.2) {
        targetTreeDepth = 3;
      } else if (buttonProximity > 0.1) {
        targetTreeDepth = 2;
      } else {
        targetTreeDepth = 1;
      }
    }
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

  // Animate growth by gradually scaling the tree group up to its full size.
  let growth = 0.0;
  const maxGrowth = 1.0;
  // Store the start time to create smooth motion
  const startTime = Date.now();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = (Date.now() - startTime) / 1000;
    
    // Ease out growth: start quickly then slow as it approaches full size
    growth = Math.min(maxGrowth, 1 - Math.exp(-2 * elapsed));
    
    // Smoothly transition tree depth based on button proximity
    if (currentTreeDepth !== targetTreeDepth) {
      const depthDiff = targetTreeDepth - currentTreeDepth;
      if (Math.abs(depthDiff) > 0) {
        currentTreeDepth = targetTreeDepth;
        rebuildTree(currentTreeDepth);
      }
    }
    
    // Scale tree based on both time and proximity
    const proximityScale = 0.7 + (buttonProximity * 0.5); // Scale from 0.7 to 1.2
    treeGroup.scale.set(growth * proximityScale, growth * proximityScale, growth * proximityScale);

    // Use mouse movement to gently tilt the tree. Multipliers control
    // sensitivity. Limit the rotation so it remains subtle.
    treeGroup.rotation.x = THREE.MathUtils.clamp(mouseY * 0.3, -0.5, 0.5);
    treeGroup.rotation.z = THREE.MathUtils.clamp(-mouseX * 0.3, -0.5, 0.5);

    // Slowly rotate the entire tree about its vertical axis for added
    // motion independent of the cursor.
    treeGroup.rotation.y += 0.003;

    // Animate the glowing motes
    motes.forEach((mote, index) => {
      const time = elapsed + mote.phase;
      
      // Gentle floating motion
      mote.mesh.position.x = mote.originalPosition.x + Math.sin(time * 0.5) * 0.3;
      mote.mesh.position.y = mote.originalPosition.y + Math.sin(time * 0.3) * 0.2;
      mote.mesh.position.z = mote.originalPosition.z + Math.cos(time * 0.4) * 0.3;
      
      // Pulsing glow effect
      const pulseIntensity = 0.8 + Math.sin(time * 2) * 0.2;
      mote.mesh.material.opacity = pulseIntensity;
      
      // Make motes more active when cursor is near button
      if (buttonProximity > 0.5) {
        mote.mesh.position.y += Math.sin(time * 3) * 0.1 * buttonProximity;
      }
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